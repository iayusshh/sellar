import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2, Eye, EyeOff, Mail, Lock, User, AtSign, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useCheckHandle } from '@/integrations/supabase/hooks';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [debouncedHandle, setDebouncedHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  // Debounce the handle input for availability checking
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHandle(handle);
    }, 400);
    return () => clearTimeout(timer);
  }, [handle]);

  const handleCheck = useCheckHandle(debouncedHandle);
  const isHandleValid = handle.length >= 3;
  const isHandleAvailable = handleCheck.data?.available === true;
  const isHandleTaken = handleCheck.data?.available === false;
  const isCheckingHandle = handleCheck.isLoading || (handle !== debouncedHandle && isHandleValid);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/creator/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password || !handle || !displayName) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (handle.length < 3) {
      toast.error('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (isHandleTaken) {
      toast.error('This username is already taken. Please choose another.');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, handle, displayName);

    if (error) {
      toast.error(error.message || 'Failed to sign up');
      setLoading(false);
      return;
    }

    toast.success('Account created! Please verify your email.');
    navigate('/auth/verify-email');
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(160 84% 39%) 0%, transparent 70%)' }}
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-15%] left-[-10%] w-[550px] h-[550px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, hsl(220 70% 50%) 0%, transparent 70%)' }}
          animate={{ x: [0, 35, 0], y: [0, -30, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-[50%] left-[30%] w-[250px] h-[250px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(280 60% 50%) 0%, transparent 70%)' }}
          animate={{ x: [0, -20, 0], y: [0, 25, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-display font-bold text-white">Sellar</span>
        </Link>

        <Card className="bg-white/[0.06] backdrop-blur-2xl border-white/[0.08] shadow-2xl shadow-black/40">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white">Create your account</CardTitle>
            <CardDescription className="text-slate-400">
              Start selling digital products in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Google OAuth */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 bg-white/[0.05] border-white/[0.1] text-white hover:bg-white/[0.1] hover:text-white transition-all duration-200"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/[0.08]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-transparent px-3 text-slate-500 uppercase tracking-wider">or</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-slate-300 text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="displayName"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Username with availability indicator */}
              <div className="space-y-2">
                <Label htmlFor="handle" className="text-slate-300 text-sm font-medium">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="handle"
                    placeholder="johndoe"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={loading}
                    required
                    className={`pl-10 pr-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 transition-all duration-200 ${isHandleValid && isHandleAvailable
                        ? 'border-emerald-500/50 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                        : isHandleValid && isHandleTaken
                          ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20'
                          : 'focus:border-emerald-500/50 focus:ring-emerald-500/20'
                      }`}
                  />
                  {/* Availability indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingHandle && (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    )}
                    {!isCheckingHandle && isHandleValid && isHandleAvailable && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    {!isCheckingHandle && isHandleValid && isHandleTaken && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>
                {/* Status message */}
                <div className="min-h-[18px]">
                  {handle.length > 0 && handle.length < 3 && (
                    <p className="text-xs text-slate-500">Username must be at least 3 characters</p>
                  )}
                  {!isCheckingHandle && isHandleValid && isHandleAvailable && (
                    <p className="text-xs text-emerald-400">✓ Username is available</p>
                  )}
                  {!isCheckingHandle && isHandleValid && isHandleTaken && (
                    <p className="text-xs text-red-400">✗ Username is already taken</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 pr-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">At least 6 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    className="pl-10 pr-10 h-11 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-500 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all duration-200"
                disabled={loading || (isHandleValid && isHandleTaken)}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/auth/signin" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-500 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
