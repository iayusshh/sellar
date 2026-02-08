import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminData, useUpdateCommission } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function AdminPortal() {
  const adminQuery = useAdminData();
  const { users, wallets, transactions, products, clients, purchases, visits } =
    adminQuery.data ?? {
      users: [],
      wallets: [],
      transactions: [],
      products: [],
      clients: [],
      purchases: [],
      visits: [],
    };

  const updateCommission = useUpdateCommission();
  const [editingCommission, setEditingCommission] = useState<Record<string, string>>({});
  const cardClass = 'bg-slate-900/70 border-slate-800 text-slate-100';

  const creators = users.filter((user: any) => !user.is_admin && !user.is_owner);
  const walletsByUser = new Map(wallets.map((wallet: any) => [wallet.user_id, wallet]));

  const creatorMetrics = useMemo(() => {
    return creators.map((creator: any) => {
      const creatorWallet = walletsByUser.get(creator.id);
      const creatorTransactions = transactions.filter(
        (txn: any) => txn.wallet_id === creatorWallet?.id
      );
      const creatorProducts = products.filter(
        (product: any) => product.creator_id === creator.id
      );
      const creatorClients = clients.filter(
        (client: any) => client.creator_id === creator.id
      );
      const creatorPurchases = purchases.filter(
        (purchase: any) => purchase.creator_id === creator.id
      );

      const income = creatorTransactions.filter(
        (txn: any) => txn.type === 'income' && txn.status === 'completed'
      );
      const withdrawals = creatorTransactions.filter(
        (txn: any) => txn.type === 'withdrawal' && txn.status === 'pending'
      );

      const lifetimeEarnings = income.reduce(
        (sum: number, txn: any) => sum + Number(txn.amount || 0),
        0
      );
      const pendingWithdrawals = withdrawals.reduce(
        (sum: number, txn: any) => sum + Number(txn.amount || 0),
        0
      );
      const commissionRate = Number(creator.commission_rate ?? 0.2);
      const commissionEarned = lifetimeEarnings * commissionRate;

      return {
        creator,
        wallet: creatorWallet,
        productsCount: creatorProducts.length,
        clientsCount: creatorClients.length,
        purchasesCount: creatorPurchases.length,
        lifetimeEarnings,
        pendingWithdrawals,
        commissionEarned,
      };
    });
  }, [creators, wallets, transactions, products, clients, purchases]);

  const totalCommission = creatorMetrics.reduce(
    (sum, creator) => sum + creator.commissionEarned,
    0
  );

  const pendingWithdrawals = transactions.filter(
    (txn: any) => txn.type === 'withdrawal' && txn.status === 'pending'
  );

  const totalTraffic = visits.length;

  const handleCommissionSave = async (creatorId: string) => {
    const value = editingCommission[creatorId];
    if (!value) {
      toast.error('Enter a commission rate.');
      return;
    }
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 0.3) {
      toast.error('Commission must be between 0 and 0.30');
      return;
    }

    const { error } = await updateCommission.mutateAsync({
      userId: creatorId,
      commissionRate: parsed,
    });

    if (error) {
      toast.error(error.message || 'Failed to update commission.');
      return;
    }

    toast.success('Commission updated.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold mb-2">Admin Portal</h1>
            <p className="text-slate-400">Sellar control room.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Total Commission</CardTitle>
                <CardDescription className="text-slate-400">All time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-300">
                  {formatCurrency(totalCommission)}
                </div>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Pending Withdrawals</CardTitle>
                <CardDescription className="text-slate-400">Creator requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{pendingWithdrawals.length}</div>
              </CardContent>
            </Card>
            <Card className={cardClass}>
              <CardHeader>
                <CardTitle>Total Traffic</CardTitle>
                <CardDescription className="text-slate-400">Recorded visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalTraffic}</div>
              </CardContent>
            </Card>
          </div>

          <Card className={`mb-8 ${cardClass}`}>
            <CardHeader>
              <CardTitle>Creators</CardTitle>
              <CardDescription className="text-slate-400">
                Monitor earnings, products, and commission settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {creatorMetrics.length === 0 && !adminQuery.isLoading ? (
                <div className="text-sm text-slate-400">No creators found.</div>
              ) : null}
              {creatorMetrics.map((item) => (
                <div key={item.creator.id} className="border border-slate-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="font-semibold">{item.creator.display_name}</div>
                      <div className="text-sm text-slate-400">@{item.creator.handle}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Lifetime</div>
                        <div className="font-semibold">{formatCurrency(item.lifetimeEarnings)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Pending</div>
                        <div className="font-semibold">{formatCurrency(item.pendingWithdrawals)}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Products</div>
                        <div className="font-semibold">{item.productsCount}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Clients</div>
                        <div className="font-semibold">{item.clientsCount}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mt-4">
                    <div className="text-sm text-slate-400">
                      Commission earned: {formatCurrency(item.commissionEarned)}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={0.3}
                        className="h-9 w-24 rounded-md border border-slate-800 bg-slate-950/60 px-2 text-sm"
                        value={editingCommission[item.creator.id] ?? item.creator.commission_rate ?? 0.2}
                        onChange={(event) =>
                          setEditingCommission((prev) => ({
                            ...prev,
                            [item.creator.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => handleCommissionSave(item.creator.id)}
                        disabled={updateCommission.isPending}
                      >
                        Save Rate
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={`mb-8 ${cardClass}`}>
            <CardHeader>
              <CardTitle>Users & Purchases</CardTitle>
              <CardDescription className="text-slate-400">
                Registered users and their purchase activity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clients.length === 0 && !adminQuery.isLoading ? (
                <div className="text-sm text-slate-400">No client records yet.</div>
              ) : null}
              {clients.map((client: any) => {
                const clientPurchases = purchases.filter(
                  (purchase: any) => purchase.client_id === client.id
                );
                return (
                  <div key={client.id} className="border border-slate-800 rounded-lg p-4">
                    <div className="font-semibold">{client.name}</div>
                    <div className="text-sm text-slate-400">
                      {client.email || 'No email'} • {client.location || 'Unknown location'}
                    </div>
                    <div className="text-sm text-slate-400 mt-2">
                      Purchases: {clientPurchases.length}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className={cardClass}>
            <CardHeader>
              <CardTitle>Recent Visits</CardTitle>
              <CardDescription className="text-slate-400">Latest traffic signals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {visits.length === 0 && !adminQuery.isLoading ? (
                <div className="text-sm text-slate-400">No visits recorded.</div>
              ) : null}
              {visits.slice(0, 10).map((visit: any) => (
                <div key={visit.id} className="border border-slate-800 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="font-semibold">{visit.path}</div>
                      <div className="text-sm text-slate-400">
                        {visit.referrer || 'Direct'} • {visit.city || 'Unknown city'}
                      </div>
                    </div>
                    <div className="text-sm text-slate-400">
                      {formatTimeAgo(visit.created_at)}
                    </div>
                  </div>
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
