-- ==========================================
-- Content Delivery System — Schema Migration
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Add content_url to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_url TEXT;

-- 2. Add buyer_id to purchases table (links to auth.users)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Create index on buyer_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases(buyer_id);

-- 4. RLS policy: buyers can view their own purchases
DROP POLICY IF EXISTS "Buyers can view their own purchases" ON purchases;
CREATE POLICY "Buyers can view their own purchases" ON purchases
  FOR SELECT USING (auth.uid() = buyer_id);

-- 5. RPC: purchase_product
-- Handles: validation, client creation, purchase record, income transaction
CREATE OR REPLACE FUNCTION purchase_product(
  p_product_id UUID,
  p_buyer_name TEXT DEFAULT NULL,
  p_buyer_email TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_product RECORD;
  v_buyer_id UUID;
  v_client_id UUID;
  v_purchase_id UUID;
  v_wallet_id UUID;
BEGIN
  v_buyer_id := auth.uid();
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Get product details
  SELECT * INTO v_product FROM products WHERE id = p_product_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found or inactive';
  END IF;

  -- Prevent buying your own product
  IF v_product.creator_id = v_buyer_id THEN
    RAISE EXCEPTION 'Cannot purchase your own product';
  END IF;

  -- Check if already purchased
  IF EXISTS (
    SELECT 1 FROM purchases
    WHERE product_id = p_product_id AND buyer_id = v_buyer_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'You have already purchased this product';
  END IF;

  -- Find or create client record for this creator
  SELECT id INTO v_client_id FROM clients
    WHERE creator_id = v_product.creator_id AND email = p_buyer_email;
  IF NOT FOUND THEN
    INSERT INTO clients (creator_id, name, email)
    VALUES (
      v_product.creator_id,
      COALESCE(p_buyer_name, split_part(COALESCE(p_buyer_email, ''), '@', 1), 'Anonymous'),
      p_buyer_email
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Create purchase record
  INSERT INTO purchases (creator_id, client_id, product_id, buyer_id, amount, currency, status)
  VALUES (v_product.creator_id, v_client_id, p_product_id, v_buyer_id, v_product.price, v_product.currency, 'completed')
  RETURNING id INTO v_purchase_id;

  -- Create income transaction on creator's wallet
  SELECT id INTO v_wallet_id FROM wallets WHERE user_id = v_product.creator_id;
  IF FOUND THEN
    INSERT INTO transactions (wallet_id, type, amount, currency, source, status)
    VALUES (v_wallet_id, 'income', v_product.price, v_product.currency, 'Product Sale: ' || v_product.title, 'completed');

    -- Update wallet balance
    UPDATE wallets SET balance = balance + v_product.price WHERE id = v_wallet_id;
  END IF;

  RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: get_my_purchases
-- Returns all purchases for the authenticated buyer with product & creator info
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
  purchased_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      pu.id AS purchase_id,
      p.id AS product_id,
      p.title AS product_title,
      p.description AS product_description,
      p.image_url AS product_image_url,
      p.content_url,
      pu.amount AS price,
      pu.currency,
      p.creator_id,
      u.display_name AS creator_name,
      u.handle AS creator_handle,
      pu.created_at AS purchased_at
    FROM purchases pu
    JOIN products p ON p.id = pu.product_id
    JOIN users u ON u.id = p.creator_id
    WHERE pu.buyer_id = auth.uid() AND pu.status = 'completed'
    ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. FIX: Products RLS policies
-- The FOR ALL policy needs WITH CHECK for INSERT/UPDATE to work
-- ==========================================

-- Drop the old policy if it exists (safe to re-run)
DROP POLICY IF EXISTS "Users can manage their own products" ON products;

-- Recreate with proper WITH CHECK clause
CREATE POLICY "Users can manage their own products" ON products
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- 8. Grant table-level permissions
-- RLS policies filter rows, but the role still needs base table access
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO authenticated;
GRANT SELECT ON products TO anon;
