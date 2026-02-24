import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  Shield,
  Link2,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/common';
import { useTheme } from '../providers/ThemeProvider';
import { addresses } from '../config/constants';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    payments: true,
    disputes: true,
    releases: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Settings
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Configure your LatchPay preferences
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Theme */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Appearance
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Choose your preferred color theme
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'system', label: 'System', icon: Monitor },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                    className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                      theme === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        theme === option.value
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-surface-500'
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        theme === option.value
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-surface-700 dark:text-surface-300'
                      }`}
                    >
                      {option.label}
                    </span>
                    {theme === option.value && (
                      <motion.div
                        layoutId="theme-check"
                        className="absolute right-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Network Info */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Network
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  LatchPay operates exclusively on Polygon Mainnet
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
                <span className="text-surface-600 dark:text-surface-400">Network</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-surface-900 dark:text-white">Polygon PoS</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
                <span className="text-surface-600 dark:text-surface-400">Chain ID</span>
                <span className="font-mono text-surface-900 dark:text-white">137</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800">
                <span className="text-surface-600 dark:text-surface-400">Payment Token</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-surface-900 dark:text-white">USDC</span>
                  <span className="font-mono text-xs text-surface-500">0x3c49...3359</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-surface-600 dark:text-surface-400">Block Explorer</span>
                <a
                  href="https://polygonscan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline"
                >
                  PolygonScan
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </motion.section>

          {/* Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Notifications
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Browser notifications for important events
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'payments', label: 'New Payments', description: 'When you receive a payment' },
                { key: 'disputes', label: 'Disputes', description: 'When a payment is disputed' },
                { key: 'releases', label: 'Releases', description: 'When funds are released' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-surface-100 dark:border-surface-800 last:border-0"
                >
                  <div>
                    <p className="font-medium text-surface-900 dark:text-white">{item.label}</p>
                    <p className="text-sm text-surface-500">{item.description}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof prev],
                      }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[item.key as keyof typeof notifications]
                        ? 'bg-primary-500'
                        : 'bg-surface-300 dark:bg-surface-600'
                    }`}
                  >
                    <motion.div
                      layout
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      animate={{
                        left: notifications[item.key as keyof typeof notifications] ? 28 : 4,
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Contract Addresses */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Contracts
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  LatchPay smart contract addresses
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'EndpointRegistry', address: addresses.EndpointRegistry },
                { name: 'EscrowVault', address: addresses.EscrowVault },
                { name: 'SellerBondVault', address: addresses.SellerBondVault },
                { name: 'ReceiptStore', address: addresses.ReceiptStore },
                { name: 'ReputationEngine', address: addresses.ReputationEngine },
                { name: 'PaymentRouter', address: addresses.PaymentRouter },
              ].map((contract) => (
                <div
                  key={contract.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-800/50"
                >
                  <span className="font-medium text-surface-900 dark:text-white">
                    {contract.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-xs text-surface-500">
                      {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                    </code>
                    <a
                      href={`https://polygonscan.com/address/${contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-sm text-surface-500">
              All contracts deployed on Polygon PoS (Chain ID 137)
            </p>
          </motion.section>

          {/* Security */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Security
                </h2>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Manage wallet connections and permissions
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="text-left">
                  <p className="font-medium text-surface-900 dark:text-white">
                    Connected Wallets
                  </p>
                  <p className="text-sm text-surface-500">
                    Manage connected wallet addresses
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
                <div className="text-left">
                  <p className="font-medium text-surface-900 dark:text-white">
                    Token Approvals
                  </p>
                  <p className="text-sm text-surface-500">
                    View and revoke USDC approvals
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </button>
            </div>
          </motion.section>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end"
          >
            <Button onClick={handleSave} icon={saved ? Check : undefined}>
              {saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
