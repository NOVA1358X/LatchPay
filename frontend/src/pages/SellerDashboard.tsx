import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import {
  Wallet,
  Plus,
  Store,
  DollarSign,
  TrendingUp,
  Shield,
  ExternalLink,
  Zap,
  Edit,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Button, Modal, CardSkeleton } from '../components/common';
import { useSellerEndpoints, useRegisterEndpoint } from '../hooks/useEndpoints';
import { useSellerPayments } from '../hooks/usePayments';
import { useSellerBond, useBondActions } from '../hooks/useBondVault';

export default function SellerDashboard() {
  const { primaryWallet } = useDynamicContext();
  const { endpoints, isLoading: endpointsLoading, refetch: refetchEndpoints } = useSellerEndpoints(primaryWallet?.address);
  const { payments } = useSellerPayments(primaryWallet?.address);
  const { bondInfo, isLoading: bondLoading, refetch: refetchBond } = useSellerBond(primaryWallet?.address);
  const { depositBond, withdrawBond, isLoading: bondActionLoading } = useBondActions();
  const { registerEndpoint, isLoading: isRegistering } = useRegisterEndpoint();
  
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBondModal, setShowBondModal] = useState(false);
  const [bondAmount, setBondAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'endpoints' | 'earnings' | 'bond'>('endpoints');
  
  // Registration form state
  const [regForm, setRegForm] = useState({
    metadataURI: '',
    pricePerCall: '0.01',
    category: 'ai',
    disputeWindowHours: 24,
  });
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Calculate stats
  const totalEarnings = payments
    .filter((p) => p.status === 2)
    .reduce((acc, p) => acc + Number(p.amount), 0) / 1e6;
  
  const pendingEarnings = payments
    .filter((p) => p.status === 1)
    .reduce((acc, p) => acc + Number(p.amount), 0) / 1e6;

  const bondBalance = bondInfo ? Number(bondInfo.bondAmount) / 1e6 : 0;

  const handleRegisterEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    
    if (!regForm.metadataURI) {
      setRegError('Please enter a metadata URI');
      return;
    }
    
    try {
      const result = await registerEndpoint({
        metadataURI: regForm.metadataURI,
        pricePerCall: regForm.pricePerCall,
        category: regForm.category,
        disputeWindowHours: regForm.disputeWindowHours,
      });
      
      setRegSuccess(`Endpoint registered! TX: ${result.hash.slice(0, 10)}...`);
      setRegForm({ metadataURI: '', pricePerCall: '0.01', category: 'ai', disputeWindowHours: 24 });
      refetchEndpoints();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowRegisterModal(false);
        setRegSuccess(null);
      }, 2000);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Failed to register endpoint');
    }
  };

  const handleDeposit = async () => {
    if (!bondAmount || isNaN(Number(bondAmount))) return;
    try {
      await depositBond(bondAmount);
      setBondAmount('');
      setShowBondModal(false);
      refetchBond();
    } catch (error) {
      console.error('Failed to deposit bond:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!bondInfo?.canWithdraw || bondBalance === 0) return;
    try {
      await withdrawBond(bondBalance.toString());
      refetchBond();
    } catch (error) {
      console.error('Failed to withdraw bond:', error);
    }
  };

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
            Connect your wallet to manage your API endpoints and earnings
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
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
          >
            <div>
              <h1 className="font-display text-4xl font-bold text-surface-900 dark:text-white mb-4">
                Seller Dashboard
              </h1>
              <p className="text-lg text-surface-600 dark:text-surface-400">
                Register endpoints, manage your APIs, and track earnings
              </p>
            </div>
            <Button
              size="lg"
              icon={Plus}
              onClick={() => setShowRegisterModal(true)}
            >
              Register Endpoint
            </Button>
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
            { label: 'Total Endpoints', value: endpoints.length, icon: Store },
            { label: 'Total Earnings', value: `$${totalEarnings.toFixed(2)}`, icon: DollarSign },
            { label: 'Pending', value: `$${pendingEarnings.toFixed(2)}`, icon: TrendingUp },
            { label: 'Bond Deposited', value: bondLoading ? '...' : `$${bondBalance.toFixed(2)}`, icon: Shield },
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

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-surface-200 dark:border-surface-800">
          {(['endpoints', 'earnings', 'bond'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'endpoints' && (
          <div>
            {endpointsLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : endpoints.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  No endpoints registered
                </h3>
                <p className="text-surface-600 dark:text-surface-400 mb-6">
                  Register your first API endpoint to start accepting payments
                </p>
                <Button icon={Plus} onClick={() => setShowRegisterModal(true)}>
                  Register Endpoint
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {endpoints.map((endpoint, index) => (
                  <motion.div
                    key={endpoint.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-mono text-sm text-surface-500 dark:text-surface-400">
                            {endpoint.endpointId.slice(0, 10)}...
                          </p>
                          <p className="text-lg font-semibold gradient-text">
                            ${(Number(endpoint.pricePerCall) / 1e6).toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <span className={`badge ${endpoint.active ? 'badge-success' : 'badge-error'}`}>
                        {endpoint.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-600 dark:text-surface-400">Total Calls</span>
                        <span className="text-surface-900 dark:text-white">
                          {endpoint.totalCalls.toString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-surface-600 dark:text-surface-400">Dispute Window</span>
                        <span className="text-surface-900 dark:text-white">
                          {Number(endpoint.disputeWindowSeconds) / 3600}h
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-surface-200 dark:border-surface-800">
                      <Button variant="ghost" size="sm" icon={Edit}>
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={endpoint.active ? EyeOff : Eye}
                      >
                        {endpoint.active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <a
                        href={`https://polygonscan.com/address/${endpoint.seller}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-surface-400" />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
              Earnings Overview
            </h3>
            <p className="text-surface-600 dark:text-surface-400 mb-4">
              Track your earnings from API calls. Earnings are automatically released after the dispute window.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">Released</p>
                <p className="text-2xl font-bold gradient-text">${totalEarnings.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl">
                <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${pendingEarnings.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bond' && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                Seller Bond
              </h3>
              <p className="text-surface-600 dark:text-surface-400">
                Deposit a bond to enable higher-value endpoints and build trust with buyers.
              </p>
            </div>

            {bondLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Bond Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">Current Bond</p>
                    <p className="text-2xl font-bold gradient-text">${bondBalance.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">Active Payments</p>
                    <p className="text-2xl font-bold text-surface-900 dark:text-white">
                      {bondInfo?.activePayments?.toString() || '0'}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-50 dark:bg-surface-800 rounded-xl text-center">
                    <p className="text-sm text-surface-600 dark:text-surface-400 mb-1">Status</p>
                    <p className={`text-lg font-bold ${bondInfo?.canWithdraw ? 'text-green-500' : 'text-yellow-500'}`}>
                      {bondInfo?.canWithdraw ? 'Withdrawable' : 'Locked'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center gap-4">
                  <Button 
                    icon={Plus} 
                    onClick={() => setShowBondModal(true)}
                    disabled={bondActionLoading}
                  >
                    {bondActionLoading ? 'Processing...' : 'Deposit Bond'}
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={handleWithdraw}
                    disabled={!bondInfo?.canWithdraw || bondActionLoading || bondBalance === 0}
                  >
                    {bondActionLoading ? 'Processing...' : 'Withdraw'}
                  </Button>
                </div>

                {!bondInfo?.canWithdraw && bondBalance > 0 && (
                  <p className="text-center text-sm text-yellow-600 dark:text-yellow-400">
                    Bond is locked while you have active payments. Complete all payments to withdraw.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Modal */}
      <Modal
        isOpen={showRegisterModal}
        onClose={() => { setShowRegisterModal(false); setRegError(null); setRegSuccess(null); }}
        title="Register New Endpoint"
        size="lg"
      >
        <form className="space-y-6" onSubmit={handleRegisterEndpoint}>
          {regSuccess && (
            <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300">{regSuccess}</span>
            </div>
          )}
          
          {regError && (
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-300">
              {regError}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-surface-900 dark:text-white mb-2">
              Metadata URI
            </label>
            <input
              type="text"
              placeholder="ipfs://... or https://..."
              className="input"
              value={regForm.metadataURI}
              onChange={(e) => setRegForm({ ...regForm, metadataURI: e.target.value })}
              disabled={isRegistering}
            />
            <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
              IPFS or HTTP URL pointing to your endpoint metadata JSON
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 dark:text-white mb-2">
              Price per Call (USDC)
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="0.01"
              className="input"
              value={regForm.pricePerCall}
              onChange={(e) => setRegForm({ ...regForm, pricePerCall: e.target.value })}
              disabled={isRegistering}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 dark:text-white mb-2">
              Category
            </label>
            <select 
              className="input"
              value={regForm.category}
              onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
              disabled={isRegistering}
            >
              <option value="ai">AI & ML</option>
              <option value="data">Data & Analytics</option>
              <option value="compute">Compute</option>
              <option value="storage">Storage</option>
              <option value="oracle">Oracles</option>
              <option value="identity">Identity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-900 dark:text-white mb-2">
              Dispute Window (hours)
            </label>
            <input
              type="number"
              min={1}
              max={720}
              className="input"
              value={regForm.disputeWindowHours}
              onChange={(e) => setRegForm({ ...regForm, disputeWindowHours: Number(e.target.value) })}
              disabled={isRegistering}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setShowRegisterModal(false); setRegError(null); setRegSuccess(null); }}
              disabled={isRegistering}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isRegistering}>
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Registering...
                </>
              ) : (
                'Register Endpoint'
              )}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bond Deposit Modal */}
      <Modal
        isOpen={showBondModal}
        onClose={() => setShowBondModal(false)}
        title="Deposit Bond"
      >
        <div className="space-y-4">
          <p className="text-surface-600 dark:text-surface-400">
            Deposit USDC as collateral to secure your endpoints. Higher bonds allow for higher-value transactions.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-surface-900 dark:text-white mb-2">
              Amount (USDC)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="100.00"
              value={bondAmount}
              onChange={(e) => setBondAmount(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowBondModal(false)}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={handleDeposit}
              disabled={bondActionLoading || !bondAmount}
            >
              {bondActionLoading ? 'Processing...' : 'Deposit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
