/**
 * hooks/use-is-mobile.ts
 * Detects if the current viewport is mobile-sized.
 */

'use client'

import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    mq.addEventListener('change', (e) => setIsMobile(e.matches))
    return () => mq.removeEventListener('change', (e) => setIsMobile(e.matches))
  }, [breakpoint])

  return isMobile
}
