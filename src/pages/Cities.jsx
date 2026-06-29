import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Cities() {
  const [cityNodes, setCityNodes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-5xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-[#0DB8D3] tracking-[0.4em] text-[12px] md:text-xs font-black uppercase mb-4 md:mb-6">
          Coming Soon
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Find a Market <span className="not-italic text-[#1B7FDC]">Near You</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 mb-6 md:mb-10">
          MARKETPEACE is expanding to a city near you. Check back for updates on upcoming events.
        </p>
      </motion.div>

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

      <div className="max-w-4xl w-full liquid-glass p-8 md:p-20 text-center relative overflow-hidden">
          <h2 className="text-2xl md:text-5xl font-black mb-6 md:mb-8 tracking-tighter uppercase italic leading-[0.9] title">Bring Marketpeace <span className="not-italic text-[#1B7FDC]">To Your City</span></h2>
          <p className="text-white/50 text-base md:text-xl font-medium mb-10 md:mb-14 leading-relaxed px-4 description">
            Want us to come to your city? Let us know and we'll consider it for future expansion.
          </p>
        <Link to="/contact">
          <button className="px-10 md:px-12 py-4 md:py-5 bg-white text-[#193546] font-bold rounded-2xl tracking-[0.2em] text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl btn-glow">
            REQUEST YOUR CITY
          </button>
        </Link>
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
