import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useWallet } from '@/integrations/supabase/hooks';
import type { Transaction, Wallet } from '@/integrations/supabase/client';
import { getFinanceSummary } from '@/lib/finance';

export function useCreatorFinance() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? '';

  const walletQuery = useWallet(userId);
  const wallet = walletQuery.data?.data as Wallet | undefined;
  const walletId = wallet?.id ?? '';

  const transactionsQuery = useTransactions(walletId);
  const transactions = (transactionsQuery.data?.data ?? []) as Transaction[];

  const summary = useMemo(
    () => getFinanceSummary(transactions),
    [transactions]
  );

  return {
    user,
    wallet,
    transactions,
    summary,
    isLoading: authLoading || walletQuery.isLoading || transactionsQuery.isLoading,
    error: walletQuery.error || transactionsQuery.error,
  };
}
