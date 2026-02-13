import { addDays, format, startOfDay, subDays, isSameDay } from 'date-fns';
import type { Transaction } from '@/integrations/supabase/client';

export type EarningsSeriesPoint = {
  date: string;
  earnings: number;
};

export type FinanceSummary = {
  availableBalance: number;
  lifetimeEarnings: number;
  monthlyEarnings: number;
  pendingWithdrawals: number;
  completedWithdrawals: number;
  earningsSeries: EarningsSeriesPoint[];
  recentTransactions: Transaction[];
};

const toDate = (value: string) => new Date(value);

export function getFinanceSummary(
  transactions: Transaction[],
  days: number = 30
): FinanceSummary {
  const completedIncome = transactions.filter(
    (txn) => txn.type === 'income' && txn.status === 'completed'
  );
  const completedWithdrawals = transactions.filter(
    (txn) => txn.type === 'withdrawal' && txn.status === 'completed'
  );
  const pendingWithdrawals = transactions.filter(
    (txn) => txn.type === 'withdrawal' && txn.status === 'pending'
  );

  const lifetimeEarnings = completedIncome.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const completedWithdrawalsTotal = completedWithdrawals.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const pendingWithdrawalsTotal = pendingWithdrawals.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );

  const availableBalance = lifetimeEarnings - completedWithdrawalsTotal;

  const startDate = startOfDay(subDays(new Date(), days - 1));
  const monthlyEarnings = completedIncome
    .filter(
      (txn) => toDate(txn.created_at).getTime() >= startDate.getTime()
    )
    .reduce((sum, txn) => sum + txn.amount, 0);

  const earningsSeries: EarningsSeriesPoint[] = Array.from({ length: days }).map(
    (_, index) => {
      const date = addDays(startDate, index);
      const earnings = completedIncome
        .filter((txn) => isSameDay(toDate(txn.created_at), date))
        .reduce((sum, txn) => sum + txn.amount, 0);

      return {
        date: format(date, 'MMM d'),
        earnings,
      };
    }
  );

  const recentTransactions = [...transactions]
    .sort((a, b) =>
      toDate(b.created_at).getTime() - toDate(a.created_at).getTime()
    )
    .slice(0, 6);

  return {
    availableBalance,
    lifetimeEarnings,
    monthlyEarnings,
    pendingWithdrawals: pendingWithdrawalsTotal,
    completedWithdrawals: completedWithdrawalsTotal,
    earningsSeries,
    recentTransactions,
  };
}
