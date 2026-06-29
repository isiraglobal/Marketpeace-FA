import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Plus, Trash2, LogOut, Save, ShieldCheck } from 'lucide-react';

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    document.title = "MARKETPEACE | Admin Portal";
    const checkAuth = async () => {
      try {
        // GET returns 405 (Method Not Allowed) if auth passes but method is wrong,
        // or 401 if the session cookie is missing/invalid.
        // This works because the server checks auth BEFORE the HTTP method check.
        const response = await fetch('/api/admin/cities');
        if (response.status !== 401) {
          setIsLoggedIn(true);
          const citiesRes = await fetch('/api/cities');
          if (citiesRes.ok) {
            const data = await citiesRes.json();
            if (Array.isArray(data)) setCities(data);
          }
        }
      } catch (err) {
        // Not logged in
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password })
      });
      const data = await response.json();
      if (response.ok) {
        setToken(data.token); // Still keep in memory for header-based API if needed
        setIsLoggedIn(true);
        fetchCities(data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async (authToken = token) => {
    setLoading(true);
    try {
      // Browser will automatically send the httpOnly cookie
      const response = await fetch('/api/cities');
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (err) {
      setError('Failed to fetch cities');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization header is optional now as we have cookies
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ cities })
      });
      if (response.ok) {
        setSuccess('Changes saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save changes');
        if (response.status === 401) handleLogout();
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // We can't clear httpOnly cookie from JS, but we can call a logout API
    fetch('/api/admin/logout', { method: 'POST' }).finally(() => {
      setIsLoggedIn(false);
      setToken('');
      setCities([]);
    });
  };

  const addCity = () => {
    setCities([...cities, { name: '', status: 'Planned', date: 'Expansion' }]);
  };

  const updateCity = (index, field, value) => {
    const updated = [...cities];
    updated[index][field] = value;
    setCities(updated);
  };

  const removeCity = (index) => {
    setCities(cities.filter((_, i) => i !== index));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen pt-40 px-6 flex flex-col items-center justify-center bg-transparent">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full liquid-glass p-8 md:p-12"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#0DB8D3]/20 flex items-center justify-center border border-[#0DB8D3]/50 shadow-[0_0_20px_rgba(13,184,211,0.3)]">
              <ShieldCheck className="w-8 h-8 text-[#0DB8D3]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center mb-8 uppercase tracking-tighter italic">
            Admin <span className="not-italic text-[#1B7FDC]">Login</span>
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Access ID</label>
              <input 
                type="text" 
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-colors"
                placeholder="ID"
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/50 block mb-2">Credentials</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#0DB8D3] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-red-400 text-xs font-bold text-center">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-white text-[#193546] font-black rounded-xl tracking-[0.2em] text-xs uppercase hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enter System'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 sm:pt-40 px-4 sm:px-12 bg-transparent pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic leading-none mb-2">
              System <span className="not-italic text-[#1B7FDC]">Editor</span>
            </h1>
            <p className="text-white/40 text-xs md:text-sm tracking-[0.1em] font-medium uppercase">MarketPeace Global Node Management</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleLogout}
              className="px-6 py-3 border border-white/10 text-white/50 rounded-xl hover:text-white hover:border-white/30 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold"
            >
              <LogOut className="w-4 h-4" /> Exit
            </button>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-[#0DB8D3] text-white rounded-xl hover:bg-[#0DB8D3]/80 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest font-black shadow-[0_10px_20px_rgba(13,184,211,0.3)]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Commit Changes</>}
            </button>
          </div>
        </div>

        <div className="liquid-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/60">Node Name</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/60">Date / Version</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/60">Status</th>
                  <th className="p-6 text-[10px] uppercase tracking-[0.2em] font-black text-white/60 w-20"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {cities.map((city, idx) => (
                    <motion.tr 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <input 
                          value={city.name}
                          onChange={(e) => updateCity(idx, 'name', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#0DB8D3] text-white text-sm font-bold w-full outline-none py-1"
                          placeholder="e.g. London, UK"
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          value={city.date}
                          onChange={(e) => updateCity(idx, 'date', e.target.value)}
                          className="bg-transparent border-b border-transparent focus:border-[#0DB8D3] text-white/60 text-xs font-medium w-full outline-none py-1"
                          placeholder="e.g. Q3 2026"
                        />
                      </td>
                      <td className="p-4">
                        <select 
                          value={city.status}
                          onChange={(e) => updateCity(idx, 'status', e.target.value)}
                          className="bg-transparent text-white/40 text-[10px] uppercase font-bold outline-none cursor-pointer hover:text-white transition-colors"
                        >
                          <option value="Active">Active</option>
                          <option value="Planned">Planned</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => removeCity(idx)}
                          className="p-2 text-white/20 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          <button 
            onClick={addCity}
            className="w-full py-6 flex items-center justify-center gap-2 text-white/30 hover:text-[#0DB8D3] hover:bg-white/5 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Register New Node</span>
          </button>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-[#0DB8D3] text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl z-50 border border-white/20"
          >
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl z-50"
          >
            {error}
          </motion.div>
        )}
      </div>
    </div>
  );
}
