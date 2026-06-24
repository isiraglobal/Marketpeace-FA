import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const FALLBACK_NODES = [
  { name: "New York, NY", status: "Active Node", date: "System 01" },
  { name: "Washington, D.C.", status: "Pending Sync", date: "System 02" },
  { name: "Atlanta, GA", status: "Planned", date: "Expansion" }
];

export default function Cities() {
  const [cityNodes, setCityNodes] = useState(FALLBACK_NODES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "MARKETPEACE | System Expansion";
    const fetchCities = async () => {
      try {
        // SECURITY (MED-5): Fetch through server-side API proxy.
        // The Google Apps Script URL is never exposed to the browser.
        const response = await fetch('/api/cities');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCityNodes(data);
        }
      } catch {
        // Silently fall back to FALLBACK_NODES on error
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
        <span className="text-white bg-[#0077b6] px-4 py-1.5 rounded-full tracking-[0.3em] text-[10px] md:text-xs font-black uppercase mb-8 md:mb-10">
          The Network
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          System <span className="not-italic text-stroke-blue">Expansion</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 mb-6 md:mb-10">
          MARKETPEACE is a growing global node network.
        </p>
      </motion.div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-20">
        {loading ? (
          <div className="col-span-full flex flex-col items-center gap-4 py-20">
            <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Syncing Nodes...</span>
          </div>
        ) : (
          cityNodes.map((city, idx) => (
            <CityNode key={idx} {...city} />
          ))
        )}
      </div>

      <div className="max-w-4xl w-full liquid-glass p-8 md:p-20 text-center relative overflow-hidden">
        <h2 className="text-2xl md:text-5xl font-black mb-6 md:mb-8 tracking-tighter uppercase italic leading-[0.9] title">Node <span className="not-italic text-stroke-blue">Activation</span></h2>
        <p className="text-white/50 text-base md:text-xl font-medium mb-10 md:mb-14 leading-relaxed px-4 description">
          Rollout is strategic. Activating nodes to establish creator independence.
        </p>
        <Link to="/contact">
          <button className="px-10 md:px-12 py-4 md:py-5 bg-white text-[#061530] font-bold rounded-2xl tracking-[0.2em] text-[10px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl hover:-translate-y-1 btn-glow">
            INITIATE REQUEST
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
      <span className="text-[#0077b6] text-[10px] font-bold tracking-[0.2em] uppercase mb-2 block amount">{date}</span>
      <span className="text-white/30 text-[8px] font-bold tracking-[0.2em] uppercase description">{status}</span>
    </div>
  );
}
