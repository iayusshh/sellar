import { supabase } from './client';
import type { User } from './client';

export const authQueries = {
  signUp: async (email: string, password: string, handle: string, displayName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          handle,
          display_name: displayName,
        },
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (user: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  },
};

export const userQueries = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return { data: data as User, error };
  },

  getProfileByHandle: async (handle: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('handle', handle)
      .single();
    return { data: data as User, error };
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },

  updateCommissionRate: async (userId: string, commissionRate: number) => {
    const { data, error } = await supabase
      .from('users')
      .update({ commission_rate: commissionRate })
      .eq('id', userId)
      .select()
      .single();
    return { data, error };
  },
};

export const walletQueries = {
  getWallet: async (userId: string) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  getTransactions: async (walletId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error };
  },

  subscribeToWallet: (walletId: string, callback: (payload: any) => void) => {
    return supabase
      .channel(`wallet:${walletId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'wallets',
        filter: `id=eq.${walletId}`,
      }, callback)
      .subscribe();
  },
};

export const transactionQueries = {
  createTransaction: async (transactionData: any) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    return { data, error };
  },

  updateTransaction: async (transactionId: string, updates: any) => {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single();
    return { data, error };
  },

  getWithdrawals: async (walletId: string, status?: string) => {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    return { data, error };
  },
};

export const productQueries = {
  getProducts: async (userId: string, includeInactive = false) => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    return { data, error };
  },

  getPublicProductsByCreatorId: async (creatorId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },
  createProduct: async (productData: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    return { data, error };
  },

  updateProduct: async (productId: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();
    return { data, error };
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);
    return { error };
  },
};

export const adminQueries = {
  getUsers: async () => {
    const { data, error } = await supabase.from('users').select('*');
    return { data, error };
  },
  getWallets: async () => {
    const { data, error } = await supabase.from('wallets').select('*');
    return { data, error };
  },
  getTransactions: async () => {
    const { data, error } = await supabase.from('transactions').select('*');
    return { data, error };
  },
  getProducts: async () => {
    const { data, error } = await supabase.from('products').select('*');
    return { data, error };
  },
  getClients: async () => {
    const { data, error } = await supabase.from('clients').select('*');
    return { data, error };
  },
  getPurchases: async () => {
    const { data, error } = await supabase.from('purchases').select('*');
    return { data, error };
  },
  getVisits: async () => {
    const { data, error } = await supabase.from('visits').select('*');
    return { data, error };
  },
};
