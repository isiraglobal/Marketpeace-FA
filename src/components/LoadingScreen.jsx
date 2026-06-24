import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loading) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    let cancelled = false;

    const hide = () => {
      if (!cancelled) setLoading(false);
    };

    // Minimum display time for logo animation to complete
    const minVisible = new Promise(resolve => setTimeout(resolve, 1500));
    // Wait for fonts to load
    const fontsReady = document.fonts
      ? document.fonts.ready
      : Promise.resolve();
    // Wait for page content + first lazy chunk to settle
    const pageReady = new Promise(resolve => {
      if (document.readyState === 'complete') resolve();
      else window.addEventListener('load', resolve, { once: true });
    });

    Promise.all([minVisible, fontsReady, pageReady]).then(hide);

    return () => {
      cancelled = true;
      document.body.style.overflow = 'unset';
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
          {/* Animated Background Elements */}
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
                className="w-32 h-32 md:w-48 md:h-48 object-contain relative z-10 drop-shadow-[0_0_30px_rgba(0,119,182,0.5)] mix-blend-multiply brightness-125" 
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
              <p className="text-[#0077b6] text-[10px] md:text-xs tracking-[0.4em] uppercase font-black animate-pulse">Initializing System...</p>
            </motion.div>
          </div>

          {/* Progress bar */}
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
