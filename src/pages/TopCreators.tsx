import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Instagram,
  Linkedin,
  Globe,
  User,
  Loader2,
  Users,
} from 'lucide-react';
import { useFeaturedCreators } from '@/integrations/supabase/hooks';

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function TopCreators() {
  const { data, isLoading } = useFeaturedCreators();
  const creators = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
            <p className="text-muted-foreground text-sm">Loading creators...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">

          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in">
            <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium">
              Curated by Sellar
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-display font-bold mb-4">
              Our Top Creators
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
              Discover the talented creators making waves on Sellar. Explore their
              storefronts and support their work.
            </p>
          </div>

          {/* Empty state */}
          {creators.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No featured creators yet</h2>
              <p className="text-muted-foreground mb-6">
                Check back soon — the team is curating the best creators on the platform.
              </p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {creators.map((creator, index) => {
                const socialLinks = (creator.social_links as Record<string, string>) ?? {};
                const hasSocials =
                  socialLinks.instagram || socialLinks.x || socialLinks.linkedin || socialLinks.website;

                return (
                  <div
                    key={creator.id}
                    className="bg-background rounded-2xl border shadow-sm overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up flex flex-col"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    {/* Card body */}
                    <div className="p-6 flex flex-col flex-1">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border flex-shrink-0 flex items-center justify-center">
                          {creator.avatar_url ? (
                            <img
                              src={creator.avatar_url}
                              alt={creator.display_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-display font-bold text-lg leading-tight mb-1 truncate">
                            {creator.display_name}
                          </h2>
                          <Badge variant="secondary" className="text-xs">
                            @{creator.handle}
                          </Badge>
                        </div>
                      </div>

                      {/* Bio */}
                      {creator.bio && (
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
                          {creator.bio}
                        </p>
                      )}
                      {!creator.bio && <div className="flex-1" />}

                      {/* Social links */}
                      {hasSocials && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {socialLinks.instagram && (
                            <a
                              href={socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2">
                                <Instagram className="w-3 h-3 text-pink-500" />
                                Instagram
                              </Button>
                            </a>
                          )}
                          {socialLinks.x && (
                            <a
                              href={socialLinks.x}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2">
                                <XIcon className="w-3 h-3" />X
                              </Button>
                            </a>
                          )}
                          {socialLinks.linkedin && (
                            <a
                              href={socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2">
                                <Linkedin className="w-3 h-3 text-blue-600" />
                                LinkedIn
                              </Button>
                            </a>
                          )}
                          {socialLinks.website && (
                            <a
                              href={socialLinks.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 px-2">
                                <Globe className="w-3 h-3" />
                                Website
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-6 pb-6">
                      <Button asChild className="w-full" size="sm">
                        <Link to={`/${creator.handle}`}>Visit Storefront</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
