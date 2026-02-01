import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const EndpointDetails = lazy(() => import('./pages/EndpointDetails'));
const BuyerDashboard = lazy(() => import('./pages/BuyerDashboard'));
const SellerDashboard = lazy(() => import('./pages/SellerDashboard'));
const PolygonSearch = lazy(() => import('./pages/PolygonSearch'));
const Docs = lazy(() => import('./pages/Docs'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/endpoint/:endpointId" element={<EndpointDetails />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/seller" element={<SellerDashboard />} />
            <Route path="/search" element={<PolygonSearch />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
