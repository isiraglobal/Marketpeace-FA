import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

// SECURITY: Allowed types whitelist — prevents arbitrary content injection (HIGH-7)
const ALLOWED_TYPES = ['Vendor', 'Attendee', 'Venue'];

// SECURITY: Validates transaction ID format — only alphanumeric with hyphens allowed
const isValidTransactionID = (id) => {
  if (!id || typeof id !== 'string') return false;
  return /^[A-Z]{2,5}-[A-Z0-9]{1,20}$/.test(id) && id.length <= 32;
};

export default function Success() {
  const [searchParams] = useSearchParams();
  // SECURITY: URL params are validated and whitelisted before any rendering
  const rawTransactionID = searchParams.get('transaction_id') || '';
  const rawType = searchParams.get('type') || '';

  // Validate transaction ID against expected pattern
  const transactionID = isValidTransactionID(rawTransactionID) ? rawTransactionID : null;
  // Whitelist type — reject any value not in the allowed set
  const type = ALLOWED_TYPES.includes(rawType) ? rawType : null;

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center justify-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full liquid-glass p-12 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500">
          <CheckCircle size={48} />
        </div>
        
        <h1 className="text-4xl font-black mb-4 title uppercase italic">Payment <span className="not-italic text-[#1B7FDC]">Confirmed</span></h1>
        <p className="text-white/50 text-lg mb-8 font-medium description">
          {/* SECURITY: type is whitelisted — rendering safe */}
          Your {type || 'registration'} is now synchronized. A confirmation has been sent to your email.
        </p>

        {transactionID && (
          <div className="bg-white/5 rounded-2xl p-6 mb-10 inline-block">
            <p className="text-xs text-[#0DB8D3] font-black uppercase tracking-widest mb-1 amount">Transaction ID</p>
            {/* SECURITY: transactionID validated against regex before rendering */}
            <p className="text-xl font-black text-white title">{transactionID}</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Link to="/">
            <button className="w-full py-4 bg-white text-[#193546] font-black rounded-xl tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2 btn-glow">
              RETURN TO HOME <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
