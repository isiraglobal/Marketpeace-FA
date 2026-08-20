import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, FileSignature } from 'lucide-react';
import { Link } from 'react-router-dom';
import { submitForm } from '../utils/stripeCheckout';

export default function Agreement() {
  const [formData, setFormData] = useState({ name: '', email: '', businessName: '', signature: '' });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  useEffect(() => {
    document.title = "MARKETPEACE | Vendor Agreement";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });
    try {
      await submitForm({ type: 'VendorAgreement', ...formData });
      setStatus({ submitting: false, success: true, error: null });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message || 'Signing failed. Please try again.' });
    }
  };

  return (
    <div className="w-full min-h-screen pt-24 sm:pt-32 md:pt-40 px-4 sm:px-6 md:px-8 flex flex-col items-center pb-16 sm:pb-20 md:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="max-w-4xl w-full flex flex-col items-start mb-10 md:mb-14"
      >
        <FileSignature className="w-12 h-12 text-[#0DB8D3] mb-6" />
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-6 md:mb-8 uppercase italic text-white leading-[0.95] title">
          Vendor <span className="not-italic text-[#1B7FDC]">Agreement</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base font-medium leading-relaxed max-w-2xl">
          Review and e-sign the Marketpeace vendor agreement. Signing locks in the terms of your booth reservation —
          pricing, deposits, refund policy and code of conduct.
        </p>
      </motion.div>

      {status.success ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full liquid-glass p-8 md:p-12 text-center"
        >
          <div className="inline-flex w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-2xl md:text-3xl text-white font-black uppercase tracking-tight italic mb-4">Agreement Signed</h3>
          <p className="text-white/60 text-sm font-medium mb-8">
            Signed by <span className="text-[#0DB8D3] font-bold">{formData.signature}</span> on behalf of{' '}
            <span className="text-[#0DB8D3] font-bold">{formData.businessName}</span>. A copy has been recorded.
          </p>
          <Link to="/vendors">
            <button className="w-full py-4 bg-[#0DB8D3] text-white font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-[#0bc1dd] transition-all btn-glow">
              PROCEED TO BOOTH SETUP
            </button>
          </Link>
        </motion.div>
      ) : (
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Agreement text */}
          <div className="liquid-glass p-8 md:p-10 text-white/50 font-medium leading-relaxed text-sm md:text-base space-y-8 description">
            <section>
              <h2 className="text-lg md:text-xl font-black text-white mb-4 uppercase italic title">1. Fees & Deposit</h2>
              <p>A $100 non-refundable deposit reserves your booth. Total booth investment is $250 Standard / $500 Flagship. Remaining balance is due within the balance window communicated in your offer; balances become due within 48 hours once the market reaches 70% capacity.</p>
            </section>
            <section>
              <h2 className="text-lg md:text-xl font-black text-white mb-4 uppercase italic title">2. Payments</h2>
              <p>All payments are processed via Stripe. All fees, including deposits and full balances, are non-refundable. Fees may be transferable to a future event with 14+ days notice at Marketpeace's discretion.</p>
            </section>
            <section>
              <h2 className="text-lg md:text-xl font-black text-white mb-4 uppercase italic title">3. Booth & Logistics</h2>
              <p>One 6ft table and one chair are provided with each booth. Vendors are responsible for their own displays, tents and additional equipment. Load-in and load-out must happen during designated times.</p>
            </section>
            <section>
              <h2 className="text-lg md:text-xl font-black text-white mb-4 uppercase italic title">4. Liability & Conduct</h2>
              <p>Marketpeace maintains liability insurance for its curated events. Vendors are encouraged to carry their own insurance. Marketpeace is not responsible for theft, damage or loss of vendor property. Vendors must maintain a professional demeanor; violation of the code of conduct may result in removal without refund.</p>
            </section>
          </div>

          {/* Sign form */}
          <div className="liquid-glass p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5 relative z-10">
              <h3 className="text-2xl md:text-3xl text-white font-black mb-2 italic uppercase title">Agree & Sign</h3>
              <div>
                <label htmlFor="ag-name" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Full Name</label>
                <input id="ag-name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Your Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
              </div>
              <div>
                <label htmlFor="ag-business" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Business Name</label>
                <input id="ag-business" name="businessName" type="text" required value={formData.businessName} onChange={handleChange} placeholder="Brand / Business"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
              </div>
              <div>
                <label htmlFor="ag-email" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Email</label>
                <input id="ag-email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email Address"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
              </div>
              <div>
                <label htmlFor="ag-signature" className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Digital Signature</label>
                <input id="ag-signature" name="signature" type="text" required value={formData.signature} onChange={handleChange} placeholder="Type your full name to sign"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm border-[#0DB8D3]/40" />
                <p className="text-white/30 text-[10px] mt-1 font-light">Typing your full name serves as an electronic signature.</p>
              </div>

              {status.error && <p className="text-red-400 text-xs font-bold">{status.error}</p>}

              <button type="submit" disabled={status.submitting}
                className="w-full mt-2 py-4 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/90 transition-all disabled:opacity-50 btn-glow">
                {status.submitting ? 'SIGNING...' : 'SIGN AGREEMENT'}
              </button>
              <Link to="/legal" className="text-center text-white/30 text-[10px] uppercase tracking-widest font-bold hover:text-[#0DB8D3] transition-colors">
                Read Full Terms
              </Link>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}