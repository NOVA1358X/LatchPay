import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  Shield,
  Users,
  Zap,
  Copy,
  Check,
  AlertCircle,
  Play,
  Star,
  Loader2,
} from 'lucide-react';
import { Button, Modal } from '../components/common';
import { useEndpoints } from '../hooks/useEndpoints';
import { useEscrow } from '../hooks/useEscrow';
import { useSellerReputation } from '../hooks/useReputation';
import featuredEndpointsData from '../data/featured-endpoints.json';
import categoriesData from '../data/categories.json';

export default function EndpointDetails() {
  const { endpointId } = useParams<{ endpointId: string }>();
  const { primaryWallet } = useDynamicContext();
  const [showPayModal, setShowPayModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch on-chain endpoints
  const { endpoints: onchainEndpoints } = useEndpoints();
  const { openPayment, isLoading: isProcessing } = useEscrow();

  // Find on-chain endpoint first, fallback to static data
  const onchainEndpoint = useMemo(() => {
    return onchainEndpoints.find((e) => e.endpointId === endpointId);
  }, [onchainEndpoints, endpointId]);

  const staticEndpoint = useMemo(() => {
    return featuredEndpointsData.find((e) => e.id === endpointId);
  }, [endpointId]);

  // Merged endpoint view
  const endpoint = useMemo(() => {
    if (onchainEndpoint) {
      return {
        id: onchainEndpoint.endpointId,
        name: onchainEndpoint.metadataURI || `Endpoint ${onchainEndpoint.endpointId.slice(0, 10)}...`,
        description: staticEndpoint?.description || 'On-chain API endpoint',
        category: onchainEndpoint.category || staticEndpoint?.category || 'compute',
        pricePerCall: (Number(onchainEndpoint.pricePerCall) / 1e6).toFixed(6),
        seller: onchainEndpoint.seller,
        tags: staticEndpoint?.tags || [],
        featured: staticEndpoint?.featured || false,
        apiEndpoint: staticEndpoint?.apiEndpoint || `/api/paid/${onchainEndpoint.endpointId.slice(0, 8)}`,
        totalCalls: onchainEndpoint.totalCalls.toString(),
        disputeWindowHours: Number(onchainEndpoint.disputeWindowSeconds) / 3600,
        active: onchainEndpoint.active,
        isOnchain: true,
      };
    }
    if (staticEndpoint) {
      return {
        ...staticEndpoint,
        totalCalls: '--',
        disputeWindowHours: 24,
        active: true,
        isOnchain: false,
      };
    }
    return null;
  }, [onchainEndpoint, staticEndpoint]);

  // Seller reputation
  const { reputation: sellerRep } = useSellerReputation(endpoint?.seller);

  const category = useMemo(() => {
    return categoriesData.find((c) => c.id === endpoint?.category);
  }, [endpoint]);

  if (!endpoint) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Endpoint not found
        </h1>
        <Link to="/marketplace">
          <Button icon={ArrowLeft}>Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    if (!primaryWallet) {
      alert('Please connect your wallet first');
      return;
    }

    setPaymentError(null);
    setPaymentSuccess(null);

    try {
      const result = await openPayment(
        endpointId as `0x${string}`,
        endpoint.pricePerCall,
        `pay-${endpointId}-${Date.now()}`
      );
      setPaymentSuccess(`Payment opened! TX: ${result.hash.slice(0, 14)}...`);
      setTimeout(() => {
        setShowPayModal(false);
        setPaymentSuccess(null);
      }, 3000);
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error?.shortMessage || error?.message || 'Payment failed');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-surface-50 to-white dark:from-surface-900 dark:to-surface-950 border-b border-surface-200 dark:border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-surface-900 dark:text-white mb-2">
                  {endpoint.name}
                </h1>
                <p className="text-surface-600 dark:text-surface-400">
                  {endpoint.description}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="badge-primary">{category?.name}</span>
                  {endpoint.featured && (
                    <span className="badge-accent">Featured</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold gradient-text">
                  ${endpoint.pricePerCall}
                </div>
                <div className="text-surface-500 dark:text-surface-400 text-sm">
                  USDC per call
                </div>
              </div>
              <Button
                size="lg"
                icon={Play}
                onClick={() => setShowPayModal(true)}
              >
                Pay & Use
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* API Endpoint */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                API Endpoint
              </h2>
              <div className="flex items-center gap-2 p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <code className="flex-1 text-sm font-mono text-surface-700 dark:text-surface-300">
                  {endpoint.apiEndpoint}
                </code>
                <button
                  onClick={() => copyToClipboard(endpoint.apiEndpoint)}
                  className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-surface-400" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* How to Use */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                How to Use
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      1
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-900 dark:text-white">
                      Open Payment
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Call EscrowVault.openPayment() with the endpoint ID and your request hash
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      2
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-900 dark:text-white">
                      Make API Request
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Include the X-LatchPay-Payment-Id header with your paymentId
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                      3
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-surface-900 dark:text-white">
                      Receive Response
                    </h3>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      Get your data along with a signed delivery proof
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Code Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Code Example
              </h2>
              <pre className="p-4 bg-surface-900 dark:bg-surface-950 rounded-xl overflow-x-auto">
                <code className="text-sm text-surface-300">
{`// 1. Open payment escrow
const paymentId = await escrowVault.openPayment(
  endpointId,
  pricePerCall,
  requestHash
);

// 2. Make API request with payment proof
const response = await fetch('${endpoint.apiEndpoint}', {
  method: 'POST',
  headers: {
    'X-LatchPay-Payment-Id': paymentId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ /* your request */ })
});

// 3. Response includes delivery proof
const { data, deliveryProof } = await response.json();`}
                </code>
              </pre>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Statistics
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Users className="w-4 h-4" />
                    <span>Total Calls</span>
                  </div>
                  <span className="font-semibold text-surface-900 dark:text-white">
                    {endpoint.totalCalls}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Clock className="w-4 h-4" />
                    <span>Dispute Window</span>
                  </div>
                  <span className="font-semibold text-surface-900 dark:text-white">
                    {endpoint.disputeWindowHours} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                    <Shield className="w-4 h-4" />
                    <span>Seller Reputation</span>
                  </div>
                  <span className="font-semibold text-surface-900 dark:text-white">
                    {sellerRep ? `${(sellerRep.reputationScore / 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                {endpoint.isOnchain && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                      <Star className="w-4 h-4" />
                      <span>Status</span>
                    </div>
                    <span className={`font-semibold ${endpoint.active ? 'text-green-500' : 'text-red-500'}`}>
                      {endpoint.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Seller Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                Seller
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-accent-500" />
                <div>
                  <p className="font-mono text-sm text-surface-900 dark:text-white">
                    {endpoint.seller.slice(0, 6)}...{endpoint.seller.slice(-4)}
                  </p>
                  <a
                    href={`https://polygonscan.com/address/${endpoint.seller}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-500 hover:text-primary-600 inline-flex items-center gap-1"
                  >
                    View on Polygonscan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Tags */}
            {endpoint.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6"
              >
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {endpoint.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Confirm Payment"
        size="md"
      >
        <div className="space-y-6">
          {paymentSuccess && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center gap-3">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">{paymentSuccess}</span>
            </div>
          )}

          {paymentError && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-300">
              {paymentError}
            </div>
          )}

          <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-600 dark:text-surface-400">API</span>
              <span className="font-medium text-surface-900 dark:text-white">
                {endpoint.name}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-surface-600 dark:text-surface-400">Price</span>
              <span className="font-medium text-surface-900 dark:text-white">
                ${endpoint.pricePerCall} USDC
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-surface-600 dark:text-surface-400">Network</span>
              <span className="font-medium text-surface-900 dark:text-white">
                Polygon Mainnet
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Payment will be held in escrow until delivery is confirmed. You have a {endpoint.disputeWindowHours}-hour window to dispute.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowPayModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePayment}
              loading={isProcessing}
              disabled={!!paymentSuccess}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Opening Escrow...
                </>
              ) : paymentSuccess ? 'Payment Opened!' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
