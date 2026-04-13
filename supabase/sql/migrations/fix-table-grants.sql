-- ============================================================
-- Fix: table-level GRANTs for authenticated role
-- 42501 "permission denied for table X" fires BEFORE RLS is
-- evaluated — no policy matters until the role has the base grant.
-- Safe to re-run.
-- ============================================================

-- wallets: creators read their own, admins read all (via RLS)
GRANT SELECT, INSERT, UPDATE ON wallets TO authenticated;

-- transactions: creators read/insert their own, admins read/update all
GRANT SELECT, INSERT, UPDATE ON transactions TO authenticated;

-- clients: creators manage their own, admins read all
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;

-- purchases: creators/buyers read their own, admins read all
GRANT SELECT, INSERT, UPDATE ON purchases TO authenticated;

-- visits: creators read their own, admins read all
GRANT SELECT, INSERT ON visits TO authenticated;
GRANT SELECT ON visits TO anon;

-- anon needs SELECT on wallets/transactions for public-facing operations
-- (none right now, but safe to leave narrow)
GRANT SELECT ON wallets TO anon;
