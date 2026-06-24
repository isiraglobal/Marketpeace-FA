import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { MapPin, Users, Zap, Ticket, Camera, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchCheckoutSession } from '../utils/stripeCheckout';

const letters = [
  { char: 'm', src: '/assets/letters/M.png' },
  { char: 'a', src: '/assets/letters/A.png' },
  { char: 'r', src: '/assets/letters/R.png' },
  { char: 'k', src: '/assets/letters/K.png' },
  { char: 'e', src: '/assets/letters/E.png' },
  { char: 't', src: '/assets/letters/T.png' },
  { char: 'p', src: '/assets/letters/P.png' },
  { char: 'e', src: '/assets/letters/E.png' },
  { char: 'a', src: '/assets/letters/A.png' },
  { char: 'c', src: '/assets/letters/C.png' },
  { char: 'e', src: '/assets/letters/E.png' },
];


export default function Home() {
  const [cityNodes, setCityNodes] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    document.title = "MARKETPEACE | Infrastructure of Independence";

    const mq = window.matchMedia('(max-width: 768px), (pointer: coarse)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);

    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setCityNodes(data);
        }
      } catch (err) {
        console.error("Node sync failed:", err);
      }
    };
    fetchCities();

    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleQuickCheckout = async ({ type, tier }) => {
    setCheckoutError(null);
    setCheckoutLoading(true);

    try {
      const { url } = await fetchCheckoutSession({ type, tier });
      window.location.href = url;
    } catch (error) {
      setCheckoutError(error.message || 'Unable to open checkout.');
      setCheckoutLoading(false);
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  const yText = useTransform(scrollYProgress, [0, 0.15, 0.25], ['0px', '0px', '100px']);
  const opacityText = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 1, 0]);
  const scaleText = useTransform(scrollYProgress, [0, 0.15, 0.25], [1, 1, 0.8]);

  const ySection1 = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], ['100vh', '0vh', '0vh', '-100vh']);
  const opacitySection1 = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], [0, 1, 1, 0]);
  const scaleSection1 = useTransform(scrollYProgress, [0.15, 0.25, 0.35, 0.45], [0.8, 1, 1, 0.9]);

  const ySection2 = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], ['100vh', '0vh', '0vh', '-100vh']);
  const opacitySection2 = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], [0, 1, 1, 0]);
  const scaleSection2 = useTransform(scrollYProgress, [0.4, 0.5, 0.6, 0.7], [0.8, 1, 1, 0.9]);

  const ySection3 = useTransform(scrollYProgress, [0.65, 0.75, 0.9, 1.0], ['100vh', '0vh', '0vh', '0vh']);
  const opacitySection3 = useTransform(scrollYProgress, [0.65, 0.75, 0.9], [0, 1, 1]);
  const scaleSection3 = useTransform(scrollYProgress, [0.65, 0.75], [0.8, 1]);

  if (isMobile) {
    return <MobileHome cityNodes={cityNodes} />;
  }

  return (
    <div className="w-full bg-[#061530]">
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: '600vh' }}
      >

        <div className="h-20 md:h-28 w-full"></div>

        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-visible">

          {/* HERO */}
          <motion.div
            className="content-frame absolute inset-0 z-10"
            style={{ opacity: opacityText, scale: scaleText, y: yText }}
          >
            <div className="flex flex-col items-center justify-center px-4 max-w-7xl w-full my-auto">
              <motion.div
                className="flex flex-nowrap items-center justify-center mb-6 md:mb-12 w-full"
              >
                {letters.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, z: -1000, scale: 3, filter: 'blur(30px)' }}
                    animate={{ opacity: 1, z: 0, scale: 1, filter: 'blur(0px)' }}
                    transition={{
                      duration: 2.5,
                      ease: [0.16, 1, 0.3, 1],
                      delay: 0.8 + i * 0.06
                    }}
                    className="relative w-[8vw] sm:w-[7vw] max-w-[65px] h-[10vw] sm:h-[11vw] max-h-[90px] flex items-center justify-center z-20 will-change-transform m-[-0.3vw] perspective-[1000px]"
                    style={{ zIndex: letters.length - i }}
                  >
                    <motion.img
                      src={l.src}
                      alt={l.char}
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                    />
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 1.5 }}
                className="mb-8 md:mb-12"
              >
                <span className="text-[8px] sm:text-[10px] tracking-[0.4em] text-[#0077b6] font-black uppercase bg-[#0077b6]/10 px-4 py-2 rounded-full border border-[#0077b6]/20">The Infrastructure of Independence</span>
              </motion.div>
              
              <h2 className="text-white text-sm sm:text-lg md:text-2xl lg:text-3xl lg:whitespace-nowrap tracking-[0.25em] font-black mb-8 md:mb-10 text-center uppercase italic leading-relaxed max-w-[90vw] sm:max-w-[80vw] lg:max-w-none">
                "We found <span className="text-[#0077b6] not-italic">peace</span>, by having a <span className="text-white border-b-2 border-[#0077b6] not-italic">piece</span> of the market."
              </h2>
              
              <p className="text-white/60 text-[10px] sm:text-xs md:text-sm lg:text-base tracking-[0.15em] font-medium max-w-2xl mb-10 md:mb-16 text-center uppercase leading-relaxed">
                The vendor-event marketplace connecting small businesses, cool venues, and the communities that love them.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-8">
                <Link to="/vendors">
                  <button className="flex items-center justify-center gap-3 bg-white text-[#061530] px-6 py-4 sm:px-10 sm:py-5 rounded-xl text-[10px] sm:text-[11px] font-black tracking-[0.2em] hover:bg-white/90 transition-all shadow-2xl hover:-translate-y-1 uppercase btn-glow">
                    Apply as Vendor
                  </button>
                </Link>
                <Link to="/venues">
                  <button className="flex items-center justify-center gap-3 liquid-glass text-white px-6 py-4 sm:px-10 sm:py-5 rounded-xl text-[10px] sm:text-[11px] font-black tracking-[0.2em] hover:bg-black/60 transition-all shadow-xl hover:-translate-y-1 uppercase">
                    Partner Your Venue
                  </button>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 sm:mb-12">
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleQuickCheckout({ type: 'Vendor', tier: 'Standard' })}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0077b6] text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-[#0090e0] disabled:opacity-50"
                >
                  {checkoutLoading ? 'Opening checkout...' : 'Pay Standard Booth $250'}
                </button>
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleQuickCheckout({ type: 'Vendor', tier: 'Flagship' })}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-[#061530] font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/90 disabled:opacity-50"
                >
                  {checkoutLoading ? 'Opening checkout...' : 'Pay Flagship Booth $500'}
                </button>
                <button
                  type="button"
                  disabled={checkoutLoading}
                  onClick={() => handleQuickCheckout({ type: 'Attendee', tier: 'Regular' })}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-white/15 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:border-white/40 hover:bg-white/5 disabled:opacity-50"
                >
                  {checkoutLoading ? 'Opening checkout...' : 'Pay Event Entry $5'}
                </button>
              </div>

              {checkoutError && (
                <p className="text-red-400 text-xs mb-4 text-center max-w-xl">{checkoutError}</p>
              )}

              <div className="flex items-center gap-6 sm:gap-10 md:gap-16 py-8 md:py-12 border-t border-white/5 w-full justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$250</span>
                  <span className="text-white/30 text-[7px] md:text-[9px] tracking-[0.2em] uppercase font-bold">Standard Booth</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$500</span>
                  <span className="text-white/30 text-[7px] md:text-[9px] tracking-[0.2em] uppercase font-bold">Flagship Booth</span>
                </div>
                <div className="w-[1px] h-6 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$5</span>
                  <span className="text-white/30 text-[7px] md:text-[9px] tracking-[0.2em] uppercase font-bold">Door Entry</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* SECTION 1 */}
          <motion.div
            style={{ y: ySection1, scale: scaleSection1, opacity: opacitySection1 }}
            className="content-frame absolute inset-0 z-20"
          >
            <div className="max-w-6xl w-full flex flex-col items-center text-center">
              <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] md:text-[9px] font-black uppercase mb-6 md:mb-14 shadow-lg">About Marketpeace</span>
              <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-12 italic uppercase leading-[0.95]">Who can be a vendor? <span className="not-italic text-stroke-blue">Anyone</span> can be a vendor.</h2>
              <p className="text-white/60 text-[11px] sm:text-base md:text-lg lg:text-xl font-medium mb-8 md:mb-16 max-w-3xl leading-relaxed">
                Marketpeace is a platform that connects four pillars of the local economy into one thriving marketplace.
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 text-left w-full">
                <PillarCard title="Vendors" desc="Sell your products to a hungry local crowd." icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-[#0077b6]" />} />
                <PillarCard title="Venues" desc="Turn your space into a destination." icon={<MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#0077b6]" />} />
                <PillarCard title="Attendees" desc="Discover brands and experiences near you." icon={<Users className="w-4 h-4 md:w-5 md:h-5 text-[#0077b6]" />} />
                <PillarCard title="Partners" desc="Grow with the marketplace ecosystem." icon={<Ticket className="w-4 h-4 md:w-5 md:h-5 text-[#0077b6]" />} />
              </div>
            </div>
          </motion.div>

          {/* SECTION 2 */}
          <motion.div
            style={{ y: ySection2, scale: scaleSection2, opacity: opacitySection2 }}
            className="content-frame absolute inset-0 z-20"
          >
            <div className="max-w-6xl w-full flex flex-col items-center">
              <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] md:text-[9px] font-black uppercase mb-6 md:mb-14 shadow-lg">How it Works</span>
              <h3 className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-white mb-8 md:mb-20 tracking-tighter text-center italic uppercase leading-[0.95]">From application to <span className="not-italic text-stroke-blue">profit</span> in 3 steps</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10 w-full">
                <JourneyStep number="01" title="Apply" desc="Tell us about your brand or venue." />
                <JourneyStep number="02" title="Selected" desc="Get picked for a matching vibe." />
                <JourneyStep number="03" title="Promoted" desc="We handle marketing, you handle business." />
              </div>
              <p className="mt-8 md:mt-16 text-[#0077b6] font-black tracking-[0.3em] uppercase text-[9px] md:text-xs animate-pulse">Bonus: Profit & Repeat.</p>
            </div>
          </motion.div>

          {/* SECTION 3 */}
          <motion.div
            style={{ y: ySection3, scale: scaleSection3, opacity: opacitySection3 }}
            className="content-frame absolute inset-0 z-20"
          >
            <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 md:gap-20 items-center lg:items-start justify-center">
              <div className="w-full lg:w-[50%]">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] font-black uppercase inline-block shadow-lg">Vendor Application</span>
                  <span className="text-[#0077b6] bg-[#0077b6]/10 px-3 py-1 rounded-full tracking-[0.2em] text-[8px] font-black uppercase inline-block border border-[#0077b6]/20 animate-pulse">Limited Slots Remaining</span>
                </div>
                <h3 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-8 tracking-tighter uppercase italic leading-[0.95]">Your booth. Your crowd. <span className="not-italic text-stroke-blue">Your commission.</span></h3>
                <p className="text-white/60 text-[10px] sm:text-base md:text-lg leading-relaxed font-medium mb-6 md:mb-12 max-w-2xl">
                  Choose the tier that fits your growth strategy. Every vendor gets access to our premium infrastructure. <span className="text-white">Secure your position today.</span>
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-8">
                  <Link to="/vendors" className="block group">
                    <div className="liquid-glass flex flex-col h-full p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] group-hover:border-white/40 transition-all cursor-pointer">
                      <div className="flex flex-col gap-1 mb-6 md:mb-8">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-sm md:text-xl tracking-tight italic uppercase title">Standard</h5>
                          <span className="text-white font-black italic amount text-lg md:text-2xl">$250</span>
                        </div>
                        <span className="text-white/40 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">Core Infrastructure</span>
                      </div>
                      <ul className="text-white/60 text-[10px] md:text-[12px] font-medium space-y-3 md:space-y-4 mt-auto">
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /> <span className="leading-tight">8x6 Space + 6ft Table & 2 Chairs</span></li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /> <span className="leading-tight">Standard Floor Placement</span></li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /> <span className="leading-tight">General Social Mention</span></li>
                      </ul>
                    </div>
                  </Link>
                  <Link to="/vendors" className="block group">
                    <div className="liquid-glass flex flex-col h-full p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-[#0077b6]/40 group-hover:border-[#0077b6]/80 transition-all relative cursor-pointer bg-[#0077b6]/5 shadow-[0_0_30px_rgba(0,119,182,0.15)] group-hover:shadow-[0_0_40px_rgba(0,119,182,0.3)]">
                      <div className="absolute -top-3 right-6 bg-[#0077b6] text-white text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest btn-glow shadow-lg">Most Popular</div>
                      <div className="flex flex-col gap-1 mb-6 md:mb-8">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-sm md:text-xl tracking-tight italic uppercase title text-[#0077b6]">Flagship</h5>
                          <span className="text-white font-black italic amount text-lg md:text-2xl">$500</span>
                        </div>
                        <span className="text-[#0077b6]/70 text-[8px] md:text-[10px] uppercase font-bold tracking-widest">Maximum Visibility</span>
                      </div>
                      <ul className="text-white/60 text-[10px] md:text-[12px] font-medium space-y-3 md:space-y-4 mt-auto">
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0 shadow-[0_0_10px_rgba(0,119,182,1)]" /> <span className="leading-tight text-white">Prime Corner Placement</span></li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /> <span className="leading-tight">Featured Brand Promotion</span></li>
                        <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /> <span className="leading-tight">Professional Content Pack</span></li>
                      </ul>
                    </div>
                  </Link>
                </div>

                <div className="pt-6 border-t border-white/10 hidden sm:block">
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-[#0077b6]" />
                      <span className="text-white/50 text-[9px] md:text-[10px] uppercase font-black tracking-widest">Marketing Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-[#0077b6]" />
                      <span className="text-white/50 text-[9px] md:text-[10px] uppercase font-black tracking-widest">Data Ownership</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Camera className="w-3 h-3 text-[#0077b6]" />
                      <span className="text-white/50 text-[9px] md:text-[10px] uppercase font-black tracking-widest">Pro Photography</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-[40%] flex justify-center lg:justify-end">
                <div className="liquid-glass p-6 md:p-12 shadow-2xl hover:scale-[1.01] transition-all duration-500 relative overflow-hidden group w-full max-w-md border-[#0077b6]/20">
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0690d4]/10 rounded-full blur-[100px] pointer-events-none"></div>
                  <h4 className="text-xl md:text-3xl text-white font-black mb-2 md:mb-4 tracking-tighter uppercase italic">Secure Your <span className="not-italic text-stroke-blue">Piece</span></h4>
                  <p className="text-white/50 mb-6 md:mb-8 font-medium leading-relaxed text-[11px] md:text-base">Applications reviewed within 48h. Deposit locks your spot in the rollout.</p>
                  <Link to="/vendors" className="block w-full">
                    <button className="w-full py-4 md:py-5 bg-white text-[#061530] font-black rounded-xl tracking-[0.2em] text-[9px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-lg active:scale-95 btn-glow">
                      SECURE YOUR SPOT
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <HomeSections cityNodes={cityNodes} />
    </div>
  );
}

