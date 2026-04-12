-- ============================================================
-- Cashfree Payment Integration — Clean Migration
-- Apply in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================

-- ── 1. Fix purchases.status default ─────────────────────────────────────────
-- Original schema defaulted to 'completed' — a data integrity bug.
-- Every new row must start life as 'pending'.
ALTER TABLE purchases ALTER COLUMN status SET DEFAULT 'pending';

-- ── 2. Add missing columns ───────────────────────────────────────────────────
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT        UNIQUE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cashfree_session_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_provider  TEXT        DEFAULT 'cashfree';
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS platform_fee      NUMERIC(12, 2) DEFAULT 0;

-- ── 3. Indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_purchases_cf_order_id  ON purchases(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status        ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id      ON purchases(buyer_id);

-- Prevents two concurrent requests creating duplicate pending rows for the
-- same (buyer, product) pair. Race-safe — relied on by begin_purchase's
-- ON CONFLICT clause below.
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_pending_unique
  ON purchases(product_id, buyer_id)
  WHERE status = 'pending';

-- ── 4. updated_at trigger on purchases ──────────────────────────────────────
CREATE OR REPLACE FUNCTION set_purchases_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_purchases_updated_at ON purchases;
CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION set_purchases_updated_at();

-- ── 5. Drop old RPCs before redefining ──────────────────────────────────────
DROP FUNCTION IF EXISTS purchase_product(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_pending_purchase(UUID, UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS set_purchase_cashfree_ids(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS complete_purchase(UUID);
DROP FUNCTION IF EXISTS mark_purchase_failed(UUID);
DROP FUNCTION IF EXISTS get_my_purchases();

-- ── 6. begin_purchase ────────────────────────────────────────────────────────
-- Creates or reuses a pending purchase row. Idempotent on (product_id, buyer_id).
-- Stale pending rows (>24 h) are expired before the upsert so buyers always
-- get a fresh Cashfree session when they return the next day.
-- The partial unique index makes the INSERT ... ON CONFLICT race-safe.
CREATE OR REPLACE FUNCTION begin_purchase(
  p_product_id  UUID,
  p_buyer_id    UUID,
  p_buyer_name  TEXT,
  p_buyer_email TEXT
)
RETURNS TABLE (
  purchase_id   UUID,
  amount        NUMERIC,
  currency      TEXT,
  product_title TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product   RECORD;
  v_client_id UUID;
  v_purch_id  UUID;
BEGIN
  -- Validate product
  SELECT * INTO v_product
    FROM products
   WHERE id = p_product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Self-purchase guard
  IF v_product.creator_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own product';
  END IF;

  -- Duplicate purchase guard
  IF EXISTS (
    SELECT 1 FROM purchases
     WHERE product_id = p_product_id
       AND buyer_id   = p_buyer_id
       AND status     = 'completed'
  ) THEN
    RAISE EXCEPTION 'You already own this product';
  END IF;

  -- Expire stale pending rows so the buyer always gets a fresh Cashfree order
  UPDATE purchases
     SET status     = 'failed'
   WHERE product_id = p_product_id
     AND buyer_id   = p_buyer_id
     AND status     = 'pending'
     AND created_at < NOW() - INTERVAL '24 hours';

  -- Ensure a client CRM record exists for this buyer under the creator
  SELECT id INTO v_client_id
    FROM clients
   WHERE creator_id = v_product.creator_id
     AND email      = p_buyer_email;

  IF NOT FOUND THEN
    INSERT INTO clients (creator_id, name, email)
    VALUES (
      v_product.creator_id,
      COALESCE(p_buyer_name, split_part(COALESCE(p_buyer_email, ''), '@', 1), 'Anonymous'),
      p_buyer_email
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Upsert the pending purchase. ON CONFLICT reuses the existing pending row
  -- (created within the last 24 h) so a retry does not create orphan rows.
  INSERT INTO purchases (
    creator_id, client_id, product_id, buyer_id,
    amount, currency, status, payment_provider
  )
  VALUES (
    v_product.creator_id, v_client_id, p_product_id, p_buyer_id,
    v_product.price, v_product.currency, 'pending', 'cashfree'
  )
  ON CONFLICT (product_id, buyer_id) WHERE status = 'pending'
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_purch_id;

  RETURN QUERY
    SELECT v_purch_id, v_product.price, v_product.currency, v_product.title;
END;
$$;

-- ── 7. attach_cashfree_order ─────────────────────────────────────────────────
-- Stamps the Cashfree order/session IDs onto a pending purchase row.
-- Raises if the purchase is not in 'pending' state — prevents overwriting a
-- completed or failed row.
CREATE OR REPLACE FUNCTION attach_cashfree_order(
  p_purchase_id     UUID,
  p_cf_order_id     TEXT,
  p_cf_session_id   TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE purchases
     SET cashfree_order_id  = p_cf_order_id,
         cashfree_session_id = p_cf_session_id
   WHERE id     = p_purchase_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase % not found or not in pending state', p_purchase_id;
  END IF;
END;
$$;

-- ── 8. settle_purchase ───────────────────────────────────────────────────────
-- IDEMPOTENT. Called by the webhook (canonical) and verify-order (fast-path).
-- Applies commission split and credits the creator's wallet.
-- FOR UPDATE prevents a double-credit race between the two callers.
CREATE OR REPLACE FUNCTION settle_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_purchase     RECORD;
  v_platform_cut NUMERIC(12, 2);
  v_creator_cut  NUMERIC(12, 2);
  v_wallet_id    UUID;
  v_product_title TEXT;
BEGIN
  SELECT pu.*, u.commission_rate
    INTO v_purchase
    FROM purchases pu
    JOIN users     u  ON u.id = pu.creator_id
   WHERE pu.id = p_purchase_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
  END IF;

  -- Idempotent: already settled
  IF v_purchase.status = 'completed' THEN
    RETURN;
  END IF;

  IF v_purchase.status = 'failed' THEN
    RAISE EXCEPTION 'Cannot settle a failed purchase: %', p_purchase_id;
  END IF;

  -- Commission split (platform keeps commission_rate fraction)
  v_platform_cut := ROUND(v_purchase.amount * COALESCE(v_purchase.commission_rate, 0.20), 2);
  v_creator_cut  := v_purchase.amount - v_platform_cut;

  -- Mark completed
  UPDATE purchases
     SET status       = 'completed',
         platform_fee = v_platform_cut
   WHERE id = p_purchase_id;

  -- Credit creator wallet
  SELECT p.title INTO v_product_title FROM products p WHERE p.id = v_purchase.product_id;
  SELECT id      INTO v_wallet_id     FROM wallets  w WHERE w.user_id = v_purchase.creator_id;

  IF FOUND THEN
    INSERT INTO transactions (wallet_id, type, amount, currency, source, status)
    VALUES (
      v_wallet_id,
      'income',
      v_creator_cut,
      v_purchase.currency,
      'Product Sale: ' || COALESCE(v_product_title, 'Unknown'),
      'completed'
    );

    UPDATE wallets
       SET balance = balance + v_creator_cut
     WHERE id = v_wallet_id;
  END IF;
END;
$$;

-- ── 9. fail_purchase ─────────────────────────────────────────────────────────
-- Marks a pending purchase as failed. Never overrides 'completed'.
CREATE OR REPLACE FUNCTION fail_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE purchases
     SET status = 'failed'
   WHERE id     = p_purchase_id
     AND status = 'pending';
END;
$$;

-- ── 10. get_my_purchases ─────────────────────────────────────────────────────
-- Returns completed purchases for the authenticated buyer.
CREATE OR REPLACE FUNCTION get_my_purchases()
RETURNS TABLE (
  purchase_id         UUID,
  product_id          UUID,
  product_title       TEXT,
  product_description TEXT,
  product_image_url   TEXT,
  content_url         TEXT,
  price               NUMERIC,
  currency            TEXT,
  creator_id          UUID,
  creator_name        TEXT,
  creator_handle      TEXT,
  payment_provider    TEXT,
  purchased_at        TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT
      pu.id               AS purchase_id,
      p.id                AS product_id,
      p.title             AS product_title,
      p.description       AS product_description,
      p.image_url         AS product_image_url,
      p.content_url,
      pu.amount           AS price,
      pu.currency,
      p.creator_id,
      u.display_name      AS creator_name,
      u.handle            AS creator_handle,
      pu.payment_provider,
      pu.created_at       AS purchased_at
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    JOIN users    u ON u.id = p.creator_id
   WHERE pu.buyer_id = auth.uid()
     AND pu.status   = 'completed'
   ORDER BY pu.created_at DESC;
END;
$$;

-- ── 11. Grants ───────────────────────────────────────────────────────────────
-- begin_purchase: authenticated users call this from the browser via service role proxy
GRANT EXECUTE ON FUNCTION begin_purchase(UUID, UUID, TEXT, TEXT)   TO authenticated, service_role;
-- attach/settle/fail: called only by Edge Functions (service role)
GRANT EXECUTE ON FUNCTION attach_cashfree_order(UUID, TEXT, TEXT)  TO service_role;
GRANT EXECUTE ON FUNCTION settle_purchase(UUID)                     TO service_role;
GRANT EXECUTE ON FUNCTION fail_purchase(UUID)                       TO service_role;
-- get_my_purchases: buyers call this from the browser
GRANT EXECUTE ON FUNCTION get_my_purchases()                        TO authenticated;
