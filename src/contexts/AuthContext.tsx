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
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, handle: string, displayName: string) => {
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            handle,
            display_name: displayName,
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

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error) {
      const userId = data?.user?.id;
      if (userId) {
        const { data: profile } = await supabase
          .from('users')
          .select('is_admin, is_owner')
          .eq('id', userId)
          .single();

        if (profile?.is_owner) {
          navigate('/owner/portal');
        } else if (profile?.is_admin) {
          navigate('/admin/portal');
        } else {
          navigate('/creator/dashboard');
        }
      } else {
        navigate('/creator/dashboard');
      }
    }
    
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

