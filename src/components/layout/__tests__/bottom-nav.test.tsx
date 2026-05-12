/**
 * BottomNav component tests
 * Verifies active-state highlighting and mobile-only visibility class.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock next/link — render as plain anchor
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement('a', { href, ...props }, children),
}))

// Stub ALL lucide-react icons used by nav.ts (SIDEBAR_NAV + BOTTOM_NAV share the same module)
vi.mock('lucide-react', () => {
  const stub = ({ 'aria-hidden': ah }: { 'aria-hidden'?: boolean }) =>
    React.createElement('span', { 'aria-hidden': ah, 'data-testid': 'icon' })
  return {
    LayoutDashboard: stub,
    Calculator: stub,
    FileText: stub,
    Printer: stub,
    Box: stub,
    Settings: stub,
  }
})

import { usePathname } from 'next/navigation'
import { BottomNav } from '../bottom-nav'

const mockUsePathname = vi.mocked(usePathname)

describe('BottomNav', () => {
  it('(a) highlights "Historial" tab when pathname is /cotizaciones', () => {
    mockUsePathname.mockReturnValue('/cotizaciones')
    render(React.createElement(BottomNav))

    const historialLink = screen.getByRole('link', { name: /historial/i })
    expect(historialLink).toHaveAttribute('aria-current', 'page')

    const cotizarLink = screen.getByRole('link', { name: /cotizar/i })
    expect(cotizarLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('(b) highlights "Cotizar" tab when pathname is /cotizar', () => {
    mockUsePathname.mockReturnValue('/cotizar')
    render(React.createElement(BottomNav))

    const cotizarLink = screen.getByRole('link', { name: /cotizar/i })
    expect(cotizarLink).toHaveAttribute('aria-current', 'page')
  })

  it('(c) highlights "Configuración" tab when pathname is /configuracion', () => {
    mockUsePathname.mockReturnValue('/configuracion')
    render(React.createElement(BottomNav))

    const configLink = screen.getByRole('link', { name: /configuración/i })
    expect(configLink).toHaveAttribute('aria-current', 'page')
  })

  it('(d) nav is hidden on desktop via CSS class (md:hidden)', () => {
    mockUsePathname.mockReturnValue('/cotizar')
    const { container } = render(React.createElement(BottomNav))

    const nav = container.querySelector('nav')
    expect(nav?.className).toMatch(/md:hidden/)
  })

  it('(e) renders exactly 4 tabs', () => {
    mockUsePathname.mockReturnValue('/cotizar')
    render(React.createElement(BottomNav))

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(4)
  })
})
