import { useEffect, useRef } from 'react'

export default function useLiquidGlass() {
  const rafRef = useRef(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(pointer: fine)')
    if (!mediaQuery.matches) return

    const elements = new Set()

    const observer = new MutationObserver(() => {
      document.querySelectorAll(
        '.liquid-glass, .liquid-glass-deep, .glass-card, .glass-btn, .glass-lens'
      ).forEach(el => elements.add(el))
    })

    observer.observe(document.body, { childList: true, subtree: true, attributes: false })

    document.querySelectorAll(
      '.liquid-glass, .liquid-glass-deep, .glass-card, .glass-btn, .glass-lens'
    ).forEach(el => elements.add(el))

    const handleMouseMove = (e) => {
      rafRef.current = requestAnimationFrame(() => {
        for (const el of elements) {
          const rect = el.getBoundingClientRect()
          if (rect.width === 0 || rect.height === 0) continue
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          el.style.setProperty('--glass-x', `${x}%`)
          el.style.setProperty('--glass-y', `${y}%`)
        }
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])
}
