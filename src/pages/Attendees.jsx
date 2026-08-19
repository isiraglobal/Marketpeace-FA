import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { fetchCheckoutSession, submitForm } from '../utils/stripeCheckout';

function AttendeeFeature({ title, desc, highlighted, wide }) {
  return (
    <div className={`flex flex-col gap-4 p-6 md:p-8 liquid-glass transition-all backdrop-blur-sm ${wide ? 'w-full' : ''} ${highlighted ? 'border-[#0DB8D3]/30 shadow-xl' : ''}`}>
      <div>
        <h4 className="text-white font-black text-base md:text-lg mb-1 md:mb-2 tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 text-xs md:text-sm leading-relaxed font-medium description">{desc}</p>
      </div>
    </div>
  );
}

export default function Attendees() {
  const [formData, setFormData] = React.useState({ name: '', email: '' });
  const [status, setStatus] = React.useState({ submitting: false, success: false });
  const [upsellLoading, setUpsellLoading] = React.useState(false);

  React.useEffect(() => {
    document.title = 'MARKETPEACE | Join the Community';
  }, []);

  // FREE registration — no payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ ...status, submitting: true });

    try {
      await submitForm({
        type: 'Attendee',
        name: formData.name,
        email: formData.email,
        ticketType: 'Free',
      });

      setStatus({ submitting: false, success: true });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message });
    }
  };

  // UPSELL: $5 "VIP Access" upgrade
  const handleUpsell = async () => {
    setUpsellLoading(true);
    try {
      const { url } = await fetchCheckoutSession({
        type: 'Attendee',
        name: formData.name,
        email: formData.email,
        tier: 'Regular',
      });
      window.location.href = url;
    } catch (err) {
      setStatus({ ...status, error: err.message });
      setUpsellLoading(false);
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
        <span className="text-[#0DB8D3] tracking-[0.4em] text-[12px] md:text-xs font-black uppercase mb-4 md:mb-6">
          Join Free
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Shop Local.<br/><span className="not-italic text-[#1B7FDC]">Discover New.</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          MARKETPEACE brings together the best local vendors, live music, and good vibes — all under one roof. Join for free and get notified about events near you.
        </p>
      </motion.div>

      <div className="max-w-7xl w-full flex flex-col gap-8 md:gap-16 mb-12 md:mb-20">
        <div className="flex flex-col gap-6 md:gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <AttendeeFeature title="Curated Vendors" desc="Shop unique brands you won't find anywhere else." />
            <AttendeeFeature title="Community Events" desc="Meet makers, discover new brands, enjoy the vibes." highlighted />
            <AttendeeFeature title="Live Entertainment" desc="DJ sets, photo ops, and an unforgettable atmosphere." wide />
          </div>
        </div>

        <div className="liquid-glass p-4 sm:p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          
          {status.success ? (
            /* ── SUCCESS + UPSELL ── */
            <div className="space-y-6">
              <div className="text-center mb-2">
                <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-2 tracking-tighter uppercase italic leading-[0.9] title">Welcome to the <span className="not-italic text-[#1B7FDC]">Community</span></h3>
              </div>

              <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-white font-black text-xl mb-2 uppercase tracking-wide">You're In!</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Welcome, <span className="text-[#0DB8D3] font-bold">{formData.name}</span>! Event updates will be sent to <span className="text-[#0DB8D3] font-bold">{formData.email}</span>.
                </p>
              </div>

              {/* UPSELL — VIP Access */}
              <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0DB8D3]/10 to-[#1B7FDC]/10 border border-[#0DB8D3]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0DB8D3]/10 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#0DB8D3]" />
                  <span className="text-[#0DB8D3] text-[10px] font-black tracking-[0.3em] uppercase">Optional Upgrade</span>
                </div>
                <h4 className="text-white font-black text-2xl mb-2 uppercase italic tracking-tight">Get VIP Access</h4>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  For just $5, skip the line and unlock exclusive perks at every event.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {[
                    'Skip-the-line entry',
                    'Early access (30 min before doors)',
                    'Exclusive goodie bag',
                    'VIP event notifications',
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-white/50 font-medium">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0DB8D3] shrink-0" />
                      {perk}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleUpsell}
                    disabled={upsellLoading}
                    className="flex-1 py-4 bg-[#0DB8D3] text-white font-black rounded-xl tracking-[0.15em] text-[12px] uppercase hover:bg-[#0bc1dd] transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 btn-glow"
                  >
                    {upsellLoading ? 'PROCESSING...' : 'UPGRADE TO VIP — $5'}
                    {!upsellLoading && <ArrowRight className="w-4 h-4" />}
                  </button>
                  <Link to="/" className="flex-1">
                    <button className="w-full py-4 bg-white/5 border border-white/10 text-white/60 font-bold rounded-xl tracking-[0.1em] text-[12px] uppercase hover:bg-white/10 transition-all">
                      Maybe Later
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* ── FREE REGISTRATION FORM ── */
            <>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-4 tracking-tighter uppercase italic leading-[0.9] title">Join the <span className="not-italic text-[#1B7FDC]">Community</span></h3>
              <p className="text-white/50 text-sm mb-8 md:mb-10 font-medium leading-relaxed description">Free registration. Get notified about events near you and discover amazing local vendors.</p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-8">
                <div>
                  <label htmlFor="attendee-name" className="sr-only">Full Name</label>
                  <input id="attendee-name" type="text" placeholder="Full Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label htmlFor="attendee-email" className="sr-only">Email</label>
                  <input id="attendee-email" type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#193546] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 btn-glow">
                  {status.submitting ? 'JOINING...' : 'JOIN FREE'}
                </button>
                {status.error && <p className="text-red-400 text-center mt-4 text-xs font-bold">{status.error}</p>}
              </form>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl w-full liquid-glass p-8 md:p-16 text-center relative overflow-hidden mb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#0DB8D3]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 tracking-tighter uppercase italic leading-[0.9] title">Upcoming <span className="not-italic text-[#1B7FDC]">Events</span></h2>
        <p className="text-white/50 text-base md:text-xl font-medium mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4 description">
          We're launching across NY, DC, and Atlanta. Find an event near you and join the community.
        </p>
        <Link to="/cities">
          <button className="px-10 md:px-12 py-4 md:py-5 bg-white/5 border border-white/20 text-white font-bold rounded-2xl tracking-[0.2em] text-[12px] md:text-xs uppercase hover:bg-white/10 transition-all shadow-lg cursor-pointer">
            VIEW EVENT SCHEDULE
          </button>
        </Link>
      </div>
    </div>
  );
}
