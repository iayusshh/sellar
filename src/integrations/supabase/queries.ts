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

  getFeaturedCreators: async () => {
    const { data, error } = await supabase.rpc('get_featured_creators');
    return { data: (data ?? []) as User[], error };
  },

  toggleFeatured: async (userId: string, isFeatured: boolean) => {
    const updates: Partial<User> = { is_featured: isFeatured };
    if (!isFeatured) updates.featured_order = null;
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .limit(1);
    return { data: (data?.[0] ?? null) as User | null, error };
  },

  updateFeaturedOrder: async (userId: string, order: number | null) => {
    const { data, error } = await supabase
      .from('users')
      .update({ featured_order: order })
      .eq('id', userId)
      .select()
      .limit(1);
    return { data: (data?.[0] ?? null) as User | null, error };
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

const WEBINAR_PRODUCT_COLUMNS = [
  'product_kind',
  'webinar_scheduled_at',
  'webinar_duration_minutes',
  'webinar_capacity',
  'webinar_timezone',
  'webinar_join_early_minutes',
  'webinar_join_late_minutes',
] as const;

let webinarSchemaSupport: 'unknown' | 'supported' | 'missing' = 'unknown';

function stripWebinarProductColumns<T extends Record<string, unknown>>(payload: T): T {
  const next = { ...payload };
  for (const column of WEBINAR_PRODUCT_COLUMNS) {
    delete (next as Record<string, unknown>)[column];
  }
  return next;
}

function isWebinarSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = String((error as { code?: unknown }).code ?? '');
  const message = String((error as { message?: unknown }).message ?? '').toLowerCase();
  const details = String((error as { details?: unknown }).details ?? '').toLowerCase();
  if (code !== 'PGRST204') return false;
  return /product_kind|webinar_/.test(`${message} ${details}`);
}

function isWebinarPayload(payload: Record<string, unknown>): boolean {
  return String(payload.product_kind ?? '').toLowerCase() === 'webinar';
}

