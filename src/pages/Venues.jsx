import React from 'react';
import { motion } from 'framer-motion';
// SECURITY: submitForm routes through /api/submit (server-side proxy).
import { submitForm } from '../utils/stripeCheckout';

export default function Venues() {
  const [formData, setFormData] = React.useState({ venueName: '', name: '', email: '', phone: '', location: '', capacity: '', notes: '' });
  const [status, setStatus] = React.useState({ submitting: false, success: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false });
    try {
      // SECURITY: No Google Apps Script URL in browser — routes through server proxy
      await submitForm({ ...formData, type: 'Venue' });
      setStatus({ submitting: false, success: true });
      setFormData({ venueName: '', name: '', email: '', phone: '', location: '', capacity: '', notes: '' });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message });
    }
  };

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-5xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-white bg-[#0077b6] px-4 py-1.5 rounded-full tracking-[0.3em] text-[12px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(0,119,182,0.4)]">
          Venue Partnerships
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Host an Event,<br/><span className="not-italic text-[#0090e0]">Get Filled</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Partner with MARKETPEACE and we'll fill your space with 150+ engaged shoppers. You get the foot traffic, we handle the rest.
        </p>
      </motion.div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-12 md:mb-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <FeatureItem title="New Foot Traffic" desc="150-300+ intentional patrons discover your space." />
            <FeatureItem title="Professional Content" desc="Free high-fidelity media assets and social amplify." />
            <FeatureItem title="Recurring Revenue" desc="Consistent, hands-off income monthly." />
            <FeatureItem title="Full Insurance" desc="$1M liability policy for every event." />
          </div>
        </div>

        <div className="lg:col-span-5 liquid-glass p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0077b6]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tight uppercase italic text-white title">Partner With Us</h3>
          <p className="text-white/50 text-sm mb-8 md:mb-10 font-medium leading-relaxed description">Let's discuss how we can work together.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <div>
              <label htmlFor="venue-name" className="sr-only">Venue Name</label>
              <input id="venue-name" type="text" placeholder="Venue Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] text-sm" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="venue-contact" className="sr-only">Contact Name</label>
                <input id="venue-contact" type="text" placeholder="Contact Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label htmlFor="venue-email" className="sr-only">Email</label>
                <input id="venue-email" type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label htmlFor="venue-location" className="sr-only">Location</label>
              <input id="venue-location" type="text" placeholder="Location (City/Address)" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label htmlFor="venue-notes" className="sr-only">Tell us about your space</label>
              <textarea id="venue-notes" placeholder="Tell us about your space..." className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] h-32 text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#061530] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 active:translate-y-0 btn-glow">
              {status.submitting ? 'SENDING...' : 'REQUEST PARTNERSHIP'}
            </button>
            {status.success && <p className="text-green-400 text-center mt-4 text-xs">Application sent! We'll be in touch.</p>}
            {status.error && <p className="text-red-400 text-center mt-4 text-xs">{status.error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div className="liquid-glass p-6 md:p-8 flex flex-col gap-4 hover:border-white/20 transition-all">
      <div>
        <h4 className="text-white font-black text-base md:text-lg mb-1 md:mb-2 tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 text-xs md:text-sm leading-relaxed font-medium description">{desc}</p>
      </div>
    </div>
  );
}
