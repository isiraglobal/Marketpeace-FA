import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative w-full flex flex-col items-center z-30 pt-10 md:pt-20 mt-10 md:mt-16 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto px-6 mb-6 md:mb-10 flex flex-col items-center text-center relative z-20">
        <div className="flex flex-col items-center gap-6 md:gap-8 mb-8 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative mb-2"
          >
            <div className="absolute inset-0 bg-[#0077b6]/10 blur-2xl rounded-full" />
            <img src="/assets/logo.png" alt="MARKETPEACE Logo" loading="lazy" className="w-12 h-12 md:w-20 md:h-20 object-contain relative z-10" />
          </motion.div>
          <h2 className="text-2xl md:text-5xl font-black tracking-[0.2em] md:tracking-[0.4em] text-white uppercase italic">MARKETPEACE</h2>
          <p className="text-[#0077b6] text-[8px] md:text-[10px] tracking-[0.4em] uppercase font-black -mt-2">The Local Marketplace for Everyone</p>
          <div className="flex gap-6 md:gap-8 mt-4 md:mt-6">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Instagram</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Twitter</a>
            <a href="mailto:contact@foreignaffairs.com" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Email</a>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-8 md:gap-x-16 gap-y-4 sm:gap-y-6 md:gap-y-8 text-center items-center justify-center">
          <Link to="/vendors" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Vendors</Link>
          <Link to="/attendees" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Tickets</Link>
          <Link to="/cities" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Cities</Link>
          <Link to="/venues" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Venues</Link>
          <Link to="/privacy" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Privacy</Link>
          <Link to="/terms" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Terms</Link>
          <Link to="/contact" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Contact</Link>
          <Link to="/legal" className="text-white/40 hover:text-[#0077b6] transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Legal</Link>
        </div>
      </div>

      <div className="relative w-full flex flex-col items-center mt-auto overflow-hidden">
        <div className="w-full px-6 md:px-12 pb-4 md:pb-6 text-center md:text-left z-30">
          <p className="text-[6px] sm:text-[7px] md:text-[9px] tracking-[0.1em] md:tracking-[0.2em] text-white/40 md:text-white/20 uppercase font-bold">© 2026 MARKETPEACE. ALL RIGHTS RESERVED. &nbsp;&nbsp;|&nbsp;&nbsp; SUPPORT LOCAL.</p>
        </div>
        <img
          src="/assets/footer-market.png"
          alt="Cloud Market"
          loading="lazy"
          className="w-full h-auto object-cover object-bottom select-none pointer-events-none opacity-50 md:opacity-80"
        />
      </div>
    </footer>
  );
}
