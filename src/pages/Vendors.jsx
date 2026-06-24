import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
// SECURITY: submitForm routes through /api/submit (server-side proxy).
// fetchCheckoutSession does NOT send amount — server determines price.
import { fetchCheckoutSession, submitForm } from '../utils/stripeCheckout';

export default function Vendors() {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    instagram: '',
    tier: 'Standard'
  });

  const [status, setStatus] = useState({ submitting: false, success: false, error: null });

  const tierAmounts = {
    Standard: 250,
    Flagship: 500,
  };

  const selectedAmount = tierAmounts[formData.tier] || 250;

  useEffect(() => {
    document.title = "MARKETPEACE | Vendor Sync";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });

    try {
      // SECURITY: Submit form data through server-side proxy (no Google Script URL in browser).
      // Server validates all fields and writes to Google Sheets.
      await submitForm({
        type: 'Vendor',
        name: formData.name,
        businessName: formData.businessName,
        email: formData.email,
        instagram: formData.instagram,
        tier: formData.tier,
        // SECURITY: No transactionID or amount sent from client.
        // Server generates ID and determines canonical price from tier.
      });

      // SECURITY: fetchCheckoutSession does NOT send amount.
      // Server looks up price from (type, tier) server-side.
      const { url } = await fetchCheckoutSession({
        type: 'Vendor',
        name: formData.name,
        email: formData.email,
        tier: formData.tier,
      });

      // Redirect to Stripe — success/cancel URLs are set server-side
      window.location.href = url;
    } catch (err) {
      // SECURITY: Only display the user-safe error message — not raw internals
      setStatus({ submitting: false, success: false, error: err.message || 'Failed to process. Please try again.' });
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
          Vendor Applications
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-tight md:leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Grow Your <span className="not-italic text-[#0090e0]">Business Here</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Join MARKETPEACE and get your brand in front of thousands of local shoppers. Our team handles the setup, marketing, and crowd — you just bring your product and passion.
        </p>
      </motion.div>

      {/* Booth Options */}
      <div className="max-w-6xl w-full flex flex-col items-center mb-12 md:mb-20">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-8 md:mb-12 text-center uppercase italic">Choose Your Booth</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <TierCard 
            title="Standard Node" 
            price="$250 ENTRY" 
            desc="6ft table & 2 chairs. Prime placement. Core revenue stream."
            features={["6ft Table & 2 Chairs", "Prime Placement", "Event Listing Inclusion", "Social Media Mention"]}
          />
          <TierCard 
            title="Flagship Node" 
            price="$500 ENTRY" 
            desc="Maximum authority. Premium corner positions. Featured on all promotions."
            features={["Premium Corner Placement", "Featured on Promotions", "Social Media Shoutout", "VIP Platform Listing"]}
            highlighted
          />
        </div>
      </div>

      <div className="max-w-6xl w-full flex flex-col items-center mb-12 md:mb-20 liquid-glass p-8 md:p-16">
        <h3 className="text-xl md:text-3xl font-black text-white mb-8 uppercase italic text-center">Everything You Get</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {[
              "Premium foot traffic at curated events",
              "Digital listing on Marketpeace + materials",
              "Social media features (IG, TikTok)",
              "Promoter system selling tickets for you",
              "Post-event photo/video content",
              "Early access to future registration",
              "Vendor directory listing on platform",
              "Inclusion in event email blasts",
              "Analytics dashboard with traffic data",
              "Discounted rate for recurring vendors",
              "QR code signage with your links",
              "Secure, cashless payment processing"
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-1 h-1 bg-[#0077b6] rounded-full shrink-0 mt-2" />
                <p className="text-white/50 text-sm font-medium uppercase leading-relaxed description">{benefit}</p>
              </div>
            ))}
        </div>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-12 md:mb-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-8 md:gap-10">
          <div className="flex flex-col gap-4 text-center lg:text-left">
            <h2 className="text-2xl md:text-5xl font-black tracking-tight text-white leading-tight italic uppercase">
              Secure Your Spot: <span className="not-italic text-[#0077b6]">{selectedAmount} Deposit</span>
            </h2>
            <div className="h-1 w-20 bg-[#0077b6] rounded-full mx-auto lg:mx-0"></div>
            <p className="text-white/50 text-base md:text-lg font-medium mt-2">Lock in your place at our next event. Balance is due before the event date.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mt-4">
            <VendorFeature title="Foot Traffic" desc="Direct access to a curated, high-intent local audience." />
            <VendorFeature title="Network Effects" desc="Join a growing community of top-tier creators and brands." />
            <VendorFeature title="Professional Media" desc="High-quality photos and video content for your brand." />
            <VendorFeature title="VIP Access" desc="Guest tickets and cross-promotional opportunities." />
          </div>
        </div>

        <div className="lg:col-span-5 liquid-glass p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0077b6]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl text-white font-black mb-4 italic uppercase title">
            Apply to Sell
          </h3>
          <p className="text-white/70 text-lg font-medium leading-relaxed mb-6 description">
            Ready to grow your business? Fill out the form below and our team will review your application within 48 hours.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vendor-name" className="sr-only">Full Name</label>
                <Input id="vendor-name" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" />
              </div>
              <div>
                <label htmlFor="vendor-business" className="sr-only">Brand Name</label>
                <Input id="vendor-business" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Brand Name" />
              </div>
            </div>
            <div>
              <label htmlFor="vendor-email" className="sr-only">Email</label>
              <Input id="vendor-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Communication Channel (Email)" />
            </div>
            <div>
              <label htmlFor="vendor-instagram" className="sr-only">Instagram</label>
              <Input id="vendor-instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Digital Presence (Instagram)" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Standard', 'Flagship'].map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setFormData({ ...formData, tier })}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${formData.tier === tier ? 'border-[#0077b6] bg-[#0077b6]/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:border-[#0077b6] hover:bg-white/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black uppercase tracking-[0.2em]">{tier}</span>
                    <span className="text-sm font-black">${tier === 'Flagship' ? '500' : '250'}</span>
                  </div>
                  <p className="text-[10px] mt-2 text-white/50">{tier === 'Flagship' ? 'Premium corner positions, featured promotion.' : 'Standard placement, strong visibility.'}</p>
                </button>
              ))}
            </div>

            <div className="flex items-start gap-4 mt-2">
              <input type="checkbox" required id="terms" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5" />
              <label htmlFor="terms" className="text-[10px] md:text-[11px] text-white/40 leading-relaxed font-light">
                I agree to the terms and conditions and understand the deposit is non-refundable.
              </label>
            </div>
            
            {status.error && <p className="text-red-400 text-xs mt-2">{status.error}</p>}

            <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#061530] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 hover:-translate-y-1 active:translate-y-0 btn-glow">
              {status.submitting ? 'INITIALIZING...' : `PAY $${selectedAmount}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function TierCard({ title, price, desc, features, highlighted = false }) {
  return (
    <div className={`flex flex-col p-8 md:p-10 h-full liquid-glass ${highlighted ? 'border-[#0077b6]/40 shadow-[0_0_40px_rgba(0,119,182,0.15)] scale-105 z-10 premium-border' : ''}`}>
      <span className={`text-[10px] font-bold tracking-[0.3em] uppercase mb-4 amount ${highlighted ? 'text-[#0077b6]' : 'text-white/40'}`}>{price}</span>
      <h4 className="text-2xl font-black text-white mb-4 tracking-tight title uppercase italic">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 description">{desc}</p>
      <div className="flex flex-col gap-3 mt-auto">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-[11px] text-white/50 font-medium description">
            <div className={`w-1 h-1 rounded-full ${highlighted ? 'bg-[#0077b6]' : 'bg-white/20'}`} />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorFeature({ title, desc, highlighted = false }) {
  return (
    <div className={`flex flex-col gap-4 p-6 md:p-10 liquid-glass ${highlighted ? 'border-[#0077b6]/30' : ''}`}>
      <div>
        <h4 className="text-white font-black text-base md:text-lg mb-1 md:mb-3 tracking-tight break-words italic uppercase title">{title}</h4>
        <p className="text-white/40 text-sm md:text-sm leading-relaxed font-medium break-words description">{desc}</p>
      </div>
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input 
      {...props} 
      required 
      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0077b6] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" 
    />
  );
}
