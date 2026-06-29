import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Markets', path: '/cities' },
    { name: 'Vendors', path: '/vendors' },
    { name: 'Community', path: '/attendees' },
  ];

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-[100] flex justify-center pt-5 px-6 pointer-events-none"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top))' }}
      >
        <div
          className={`flex items-center gap-8 px-6 py-3 rounded-full transition-all duration-500 liquid-glass pointer-events-auto ${
            scrolled ? 'navbar-capsule-scrolled py-2.5 px-6' : 'navbar-capsule-top'
          }`}
        >
          {/* Links */}
          <nav
            className="hidden sm:flex items-center gap-6 text-sm"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative transition-colors duration-300 text-xs font-semibold uppercase tracking-wider ${
                    isActive ? 'text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute -bottom-1.5 left-0 w-full h-[1.5px] bg-[#0DB8D3]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <Link to="/vendors" className="hidden sm:inline-flex">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 hover:bg-[#0bc1dd] hover:shadow-[0_0_20px_rgba(13,184,211,0.4)] btn-glow"
              style={{
                background: '#0DB8D3',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                boxShadow: "0 2px 12px rgba(13, 184, 211, 0.25)",
              }}
            >
              Join Now
            </button>
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden w-8 h-8 flex items-center justify-center relative z-50 text-white hover:text-[#0DB8D3] transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[99] bg-[#193546] flex flex-col items-center justify-center p-8 sm:hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0DB8D3]/10 rounded-full blur-[120px]" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px]" />
            </div>

            <div className="flex flex-col items-center gap-8 z-10">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * idx }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-xl font-semibold tracking-widest uppercase transition-colors ${
                      location.pathname === link.path ? 'text-white' : 'text-white/55 hover:text-white'
                    }`}
                    style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-8"
              >
                <Link to="/vendors" onClick={() => setIsOpen(false)}>
                  <button
                    className="px-8 py-3 rounded-full text-white text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 hover:bg-[#0bc1dd]"
                    style={{
                      background: '#0DB8D3',
                      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                      boxShadow: "0 2px 12px rgba(13, 184, 211, 0.25)",
                    }}
                  >
                    Join Now
                  </button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
