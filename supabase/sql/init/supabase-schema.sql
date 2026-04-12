# Sellar - Supabase Schema

This file contains the SQL schema for setting up your Supabase database.

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the following SQL commands in order

## Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  phone TEXT,
  social_links JSONB DEFAULT '{}',
  is_admin BOOLEAN DEFAULT false NOT NULL,
  is_owner BOOLEAN DEFAULT false NOT NULL,
  commission_rate NUMERIC(4, 2) DEFAULT 0.20 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallets table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'withdrawal')),
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  source TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  image_url TEXT,
  content_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  buyer_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visits table
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public RPC function to check handle availability (bypasses RLS for signup)
CREATE OR REPLACE FUNCTION check_handle_available(handle_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM users WHERE handle = handle_to_check);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public RPC function to get creator profile by handle (bypasses RLS for storefront)
CREATE OR REPLACE FUNCTION get_public_profile(handle_to_lookup TEXT)
RETURNS TABLE (
  id UUID,
  handle TEXT,
  display_name TEXT,
  email TEXT,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT u.id, u.handle, u.display_name, u.email, u.bio, u.avatar_url, u.social_links, u.created_at
    FROM users u
    WHERE u.handle = handle_to_lookup;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public RPC function to get active products by creator (bypasses RLS for storefront)
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
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.creator_id, p.title, p.description, p.price, p.currency, p.image_url, p.is_active, p.created_at
    FROM products p
    WHERE p.creator_id = creator_id_input AND p.is_active = TRUE
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RPC to update commission rate (bypasses RLS self-reference issue)
CREATE OR REPLACE FUNCTION update_commission_rate(target_user_id UUID, new_rate NUMERIC)
RETURNS VOID AS $$
DECLARE
  is_caller_admin BOOLEAN;
BEGIN
  SELECT (is_admin = true OR is_owner = true) INTO is_caller_admin
    FROM users WHERE id = auth.uid();
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Permission denied: only admins can update commission rates';
  END IF;
  UPDATE users SET commission_rate = new_rate WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RPC to get all products with creator and purchase info
CREATE OR REPLACE FUNCTION get_admin_products()
RETURNS TABLE (
  id UUID,
  creator_id UUID,
  creator_name TEXT,
  creator_handle TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC,
  currency TEXT,
  image_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  purchase_count BIGINT,
  total_revenue NUMERIC
) AS $$
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
      p.id, p.creator_id,
      u.display_name AS creator_name,
      u.handle AS creator_handle,
      p.title, p.description, p.price, p.currency, p.image_url, p.is_active, p.created_at,
      COUNT(pu.id) AS purchase_count,
      COALESCE(SUM(pu.amount), 0) AS total_revenue
    FROM products p
    LEFT JOIN users u ON u.id = p.creator_id
    LEFT JOIN purchases pu ON pu.product_id = p.id AND pu.status = 'completed'
    GROUP BY p.id, p.creator_id, u.display_name, u.handle, p.title, p.description, p.price, p.currency, p.image_url, p.is_active, p.created_at
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RPC to get purchases for a specific product with buyer info
CREATE OR REPLACE FUNCTION get_product_purchases(target_product_id UUID)
RETURNS TABLE (
  id UUID,
  client_name TEXT,
  client_email TEXT,
  amount NUMERIC,
  currency TEXT,
  status TEXT,
  purchased_at TIMESTAMPTZ
) AS $$
DECLARE
  is_caller_admin BOOLEAN;
BEGIN
  SELECT (is_admin = true OR is_owner = true) INTO is_caller_admin
    FROM users WHERE id = auth.uid();
  IF NOT is_caller_admin THEN
    RAISE EXCEPTION 'Permission denied: only admins can access this data';
  END IF;
  RETURN QUERY
    SELECT pu.id, c.name AS client_name, c.email AS client_email, pu.amount, pu.currency, pu.status, pu.created_at AS purchased_at
    FROM purchases pu
    LEFT JOIN clients c ON c.id = pu.client_id
    WHERE pu.product_id = target_product_id
    ORDER BY pu.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin RPC to remove a creator and all associated data
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

-- Create indexes for better performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_users_handle ON users(handle);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profile + wallet from auth user
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, handle, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'handle', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        handle = EXCLUDED.handle,
        display_name = EXCLUDED.display_name;

  IF NOT EXISTS (
    SELECT 1 FROM public.wallets WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (NEW.id, 0, 'INR');
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql' security definer set search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false AND is_owner = false);

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
    )
  );

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own products" ON products
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Admin profile access
CREATE POLICY "Admins can manage all profiles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Clients policies
CREATE POLICY "Creators can manage their own clients" ON clients
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Purchases policies
CREATE POLICY "Creators can manage their own purchases" ON purchases
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Visits policies
CREATE POLICY "Creators can view their own visits" ON visits
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all visits" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND admin.is_admin = true
    )
  );
```

## Sample Data (Optional)

```sql
-- Insert sample user (replace with actual user ID from auth.users)
INSERT INTO users (id, email, handle, display_name, bio)
VALUES (
  'YOUR_USER_ID_HERE',
  'demo@example.com',
  'demo_creator',
  'Demo Creator',
  'Sample creator profile for testing'
);

-- Create wallet for user
INSERT INTO wallets (user_id, balance)
VALUES ('YOUR_USER_ID_HERE', 8234.50);

-- Add sample transactions
INSERT INTO transactions (wallet_id, type, amount, source, status)
SELECT 
  w.id,
  'income',
  450.00,
  'Digital Product Sale',
  'completed'
FROM wallets w WHERE w.user_id = 'YOUR_USER_ID_HERE';
```

## Storage Buckets

Run these in the SQL Editor to set up storage buckets for image uploads:

```sql
-- Create 'products' bucket for product thumbnail images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to view product images (public bucket)
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Allow users to update/delete their own images
CREATE POLICY "Users can manage own product images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Notes

- Replace `YOUR_USER_ID_HERE` with actual user IDs from your Supabase Auth
- Adjust numeric precision if needed for your currency requirements
- RLS policies are basic - customize based on your security needs
- Consider adding more indexes based on your query patterns
