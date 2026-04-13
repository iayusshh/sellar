-- ============================================================
-- Fix: settle_purchase wallet auto-creation + is_creator column
-- Apply in Supabase SQL Editor (idempotent — safe to re-run)
-- ============================================================

-- ── 1. Add is_creator column ─────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_creator BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Backfill is_creator for existing creators ─────────────────────────────
-- Any user who owns products is a creator. Also catches users who had
-- is_creator=true written to auth metadata but not yet to the users row.
UPDATE users
   SET is_creator = true
 WHERE id IN (SELECT DISTINCT creator_id FROM products WHERE creator_id IS NOT NULL)
   AND is_creator = false;

-- ── 3. Unique constraint on wallets.user_id ──────────────────────────────────
-- Required so settle_purchase can safely upsert the wallet row.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'wallets_user_id_unique'
       AND conrelid = 'wallets'::regclass
  ) THEN
    ALTER TABLE wallets ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id);
  END IF;
END;
$$;

-- ── 4. Update auth trigger to carry is_creator into users row ────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, handle, display_name, is_creator)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'is_creator')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE
    SET email        = EXCLUDED.email,
        handle       = EXCLUDED.handle,
        display_name = EXCLUDED.display_name;
  -- Note: is_creator is intentionally NOT updated on conflict — once set, it
  -- should only change via the upgradeToCreator flow, not on every sign-in.

  INSERT INTO public.wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'INR')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ language 'plpgsql' security definer set search_path = public;

-- ── 5. Fix settle_purchase to auto-create wallet if missing ──────────────────
-- Previously: IF FOUND THEN ... END IF  →  silently skipped if no wallet.
-- Now: upsert the wallet first, then always insert the transaction.
CREATE OR REPLACE FUNCTION settle_purchase(p_purchase_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_purchase      RECORD;
  v_platform_cut  NUMERIC(12, 2);
  v_creator_cut   NUMERIC(12, 2);
  v_wallet_id     UUID;
  v_product_title TEXT;
BEGIN
  SELECT pu.*, u.commission_rate
    INTO v_purchase
    FROM purchases pu
    JOIN users     u ON u.id = pu.creator_id
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

  -- Product title for transaction label
  SELECT title INTO v_product_title FROM products WHERE id = v_purchase.product_id;

  -- Ensure creator wallet exists (auto-create if missing — covers creators
  -- whose wallet was never seeded, e.g. signed up before the auth trigger
  -- included wallet creation).
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (v_purchase.creator_id, 0, v_purchase.currency)
  ON CONFLICT (user_id) DO NOTHING;

  -- Credit creator wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_purchase.creator_id;

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
END;
$$;

-- ── 6. Grant execute on settle_purchase (preserves existing grants) ──────────
GRANT EXECUTE ON FUNCTION settle_purchase(UUID) TO service_role;

-- ── 8. Admin RLS policies — ensure all tables are readable by admins ─────────
-- These are idempotent (DROP IF EXISTS + CREATE). Covers cases where earlier
-- migrations were not fully applied or policies were accidentally dropped.

-- wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );
DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
CREATE POLICY "Admins can update all transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- clients
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- purchases
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- visits
DROP POLICY IF EXISTS "Admins can view all visits" ON visits;
CREATE POLICY "Admins can view all visits" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- products (ensure admin SELECT policy exists alongside the public/creator ones)
DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND (u.is_admin = true OR u.is_owner = true)
    )
  );

-- ── 9. Fix get_product_purchases — "column reference id is ambiguous" ─────────
-- The RETURNS TABLE declared a column named 'id' which shadowed 'pu.id'
-- in the query. Renamed to 'purchase_id' to remove the ambiguity.
-- Must DROP first because return type changed (id → purchase_id).
DROP FUNCTION IF EXISTS get_product_purchases(UUID);
CREATE OR REPLACE FUNCTION get_product_purchases(target_product_id UUID)
RETURNS TABLE (
  purchase_id  UUID,
  client_name  TEXT,
  client_email TEXT,
  amount       NUMERIC,
  currency     TEXT,
  status       TEXT,
  purchased_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  is_caller_admin BOOLEAN;
BEGIN
  SELECT (is_admin = true OR is_owner = true) INTO is_caller_admin
    FROM users WHERE id = auth.uid();
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Permission denied: only admins can access this data';
  END IF;

  RETURN QUERY
    SELECT
      pu.id          AS purchase_id,
      c.name         AS client_name,
      c.email        AS client_email,
      pu.amount,
      pu.currency,
      pu.status,
      pu.created_at  AS purchased_at
    FROM purchases pu
    LEFT JOIN clients c ON c.id = pu.client_id
    WHERE pu.product_id = target_product_id
    ORDER BY pu.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_product_purchases(UUID) TO authenticated;

-- ── 7. Backfill: recover completed purchases with no income transaction ───────
-- settle_purchase() is idempotent on status='completed' (exits early), so it
-- cannot be called again for purchases that already completed but had their
-- wallet credit silently skipped. This block inserts the missing transactions
-- directly for every such orphaned purchase.
DO $$
DECLARE
  r               RECORD;
  v_wallet_id     UUID;
  v_platform_cut  NUMERIC(12, 2);
  v_creator_cut   NUMERIC(12, 2);
  v_product_title TEXT;
BEGIN
  FOR r IN
    -- Find completed purchases whose creator wallet has NO income transaction
    -- whose source matches this purchase. We match on wallet + amount + date
    -- window rather than a hard FK because there is no transaction→purchase FK.
    SELECT
      pu.id          AS purchase_id,
      pu.creator_id,
      pu.amount,
      pu.currency,
      pu.product_id,
      pu.platform_fee,
      pu.created_at,
      u.commission_rate
    FROM purchases pu
    JOIN users u ON u.id = pu.creator_id
    WHERE pu.status = 'completed'
      AND NOT EXISTS (
        SELECT 1
          FROM transactions t
          JOIN wallets w ON w.id = t.wallet_id
         WHERE w.user_id  = pu.creator_id
           AND t.type     = 'income'
           AND t.status   = 'completed'
           -- same day window: loose enough to tolerate clock skew
           AND t.created_at BETWEEN pu.created_at - INTERVAL '1 hour'
                                AND pu.created_at + INTERVAL '25 hours'
      )
  LOOP
    -- Resolve platform_fee: use stored value if available, else recalculate
    IF r.platform_fee IS NOT NULL AND r.platform_fee > 0 THEN
      v_platform_cut := r.platform_fee;
    ELSE
      v_platform_cut := ROUND(r.amount * COALESCE(r.commission_rate, 0.20), 2);
    END IF;
    v_creator_cut := r.amount - v_platform_cut;

    SELECT title INTO v_product_title FROM products WHERE id = r.product_id;

    -- Ensure wallet exists
    INSERT INTO wallets (user_id, balance, currency)
    VALUES (r.creator_id, 0, r.currency)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = r.creator_id;

    -- Insert the missing income transaction
    INSERT INTO transactions (wallet_id, type, amount, currency, source, status, created_at)
    VALUES (
      v_wallet_id,
      'income',
      v_creator_cut,
      r.currency,
      'Product Sale: ' || COALESCE(v_product_title, 'Unknown'),
      'completed',
      r.created_at   -- back-date to when the purchase actually happened
    );

    -- Credit wallet balance
    UPDATE wallets
       SET balance = balance + v_creator_cut
     WHERE id = v_wallet_id;

    RAISE NOTICE 'Backfilled transaction for purchase % (creator %, amount %)',
      r.purchase_id, r.creator_id, v_creator_cut;
  END LOOP;
END;
$$;
