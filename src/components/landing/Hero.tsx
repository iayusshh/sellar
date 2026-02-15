import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 gradient-hero opacity-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">New: Real-time earnings tracking</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 animate-slide-up">
            Your Creative
            <span className="block text-accent">Earnings, Simplified</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Manage your digital wallet, showcase your storefront, and track earnings
            all in one powerful platform built for creators.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Button size="lg" className="group" asChild>
              <Link to="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('showcase-tab', { detail: 'dashboard' }));
                const el = document.getElementById('feature-showcase');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              View Demo Dashboard
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-16 border-t animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">10k+</div>
              <div className="text-sm text-muted-foreground">Active Creators</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">₹2Cr+</div>
              <div className="text-sm text-muted-foreground">Earnings Tracked</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
