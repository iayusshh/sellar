import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** Create a general (buyer) account — no handle required */
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  /** Create a brand-new creator account directly */
  signUpCreator: (email: string, password: string, displayName: string, handle: string) => Promise<{ error: any }>;
  /** Upgrade an existing general account to creator */
  upgradeToCreator: (handle: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
