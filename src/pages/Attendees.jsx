import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
// SECURITY: submitForm proxies through /api/submit — no Google Script URL in browser.
import { fetchCheckoutSession, submitForm } from '../utils/stripeCheckout';

export default function Attendees() {
  const [formData, setFormData] = React.useState({ name: '', email: '', ticketType: 'Regular' });
  const [status, setStatus] = React.useState({ submitting: false, success: false });

  React.useEffect(() => {
    document.title = "MARKETPEACE | System Access";
  }, []);

  const ticketPrices = {
    Regular: 5,
    'Free-Social': 0,
    'Free-Friends': 0,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ ...status, submitting: true });
    const amount = ticketPrices[formData.ticketType] ?? 0;

    try {
      // SECURITY: Submit through server-side proxy — Google Script URL not in browser.
      await submitForm({
        type: 'Attendee',
        name: formData.name,
        email: formData.email,
        ticketType: formData.ticketType,
        // Server determines amount from ticketType
      });

      if (amount > 0) {
        // SECURITY: No amount sent — server derives price from ticketType.
        const { url } = await fetchCheckoutSession({
          type: 'Attendee',
          name: formData.name,
          email: formData.email,
          tier: formData.ticketType,
        });
        window.location.href = url;
        return;
      }

      setStatus({ submitting: false, success: true });
    } catch (err) {
      // SECURITY: err.message is already user-safe (from our API error handling)
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
        <span className="text-white bg-[#0077b6] px-4 py-1.5 rounded-full tracking-[0.3em] text-[10px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(0,119,182,0.4)]">
          The Experience
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Culture, Access,<br/><span className="not-italic text-stroke-blue">Repeat</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Discovery is the only true leverage. Be early to the brands that will define the next era of commerce. Enter the MARKETPEACE environment and secure your presence in the future of creator culture.
        </p>
      </motion.div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 mb-12 md:mb-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6 md:gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <AttendeeFeature title="Priority Protocol" desc="Curated environment of high-value brands." />
            <AttendeeFeature title="Sovereignty Dividend" desc="Exclusive first-look access and perks." highlighted />
          </div>
          <AttendeeFeature title="The Atmosphere" desc="Live DJ sets and curated sensory protocol." wide />
        </div>

        <div className="lg:col-span-5 liquid-glass p-4 sm:p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0690d4]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-4 tracking-tighter uppercase italic leading-[0.9] title">Initialize <span className="not-italic text-stroke-blue">Entry</span></h3>
          <p className="text-white/50 text-sm mb-8 md:mb-10 font-medium leading-relaxed description">Secure your strategic access pass. Join the movement at the next node activation.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-8">
            <div>
              <label htmlFor="attendee-name" className="sr-only">Full Name</label>
              <input id="attendee-name" type="text" placeholder="Identity (Full Name)" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] transition-all placeholder:text-white/20 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label htmlFor="attendee-email" className="sr-only">Email</label>
              <input id="attendee-email" type="email" placeholder="Communication Channel (Email)" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] transition-all placeholder:text-white/20 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label htmlFor="attendee-ticket" className="sr-only">Ticket Type</label>
              <select id="attendee-ticket" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white/70 outline-none focus:border-[#0077b6] transition-all appearance-none text-sm backdrop-blur-md" value={formData.ticketType} onChange={e => setFormData({...formData, ticketType: e.target.value})}>
                <option value="Regular" className="bg-[#061530]">Standard Access Pass ($5)</option>
                <option value="Free-Social" className="bg-[#061530]">System Credit (Shared on Social)</option>
                <option value="Free-Friends" className="bg-[#061530]">Network Credit (Bringing 2 Friends)</option>
              </select>
            </div>
            <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#061530] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[9px] sm:text-[10px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 active:translate-y-0 btn-glow">
              {status.submitting ? 'INITIALIZING...' : `PAY ${ticketPrices[formData.ticketType] > 0 ? `$${ticketPrices[formData.ticketType]}` : 'FREE'} ACCESS`}
            </button>
            {status.success && <p className="text-green-400 text-center mt-4 text-xs font-bold">Access Pass Generated. Check your channel for details.</p>}
          </form>
        </div>
      </div>

      <div className="max-w-5xl w-full liquid-glass p-8 md:p-16 text-center relative overflow-hidden mb-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#0690d4]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <h2 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 tracking-tighter uppercase italic leading-[0.9] title">Activation <span className="not-italic text-stroke-blue">Timeline</span></h2>
        <p className="text-white/50 text-base md:text-xl font-medium mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4 description">
          Nationwide series initiating across NY, DC, and Atlanta. Join the rollout at the nearest node activation point.
        </p>
        <Link to="/cities">
          <button className="px-10 md:px-12 py-4 md:py-5 bg-white/5 border border-white/20 text-white font-bold rounded-2xl tracking-[0.2em] text-[10px] md:text-xs uppercase hover:bg-white/10 transition-all shadow-lg cursor-pointer hover:-translate-y-1">
            VIEW ROLLOUT SCHEDULE
          </button>
        </Link>
      </div>
    </div>
  );
}

function AttendeeFeature({ title, desc, highlighted = false, wide = false }) {
  return (
    <div className={`flex flex-col gap-4 p-6 md:p-8 liquid-glass transition-all backdrop-blur-sm ${wide ? 'w-full' : ''} ${highlighted ? 'border-[#0690d4]/30 shadow-xl' : ''}`}>
      <div>
        <h4 className="text-white font-black text-base md:text-lg mb-1 md:mb-2 tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 text-xs md:text-sm leading-relaxed font-medium description">{desc}</p>
      </div>
    </div>
  );
}
