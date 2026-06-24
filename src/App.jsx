import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Lenis from 'lenis';

import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import useLiquidGlass from './hooks/useLiquidGlass';

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

      // Reset scroll on path change via Lenis
      lenisInstance.scrollTo(0, { immediate: true });
      const t = setTimeout(() => {
        lenisInstance.scrollTo(0, { immediate: true });
      }, 50);

      // Cleanup on unmount
      return () => {
        clearTimeout(t);
        if (rafId) cancelAnimationFrame(rafId);
        resizeObserver.disconnect();
        lenisInstance.destroy();
        lenisInstance = null;
      };
    }

    // Mobile: reset scroll on path change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const t = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, 50);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}

export default function App() {
  useLiquidGlass();
  return (
    <Router>
      <div className="relative w-full bg-transparent text-white font-light">
        {/* Animated fluid blob background - Sunny Day Sky to Navy Blue */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#60a5fa] via-[#1e3a8a] to-[#030712]">
          <div className="absolute -top-[15%] left-[10%] w-[65vw] h-[65vw] rounded-full bg-white/20 blur-[130px] animate-blob-1"></div>
          <div className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[#93c5fd]/30 blur-[120px] animate-blob-2"></div>
          <div className="absolute -bottom-[10%] -left-[10%] w-[75vw] h-[75vw] rounded-full bg-[#0077b6]/25 blur-[140px] animate-blob-3"></div>
        </div>
        <LoadingScreen />
        <ScrollSetup />
        <Cursor />
        <Navbar />
        <Suspense fallback={
          <div className="min-h-screen bg-transparent flex items-center justify-center">
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
