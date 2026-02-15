import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useMyPurchases } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import {
    Package,
    ExternalLink,
    Loader2,
    ShoppingBag,
    Calendar,
    User,
    Lock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Library() {
    const purchasesQuery = useMyPurchases();
    const purchases = purchasesQuery.data?.data ?? [];

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
                            {purchases.map((purchase: any) => (
                                <div
                                    key={purchase.purchase_id}
                                    className="border rounded-2xl overflow-hidden bg-card hover:shadow-lg transition-shadow group"
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

                                        {/* Metadata */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {purchase.creator_name}
                                            </span>
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

                                        {/* Access Content Button */}
                                        {purchase.content_url ? (
                                            <Button asChild className="w-full gap-2">
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
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
