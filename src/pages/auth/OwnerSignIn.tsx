import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || 'Failed to sign in');
      setLoading(false);
      return;
    }

    const userId = data?.user?.id;
    const userEmail = data?.user?.email;
    if (!userId || !userEmail) {
      toast.error('Owner account not found.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('is_owner')
      .eq('id', userId)
      .single();

    let hasOwnerAccess = !!profile?.is_owner;
    if (!hasOwnerAccess) {
      const { data: fallbackProfile } = await supabase
        .from('users')
        .select('is_owner')
        .eq('email', userEmail)
        .single();
      hasOwnerAccess = !!fallbackProfile?.is_owner;
    }

    if (profileError || !hasOwnerAccess) {
      await supabase.auth.signOut();
      toast.error('This account does not have owner access.');
      setLoading(false);
      return;
    }

    toast.success('Owner access granted.');
    navigate('/owner/portal');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <ShieldCheck className="w-8 h-8 text-amber-400" />
          <span className="text-2xl font-display font-bold">Sellar Owner</span>
        </Link>

        <Card className="bg-slate-900/70 border-slate-800 text-slate-100">
          <CardHeader>
            <CardTitle className="text-2xl">Owner access</CardTitle>
            <CardDescription className="text-slate-400">
              Private control room for selected operators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="owner-email">Email</Label>
                <Input
                  id="owner-email"
                  type="email"
                  placeholder="owner@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                  className="bg-slate-950/60 border-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-password">Password</Label>
                <Input
                  id="owner-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  required
                  className="bg-slate-950/60 border-slate-800"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying access...
                  </>
                ) : (
                  'Enter Control Room'
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-slate-400">Need creator access? </span>
                <Link to="/auth/signin" className="text-amber-300 hover:underline font-medium">
                  Sign in here
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
