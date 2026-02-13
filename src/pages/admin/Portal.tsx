import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Settings,
  BarChart3,
  Globe,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Eye,
  UserCheck,
  Package,
  ArrowUpRight,
  Check,
  Loader2,
  User,
  Store,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminData, useUpdateCommission, useUpdateTransaction } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

type TabKey = 'overview' | 'creators' | 'products' | 'users' | 'withdrawals' | 'commission' | 'traffic' | 'demographics';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'creators', label: 'Creators', icon: Users },
  { key: 'products', label: 'Products', icon: Store },
  { key: 'users', label: 'Users & Purchases', icon: ShoppingCart },
  { key: 'withdrawals', label: 'Withdrawals', icon: Wallet },
  { key: 'commission', label: 'Commission', icon: Settings },
  { key: 'traffic', label: 'Traffic', icon: BarChart3 },
  { key: 'demographics', label: 'Demographics', icon: Globe },
];

const CHART_COLORS = ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb923c', '#2dd4bf'];

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [search, setSearch] = useState('');
  const [expandedCreator, setExpandedCreator] = useState<string | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<Record<string, string>>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [productPurchases, setProductPurchases] = useState<Record<string, any[]>>({});
  const [loadingPurchases, setLoadingPurchases] = useState<string | null>(null);

  const adminQuery = useAdminData();
  const updateCommission = useUpdateCommission();
  const updateTransaction = useUpdateTransaction();

  const { users, wallets, transactions, products, clients, purchases, visits } =
    adminQuery.data ?? {
      users: [],
      wallets: [],
      transactions: [],
      products: [],
      clients: [],
      purchases: [],
      visits: [],
    };

  const creators = users.filter((u: any) => !u.is_admin && !u.is_owner);
  const walletsByUser = new Map(wallets.map((w: any) => [w.user_id, w]));

  const creatorMetrics = useMemo(() => {
    return creators.map((creator: any) => {
      const w = walletsByUser.get(creator.id);
      const txns = transactions.filter((t: any) => t.wallet_id === w?.id);
      const prods = products.filter((p: any) => p.creator_id === creator.id);
      const clis = clients.filter((c: any) => c.creator_id === creator.id);
      const purch = purchases.filter((p: any) => p.creator_id === creator.id);
      const income = txns.filter((t: any) => t.type === 'income' && t.status === 'completed');
      const pendingW = txns.filter((t: any) => t.type === 'withdrawal' && t.status === 'pending');
      const lifetimeEarnings = income.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const pendingAmount = pendingW.reduce((s: number, t: any) => s + Number(t.amount || 0), 0);
      const rate = Number(creator.commission_rate ?? 0.2);
      return {
        creator,
        wallet: w,
        products: prods,
        clients: clis,
        purchases: purch,
        transactions: txns,
        lifetimeEarnings,
        pendingWithdrawals: pendingAmount,
        commissionEarned: lifetimeEarnings * rate,
      };
    });
  }, [creators, wallets, transactions, products, clients, purchases]);

  const totalRevenue = creatorMetrics.reduce((s, m) => s + m.lifetimeEarnings, 0);
  const totalCommission = creatorMetrics.reduce((s, m) => s + m.commissionEarned, 0);
  const totalPendingWithdrawals = transactions.filter(
    (t: any) => t.type === 'withdrawal' && t.status === 'pending'
  );
  const totalPendingAmount = totalPendingWithdrawals.reduce(
    (s: number, t: any) => s + Number(t.amount || 0),
    0
  );

  // Revenue over time (group income transactions by date)
  const revenueOverTime = useMemo(() => {
    const byDate: Record<string, number> = {};
    transactions
      .filter((t: any) => t.type === 'income' && t.status === 'completed')
      .forEach((t: any) => {
        const d = new Date(t.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        byDate[d] = (byDate[d] || 0) + Number(t.amount || 0);
      });
    return Object.entries(byDate)
      .slice(-14)
      .map(([date, amount]) => ({ date, amount }));
  }, [transactions]);

  // Traffic over time
  const trafficOverTime = useMemo(() => {
    const byDate: Record<string, number> = {};
    visits.forEach((v: any) => {
      const d = new Date(v.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      byDate[d] = (byDate[d] || 0) + 1;
    });
    return Object.entries(byDate)
      .slice(-14)
      .map(([date, count]) => ({ date, count }));
  }, [visits]);

  // Top pages
  const topPages = useMemo(() => {
    const byPath: Record<string, number> = {};
    visits.forEach((v: any) => {
      byPath[v.path] = (byPath[v.path] || 0) + 1;
    });
    return Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([path, count]) => ({ path, count }));
  }, [visits]);

  // Referrer breakdown
  const referrerData = useMemo(() => {
    const byRef: Record<string, number> = {};
    visits.forEach((v: any) => {
      const ref = v.referrer || 'Direct';
      byRef[ref] = (byRef[ref] || 0) + 1;
    });
    return Object.entries(byRef)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [visits]);

  // Device breakdown
  const deviceData = useMemo(() => {
    const byDev: Record<string, number> = {};
    visits.forEach((v: any) => {
      const dev = v.device || 'Unknown';
      byDev[dev] = (byDev[dev] || 0) + 1;
    });
    return Object.entries(byDev).map(([name, value]) => ({ name, value }));
  }, [visits]);

  // Gender breakdown
  const genderData = useMemo(() => {
    const byGender: Record<string, number> = {};
    clients.forEach((c: any) => {
      const g = c.gender || 'Unknown';
      byGender[g] = (byGender[g] || 0) + 1;
    });
    return Object.entries(byGender).map(([name, value]) => ({ name, value }));
  }, [clients]);

  // Location breakdown
  const locationData = useMemo(() => {
    const byLoc: Record<string, number> = {};
    clients.forEach((c: any) => {
      const loc = c.location || 'Unknown';
      byLoc[loc] = (byLoc[loc] || 0) + 1;
    });
    visits.forEach((v: any) => {
      if (v.city || v.country) {
        const loc = [v.city, v.country].filter(Boolean).join(', ');
        byLoc[loc] = (byLoc[loc] || 0) + 1;
      }
    });
    return Object.entries(byLoc)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  }, [clients, visits]);

  const handleCommissionSave = async (creatorId: string) => {
    const value = editingCommission[creatorId];
    if (!value && value !== '0') {
      toast.error('Enter a commission rate.');
      return;
    }
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 30) {
      toast.error('Commission must be between 0% and 30%.');
      return;
    }
    const rate = parsed / 100;
    const { error } = await updateCommission.mutateAsync({
      userId: creatorId,
      commissionRate: rate,
    });
    if (error) {
      toast.error(error.message || 'Failed to update commission.');
      return;
    }
    toast.success('Commission rate updated.');
    setEditingCommission((prev) => {
      const next = { ...prev };
      delete next[creatorId];
      return next;
    });
  };

  const handleWithdrawalComplete = async (transactionId: string) => {
    const { error } = await updateTransaction.mutateAsync({
      transactionId,
      updates: { status: 'completed' },
    });
    if (error) {
      toast.error(error.message || 'Failed to update withdrawal.');
      return;
    }
    toast.success('Withdrawal marked as completed.');
  };

  // Filter creators by search
  const filteredCreators = creatorMetrics.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.creator.display_name?.toLowerCase().includes(q) ||
      m.creator.handle?.toLowerCase().includes(q) ||
      m.creator.email?.toLowerCase().includes(q)
    );
  });

  // Filter clients by search
  const filteredClients = clients.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
  });

  // Card component
  const KPICard = ({
    icon: Icon,
    label,
    value,
    color = 'text-white',
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color?: string;
  }) => (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );

  // Custom tooltip for charts
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-xl px-4 py-2.5 shadow-xl">
        <p className="text-sm text-slate-300 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-sm font-semibold text-white">
            {typeof p.value === 'number' && p.name === 'amount'
              ? formatCurrency(p.value)
              : p.value}
          </p>
        ))}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={DollarSign} label="Total Revenue" value={formatCurrency(totalRevenue)} color="text-emerald-300" />
        <KPICard icon={TrendingUp} label="Platform Commission" value={formatCurrency(totalCommission)} color="text-amber-300" />
        <KPICard icon={Wallet} label="Pending Withdrawals" value={formatCurrency(totalPendingAmount)} color="text-rose-300" />
        <KPICard icon={UserCheck} label="Active Creators" value={creators.length} />
        <KPICard icon={Users} label="Total Clients" value={clients.length} />
        <KPICard icon={Eye} label="Total Traffic" value={visits.length} />
      </div>

      {/* Revenue chart */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend</h3>
        {revenueOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueOverTime}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="amount" stroke="#34d399" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500">No revenue data yet</div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {transactions.length === 0 && (
            <p className="text-slate-500 text-sm">No transactions yet.</p>
          )}
          {transactions.slice(0, 8).map((txn: any) => {
            const w = wallets.find((wl: any) => wl.id === txn.wallet_id);
            const u = users.find((us: any) => us.id === w?.user_id);
            return (
              <div
                key={txn.id}
                className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                      }`}
                  >
                    {txn.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <Wallet className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{txn.source}</p>
                    <p className="text-xs text-slate-500">
                      {u?.display_name || 'Unknown'} • {formatTimeAgo(txn.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-semibold ${txn.type === 'income' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                  >
                    {txn.type === 'income' ? '+' : '-'}
                    {formatCurrency(Number(txn.amount))}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{txn.status}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCreators = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          placeholder="Search creators by name, handle, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredCreators.length === 0 && !adminQuery.isLoading && (
        <div className="text-center py-12 text-slate-500">No creators found.</div>
      )}

      <div className="space-y-3">
        {filteredCreators.map((item) => {
          const isExpanded = expandedCreator === item.creator.id;
          const rate = Number(item.creator.commission_rate ?? 0.2) * 100;
          return (
            <div
              key={item.creator.id}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/60 transition-all"
            >
              <button
                className="w-full p-5 flex items-center justify-between text-left"
                onClick={() => setExpandedCreator(isExpanded ? null : item.creator.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {(item.creator.display_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{item.creator.display_name}</p>
                    <p className="text-sm text-slate-400">@{item.creator.handle} • {item.creator.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:grid grid-cols-4 gap-6 text-right text-sm">
                    <div>
                      <p className="text-slate-500">Earnings</p>
                      <p className="text-white font-semibold">{formatCurrency(item.lifetimeEarnings)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Pending</p>
                      <p className="text-amber-400 font-semibold">{formatCurrency(item.pendingWithdrawals)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Products</p>
                      <p className="text-white font-semibold">{item.products.length}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Clients</p>
                      <p className="text-white font-semibold">{item.clients.length}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-800/60 pt-4 space-y-5">
                      {/* Mobile stats */}
                      <div className="grid grid-cols-2 gap-3 md:hidden text-sm">
                        <div className="bg-slate-800/40 rounded-xl p-3">
                          <p className="text-slate-500">Earnings</p>
                          <p className="text-white font-semibold">{formatCurrency(item.lifetimeEarnings)}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-3">
                          <p className="text-slate-500">Pending</p>
                          <p className="text-amber-400 font-semibold">{formatCurrency(item.pendingWithdrawals)}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-3">
                          <p className="text-slate-500">Products</p>
                          <p className="text-white font-semibold">{item.products.length}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-3">
                          <p className="text-slate-500">Clients</p>
                          <p className="text-white font-semibold">{item.clients.length}</p>
                        </div>
                      </div>

                      {/* Commission */}
                      <div className="bg-slate-800/30 rounded-xl p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                          <div>
                            <p className="text-sm text-slate-400">Commission Rate</p>
                            <p className="text-emerald-400 font-semibold">{rate.toFixed(0)}% • Earned {formatCurrency(item.commissionEarned)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={0}
                              max={30}
                              step={1}
                              className="w-28 accent-emerald-500"
                              value={editingCommission[item.creator.id] ?? rate}
                              onChange={(e) =>
                                setEditingCommission((prev) => ({
                                  ...prev,
                                  [item.creator.id]: e.target.value,
                                }))
                              }
                            />
                            <span className="text-sm text-white font-mono w-10 text-right">
                              {editingCommission[item.creator.id] ?? rate.toFixed(0)}%
                            </span>
                            <button
                              className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50"
                              onClick={() => handleCommissionSave(item.creator.id)}
                              disabled={updateCommission.isPending}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Products */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Products ({item.products.length})</h4>
                        {item.products.length === 0 ? (
                          <p className="text-sm text-slate-500">No products listed.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.products.map((prod: any) => (
                              <div key={prod.id} className="bg-slate-800/40 rounded-xl p-3 flex items-center gap-3">
                                <Package className="w-4 h-4 text-slate-500 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm text-white truncate">{prod.title}</p>
                                  <p className="text-xs text-slate-500">{formatCurrency(Number(prod.price))} • {prod.is_active ? 'Active' : 'Inactive'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Clients */}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Clients ({item.clients.length})</h4>
                        {item.clients.length === 0 ? (
                          <p className="text-sm text-slate-500">No clients yet.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {item.clients.slice(0, 5).map((cli: any) => {
                              const cliPurch = item.purchases.filter((p: any) => p.client_id === cli.id);
                              return (
                                <div key={cli.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 text-sm">
                                  <div>
                                    <span className="text-white">{cli.name}</span>
                                    <span className="text-slate-500 ml-2">{cli.email || ''}</span>
                                  </div>
                                  <span className="text-slate-400">{cliPurch.length} purchase{cliPurch.length !== 1 ? 's' : ''}</span>
                                </div>
                              );
                            })}
                            {item.clients.length > 5 && (
                              <p className="text-xs text-slate-500 pl-3">+{item.clients.length - 5} more</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          placeholder="Search clients by name, email, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 && !adminQuery.isLoading && (
        <div className="text-center py-12 text-slate-500">No clients found.</div>
      )}

      <div className="space-y-3">
        {filteredClients.map((client: any) => {
          const clientPurchases = purchases.filter((p: any) => p.client_id === client.id);
          const isExpanded = expandedClient === client.id;
          return (
            <div
              key={client.id}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl overflow-hidden hover:border-slate-700/60 transition-all"
            >
              <button
                className="w-full p-5 flex items-center justify-between text-left"
                onClick={() => setExpandedClient(isExpanded ? null : client.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {(client.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{client.name}</p>
                    <p className="text-sm text-slate-400">
                      {client.email || 'No email'} • {client.location || 'Unknown'} • {client.gender || 'Gender N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-slate-500">Purchases</p>
                    <p className="text-white font-semibold">{clientPurchases.length}</p>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-800/60 pt-4">
                      {clientPurchases.length === 0 ? (
                        <p className="text-sm text-slate-500">No purchases recorded.</p>
                      ) : (
                        <div className="space-y-2">
                          {clientPurchases.map((p: any) => {
                            const prod = products.find((pr: any) => pr.id === p.product_id);
                            const creator = users.find((u: any) => u.id === p.creator_id);
                            return (
                              <div key={p.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl p-3 text-sm">
                                <div>
                                  <p className="text-white">{prod?.title || 'Unknown Product'}</p>
                                  <p className="text-xs text-slate-500">from {creator?.display_name || 'Unknown Creator'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-emerald-400 font-semibold">{formatCurrency(Number(p.amount))}</p>
                                  <p className="text-xs text-slate-500">{formatTimeAgo(p.created_at)}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderWithdrawals = () => {
    const pending = transactions.filter(
      (t: any) => t.type === 'withdrawal' && t.status === 'pending'
    );
    const completed = transactions.filter(
      (t: any) => t.type === 'withdrawal' && t.status === 'completed'
    );

    const renderWithdrawalRow = (txn: any, showAction: boolean) => {
      const w = wallets.find((wl: any) => wl.id === txn.wallet_id);
      const u = users.find((us: any) => us.id === w?.user_id);
      return (
        <div
          key={txn.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/40 rounded-xl p-4 gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
              {(u?.display_name || '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-medium">{u?.display_name || 'Unknown'}</p>
              <p className="text-xs text-slate-500">{txn.source} • {formatTimeAgo(txn.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-amber-400 font-bold text-lg">{formatCurrency(Number(txn.amount))}</p>
            {showAction && (
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50"
                onClick={() => handleWithdrawalComplete(txn.id)}
                disabled={updateTransaction.isPending}
              >
                <Check className="w-4 h-4" />
                Complete
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            icon={Wallet}
            label="Pending Amount"
            value={formatCurrency(totalPendingAmount)}
            color="text-amber-300"
          />
          <KPICard
            icon={Check}
            label="Pending Requests"
            value={pending.length}
          />
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Pending Withdrawals</h3>
          {pending.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending withdrawals.</p>
          ) : (
            <div className="space-y-3">{pending.map((t: any) => renderWithdrawalRow(t, true))}</div>
          )}
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Completed Withdrawals</h3>
          {completed.length === 0 ? (
            <p className="text-slate-500 text-sm">No completed withdrawals yet.</p>
          ) : (
            <div className="space-y-3">{completed.slice(0, 10).map((t: any) => renderWithdrawalRow(t, false))}</div>
          )}
        </div>
      </div>
    );
  };

  const renderCommission = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard
          icon={DollarSign}
          label="Total Platform Earnings"
          value={formatCurrency(totalCommission)}
          color="text-amber-300"
        />
        <KPICard
          icon={Users}
          label="Creators Managed"
          value={creators.length}
        />
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Commission Rate per Creator</h3>
        <p className="text-sm text-slate-500 mb-6">Default is 20%. Adjustable from 0% to 30%.</p>

        {creators.length === 0 && (
          <p className="text-slate-500 text-sm">No creators found.</p>
        )}

        <div className="space-y-4">
          {creatorMetrics.map((item) => {
            const rate = Number(item.creator.commission_rate ?? 0.2) * 100;
            const currentVal = editingCommission[item.creator.id] ?? rate;
            return (
              <div
                key={item.creator.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-800/30 rounded-xl p-4 gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                    {(item.creator.display_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{item.creator.display_name}</p>
                    <p className="text-xs text-slate-500">
                      Earned {formatCurrency(item.lifetimeEarnings)} • Commission {formatCurrency(item.commissionEarned)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={1}
                    className="w-36 accent-emerald-500"
                    value={currentVal}
                    onChange={(e) =>
                      setEditingCommission((prev) => ({
                        ...prev,
                        [item.creator.id]: e.target.value,
                      }))
                    }
                  />
                  <span className="text-lg font-bold text-white font-mono w-12 text-right">{Number(currentVal).toFixed(0)}%</span>
                  <button
                    className="px-4 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors disabled:opacity-50"
                    onClick={() => handleCommissionSave(item.creator.id)}
                    disabled={updateCommission.isPending}
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTraffic = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon={Eye} label="Total Visits" value={visits.length} color="text-blue-300" />
        <KPICard icon={Globe} label="Unique Paths" value={topPages.length} />
        <KPICard icon={BarChart3} label="Referrer Sources" value={referrerData.length} />
      </div>

      {/* Visits over time */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Visits Over Time</h3>
        {trafficOverTime.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trafficOverTime}>
              <defs>
                <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#60a5fa" fill="url(#visitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-slate-500">No visit data yet</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Top Pages</h3>
          {topPages.length === 0 ? (
            <p className="text-slate-500 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {topPages.map((page, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/40 last:border-0">
                  <span className="text-sm text-slate-300 truncate max-w-[70%]">{page.path}</span>
                  <span className="text-sm text-white font-semibold">{page.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrer breakdown */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Referrer Sources</h3>
          {referrerData.length === 0 ? (
            <p className="text-slate-500 text-sm">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={referrerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={100} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" fill="#60a5fa" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Device breakdown */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Device Breakdown</h3>
        {deviceData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-slate-500">No device data</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                  {deviceData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {deviceData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-slate-300">{d.name}</span>
                  <span className="text-white font-semibold ml-auto">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderDemographics = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Gender Distribution</h3>
          {genderData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500">No gender data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {genderData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {genderData.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-300 capitalize">{g.name}</span>
                    <span className="text-white font-semibold ml-auto">{g.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Device (from visits) */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Device Types</h3>
          {deviceData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-slate-500">No device data</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={0}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {deviceData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[(i + 3) % CHART_COLORS.length] }} />
                    <span className="text-slate-300">{d.name}</span>
                    <span className="text-white font-semibold ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location table */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Locations</h3>
        {locationData.length === 0 ? (
          <p className="text-slate-500 text-sm">No location data yet.</p>
        ) : (
          <div className="space-y-2">
            {locationData.map((loc, i) => {
              const maxVal = locationData[0]?.count || 1;
              const pct = (loc.count / maxVal) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-slate-300 w-40 truncate">{loc.location}</span>
                  <div className="flex-1 h-6 bg-slate-800/40 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-semibold w-10 text-right">{loc.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-creator demographics */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Demographics by Creator</h3>
        {creatorMetrics.length === 0 ? (
          <p className="text-slate-500 text-sm">No creators found.</p>
        ) : (
          <div className="space-y-4">
            {creatorMetrics.map((item) => {
              const creatorGender: Record<string, number> = {};
              const creatorLoc: Record<string, number> = {};
              item.clients.forEach((c: any) => {
                creatorGender[c.gender || 'Unknown'] = (creatorGender[c.gender || 'Unknown'] || 0) + 1;
                creatorLoc[c.location || 'Unknown'] = (creatorLoc[c.location || 'Unknown'] || 0) + 1;
              });
              return (
                <div key={item.creator.id} className="bg-slate-800/30 rounded-xl p-4">
                  <p className="text-white font-semibold mb-2">{item.creator.display_name} <span className="text-slate-500 font-normal text-sm">@{item.creator.handle}</span></p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Gender: </span>
                      {Object.entries(creatorGender).map(([g, c], i) => (
                        <span key={i} className="text-slate-300">
                          {g}: {c}{i < Object.entries(creatorGender).length - 1 ? ', ' : ''}
                        </span>
                      ))}
                      {item.clients.length === 0 && <span className="text-slate-500">No data</span>}
                    </div>
                    <div>
                      <span className="text-slate-500">Locations: </span>
                      {Object.entries(creatorLoc)
                        .slice(0, 3)
                        .map(([l, c], i, arr) => (
                          <span key={i} className="text-slate-300">
                            {l} ({c}){i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      {item.clients.length === 0 && <span className="text-slate-500">No data</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );


  // ── Products Tab helpers ──
  const handleLoadPurchases = async (productId: string) => {
    if (expandedProduct === productId) {
      setExpandedProduct(null);
      return;
    }
    setExpandedProduct(productId);
    if (productPurchases[productId]) return;
    setLoadingPurchases(productId);
    try {
      const { data, error } = await supabase.rpc('get_product_purchases', { target_product_id: productId });
      if (error) throw error;
      setProductPurchases((prev) => ({ ...prev, [productId]: data ?? [] }));
    } catch (e: any) {
      toast.error(e.message || 'Failed to load purchases.');
    } finally {
      setLoadingPurchases(null);
    }
  };

  const renderProducts = () => {
    const allProducts = products as any[];
    const filtered = allProducts.filter(
      (p: any) =>
        p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
        (users.find((u: any) => u.id === p.creator_id)?.display_name ?? '')
          .toLowerCase()
          .includes(productSearch.toLowerCase())
    );
    const activeProducts = allProducts.filter((p: any) => p.is_active);
    const totalProductRevenue = purchases
      .filter((pu: any) => pu.status === 'completed')
      .reduce((s: number, pu: any) => s + Number(pu.amount || 0), 0);

    return (
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Products', value: allProducts.length, color: 'from-blue-500/20 to-blue-600/5', text: 'text-blue-400' },
            { label: 'Active Products', value: activeProducts.length, color: 'from-emerald-500/20 to-emerald-600/5', text: 'text-emerald-400' },
            { label: 'Product Revenue', value: formatCurrency(totalProductRevenue), color: 'from-amber-500/20 to-amber-600/5', text: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-xl border border-slate-800/60 p-5`}>
              <p className="text-slate-400 text-xs mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search products or creator name..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800/60 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
        </div>

        {/* Products List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-slate-800/40 rounded-xl">
              <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500">No products found</p>
            </div>
          ) : (
            filtered.map((product: any) => {
              const creator = users.find((u: any) => u.id === product.creator_id);
              const productPurchasesList = purchases.filter(
                (pu: any) => pu.product_id === product.id && pu.status === 'completed'
              );
              const revenue = productPurchasesList.reduce((s: number, pu: any) => s + Number(pu.amount || 0), 0);
              const isExpanded = expandedProduct === product.id;

              return (
                <div key={product.id} className="bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden">
                  {/* Product Row */}
                  <button
                    onClick={() => handleLoadPurchases(product.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-800/30 transition-colors text-left"
                  >
                    {/* Image */}
                    <div className="w-14 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate">{product.title}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${product.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700/50 text-slate-500'}`}>
                          {product.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        by <span className="text-slate-400">{creator?.display_name ?? 'Unknown'}</span> • @{creator?.handle ?? '—'}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Price</p>
                        <p className="text-sm font-semibold text-emerald-400">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Purchases</p>
                        <p className="text-sm font-semibold text-white">{productPurchasesList.length}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Revenue</p>
                        <p className="text-sm font-semibold text-amber-400">{formatCurrency(revenue)}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Purchase History */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-slate-800/40"
                      >
                        <div className="p-5 bg-slate-950/50">
                          <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ShoppingCart className="w-3.5 h-3.5" /> Purchase History
                          </h4>
                          {loadingPurchases === product.id ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                            </div>
                          ) : (productPurchases[product.id] ?? []).length === 0 ? (
                            <p className="text-sm text-slate-600 py-4 text-center">No purchases yet</p>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-5 gap-3 text-[10px] uppercase tracking-wider text-slate-600 font-medium px-3 pb-1">
                                <span>Buyer</span><span>Email</span><span>Amount</span><span>Status</span><span>Date</span>
                              </div>
                              {(productPurchases[product.id] ?? []).map((pu: any) => (
                                <div key={pu.id} className="grid grid-cols-5 gap-3 items-center text-sm px-3 py-2.5 bg-slate-900/40 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                                      <User className="w-3 h-3 text-slate-500" />
                                    </div>
                                    <span className="text-white text-xs truncate">{pu.client_name ?? 'Unknown'}</span>
                                  </div>
                                  <span className="text-slate-400 text-xs truncate">{pu.client_email ?? '—'}</span>
                                  <span className="text-emerald-400 text-xs font-medium">{formatCurrency(pu.amount)}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit ${pu.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : pu.status === 'pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                                    {pu.status}
                                  </span>
                                  <span className="text-slate-500 text-xs">{formatTimeAgo(pu.purchased_at)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const tabContent: Record<TabKey, () => JSX.Element> = {
    overview: renderOverview,
    creators: renderCreators,
    products: renderProducts,
    users: renderUsers,
    withdrawals: renderWithdrawals,
    commission: renderCommission,
    traffic: renderTraffic,
    demographics: renderDemographics,
  };

  if (adminQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-40 bg-slate-950/95 backdrop-blur-xl border-r border-slate-800/60 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
          }`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-800/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
            S
          </div>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold tracking-tight"
            >
              Sellar Admin
            </motion.span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setSearch('');
                  setExpandedCreator(null);
                  setExpandedClient(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                  }`}
                title={tab.label}
              >
                <tab.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronDown className="w-4 h-4 rotate-90" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              {TABS.find((t) => t.key === activeTab)?.label}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'overview' && 'Platform-wide KPIs and activity.'}
              {activeTab === 'creators' && 'All creators, their products, clients, and financials.'}
              {activeTab === 'users' && 'Registered clients and their purchase history.'}
              {activeTab === 'withdrawals' && 'Manage creator withdrawal requests.'}
              {activeTab === 'products' && 'All products across creators with purchase history.'}
              {activeTab === 'commission' && 'Adjust commission rates for each creator.'}
              {activeTab === 'traffic' && 'Website traffic analytics and trends.'}
              {activeTab === 'demographics' && 'Client demographics and location data.'}
            </p>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent[activeTab]()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
