import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Download,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Wallet as WalletIcon,
  TrendingUp,
} from 'lucide-react';
import { useCreatorFinance } from '@/hooks/use-finance';
import { useCreateTransaction } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import { toast } from 'sonner';
import CreatorLayout from '@/components/layout/CreatorLayout';

export default function Wallet() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('upi');
  const { transactions, summary, wallet, isLoading } = useCreatorFinance();
  const createTransaction = useCreateTransaction();

  const availableBalance = summary.availableBalance;
  const pendingBalance = summary.pendingWithdrawals;
  const totalEarnings = summary.lifetimeEarnings;

  const withdrawValue = Number(withdrawAmount || 0);
  const withdrawError = useMemo(() => {
    if (!withdrawAmount) return '';
    if (Number.isNaN(withdrawValue) || withdrawValue <= 0) return 'Enter a valid amount.';
    if (withdrawValue > availableBalance) return 'Amount exceeds available balance.';
    return '';
  }, [withdrawAmount, withdrawValue, availableBalance]);

  const handleWithdraw = async () => {
    if (!wallet?.id) { toast.error('Wallet not found.'); return; }
    if (withdrawError || !withdrawValue) { toast.error(withdrawError || 'Enter a valid amount.'); return; }

    const { error } = await createTransaction.mutateAsync({
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: withdrawValue,
      currency: 'INR',
      source: withdrawMethod === 'upi' ? 'UPI Transfer' : withdrawMethod === 'imps' ? 'IMPS/NEFT' : 'Bank Transfer',
      status: 'pending',
    });

    if (error) { toast.error(error.message || 'Withdrawal failed.'); return; }
    toast.success('Withdrawal request submitted!');
    setWithdrawAmount('');
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'pending': return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'failed': return <XCircle className="w-3.5 h-3.5 text-red-400" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/10';
      case 'pending': return 'text-amber-400 bg-amber-500/10';
      case 'failed': return 'text-red-400 bg-red-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <CreatorLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Wallet</h1>
        <p className="text-slate-500 text-sm">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Available Balance</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{isLoading ? '—' : formatCurrency(availableBalance)}</div>
          <p className="text-xs text-slate-500">Ready to withdraw</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-amber-500/20 to-amber-600/5 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{isLoading ? '—' : formatCurrency(pendingBalance)}</div>
          <p className="text-xs text-slate-500">Processing</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-2xl border border-slate-800/60 bg-gradient-to-br from-violet-500/20 to-violet-600/5 backdrop-blur-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Earned</span>
            <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">{isLoading ? '—' : formatCurrency(totalEarnings)}</div>
          <p className="text-xs text-slate-500">All time</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Withdraw Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Send className="w-5 h-5 text-emerald-400" />
            Withdraw Funds
          </h2>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Amount</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors text-lg font-medium"
                />
              </div>
              <p className="text-xs text-slate-500">
                Available: {isLoading ? '—' : formatCurrency(availableBalance)}
              </p>
              {withdrawError && <p className="text-xs text-red-400">{withdrawError}</p>}
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setWithdrawAmount(String(amt))}
                  className="flex-1 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300 hover:bg-slate-700/60 hover:text-white transition-colors"
                >
                  ₹{amt.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Method */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'upi', label: 'UPI' },
                  { key: 'bank', label: 'Bank Transfer' },
                  { key: 'imps', label: 'IMPS/NEFT' },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setWithdrawMethod(m.key)}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all ${withdrawMethod === m.key
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:text-white'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || !!withdrawError || isLoading || createTransaction.isPending}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createTransaction.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Withdraw Funds</>
              )}
            </button>

            <p className="text-xs text-slate-600 text-center">
              Withdrawals typically take 2–5 business days
            </p>
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="lg:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-800/40">
            <div>
              <h2 className="text-lg font-semibold text-white">Transaction History</h2>
              <p className="text-xs text-slate-500 mt-0.5">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''}</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>

          <div className="divide-y divide-slate-800/30">
            {!isLoading && transactions.length === 0 ? (
              <div className="text-center py-16">
                <WalletIcon className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 text-sm">No transactions yet</p>
                <p className="text-slate-600 text-xs mt-1">Earnings from product sales will appear here</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/15' : 'bg-amber-500/15'
                      }`}>
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{tx.source}</p>
                      <p className="text-xs text-slate-500">{formatTimeAgo(tx.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusColor(tx.status)}`}>
                      {statusIcon(tx.status)}
                      <span className="capitalize">{tx.status}</span>
                    </span>
                    <span className={`text-sm font-semibold min-w-[80px] text-right ${tx.type === 'income' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </CreatorLayout>
  );
}
