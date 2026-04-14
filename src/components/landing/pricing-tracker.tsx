'use client'

import { useEffect, useRef } from 'react'

export function PricingTracker() {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !tracked.current) {
          tracked.current = true
          window.umami?.track('pricing_view')
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    const section = document.getElementById('precios')
    if (section) observer.observe(section)

    return () => observer.disconnect()
  }, [])

  return null
}
