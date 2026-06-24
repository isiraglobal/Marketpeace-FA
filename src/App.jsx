import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Vendors = lazy(() => import('./pages/Vendors'));
const Attendees = lazy(() => import('./pages/Attendees'));
const Venues = lazy(() => import('./pages/Venues'));
const Cities = lazy(() => import('./pages/Cities'));
const Legal = lazy(() => import('./pages/Legal'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Success = lazy(() => import('./pages/Success'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const BackgroundClouds = lazy(() => import('./components/BackgroundClouds'));

function ScrollSetup() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    const shouldUseLenis = !isMobile;

    let lenisInstance = null;
    let rafId = null;

    if (shouldUseLenis) {
      lenisInstance = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        smoothTouch: false,
        touchMultiplier: 1.5,
      });

      function raf(time) {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      const resizeObserver = new ResizeObserver(() => {
        lenisInstance.resize();
      });
      resizeObserver.observe(document.body);

      // Cleanup on unmount
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        lenisInstance.destroy();
        lenisInstance = null;
      };
    }

    // Reset scroll on path change
    window.scrollTo(0, 0);
    if (lenisInstance) {
      lenisInstance.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Router>
      <div className="relative w-full bg-[#061530] text-white font-light">
        <LoadingScreen />
        <ScrollSetup />
        <Cursor />
        <ErrorBoundary fallback={
          // Flat background colour — visually identical to the scene without clouds
          <div className="fixed inset-0 pointer-events-none z-0" style={{ backgroundColor: '#0690d4' }} />
        }>
          <Suspense fallback={null}>
            <BackgroundClouds />
          </Suspense>
        </ErrorBoundary>
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen bg-[#061530] flex items-center justify-center">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0077b6] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0077b6] animate-bounce" style={{ animationDelay: '120ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#0077b6] animate-bounce" style={{ animationDelay: '240ms' }} />
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/attendees" element={<Attendees />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/cities" element={<Cities />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/success" element={<Success />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </Router>
  );
}
