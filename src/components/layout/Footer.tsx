import { Link } from 'react-router-dom';
import { Wallet, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <Wallet className="w-6 h-6 text-accent" />
              <span>Sellar</span>
            </Link>
            <p className="text-sm text-primary-foreground/80 max-w-md">
              Empower your creative journey with seamless wallet management, 
              storefront display, and earnings tracking all in one place.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-accent transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/creator/dashboard" className="hover:text-accent transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/creator/wallet" className="hover:text-accent transition-colors">
                  Wallet
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-accent transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-accent transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-accent transition-colors" aria-label="Email">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Sellar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
