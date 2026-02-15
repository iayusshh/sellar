import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, LogOut, BookOpen } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/integrations/supabase/hooks';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const profileQuery = useProfile(user?.id ?? '');
  const isAdmin = !!profileQuery.data?.data?.is_admin;
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToShowcase = useCallback((tab: string) => {
    const doScroll = () => {
      window.dispatchEvent(new CustomEvent('showcase-tab', { detail: tab }));
      const el = document.getElementById('feature-showcase');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (location.pathname === '/') {
      doScroll();
    } else {
      navigate('/', { state: { showcaseTab: tab } });
      setTimeout(doScroll, 300);
    }
  }, [location.pathname, navigate]);

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <Wallet className="w-6 h-6 text-accent" />
            <span>Sellar</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-accent transition-colors">
              Home
            </Link>
            <button
              onClick={() => scrollToShowcase('dashboard')}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => scrollToShowcase('wallet')}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Wallet
            </button>
            <button
              onClick={() => scrollToShowcase('products')}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Products
            </button>
            {isAdmin ? (
              <Link to="/admin/portal" className="text-sm font-medium hover:text-accent transition-colors">
                Admin
              </Link>
            ) : null}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/library" className="text-sm font-medium hover:text-accent transition-colors">
                  My Library
                </Link>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="ghost" onClick={() => signOut()}>
                  <LogOut className="mr-2 w-4 h-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in">
            <div className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium hover:text-accent transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
              <button
                className="text-sm font-medium hover:text-accent transition-colors text-left"
                onClick={() => { scrollToShowcase('dashboard'); setIsOpen(false); }}
              >
                Dashboard
              </button>
              <button
                className="text-sm font-medium hover:text-accent transition-colors text-left"
                onClick={() => { scrollToShowcase('wallet'); setIsOpen(false); }}
              >
                Wallet
              </button>
              <button
                className="text-sm font-medium hover:text-accent transition-colors text-left"
                onClick={() => { scrollToShowcase('products'); setIsOpen(false); }}
              >
                Products
              </button>
              {isAdmin ? (
                <Link
                  to="/admin/portal"
                  className="text-sm font-medium hover:text-accent transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              ) : null}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {user ? (
                  <>
                    <Link
                      to="/library"
                      className="text-sm font-medium hover:text-accent transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <BookOpen className="w-4 h-4 inline mr-2" />
                      My Library
                    </Link>
                    <div className="text-sm text-muted-foreground px-4 py-2">
                      {user.email}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => signOut()}
                      className="w-full"
                    >
                      <LogOut className="mr-2 w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full">
                      <Link to="/auth/signin">Sign In</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link to="/auth/signup">Get Started</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
