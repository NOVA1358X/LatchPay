import { motion } from 'framer-motion';
import {
  Book,
  Code2,
  Shield,
  Zap,
  Terminal,
  FileCode,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';

const sections = [
  { id: 'overview', label: 'Overview', icon: Book },
  { id: 'how-it-works', label: 'How It Works', icon: Zap },
  { id: 'integration', label: 'Integration Guide', icon: Code2 },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

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
              Documentation
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Learn how to integrate LatchPay into your API and accept trustless micropayments
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="sticky top-24">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{section.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Quick Links */}
              <div className="mt-8 p-4 card">
                <h4 className="font-medium text-surface-900 dark:text-white mb-3">
                  Quick Links
                </h4>
                <div className="space-y-2">
                  <a
                    href="https://github.com/latchpay/latchpay"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    GitHub Repository
                  </a>
                  <a
                    href="https://polygonscan.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    <ExternalLink className="w-4 h-4" />
                    PolygonScan
                  </a>
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 prose prose-surface dark:prose-invert max-w-none"
          >
            {activeSection === 'overview' && <OverviewSection />}
            {activeSection === 'how-it-works' && <HowItWorksSection />}
            {activeSection === 'integration' && (
              <IntegrationSection copyToClipboard={copyToClipboard} copied={copied} />
            )}
            {activeSection === 'security' && <SecuritySection />}
          </motion.main>
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white mb-4">
          What is LatchPay?
        </h2>
        <p className="text-surface-600 dark:text-surface-400 leading-relaxed">
          LatchPay is a trust-minimized payment protocol for pay-per-use API micropayments on Polygon PoS.
          It combines HTTP 402 semantics with escrow-based buyer protection, allowing API sellers to
          monetize their services without requiring trust from buyers.
        </p>
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Key Features
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Shield,
              title: 'Escrow Protection',
              description: 'All payments are held in escrow until delivery is confirmed.',
            },
            {
              icon: Zap,
              title: 'Instant Settlements',
              description: 'Payments settle on Polygon in seconds, not days.',
            },
            {
              icon: Lock,
              title: 'EIP-712 Signatures',
              description: 'Cryptographic proof-of-delivery receipts ensure accountability.',
            },
            {
              icon: Code2,
              title: 'Simple Integration',
              description: 'Add HTTP 402 support to any API in minutes.',
            },
          ].map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card p-4 not-prose">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-surface-900 dark:text-white">
                      {feature.title}
                    </h4>
                    <p className="text-sm text-surface-600 dark:text-surface-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Protocol Architecture
        </h3>
        <div className="card p-6 not-prose">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileCode className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">EndpointRegistry</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Stores seller endpoints with pricing, metadata, and bond requirements
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">EscrowVault</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Holds funds with EIP-712 delivery proofs and dispute resolution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">SellerBondVault</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Manages seller bonds with slashing for misbehavior
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: 'Buyer Requests API',
      description: 'Buyer calls a paid endpoint. Server returns HTTP 402 with payment details.',
    },
    {
      number: 2,
      title: 'Escrow Deposit',
      description: 'Buyer deposits USDC into escrow referencing the endpointId.',
    },
    {
      number: 3,
      title: 'Service Delivery',
      description: 'Seller verifies payment on-chain and delivers the response.',
    },
    {
      number: 4,
      title: 'Proof of Delivery',
      description: 'Seller signs an EIP-712 receipt with request/response hashes.',
    },
    {
      number: 5,
      title: 'Payment Release',
      description: 'After dispute window (default 15 min), funds release to seller.',
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Payment Flow
        </h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <span className="font-bold text-white">{step.number}</span>
              </div>
              <div className="flex-1 card p-4 not-prose">
                <h4 className="font-semibold text-surface-900 dark:text-white mb-1">
                  {step.title}
                </h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Dispute Resolution
        </h3>
        <div className="card p-6 not-prose">
          <div className="flex items-start gap-4 mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-surface-900 dark:text-white mb-2">
                If Buyer Disputes
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-surface-600 dark:text-surface-400">
                <li>Buyer calls dispute() within the dispute window</li>
                <li>Arbitrator (DAO/multisig) reviews proof-of-delivery</li>
                <li>If seller fault: buyer gets full refund + portion of seller bond</li>
                <li>If buyer fault: seller gets paid, buyer loses dispute</li>
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationSection({
  copyToClipboard,
  copied,
}: {
  copyToClipboard: (text: string, id: string) => void;
  copied: string | null;
}) {
  const serverCode = `// Vercel Serverless Function with HTTP 402
import { verifyPayment } from '@/lib/latchpay';

export default async function handler(req, res) {
  const paymentId = req.headers['x-payment-id'];
  
  // Check for valid payment proof
  if (!paymentId) {
    return res.status(402).json({
      error: 'Payment Required',
      payTo: process.env.ESCROW_VAULT_ADDRESS,
      amount: '100000', // 0.10 USDC
      token: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
      endpointId: 'your-endpoint-id',
    });
  }
  
  // Verify payment on-chain
  const verified = await verifyPayment(paymentId);
  if (!verified) {
    return res.status(402).json({ error: 'Invalid payment' });
  }
  
  // Execute the API logic
  const result = await yourApiLogic(req.body);
  
  // Return with delivery proof header
  return res.status(200).json(result);
}`;

  const clientCode = `// Client-side payment flow
import { createPublicClient, http } from 'viem';
import { polygon } from 'viem/chains';

async function callPaidApi(endpoint: string, body: any) {
  // 1. First call to get payment info
  const res = await fetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  if (res.status !== 402) return res.json();
  
  const paymentInfo = await res.json();
  
  // 2. Approve USDC if needed
  // 3. Open payment in escrow
  const paymentId = await openPayment(
    paymentInfo.endpointId,
    paymentInfo.amount
  );
  
  // 4. Retry with payment proof
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'X-Payment-Id': paymentId },
    body: JSON.stringify(body),
  }).then(r => r.json());
}`;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Server Integration
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-4">
          Add HTTP 402 support to your Vercel serverless function:
        </p>
        <div className="relative card not-prose">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-surface-400" />
              <span className="text-sm text-surface-500">api/paid/your-endpoint.ts</span>
            </div>
            <button
              onClick={() => copyToClipboard(serverCode, 'server')}
              className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {copied === 'server' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-surface-400" />
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm">
            <code className="text-surface-800 dark:text-surface-200">{serverCode}</code>
          </pre>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Client Integration
        </h2>
        <p className="text-surface-600 dark:text-surface-400 mb-4">
          Handle the HTTP 402 flow on the client:
        </p>
        <div className="relative card not-prose">
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-surface-400" />
              <span className="text-sm text-surface-500">lib/latchpay-client.ts</span>
            </div>
            <button
              onClick={() => copyToClipboard(clientCode, 'client')}
              className="p-1.5 rounded hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              {copied === 'client' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4 text-surface-400" />
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto text-sm">
            <code className="text-surface-800 dark:text-surface-200">{clientCode}</code>
          </pre>
        </div>
      </section>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-2xl font-bold text-surface-900 dark:text-white mb-4">
          Security Model
        </h2>
        <div className="space-y-4">
          <div className="card p-4 not-prose border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">Escrow by Default</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  All payments are held in escrow until delivery is cryptographically proven.
                  Sellers cannot run away with funds.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4 not-prose border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">Seller Bonds</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Sellers must lock collateral before serving requests. Misbehavior results
                  in bond slashing, creating strong economic incentives for honesty.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-4 not-prose border-l-4 border-green-500">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-surface-900 dark:text-white">EIP-712 Receipts</h4>
                <p className="text-sm text-surface-600 dark:text-surface-400">
                  Every delivery includes a signed receipt with request/response hashes.
                  This creates immutable proof that can be verified on-chain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Trust Assumptions
        </h3>
        <div className="card p-6 not-prose">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                1
              </span>
              <span className="text-surface-600 dark:text-surface-400">
                <strong className="text-surface-900 dark:text-white">Polygon Network:</strong> We trust Polygon validators for consensus and finality.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                2
              </span>
              <span className="text-surface-600 dark:text-surface-400">
                <strong className="text-surface-900 dark:text-white">Arbitrator:</strong> Disputes are resolved by a configured arbitrator (DAO/multisig).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-600">
                3
              </span>
              <span className="text-surface-600 dark:text-surface-400">
                <strong className="text-surface-900 dark:text-white">Smart Contracts:</strong> Contracts are immutable after deployment. Bugs cannot be patched.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="font-display text-xl font-semibold text-surface-900 dark:text-white mb-4">
          Best Practices
        </h3>
        <div className="space-y-3 not-prose">
          {[
            'Always verify payment on-chain before delivering responses',
            'Use unique nonces for each payment to prevent replay attacks',
            'Store delivery receipts off-chain for dispute evidence',
            'Set reasonable dispute windows (15-60 minutes recommended)',
            'Monitor seller bonds and do not accept payments from unbonded sellers',
          ].map((tip, i) => (
            <div key={i} className="flex items-center gap-3 text-surface-600 dark:text-surface-400">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
