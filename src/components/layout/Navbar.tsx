import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wallet, Menu, X, LogOut, BookOpen, Sparkles, LayoutDashboard } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/integrations/supabase/hooks';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const profileQuery = useProfile(user?.id ?? '');
  const profile = profileQuery.data?.data;
  const isAdmin = !!profile?.is_admin;
  const isCreator = !!profile?.is_creator;
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToShowcase = useCallback((tab: string) => {
    const doScroll = () => {
      window.dispatchEvent(new CustomEvent('showcase-tab', { detail: tab }));
      const el = document.getElementById('feature-showcase');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <div className="flex items-center h-16">
          {/* Logo — fixed left */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl shrink-0">
            <Wallet className="w-6 h-6 text-accent" />
            <span>Sellar</span>
          </Link>

          {/* Desktop Navigation — true center */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-accent transition-colors">
              Home
            </Link>
            <button
              onClick={() => scrollToShowcase('dashboard')}
              className="text-sm font-medium hover:text-accent transition-colors"
            >
              Features
            </button>
            {isAdmin && (
              <Link to="/admin/portal" className="text-sm font-medium hover:text-accent transition-colors">
                Admin
              </Link>
            )}
          </div>

          {/* Spacer to push auth buttons right */}
          <div className="flex-1" />

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              isCreator ? (
                /* Creator is logged in */
                <>
                  <Button asChild variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20">
                    <Link to="/creator/dashboard">
                      <LayoutDashboard className="mr-2 w-4 h-4" />
                      Creator Dashboard
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    <LogOut className="mr-2 w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                /* General user is logged in */
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/library">
                      <BookOpen className="mr-2 w-4 h-4" />
                      My Library
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                    <Link to="/become-a-creator">
                      <Sparkles className="mr-2 w-4 h-4" />
                      Become a Creator
                    </Link>
                  </Button>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button variant="ghost" size="sm" onClick={() => signOut()}>
                    <LogOut className="mr-2 w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              )
            ) : (
              /* Not logged in */
              <>
                <Link to="/auth/signin" className="text-sm font-medium hover:text-accent transition-colors">
                  Sign In
                </Link>
                <Button asChild variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300">
                  <Link to="/become-a-creator">
                    <Sparkles className="mr-2 w-4 h-4" />
                    Become a Creator
                  </Link>
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
                Features
              </button>
              {isAdmin && (
                <Link
                  to="/admin/portal"
                  className="text-sm font-medium hover:text-accent transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-4 border-t">
                {user ? (
                  isCreator ? (
                    <>
                      <Button
                        asChild
                        variant="default"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 mb-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/creator/dashboard">
                          <LayoutDashboard className="mr-2 w-4 h-4" />
                          Creator Dashboard
                        </Link>
                      </Button>
                      <div className="text-sm text-muted-foreground px-4 py-2">{user.email}</div>
                      <Button variant="ghost" onClick={() => signOut()} className="w-full">
                        <LogOut className="mr-2 w-4 h-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        asChild
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/library">
                          <BookOpen className="mr-2 w-4 h-4" />
                          My Library
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        onClick={() => setIsOpen(false)}
                      >
                        <Link to="/become-a-creator">
                          <Sparkles className="mr-2 w-4 h-4" />
                          Become a Creator
                        </Link>
                      </Button>
                      <div className="text-sm text-muted-foreground px-4 py-2">{user.email}</div>
                      <Button variant="ghost" onClick={() => signOut()} className="w-full">
                        <LogOut className="mr-2 w-4 h-4" />
                        Sign Out
                      </Button>
                    </>
                  )
                ) : (
                  <>
                    <Link
                      to="/auth/signin"
                      className="text-sm font-medium hover:text-accent transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/become-a-creator">
                        <Sparkles className="mr-2 w-4 h-4" />
                        Become a Creator
                      </Link>
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
