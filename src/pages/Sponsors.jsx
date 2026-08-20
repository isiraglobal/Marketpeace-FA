import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Megaphone, Handshake, Target } from 'lucide-react';
import { submitForm } from '../utils/stripeCheckout';

export default function Sponsors() {
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    email: '',
    phone: '',
    tier: 'Supporting',
    budget: '',
    website: '',
    notes: '',
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  useEffect(() => {
    document.title = "MARKETPEACE | Sponsor A Market";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });
    try {
      await submitForm({ type: 'Sponsor', ...formData });
      setStatus({ submitting: false, success: true, error: null });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message || 'Submission failed. Please try again.' });
    }
  };

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="max-w-5xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-[#0DB8D3] tracking-[0.4em] text-[12px] md:text-xs font-black uppercase mb-4 md:mb-6">
          Sponsorship
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-tight md:leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Put Your Brand<br />In the <span className="not-italic text-[#1B7FDC]">Market.</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Marketpeace is the local marketplace that moves through the city. Get your brand in front of high-intent
          local shoppers across our markets and social feeds.
        </p>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
        <SponsorPerk icon={<Target className="w-5 h-5 text-[#0DB8D3]" />} title="Local Reach" desc="Face-to-face with high-intent local shoppers at every market." />
        <SponsorPerk icon={<Megaphone className="w-5 h-5 text-[#1B7FDC]" />} title="Social Amplification" desc="Shoutouts, promo placement and content features across our channels." />
        <SponsorPerk icon={<Handshake className="w-5 h-5 text-[#9b59b6]" />} title="Community Equity" desc="Back small businesses and own the goodwill that comes with it." />
      </div>

      <div className="max-w-3xl w-full">
        <div className="liquid-glass p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>

          {status.success ? (
            <div className="text-center space-y-6">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl md:text-3xl text-white font-black uppercase tracking-tight italic">Deck Requested</h3>
              <p className="text-white/60 text-sm font-medium">
                Thanks, <span className="text-[#0DB8D3] font-bold">{formData.name}</span>! Our partnerships team will
                reach out to <span className="text-[#0DB8D3] font-bold">{formData.email}</span> with our sponsorship deck.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              <h3 className="text-2xl md:text-3xl text-white font-black mb-2 italic uppercase title">Request Sponsor Deck</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sp-company" className="sr-only">Company Name</label>
                  <input id="sp-company" name="businessName" type="text" required value={formData.businessName} onChange={handleChange} placeholder="Company Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="sp-website" className="sr-only">Website</label>
                  <input id="sp-website" name="website" type="text" value={formData.website} onChange={handleChange} placeholder="Website (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sp-name" className="sr-only">Contact Name</label>
                  <input id="sp-name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Contact Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="sp-email" className="sr-only">Email</label>
                  <input id="sp-email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sp-phone" className="sr-only">Phone</label>
                  <input id="sp-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="sp-tier" className="sr-only">Sponsor Tier</label>
                  <select id="sp-tier" name="tier" value={formData.tier} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md">
                    <option value="Supporting" className="bg-[#193546]">Supporting Partner</option>
                    <option value="Community" className="bg-[#193546]">Community Partner</option>
                    <option value="Presenting" className="bg-[#193546]">Presenting Partner</option>
                    <option value="Headline" className="bg-[#193546]">Headline Partner</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="sp-budget" className="sr-only">Budget Range</label>
                <input id="sp-budget" name="budget" type="text" value={formData.budget} onChange={handleChange} placeholder="Budget Range (optional, e.g. $1k–$5k)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
              </div>
              <div>
                <label htmlFor="sp-notes" className="sr-only">What you're looking for</label>
                <textarea id="sp-notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="What are you looking to get out of a partnership? (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm h-24 resize-none" />
              </div>

              {status.error && <p className="text-red-400 text-xs font-bold">{status.error}</p>}

              <button type="submit" disabled={status.submitting}
                className="w-full mt-2 py-4 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/90 transition-all disabled:opacity-50 btn-glow">
                {status.submitting ? 'SUBMITTING...' : 'REQUEST SPONSOR DECK'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function SponsorPerk({ icon, title, desc }) {
  return (
    <div className="p-8 liquid-glass flex flex-col">
      <div className="mb-6">{icon}</div>
      <h4 className="text-white font-black text-base uppercase italic tracking-tight mb-3">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}