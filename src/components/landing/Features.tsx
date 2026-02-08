import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, ShoppingBag, Shield, Zap, Users } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Digital Wallet Management',
    description: 'Track your earnings, manage transactions, and withdraw funds seamlessly with our secure wallet system.',
  },
  {
    icon: TrendingUp,
    title: 'Real-time Analytics',
    description: 'Get instant insights into your earnings, revenue trends, and performance metrics with beautiful charts.',
  },
  {
    icon: ShoppingBag,
    title: 'Customizable Storefront',
    description: 'Create a stunning public profile to showcase your products, services, and accept payments from fans.',
  },
  {
    icon: Shield,
    title: 'Bank-level Security',
    description: 'Your data and transactions are protected with enterprise-grade encryption and security measures.',
  },
  {
    icon: Zap,
    title: 'Instant Notifications',
    description: 'Stay updated with real-time notifications for every transaction, payment, and milestone.',
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join a thriving community of creators and get dedicated support whenever you need it.',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Everything you need to succeed
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help creators manage, grow, and monetize their work.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
