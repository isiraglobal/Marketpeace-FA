import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Legal() {
  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-8 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-white bg-[#0077b6] px-4 py-1.5 rounded-full tracking-[0.3em] text-[10px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(0,119,182,0.4)]">
          Legal & Agreements
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 md:mb-10 text-white leading-[0.95] uppercase italic">Transparency & <span className="not-italic text-stroke-blue">Security</span></h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-2xl font-medium px-4">
          Foreign Affairs LLC is committed to safe, insured, and transparent events. Review our public policies and vendor agreements below.
        </p>
      </motion.div>

        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mb-20 md:mb-32">
        <div className="liquid-glass p-6 md:p-8 group transition-all">
          <FileText className="w-8 h-8 md:w-10 md:h-10 text-[#0077b6] mb-6" />
          <h3 className="text-xl md:text-2xl font-black mb-4 title uppercase italic">Privacy Policy</h3>
          <p className="text-white/50 font-medium text-sm mb-6 leading-relaxed description">
            We respect your data. Our privacy policy outlines how we handle attendee and vendor information securely.
          </p>
          <Link to="/privacy" className="flex items-center gap-2 text-[#0077b6] text-[10px] md:text-sm font-bold tracking-widest uppercase group-hover:gap-3 transition-all">
            Read Policy <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="liquid-glass p-6 md:p-8 group transition-all">
          <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-[#0077b6] mb-6" />
          <h3 className="text-xl md:text-2xl font-black mb-4 title uppercase italic">Terms of Service</h3>
          <p className="text-white/50 font-medium text-sm mb-6 leading-relaxed description">
            The rules of engagement for our platforms, ticketing, and event participation. Ensures a safe environment for all.
          </p>
          <Link to="/terms" className="flex items-center gap-2 text-[#0077b6] text-[10px] md:text-sm font-bold tracking-widest uppercase group-hover:gap-3 transition-all">
            Read Terms <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="liquid-glass p-6 md:p-8 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black mb-4 title uppercase italic">Vendor Agreement</h3>
            <p className="text-white/50 font-medium text-sm leading-relaxed max-w-xl description">
              Preview our standard vendor contract. It details booth fees, deposit structure, our $1M liability insurance, and your rights to digital content.
            </p>
          </div>
          <a href="mailto:legal@foreignaffairsmarket.com?subject=Vendor%20Agreement%20Request" className="w-full md:w-auto px-10 py-3.5 bg-white text-[#061530] font-bold rounded-xl tracking-widest text-[10px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl whitespace-nowrap btn-glow inline-block text-center">
            REQUEST AGREEMENT
          </a>
        </div>
      </div>
    </div>
  );
}
