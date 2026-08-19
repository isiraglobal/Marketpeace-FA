import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Send } from 'lucide-react';
import { submitForm } from '../utils/stripeCheckout';

export default function Cities() {
  const [cityNodes, setCityNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    country: 'United States',
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  useEffect(() => {
    document.title = "MARKETPEACE | Find a Market Near You";
    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCityNodes(data);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchCities();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });

    try {
      await submitForm({
        type: 'CityRequest',
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      });

      setStatus({ submitting: false, success: true, error: null });
    } catch (err) {
      setStatus({
        submitting: false,
        success: false,
        error: err.message || 'Failed to submit city request. Please try again.',
      });
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
          Expansion Rollout
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Find a Market <span className="not-italic text-[#1B7FDC]">Near You</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 mb-6 md:mb-10">
          MARKETPEACE is expanding to top creative hubs. Explore current locations or request your city below.
        </p>
      </motion.div>

      {/* ACTIVE / PLANNED CITIES */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
        {loading ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-20">
            <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading cities...</span>
          </div>
        ) : (
          cityNodes.map((city, idx) => (
            <CityNode key={idx} {...city} />
          ))
        )}
      </div>

      {/* REQUEST YOUR CITY INTAKE FORM */}
      <div id="request-city" className="max-w-4xl w-full liquid-glass p-6 sm:p-10 md:p-16 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-[#0DB8D3]" />
          <span className="text-[#0DB8D3] tracking-[0.3em] text-[10px] sm:text-xs font-black uppercase">Vote For Expansion</span>
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 md:mb-6 tracking-tighter uppercase italic leading-[0.9] title text-white">
          Bring Marketpeace <span className="not-italic text-[#1B7FDC]">To Your City</span>
        </h2>
        <p className="text-white/60 text-sm sm:text-base md:text-lg font-medium mb-8 md:mb-12 leading-relaxed max-w-2xl mx-auto description">
          Tell us where you want the next market. When enough vendors and attendees request a location, we launch the city node.
        </p>

        {status.success ? (
          <div className="p-8 rounded-2xl bg-green-500/10 border border-green-500/20 max-w-xl mx-auto text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-white font-black text-xl mb-2 uppercase tracking-wide">City Request Logged!</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              Thank you, <span className="text-[#0DB8D3] font-bold">{formData.name}</span>. We've added <span className="text-white font-bold">{formData.city}, {formData.state || formData.country}</span> to our rollout queue.
            </p>
            <p className="text-white/40 text-xs">We will notify you at <span className="text-white/70">{formData.email}</span> as soon as dates are confirmed.</p>
            <button
              onClick={() => {
                setStatus({ submitting: false, success: false, error: null });
                setFormData({ name: '', phone: '', email: '', city: '', state: '', country: 'United States' });
              }}
              className="mt-6 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl uppercase tracking-widest transition-all"
            >
              Request Another City
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5 max-w-2xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cityreq-name" className="sr-only">Full Name</label>
                <Input
                  id="cityreq-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your Full Name"
                  required
                />
              </div>
              <div>
                <label htmlFor="cityreq-phone" className="sr-only">Phone Number</label>
                <Input
                  id="cityreq-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="cityreq-email" className="sr-only">Email Address</label>
              <Input
                id="cityreq-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cityreq-city" className="sr-only">City</label>
                <Input
                  id="cityreq-city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Requested City"
                  required
                />
              </div>
              <div>
                <label htmlFor="cityreq-state" className="sr-only">State / Region</label>
                <Input
                  id="cityreq-state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State / Province"
                  required
                />
              </div>
              <div>
                <label htmlFor="cityreq-country" className="sr-only">Country</label>
                <Input
                  id="cityreq-country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  required
                />
              </div>
            </div>

            {status.error && <p className="text-red-400 text-xs mt-1 text-center">{status.error}</p>}

            <button
              type="submit"
              disabled={status.submitting}
              className="w-full mt-4 py-4 md:py-5 bg-white text-[#193546] font-black rounded-xl sm:rounded-2xl tracking-[0.2em] text-[12px] sm:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 btn-glow"
            >
              {status.submitting ? 'LOGGING REQUEST...' : <><Send size={15} /> SUBMIT CITY REQUEST</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function CityNode({ name, status, date }) {
  return (
    <div className="p-8 md:p-10 liquid-glass hover:bg-white/10 transition-all group relative overflow-hidden h-full flex flex-col items-center text-center">
      <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-tight italic uppercase title">{name}</h3>
      <span className="text-[#0DB8D3] text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block amount">{date}</span>
      <span className="text-white/30 text-[10px] font-bold tracking-[0.2em] uppercase description">{status}</span>
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input 
      {...props} 
      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" 
    />
  );
}
