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
      .limit(1);
    return { data: (data?.[0] ?? null) as User | null, error };
  },

  getProfileByHandle: async (handle: string) => {
    const { data, error } = await supabase
      .rpc('get_public_profile', { handle_to_lookup: handle });
    // RPC returns an array; pick the first row
    const profile = Array.isArray(data) ? data[0] ?? null : data;
    return { data: profile as User, error };
  },

  updateProfile: async (userId: string, updates: Partial<User>) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .limit(1);
    return { data: data?.[0] ?? null, error };
  },

  updateCommissionRate: async (userId: string, commissionRate: number) => {
    const { data, error } = await supabase
      .rpc('update_commission_rate', { target_user_id: userId, new_rate: commissionRate });
    return { data, error };
  },

  removeCreator: async (creatorId: string) => {
    const { data, error } = await supabase
      .rpc('admin_remove_creator', { target_creator_id: creatorId });
    return { data, error };
  },

  checkHandleAvailability: async (handle: string) => {
    const { data, error } = await supabase
      .rpc('check_handle_available', { handle_to_check: handle });
    if (error) {
      // Fallback: try direct query (works if RLS allows public read on handle)
      const { data: fallbackData } = await supabase
        .from('users')
        .select('id')
        .eq('handle', handle)
        .limit(1);
      return { available: !fallbackData || fallbackData.length === 0, error: null };
    }
    return { available: data === true, error: null };
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
      .rpc('get_public_products', { creator_id_input: creatorId });
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

// Purchase queries

export interface CheckoutResult {
  payment_session_id: string;
  cashfree_order_id: string;
  purchase_id: string;
}

export const purchaseQueries = {
  /**
   * Starts a real payment checkout.
   * Calls the create-cashfree-order Edge Function which:
   *  1. Creates a pending purchase row in DB
   *  2. Creates a Cashfree order via their API
   *  3. Returns the payment_session_id for the Drop-in SDK
   */
  startCheckout: async (productId: string): Promise<{ data: CheckoutResult | null; error: Error | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { data: null, error: new Error('Your session expired. Please sign in again and retry.') };
    }
    const { data, error } = await supabase.functions.invoke<CheckoutResult>(
      'create-cashfree-order',
      { body: { product_id: productId },
        headers: { Authorization: `Bearer ${session.access_token}` } }
    );
    if (error) {
      let message = (error as any).message as string;
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) message = body.error;
        else if (body?.message) message = body.message;
      } catch { /* ignore */ }
      if (message.toLowerCase().includes('invalid jwt')) {
        return { data: null, error: new Error('Session invalid — please sign out and sign back in, then retry.') };
      }
      return { data: null, error: new Error(message) };
    }
    return { data: data ?? null, error: null };
  },

  /**
   * Reconciliation fast-path: verify payment status directly with Cashfree.
   * Called after the Drop-in SDK's onSuccess callback and from the /payment/return page.
   */
  verifyOrder: async (cashfreeOrderId: string): Promise<{ status: 'completed' | 'pending' | 'failed' }> => {
    const { data, error } = await supabase.functions.invoke<{ status: string }>(
      'verify-cashfree-order',
      { body: { cashfree_order_id: cashfreeOrderId } }
    );
    if (error) throw error;
    return { status: (data?.status ?? 'pending') as 'completed' | 'pending' | 'failed' };
  },

  getMyPurchases: async () => {
    const { data, error } = await supabase.rpc('get_my_purchases');
    return { data, error };
  },
};
