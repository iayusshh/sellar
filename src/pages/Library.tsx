import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useMyPurchases, useRequestWebinarJoin } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import {
    Package,
    ExternalLink,
    Loader2,
    ShoppingBag,
    Calendar,
    User,
    Lock,
    X,
    ArrowUpRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const WEBINAR_CLIENT_SESSION_KEY = 'sellar_webinar_client_session_id';
const INITIAL_LIBRARY_NOW_MS = Date.now();

type WebinarState = {
    status: 'upcoming' | 'live' | 'ended' | 'unscheduled';
    message: string;
};

function getWebinarClientSessionId(): string {
    const existing = localStorage.getItem(WEBINAR_CLIENT_SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(WEBINAR_CLIENT_SESSION_KEY, created);
    return created;
}

function getWebinarState(purchase: any, nowMs: number): WebinarState {
    if (purchase?.product_kind !== 'webinar') {
        return { status: 'unscheduled', message: '' };
    }

    const startsAt = new Date(purchase.webinar_scheduled_at ?? '');
    if (Number.isNaN(startsAt.getTime())) {
        return { status: 'unscheduled', message: 'Schedule pending' };
    }

    const durationMins = Number(purchase.webinar_duration_minutes ?? 60);
    const earlyJoinMins = Math.max(0, Number(purchase.webinar_join_early_minutes ?? 10));
    const lateJoinMins = Math.max(0, Number(purchase.webinar_join_late_minutes ?? 30));

    const joinStartsAt = startsAt.getTime() - earlyJoinMins * 60_000;
    const joinEndsAt = startsAt.getTime() + (durationMins + lateJoinMins) * 60_000;

    if (nowMs < joinStartsAt) {
        return { status: 'upcoming', message: `Starts ${startsAt.toLocaleString()}` };
    }

    if (nowMs > joinEndsAt) {
        return { status: 'ended', message: 'Webinar ended' };
    }

    return { status: 'live', message: 'Join now' };
}

export default function Library() {
    const purchasesQuery = useMyPurchases();
    const purchases = purchasesQuery.data?.data ?? [];
    const joinWebinarMutation = useRequestWebinarJoin();
    const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
    const [joiningPurchaseId, setJoiningPurchaseId] = useState<string | null>(null);
    const [nowMs, setNowMs] = useState(INITIAL_LIBRARY_NOW_MS);

    useEffect(() => {
        const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, []);

    const purchaseStates = useMemo(() => {
        const map = new Map<string, WebinarState>();
        for (const purchase of purchases) {
            map.set(purchase.purchase_id, getWebinarState(purchase, nowMs));
        }
        return map;
    }, [nowMs, purchases]);

    const handleJoinWebinar = async (purchase: any) => {
        const clientSessionId = getWebinarClientSessionId();
        setJoiningPurchaseId(purchase.purchase_id);

        const { data, error } = await joinWebinarMutation.mutateAsync({
            purchaseId: purchase.purchase_id,
            clientSessionId,
        });

        setJoiningPurchaseId(null);

        if (error || !data?.join_url) {
            toast.error(error?.message ?? 'Could not join this webinar right now.');
            return;
        }

        const opened = window.open(data.join_url, '_blank', 'noopener,noreferrer');
        if (!opened) {
            toast.error('Popup blocked. Please allow popups and try again.');
            return;
        }

        toast.success('Opening webinar...');
    };

    const selectedPurchaseState = selectedPurchase
        ? purchaseStates.get(selectedPurchase.purchase_id) ?? getWebinarState(selectedPurchase, nowMs)
        : null;

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-24 pb-16">
                <div className="container mx-auto px-4 max-w-5xl">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
                            My Library
                        </h1>
                        <p className="text-muted-foreground">
                            Access all your purchased products in one place.
                        </p>
                    </div>

                    {/* Loading */}
                    {purchasesQuery.isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-accent" />
                            <p className="text-muted-foreground text-sm">Loading your library...</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!purchasesQuery.isLoading && purchases.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-1">No purchases yet</h2>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    When you purchase a product from a creator's storefront, it will appear here.
                                </p>
                            </div>
                            <Button asChild className="mt-2">
                                <Link to="/">Explore Creators</Link>
                            </Button>
                        </div>
                    )}

                    {/* Purchases Grid */}
                    {!purchasesQuery.isLoading && purchases.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {purchases.map((purchase: any) => {
                                const isWebinar = purchase.product_kind === 'webinar';
                                const webinarState = purchaseStates.get(purchase.purchase_id) ?? getWebinarState(purchase, nowMs);

                                return (
                                    <div
                                        key={purchase.purchase_id}
                                        className="border rounded-2xl overflow-hidden bg-card hover:shadow-lg transition-shadow group cursor-pointer"
                                        onClick={() => setSelectedPurchase(purchase)}
                                    >
                                        {/* Product Image */}
                                        <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                                            {purchase.product_image_url ? (
                                                <img
                                                    src={purchase.product_image_url}
                                                    alt={purchase.product_title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                                    <Package className="w-10 h-10 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-5 space-y-3">
                                            <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-accent transition-colors">
                                                {purchase.product_title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                {purchase.product_description}
                                            </p>

                                            {isWebinar && (
                                                <p className="text-xs text-accent">
                                                    {webinarState.message || 'Live webinar'}
                                                </p>
                                            )}

                                            {/* Metadata */}
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                                <Link
                                                    to={`/${purchase.creator_handle}`}
                                                    className="flex items-center gap-1 hover:text-accent transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <User className="w-3 h-3" />
                                                    {purchase.creator_name}
                                                </Link>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(purchase.purchased_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <span className="text-lg font-bold text-accent">
                                                    {formatCurrency(purchase.price)}
                                                </span>
                                            </div>

                                            {/* Access Button */}
                                            {isWebinar ? (
                                                webinarState.status === 'live' ? (
                                                    <Button
                                                        className="w-full gap-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleJoinWebinar(purchase);
                                                        }}
                                                        disabled={joiningPurchaseId === purchase.purchase_id}
                                                    >
                                                        {joiningPurchaseId === purchase.purchase_id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <ExternalLink className="w-4 h-4" />
                                                        )}
                                                        {joiningPurchaseId === purchase.purchase_id ? 'Joining...' : 'Join Webinar'}
                                                    </Button>
                                                ) : (
                                                    <Button disabled className="w-full gap-2" variant="secondary">
                                                        <Lock className="w-4 h-4" />
                                                        {webinarState.status === 'upcoming' ? 'Starts Soon' : webinarState.message}
                                                    </Button>
                                                )
                                            ) : purchase.content_url ? (
                                                <Button asChild className="w-full gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <a
                                                        href={purchase.content_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                        Access Content
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button disabled className="w-full gap-2" variant="secondary">
                                                    <Lock className="w-4 h-4" />
                                                    Content Coming Soon
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
            {/* Product Detail Modal */}
            {selectedPurchase && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={() => setSelectedPurchase(null)}
                >
                    <div
                        className="bg-background border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Image */}
                        {selectedPurchase.product_image_url ? (
                            <div className="aspect-[16/9] overflow-hidden">
                                <img
                                    src={selectedPurchase.product_image_url}
                                    alt={selectedPurchase.product_title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-[16/9] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                <Package className="w-14 h-14 text-muted-foreground/30" />
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-xl font-bold leading-snug">
                                    {selectedPurchase.product_title}
                                </h2>
                                <button
                                    onClick={() => setSelectedPurchase(null)}
                                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {selectedPurchase.product_description}
                            </p>

                            {selectedPurchase.product_kind === 'webinar' && selectedPurchaseState?.message && (
                                <p className="text-xs text-accent">
                                    {selectedPurchaseState.message}
                                </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-4">
                                <Link
                                    to={`/${selectedPurchase.creator_handle}`}
                                    className="flex items-center gap-1.5 hover:text-accent transition-colors font-medium"
                                    onClick={() => setSelectedPurchase(null)}
                                >
                                    <User className="w-3.5 h-3.5" />
                                    {selectedPurchase.creator_name}
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Purchased {new Date(selectedPurchase.purchased_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                                <span className="text-2xl font-bold text-accent">
                                    {formatCurrency(selectedPurchase.price)}
                                </span>
                                {selectedPurchase.product_kind === 'webinar' ? (
                                    selectedPurchaseState?.status === 'live' ? (
                                        <Button
                                            className="gap-2"
                                            onClick={() => handleJoinWebinar(selectedPurchase)}
                                            disabled={joiningPurchaseId === selectedPurchase.purchase_id}
                                        >
                                            {joiningPurchaseId === selectedPurchase.purchase_id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ExternalLink className="w-4 h-4" />
                                            )}
                                            {joiningPurchaseId === selectedPurchase.purchase_id ? 'Joining...' : 'Join Webinar'}
                                        </Button>
                                    ) : (
                                        <Button disabled className="gap-2" variant="secondary">
                                            <Lock className="w-4 h-4" />
                                            {selectedPurchaseState?.status === 'upcoming' ? 'Starts Soon' : 'Webinar Ended'}
                                        </Button>
                                    )
                                ) : selectedPurchase.content_url ? (
                                    <Button asChild className="gap-2">
                                        <a
                                            href={selectedPurchase.content_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Access Content
                                        </a>
                                    </Button>
                                ) : (
                                    <Button disabled className="gap-2" variant="secondary">
                                        <Lock className="w-4 h-4" />
                                        Content Coming Soon
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
