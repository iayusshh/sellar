import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, IndianRupee, Clock } from 'lucide-react';

const mockTransactions = [
  { id: 1, type: 'income', amount: 450.00, source: 'Digital Product Sale', time: '2 hours ago' },
  { id: 2, type: 'withdrawal', amount: 200.00, source: 'Bank Transfer', time: '5 hours ago' },
  { id: 3, type: 'income', amount: 89.99, source: 'Subscription Payment', time: '1 day ago' },
  { id: 4, type: 'income', amount: 125.50, source: 'Tip from supporter', time: '2 days ago' },
];

export default function WalletPreview() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
              Track every rupee,
              <span className="block text-accent">effortlessly</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Get a complete overview of your earnings with our intuitive wallet dashboard. 
              Monitor transactions, track trends, and manage your finances with confidence.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-3xl font-bold text-accent mb-2">₹12,450</div>
                <div className="text-sm text-muted-foreground">Total Earnings</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-accent mb-2">+23%</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>
          </div>

          {/* Wallet Card Preview */}
          <div className="animate-slide-in-right">
            <Card className="shadow-2xl">
              <CardHeader className="gradient-primary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Your Wallet</CardTitle>
                  <IndianRupee className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold mt-4">₹8,234.50</div>
                <div className="text-sm opacity-80">Available Balance</div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold">Recent Transactions</h3>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                
                <div className="space-y-4">
                  {mockTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                          <div className="text-xs text-muted-foreground">{transaction.time}</div>
                        </div>
                      </div>
                      <div className={`font-semibold ${
                        transaction.type === 'income' ? 'text-accent' : 'text-orange-500'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
