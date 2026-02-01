import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import {
  Wallet,
  Receipt,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { Button, CardSkeleton } from '../components/common';
import { useBuyerPayments } from '../hooks/usePayments';

const statusConfig = {
  0: { label: 'Pending', icon: Clock, color: 'yellow' },
  1: { label: 'Delivered', icon: CheckCircle2, color: 'blue' },
  2: { label: 'Released', icon: CheckCircle2, color: 'green' },
  3: { label: 'Refunded', icon: RefreshCw, color: 'purple' },
  4: { label: 'Disputed', icon: AlertTriangle, color: 'red' },
};

export default function BuyerDashboard() {
  const { primaryWallet } = useDynamicContext();
  const { payments, isLoading, refetch } = useBuyerPayments(primaryWallet?.address);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredPayments = payments.filter((payment) => {
    if (filter === 'pending') return payment.status === 0 || payment.status === 1;
    if (filter === 'completed') return payment.status === 2 || payment.status === 3;
    return true;
  });

  if (!primaryWallet) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-surface-400" />
          </div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Connect your wallet to view your payments and receipts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Buyer Dashboard
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400">
              Manage your payments, receipts, and disputes
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Payments', value: payments.length, icon: Receipt },
            { label: 'Pending', value: payments.filter((p) => p.status === 0).length, icon: Clock },
            { label: 'Completed', value: payments.filter((p) => p.status === 2).length, icon: CheckCircle2 },
            { label: 'Disputed', value: payments.filter((p) => p.status === 4).length, icon: AlertTriangle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-surface-400" />
                  <span className="text-sm text-surface-600 dark:text-surface-400">
                    {stat.label}
                  </span>
                </div>
                <p className="text-2xl font-bold text-surface-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={RefreshCw}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>

        {/* Payments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              No payments found
            </h3>
            <p className="text-surface-600 dark:text-surface-400">
              Your payments will appear here once you make your first API call
            </p>
          </div>
        ) : (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredPayments.map((payment, index) => {
              const status = statusConfig[payment.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock;
              
              return (
                <motion.div
                  key={payment.paymentId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        status?.color === 'green'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : status?.color === 'yellow'
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : status?.color === 'red'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      }`}>
                        <StatusIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-surface-600 dark:text-surface-400 mb-1">
                          {payment.paymentId.slice(0, 10)}...{payment.paymentId.slice(-8)}
                        </p>
                        <p className="font-semibold text-surface-900 dark:text-white mb-1">
                          ${(Number(payment.amount) / 1e6).toFixed(4)} USDC
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {new Date(Number(payment.openedAt) * 1000).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${
                        status?.color === 'green'
                          ? 'badge-success'
                          : status?.color === 'yellow'
                          ? 'badge-warning'
                          : status?.color === 'red'
                          ? 'badge-error'
                          : 'badge-primary'
                      }`}>
                        {status?.label}
                      </span>
                      <a
                        href={`https://polygonscan.com/tx/${payment.paymentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-surface-400" />
                      </a>
                    </div>
                  </div>

                  {/* Actions for pending/delivered payments */}
                  {(payment.status === 0 || payment.status === 1) && (
                    <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-800 flex items-center justify-between">
                      <p className="text-sm text-surface-600 dark:text-surface-400">
                        Dispute window ends: {new Date(Number(payment.disputeWindowEnds) * 1000).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        {payment.status === 1 && (
                          <Button variant="danger" size="sm" icon={AlertTriangle}>
                            Dispute
                          </Button>
                        )}
                        {payment.status === 0 && (
                          <Button variant="secondary" size="sm" icon={RefreshCw}>
                            Request Refund
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
