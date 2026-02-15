import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import WalletPreview from '@/components/landing/WalletPreview';
import FeatureShowcase from '@/components/landing/FeatureShowcase';
import CTA from '@/components/landing/CTA';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <WalletPreview />
        <FeatureShowcase />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
