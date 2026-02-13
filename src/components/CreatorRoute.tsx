import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/integrations/supabase/hooks';
import { Loader2 } from 'lucide-react';

interface CreatorRouteProps {
  children: ReactNode;
}

export default function CreatorRoute({ children }: CreatorRouteProps) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? '';
  const profileQuery = useProfile(userId);
  const profile = profileQuery.data?.data;

  if (loading || profileQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (profile?.is_owner) {
    return <Navigate to="/owner/portal" replace />;
  }

  if (profile?.is_admin) {
    return <Navigate to="/admin/portal" replace />;
  }

  return <>{children}</>;
}
