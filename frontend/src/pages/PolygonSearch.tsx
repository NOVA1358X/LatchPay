import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Layers,
  Receipt,
} from 'lucide-react';
import { Button, CardSkeleton } from '../components/common';
import { usePolygonLogs, type LogEvent } from '../hooks/usePolygonLogs';

const eventTypes = [
  { id: 'all', label: 'All Events', icon: Layers },
  { id: 'PaymentOpened', label: 'Payments', icon: ArrowDownLeft },
  { id: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
  { id: 'Released', label: 'Released', icon: ArrowUpRight },
  { id: 'Disputed', label: 'Disputed', icon: AlertTriangle },
  { id: 'EndpointRegistered', label: 'Endpoints', icon: Receipt },
];

export default function PolygonSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const { logs, isLoading, error, refetch, hasMore, loadMore } = usePolygonLogs({
    eventType: selectedEventType === 'all' ? undefined : selectedEventType,
  });

  // Filter logs by search
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.transactionHash.toLowerCase().includes(query) ||
      log.address?.toLowerCase().includes(query) ||
      log.args?.buyer?.toLowerCase().includes(query) ||
      log.args?.seller?.toLowerCase().includes(query) ||
      log.args?.paymentId?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Polygon Explorer
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Real-time event scanning for all LatchPay transactions on Polygon Mainnet
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 max-w-2xl mx-auto"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search by address, tx hash, or payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-12 pr-4"
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - Event Types */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="sticky top-24">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                Event Types
              </h3>
              <div className="space-y-2">
                {eventTypes.map((event) => {
                  const Icon = event.icon;
                  return (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEventType(event.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        selectedEventType === event.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{event.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="mt-8 p-4 card">
                <h4 className="font-medium text-surface-900 dark:text-white mb-3">
                  Quick Stats
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-surface-600 dark:text-surface-400">Total Events</span>
                    <span className="font-medium text-surface-900 dark:text-white">{logs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-surface-600 dark:text-surface-400">Network</span>
                    <span className="font-medium text-surface-900 dark:text-white">Polygon</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-surface-600 dark:text-surface-400">Chain ID</span>
                    <span className="font-medium text-surface-900 dark:text-white">137</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-surface-600 dark:text-surface-400">
                {filteredLogs.length} events found
              </p>
              <Button
                variant="ghost"
                size="sm"
                icon={RefreshCw}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>

            {/* Events List */}
            {isLoading && logs.length === 0 ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  Error loading events
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-4">
                  {error.message}
                </p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  No events found
                </h3>
                <p className="text-surface-600 dark:text-surface-400">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : 'Events will appear here once contracts are deployed and used'}
                </p>
              </div>
            ) : (
              <>
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {filteredLogs.map((log, index) => (
                    <EventCard key={`${log.transactionHash}-${index}`} log={log} />
                  ))}
                </motion.div>

                {hasMore && (
                  <div className="mt-8 text-center">
                    <Button variant="secondary" onClick={loadMore} loading={isLoading}>
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCard({ log }: { log: LogEvent }) {
  const getEventConfig = (eventName: string) => {
    switch (eventName) {
      case 'PaymentOpened':
        return {
          icon: ArrowDownLeft,
          color: 'blue',
          label: 'Payment Opened',
        };
      case 'Delivered':
        return {
          icon: CheckCircle2,
          color: 'green',
          label: 'Delivered',
        };
      case 'Released':
        return {
          icon: ArrowUpRight,
          color: 'green',
          label: 'Released',
        };
      case 'Disputed':
        return {
          icon: AlertTriangle,
          color: 'red',
          label: 'Disputed',
        };
      case 'Refunded':
        return {
          icon: RefreshCw,
          color: 'purple',
          label: 'Refunded',
        };
      case 'EndpointRegistered':
        return {
          icon: Receipt,
          color: 'primary',
          label: 'Endpoint Registered',
        };
      default:
        return {
          icon: Layers,
          color: 'gray',
          label: eventName,
        };
    }
  };

  const config = getEventConfig(log.eventName);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              config.color === 'blue'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : config.color === 'green'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : config.color === 'red'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                : config.color === 'purple'
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-surface-900 dark:text-white">
                {config.label}
              </span>
              <span
                className={`badge ${
                  config.color === 'blue'
                    ? 'badge-primary'
                    : config.color === 'green'
                    ? 'badge-success'
                    : config.color === 'red'
                    ? 'badge-error'
                    : 'badge-primary'
                }`}
              >
                Block #{log.blockNumber}
              </span>
            </div>
            <p className="font-mono text-sm text-surface-500 dark:text-surface-400">
              {log.transactionHash.slice(0, 10)}...{log.transactionHash.slice(-8)}
            </p>
            {log.args?.amount && (
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                Amount: ${(Number(log.args.amount) / 1e6).toFixed(4)} USDC
              </p>
            )}
          </div>
        </div>
        <a
          href={`https://polygonscan.com/tx/${log.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-surface-400" />
        </a>
      </div>
    </motion.div>
  );
}
