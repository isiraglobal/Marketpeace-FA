import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, Instagram, MapPin } from 'lucide-react';
// SECURITY: submitForm routes through /api/submit (server-side proxy).
import { submitForm } from '../utils/stripeCheckout';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [status, setStatus] = useState({ submitting: false, success: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false });
    try {
      // SECURITY: No Google Apps Script URL in browser — routes through server proxy
      await submitForm({ ...formData, type: 'Contact' });
      setStatus({ submitting: false, success: true });
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch (err) {
      // err.message is user-safe from our API layer
      setStatus({ submitting: false, success: false, error: err.message });
    }
  };

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-white bg-[#0077b6] px-4 py-1.5 rounded-full tracking-[0.3em] text-[12px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(0,119,182,0.4)]">
          Get In Touch
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Let's <span className="not-italic text-[#0090e0]">Talk</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10 description">
          Have a question about vending, attending, or partnering? We're here to help — drop us a line.
        </p>
      </motion.div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ContactMethod 
              icon={<Mail />} 
              title="Email Us" 
              value="contact@foreignaffairs.com" 
              link="mailto:contact@foreignaffairs.com"
            />
            <ContactMethod 
              icon={<Instagram />} 
              title="Follow Us" 
              value="@foreignaffairsmarket" 
              link="https://instagram.com"
            />
          </div>

          {/* Vendor Specific Box */}
          <div className="liquid-glass p-8 md:p-12 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0077b6]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4 flex items-center gap-4 uppercase italic title">
              <MapPin className="text-[#0077b6]" /> FOR VENDORS
            </h3>
            <p className="text-white/70 text-lg font-medium leading-relaxed mb-6 description">
              Looking to showcase your brand? You can use the form or send a direct portfolio to our curation team.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 inline-block w-full sm:w-auto">
              <p className="text-[#0077b6] font-black tracking-widest text-[10px] uppercase mb-2 amount">Direct Curation Email</p>
              <p className="text-white text-base md:text-xl font-black break-all title">vendors@foreignaffairs.com</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 liquid-glass p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <h3 className="text-2xl md:text-3xl font-black mb-8 tracking-tight uppercase italic text-white title">Send a Message</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="contact-name" className="sr-only">Full Name</label>
              <input id="contact-name"
                type="text" 
                placeholder="Full Name" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white outline-none focus:border-[#0077b6] text-sm backdrop-blur-md"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="sr-only">Email Address</label>
              <input id="contact-email"
                type="email" 
                placeholder="Email Address" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white outline-none focus:border-[#0077b6] text-sm backdrop-blur-md"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="sr-only">Subject</label>
              <select id="contact-subject"
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white/70 outline-none focus:border-[#0077b6] text-sm backdrop-blur-md appearance-none"
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
              >
                <option value="General Inquiry" className="bg-[#061530]">General Inquiry</option>
                <option value="Vendor Question" className="bg-[#061530]">Vendor Question</option>
                <option value="Venue Partnership" className="bg-[#061530]">Venue Partnership</option>
                <option value="Promoter Inquiry" className="bg-[#061530]">Promoter Inquiry</option>
              </select>
            </div>
            <div>
              <label htmlFor="contact-message" className="sr-only">Your Message</label>
              <textarea id="contact-message"
                placeholder="Your Message" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-white outline-none focus:border-[#0077b6] h-32 text-sm backdrop-blur-md"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />
            </div>
            <button 
              type="submit" 
              disabled={status.submitting}
              className="w-full mt-4 py-3 sm:py-4 md:py-5 bg-white text-[#061530] font-black rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-xs uppercase hover:bg-white/90 transition-all shadow-xl flex items-center justify-center gap-2 sm:gap-3 btn-glow"
            >
              {status.submitting ? 'SENDING...' : <><Send size={16} /> SEND MESSAGE</>}
            </button>
            {status.success && <p className="text-green-400 text-center mt-4 text-xs font-bold">Message sent! We'll be in touch soon.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}

function ContactMethod({ icon, title, value, link }) {
  return (
    <a href={link} target="_blank" rel="noreferrer" className="flex flex-col gap-4 p-8 liquid-glass hover:bg-white/10 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-[#0077b6]/10 flex items-center justify-center text-[#0077b6] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-white/40 font-black tracking-widest text-[10px] uppercase mb-1 amount">{title}</h4>
        <p className="text-white text-base md:text-lg font-black title uppercase italic">{value}</p>
      </div>
    </a>
  );
}
