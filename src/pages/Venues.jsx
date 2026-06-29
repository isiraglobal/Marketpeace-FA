import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Users, ParkingCircle, Wifi, Building2 } from 'lucide-react';
import { submitForm } from '../utils/stripeCheckout';

const VENUE_LABELS = {
  timestamp: 'Submitted',
  status: 'Status',
  venueName: 'Venue Name',
  contactName: 'Contact',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  city: 'City',
  capacity: 'Capacity',
  hasParking: 'Parking',
  hasWiFi: 'WiFi',
  indoorOutdoor: 'Type',
  notes: 'Notes',
  contractURL: 'Contract',
  eventDate: 'Event Date',
  lastUpdated: 'Last Updated',
};

function VenueModal({ venue, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const fields = [
    { label: 'Venue Name', value: venue.venueName, icon: Building2 },
    { label: 'Status', value: venue.status, icon: null },
    { label: 'Location', value: `${venue.location}${venue.city ? `, ${venue.city}` : ''}`, icon: MapPin },
    { label: 'Event Date', value: venue.eventDate || 'TBD', icon: Calendar },
    { label: 'Capacity', value: venue.capacity ? `${venue.capacity} guests` : 'N/A', icon: Users },
    { label: 'Parking', value: venue.hasParking || 'N/A', icon: ParkingCircle },
    { label: 'WiFi', value: venue.hasWiFi || 'N/A', icon: Wifi },
    { label: 'Type', value: venue.indoorOutdoor || 'N/A', icon: null },
    { label: 'Contact', value: venue.contactName || 'N/A', icon: null },
    { label: 'Email', value: venue.email || 'N/A', icon: null },
    { label: 'Phone', value: venue.phone || 'N/A', icon: null },
    { label: 'Notes', value: venue.notes || 'None', icon: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="liquid-glass max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 md:p-10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all">
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight title">{venue.venueName}</h2>
          {venue.eventDate && (
            <span className="text-[#1B7FDC] text-sm font-bold tracking-widest uppercase">{venue.eventDate}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((f, i) => (
            <div key={i} className={`${!f.value || f.value === 'N/A' || f.value === 'None' ? 'opacity-40' : ''} flex flex-col gap-1 p-3 rounded-xl bg-white/[0.03]`}>
              <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{f.label}</span>
              <div className="flex items-center gap-2">
                {f.icon && <f.icon className="w-3.5 h-3.5 text-[#0DB8D3] shrink-0" />}
                <span className="text-white text-sm font-medium">{f.value}</span>
              </div>
            </div>
          ))}
        </div>

        {venue.notes && venue.notes !== 'None' && (
          <div className="mt-4 p-4 rounded-xl bg-white/[0.03]">
            <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest block mb-2">Notes</span>
            <p className="text-white/70 text-sm leading-relaxed">{venue.notes}</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function VenueCard({ venue, onClick }) {
  const statusColor = {
    'Approved': 'text-green-400 border-green-400/30 bg-green-400/10',
    'Active': 'text-[#1B7FDC] border-[#1B7FDC]/30 bg-[#1B7FDC]/10',
    'In Review': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
    'Completed': 'text-white/40 border-white/10 bg-white/5',
    'Declined': 'text-red-400 border-red-400/30 bg-red-400/10',
  }[venue.status] || 'text-white/40 border-white/10 bg-white/5';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="liquid-glass p-5 md:p-6 cursor-pointer group hover:border-[#0DB8D3]/40 transition-all flex flex-col gap-3"
      onClick={() => onClick(venue)}
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-white font-black text-base md:text-lg uppercase italic tracking-tight title leading-tight">{venue.venueName}</h3>
        <span className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusColor}`}>{venue.status}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/50 text-[11px] font-medium">
        {venue.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#0DB8D3]" />
            {venue.location}{venue.city ? `, ${venue.city}` : ''}
          </span>
        )}
        {venue.eventDate && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-[#0DB8D3]" />
            {venue.eventDate}
          </span>
        )}
        {venue.capacity && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-[#0DB8D3]" />
            {venue.capacity}
          </span>
        )}
      </div>
      {venue.notes && (
        <p className="text-white/30 text-[10px] leading-relaxed line-clamp-2">{venue.notes}</p>
      )}
    </motion.div>
  );
}

export default function Venues() {
  const [formData, setFormData] = useState({ venueName: '', name: '', email: '', phone: '', location: '', capacity: '', notes: '' });
  const [formStatus, setFormStatus] = useState({ submitting: false, success: false });
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);

  const fetchVenues = useCallback(async () => {
    try {
      const res = await fetch('/api/venues');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setVenues(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "MARKETPEACE | Venue Partnerships";
    fetchVenues();
    const interval = setInterval(fetchVenues, 30000);
    return () => clearInterval(interval);
  }, [fetchVenues]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus({ submitting: true, success: false });
    try {
      await submitForm({ ...formData, type: 'Venue' });
      setFormStatus({ submitting: false, success: true });
      setFormData({ venueName: '', name: '', email: '', phone: '', location: '', capacity: '', notes: '' });
    } catch (err) {
      setFormStatus({ submitting: false, success: false, error: err.message });
    }
  };

  const upcomingVenues = venues.filter(v =>
    v.eventDate && (v.status === 'Approved' || v.status === 'Active')
  ).sort((a, b) => {
    if (a.eventDate < b.eventDate) return -1;
    if (a.eventDate > b.eventDate) return 1;
    return 0;
  });

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-12 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="max-w-5xl w-full flex flex-col items-center text-center mb-12 md:mb-20"
      >
        <span className="text-white bg-[#0DB8D3] px-4 py-1.5 rounded-full tracking-[0.3em] text-[12px] md:text-xs font-black uppercase mb-8 md:mb-10 shadow-[0_0_20px_rgba(13,184,211,0.4)]">
          Venue Partnerships
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-7xl font-black tracking-tighter mb-8 md:mb-10 text-white leading-[0.95] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase italic">
          Host an Event,<br/><span className="not-italic text-[#1B7FDC]">Get Filled</span>
        </h1>
        <p className="text-white/80 text-sm sm:text-lg md:text-xl leading-relaxed max-w-3xl font-medium px-4 drop-shadow-md mb-6 md:mb-10">
          Partner with MARKETPEACE and we'll fill your space with 150+ engaged shoppers. You get the foot traffic, we handle the rest.
        </p>
      </motion.div>

      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-12 md:mb-20 items-start">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <FeatureItem title="New Foot Traffic" desc="150-300+ intentional patrons discover your space." />
            <FeatureItem title="Professional Content" desc="Free high-fidelity media assets and social amplify." />
            <FeatureItem title="Recurring Revenue" desc="Consistent, hands-off income monthly." />
            <FeatureItem title="Full Insurance" desc="$1M liability policy for every event." />
          </div>
        </div>

        <div className="lg:col-span-5 liquid-glass p-6 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0DB8D3]/20 rounded-full blur-[80px] pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tight uppercase italic text-white title">Partner With Us</h3>
          <p className="text-white/50 text-sm mb-8 md:mb-10 font-medium leading-relaxed description">Let's discuss how we can work together.</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-5">
            <div>
              <label htmlFor="venue-name" className="sr-only">Venue Name</label>
              <input id="venue-name" type="text" placeholder="Venue Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] text-sm" value={formData.venueName} onChange={e => setFormData({...formData, venueName: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="venue-contact" className="sr-only">Contact Name</label>
                <input id="venue-contact" type="text" placeholder="Contact Name" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label htmlFor="venue-email" className="sr-only">Email</label>
                <input id="venue-email" type="email" placeholder="Email" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label htmlFor="venue-location" className="sr-only">Location</label>
              <input id="venue-location" type="text" placeholder="Location (City/Address)" required className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] text-sm" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label htmlFor="venue-notes" className="sr-only">Tell us about your space</label>
              <textarea id="venue-notes" placeholder="Tell us about your space..." className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-white outline-none focus:border-[#0DB8D3] h-32 text-sm" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
            </div>
            <button type="submit" disabled={formStatus.submitting} className="w-full mt-4 md:mt-6 py-3 sm:py-4 md:py-5 bg-white text-[#193546] font-bold rounded-xl sm:rounded-2xl tracking-[0.1em] md:tracking-[0.2em] text-[12px] sm:text-[12px] md:text-xs uppercase hover:bg-white/90 transition-all shadow-xl disabled:opacity-50 btn-glow">
              {formStatus.submitting ? 'SENDING...' : 'REQUEST PARTNERSHIP'}
            </button>
            {formStatus.success && <p className="text-green-400 text-center mt-4 text-xs">Application sent! We'll be in touch.</p>}
            {formStatus.error && <p className="text-red-400 text-center mt-4 text-xs">{formStatus.error}</p>}
          </form>
        </div>
      </div>

      {/* VENUE LISTINGS */}
      <div className="max-w-7xl w-full">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="h-px flex-1 bg-white/5" />
          <h2 className="text-white text-sm md:text-lg font-black tracking-[0.3em] uppercase italic text-center opacity-80 shrink-0">Partner Venues</h2>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-white/20 text-xs tracking-[0.3em] uppercase">Loading venues...</span>
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm tracking-widest uppercase">No venues listed yet. Be the first partner!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {venues.map((v, i) => (
              <VenueCard key={i} venue={v} onClick={setSelectedVenue} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedVenue && (
          <VenueModal venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FeatureItem({ title, desc }) {
  return (
    <div className="liquid-glass p-6 md:p-8 flex flex-col gap-4 hover:border-white/20 transition-all">
      <div>
        <h4 className="text-white font-black text-base md:text-lg mb-1 md:mb-2 tracking-tight italic uppercase title">{title}</h4>
        <p className="text-white/50 text-xs md:text-sm leading-relaxed font-medium description">{desc}</p>
      </div>
    </div>
  );
}
