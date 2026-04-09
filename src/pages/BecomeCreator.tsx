import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/integrations/supabase/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Wallet, Loader2, Eye, EyeOff, Mail, Lock, User, AtSign,
  CheckCircle2, XCircle, Sparkles, LayoutDashboard, Package, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCheckHandle } from '@/integrations/supabase/hooks';

const CREATOR_PERKS = [
  { icon: Package, text: 'Sell digital products — templates, courses, presets & more' },
  { icon: TrendingUp, text: 'Real-time earnings dashboard with wallet & payout tracking' },
  { icon: LayoutDashboard, text: 'Your own public storefront at sellar.app/yourname' },
];

export default function BecomeCreator() {
  const { user, loading: authLoading, signUpCreator, upgradeToCreator } = useAuth();
  const profileQuery = useProfile(user?.id ?? '');
  const profile = profileQuery.data?.data;
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !profileQuery.isLoading && profile?.is_creator) {
      navigate('/creator/dashboard', { replace: true });
    }
  }, [authLoading, profileQuery.isLoading, profile, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [handle, setHandle] = useState('');
  const [debouncedHandle, setDebouncedHandle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedHandle(handle), 400);
    return () => clearTimeout(timer);
  }, [handle]);

  const handleCheck = useCheckHandle(debouncedHandle);
  const isHandleValid = handle.length >= 3;
  const isHandleAvailable = handleCheck.data?.available === true;
  const isHandleTaken = handleCheck.data?.available === false;
  const isCheckingHandle = handleCheck.isLoading || (handle !== debouncedHandle && isHandleValid);

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isHandleValid) { toast.error('Username must be at least 3 characters'); return; }
    if (isHandleTaken) { toast.error('Username is already taken'); return; }
    setLoading(true);
    const { error } = await upgradeToCreator(handle);
    if (error) {
      toast.error((error as any).message || 'Failed to upgrade account');
      setLoading(false);
      return;
    }
    toast.success('You are now a creator! Welcome aboard.');
    navigate('/creator/dashboard');
  };

  const handleNewSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName) { toast.error('Please fill in all fields'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (!isHandleValid) { toast.error('Username must be at least 3 characters'); return; }
    if (isHandleTaken) { toast.error('Username is already taken'); return; }
    setLoading(true);
    const { error } = await signUpCreator(email, password, displayName, handle);
    if (error) {
      toast.error((error as any).message || 'Failed to create creator account');
      setLoading(false);
      return;
    }
    toast.success('Creator account created! Please verify your email.');
    navigate('/auth/verify-email');
  };

  if (authLoading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const isUpgradeMode = !!user && !profile?.is_creator;

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-emerald-100/70"
          animate={{ scale: [1, 1.06, 1], x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-20 w-[520px] h-[520px] rounded-full bg-emerald-50/80"
          animate={{ scale: [1, 1.04, 1], x: [0, -15, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[44%] flex-col justify-between p-12 relative z-10">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
            <Wallet className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-foreground">Sellar</span>
        </Link>

        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">Creator Platform</span>
          </div>

          <div>
            <h2 className="text-4xl font-display font-bold text-foreground leading-tight mb-3">
              Turn your knowledge<br />
              <span className="text-accent">into income</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              Join thousands of creators who use Sellar to monetize their work and grow their audience.
            </p>
          </div>

          <div className="space-y-4">
            {CREATOR_PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[['10k+', 'Creators'], ['₹2Cr+', 'Tracked'], ['99.9%', 'Uptime']].map(([val, label]) => (
              <div key={label} className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="text-xl font-bold text-accent">{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">© 2025 Sellar. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          {/* Mobile logo */}
          <Link to="/" className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <Wallet className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">Sellar</span>
          </Link>

          <div className="bg-card rounded-2xl border shadow-sm p-8">
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-accent text-xs font-medium px-3 py-1 rounded-full border border-emerald-200/60 mb-3">
                <Sparkles className="w-3 h-3" />
                {isUpgradeMode ? 'Upgrade your account' : 'Creator account'}
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {isUpgradeMode ? 'Become a Creator' : 'Start Selling Today'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isUpgradeMode
                  ? `Hi ${profile?.display_name || user?.email}! Pick a username for your storefront.`
                  : 'Create your creator account and launch your storefront'}
              </p>
            </div>

            {isUpgradeMode ? (
              <form onSubmit={handleUpgrade} className="space-y-5">
                <HandleField
                  handle={handle} setHandle={setHandle}
                  isHandleValid={isHandleValid} isHandleAvailable={isHandleAvailable}
                  isHandleTaken={isHandleTaken} isCheckingHandle={isCheckingHandle}
                  disabled={loading}
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading || (isHandleValid && isHandleTaken)}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Upgrading...</> : 'Become a Creator'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleNewSignup} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="displayName" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="displayName"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <HandleField
                  handle={handle} setHandle={setHandle}
                  isHandleValid={isHandleValid} isHandleAvailable={isHandleAvailable}
                  isHandleTaken={isHandleTaken} isCheckingHandle={isCheckingHandle}
                  disabled={loading}
                />

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 h-11"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 pr-10 h-11"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      required
                      className="pl-10 pr-10 h-11"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-medium bg-accent hover:bg-accent/90 text-accent-foreground"
                  disabled={loading || (isHandleValid && isHandleTaken)}
                >
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Creator Account'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link to="/auth/signin" className="text-accent hover:text-accent/80 font-medium transition-colors">Sign in</Link>
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Just want to browse &amp; buy?{' '}
                  <Link to="/auth/signup" className="text-accent hover:text-accent/80 font-medium transition-colors">General account</Link>
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-5">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Handle input field ─────────────────────────────────────────────────────
function HandleField({
  handle, setHandle, isHandleValid, isHandleAvailable, isHandleTaken, isCheckingHandle, disabled,
}: {
  handle: string; setHandle: (v: string) => void;
  isHandleValid: boolean; isHandleAvailable: boolean;
  isHandleTaken: boolean; isCheckingHandle: boolean; disabled: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="handle" className="text-sm font-medium">
        Creator Username
        <span className="ml-1.5 text-muted-foreground font-normal text-xs">— your storefront URL</span>
      </Label>
      <div className="relative">
        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id="handle"
          placeholder="johndoe"
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
          disabled={disabled}
          required
          className={`pl-10 pr-10 h-11 transition-all ${
            isHandleValid && isHandleAvailable ? 'border-emerald-400 focus-visible:ring-emerald-300' :
            isHandleValid && isHandleTaken ? 'border-red-400 focus-visible:ring-red-300' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isCheckingHandle && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          {!isCheckingHandle && isHandleValid && isHandleAvailable && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {!isCheckingHandle && isHandleValid && isHandleTaken && <XCircle className="w-4 h-4 text-red-500" />}
        </div>
      </div>
      <div className="min-h-[18px]">
        {handle.length > 0 && handle.length < 3 && (
          <p className="text-xs text-muted-foreground">At least 3 characters</p>
        )}
        {!isCheckingHandle && isHandleValid && isHandleAvailable && (
          <p className="text-xs text-emerald-600 font-medium">✓ Available — sellar.app/{handle}</p>
        )}
        {!isCheckingHandle && isHandleValid && isHandleTaken && (
          <p className="text-xs text-red-500">✗ Username already taken</p>
        )}
      </div>
    </div>
  );
}
