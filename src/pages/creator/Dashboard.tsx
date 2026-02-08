import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IndianRupee, TrendingUp, Calendar, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useCreatorFinance } from '@/hooks/use-finance';
import { formatCurrency } from '@/lib/currency';
import { formatTimeAgo } from '@/lib/date';

export default function Dashboard() {
  const { summary, isLoading } = useCreatorFinance();
  const recentTransactions = summary.recentTransactions;

  const valueOrDash = (value: number) =>
    isLoading ? '—' : formatCurrency(value);

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-display font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Your financial control center for Sellar.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
                <IndianRupee className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{valueOrDash(summary.availableBalance)}</div>
                <p className="text-xs text-muted-foreground mt-1">Ready to withdraw</p>
              </CardContent>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Earnings</CardTitle>
                <TrendingUp className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{valueOrDash(summary.monthlyEarnings)}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </CardContent>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
                <Calendar className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{valueOrDash(summary.lifetimeEarnings)}</div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Withdrawals</CardTitle>
                <Clock className="w-4 h-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{valueOrDash(summary.pendingWithdrawals)}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Earnings Chart */}
            <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle>Earnings Overview</CardTitle>
                <CardDescription>Your earnings over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={summary.earningsSeries}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area 
                      type="monotone" 
                      dataKey="earnings"
                      stroke="hsl(var(--accent))" 
                      fillOpacity={1}
                      fill="url(#colorEarnings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length === 0 && !isLoading ? (
                    <div className="text-sm text-muted-foreground">No transactions yet.</div>
                  ) : null}
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.type === 'income' ? 'bg-accent/10' : 'bg-orange-500/10'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft className="w-4 h-4 text-accent" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{transaction.source}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTimeAgo(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className={`font-semibold text-sm ${
                        transaction.type === 'income' ? 'text-accent' : 'text-orange-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-6" asChild>
                  <Link to="/creator/wallet">View All Transactions</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 animate-fade-in">
            <h2 className="text-2xl font-display font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto py-6" asChild>
                <Link to="/creator/wallet">
                  <div className="text-left">
                    <div className="font-semibold mb-1">Withdraw</div>
                    <div className="text-xs text-muted-foreground">Send money to your bank</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-6" asChild>
                <Link to="/creator/products">
                  <div className="text-left">
                    <div className="font-semibold mb-1">Add Product</div>
                    <div className="text-xs text-muted-foreground">List a product or service</div>
                  </div>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-6">
                <div className="text-left">
                  <div className="font-semibold mb-1">Share Storefront</div>
                  <div className="text-xs text-muted-foreground">Copy your public link</div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
