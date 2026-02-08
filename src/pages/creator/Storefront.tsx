import { useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Link as LinkIcon, Twitter, Instagram, IndianRupee, Heart } from 'lucide-react';
import { useProfileByHandle, usePublicProducts } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';

export default function Storefront() {
  const { handle } = useParams();
  const profileQuery = useProfileByHandle(handle ?? '');
  const profile = profileQuery.data?.data;
  const productsQuery = usePublicProducts(profile?.id ?? '');
  const products = productsQuery.data?.data ?? [];

  if (profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading storefront...</div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Creator not found</h1>
          <p className="text-muted-foreground">This storefront does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <Card className="mb-8 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile.avatar_url ?? ''} />
                  <AvatarFallback>{profile.display_name?.slice(0, 2) ?? 'S'}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
                    <h1 className="text-3xl font-display font-bold">{profile.display_name}</h1>
                    <Badge variant="secondary">@{profile.handle}</Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-4 max-w-2xl">
                    {profile.bio || 'Creator on Sellar.'}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      India
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-muted-foreground">sellar.app/{profile.handle}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm">
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Instagram className="w-4 h-4 mr-2" />
                      Instagram
                    </Button>
                    <Button size="sm" className="bg-accent hover:bg-accent/90">
                      <Heart className="w-4 h-4 mr-2" />
                      Support with Tip
                    </Button>
                  </div>
                </div>

                <div className="text-center md:text-right">
                  <div className="text-3xl font-bold text-accent mb-1">—</div>
                  <div className="text-sm text-muted-foreground">Supporters</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold mb-6 animate-slide-up">Products & Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any, index: number) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop'} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{product.title}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-accent">
                        {formatCurrency(product.price)}
                      </div>
                      <Button>
                        <IndianRupee className="w-4 h-4 mr-2" />
                        Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Support Section */}
          <Card className="gradient-hero text-white animate-scale-in">
            <CardContent className="pt-6">
              <div className="text-center max-w-2xl mx-auto">
                <Heart className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-3xl font-display font-bold mb-3">
                  Support My Work
                </h2>
                <p className="text-lg opacity-90 mb-6">
                  Your support helps me create more valuable content and resources 
                  for the community. Every contribution makes a difference!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" variant="secondary">
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Send a Tip
                  </Button>
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <Heart className="w-4 h-4 mr-2" />
                    Become a Supporter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
