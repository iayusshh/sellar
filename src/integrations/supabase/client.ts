import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase environment variables are missing. Auth and database features will not work. ' +
    'Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Database types
export type User = {
  id: string;
  email: string;
  handle: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  social_links?: Record<string, string>;
  is_admin?: boolean;
  is_owner?: boolean;
  commission_rate?: number;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  wallet_id: string;
  type: 'income' | 'withdrawal';
  amount: number;
  currency: string;
  source: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type Product = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  creator_id: string;
  name: string;
  email?: string;
  gender?: string;
  location?: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  creator_id: string;
  client_id?: string | null;
  product_id?: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

export type Visit = {
  id: string;
  creator_id?: string | null;
  path: string;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  device?: string | null;
  created_at: string;
};
