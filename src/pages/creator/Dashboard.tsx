import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Package,
  Settings,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useCreatorFinance } from '@/hooks/use-finance';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useProducts } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import CreatorLayout from '@/components/layout/CreatorLayout';

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-emerald-400">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const { summary, isLoading } = useCreatorFinance();
  const profileQuery = useProfile(user?.id || '');
  const productsQuery = useProducts(user?.id || '');
  const profile = profileQuery.data?.data;
  const products = productsQuery.data?.data || [];
  const recentTransactions = summary.recentTransactions;

  const [copied, setCopied] = useState(false);

  const val = (v: number) => (isLoading ? '—' : formatCurrency(v));
  const storefrontUrl = profile?.handle ? `${window.location.origin}/${profile.handle}` : '';

  const handleCopyLink = () => {
    if (storefrontUrl) {
      navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const kpis = [
    { label: 'Available Balance', value: val(summary.availableBalance), sub: 'Ready to withdraw', icon: IndianRupee, gradient: 'from-emerald-500/20 to-emerald-600/5', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400' },
    { label: 'Monthly Earnings', value: val(summary.monthlyEarnings), sub: 'Last 30 days', icon: TrendingUp, gradient: 'from-blue-500/20 to-blue-600/5', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400' },
    { label: 'Lifetime Earnings', value: val(summary.lifetimeEarnings), sub: 'All time', icon: Calendar, gradient: 'from-violet-500/20 to-violet-600/5', iconBg: 'bg-violet-500/15', iconColor: 'text-violet-400' },
    { label: 'Pending Withdrawals', value: val(summary.pendingWithdrawals), sub: 'Awaiting approval', icon: Clock, gradient: 'from-amber-500/20 to-amber-600/5', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400' },
  ];

  return (
    <CreatorLayout>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {isLoading ? 'Dashboard' : `Welcome back, ${profile?.display_name?.split(' ')[0] || 'Creator'}`}
          </h1>
          <p className="text-slate-500 text-sm">Here's how your store is performing</p>
        </div>
        <div className="flex items-center gap-3">
          {storefrontUrl && (
            <button onClick={handleCopyLink} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          )}
          {storefrontUrl && (
            <Link to={`/${profile?.handle}`} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-sm text-slate-300 hover:bg-slate-700/60 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
              Storefront
            </Link>
          )}
          <Link to="/creator/products" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-sm font-medium text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 transition-all">
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.4 }}
            className={`relative overflow-hidden rounded-2xl border border-slate-800/60 bg-gradient-to-br ${kpi.gradient} backdrop-blur-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">{kpi.value}</div>
            <p className="text-xs text-slate-500">{kpi.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart + Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="lg:col-span-3 bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Earnings Overview</h2>
              <p className="text-xs text-slate-500 mt-0.5">Last 30 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5" />
              Revenue
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={summary.earningsSeries}>
              <defs>
                <linearGradient id="dashEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#dashEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            <Link to="/creator/wallet" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</Link>
          </div>
          <div className="flex-1 space-y-3 overflow-auto">
            {recentTransactions.length === 0 && !isLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-10">No transactions yet</div>
            ) : (
              recentTransactions.slice(0, 6).map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 py-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
                    {tx.type === 'income' ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.source}</p>
                    <p className="text-xs text-slate-500">{formatTimeAgo(tx.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Products + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Your Products</h2>
              <p className="text-xs text-slate-500 mt-0.5">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
            </div>
            <Link to="/creator/products" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Manage →</Link>
          </div>
          {products.length === 0 ? (
            <div className="text-center py-10">
              <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-3">No products yet</p>
              <Link to="/creator/products" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 transition-colors">
                <Plus className="w-4 h-4" />Create your first product
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {products.slice(0, 5).map((product: any) => (
                <div key={product.id} className="flex items-center justify-between py-3 px-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{product.title}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[300px]">{product.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(product.price)}</p>
                    <p className={`text-xs ${product.is_active ? 'text-emerald-400' : 'text-slate-600'}`}>{product.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
              ))}
              {products.length > 5 && (
                <Link to="/creator/products" className="block text-center text-xs text-slate-500 hover:text-slate-300 py-2 transition-colors">
                  +{products.length - 5} more
                </Link>
              )}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/creator/wallet" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center"><IndianRupee className="w-4 h-4 text-emerald-400" /></div>
              <div><p className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">Withdraw</p><p className="text-xs text-slate-500">Send money to your bank</p></div>
            </Link>
            <Link to="/creator/products" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center"><Plus className="w-4 h-4 text-blue-400" /></div>
              <div><p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Add Product</p><p className="text-xs text-slate-500">List a product or service</p></div>
            </Link>
            <button onClick={handleCopyLink} className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 transition-all group text-left">
              <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center">{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}</div>
              <div><p className="text-sm font-medium text-white group-hover:text-violet-400 transition-colors">{copied ? 'Link Copied!' : 'Share Storefront'}</p><p className="text-xs text-slate-500">Copy your public link</p></div>
            </button>
            <Link to="/creator/settings" className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center"><Settings className="w-4 h-4 text-amber-400" /></div>
              <div><p className="text-sm font-medium text-white group-hover:text-amber-400 transition-colors">Settings</p><p className="text-xs text-slate-500">Update profile & socials</p></div>
            </Link>
          </div>
        </motion.div>
      </div>
    </CreatorLayout>
  );
}
