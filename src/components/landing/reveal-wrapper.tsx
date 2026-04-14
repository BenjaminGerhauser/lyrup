'use client'

import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface RevealWrapperProps {
  children: React.ReactNode
  className?: string
  threshold?: number
  rootMargin?: string
}

export function RevealWrapper({ children, className, threshold, rootMargin }: RevealWrapperProps) {
  const ref = useScrollReveal({ threshold, rootMargin })

  return (
    <div ref={ref} className={`reveal ${className ?? ''}`}>
      {children}
    </div>
  )
}
