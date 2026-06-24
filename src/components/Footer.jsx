import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="relative w-full flex flex-col items-center z-30 pt-16 md:pt-32 mt-16 md:mt-24 overflow-hidden">
      
      {/* Content Section: Placed ABOVE the image */}
      <div className="max-w-6xl w-full mx-auto px-6 mb-8 md:mb-12 flex flex-col items-center text-center relative z-20">
        
        {/* Brand & Social Header */}
        <div className="flex flex-col items-center gap-8 md:gap-10 mb-12 md:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="relative mb-4"
          >
            <div className="absolute inset-0 bg-[#0077b6]/10 blur-2xl rounded-full" />
            <img src="/assets/logo.png" alt="MARKETPEACE Logo" loading="lazy" className="w-16 h-16 md:w-24 md:h-24 object-contain relative z-10 mix-blend-multiply brightness-125" />
          </motion.div>
          <h2 className="text-3xl md:text-6xl font-black tracking-[0.2em] md:tracking-[0.5em] text-white uppercase italic">MARKETPEACE</h2>
          <p className="text-[#0077b6] text-[8px] md:text-[10px] tracking-[0.4em] uppercase font-black -mt-2">The Infrastructure of Independence</p>
          
          <div className="flex gap-8 md:gap-10 mt-6 md:mt-8">
            {/* SECURITY (MED-6): rel="noopener noreferrer" prevents reverse tabnapping */}
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Instagram</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Twitter</a>
            <a href="mailto:contact@foreignaffairs.com" className="text-white/40 hover:text-[#0077b6] transition-all text-[9px] md:text-xs tracking-[0.2em] font-black uppercase">Email</a>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 sm:gap-x-8 md:gap-x-16 gap-y-6 sm:gap-y-8 md:gap-y-12 text-center items-center justify-center">
          <Link to="/vendors" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">System Entry</Link>
          <Link to="/attendees" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Tickets</Link>
          <Link to="/cities" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Rollout</Link>
          <Link to="/venues" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Venues</Link>
          <Link to="/privacy" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Privacy</Link>
          <Link to="/terms" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Terms</Link>
          <Link to="/contact" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Contact</Link>
          <Link to="/legal" className="text-white/40 hover:text-white transition-colors text-[7px] sm:text-[9px] md:text-xs tracking-[0.1em] md:tracking-[0.3em] uppercase font-black">Legal</Link>
        </div>
      </div>

      {/* Edge-to-Edge Market Image */}
      <div className="relative w-full overflow-hidden flex flex-col items-center mt-auto">
        <img 
          src="/assets/footer-market.png" 
          alt="Cloud Market" 
          loading="lazy"
          className="w-full md:min-w-[1800px] h-auto object-cover object-bottom select-none pointer-events-none transform translate-y-1 opacity-60 md:opacity-100"
        />
        
        {/* Absolute Bottom Bar */}
        <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-0 w-full px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 text-center md:text-left z-30">
          <p className="text-[6px] sm:text-[7px] md:text-[9px] tracking-[0.1em] md:tracking-[0.2em] text-white/40 md:text-white/20 uppercase font-bold">© 2026 MARKETPEACE. SECURING CREATOR INDEPENDENCE.</p>
          <p className="text-[6px] sm:text-[7px] md:text-[9px] tracking-[0.1em] md:tracking-[0.2em] text-white/40 md:text-white/20 uppercase font-bold flex items-center gap-2">
            PROTOCOL STATUS: SECURE
          </p>
        </div>
      </div>

      {/* Deep Atmospheric Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-0"></div>
    </footer>
  );
}