function MobileHome({ cityNodes }) {
  return (
    <div className="w-full bg-[#061530]">
      <div className="h-20 md:h-28 w-full"></div>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="flex flex-nowrap items-center justify-center mb-6 w-full max-w-lg mx-auto">
          {letters.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 3, filter: 'blur(30px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 + i * 0.06 }}
              className="relative w-[8vw] max-w-[55px] h-[10vw] max-h-[80px] flex items-center justify-center m-[-0.3vw]"
            >
              <img src={l.src} alt={l.char} loading="lazy" className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
            </motion.div>
          ))}
        </div>
        <span className="text-[8px] tracking-[0.4em] text-[#0077b6] font-black uppercase bg-[#0077b6]/10 px-4 py-2 rounded-full border border-[#0077b6]/20 mb-6">The Infrastructure of Independence</span>
        <h2 className="text-white text-sm tracking-[0.25em] font-black mb-6 text-center uppercase italic leading-relaxed max-w-[90vw]">
          "We found <span className="text-[#0077b6] not-italic">peace</span>, by having a <span className="text-white border-b-2 border-[#0077b6] not-italic">piece</span> of the market."
        </h2>
        <p className="text-white/60 text-[10px] tracking-[0.15em] font-medium max-w-2xl mb-8 text-center uppercase leading-relaxed">
          The vendor-event marketplace connecting small businesses, cool venues, and the communities that love them.
        </p>
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <Link to="/vendors" className="w-full">
            <button className="w-full py-4 bg-white text-[#061530] rounded-xl text-[10px] font-black tracking-[0.2em] hover:bg-white/90 transition-all shadow-2xl uppercase btn-glow">Apply as Vendor</button>
          </Link>
          <Link to="/venues" className="w-full">
            <button className="w-full py-4 liquid-glass text-white rounded-xl text-[10px] font-black tracking-[0.2em] transition-all uppercase">Partner Your Venue</button>
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="flex flex-col items-center px-4 py-10">
        <div className="max-w-6xl w-full flex flex-col items-center text-center">
          <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] font-black uppercase mb-4 shadow-lg">About Marketpeace</span>
          <h2 className="text-2xl font-black tracking-tighter mb-4 italic uppercase leading-[0.95]">Who can be a vendor? <span className="not-italic text-stroke-blue">Anyone</span> can be a vendor.</h2>
          <p className="text-white/60 text-[11px] font-medium mb-6 max-w-3xl leading-relaxed">
            Marketpeace is a platform that connects four pillars of the local economy into one thriving marketplace.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left w-full">
            <PillarCard title="Vendors" desc="Makers and innovators." icon={<Zap className="w-4 h-4 text-[#0077b6]" />} />
            <PillarCard title="Venues" desc="Unique local spaces." icon={<MapPin className="w-4 h-4 text-[#0077b6]" />} />
            <PillarCard title="Attendees" desc="Curated experiences." icon={<Users className="w-4 h-4 text-[#0077b6]" />} />
            <PillarCard title="Partners" desc="Grow the network." icon={<Ticket className="w-4 h-4 text-[#0077b6]" />} />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="flex flex-col items-center px-4 py-10">
        <div className="max-w-6xl w-full flex flex-col items-center">
          <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] font-black uppercase mb-4 shadow-lg">How it Works</span>
          <h3 className="text-2xl font-black text-white mb-6 tracking-tighter text-center italic uppercase leading-[0.95]">From application to <span className="not-italic text-stroke-blue">profit</span> in 3 steps</h3>
          <div className="grid grid-cols-1 gap-4 w-full">
            <JourneyStep number="01" title="Apply" desc="Tell us about your brand or venue." />
            <JourneyStep number="02" title="Selected" desc="Get picked for a matching vibe." />
            <JourneyStep number="03" title="Promoted" desc="We handle marketing, you handle business." />
          </div>
          <p className="mt-8 text-[#0077b6] font-black tracking-[0.3em] uppercase text-[9px] animate-pulse">Bonus: Profit & Repeat.</p>
        </div>
      </section>

      {/* Application */}
      <section className="flex flex-col items-center px-4 py-10">
        <div className="max-w-7xl w-full flex flex-col gap-6 items-center">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.3em] text-[8px] font-black uppercase shadow-lg">Vendor Application</span>
              <span className="text-[#0077b6] bg-[#0077b6]/10 px-3 py-1 rounded-full tracking-[0.2em] text-[8px] font-black uppercase border border-[#0077b6]/20 animate-pulse">Limited Slots</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase italic leading-[0.95]">Your booth. Your crowd. <span className="not-italic text-stroke-blue">Your commission.</span></h3>
            <p className="text-white/60 text-[10px] leading-relaxed font-medium mb-6 max-w-2xl">
              Choose the tier that fits your growth strategy. Every vendor gets access to our premium infrastructure.
            </p>
            <div className="grid grid-cols-1 gap-4 mb-8">
              <Link to="/vendors" className="block group">
                <div className="liquid-glass flex flex-col p-6 rounded-[1.5rem] group-hover:border-white/40 transition-all">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-black text-sm tracking-tight italic uppercase title">Standard</h5>
                    <span className="text-white font-black italic amount text-lg">$250</span>
                  </div>
                  <span className="text-white/40 text-[8px] uppercase font-bold tracking-widest mb-4">Core Infrastructure</span>
                  <ul className="text-white/60 text-[10px] font-medium space-y-3">
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight">8x6 Space + 6ft Table & 2 Chairs</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight">Standard Floor Placement</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight">General Social Mention</span></li>
                  </ul>
                </div>
              </Link>
              <Link to="/vendors" className="block group">
                <div className="liquid-glass flex flex-col p-6 rounded-[1.5rem] border-[#0077b6]/40 group-hover:border-[#0077b6]/80 transition-all relative bg-[#0077b6]/5">
                  <div className="absolute -top-3 right-4 bg-[#0077b6] text-white text-[7px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg">Most Popular</div>
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-black text-sm tracking-tight italic uppercase title text-[#0077b6]">Flagship</h5>
                    <span className="text-white font-black italic amount text-lg">$500</span>
                  </div>
                  <span className="text-[#0077b6]/70 text-[8px] uppercase font-bold tracking-widest mb-4">Maximum Visibility</span>
                  <ul className="text-white/60 text-[10px] font-medium space-y-3">
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight text-white">Prime Corner Placement</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight">Featured Brand Promotion</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0077b6] rounded-sm shrink-0" /><span className="leading-tight">Professional Content Pack</span></li>
                  </ul>
                </div>
              </Link>
            </div>
          </div>
          <div className="w-full liquid-glass p-6 shadow-2xl relative overflow-hidden border-[#0077b6]/20">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0690d4]/10 rounded-full blur-[100px] pointer-events-none"></div>
            <h4 className="text-xl text-white font-black mb-2 tracking-tighter uppercase italic">Secure Your <span className="not-italic text-stroke-blue">Piece</span></h4>
            <p className="text-white/50 mb-6 font-medium leading-relaxed text-[11px]">Applications reviewed within 48h. Deposit locks your spot in the rollout.</p>
            <Link to="/vendors" className="block w-full">
              <button className="w-full py-4 bg-white text-[#061530] font-black rounded-xl tracking-[0.2em] text-[9px] uppercase hover:bg-white/90 transition-all shadow-lg btn-glow">SECURE YOUR SPOT</button>
            </Link>
          </div>
        </div>
      </section>

      {/* Rest of the sections - referral, gallery, etc. */}
      <HomeSections cityNodes={cityNodes} />
    </div>
  );
}

