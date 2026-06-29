import { useEffect, useRef } from 'react'

export default function useLiquidGlass() {
  const rafRef = useRef(null)

  useEffect(() => {
    // Only run on desktops or devices with fine pointers
    const mediaQuery = window.matchMedia('(pointer: fine)')
    if (!mediaQuery.matches) return

    const elementStates = new Map()

    const initElement = (el) => {
      if (elementStates.has(el)) return
      elementStates.set(el, {
        targetX: 50,
        targetY: 50,
        currentX: 50,
        currentY: 50,
        vx: 0,
        vy: 0,
        hovered: false
      })

      const handleMouseEnter = () => {
        const state = elementStates.get(el)
        if (state) state.hovered = true
      }

      const handleMouseLeave = () => {
        const state = elementStates.get(el)
        if (state) {
          state.hovered = false
          state.targetX = 50
          state.targetY = 50
        }
      }

      const handleMouseMove = (e) => {
        const state = elementStates.get(el)
        if (!state || !state.hovered) return
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        state.targetX = ((e.clientX - rect.left) / rect.width) * 100
        state.targetY = ((e.clientY - rect.top) / rect.height) * 100
      }

      el.addEventListener('mouseenter', handleMouseEnter, { passive: true })
      el.addEventListener('mouseleave', handleMouseLeave, { passive: true })
      el.addEventListener('mousemove', handleMouseMove, { passive: true })

      elementStates.get(el).cleanup = () => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
        el.removeEventListener('mousemove', handleMouseMove)
      }
    }

    const observer = new MutationObserver(() => {
      document.querySelectorAll(
        '.liquid-glass, .liquid-glass-deep, .glass-card, .glass-btn, .glass-lens, .liquid-text-bg'
      ).forEach(el => initElement(el))
    })

    observer.observe(document.body, { childList: true, subtree: true })

    document.querySelectorAll(
      '.liquid-glass, .liquid-glass-deep, .glass-card, .glass-btn, .glass-lens, .liquid-text-bg'
    ).forEach(el => initElement(el))

    // Physics constants
    const spring = 0.08
    const damping = 0.82

    const updatePhysics = () => {
      const isEnabled = !document.body.classList.contains('liquid-physics-disabled')

      for (const [el, state] of elementStates.entries()) {
        // Cleanup if detached
        if (!document.body.contains(el)) {
          if (state.cleanup) state.cleanup()
          elementStates.delete(el)
          continue
        }

        if (isEnabled) {
          // Spring integration
          const ax = (state.targetX - state.currentX) * spring
          const ay = (state.targetY - state.currentY) * spring
          state.vx = (state.vx + ax) * damping
          state.vy = (state.vy + ay) * damping
          state.currentX += state.vx
          state.currentY += state.vy

          el.style.setProperty('--glass-x', `${state.currentX}%`)
          el.style.setProperty('--glass-y', `${state.currentY}%`)
        } else {
          // Revert to center/defaults if disabled
          state.currentX = 50
          state.currentY = 50
          state.vx = 0
          state.vy = 0
          el.style.removeProperty('--glass-x')
          el.style.removeProperty('--glass-y')
        }
      }
      rafRef.current = requestAnimationFrame(updatePhysics)
    }

    rafRef.current = requestAnimationFrame(updatePhysics)

    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      for (const [el, state] of elementStates.entries()) {
        if (state.cleanup) state.cleanup()
      }
      elementStates.clear()
    }
  }, [])
}
