import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGE_CACHE = new Set();

function preloadImage(src) {
  return new Promise((resolve) => {
    if (IMAGE_CACHE.has(src)) { resolve(); return; }
    const img = new Image();
    img.onload = () => { IMAGE_CACHE.add(src); resolve(); };
    img.onerror = () => resolve();
    img.src = src;
  });
}

const ASSETS_TO_PRELOAD = [
  '/assets/logo.png',
  '/assets/footer-market.png',
  '/assets/clouds/cloud1.png',
  '/assets/clouds/cloud2.png',
  '/assets/clouds/cloud3.png',
  '/assets/clouds/cloud4.png',
  '/assets/clouds/cloud5.png',
  '/assets/clouds/cloud6.png',
  '/assets/AI Images/249AFEB9-A174-40FA-9898-3266EAA2A6F2.png',
  '/assets/AI Images/F26D62C4-2E3A-42EA-9398-9255E9B7BDE6.png',
  '/assets/AI Images/39ACA358-0EAF-4903-A46D-B7326B9B4B87.png',
];

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    let cancelled = false;

    const hide = () => {
      if (!cancelled) setLoading(false);
    };

    const minVisible = new Promise(resolve => setTimeout(resolve, 1500));
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const pageReady = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });
    const imagesReady = Promise.all(ASSETS_TO_PRELOAD.map(preloadImage));

    Promise.all([minVisible, fontsReady, pageReady, imagesReady]).then(hide);

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[1000] bg-[#061530] flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[#0077b6]/20 rounded-full blur-[120px]"
            />
            <motion.div
              animate={{ 
                x: [-20, 20, -20],
                y: [-20, 20, -20],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-[80px]"
            />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-[#0077b6]/40 blur-3xl rounded-full animate-pulse" />
              <img 
                src="/assets/logo.png" 
                alt="Logo" 
                className="w-32 h-32 md:w-48 md:h-48 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,119,182,0.5)]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-lg sm:text-2xl md:text-4xl font-black tracking-[0.4em] sm:tracking-[0.6em] text-white uppercase italic mb-2 text-center">MARKETPEACE</h1>
              <div className="h-[2px] w-12 bg-[#0077b6] rounded-full mb-4" />
              <p className="text-[#0077b6] text-[10px] md:text-xs tracking-[0.4em] uppercase font-black animate-pulse">Loading Experience...</p>
            </motion.div>
          </div>

          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="w-full h-full bg-gradient-to-r from-transparent via-[#0077b6] to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