function HomeSections({ cityNodes }) {
  return (
    <>
      <section id="referral" className="max-w-4xl w-full mx-auto flex flex-col items-center py-10 md:py-16 px-4 md:px-6 scroll-mt-24">
        <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.4em] text-[8px] font-black uppercase mb-4 md:mb-6">The Referral Network</span>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-8 tracking-tighter uppercase italic leading-[0.9] text-center">Get paid for being <span className="not-italic text-stroke-blue whitespace-nowrap">part of the market.</span></h3>
        <p className="text-white/60 text-sm md:text-base leading-relaxed font-medium mb-8 md:mb-12 text-center max-w-2xl">Our referral program is simple: everyone wins. Vendors, venues, and enthusiasts can participate.</p>
        <div className="w-full space-y-3">
          <RewardTier tier="Tier 1" action="Refer 1 Approved Vendor" reward="$50 Cash/Credit" />
          <RewardTier tier="Tier 2" action="Refer 1 Approved Venue" reward="$75 Cash/Credit" />
          <RewardTier tier="Tier 3" action="Refer 3 Approved Vendors" reward="$200 Cash/Credit" />
          <RewardTier tier="Tier 4" action="Refer 3 Approved Venues" reward="$300 Cash/Credit" />
          <RewardTier tier="Tier 5" action="Ticket Cluster (10+ Buyers)" reward="$25 per Cluster" />
        </div>
        <Link to="/contact" className="mt-8 md:mt-12 w-full md:w-auto">
          <button className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-xl text-[10px] font-black tracking-[0.2em] uppercase hover:bg-white/5 transition-all w-full">Join the Network</button>
        </Link>
      </section>

      <section className="w-full py-10 md:py-16 px-4 md:px-6 relative overflow-hidden bg-white/[0.01]">
        <div className="max-w-7xl w-full mx-auto">
          <h3 className="text-lg md:text-xl font-black text-white mb-6 md:mb-12 tracking-[0.3em] uppercase italic text-center opacity-80">The Scene</h3>
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            <GalleryItem image="/assets/AI Images/249AFEB9-A174-40FA-9898-3266EAA2A6F2.png" caption="High-fidelity creator deployment in progress." />
            <GalleryItem image="/assets/AI Images/39ACA358-0EAF-4903-A46D-B7326B9B4B87.png" caption="Strategic node activation at rooftop venue." />
            <GalleryItem image="/assets/AI Images/F26D62C4-2E3A-42EA-9398-9255E9B7BDE6.png" caption="Community sync during sunset rollout." />
          </div>
        </div>
      </section>

      <section className="w-full py-10 md:py-16 px-4 md:px-6 bg-white/[0.02] relative overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
          <span className="text-white bg-[#0077b6] px-3 py-1 rounded-full tracking-[0.4em] text-[8px] font-black uppercase mb-4 md:mb-6 shadow-lg">Event Visualizer</span>
          <h3 className="text-2xl md:text-3xl font-black text-white mb-8 md:mb-12 tracking-tighter text-center italic uppercase leading-[0.9]">Experience the <span className="not-italic text-stroke-blue">Atmosphere.</span></h3>
          <div className="w-full aspect-video liquid-glass rounded-[2rem] flex items-center justify-center relative group overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <img src="/assets/AI Images/2D60E085-B17B-4507-8464-CC6772033B2E.PNG" loading="lazy" className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-1000" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center border border-white/20 mb-6 cursor-pointer hover:scale-110 transition-transform shadow-xl">
                <Play className="w-6 h-6 text-white ml-1 fill-current" />
              </div>
              <h4 className="text-white text-lg font-black tracking-widest uppercase italic">Launch Simulation</h4>
              <p className="text-white/40 text-[8px] tracking-widest uppercase font-bold mt-2">Foreign Affairs Market Protocol v2.4</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full flex flex-col items-center py-10 md:py-16 border-y border-white/5 bg-white/[0.01]">
        <h3 className="text-lg md:text-xl font-black text-white mb-6 md:mb-12 tracking-[0.3em] uppercase text-center italic opacity-80">Global Rollout</h3>
        <div className="w-full overflow-hidden border-y border-white/5 py-8 liquid-glass">
          <motion.div
            className="flex whitespace-nowrap gap-10 items-center"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-10 items-center">
                {cityNodes.length > 0 ? (
                  cityNodes.map((city, idx) => (
                    <Card key={`${i}-${idx}`} title={city.name} subtitle={`${city.status} ${city.date}`} />
                  ))
                ) : (
                  <>
                    <Card title="New York, NY" subtitle="Active Node 01" />
                    <Card title="Washington, D.C." subtitle="Active Node 02" />
                    <Card title="Atlanta, GA" subtitle="Active Node 03" />
                    <Card title="Miami, FL" subtitle="Planned Node" />
                    <Card title="Los Angeles, CA" subtitle="Planned Node" />
                    <Card title="Chicago, IL" subtitle="Expansion" />
                  </>
                )}
              </div>
            ))}
          </motion.div>
        </div>
        <p className="text-white/30 text-[8px] tracking-[0.3em] font-black uppercase mb-6 mt-6">Coming soon to a city near you.</p>
        <Link to="/cities">
          <button className="px-8 py-4 liquid-glass hover:bg-white/15 text-white rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-xl">VIEW ALL CITIES</button>
        </Link>
      </section>

      <section className="w-full py-10 md:py-16 px-4 md:px-6 bg-[#0077b6]/5">
        <div className="max-w-4xl w-full mx-auto liquid-glass p-6 md:p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0077b6]/10 blur-[100px] -mr-24 -mt-24"></div>
          <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic leading-[0.95]">Ready for <span className="not-italic text-[#0077b6]">Rollout?</span></h3>
          <p className="text-white/50 text-base font-medium mb-8 leading-relaxed">Submit your inquiry and initiate the synchronization process.</p>
          <Link to="/contact">
            <button className="py-4 px-10 bg-white text-[#061530] font-black rounded-xl tracking-[0.3em] uppercase hover:bg-[#0077b6] hover:text-white transition-all text-[10px] btn-glow">Go to Contact Page</button>
          </Link>
        </div>
      </section>

      <section className="w-full px-4 md:px-6 flex flex-col items-center pb-10 md:pb-16 relative overflow-hidden">
        <div className="max-w-5xl w-full flex flex-col gap-10 md:gap-16">
          <div className="text-center flex flex-col items-center">
            <span className="text-[#0077b6] text-[10px] font-black tracking-[0.4em] uppercase mb-4 md:mb-6">Our Purpose</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 md:mb-8 text-white italic uppercase leading-[0.9]">The MARKETPEACE <span className="not-italic text-stroke-blue">Ethos</span></h2>
            <p className="text-white/60 font-medium text-sm md:text-base leading-relaxed max-w-3xl">
              We observed a fundamental flaw in the creator economy: maximum output, minimum ownership. MARKETPEACE was built to provide the strategic infrastructure for independence.
            </p>
          </div>
          <div className="liquid-glass p-6 md:p-8 shadow-2xl w-full relative overflow-hidden">
            <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-12 text-center uppercase tracking-[0.3em] text-white opacity-80 italic">FAQ</h3>
            <div className="grid grid-cols-1 gap-8 text-left">
              <FAQItem q="Strategic Position?" a="Your dedicated environment within the node rollout." />
              <FAQItem q="Early Bird?" a="Secure activation with a $100 deposit." />
              <FAQItem q="Refund Schedule?" a="Full system refunds up to 7 days prior to rollout." />
              <FAQItem q="Assets Provided?" a="Yes. Core infrastructure: tables, signage, and staff support." />
              <FAQItem q="Data Management?" a="Creators maintain 100% sovereignty over their patron data." />
              <FAQItem q="System Entry?" a="Submit credentials via portal. Approval typically within 48h." />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function EventCard({ date, title, theme, location }) {
  return (
    <div className="liquid-glass p-8 rounded-[2.5rem] flex flex-col gap-4 group hover:border-[#0077b6]/50 transition-all">
      <span className="text-[#0077b6] text-sm font-black italic tracking-widest">{date}</span>
      <h4 className="text-2xl font-black text-white uppercase italic tracking-tight">{title}</h4>
      <div className="flex flex-col gap-1">
        <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">{theme}</span>
        <span className="text-white/60 text-xs font-medium">{location}</span>
      </div>
      <button className="mt-4 w-full py-3 liquid-glass hover:bg-white/10 transition-all">
        Notify Me
      </button>
    </div>
  );
}

function PillarCard({ title, desc, icon }) {
  return (
    <div className="flex flex-col gap-2 md:gap-6 p-4 md:p-8 liquid-glass group hover:bg-black/50 transition-all">
      <div className="w-8 h-8 md:w-12 md:h-12 bg-[#0077b6]/20 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm md:text-xl font-black mb-1 md:mb-2 text-white tracking-tight uppercase italic title">{title}</h4>
        <p className="text-white/50 font-medium text-[9px] md:text-sm leading-tight md:leading-relaxed description">{desc}</p>
      </div>
    </div>
  );
}

function RewardTier({ tier, action, reward }) {
  return (
    <div className="flex items-center justify-between p-4 liquid-glass">
      <div className="flex flex-col">
        <span className="text-white text-[10px] font-black uppercase tracking-widest title">{tier}</span>
        <span className="text-white/50 text-[10px] md:text-xs font-medium uppercase description">{action}</span>
      </div>
      <span className="text-white font-black italic text-xs amount">{reward}</span>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="flex flex-col p-8 md:p-10 liquid-glass hover:border-[#0077b6]/40 transition-all group">
      <span className="text-[#0077b6] text-4xl font-black italic mb-6 group-hover:scale-110 transition-transform inline-block">{number}</span>
      <h4 className="text-white font-black text-xl mb-4 tracking-tight uppercase italic title">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed description">{desc}</p>
    </div>
  );
}

function VenueProp({ title, desc }) {
  return (
    <div className="flex flex-col gap-4 p-8 liquid-glass group hover:border-[#0077b6]/50 transition-all">
      <h4 className="text-lg font-black text-white uppercase italic title">{title}</h4>
      <p className="text-white/40 text-xs md:text-sm font-medium leading-relaxed description">{desc}</p>
    </div>
  );
}

function FAQItem({ q, a }) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-lg md:text-xl font-black text-white tracking-tight italic uppercase">{q}</h4>
      <p className="text-white/50 font-medium text-sm md:text-base leading-relaxed text-left">{a}</p>
    </div>
  );
}

