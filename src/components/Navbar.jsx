import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'FOR VENDORS', path: '/vendors' },
    { name: 'FOR ATTENDEES', path: '/attendees' },
    { name: 'FOR VENUES', path: '/venues' },
    { name: 'CITIES', path: '/cities' },
  ];

  return (
    <>
      <motion.nav 
        variants={{
          visible: { y: 0, opacity: 1 },
          hidden: { y: -120, opacity: 0 }
        }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 w-full z-[100] px-4 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6 flex items-center justify-between bg-[#061530]/60 backdrop-blur-3xl border-b border-white/5 shadow-2xl"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-6 sm:gap-10 md:gap-12">
          <Link to="/" onClick={() => setIsOpen(false)} className="hover:scale-105 transition-transform">
            <h1 className="text-xl sm:text-2xl font-black tracking-[0.1em] sm:tracking-[0.15em] md:tracking-[0.2em] text-white uppercase italic">MARKETPEACE</h1>
          </Link>
          <div className="hidden lg:flex items-center gap-6 md:gap-8 lg:gap-10 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] md:tracking-[0.3em] text-white">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} current={location.pathname === link.path}>
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <Link to="/vendors">
            <button className="px-4 sm:px-6 py-2 bg-white text-[#061530] font-black rounded-lg tracking-[0.1em] sm:tracking-[0.2em] text-[8px] sm:text-[10px] uppercase hover:bg-[#0077b6] hover:text-white transition-all shadow-lg btn-glow">
              JOIN
            </button>
          </Link>
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 1.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-[#0077b6]/20 blur-xl rounded-full animate-pulse" />
            <img 
              src="/assets/logo.png" 
              alt="MARKETPEACE Logo" 
              loading="lazy"
              className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 object-contain relative z-10 mix-blend-multiply brightness-125"
            />
          </motion.div>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-white relative z-[101]"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[90] bg-[#061530] flex flex-col items-center justify-center p-8 lg:hidden"
          >
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0690d4]/10 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="flex flex-col items-center gap-10 z-10">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-2xl font-medium tracking-[0.2em] transition-colors ${
                      location.pathname === link.path ? 'text-white' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-20 z-10"
            >
              <Link to="/vendors" onClick={() => setIsOpen(false)}>
                <button className="px-6 sm:px-8 md:px-10 py-2.5 sm:py-3 md:py-4 bg-white text-[#061530] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[8px] sm:text-[9px] md:text-xs uppercase shadow-2xl">
                  JOIN THE SYSTEM
                </button>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ to, children, current }) {
  return (
    <Link to={to} className={`relative group transition-colors ${current ? 'text-white' : 'text-white/60 hover:text-white'}`}>
      {children}
      <span className={`absolute -bottom-2 left-0 w-full h-[1.5px] bg-[#0077b6] transform origin-left transition-transform duration-500 ${current ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}></span>
    </Link>
  );
}
