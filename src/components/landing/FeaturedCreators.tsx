import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ArrowRight } from 'lucide-react';
import { useFeaturedCreators } from '@/integrations/supabase/hooks';

export default function FeaturedCreators() {
  const { data, isLoading } = useFeaturedCreators();
  const creators = (data?.data ?? []).slice(0, 4);

  // Don't render the section if there's nothing to show
  if (isLoading || creators.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-medium">
            Community Spotlight
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Meet Our Top Creators
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Talented creators building their audience and selling their work on Sellar.
          </p>
        </div>

        {/* Creator cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {creators.map((creator, index) => {
            return (
              <Link
                key={creator.id}
                to={`/${creator.handle}`}
                className="bg-background rounded-2xl border shadow-sm p-5 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-slide-up group"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted border border-border flex items-center justify-center mb-3">
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

                {/* Name */}
                <h3 className="font-display font-bold text-base mb-1 group-hover:text-accent transition-colors line-clamp-1">
                  {creator.display_name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">@{creator.handle}</p>

                {/* Bio */}
                {creator.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {creator.bio}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        {/* See all link */}
        <div className="text-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/top-creators">
              See all top creators
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
