import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import ProtectedRoute from '@/components/ProtectedRoute';
import CreatorRoute from '@/components/CreatorRoute';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import SignIn from '@/pages/auth/SignIn';
import SignUp from '@/pages/auth/SignUp';
import OwnerSignIn from '@/pages/auth/OwnerSignIn';
import Dashboard from '@/pages/creator/Dashboard';
import Products from '@/pages/creator/Products';
import Wallet from '@/pages/creator/Wallet';
import Storefront from '@/pages/creator/Storefront';
import AdminWithdrawals from '@/pages/admin/Withdrawals';
import AdminPortal from '@/pages/admin/Portal';
import OwnerPortal from '@/pages/admin/OwnerPortal';
import AdminRoute from '@/components/AdminRoute';
import OwnerRoute from '@/components/OwnerRoute';
import SupabaseTest from '@/pages/SupabaseTest';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth/signin" element={<SignIn />} />
        <Route path="/auth/signup" element={<SignUp />} />
        <Route path="/auth/owner" element={<OwnerSignIn />} />
        <Route path="/test-supabase" element={<SupabaseTest />} />
        <Route
          path="/creator/dashboard"
          element={
            <CreatorRoute>
              <Dashboard />
            </CreatorRoute>
          }
        />
        <Route
          path="/creator/products"
          element={
            <CreatorRoute>
              <Products />
            </CreatorRoute>
          }
        />
        <Route
          path="/creator/wallet"
          element={
            <CreatorRoute>
              <Wallet />
            </CreatorRoute>
          }
        />
        <Route
          path="/admin/withdrawals"
          element={
            <AdminRoute>
              <AdminWithdrawals />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/portal"
          element={
            <AdminRoute>
              <AdminPortal />
            </AdminRoute>
          }
        />
        <Route
          path="/owner/portal"
          element={
            <OwnerRoute>
              <OwnerPortal />
            </OwnerRoute>
          }
        />
        <Route path="/:handle" element={<Storefront />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </>
  );
}

export default App;
