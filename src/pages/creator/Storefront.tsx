import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Instagram,
  Linkedin,
  Globe,
  ShoppingCart,
  IndianRupee,
  User,
  Package,
  Loader2,
  Share2,
  Check,
  Mail,
  ExternalLink,
  X,
} from 'lucide-react';
import { useProfileByHandle, usePublicProducts, useStartCheckout, useProfile } from '@/integrations/supabase/hooks';
import { purchaseQueries } from '@/integrations/supabase/queries';
import { openCashfreeCheckout } from '@/lib/cashfree';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/currency';
import { useState } from 'react';
import { toast } from 'sonner';

// X (Twitter) icon
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Storefront() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const buyerProfileQuery = useProfile(user?.id ?? '');
  const isCreatorAccount = !!buyerProfileQuery.data?.data?.is_creator;
  const profileQuery = useProfileByHandle(handle ?? '');
  const profile = profileQuery.data?.data;
  const productsQuery = usePublicProducts(profile?.id ?? '');
  const products = productsQuery.data?.data ?? [];
  const [copied, setCopied] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState<any>(null);
  const [dropInOpen, setDropInOpen] = useState(false);
  const startCheckout = useStartCheckout();
  const queryClient = useQueryClient();

  const socialLinks = (profile?.social_links as Record<string, string>) || {};

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBuyNow = (product: any) => {
    if (!user) {
      toast.error('Please sign in to purchase.');
      navigate(`/auth/signin?redirect=/${handle}`);
      return;
    }
    if (isCreatorAccount) {
      toast.error('Creator accounts cannot make purchases. Use a general account to buy products.');
      return;
    }
    setBuyingProduct(product);
  };

  const handleConfirmPurchase = async () => {
    if (!buyingProduct || !user) return;

    // ── Step 1: Create a Cashfree order via Edge Function ─────────────────
    let paymentSessionId: string;
    let cashfreeOrderId: string;
    try {
      const { data, error } = await startCheckout.mutateAsync(buyingProduct.id);
      if (error) {
        // FunctionsHttpError.context is the raw Response — extract the real message
        let message = (error as any).message as string;
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            console.error('[checkout] edge fn error body:', body);
            if (body?.error) message = body.error;
            else message = JSON.stringify(body);
          } else {
            console.error('[checkout] error (no context):', error);
          }
        } catch (parseErr) {
          console.error('[checkout] could not parse error body:', parseErr);
        }
        throw new Error(message);
      }
      if (!data) throw new Error('No checkout session returned');
      paymentSessionId = data.payment_session_id;
      cashfreeOrderId = data.cashfree_order_id;
    } catch (e: any) {
      const msg: string = e.message ?? '';
      if (msg.toLowerCase().includes('sign out and sign back in')) {
        toast.error(msg);
        return;
      }
      if (msg.toLowerCase().includes('session expired') || msg.toLowerCase().includes('please sign in')) {
        toast.error('Session expired. Please sign in again.');
        navigate(`/auth/signin?redirect=/${handle}`);
        return;
      }
      toast.error(msg || 'Could not start checkout. Please try again.');
      return;
    }

    // ── Step 2: Open Cashfree Drop-in modal ───────────────────────────────
    setDropInOpen(true);
    let dropInResult;
    try {
      dropInResult = await openCashfreeCheckout(paymentSessionId);
    } catch (e: any) {
      setDropInOpen(false);
      toast.error('Payment could not be opened. Please try again.');
      return;
    }
    setDropInOpen(false);

    if (dropInResult?.error) {
      // User cancelled or payment failed inside the Drop-in
      toast.error(dropInResult.error.message || 'Payment was not completed.');
      return;
    }

    // ── Step 3: Reconciliation fast-path (belt-and-suspenders) ───────────
    // Verify with Cashfree directly so we don't depend on webhook timing.
    toast.loading('Confirming payment...', { id: 'payment-confirm' });
    const MAX_POLLS = 3;
    let confirmed = false;

    for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
      try {
        const { status } = await purchaseQueries.verifyOrder(cashfreeOrderId);
        if (status === 'completed') {
          confirmed = true;
          break;
        }
        if (status === 'failed') break;
      } catch {
        // Network glitch — keep polling
      }
      if (attempt < MAX_POLLS - 1) {
        await new Promise((res) => setTimeout(res, 1500));
      }
    }

    toast.dismiss('payment-confirm');

    if (confirmed) {
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Payment successful! Check your library.');
      setBuyingProduct(null);
      navigate('/library');
    } else {
      // Webhook may still be in-flight — send to return page which polls further
      setBuyingProduct(null);
      navigate(`/payment/return?order_id=${cashfreeOrderId}`);
    }
  };

  // Loading
  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-muted-foreground text-sm">Loading storefront...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // 404
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Creator Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The storefront <strong className="text-foreground">@{handle}</strong> doesn't exist.
            </p>
            <Button asChild>
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const hasSocials = socialLinks.instagram || socialLinks.x || socialLinks.linkedin || socialLinks.website;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* ─── Creator Profile Header ─── */}
          <div className="bg-background rounded-2xl border shadow-sm p-6 sm:p-8 mb-10 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-3xl sm:text-4xl font-display font-bold">{profile.display_name}</h1>
                  <Badge variant="secondary" className="text-xs">@{profile.handle}</Badge>
                </div>

                {profile.bio && (
                  <p className="text-muted-foreground mb-4 max-w-xl leading-relaxed">{profile.bio}</p>
                )}

                {/* Social Links */}
                {hasSocials && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {socialLinks.instagram && (
                      <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Instagram className="w-3.5 h-3.5 text-pink-500" />
                          Instagram
                        </Button>
                      </a>
                    )}
                    {socialLinks.x && (
                      <a href={socialLinks.x} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <XIcon className="w-3.5 h-3.5" />
                          X
                        </Button>
                      </a>
                    )}
                    {socialLinks.linkedin && (
                      <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                          LinkedIn
                        </Button>
                      </a>
                    )}
                    {socialLinks.website && (
                      <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-accent" />
                          Website
                        </Button>
                      </a>
                    )}
                  </div>
                )}

                {/* Share */}
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleShare}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Share Profile'}
                </Button>
              </div>

              {/* Product Count */}
              <div className="text-center sm:text-right flex-shrink-0">
                <div className="text-3xl font-bold text-accent">{products.length}</div>
                <div className="text-xs text-muted-foreground">Products</div>
              </div>
            </div>
          </div>

          {/* ─── Products Section ─── */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6 animate-slide-up">
              <h2 className="text-2xl font-display font-bold flex items-center gap-2">
                <Package className="w-6 h-6 text-accent" />
                Products &amp; Services
              </h2>
              <span className="text-sm text-muted-foreground">{products.length} available</span>
            </div>

            {products.length === 0 ? (
              <div className="bg-background rounded-2xl border shadow-sm text-center py-20 animate-fade-in">
                <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">No products listed yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Check back later!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any, index: number) => (
                  <div
                    key={product.id}
                    className="bg-background rounded-2xl border shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {/* Product Image */}
                    <div className="aspect-[16/10] bg-muted overflow-hidden relative">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                          <Package className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-semibold mb-1.5 group-hover:text-accent transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-accent">
                          {formatCurrency(product.price)}
                        </div>
                        <Button
                          className="gap-1.5 shadow-sm"
                          onClick={() => handleBuyNow(product)}
                          disabled={isCreatorAccount}
                          title={isCreatorAccount ? 'Creator accounts cannot purchase products' : undefined}
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {isCreatorAccount ? 'Creators cannot buy' : 'Buy Now'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Contact / CTA Section ─── */}
          <div className="gradient-hero text-white rounded-2xl p-8 sm:p-10 text-center animate-scale-in">
            <Mail className="w-10 h-10 mx-auto mb-4 opacity-90" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold mb-3">
              Work with {profile.display_name?.split(' ')[0]}
            </h2>
            <p className="text-base opacity-90 mb-6 max-w-lg mx-auto">
              Interested in collaborations, custom projects, or business inquiries?
              Reach out directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {profile.email && (
                <Button size="lg" variant="secondary" asChild>
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Get in Touch
                  </a>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 border-white/20 hover:bg-white/20 text-white"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share this Page
              </Button>
            </div>
          </div>

        </div>
      </main>

      {/* Purchase Confirmation Modal */}
      {buyingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background border rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Confirm Purchase</h3>
              <button
                onClick={() => setBuyingProduct(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                {buyingProduct.image_url ? (
                  <img
                    src={buyingProduct.image_url}
                    alt={buyingProduct.title}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold">{buyingProduct.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{buyingProduct.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-accent">
                  {formatCurrency(buyingProduct.price)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setBuyingProduct(null)}
                disabled={startCheckout.isPending || dropInOpen}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmPurchase}
                disabled={startCheckout.isPending || dropInOpen}
              >
                {(startCheckout.isPending || dropInOpen) ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {startCheckout.isPending ? 'Creating order...' : dropInOpen ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
