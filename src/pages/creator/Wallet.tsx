import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, ArrowUpRight, ArrowDownLeft, CreditCard, Download, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCreatorFinance } from '@/hooks/use-finance';
import { useCreateTransaction } from '@/integrations/supabase/hooks';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';
import { toast } from 'sonner';

export default function Wallet() {
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const { transactions, summary, wallet, isLoading } = useCreatorFinance();
  const createTransaction = useCreateTransaction();

  const availableBalance = summary.availableBalance;
  const pendingBalance = summary.pendingWithdrawals;
  const totalEarnings = summary.lifetimeEarnings;

  const withdrawValue = Number(withdrawAmount || 0);
  const withdrawError = useMemo(() => {
    if (!withdrawAmount) return '';
    if (Number.isNaN(withdrawValue) || withdrawValue <= 0) {
      return 'Enter a valid amount.';
    }
    if (withdrawValue > availableBalance) {
      return 'Amount exceeds available balance.';
    }
    return '';
  }, [withdrawAmount, withdrawValue, availableBalance]);

  const handleWithdraw = async () => {
    if (!wallet?.id) {
      toast.error('Wallet not found. Please try again.');
      return;
    }
    if (withdrawError || !withdrawValue) {
      toast.error(withdrawError || 'Enter a valid amount.');
      return;
    }

    const { error } = await createTransaction.mutateAsync({
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: withdrawValue,
      currency: 'INR',
      source: 'Withdrawal Request',
      status: 'pending',
    });

    if (error) {
      toast.error(error.message || 'Failed to request withdrawal.');
      return;
    }

    toast.success('Withdrawal request submitted.');
    setWithdrawAmount('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-display font-bold mb-2">Wallet</h1>
            <p className="text-muted-foreground">Manage your earnings and transactions</p>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="gradient-primary text-primary-foreground animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium opacity-90">Available Balance</CardTitle>
                  <IndianRupee className="w-5 h-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? '—' : formatCurrency(availableBalance)}
                </div>
                <p className="text-sm opacity-75">Ready to withdraw</p>
              </CardContent>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? '—' : formatCurrency(pendingBalance)}
                </div>
                <p className="text-sm text-muted-foreground">Processing</p>
              </CardContent>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
                  <Download className="w-5 h-5 text-accent" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">
                  {isLoading ? '—' : formatCurrency(totalEarnings)}
                </div>
                <p className="text-sm text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions and Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Withdrawal Card */}
            <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
                <CardDescription>Transfer money to your bank account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      className="pl-9"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: {isLoading ? '—' : formatCurrency(availableBalance)}
                  </p>
                  {withdrawError ? (
                    <p className="text-xs text-red-500">{withdrawError}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Withdrawal Method</Label>
                  <select
                    id="method"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>IMPS/NEFT</option>
                  </select>
                </div>

                <Button
                  className="w-full"
                  disabled={!withdrawAmount || !!withdrawError || isLoading || createTransaction.isPending}
                  onClick={handleWithdraw}
                >
                  <Send className="mr-2 w-4 h-4" />
                  {createTransaction.isPending ? 'Submitting...' : 'Withdraw Funds'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Withdrawals typically take 2-5 business days
                </p>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>All your recent transactions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 w-4 h-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!isLoading && transactions.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No transactions yet.</div>
                  ) : null}
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-accent/10' : 'bg-orange-500/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft className="w-5 h-5 text-accent" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.source}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimeAgo(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.type === 'income' ? 'text-accent' : 'text-orange-500'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-6">
                  Load More
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
