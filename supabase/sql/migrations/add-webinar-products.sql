-- ============================================================
-- Webinar products + gated join foundation
-- Safe to re-run.
-- ============================================================

-- 1) Product-level webinar metadata
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS product_kind TEXT NOT NULL DEFAULT 'digital';

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS webinar_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webinar_duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS webinar_capacity INTEGER,
  ADD COLUMN IF NOT EXISTS webinar_timezone TEXT,
  ADD COLUMN IF NOT EXISTS webinar_join_early_minutes INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS webinar_join_late_minutes INTEGER NOT NULL DEFAULT 30;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_kind_check;
ALTER TABLE products
  ADD CONSTRAINT products_product_kind_check
  CHECK (product_kind IN ('digital', 'webinar', 'session', 'telegram'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_webinar_duration_check;
ALTER TABLE products
  ADD CONSTRAINT products_webinar_duration_check
  CHECK (webinar_duration_minutes IS NULL OR webinar_duration_minutes > 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_webinar_capacity_check;
ALTER TABLE products
  ADD CONSTRAINT products_webinar_capacity_check
  CHECK (webinar_capacity IS NULL OR webinar_capacity > 0);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_webinar_early_join_check;
ALTER TABLE products
  ADD CONSTRAINT products_webinar_early_join_check
  CHECK (webinar_join_early_minutes >= 0 AND webinar_join_early_minutes <= 180);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_webinar_late_join_check;
ALTER TABLE products
  ADD CONSTRAINT products_webinar_late_join_check
  CHECK (webinar_join_late_minutes >= 0 AND webinar_join_late_minutes <= 180);

CREATE INDEX IF NOT EXISTS idx_products_kind_active ON products(product_kind, is_active);
CREATE INDEX IF NOT EXISTS idx_products_webinar_schedule ON products(webinar_scheduled_at);

-- 2) Webinar entitlement rows (1 per completed purchase)
CREATE TABLE IF NOT EXISTS webinar_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL UNIQUE REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webinar_entitlements_buyer ON webinar_entitlements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_webinar_entitlements_creator ON webinar_entitlements(creator_id);
CREATE INDEX IF NOT EXISTS idx_webinar_entitlements_schedule ON webinar_entitlements(scheduled_at);

-- 3) Join audit/session rows for one-active-device enforcement
CREATE TABLE IF NOT EXISTS webinar_join_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entitlement_id UUID NOT NULL REFERENCES webinar_entitlements(id) ON DELETE CASCADE,
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_session_id TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webinar_join_sessions_purchase ON webinar_join_sessions(purchase_id);
CREATE INDEX IF NOT EXISTS idx_webinar_join_sessions_buyer ON webinar_join_sessions(buyer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_webinar_join_single_active
  ON webinar_join_sessions(purchase_id)
  WHERE left_at IS NULL AND revoked_at IS NULL;

-- 4) RLS + grants
ALTER TABLE webinar_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinar_join_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can view own webinar entitlements" ON webinar_entitlements;
CREATE POLICY "Buyers can view own webinar entitlements" ON webinar_entitlements
  FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Creators can view own webinar entitlements" ON webinar_entitlements;
CREATE POLICY "Creators can view own webinar entitlements" ON webinar_entitlements
  FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Buyers can view own webinar sessions" ON webinar_join_sessions;
CREATE POLICY "Buyers can view own webinar sessions" ON webinar_join_sessions
  FOR SELECT USING (auth.uid() = buyer_id);

GRANT SELECT ON webinar_entitlements TO authenticated;
GRANT SELECT ON webinar_join_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON webinar_entitlements TO service_role;
GRANT SELECT, INSERT, UPDATE ON webinar_join_sessions TO service_role;

-- 5) Extend storefront RPC with webinar metadata
-- Return type changed from earlier versions, so drop first to avoid 42P13.
DROP FUNCTION IF EXISTS get_public_products(UUID);

