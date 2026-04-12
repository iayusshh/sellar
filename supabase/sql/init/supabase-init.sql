-- Sellar Database Schema
-- Copy and paste this entire file into Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_products_creator_id ON products(creator_id);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_clients_creator_id ON clients(creator_id);
CREATE INDEX idx_purchases_creator_id ON purchases(creator_id);
CREATE INDEX idx_purchases_product_id ON purchases(product_id);
CREATE INDEX idx_visits_creator_id ON visits(creator_id);
CREATE INDEX idx_visits_created_at ON visits(created_at DESC);

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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND is_admin = false AND is_owner = false);

CREATE POLICY "Admins can manage all profiles" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets policies
CREATE POLICY "Users can view their own wallet" ON wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wallets WHERE wallets.id = transactions.wallet_id AND wallets.user_id = auth.uid()
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
      SELECT 1 FROM users admin WHERE admin.id = auth.uid() AND (admin.is_admin = true OR admin.is_owner = true)
    )
  );

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (auth.uid() = creator_id);

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT USING (
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
