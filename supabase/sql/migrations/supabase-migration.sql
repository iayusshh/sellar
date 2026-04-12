-- Sellar - Supabase Migration (existing projects)
-- Run this if you already created tables from the old schema

-- Wallets: set INR as default currency
ALTER TABLE wallets
  ALTER COLUMN currency SET DEFAULT 'INR';

-- Users: add admin and commission fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(4, 2) DEFAULT 0.20 NOT NULL;

-- Ensure RLS enabled and profile select policy exists
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

-- Secure user profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false AND is_owner = false);

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

-- Transactions: add source, update type values, and set INR default
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS source TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'transactions'
      AND column_name = 'description'
  ) THEN
    EXECUTE 'UPDATE transactions SET source = COALESCE(source, description) WHERE source IS NULL';
  ELSE
    EXECUTE 'UPDATE transactions SET source = COALESCE(source, ''Unknown'') WHERE source IS NULL';
  END IF;
END $$;

ALTER TABLE transactions
  ALTER COLUMN source SET NOT NULL;

ALTER TABLE transactions
  ALTER COLUMN currency SET DEFAULT 'INR';

UPDATE transactions
  SET type = 'income'
  WHERE type = 'deposit';

ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
  ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'withdrawal'));

ALTER TABLE transactions
  DROP COLUMN IF EXISTS description;

-- Allow wallet owners to update their own transactions (admin simulation)
DROP POLICY IF EXISTS "Users can update their own transactions" ON transactions;
CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
CREATE POLICY "Admins can view all transactions" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Admin wallet access
DROP POLICY IF EXISTS "Admins can view all wallets" ON wallets;
CREATE POLICY "Admins can view all wallets" ON wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Products: rename columns and set INR default
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'user_id'
  ) THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN user_id TO creator_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products'
      AND column_name = 'name'
  ) THEN
    EXECUTE 'ALTER TABLE products RENAME COLUMN name TO title';
  END IF;
END $$;

ALTER TABLE products
  ALTER COLUMN currency SET DEFAULT 'INR';

DROP INDEX IF EXISTS idx_products_user_id;
CREATE INDEX IF NOT EXISTS idx_products_creator_id ON products(creator_id);

-- Update product policies to use creator_id
DROP POLICY IF EXISTS "Users can insert their own products" ON products;
DROP POLICY IF EXISTS "Users can update their own products" ON products;
DROP POLICY IF EXISTS "Users can delete their own products" ON products;
DROP POLICY IF EXISTS "Users can manage their own products" ON products;

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = creator_id);

-- Admin profile access
DROP POLICY IF EXISTS "Admins can manage all profiles" ON users;
CREATE POLICY "Admins can manage all profiles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Add data tables for clients, purchases, and visits
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'INR' NOT NULL,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  device TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_creator_id ON clients(creator_id);
CREATE INDEX IF NOT EXISTS idx_purchases_creator_id ON purchases(creator_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product_id ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_visits_creator_id ON visits(creator_id);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at DESC);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Creators can manage their own clients" ON clients;
CREATE POLICY "Creators can manage their own clients" ON clients
  FOR ALL USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

DROP POLICY IF EXISTS "Creators can manage their own purchases" ON purchases;
CREATE POLICY "Creators can manage their own purchases" ON purchases
  FOR ALL USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON purchases;
CREATE POLICY "Admins can view all purchases" ON purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

DROP POLICY IF EXISTS "Creators can view their own visits" ON visits;
CREATE POLICY "Creators can view their own visits" ON visits
  FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can view all visits" ON visits;
CREATE POLICY "Admins can view all visits" ON visits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );
