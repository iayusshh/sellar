import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreatorFinance } from '@/hooks/use-finance';
import { useUpdateTransaction, useWithdrawals } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import { toast } from 'sonner';

export default function AdminWithdrawals() {
  const { wallet } = useCreatorFinance();
  const walletId = wallet?.id ?? '';

  const withdrawalsQuery = useWithdrawals(walletId, 'pending');
  const withdrawals = withdrawalsQuery.data?.data ?? [];
  const updateTransaction = useUpdateTransaction();

  const handleComplete = async (transactionId: string) => {
    const { error } = await updateTransaction.mutateAsync({
      transactionId,
      updates: { status: 'completed' },
    });

    if (error) {
      toast.error(error.message || 'Failed to update withdrawal.');
      return;
    }

    toast.success('Withdrawal marked as completed.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-2">Admin Withdrawals</h1>
            <p className="text-muted-foreground">Simulate approvals for pending withdrawal requests.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Approve to move withdrawals into completed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {withdrawals.length === 0 && !withdrawalsQuery.isLoading ? (
                <div className="text-sm text-muted-foreground">No pending withdrawals.</div>
              ) : null}
              {withdrawals.map((withdrawal: any) => (
                <div
                  key={withdrawal.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border rounded-lg p-4"
                >
                  <div>
                    <div className="font-semibold">{withdrawal.source}</div>
                    <div className="text-sm text-muted-foreground">
                      Requested {formatTimeAgo(withdrawal.created_at)}
                    </div>
                    <div className="text-sm font-medium text-accent mt-1">
                      {formatCurrency(withdrawal.amount)}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleComplete(withdrawal.id)}
                    disabled={updateTransaction.isPending}
                  >
                    Mark Completed
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