CREATE OR REPLACE FUNCTION get_public_products(creator_id_input UUID)
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  title TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  product_kind TEXT,
  webinar_scheduled_at TIMESTAMPTZ,
  webinar_duration_minutes INTEGER,
  webinar_capacity INTEGER,
  webinar_timezone TEXT,
  webinar_join_early_minutes INTEGER,
  webinar_join_late_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      p.id,
      p.creator_id,
      p.title,
      p.description,
      p.price,
      p.currency,
      p.image_url,
      p.is_active,
      p.created_at,
      p.product_kind,
      p.webinar_scheduled_at,
      p.webinar_duration_minutes,
      p.webinar_capacity,
      p.webinar_timezone,
      p.webinar_join_early_minutes,
      p.webinar_join_late_minutes
    FROM products p
    WHERE p.creator_id = creator_id_input AND p.is_active = TRUE
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_public_products(UUID) TO anon, authenticated;

-- 6) Webinar-aware begin_purchase
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
  v_product RECORD;
  v_client_id UUID;
  v_purch_id UUID;
  v_completed_count BIGINT;
BEGIN
  SELECT * INTO v_product
    FROM products
   WHERE id = p_product_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  IF v_product.creator_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own product';
  END IF;

  IF v_product.product_kind = 'webinar' THEN
    IF v_product.webinar_scheduled_at IS NULL OR v_product.webinar_duration_minutes IS NULL THEN
      RAISE EXCEPTION 'Webinar schedule is not configured yet';
    END IF;

    IF NOW() >= v_product.webinar_scheduled_at THEN
      RAISE EXCEPTION 'This webinar has already started';
    END IF;

    IF v_product.webinar_capacity IS NOT NULL THEN
      SELECT COUNT(*) INTO v_completed_count
        FROM purchases
       WHERE product_id = p_product_id
         AND status = 'completed';

      IF v_completed_count >= v_product.webinar_capacity THEN
        RAISE EXCEPTION 'This webinar is sold out';
      END IF;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM purchases
     WHERE product_id = p_product_id
       AND buyer_id   = p_buyer_id
       AND status     = 'completed'
  ) THEN
    RAISE EXCEPTION 'You already own this product';
  END IF;

  UPDATE purchases
     SET status = 'failed'
   WHERE product_id = p_product_id
     AND buyer_id = p_buyer_id
     AND status = 'pending'
     AND created_at < NOW() - INTERVAL '24 hours';

  SELECT id INTO v_client_id
    FROM clients
   WHERE creator_id = v_product.creator_id
     AND email = p_buyer_email;

  IF NOT FOUND THEN
    INSERT INTO clients (creator_id, name, email)
    VALUES (
      v_product.creator_id,
      COALESCE(p_buyer_name, split_part(COALESCE(p_buyer_email, ''), '@', 1), 'Anonymous'),
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
  ON CONFLICT (product_id, buyer_id) WHERE status = 'pending'
  DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_purch_id;

  RETURN QUERY
    SELECT v_purch_id, v_product.price, v_product.currency, v_product.title;
END;
$$;

GRANT EXECUTE ON FUNCTION begin_purchase(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;

-- 7) Webinar-aware settlement + entitlement creation
CREATE OR REPLACE FUNCTION settle_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_purchase RECORD;
  v_platform_cut NUMERIC(12, 2);
  v_creator_cut NUMERIC(12, 2);
  v_wallet_id UUID;
  v_product RECORD;
BEGIN
  SELECT pu.*, u.commission_rate
    INTO v_purchase
    FROM purchases pu
    JOIN users u ON u.id = pu.creator_id
   WHERE pu.id = p_purchase_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found: %', p_purchase_id;
  END IF;

  IF v_purchase.status = 'completed' THEN
    RETURN;
  END IF;

  IF v_purchase.status = 'failed' THEN
    RAISE EXCEPTION 'Cannot settle a failed purchase: %', p_purchase_id;
  END IF;

  SELECT
    p.id,
    p.title,
    p.product_kind,
    p.webinar_scheduled_at,
    p.webinar_duration_minutes
  INTO v_product
  FROM products p
  WHERE p.id = v_purchase.product_id;

  v_platform_cut := ROUND(v_purchase.amount * COALESCE(v_purchase.commission_rate, 0.20), 2);
  v_creator_cut  := v_purchase.amount - v_platform_cut;

  UPDATE purchases
     SET status = 'completed',
         platform_fee = v_platform_cut
   WHERE id = p_purchase_id;

  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_purchase.creator_id;

  IF FOUND THEN
    INSERT INTO transactions (wallet_id, type, amount, currency, source, status)
    VALUES (
      v_wallet_id,
      'income',
      v_creator_cut,
      v_purchase.currency,
      'Product Sale: ' || COALESCE(v_product.title, 'Unknown'),
      'completed'
    );

    UPDATE wallets
       SET balance = balance + v_creator_cut
     WHERE id = v_wallet_id;
  END IF;

  IF v_product.product_kind = 'webinar' THEN
    IF v_purchase.buyer_id IS NULL THEN
      RAISE EXCEPTION 'Webinar purchase missing buyer id: %', p_purchase_id;
    END IF;

    IF v_product.webinar_scheduled_at IS NULL OR v_product.webinar_duration_minutes IS NULL THEN
      RAISE EXCEPTION 'Webinar product missing schedule metadata: %', v_product.id;
    END IF;

    INSERT INTO webinar_entitlements (
      purchase_id,
      product_id,
      creator_id,
      buyer_id,
      scheduled_at,
      duration_minutes
    )
    VALUES (
      v_purchase.id,
      v_purchase.product_id,
      v_purchase.creator_id,
      v_purchase.buyer_id,
      v_product.webinar_scheduled_at,
      v_product.webinar_duration_minutes
    )
    ON CONFLICT (purchase_id) DO UPDATE
      SET scheduled_at = EXCLUDED.scheduled_at,
          duration_minutes = EXCLUDED.duration_minutes;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION settle_purchase(UUID) TO service_role;

-- 8) Extend buyer library RPC and hide direct webinar links
-- Return type changed from earlier versions, so drop first to avoid 42P13.
DROP FUNCTION IF EXISTS get_my_purchases();

