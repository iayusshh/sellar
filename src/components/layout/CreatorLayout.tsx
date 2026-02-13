import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    Wallet,
    Settings,
    Users,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/integrations/supabase/hooks';

const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/creator/dashboard' },
    { key: 'products', label: 'Products', icon: Package, path: '/creator/products' },
    { key: 'wallet', label: 'Wallet', icon: Wallet, path: '/creator/wallet' },
    { key: 'settings', label: 'Settings', icon: Settings, path: '/creator/settings' },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
    const { user, signOut } = useAuth();
    const profileQuery = useProfile(user?.id || '');
    const profile = profileQuery.data?.data;
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* ─── Sidebar ─── */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? 260 : 72 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="fixed top-0 left-0 h-full bg-slate-900/70 backdrop-blur-2xl border-r border-slate-800/60 z-30 flex flex-col"
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800/40">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                    {sidebarOpen && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="ml-3 font-display font-bold text-white text-lg"
                        >
                            Sellar
                        </motion.span>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 px-2 space-y-1">
                    {navItems.map((item) => {
                        const active = location.pathname === item.path;
                        return (
                            <Link
                                key={item.key}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${active
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {sidebarOpen && (
                                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                                )}
                                {active && sidebarOpen && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile & Actions */}
                <div className="border-t border-slate-800/40 p-3 space-y-2">
                    {sidebarOpen && profile && (
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-4 h-4 text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{profile.display_name}</p>
                                <p className="text-xs text-slate-500 truncate">@{profile.handle}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-colors text-sm"
                    >
                        {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        {sidebarOpen && <span>Collapse</span>}
                    </button>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" />
                        {sidebarOpen && <span>Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* ─── Main Content ─── */}
            <main
                className="flex-1 transition-all duration-250"
                style={{ marginLeft: sidebarOpen ? 260 : 72 }}
            >
                <div className="absolute top-0 right-0 w-[60%] h-[400px] bg-gradient-to-bl from-emerald-600/5 to-transparent pointer-events-none" />
                <div className="max-w-6xl mx-auto px-6 py-8 relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