function webinarMigrationRequiredError() {
  return new Error(
    'Webinar schema is not applied yet. Run supabase/sql/migrations/add-webinar-products.sql in Supabase SQL Editor, then retry.'
  );
}

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
    const requested = (productData ?? {}) as Record<string, unknown>;
    const canAttemptLegacy = webinarSchemaSupport === 'missing';

    if (canAttemptLegacy && isWebinarPayload(requested)) {
      return { data: null, error: webinarMigrationRequiredError() };
    }

    const payload = canAttemptLegacy
      ? stripWebinarProductColumns(requested)
      : requested;

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (!error) {
      if (!canAttemptLegacy && requested.product_kind) webinarSchemaSupport = 'supported';
      return { data, error: null };
    }

    if (!isWebinarSchemaMissingError(error)) {
      return { data, error };
    }

    webinarSchemaSupport = 'missing';

    if (isWebinarPayload(requested)) {
      return { data: null, error: webinarMigrationRequiredError() };
    }

    const legacyPayload = stripWebinarProductColumns(requested);
    const fallback = await supabase
      .from('products')
      .insert(legacyPayload)
      .select()
      .single();

    return { data: fallback.data, error: fallback.error };
  },

  updateProduct: async (productId: string, updates: any) => {
    const requested = (updates ?? {}) as Record<string, unknown>;
    const canAttemptLegacy = webinarSchemaSupport === 'missing';

    if (canAttemptLegacy && isWebinarPayload(requested)) {
      return { data: null, error: webinarMigrationRequiredError() };
    }

    const payload = canAttemptLegacy
      ? stripWebinarProductColumns(requested)
      : requested;

    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select()
      .single();

    if (!error) {
      if (!canAttemptLegacy && requested.product_kind) webinarSchemaSupport = 'supported';
      return { data, error: null };
    }

    if (!isWebinarSchemaMissingError(error)) {
      return { data, error };
    }

    webinarSchemaSupport = 'missing';

    if (isWebinarPayload(requested)) {
      return { data: null, error: webinarMigrationRequiredError() };
    }

    const legacyPayload = stripWebinarProductColumns(requested);
    const fallback = await supabase
      .from('products')
      .update(legacyPayload)
      .eq('id', productId)
      .select()
      .single();

    return { data: fallback.data, error: fallback.error };
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

export interface CheckoutSession {
  payment_session_id: string;
  cashfree_order_id: string;
  purchase_id: string;
}

export interface MyPurchase {
  purchase_id: string;
  product_id: string;
  product_title: string;
  product_description: string;
  product_image_url: string | null;
  content_url: string | null;
  price: number;
  currency: string;
  creator_id: string;
  creator_name: string;
  creator_handle: string;
  payment_provider: string;
  purchased_at: string;
  product_kind?: 'digital' | 'webinar' | 'session' | 'telegram';
  webinar_scheduled_at?: string | null;
  webinar_duration_minutes?: number | null;
  webinar_capacity?: number | null;
  webinar_timezone?: string | null;
  webinar_join_early_minutes?: number | null;
  webinar_join_late_minutes?: number | null;
}

export interface WebinarJoinSession {
  join_url: string;
  expires_at: string;
  scheduled_at: string;
  server_time: string;
  title: string;
}

type PaymentStatus = 'completed' | 'pending' | 'failed';

export const purchaseQueries = {
  /**
   * Creates or reuses a pending purchase row, then mints a Cashfree payment
   * session. Returns the session ID needed to open the Drop-in modal.
   */
  startCheckout: async (productId: string): Promise<{ data: CheckoutSession | null; error: Error | null }> => {
    // supabase.functions.invoke uses the FunctionsClient's internal Authorization header,
    // which is initialised with the anon key and only updated when onAuthStateChange fires.
    // That event may not have fired yet (race on first load, or after a silent token refresh),
    // so the functions client can silently send the anon key instead of the user JWT —
    // causing the Edge Function's getUser() call to return null → 401.
    //
    // Fix: read the session directly via getSession(), which reads from localStorage and
    // auto-refreshes if the access_token is expired, then pass the token explicitly.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { data: null, error: new Error('Please sign in to continue.') };
    }

    const { data, error } = await supabase.functions.invoke<CheckoutSession>(
      'create-cashfree-order',
      {
        body:    { product_id: productId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );

    if (error) {
      let message = (error as any).message as string;
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) message = body.error;
      } catch { /* ignore */ }
      return { data: null, error: new Error(message) };
    }

    return { data: data ?? null, error: null };
  },

  /**
   * Reconciliation fast-path — queries Cashfree directly for the order status.
   * Called after Drop-in onSuccess and from the /payment/return redirect page.
   */
  verifyOrder: async (cashfreeOrderId: string): Promise<{ status: PaymentStatus }> => {
    const { data: { session } } = await supabase.auth.getSession();
    const authHeader = session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : undefined;

    const { data, error } = await supabase.functions.invoke<{ status: string }>(
      'verify-cashfree-order',
      { body: { cashfree_order_id: cashfreeOrderId }, headers: authHeader }
    );
    if (error) throw error;
    return { status: (data?.status ?? 'pending') as PaymentStatus };
  },

  getMyPurchases: async () => {
    const { data, error } = await supabase.rpc('get_my_purchases');
    return { data: (data ?? []) as MyPurchase[], error };
  },

  requestWebinarJoin: async (
    purchaseId: string,
    clientSessionId: string
  ): Promise<{ data: WebinarJoinSession | null; error: Error | null }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { data: null, error: new Error('Please sign in to join webinars.') };
    }

    const { data, error } = await supabase.functions.invoke<WebinarJoinSession>(
      'generate-webinar-join-token',
      {
        body: {
          purchase_id: purchaseId,
          client_session_id: clientSessionId,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );

    if (error) {
      let message = (error as any).message as string;
      try {
        const body = await (error as any).context?.json?.();
        if (body?.error) message = body.error;
      } catch {
        // Ignore parser failures and keep default message.
      }
      return { data: null, error: new Error(message) };
    }

    return { data: data ?? null, error: null };
  },
};
