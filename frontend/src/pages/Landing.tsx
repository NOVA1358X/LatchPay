import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Globe,
  Layers,
  Receipt,
  Clock,
} from 'lucide-react';
import { Button } from '../components/common';
import Logo from '../components/layout/Logo';

const features = [
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Funds held in smart contract escrow until delivery is verified',
  },
  {
    icon: Receipt,
    title: 'Verifiable Receipts',
    description: 'EIP-712 signed delivery proofs stored on-chain forever',
  },
  {
    icon: Shield,
    title: 'Dispute Resolution',
    description: 'Fair dispute window with deterministic resolution rules',
  },
  {
    icon: Zap,
    title: 'Instant Payments',
    description: 'Pay-per-use micropayments in USDC on Polygon',
  },
  {
    icon: Globe,
    title: 'HTTP 402 Native',
    description: 'Standard payment protocol for web APIs',
  },
  {
    icon: Clock,
    title: 'Real-time Explorer',
    description: 'Track all payments and deliveries on-chain',
  },
];

const steps = [
  {
    step: '01',
    title: 'Discover APIs',
    description: 'Browse the marketplace for verified API endpoints',
  },
  {
    step: '02',
    title: 'Pay with USDC',
    description: 'Funds are escrowed until delivery is confirmed',
  },
  {
    step: '03',
    title: 'Receive Data',
    description: 'Get your response with a signed delivery proof',
  },
  {
    step: '04',
    title: 'Auto Release',
    description: 'Funds released to seller after dispute window',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 grid-pattern opacity-50" />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
              </span>
              Live on Polygon Mainnet
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={itemVariants}
              className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-surface-900 dark:text-white">
                Trust-Minimized
              </span>
              <br />
              <span className="gradient-text">API Payments</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              variants={itemVariants}
              className="text-xl text-surface-600 dark:text-surface-400 max-w-2xl mx-auto mb-10"
            >
              Pay-per-use micropayments for APIs with escrow protection, 
              verifiable delivery proofs, and fair dispute resolution. 
              Built on Polygon with USDC.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/marketplace">
                <Button size="lg" icon={Layers} iconPosition="left">
                  Explore Marketplace
                </Button>
              </Link>
              <Link to="/seller">
                <Button variant="secondary" size="lg" icon={ArrowRight} iconPosition="right">
                  Become a Seller
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={itemVariants}
              className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto"
            >
              {[
                { value: 'USDC', label: 'Native Currency' },
                { value: '137', label: 'Polygon Chain ID' },
                { value: '1%', label: 'Protocol Fee' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-surface-50 dark:bg-surface-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              Why LatchPay?
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              The missing payment layer for APIs. Secure, transparent, and decentralized.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="card card-hover p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-surface-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Simple 4-step process for secure API payments
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary-500 to-accent-500" />
                )}
                
                <div className="relative text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/25">
                    <span className="font-display text-xl font-bold text-white">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-surface-600 dark:text-surface-400 text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-accent-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 grid-pattern" style={{ backgroundSize: '30px 30px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Logo className="w-16 h-16 mx-auto mb-8" />
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
              Join the future of API payments. Start accepting or making micropayments today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/marketplace">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary-600 hover:bg-white/90"
                >
                  Browse APIs
                </Button>
              </Link>
              <Link to="/docs">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white border border-white/20 hover:bg-white/10"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Read the Docs
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