CREATE OR REPLACE FUNCTION get_my_purchases()
RETURNS TABLE (
  purchase_id UUID,
  product_id UUID,
  product_title TEXT,
  product_description TEXT,
  product_image_url TEXT,
  content_url TEXT,
  price NUMERIC,
  currency TEXT,
  creator_id UUID,
  creator_name TEXT,
  creator_handle TEXT,
  payment_provider TEXT,
  purchased_at TIMESTAMPTZ,
  product_kind TEXT,
  webinar_scheduled_at TIMESTAMPTZ,
  webinar_duration_minutes INTEGER,
  webinar_capacity INTEGER,
  webinar_timezone TEXT,
  webinar_join_early_minutes INTEGER,
  webinar_join_late_minutes INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
    SELECT
      pu.id AS purchase_id,
      p.id AS product_id,
      p.title AS product_title,
      p.description AS product_description,
      p.image_url AS product_image_url,
      CASE
        WHEN p.product_kind = 'webinar' THEN NULL
        ELSE p.content_url
      END AS content_url,
      pu.amount AS price,
      pu.currency,
      p.creator_id,
      u.display_name AS creator_name,
      u.handle AS creator_handle,
      pu.payment_provider,
      pu.created_at AS purchased_at,
      p.product_kind,
      p.webinar_scheduled_at,
      p.webinar_duration_minutes,
      p.webinar_capacity,
      p.webinar_timezone,
      p.webinar_join_early_minutes,
      p.webinar_join_late_minutes
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    JOIN users u ON u.id = p.creator_id
    WHERE pu.buyer_id = auth.uid()
      AND pu.status = 'completed'
    ORDER BY pu.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_purchases() TO authenticated;

-- 9) Backfill entitlements for already-settled webinar purchases (if any)
INSERT INTO webinar_entitlements (
  purchase_id,
  product_id,
  creator_id,
  buyer_id,
  scheduled_at,
  duration_minutes
)
SELECT
  pu.id,
  pu.product_id,
  pu.creator_id,
  pu.buyer_id,
  p.webinar_scheduled_at,
  p.webinar_duration_minutes
FROM purchases pu
JOIN products p ON p.id = pu.product_id
WHERE pu.status = 'completed'
  AND pu.buyer_id IS NOT NULL
  AND p.product_kind = 'webinar'
  AND p.webinar_scheduled_at IS NOT NULL
  AND p.webinar_duration_minutes IS NOT NULL
ON CONFLICT (purchase_id) DO NOTHING;

-- 10) Force PostgREST schema cache refresh for newly added webinar columns.
NOTIFY pgrst, 'reload schema';
