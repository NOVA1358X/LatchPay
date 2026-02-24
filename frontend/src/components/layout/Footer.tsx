import { Link } from 'react-router-dom';
import { Github, Twitter, FileText, ExternalLink } from 'lucide-react';
import Logo from './Logo';

const footerLinks = {
  product: [
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Explorer', href: '/search' },
    { label: 'Seller Dashboard', href: '/seller' },
  ],
  developers: [
    { label: 'Getting Started', href: '/docs?section=overview' },
    { label: 'Integration Guide', href: '/docs?section=integration' },
    { label: 'Smart Contracts', href: '/settings' },
    { label: 'GitHub', href: 'https://github.com/NOVA1358X/LatchPay', external: true },
  ],
  resources: [
    { label: 'How It Works', href: '/docs?section=how-it-works' },
    { label: 'Security', href: '/docs?section=security' },
    { label: 'Buyer Dashboard', href: '/buyer' },
    { label: 'Settings', href: '/settings' },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Logo className="w-8 h-8" />
              <span className="font-display font-bold text-xl gradient-text">
                LatchPay
              </span>
            </div>
            <p className="text-surface-500 dark:text-surface-400 text-sm max-w-xs mb-6">
              Trust-minimized micropayments for APIs on Polygon. Pay-per-use with escrow protection and verifiable delivery proofs.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://twitter.com/latchpay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 hover:text-primary-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://github.com/NOVA1358X/LatchPay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-surface-400 hover:text-primary-500 transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="/docs"
                className="text-surface-400 hover:text-primary-500 transition-colors"
              >
                <FileText className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Developers
            </h4>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-surface-900 dark:text-surface-100 mb-4">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-surface-200 dark:border-surface-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-surface-500 dark:text-surface-400">
            © {new Date().getFullYear()} LatchPay. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400">
            <span>Built on</span>
            <a
              href="https://polygon.technology"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-600 transition-colors"
            >
              Polygon
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
