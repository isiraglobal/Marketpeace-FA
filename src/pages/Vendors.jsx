import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Sparkles, ArrowRight, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
// SECURITY: submitForm routes through /api/submit (server-side proxy).
// Free profile creation — no payment required.
// Upsell ("Get Involved") and high-ticket booth offers are separate flows.
import { submitForm, fetchCheckoutSession } from '../utils/stripeCheckout';

export default function Vendors() {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    instagram: '',
    category: '',
    referrer: '',
  });

  const [status, setStatus] = useState({ submitting: false, success: false, error: null });
  const [upsellLoading, setUpsellLoading] = useState(false);

  // Booth interest form (replaces "→ /contact" dead-end)
  const [boothOpen, setBoothOpen] = useState(false);
  const [boothData, setBoothData] = useState({ name: '', businessName: '', email: '', tier: 'Standard', event: '', referrer: '', message: '' });
  const [boothStatus, setBoothStatus] = useState({ submitting: false, success: false, error: null });
  const [boothLoading, setBoothLoading] = useState(false);

  useEffect(() => {
    document.title = "MARKETPEACE | Join as a Vendor";
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(f => ({ ...f, referrer: ref }));
      setBoothData(b => ({ ...b, referrer: ref }));
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // FREE profile creation — no payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });

    try {
      await submitForm({
        type: 'Vendor',
        name: formData.name,
        businessName: formData.businessName,
        email: formData.email,
        instagram: formData.instagram,
        category: formData.category,
        tier: 'Free', // Free profile — no AI offer pipeline triggered
        referrer: formData.referrer,
      });

      setStatus({ submitting: false, success: true, error: null });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message || 'Failed to submit. Please try again.' });
    }
  };

  // UPSELL: $5 "Get Involved" upgrade via Stripe
  const handleUpsell = async () => {
    setUpsellLoading(true);
    try {
      const { url } = await fetchCheckoutSession({
        type: 'Upsell',
        name: formData.name,
        email: formData.email,
        tier: 'GetInvolved',
        referrerCode: formData.referrer || undefined,
      });
      window.location.href = url;
    } catch (err) {
      setStatus({ ...status, error: err.message || 'Could not start checkout.' });
      setUpsellLoading(false);
    }
  };

  // HIGH-TICKET BOOTH: instant $100 deposit checkout (server sets the price)
  const handleBoothDeposit = async () => {
    setBoothLoading(true);
    setBoothStatus({ submitting: false, success: false, error: null });
    try {
      // 1) Create the vendor row first so the TID is linked for the webhook
      const { transactionID } = await submitForm({
        type: 'Vendor',
        name: boothData.name,
        businessName: boothData.businessName,
        email: boothData.email,
        instagram: '',
        category: 'General',
        tier: boothData.tier,
        event: boothData.event,
        referrer: boothData.referrer,
        message: boothData.message,
        paymentMethod: 'stripe',
      });
      // 2) Open Stripe Checkout for the $100 non-refundable deposit
      const { url } = await fetchCheckoutSession({
        type: 'Vendor',
        name: boothData.name,
        email: boothData.email,
        tier: boothData.tier,
        event: boothData.event,
        referrerCode: boothData.referrer || undefined,
        transactionID,
      });
      window.location.href = url;
    } catch (err) {
      setBoothLoading(false);
      setBoothStatus({ submitting: false, success: false, error: err.message || 'Could not start checkout.' });
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
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-tight md:leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Create Your <span className="not-italic text-[#1B7FDC]">Vendor Profile</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Join MARKETPEACE for free. Build your vendor profile, get discovered by local shoppers, and grow your brand within our community — no upfront cost.
        </p>
      </motion.div>

      {/* What You Get (Free) */}
      <div className="max-w-6xl w-full flex flex-col items-center mb-12 md:mb-20 liquid-glass p-8 md:p-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#0DB8D3] bg-[#0DB8D3]/10 px-4 py-1.5 rounded-full tracking-[0.2em] text-[10px] font-black uppercase border border-[#0DB8D3]/20">100% Free</span>
        </div>
        <h3 className="text-xl md:text-3xl font-black text-white mb-8 uppercase italic text-center">What You Get</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {[
              "Vendor profile in the MARKETPEACE network",
              "Event notifications for your city",
              "Access to the vendor community",
              "Visibility to local shoppers & attendees",
              "Post-event photo/video content access",
              "Inclusion in vendor directory",
              "Analytics on profile views",
              "Early access to future event registration",
              "Email updates on new opportunities",
            ].map((benefit, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-1 h-1 bg-[#0DB8D3] rounded-full shrink-0 mt-2" />
                <p className="text-white/50 text-sm font-medium uppercase leading-relaxed description">{benefit}</p>
              </div>
            ))}
        </div>
      </div>

      {/* FORM — Free Profile Creation */}
      <div className="max-w-7xl w-full flex flex-col gap-8 lg:gap-16 mb-12 md:mb-20">
        <div className="liquid-glass p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl text-white font-black mb-2 italic uppercase title">
            {status.success ? 'Welcome to the Community' : 'Create Your Free Profile'}
          </h3>
          <p className="text-white/70 text-lg font-medium leading-relaxed mb-6 description">
            {status.success 
              ? 'You\'re in! Your vendor profile has been created.'
              : 'Takes 30 seconds. No payment required. Start building your presence today.'}
          </p>
          
          {status.success ? (
            /* ── SUCCESS STATE + UPSELL ── */
            <div className="space-y-6">
              {/* Confirmation */}
              <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-white font-black text-xl mb-2 uppercase tracking-wide">Profile Created</h4>
                <p className="text-white/60 text-sm leading-relaxed">
                  Welcome, <span className="text-[#0DB8D3] font-bold">{formData.name}</span>! A confirmation has been sent to <span className="text-[#0DB8D3] font-bold">{formData.email}</span>.
                </p>
              </div>

              {/* UPSELL CARD — "Get Involved" */}
              <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#0DB8D3]/10 to-[#1B7FDC]/10 border border-[#0DB8D3]/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#0DB8D3]/10 rounded-full blur-[60px] pointer-events-none"></div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-[#0DB8D3]" />
                  <span className="text-[#0DB8D3] text-[10px] font-black tracking-[0.3em] uppercase">Optional Upgrade</span>
                </div>
                <h4 className="text-white font-black text-2xl mb-2 uppercase italic tracking-tight">Get Directly Involved</h4>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  Want to stand out from day one? For just $5, unlock premium perks that give your profile a boost.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                  {[
                    'Priority event notifications',
                    'Featured profile badge',
                    'Social media shoutout',
                    'Early access to new events',
                    'Community Discord invite',
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
                    {upsellLoading ? 'PROCESSING...' : 'GET INVOLVED — $5'}
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
            /* ── FORM ── */
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
                <Input id="vendor-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email Address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vendor-instagram" className="sr-only">Instagram</label>
                  <Input id="vendor-instagram" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="Instagram Handle" />
                </div>
                <div>
                  <label htmlFor="vendor-category" className="sr-only">Category</label>
                  <select 
                    id="vendor-category"
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md"
                  >
                    <option value="" disabled className="bg-[#193546]">Select Category</option>
                    <option value="Food & Beverage" className="bg-[#193546]">Food & Beverage</option>
                    <option value="Fashion & Apparel" className="bg-[#193546]">Fashion & Apparel</option>
                    <option value="Art & Crafts" className="bg-[#193546]">Art & Crafts</option>
                    <option value="Health & Wellness" className="bg-[#193546]">Health & Wellness</option>
                    <option value="Home & Lifestyle" className="bg-[#193546]">Home & Lifestyle</option>
                    <option value="Tech & Accessories" className="bg-[#193546]">Tech & Accessories</option>
                    <option value="Services" className="bg-[#193546]">Services</option>
                    <option value="Other" className="bg-[#193546]">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="vendor-referrer" className="sr-only">Referral Code (optional)</label>
                <input id="vendor-referrer" name="referrer" type="text" value={formData.referrer} onChange={handleChange} placeholder="Referral Code (optional, e.g. MP-JOHN-G7K)" className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
              </div>

              <div className="flex items-start gap-4 mt-2">
                <input type="checkbox" required id="terms" className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5" />
                <label htmlFor="terms" className="text-[10px] md:text-[11px] text-white/40 leading-relaxed font-light">
                  I agree to the terms and conditions. Creating a profile is free.
                </label>
              </div>
              
              {status.error && <p className="text-red-400 text-xs mt-2">{status.error}</p>}

              <button type="submit" disabled={status.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#193546] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 btn-glow">
                {status.submitting ? 'CREATING PROFILE...' : 'JOIN FREE'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* PREMIUM BOOTHS — High-Ticket Section */}
      <div className="max-w-6xl w-full flex flex-col items-center mb-12 md:mb-20">
        <div className="text-center mb-8 md:mb-12">
          <span className="text-[#0DB8D3] tracking-[0.4em] text-[10px] font-black uppercase mb-4 block">When You're Ready to Level Up</span>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">Premium <span className="not-italic text-[#1B7FDC]">Booth Packages</span></h2>
          <p className="text-white/50 text-sm mt-4 max-w-xl mx-auto">Already know you want a booth at our next event? Drop your info below and we'll reach out with a custom offer tailored to your brand.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          <TierCard 
            title="Standard Booth" 
            price="FROM $250" 
            desc="6ft table & 2 chairs. Prime placement. Core revenue stream."
            features={["6ft Table & 2 Chairs", "Prime Placement", "Event Listing Inclusion", "Social Media Mention"]}
          />
          <TierCard 
            title="Flagship Booth" 
            price="FROM $500" 
            desc="Maximum authority. Premium corner positions. Featured on all promotions."
            features={["Premium Corner Placement", "Featured on Promotions", "Social Media Shoutout", "VIP Platform Listing"]}
            highlighted
          />
        </div>

        {/* Inline Booth Interest Form — no redirect */}
        <div className="w-full max-w-2xl mt-8">
          {!boothOpen && !boothStatus.success && (
            <button
              id="booth-request-btn"
              onClick={() => setBoothOpen(true)}
              className="w-full px-8 py-4 liquid-glass text-white font-bold rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/10 transition-all"
            >
              <Crown className="w-4 h-4 inline mr-2 text-[#0DB8D3]" />
              Request Premium Booth
            </button>
          )}

          {boothStatus.success && (
            <div id="booth-success" className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h4 className="text-white font-black text-lg mb-1 uppercase tracking-wide">Request Received!</h4>
              <p className="text-white/60 text-sm">We'll reach out to <span className="text-[#0DB8D3] font-bold">{boothData.email}</span> with your custom offer.</p>
            </div>
          )}

          {boothOpen && !boothStatus.success && (
            <div id="booth-form" className="liquid-glass p-6 md:p-8 rounded-2xl border-[#0DB8D3]/20">
              <div className="flex items-center justify-between mb-5">
                <h4 className="text-white font-black text-lg uppercase italic tracking-tight">
                  <Crown className="w-4 h-4 inline mr-2 text-[#0DB8D3]" />
                  Booth Request
                </h4>
                <button onClick={() => setBoothOpen(false)} className="text-white/30 hover:text-white/60 text-xs uppercase tracking-widest font-bold transition-colors">Cancel</button>
              </div>
<form
                id="booth-request-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setBoothStatus({ submitting: true, success: false, error: null });
                  try {
                    // High-ticket booth application → lands in Vendors sheet with tier
                    // Standard/Flagship. The Apps Script cron (cronProcessAIOffers) picks
                    // this up, generates a custom AI offer, and emails a Stripe payment link.
                    await submitForm({
                      type: 'Vendor',
                      name: boothData.name,
                      businessName: boothData.businessName,
                      email: boothData.email,
                      instagram: '',
                      category: 'General',
                      tier: boothData.tier,
                      event: boothData.event,
                      referrer: boothData.referrer,
                      message: boothData.message,
                    });
                    setBoothStatus({ submitting: false, success: true, error: null });
                    setBoothOpen(false);
                  } catch (err) {
                    setBoothStatus({ submitting: false, success: false, error: err.message || 'Submission failed. Please try again.' });
                  }
                }}
                className="flex flex-col gap-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="booth-name" className="sr-only">Full Name</label>
                    <Input id="booth-name" placeholder="Full Name" value={boothData.name} onChange={e => setBoothData({ ...boothData, name: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="booth-business" className="sr-only">Brand Name</label>
                    <Input id="booth-business" placeholder="Brand Name" value={boothData.businessName} onChange={e => setBoothData({ ...boothData, businessName: e.target.value })} />
                  </div>
                </div>
                <div>
                    <label htmlFor="booth-email" className="sr-only">Email Address</label>
                    <Input id="booth-email" type="email" placeholder="Email Address" value={boothData.email} onChange={e => setBoothData({ ...boothData, email: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor="booth-tier" className="sr-only">Preferred Tier</label>
                  <select
                    id="booth-tier"
                    value={boothData.tier}
                    onChange={e => setBoothData({ ...boothData, tier: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md"
                  >
                    <option value="Standard" className="bg-[#193546]">Standard Booth — $250 total ($100 deposit)</option>
                    <option value="Flagship" className="bg-[#193546]">Flagship Booth — $500 total ($100 deposit)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="booth-event" className="sr-only">Which market</label>
                  <input
                    id="booth-event"
                    placeholder="Market / City (e.g. NYC Spring Market)"
                    value={boothData.event}
                    onChange={e => setBoothData({ ...boothData, event: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="booth-referrer" className="sr-only">Referral Code (optional)</label>
                  <input
                    id="booth-referrer"
                    placeholder="Referral Code (optional, e.g. MP-JOHN-G7K)"
                    value={boothData.referrer}
                    onChange={e => setBoothData({ ...boothData, referrer: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="booth-message" className="sr-only">Tell us about your brand</label>
                  <textarea
                    id="booth-message"
                    placeholder="Tell us about your brand (optional)"
                    value={boothData.message}
                    onChange={e => setBoothData({ ...boothData, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 text-sm backdrop-blur-md h-24 resize-none"
                  />
                </div>
                {boothStatus.error && <p className="text-red-400 text-xs font-bold">{boothStatus.error}</p>}
                <button
                  type="submit"
                  disabled={boothStatus.submitting}
                  className="w-full py-4 bg-white/5 border border-white/10 text-white/70 font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {boothStatus.submitting ? 'SENDING...' : 'REQUEST CUSTOM OFFER'}
                </button>
                <button
                  type="button"
                  onClick={handleBoothDeposit}
                  disabled={boothLoading || boothStatus.submitting}
                  className="w-full py-4 bg-[#0DB8D3] text-white font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-[#0bc1dd] transition-all shadow-lg disabled:opacity-50 btn-glow flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4" />
                  {boothLoading ? 'OPENING CHECKOUT...' : 'LOCK MY BOOTH — $100 DEPOSIT'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Value Props */}
      <div className="max-w-7xl w-full grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12">
        <VendorFeature title="Foot Traffic" desc="Direct access to a curated, high-intent local audience." />
        <VendorFeature title="Network Effects" desc="Join a growing community of top-tier creators and brands." />
        <VendorFeature title="Professional Media" desc="High-quality photos and video content for your brand." />
        <VendorFeature title="VIP Access" desc="Guest tickets and cross-promotional opportunities." />
      </div>
    </div>
  );
}

function TierCard({ title, price, desc, features, highlighted = false }) {
  return (
    <div className={`flex flex-col p-8 md:p-10 h-full liquid-glass ${highlighted ? 'border-[#0DB8D3]/40 shadow-[0_0_40px_rgba(13,184,211,0.15)] scale-105 z-10 premium-border' : ''}`}>
      <span className={`text-[10px] font-bold tracking-[0.3em] uppercase mb-4 amount ${highlighted ? 'text-[#0DB8D3]' : 'text-white/40'}`}>{price}</span>
      <h4 className="text-2xl font-black text-white mb-4 tracking-tight title uppercase italic">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 h-20 overflow-hidden description">{desc}</p>
      <div className="flex flex-col gap-3 mt-auto">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 text-[11px] text-white/50 font-medium description">
            <div className={`w-1 h-1 rounded-full ${highlighted ? 'bg-[#0DB8D3]' : 'bg-white/20'}`} />
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

function VendorFeature({ title, desc, highlighted = false }) {
  return (
    <div className={`flex flex-col gap-4 p-6 md:p-10 liquid-glass ${highlighted ? 'border-[#0DB8D3]/30' : ''}`}>
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
      className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" 
    />
  );
}
