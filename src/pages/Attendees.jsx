import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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
  const [formData, setFormData] = React.useState({ name: '', email: '', ticketType: 'Regular' });
  const [status, setStatus] = React.useState({ submitting: false, success: false });

  React.useEffect(() => {
    document.title = 'MARKETPEACE | Get Tickets';
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
      await submitForm({
        type: 'Attendee',
        name: formData.name,
        email: formData.email,
        ticketType: formData.ticketType,
      });

      if (amount > 0) {
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
        <span className="text-white bg-[#0DB8D3] px-4 py-1.5 rounded-full tracking-[0.3em] text-[12px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(13,184,211,0.4)]">
          Get Tickets
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Shop Local.<br/><span className="not-italic text-[#1B7FDC]">Discover New.</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          MARKETPEACE brings together the best local vendors, live music, and good vibes — all under one roof. Come discover your new favorite brands and connect with your community.
        </p>
      </motion.div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 mb-12 md:mb-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6 md:gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            <AttendeeFeature title="Curated Vendors" desc="Shop unique brands you won't find anywhere else." />
            <AttendeeFeature title="VIP Perks" desc="Early access and exclusive goodie bags for first arrivals." highlighted />
            <AttendeeFeature title="Live Entertainment" desc="DJ sets, photo ops, and an unforgettable atmosphere." wide />
          </div>
        </div>

        <div className="lg:col-span-5 liquid-glass p-4 sm:p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white mb-4 tracking-tighter uppercase italic leading-[0.9] title">Get Your <span className="not-italic text-[#1B7FDC]">Tickets</span></h3>
          <p className="text-white/50 text-sm mb-8 md:mb-10 font-medium leading-relaxed description">Secure your spot at our next event. Early birds get exclusive perks.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:gap-8">
            <div>
              <label htmlFor="attendee-name" className="sr-only">Full Name</label>
              <input id="attendee-name" type="text" placeholder="Full Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label htmlFor="attendee-email" className="sr-only">Email</label>
              <input id="attendee-email" type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label htmlFor="attendee-ticket" className="sr-only">Ticket Type</label>
              <select id="attendee-ticket" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md" value={formData.ticketType} onChange={e => setFormData({...formData, ticketType: e.target.value})}>
                <option value="Regular" className="bg-[#193546]">Standard Access Pass ($5)</option>
                <option value="Free-Social" className="bg-[#193546]">Free (Share on Social)</option>
                <option value="Free-Friends" className="bg-[#193546]">Free (Bring 2 Friends)</option>
              </select>
            </div>
            <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#193546] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 btn-glow">
              {status.submitting ? 'PROCESSING...' : (ticketPrices[formData.ticketType] > 0 ? 'PAY $' + ticketPrices[formData.ticketType] + ' ACCESS' : 'GET FREE ACCESS')}
            </button>
            {status.success && <p className="text-green-400 text-center mt-4 text-xs font-bold">Access Pass Generated. Check your email for details.</p>}
            {status.error && <p className="text-red-400 text-center mt-4 text-xs font-bold">{status.error}</p>}
          </form>
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
