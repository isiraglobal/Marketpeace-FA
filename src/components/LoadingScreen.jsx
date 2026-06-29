import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SESSION_KEY = 'marketpeace_intro_played'

export default function LoadingScreen() {
  const [show, setShow] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const played = sessionStorage.getItem(SESSION_KEY)
    if (played) return

    setShow(true)
  }, [])

  const handleEnded = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[1000] bg-black flex items-center justify-center overflow-hidden"
        >
          <video
            ref={videoRef}
            src="/video.mp4"
            autoPlay
            muted
            playsInline
            onEnded={handleEnded}
            className="w-full h-full object-cover"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}