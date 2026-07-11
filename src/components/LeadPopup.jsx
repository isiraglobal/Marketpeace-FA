import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { submitForm } from '../utils/stripeCheckout'

export default function LeadPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' })
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const dismissed = localStorage.getItem('leadPopupDismissed')
    if (!dismissed) {
      const timer = setTimeout(() => setIsOpen(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')
    try {
      await submitForm({
        type: 'Visitor',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: 'LeadPopup',
        page: window.location.pathname,
      })
      setStatus('success')
      localStorage.setItem('leadPopupDismissed', 'true')
      setTimeout(() => setIsOpen(false), 2500)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
    }
  }

  const handleDismiss = () => {
    setIsOpen(false)
    localStorage.setItem('leadPopupDismissed', 'true')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl p-6 md:p-8 liquid-glass"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {status === 'success' ? (
              <div className="text-center py-8">
                <p className="text-white text-lg font-semibold tracking-wider">Thank You!</p>
                <p className="text-white/60 text-sm mt-2">You're on the list. We'll be in touch.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl md:text-2xl font-black tracking-wider text-white text-center mb-1">
                  Stay Connected
                </h3>
                <p className="text-white/50 text-xs md:text-sm text-center tracking-wide mb-6">
                  Join the MARKETPEACE community. No spam, ever.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#0DB8D3] focus:ring-1 focus:ring-[#0DB8D3] transition-all"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#0DB8D3] focus:ring-1 focus:ring-[#0DB8D3] transition-all"
                  />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#0DB8D3] focus:ring-1 focus:ring-[#0DB8D3] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full py-3 rounded-xl bg-[#0DB8D3] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#0bc1dd] hover:shadow-[0_0_20px_rgba(13,184,211,0.4)] transition-all mt-2 disabled:opacity-60"
                  >
                    {status === 'submitting' ? 'Submitting…' : 'Submit'}
                  </button>
                </form>

                {status === 'error' && (
                  <p className="text-red-400 text-xs text-center mt-3">{errorMsg}</p>
                )}

                <p className="text-white/30 text-[10px] text-center mt-4">
                  By submitting, you agree to our{' '}
                  <a href="/privacy" className="underline hover:text-white/60">Privacy Policy</a>.
                </p>
                <p className="text-white/20 text-[10px] text-center mt-1">
                  No thanks? Just close this window — your visit is welcome either way.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