function JourneyStep({ number, title, desc }) {
  return (
    <div className="flex flex-col gap-3 md:gap-6 p-4 md:p-10 liquid-glass group hover:bg-black/50 transition-all">
      <span className="text-2xl md:text-5xl font-black text-[#0077b6]/20 group-hover:text-[#0077b6]/40 transition-colors italic">{number}</span>
      <div>
        <h4 className="text-lg md:text-2xl font-black mb-1 md:mb-3 text-white tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 font-medium text-[10px] md:text-base leading-tight md:leading-relaxed description">{desc}</p>
      </div>
    </div>
  );
}

function GalleryItem({ image, caption }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl md:rounded-[2rem] border border-white/10 h-48 md:h-64">
      <img src={image} alt={caption} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4 md:p-6">
        <p className="text-white/80 text-[9px] md:text-xs font-black tracking-widest uppercase italic">{caption}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle }) {
  return (
    <div className="liquid-glass px-5 py-3 md:px-6 md:py-4 flex flex-col items-center text-center justify-center gap-1 w-[85vw] sm:w-[260px] md:w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
      <h3 className="text-white font-black text-[11px] md:text-[13px] tracking-wide mb-0.5 uppercase italic title">{title}</h3>
      <p className="text-white/50 text-[9px] md:text-[11px] tracking-widest uppercase font-bold description">{subtitle}</p>
    </div>
  );
}
