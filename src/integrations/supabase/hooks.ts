import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authQueries, userQueries, walletQueries, productQueries, transactionQueries, adminQueries } from './queries';

// Auth hooks
export const useSignUp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password, handle, displayName }: any) =>
      authQueries.signUp(email, password, handle, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useSignIn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authQueries.signIn(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authQueries.signOut,
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authQueries.getCurrentUser,
  });
};

// User profile hooks
export const useProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => userQueries.getProfile(userId),
    enabled: !!userId,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
};

export const useProfileByHandle = (handle: string) => {
  return useQuery({
    queryKey: ['profile', 'handle', handle],
    queryFn: () => userQueries.getProfileByHandle(handle),
    enabled: !!handle,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: any }) =>
      userQueries.updateProfile(userId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
    },
  });
};

export const useUpdateCommission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, commissionRate }: { userId: string; commissionRate: number }) =>
      userQueries.updateCommissionRate(userId, commissionRate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useCheckHandle = (handle: string) => {
  return useQuery({
    queryKey: ['checkHandle', handle],
    queryFn: () => userQueries.checkHandleAvailability(handle),
    enabled: handle.length >= 3,
    staleTime: 500,
  });
};

// Wallet hooks
export const useWallet = (userId: string) => {
  return useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => walletQueries.getWallet(userId),
    enabled: !!userId,
  });
};

export const useTransactions = (walletId: string) => {
  return useQuery({
    queryKey: ['transactions', walletId],
    queryFn: () => walletQueries.getTransactions(walletId),
    enabled: !!walletId,
  });
};

export const useWithdrawals = (walletId: string, status?: string) => {
  return useQuery({
    queryKey: ['withdrawals', walletId, status],
    queryFn: () => transactionQueries.getWithdrawals(walletId, status),
    enabled: !!walletId,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionQueries.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ transactionId, updates }: { transactionId: string; updates: any }) =>
      transactionQueries.updateTransaction(transactionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};

// Product hooks
export const useProducts = (userId: string, includeInactive = false) => {
  return useQuery({
    queryKey: ['products', userId, includeInactive],
    queryFn: () => productQueries.getProducts(userId, includeInactive),
    enabled: !!userId,
  });
};

export const usePublicProducts = (creatorId: string) => {
  return useQuery({
    queryKey: ['products', 'public', creatorId],
    queryFn: () => productQueries.getPublicProductsByCreatorId(creatorId),
    enabled: !!creatorId,
  });
};

export const useAdminData = () => {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const [users, wallets, transactions, products, clients, purchases, visits] = await Promise.all([
        adminQueries.getUsers(),
        adminQueries.getWallets(),
        adminQueries.getTransactions(),
        adminQueries.getProducts(),
        adminQueries.getClients(),
        adminQueries.getPurchases(),
        adminQueries.getVisits(),
      ]);

      return {
        users: users.data ?? [],
        wallets: wallets.data ?? [],
        transactions: transactions.data ?? [],
        products: products.data ?? [],
        clients: clients.data ?? [],
        purchases: purchases.data ?? [],
        visits: visits.data ?? [],
      };
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productQueries.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, updates }: { productId: string; updates: any }) =>
      productQueries.updateProduct(productId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: productQueries.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
