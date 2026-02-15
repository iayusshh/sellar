-- ==========================================
-- Admin Remove Creator RPC Function
-- Run this in your Supabase SQL Editor
-- ==========================================

CREATE OR REPLACE FUNCTION admin_remove_creator(target_creator_id UUID)
RETURNS VOID AS $$
DECLARE
  is_caller_admin BOOLEAN;
  is_target_admin BOOLEAN;
BEGIN
  -- Check caller is admin
  SELECT (is_admin = true OR is_owner = true) INTO is_caller_admin
    FROM users WHERE id = auth.uid();
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Permission denied: only admins can remove creators';
  END IF;

  -- Prevent removing admin/owner accounts
  SELECT (is_admin = true OR is_owner = true) INTO is_target_admin
    FROM users WHERE id = target_creator_id;
  IF is_target_admin THEN
    RAISE EXCEPTION 'Cannot remove admin or owner accounts';
  END IF;

  -- Delete in dependency order
  DELETE FROM purchases WHERE creator_id = target_creator_id;
  DELETE FROM products WHERE creator_id = target_creator_id;
  DELETE FROM clients WHERE creator_id = target_creator_id;
  DELETE FROM transactions WHERE wallet_id IN (
    SELECT id FROM wallets WHERE user_id = target_creator_id
  );
  DELETE FROM wallets WHERE user_id = target_creator_id;
  DELETE FROM users WHERE id = target_creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
