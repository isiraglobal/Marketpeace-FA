import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Share2, Check, Copy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Refer() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    platform: 'website',
    payoutMethod: 'paypal',
    type: 'referrer',
  });
  const [status, setStatus] = useState({ submitting: false, success: false, error: null });
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "MARKETPEACE | Refer & Earn";
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, success: false, error: null });
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'registerReferrer', ...formData }),
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus({ submitting: false, success: false, error: data.error || 'Registration failed. Try again.' });
        return;
      }
      setResult(data);
      setStatus({ submitting: false, success: true, error: null });
    } catch (err) {
      setStatus({ submitting: false, success: false, error: err.message || 'Registration failed. Try again.' });
    }
  };

  const copyCode = () => {
    if (!result?.code) return;
    navigator.clipboard.writeText(result.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
          Referral Network
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-tight md:leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Bring People In.<br />Earn <span className="not-italic text-[#1B7FDC]">Cash & Credit.</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          You built the community. Get rewarded when it shows up. Share your code with vendors, venues and
          friends — every one that comes through earns you cash and Marketpeace credit.
        </p>
      </motion.div>

      {/* Reward Tiers */}
      <div className="max-w-6xl w-full flex flex-col items-center mb-12 md:mb-20">
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic mb-8 md:mb-12 text-center">
          How Much You <span className="not-italic text-[#1B7FDC]">Earn</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8 w-full">
          <RewardCard
            icon={<Gift className="w-5 h-5 text-[#0DB8D3]" />}
            label="Vendor Referral"
            value="$50"
            sub="+ $50 Marketpeace credit"
            detail="Refer a vendor who books a booth"
          />
          <RewardCard
            icon={<Gift className="w-5 h-5 text-[#9b59b6]" />}
            label="Venue Referral"
            value="$75"
            sub="+ $75 Marketpeace credit"
            detail="Refer a venue that hosts our market"
            highlighted
          />
          <RewardCard
            icon={<Gift className="w-5 h-5 text-[#00a86b]" />}
            label="Attendee Referral"
            value="$25"
            sub="+ $25 Marketpeace credit"
            detail="Refer friends who grab tickets"
          />
        </div>

        <div className="mt-8 md:mt-12 p-6 md:p-8 liquid-glass w-full max-w-4xl">
          <h3 className="text-white font-black text-lg md:text-xl uppercase italic mb-6 text-center">
            Milestone <span className="not-italic text-[#0DB8D3]">Bonuses</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '3 Vendors', bonus: '+ $50' },
              { label: '5 Vendors', bonus: '+ $100' },
              { label: '10 Vendor Swarm', bonus: '+ $100' },
              { label: '3 Venue Chain', bonus: '+ $75' },
            ].map((m, i) => (
              <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center">
                <p className="text-[#0DB8D3] text-2xl font-black mb-1">{m.bonus}</p>
                <p className="text-white/50 text-[10px] uppercase tracking-[0.2em] font-bold">{m.label}</p>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-[11px] text-center mt-6 font-light">
            Payouts run bi-weekly via Venmo, PayPal or CashApp. Codes look like <span className="text-[#0DB8D3] font-bold">MP-JOHN-G7K</span>.
          </p>
        </div>
      </div>

      {/* Signup Form */}
      <div className="max-w-3xl w-full">
        <div className="liquid-glass p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>

          {status.success && result?.code ? (
            <div className="text-center space-y-6">
              <div className="inline-flex w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 items-center justify-center">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl text-white font-black mb-2 uppercase tracking-tight italic">You're In</h3>
                <p className="text-white/60 text-sm font-medium">
                  {result.existing
                    ? 'Your referral code was found — share it and start earning.'
                    : 'Your referral code has been emailed to you. Start sharing it.'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0f1b24] border border-[#0DB8D3]/40">
                <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black mb-3">Your Code</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-[#0DB8D3] text-3xl md:text-4xl font-black tracking-[0.15em]">{result.code}</span>
                  <button onClick={copyCode} className="p-2 rounded-lg text-white/50 hover:text-[#0DB8D3] transition-colors" aria-label="Copy code">
                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Share2 className="w-4 h-4 text-[#0DB8D3]" />
                  <a href={result.shareLink} className="text-[#0DB8D3] text-sm font-bold truncate max-w-full underline underline-offset-4">
                    {result.shareLink}
                  </a>
                </div>
              </div>

              <Link to="/vendors">
                <button className="w-full py-4 bg-[#0DB8D3] text-white font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-[#0bc1dd] transition-all flex items-center justify-center gap-2 btn-glow">
                  PUT MY CODE TO WORK <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              {copied && <p className="text-green-400 text-xs font-bold">Code copied to clipboard!</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
              <h3 className="text-2xl md:text-3xl text-white font-black mb-2 italic uppercase title">Get Your Code</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ref-name" className="sr-only">Full Name</label>
                  <input id="ref-name" name="name" type="text" required value={formData.name} onChange={handleChange} placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="ref-email" className="sr-only">Email</label>
                  <input id="ref-email" name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email Address"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ref-phone" className="sr-only">Phone (optional)</label>
                  <input id="ref-phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Phone (optional)"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-all placeholder:text-white/20 font-light backdrop-blur-md text-sm" />
                </div>
                <div>
                  <label htmlFor="ref-payout" className="sr-only">Payout Method</label>
                  <select id="ref-payout" name="payoutMethod" value={formData.payoutMethod} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md">
                    <option value="paypal" className="bg-[#193546]">Payout via PayPal</option>
                    <option value="venmo" className="bg-[#193546]">Payout via Venmo</option>
                    <option value="cashapp" className="bg-[#193546]">Payout via CashApp</option>
                    <option value="zelle" className="bg-[#193546]">Payout via Zelle</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="ref-platform" className="sr-only">Where you heard about us</label>
                <select id="ref-platform" name="platform" value={formData.platform} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 outline-none focus:border-[#0DB8D3] transition-all appearance-none text-sm backdrop-blur-md">
                  <option value="website" className="bg-[#193546]">I heard about it on the website</option>
                  <option value="cafe" className="bg-[#193546]">I saw a poster / flyer</option>
                  <option value="word-of-mouth" className="bg-[#193546]">Word of mouth</option>
                  <option value="instagram" className="bg-[#193546]">Instagram or social media</option>
                  <option value="other" className="bg-[#193546]">Somewhere else</option>
                </select>
              </div>

              {status.error && <p className="text-red-400 text-xs font-bold">{status.error}</p>}

              <button type="submit" disabled={status.submitting}
                className="w-full mt-2 py-4 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-[11px] uppercase hover:bg-white/90 transition-all disabled:opacity-50 btn-glow">
                {status.submitting ? 'MINTING YOUR CODE...' : 'GET MY REFERRAL CODE'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function RewardCard({ icon, label, value, sub, detail, highlighted = false }) {
  return (
    <div className={`p-8 liquid-glass flex flex-col ${highlighted ? 'border-[#0DB8D3]/40 scale-105 z-10 premium-border shadow-[0_0_40px_rgba(13,184,211,0.15)]' : ''}`}>
      <div className="flex items-center gap-2 mb-6">{icon}<span className="text-[#0DB8D3] text-[10px] font-black tracking-[0.3em] uppercase">Marketpeace</span></div>
      <p className="text-[#0DB8D3] text-4xl font-black mb-2">{value}</p>
      <h4 className="text-white font-black text-base uppercase italic tracking-tight mb-2">{label}</h4>
      <p className="text-white/40 text-xs font-medium mb-4">{sub}</p>
      <p className="text-white/30 text-[11px] font-light mt-auto leading-relaxed">{detail}</p>
    </div>
  );
}