import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  Grid,
  List,
  Brain,
  BarChart3,
  Cpu,
  HardDrive,
  Radio,
  Fingerprint,
  ExternalLink,
  Zap,
  Star,
} from 'lucide-react';
import { Button, CardSkeleton } from '../components/common';
import { useEndpoints } from '../hooks/useEndpoints';
import categoriesData from '../data/categories.json';
import featuredEndpointsData from '../data/featured-endpoints.json';

const iconMap: Record<string, any> = {
  Brain,
  BarChart3,
  Cpu,
  HardDrive,
  Radio,
  Fingerprint,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get onchain endpoints
  const { endpoints: onchainEndpoints, isLoading } = useEndpoints();

  // Merge: prioritize on-chain data, show static entries only if no on-chain match
  const endpoints = useMemo(() => {
    // Map on-chain endpoints into display format
    const onchainMapped = onchainEndpoints.map((ep) => {
      const staticMatch = featuredEndpointsData.find((s) => s.id === ep.endpointId);
      return {
        id: ep.endpointId,
        name: staticMatch?.name || ep.metadataURI || `Endpoint ${ep.endpointId.slice(0, 10)}...`,
        description: staticMatch?.description || 'On-chain API endpoint',
        category: staticMatch?.category || ep.category || 'compute',
        pricePerCall: (Number(ep.pricePerCall) / 1e6).toFixed(6),
        seller: ep.seller,
        tags: staticMatch?.tags || [],
        featured: staticMatch?.featured || false,
        apiEndpoint: staticMatch?.apiEndpoint || '',
        isOnchain: true,
      };
    });

    // If we have on-chain data, use it; otherwise show static as preview
    if (onchainMapped.length > 0) {
      return onchainMapped;
    }

    // Fallback to static data when contracts haven't been deployed yet
    return featuredEndpointsData.map((endpoint) => ({
      ...endpoint,
      isOnchain: false,
    }));
  }, [onchainEndpoints]);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((endpoint) => {
      const matchesSearch =
        !searchQuery ||
        endpoint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || endpoint.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [endpoints, searchQuery, selectedCategory]);

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
              API Marketplace
            </h1>
            <p className="text-lg text-surface-600 dark:text-surface-400 max-w-2xl mx-auto">
              Discover and pay for APIs with escrow protection. All payments are secured on Polygon.
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
                placeholder="Search APIs..."
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
          {/* Sidebar - Categories */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="sticky top-24">
              <h3 className="font-semibold text-surface-900 dark:text-white mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    !selectedCategory
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                  <span className="font-medium">All APIs</span>
                </button>
                {categoriesData.map((category) => {
                  const Icon = iconMap[category.icon] || Brain;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.aside>

          {/* Main content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-surface-600 dark:text-surface-400">
                {filteredEndpoints.length} APIs found
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Endpoints Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <motion.div
                className={
                  viewMode === 'grid'
                    ? 'grid md:grid-cols-2 gap-6'
                    : 'space-y-4'
                }
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredEndpoints.map((endpoint) => (
                  <motion.div key={endpoint.id} variants={itemVariants}>
                    <Link to={`/endpoint/${endpoint.id}`}>
                      <div className="card card-hover p-6 h-full">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-surface-900 dark:text-white">
                                {endpoint.name}
                              </h3>
                              <p className="text-sm text-surface-500 dark:text-surface-400">
                                {categoriesData.find((c) => c.id === endpoint.category)?.name}
                              </p>
                            </div>
                          </div>
                          {endpoint.featured && (
                            <span className="badge-primary">
                              <Star className="w-3 h-3" />
                              Featured
                            </span>
                          )}
                        </div>

                        <p className="text-surface-600 dark:text-surface-400 text-sm mb-4 line-clamp-2">
                          {endpoint.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-800">
                          <div>
                            <span className="text-2xl font-bold gradient-text">
                              ${endpoint.pricePerCall}
                            </span>
                            <span className="text-surface-500 dark:text-surface-400 text-sm ml-1">
                              per call
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={ExternalLink}
                            iconPosition="right"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {filteredEndpoints.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-surface-400" />
                </div>
                <h3 className="text-lg font-semibold text-surface-900 dark:text-white mb-2">
                  No APIs found
                </h3>
                <p className="text-surface-600 dark:text-surface-400">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
