import { useState, useEffect, useRef } from 'react'

export default function BackgroundCanvas() {
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    const onCanPlay = () => setLoaded(true)
    v.addEventListener('canplay', onCanPlay)
    if (v.readyState >= 3) setLoaded(true)

    return () => v.removeEventListener('canplay', onCanPlay)
  }, [])

  return (
    <div className="fixed inset-0 w-screen h-screen min-h-[100dvh] pointer-events-none z-0 bg-[#193546]">
      {/* Poster image while video loads */}
      <img
        src="/background.jpg"
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`}
      />
      {/* Background video */}
      <video
        ref={videoRef}
        src="/background.mp4"
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-[#193546]/40" />
    </div>
  )
}