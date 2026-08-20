import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Users, Shield, Star } from 'lucide-react';
import { submitForm } from '../utils/stripeCheckout';

export default function Staff() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    availability: '',
    experience: '',
    location: '',
    notes: '',
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  useEffect(() => {
    document.title = "MARKETPEACE | Work With Us";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });
    try {
      await submitForm({ type: 'Staff', ...formData });
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
          Join The Crew
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-tight md:leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Work the Peace.<br /><span className="not-italic text-[#1B7FDC]">Be the Crew.</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Marketpeace runs on the people who show up. Join our event crew for markets in your city and help build
          the best community market experience on the ground.
        </p>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
        <StaffPerk icon={<Shield className="w-5 h-5 text-[#0DB8D3]" />} title="Security & Entry" desc="Gates, wristbands, guest list and safe flows." />
        <StaffPerk icon={<Users className="w-5 h-5 text-[#1B7FDC]" />} title="Market Operations" desc="Setup, teardown, vendor support and logistics." />
        <StaffPerk icon={<Star className="w-5 h-5 text-[#9b59b6]" />} title="Experience Team" desc="VIP, sponsors and guest hospitality." />
      </div>

      <div className="max-w-3xl w-full">
        <div className="liquid-glass p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>

          {status.success ? (
            <div className="text-center space-y-6">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl md:text-3xl text-white font-black uppercase tracking-tight italic">Application Received</h3>
              <p className="text-white/60 text-sm font-medium">
                Thanks, <span className="text-[#0DB8D3] font-bold">{formData.name}</span>! Our ops team will reach out to{' '}
                <span className="text-[#0DB8D3] font-bold">{formData.email}</span> when we're staffing up in your area.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              <h3 className="text-2xl md:text-3xl text-white font-black mb-2 italic uppercase title">Apply To Crew</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff-name" className="sr-only">Full Name</label>
                  <input id="staff-name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="staff-email" className="sr-only">Email</label>
                  <input id="staff-email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff-phone" className="sr-only">Phone</label>
                  <input id="staff-phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} placeholder="Phone"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="staff-location" className="sr-only">Your City</label>
                  <input id="staff-location" name="location" type="text" value={formData.location} onChange={handleChange} placeholder="Your City"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="staff-role" className="sr-only">Role</label>
                <select id="staff-role" name="role" value={formData.role} onChange={handleChange} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md">
                  <option value="" disabled className="bg-[#193546]">Preferred Role</option>
                  <option value="Security & Entry" className="bg-[#193546]">Security & Entry</option>
                  <option value="Market Operations" className="bg-[#193546]">Market Operations</option>
                  <option value="Experience Team" className="bg-[#193546]">Experience Team</option>
                  <option value="Setup / Teardown" className="bg-[#193546]">Setup / Teardown</option>
                  <option value="General Crew" className="bg-[#193546]">General Crew</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff-availability" className="sr-only">Availability</label>
                  <input id="staff-availability" name="availability" type="text" value={formData.availability} onChange={handleChange} placeholder="Availability (weekends, etc.)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="staff-experience" className="sr-only">Experience</label>
                  <input id="staff-experience" name="experience" type="text" value={formData.experience} onChange={handleChange} placeholder="Relevant Experience"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="staff-notes" className="sr-only">Anything else</label>
                <textarea id="staff-notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Anything else we should know? (optional)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm h-24 resize-none" />
              </div>

              {status.error && <p className="text-red-400 text-xs font-bold">{status.error}</p>}

              <button type="submit" disabled={status.submitting}
                className="w-full mt-2 py-4 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/90 transition-all disabled:opacity-50 btn-glow">
                {status.submitting ? 'SUBMITTING...' : 'APPLY TO CREW'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffPerk({ icon, title, desc }) {
  return (
    <div className="p-8 liquid-glass flex flex-col">
      <div className="mb-6">{icon}</div>
      <h4 className="text-white font-black text-base uppercase italic tracking-tight mb-3">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}