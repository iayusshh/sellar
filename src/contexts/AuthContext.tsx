import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext, AuthContextType } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Create a general (buyer) account */
  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            is_creator: false,
          },
        },
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('User creation failed') };

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  /** Create a brand-new creator account */
  const signUpCreator = async (email: string, password: string, displayName: string, handle: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            handle,
            display_name: displayName,
            is_creator: true,
          },
        },
      });

      if (authError) return { error: authError };
      if (!authData.user) return { error: new Error('User creation failed') };

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  /** Upgrade an existing general account to creator */
  const upgradeToCreator = async (handle: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return { error: new Error('Not signed in') };

      const { error } = await supabase
        .from('users')
        .update({ is_creator: true, handle })
        .eq('id', currentUser.id);

      if (error) return { error };

      // Invalidate profile cache so CreatorRoute picks up the new flag immediately
      queryClient.invalidateQueries({ queryKey: ['profile', currentUser.id] });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error) {
      const userId = data?.user?.id;
      if (userId) {
        const { data: profiles, error: profileError } = await supabase
          .from('users')
          .select('is_admin, is_owner, is_creator')
          .eq('id', userId)
          .limit(1);

        const profile = profiles?.[0];

        if (profileError) {
          console.error('Failed to load profile during sign-in:', profileError);
        }

        if (profile?.is_owner) {
          navigate('/owner/portal');
        } else if (profile?.is_admin) {
          navigate('/admin/portal');
        } else if (profile?.is_creator) {
          navigate('/creator/dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signUpCreator, upgradeToCreator, signIn, signInWithGoogle, resetPassword, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
