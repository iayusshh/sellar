-- ============================================================
-- Cashfree Payment Integration — Schema Migration
-- Apply in Supabase SQL Editor (safe to re-run — idempotent)
-- ============================================================

-- ── 1. Cashfree tracking columns on purchases ────────────────────────────
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cashfree_order_id TEXT UNIQUE;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS cashfree_payment_session_id TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'cashfree';
CREATE INDEX IF NOT EXISTS idx_purchases_cf_order_id ON purchases(cashfree_order_id);

-- ── 2. Drop the old instant-completion RPC (replaced by 4-RPC flow below) ─
DROP FUNCTION IF EXISTS purchase_product(UUID, TEXT, TEXT);

-- ── 3. create_pending_purchase ───────────────────────────────────────────
-- Called by the create-cashfree-order Edge Function (using service role).
-- Returns everything needed to build the Cashfree order payload.
-- Reuses an existing pending row on buyer retry to avoid orphan rows.
CREATE OR REPLACE FUNCTION create_pending_purchase(
  p_product_id UUID,
  p_buyer_id   UUID,
  p_buyer_name TEXT,
  p_buyer_email TEXT
)
RETURNS TABLE (
  purchase_id   UUID,
  amount        NUMERIC,
  currency      TEXT,
  creator_id    UUID,
  product_title TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_product     RECORD;
  v_client_id   UUID;
  v_purchase_id UUID;
BEGIN
  -- Validate product exists and is active
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Prevent self-purchase
  IF v_product.creator_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own product';
  END IF;

  -- Prevent duplicate purchase
  IF EXISTS (
    SELECT 1 FROM purchases
    WHERE product_id = p_product_id
      AND buyer_id   = p_buyer_id
      AND status     = 'completed'
  ) THEN
    RAISE EXCEPTION 'You have already purchased this product';
  END IF;

  -- Reuse any existing pending row (handles buyer hitting "retry" before payment)
  SELECT id INTO v_purchase_id
    FROM purchases
    WHERE product_id = p_product_id
      AND buyer_id   = p_buyer_id
      AND status     = 'pending'
    LIMIT 1;

  IF v_purchase_id IS NULL THEN
    -- Find or create client record for this creator's CRM
    SELECT id INTO v_client_id
      FROM clients
      WHERE creator_id = v_product.creator_id AND email = p_buyer_email;

    IF NOT FOUND THEN
      INSERT INTO clients (creator_id, name, email)
      VALUES (
        v_product.creator_id,
        COALESCE(
          p_buyer_name,
          split_part(COALESCE(p_buyer_email, ''), '@', 1),
          'Anonymous'
        ),
        p_buyer_email
      )
      RETURNING id INTO v_client_id;
    END IF;

    INSERT INTO purchases (
      creator_id, client_id, product_id, buyer_id,
      amount, currency, status, payment_provider
    )
    VALUES (
      v_product.creator_id, v_client_id, p_product_id, p_buyer_id,
      v_product.price, v_product.currency, 'pending', 'cashfree'
    )
    RETURNING id INTO v_purchase_id;
  END IF;

  RETURN QUERY
    SELECT v_purchase_id,
           v_product.price,
           v_product.currency,
           v_product.creator_id,
           v_product.title;
END;
$$;

-- ── 4. set_purchase_cashfree_ids ─────────────────────────────────────────
-- Stash Cashfree order_id + session_id after the Cashfree API call succeeds.
CREATE OR REPLACE FUNCTION set_purchase_cashfree_ids(
  p_purchase_id   UUID,
  p_cf_order_id   TEXT,
  p_cf_session_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE purchases
     SET cashfree_order_id          = p_cf_order_id,
         cashfree_payment_session_id = p_cf_session_id
   WHERE id = p_purchase_id;
END;
$$;

-- ── 5. complete_purchase ─────────────────────────────────────────────────
-- IDEMPOTENT — safe to call from both the webhook AND the verify-order
-- fast-path (belt-and-suspenders). Uses FOR UPDATE to prevent race conditions.
-- Flips status → 'completed' and credits the creator wallet exactly once.
CREATE OR REPLACE FUNCTION complete_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_purchase     RECORD;
  v_wallet_id    UUID;
  v_product_title TEXT;
BEGIN
  SELECT * INTO v_purchase FROM purchases WHERE id = p_purchase_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
  END IF;

  -- Idempotent: no-op if already completed (e.g. webhook fired after verify-order)
  IF v_purchase.status = 'completed' THEN
    RETURN;
  END IF;

  IF v_purchase.status = 'failed' THEN
    RAISE EXCEPTION 'Cannot complete a failed purchase';
  END IF;

  -- Mark completed
  UPDATE purchases SET status = 'completed' WHERE id = p_purchase_id;

  -- Credit creator wallet
  SELECT title INTO v_product_title FROM products WHERE id = v_purchase.product_id;
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_purchase.creator_id;
  IF FOUND THEN
    INSERT INTO transactions (wallet_id, type, amount, currency, source, status)
    VALUES (
      v_wallet_id,
      'income',
      v_purchase.amount,
      v_purchase.currency,
      'Product Sale: ' || COALESCE(v_product_title, 'Unknown'),
      'completed'
    );
    UPDATE wallets
       SET balance = balance + v_purchase.amount
     WHERE id = v_wallet_id;
  END IF;
END;
$$;

-- ── 6. mark_purchase_failed ──────────────────────────────────────────────
-- Called by the webhook on PAYMENT_FAILED / PAYMENT_USER_DROPPED events.
CREATE OR REPLACE FUNCTION mark_purchase_failed(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE purchases
     SET status = 'failed'
   WHERE id     = p_purchase_id
     AND status = 'pending';   -- never override 'completed'
END;
$$;

-- ── 7. Grant execute permissions ─────────────────────────────────────────
-- These are SECURITY DEFINER functions — the caller's privileges don't matter,
-- but the role still needs EXECUTE permission to invoke them.
GRANT EXECUTE ON FUNCTION create_pending_purchase(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION set_purchase_cashfree_ids(UUID, TEXT, TEXT)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION complete_purchase(UUID)                          TO service_role;
GRANT EXECUTE ON FUNCTION mark_purchase_failed(UUID)                       TO service_role;

-- ── 8. Ensure get_my_purchases only returns completed rows ───────────────
-- (It already filters on status = 'completed'; this is a safety re-confirm.)
-- Re-create to include the payment_provider column in the output.
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
      pu.id                AS purchase_id,
      p.id                 AS product_id,
      p.title              AS product_title,
      p.description        AS product_description,
      p.image_url          AS product_image_url,
      p.content_url,
      pu.amount            AS price,
      pu.currency,
      p.creator_id,
      u.display_name       AS creator_name,
      u.handle             AS creator_handle,
      pu.payment_provider,
      pu.created_at        AS purchased_at
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    JOIN users    u ON u.id = p.creator_id
   WHERE pu.buyer_id = auth.uid()
     AND pu.status   = 'completed'
   ORDER BY pu.created_at DESC;
END;
$$;
