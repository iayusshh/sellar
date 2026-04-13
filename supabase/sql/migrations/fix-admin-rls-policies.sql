-- ============================================================
-- Fix: Admin RLS policies via SECURITY DEFINER helper
-- Run in Supabase SQL Editor — safe to re-run
-- ============================================================

-- ── 1. Helper function ───────────────────────────────────────────────────────
-- SECURITY DEFINER + STABLE means this runs as the db owner and its result
-- is cached per-statement. Avoids the RLS recursion / auth.uid() timing
-- issue that makes EXISTS-in-policy checks unreliable.
CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin OR is_owner FROM users WHERE id = auth.uid()),
    false
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_owner() TO authenticated, anon;

-- ── 2. Re-create all admin SELECT policies using the helper ──────────────────

-- wallets
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (public.is_admin_or_owner());

-- transactions
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (public.is_admin_or_owner());

DROP POLICY IF EXISTS "Admins can update all transactions" ON transactions;
CREATE POLICY "Admins can update all transactions" ON transactions
  FOR UPDATE USING (public.is_admin_or_owner());

-- clients
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (public.is_admin_or_owner());

-- purchases
DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (public.is_admin_or_owner());

-- visits
DROP POLICY IF EXISTS "Admins can view all visits" ON visits;
CREATE POLICY "Admins can view all visits" ON visits
  FOR SELECT USING (public.is_admin_or_owner());

-- products (admin view alongside existing public active-products policy)
DROP POLICY IF EXISTS "Admins can view all products" ON products;
CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (public.is_admin_or_owner());

-- ── 3. Fix get_product_purchases (ambiguous 'id' column) ────────────────────
DROP FUNCTION IF EXISTS get_product_purchases(UUID);
CREATE FUNCTION get_product_purchases(target_product_id UUID)
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
BEGIN
  IF NOT public.is_admin_or_owner() THEN
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
