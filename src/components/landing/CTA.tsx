import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="gradient-hero rounded-3xl p-12 md:p-16 text-center text-white animate-scale-in">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to take control of your earnings?
          </h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join thousands of creators who are already managing their income smarter, 
            faster, and more efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" variant="secondary" className="group" asChild>
              <Link to="/auth/signup">
                Start Free Today
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 hover:bg-white/20 text-white" asChild>
              <Link to="/creator/dashboard">
                Explore Features
              </Link>
            </Button>
          </div>
          
          <div className="mt-10 text-sm opacity-75">
            No credit card required • Free forever • Cancel anytime
          </div>
        </div>
      </div>
    </section>
  );
}
