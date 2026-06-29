import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, Zap, Ticket, Calendar, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const [venueNodes, setVenueNodes] = useState([]);

  useEffect(() => {
    document.title = "MARKETPEACE | Infrastructure of Independence";

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

    const fetchVenues = async () => {
      try {
        const response = await fetch('/api/venues');
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) setVenueNodes(data);
        }
      } catch {
        // silent
      }
    };

    fetchCities();
    fetchVenues();
  }, []);

  return (
    <div className="w-full bg-transparent">
      <div className="h-2 md:h-6 w-full"></div>

      {/* HERO */}
      <section className="w-full flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="flex flex-col items-center justify-center max-w-7xl w-full">
          <motion.div className="flex flex-nowrap items-center justify-center mb-6 md:mb-12 w-full">
            {letters.map((l, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, z: -1000, scale: 3, filter: 'blur(30px)' }}
                animate={{ opacity: 1, z: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1], delay: 0.8 + i * 0.06 }}
                className="relative w-[11vw] sm:w-[9vw] max-w-[95px] h-[13vw] sm:h-[14vw] max-h-[120px] flex items-center justify-center z-20 will-change-transform m-[-0.3vw] perspective-[1000px]"
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
            <span className="liquid-text-bg text-[10px] sm:text-[10px] tracking-[0.4em] text-[#0DB8D3] font-black uppercase">The Infrastructure of Independence</span>
          </motion.div>

          <h2 className="text-white text-sm sm:text-lg md:text-2xl lg:text-3xl lg:whitespace-nowrap tracking-[0.25em] font-black mb-8 md:mb-10 text-center uppercase italic leading-relaxed max-w-[90vw] sm:max-w-[80vw] lg:max-w-none">
            "We found <span className="text-[#0DB8D3] not-italic">peace</span>, by having a <span className="text-white border-b-2 border-[#0DB8D3] not-italic">piece</span> of the market."
          </h2>

          <p className="text-white/60 text-[10px] sm:text-xs md:text-sm lg:text-base tracking-[0.15em] font-medium max-w-2xl mb-10 md:mb-16 text-center uppercase leading-relaxed">
            The vendor-event marketplace connecting small businesses, cool venues, and the communities that love them.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-8">
            <Link to="/vendors">
              <button className="flex items-center justify-center gap-3 bg-white text-[#193546] px-6 py-4 sm:px-10 sm:py-5 rounded-xl text-[12px] sm:text-[12px] font-black tracking-[0.2em] hover:bg-white/90 transition-all shadow-2xl uppercase btn-glow">
                Apply as Vendor
              </button>
            </Link>
            <Link to="/venues">
              <button className="flex items-center justify-center gap-3 liquid-glass text-white px-6 py-4 sm:px-10 sm:py-5 rounded-xl text-[12px] sm:text-[12px] font-black tracking-[0.2em] hover:bg-black/60 transition-all shadow-xl uppercase">
                Partner Your Venue
              </button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 sm:mb-12">
            <Link to="/vendors" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#0DB8D3] text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-[#1B7FDC]">
                Sign Up as Vendor
              </button>
            </Link>
            <Link to="/attendees" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white text-[#193546] font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:bg-white/90">
                Register as Attendee
              </button>
            </Link>
            <Link to="/venues" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-white/15 text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:border-white/40 hover:bg-white/5">
                Partner Your Venue
              </button>
            </Link>
          </div>


          <div className="flex items-center gap-6 sm:gap-10 md:gap-16 py-8 md:py-12 border-t border-white/5 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$250</span>
              <span className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-bold">Standard</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$500</span>
              <span className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-bold">Flagship</span>
            </div>
            <div className="w-[1px] h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-white font-black text-lg md:text-2xl tracking-tighter italic amount">$5</span>
              <span className="text-white/30 text-[11px] tracking-[0.2em] uppercase font-bold">Door Entry</span>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="w-full flex flex-col items-center px-4 py-16 md:py-24">
        <div className="max-w-6xl w-full flex flex-col items-center text-center">
          <span className="liquid-text-bg text-white tracking-[0.3em] text-[10px] md:text-[12px] font-black uppercase mb-6 md:mb-14">About Marketpeace</span>
          <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 md:mb-12 italic uppercase leading-[0.95]">Who can be a vendor? <span className="not-italic text-[#1B7FDC]">Anyone</span> can be a vendor.</h2>
          <p className="text-white/60 text-[11px] sm:text-base md:text-lg lg:text-xl font-medium mb-8 md:mb-16 max-w-3xl leading-relaxed">
            Marketpeace is a platform that connects four pillars of the local economy into one thriving marketplace.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 text-left w-full">
            <PillarCard title="Vendors" desc="Sell your products to a hungry local crowd." icon={<Zap className="w-4 h-4 md:w-5 md:h-5 text-[#0DB8D3]" />} />
            <PillarCard title="Venues" desc="Turn your space into a destination." icon={<MapPin className="w-4 h-4 md:w-5 md:h-5 text-[#0DB8D3]" />} />
            <PillarCard title="Attendees" desc="Discover brands and experiences near you." icon={<Users className="w-4 h-4 md:w-5 md:h-5 text-[#0DB8D3]" />} />
            <PillarCard title="Partners" desc="Grow with the marketplace ecosystem." icon={<Ticket className="w-4 h-4 md:w-5 md:h-5 text-[#0DB8D3]" />} />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full flex flex-col items-center px-4 py-16 md:py-24">
        <div className="max-w-6xl w-full flex flex-col items-center">
          <span className="liquid-text-bg text-white tracking-[0.3em] text-[10px] md:text-[12px] font-black uppercase mb-6 md:mb-14">How it Works</span>
          <h3 className="text-2xl sm:text-4xl md:text-6xl lg:text-8xl font-black text-white mb-8 md:mb-20 tracking-tighter text-center italic uppercase leading-[0.95]">From application to <span className="not-italic text-[#1B7FDC]">profit</span> in 3 steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-10 w-full">
            <JourneyStep number="01" title="Apply" desc="Tell us about your brand or venue." />
            <JourneyStep number="02" title="Selected" desc="Get picked for a matching vibe." />
            <JourneyStep number="03" title="Promoted" desc="We handle marketing, you handle business." />
          </div>
          <p className="mt-8 md:mt-16 text-[#0DB8D3] font-black tracking-[0.3em] uppercase text-[11px] md:text-xs animate-pulse">Bonus: Profit & Repeat.</p>
        </div>
      </section>

      {/* VENDOR APPLICATION */}
      <section className="w-full flex flex-col items-center px-4 py-16 md:py-24">
        <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-8 md:gap-20 items-center lg:items-start justify-center">
          <div className="w-full lg:w-[50%]">
            <div className="flex items-center gap-3 mb-4">
              <span className="liquid-text-bg text-white tracking-[0.3em] text-[10px] font-black uppercase inline-block mb-4">Vendor Application</span>
              <span className="text-[#0DB8D3] bg-[#0DB8D3]/10 px-3 py-1 rounded-full tracking-[0.2em] text-[10px] font-black uppercase inline-block border border-[#0DB8D3]/20 animate-pulse">Limited Slots Remaining</span>
            </div>
            <h3 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 md:mb-8 tracking-tighter uppercase italic leading-[0.95]">Your booth. Your crowd. <span className="not-italic text-[#1B7FDC]">Your commission.</span></h3>
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
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Core Infrastructure</span>
                  </div>
                  <ul className="text-white/60 text-[10px] md:text-[12px] font-medium space-y-3 md:space-y-4 mt-auto">
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0" /> <span className="leading-tight">8x6 Space + 6ft Table & 2 Chairs</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0" /> <span className="leading-tight">Standard Floor Placement</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0" /> <span className="leading-tight">General Social Mention</span></li>
                  </ul>
                </div>
              </Link>
              <Link to="/vendors" className="block group">
                <div className="liquid-glass !overflow-visible flex flex-col h-full p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border-[#0DB8D3]/40 group-hover:border-[#0DB8D3]/80 transition-all relative cursor-pointer bg-[#0DB8D3]/5 shadow-[0_0_30px_rgba(13,184,211,0.15)] group-hover:shadow-[0_0_40px_rgba(13,184,211,0.3)]">
                  <div className="absolute -top-3 right-6 bg-[#0DB8D3] text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest btn-glow shadow-lg">Most Popular</div>
                  <div className="flex flex-col gap-1 mb-6 md:mb-8">
                    <div className="flex justify-between items-center">
                      <h5 className="font-black text-sm md:text-xl tracking-tight italic uppercase title text-[#0DB8D3]">Flagship</h5>
                      <span className="text-white font-black italic amount text-lg md:text-2xl">$500</span>
                    </div>
                    <span className="text-[#0DB8D3]/70 text-[10px] uppercase font-bold tracking-widest">Maximum Visibility</span>
                  </div>
                  <ul className="text-white/60 text-[10px] md:text-[12px] font-medium space-y-3 md:space-y-4 mt-auto">
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0 shadow-[0_0_10px_rgba(13,184,211,1)]" /> <span className="leading-tight text-white">Prime Corner Placement</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0" /> <span className="leading-tight">Featured Brand Promotion</span></li>
                    <li className="flex items-start gap-3"><div className="w-1.5 h-1.5 mt-1.5 bg-[#0DB8D3] rounded-sm shrink-0" /> <span className="leading-tight">Professional Content Pack</span></li>
                  </ul>
                </div>
              </Link>
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-[#0DB8D3]" />
                  <span className="text-white/50 text-[11px] uppercase font-black tracking-widest">Marketing Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-[#0DB8D3]" />
                  <span className="text-white/50 text-[11px] uppercase font-black tracking-widest">Data Ownership</span>
                </div>
                <div className="flex items-center gap-2">
                  <Camera className="w-3 h-3 text-[#0DB8D3]" />
                  <span className="text-white/50 text-[11px] uppercase font-black tracking-widest">Pro Photography</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[40%] flex justify-center lg:justify-end">
            <div className="liquid-glass p-6 md:p-12 shadow-2xl transition-all duration-500 relative overflow-hidden group w-full max-w-md border-[#0DB8D3]/20">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0DB8D3]/10 rounded-full blur-[100px] pointer-events-none"></div>
              <h4 className="text-xl md:text-3xl text-white font-black mb-2 md:mb-4 tracking-tighter uppercase italic">Secure Your <span className="not-italic text-[#1B7FDC]">Piece</span></h4>
              <p className="text-white/50 mb-6 md:mb-8 font-medium leading-relaxed text-[11px] md:text-base">Applications reviewed within 48h. Deposit locks your spot in the rollout.</p>
              <Link to="/vendors" className="block w-full">
                <button className="w-full py-4 md:py-5 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-[11px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-lg active:scale-95 btn-glow">
                  SECURE YOUR SPOT
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomeSections cityNodes={cityNodes} venueNodes={venueNodes} />
    </div>
  );
}


function HomeSections({ cityNodes, venueNodes }) {
  return (
    <>
      <section id="referral" className="max-w-4xl w-full mx-auto flex flex-col items-center py-10 md:py-16 px-4 md:px-6 scroll-mt-24">
        <span className="text-white bg-[#0DB8D3] px-3 py-1 rounded-full tracking-[0.4em] text-[10px] font-black uppercase mb-4 md:mb-6">The Referral Network</span>
        <h3 className="text-2xl md:text-3xl font-black text-white mb-4 md:mb-8 tracking-tighter uppercase italic leading-[0.9] text-center">Get paid for being <span className="not-italic text-[#1B7FDC] whitespace-nowrap">part of the market.</span></h3>
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

      {/* UPCOMING EVENTS */}
      {venueNodes.length > 0 && (
        <section className="w-full py-10 md:py-16 px-4 md:px-6">
          <div className="max-w-7xl w-full mx-auto">
            <div className="flex items-center gap-4 mb-8 md:mb-12">
              <div className="h-px flex-1 bg-white/5" />
              <h2 className="text-white text-sm md:text-lg font-black tracking-[0.3em] uppercase italic text-center opacity-80 shrink-0">Upcoming Events</h2>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {venueNodes
                .filter(v => v.eventDate && (v.status === 'Approved' || v.status === 'Active'))
                .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
                .slice(0, 6)
                .map((v, i) => (
                  <Link key={i} to="/venues" className="block group">
                    <div className="liquid-glass p-5 md:p-6 group-hover:border-[#0DB8D3]/40 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-[#1B7FDC]" />
                        <span className="text-[#1B7FDC] text-[10px] font-black uppercase tracking-widest">{v.eventDate}</span>
                      </div>
                      <h3 className="text-white font-black text-base md:text-lg uppercase italic tracking-tight title mb-1">{v.venueName}</h3>
                      {v.location && (
                        <p className="text-white/50 text-[11px] font-medium flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-[#0DB8D3]" />
                          {v.location}{v.city ? `, ${v.city}` : ''}
                        </p>
                      )}
                      <span className="inline-block mt-3 text-[#0DB8D3] text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">View Details →</span>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* CITIES TICKER */}
      <section className="w-full flex flex-col items-center py-10 md:py-16 border-y border-white/5 bg-white/[0.01]">
        <h3 className="text-lg md:text-xl font-black text-white mb-6 md:mb-12 tracking-[0.3em] uppercase text-center italic opacity-80">Coming to a City Near You</h3>
        {cityNodes.length > 0 && (
          <div className="w-full overflow-hidden border-y border-white/5 py-8 liquid-glass">
            <motion.div
              className="flex whitespace-nowrap gap-10 items-center"
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-10 items-center">
                  {cityNodes.map((city, idx) => (
                    <Card key={`${i}-${idx}`} title={city.name} subtitle={`${city.status} ${city.date}`} />
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        )}
        <p className="text-white/30 text-[10px] tracking-[0.3em] font-black uppercase mb-6 mt-6">More cities coming soon.</p>
        <Link to="/cities">
          <button className="px-8 py-4 liquid-glass hover:bg-white/15 text-white rounded-xl text-[10px] font-black tracking-[0.2em] uppercase transition-all shadow-xl">VIEW ALL CITIES</button>
        </Link>
      </section>

      {/* CTA */}
      <section className="w-full py-10 md:py-16 px-4 md:px-6 bg-[#0DB8D3]/5">
        <div className="max-w-4xl w-full mx-auto liquid-glass p-6 md:p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0DB8D3]/10 blur-[100px] -mr-24 -mt-24"></div>
          <h3 className="text-3xl font-black text-white mb-6 tracking-tighter uppercase italic leading-[0.95]">Ready to <span className="not-italic text-[#1B7FDC]">Join?</span></h3>
          <p className="text-white/50 text-base font-medium mb-8 leading-relaxed">Get in touch with our team to learn more.</p>
          <Link to="/contact">
            <button className="py-4 px-10 bg-white text-[#193546] font-black rounded-xl tracking-[0.3em] uppercase hover:bg-[#0DB8D3] hover:text-white transition-all text-[10px] btn-glow">Go to Contact Page</button>
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full px-4 md:px-6 flex flex-col items-center pb-10 md:pb-16 relative overflow-hidden">
        <div className="max-w-5xl w-full flex flex-col gap-10 md:gap-16">
          <div className="text-center flex flex-col items-center">
            <span className="text-[#0DB8D3] text-[10px] font-black tracking-[0.4em] uppercase mb-4 md:mb-6">Our Purpose</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tighter mb-4 md:mb-8 text-white italic uppercase leading-[0.9]">The MARKETPEACE <span className="not-italic text-[#1B7FDC]">Ethos</span></h2>
            <p className="text-white/60 font-medium text-sm md:text-base leading-relaxed max-w-3xl">
              MARKETPEACE connects local vendors, venues, and communities into thriving marketplace events. We believe in supporting small businesses and building community through curated market experiences.
            </p>
          </div>
          <div className="liquid-glass p-6 md:p-8 shadow-2xl w-full relative overflow-hidden">
            <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-12 text-center uppercase tracking-[0.3em] text-white opacity-80 italic">FAQ</h3>
            <div className="grid grid-cols-1 gap-8 text-left">
              <FAQItem q="How do I apply as a vendor?" a="Head to our Vendors page and fill out the application form. Our team reviews applications within 48 hours." />
              <FAQItem q="How much does it cost to vend?" a="Standard booths start at $250 and Flagship booths at $500. Pricing includes table, chairs, and marketing support." />
              <FAQItem q="Can I attend as a shopper?" a="Yes! Event entry is $5. Sign up on our Attendees page to get notified about upcoming markets." />
              <FAQItem q="How do I partner my venue?" a="If you have a space that would work well for a market event, reach out via our Venues page and we'll discuss partnership options." />
              <FAQItem q="What is the referral program?" a="Refer approved vendors or venues and earn cash rewards. Check our referral tiers on this page for details." />
              <FAQItem q="How long does approval take?" a="Most applications are reviewed within 48 hours. You'll be notified via email once your status is updated." />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PillarCard({ title, desc, icon }) {
  return (
    <div className="flex flex-col gap-2 md:gap-6 p-4 md:p-8 liquid-glass group hover:bg-black/50 transition-all">
      <div className="w-8 h-8 md:w-12 md:h-12 bg-[#0DB8D3]/20 rounded-xl md:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm md:text-xl font-black mb-1 md:mb-2 text-white tracking-tight uppercase italic title">{title}</h4>
        <p className="text-white/50 font-medium text-[11px] md:text-sm leading-tight md:leading-relaxed description">{desc}</p>
      </div>
    </div>
  );
}

function RewardTier({ tier, action, reward }) {
  return (
    <div className="flex items-center justify-between p-4 liquid-glass">
      <div className="flex flex-col">
        <span className="text-white text-[10px] font-black uppercase tracking-widest title">{tier}</span>
        <span className="text-white/50 text-[12px] md:text-xs font-medium uppercase description">{action}</span>
      </div>
      <span className="text-white font-black italic text-xs amount">{reward}</span>
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
      <span className="text-2xl md:text-5xl font-black text-[#0DB8D3]/20 group-hover:text-[#0DB8D3]/40 transition-colors italic">{number}</span>
      <div>
        <h4 className="text-lg md:text-2xl font-black mb-1 md:mb-3 text-white tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 font-medium text-[10px] md:text-base leading-tight md:leading-relaxed description">{desc}</p>
      </div>
    </div>
  );
}

function Card({ title, subtitle }) {
  return (
    <div className="liquid-glass px-5 py-3 md:px-6 md:py-4 flex flex-col items-center text-center justify-center gap-1 w-[85vw] sm:w-[260px] md:w-[280px] shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
      <h3 className="text-white font-black text-[11px] md:text-[13px] tracking-wide mb-0.5 uppercase italic title">{title}</h3>
      <p className="text-white/50 text-[11px] md:text-[11px] tracking-widest uppercase font-bold description">{subtitle}</p>
    </div>
  );
}
