import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    Wallet,
    ShoppingBag,
    ArrowRight,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    IndianRupee,
    BarChart3,
    Package,
    Eye,
    Users,
    Star,
    ChevronRight,
} from 'lucide-react';

type TabKey = 'dashboard' | 'wallet' | 'products';

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'wallet', label: 'Wallet', icon: Wallet },
    { key: 'products', label: 'Products', icon: ShoppingBag },
];

function DashboardShowcase() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                    Your command center,
                    <span className="block text-accent">at a glance</span>
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                    See everything that matters — real-time earnings, recent transactions,
                    top products, and audience growth — all in one beautifully designed dashboard.
                </p>
                <ul className="space-y-3 mb-8">
                    {[
                        'Live revenue tracking with interactive charts',
                        'Quick-action cards for products, wallet & storefront',
                        'Recent activity feed with transaction details',
                        'Performance metrics & trend indicators',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            {item}
                        </li>
                    ))}
                </ul>
                <Button asChild>
                    <Link to="/auth/signup">
                        Try the Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
            </div>

            {/* Mock Dashboard UI */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl">
                {/* Top Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                        { label: 'Revenue', value: '₹45,230', icon: TrendingUp, color: 'text-emerald-400' },
                        { label: 'Products', value: '12', icon: Package, color: 'text-blue-400' },
                        { label: 'Visitors', value: '2.3k', icon: Eye, color: 'text-purple-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/50">
                            <div className="flex items-center gap-2 mb-1">
                                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                                <span className="text-xs text-slate-500">{stat.label}</span>
                            </div>
                            <p className="text-white font-bold text-lg">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Mini Chart */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800/50 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white">Revenue Trend</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> +23%
                        </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-16">
                        {[40, 55, 35, 70, 50, 85, 60, 90, 75, 95, 80, 100].map((h, i) => (
                            <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-emerald-500/30 to-emerald-500/80 rounded-sm"
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800/50">
                    <span className="text-sm font-medium text-white mb-3 block">Recent Sales</span>
                    {[
                        { name: 'React Mastery Course', amount: '₹1,499', time: '2h ago' },
                        { name: 'SaaS Starter Kit', amount: '₹2,999', time: '5h ago' },
                        { name: 'System Design Guide', amount: '₹799', time: '1d ago' },
                    ].map((sale, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-white">{sale.name}</p>
                                    <p className="text-[10px] text-slate-500">{sale.time}</p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold text-emerald-400">+{sale.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function WalletShowcase() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                    Your earnings,
                    <span className="block text-accent">safe & accessible</span>
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                    Every rupee tracked, every transaction logged. Withdraw to your bank
                    anytime with our secure, transparent wallet system.
                </p>
                <ul className="space-y-3 mb-8">
                    {[
                        'Real-time balance updates after every sale',
                        'Complete transaction history with filters',
                        'One-click withdrawal to your bank account',
                        'Commission breakdown & earnings analytics',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            {item}
                        </li>
                    ))}
                </ul>
                <Button asChild>
                    <Link to="/auth/signup">
                        Open Your Wallet <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
            </div>

            {/* Mock Wallet UI */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl">
                {/* Balance Card */}
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl p-5 mb-4">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-emerald-100/80 text-sm">Available Balance</span>
                        <IndianRupee className="w-5 h-5 text-white/60" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-3">₹8,234.50</p>
                    <div className="flex gap-2">
                        <div className="bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium text-white">
                            Withdraw
                        </div>
                        <div className="bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium text-white/80">
                            History
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/50">
                        <span className="text-xs text-slate-500">This Month</span>
                        <p className="text-white font-bold">₹12,450</p>
                        <span className="text-[10px] text-emerald-400">+23% vs last month</span>
                    </div>
                    <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/50">
                        <span className="text-xs text-slate-500">Lifetime</span>
                        <p className="text-white font-bold">₹1,45,000</p>
                        <span className="text-[10px] text-slate-400">Since Jan 2024</span>
                    </div>
                </div>

                {/* Transactions */}
                <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800/50">
                    <span className="text-sm font-medium text-white mb-3 block">Transaction History</span>
                    {[
                        { type: 'income', source: 'Product Sale', amount: '₹1,499', time: '2h ago' },
                        { type: 'withdrawal', source: 'Bank Transfer', amount: '₹5,000', time: '1d ago' },
                        { type: 'income', source: 'Subscription', amount: '₹299', time: '2d ago' },
                        { type: 'income', source: 'Product Sale', amount: '₹799', time: '3d ago' },
                    ].map((txn, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                            <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${txn.type === 'income' ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                    }`}>
                                    {txn.type === 'income' ? (
                                        <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                        <ArrowUpRight className="w-3 h-3 text-amber-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-white">{txn.source}</p>
                                    <p className="text-[10px] text-slate-500">{txn.time}</p>
                                </div>
                            </div>
                            <span className={`text-xs font-semibold ${txn.type === 'income' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>
                                {txn.type === 'income' ? '+' : '-'}{txn.amount}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ProductsShowcase() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold mb-4">
                    Your products,
                    <span className="block text-accent">your storefront</span>
                </h3>
                <p className="text-muted-foreground mb-6 text-lg">
                    List digital products, courses, templates, and guides on your personal storefront.
                    Every creator gets a unique link — share it anywhere.
                </p>
                <ul className="space-y-3 mb-8">
                    {[
                        'Upload product images, set prices, write descriptions',
                        'Toggle products active/inactive with a click',
                        'Public storefront at sellar.app/your-handle',
                        'Track sales & revenue per product in real time',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                            {item}
                        </li>
                    ))}
                </ul>
                <Button asChild>
                    <Link to="/auth/signup">
                        Start Selling <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                </Button>
            </div>

            {/* Mock Products UI */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="text-sm font-medium text-white">Your Products</span>
                        <p className="text-xs text-slate-500">5 products • 3 active</p>
                    </div>
                    <div className="bg-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-lg">
                        + New Product
                    </div>
                </div>

                {/* Product Cards */}
                <div className="space-y-3">
                    {[
                        { title: 'React Mastery Course', price: '₹1,499', sales: 47, rating: 4.8, active: true, color: 'from-blue-500/20 to-cyan-500/20' },
                        { title: 'SaaS Starter Kit', price: '₹2,999', sales: 23, rating: 4.9, active: true, color: 'from-purple-500/20 to-pink-500/20' },
                        { title: 'System Design Guide', price: '₹799', sales: 89, rating: 4.7, active: true, color: 'from-amber-500/20 to-orange-500/20' },
                        { title: 'Dev Productivity Toolkit', price: '₹299', sales: 156, rating: 4.5, active: false, color: 'from-emerald-500/20 to-teal-500/20' },
                    ].map((product, i) => (
                        <div key={i} className="bg-slate-900/80 rounded-xl p-3 border border-slate-800/50 flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${product.color} flex items-center justify-center flex-shrink-0`}>
                                <Package className="w-5 h-5 text-white/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm text-white font-medium truncate">{product.title}</p>
                                    {!product.active && (
                                        <span className="text-[9px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Draft</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                                    <span className="font-semibold text-white/80">{product.price}</span>
                                    <span className="flex items-center gap-0.5">
                                        <Users className="w-3 h-3" /> {product.sales} sales
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                        <Star className="w-3 h-3 text-amber-400" /> {product.rating}
                                    </span>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                        </div>
                    ))}
                </div>

                {/* Storefront Link */}
                <div className="mt-4 bg-slate-900/60 rounded-xl p-3 border border-dashed border-slate-700 text-center">
                    <p className="text-xs text-slate-500 mb-1">Your Public Storefront</p>
                    <p className="text-sm text-accent font-medium">sellar.app/arjuntech</p>
                </div>
            </div>
        </div>
    );
}

export default function FeatureShowcase() {
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

    useEffect(() => {
        const handler = (e: Event) => {
            const tab = (e as CustomEvent).detail as TabKey;
            if (['dashboard', 'wallet', 'products'].includes(tab)) {
                setActiveTab(tab);
            }
        };
        window.addEventListener('showcase-tab', handler);
        return () => window.removeEventListener('showcase-tab', handler);
    }, []);

    return (
        <section id="feature-showcase" className="py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12 animate-fade-in">
                    <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
                        See it in action
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Explore the tools that thousands of creators use to manage and grow their business.
                    </p>
                </div>

                {/* Tab Bar */}
                <div className="flex justify-center mb-10">
                    <div className="inline-flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                        ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <tab.icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in" key={activeTab}>
                    {activeTab === 'dashboard' && <DashboardShowcase />}
                    {activeTab === 'wallet' && <WalletShowcase />}
                    {activeTab === 'products' && <ProductsShowcase />}
                </div>
            </div>
        </section>
    );
}
