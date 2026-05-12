/**
 * Sidebar component tests
 * Verifies active-state highlighting when usePathname returns each route.
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

// Stub lucide-react icons used in nav items
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
import { Sidebar } from '../sidebar'

const mockUsePathname = vi.mocked(usePathname)

describe('Sidebar', () => {
  it('(a) highlights "Cotizar" when pathname is /cotizar', () => {
    mockUsePathname.mockReturnValue('/cotizar')
    render(React.createElement(Sidebar))

    const cotizarLink = screen.getByRole('link', { name: /cotizar/i })
    expect(cotizarLink).toHaveAttribute('aria-current', 'page')

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('(b) highlights "Dashboard" only when pathname is exactly /dashboard', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    render(React.createElement(Sidebar))

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveAttribute('aria-current', 'page')

    const cotizarLink = screen.getByRole('link', { name: /cotizar/i })
    expect(cotizarLink).not.toHaveAttribute('aria-current', 'page')
  })

  it('(c) highlights "Cotizaciones" when pathname is /cotizaciones', () => {
    mockUsePathname.mockReturnValue('/cotizaciones')
    render(React.createElement(Sidebar))

    const link = screen.getByRole('link', { name: /cotizaciones/i })
    expect(link).toHaveAttribute('aria-current', 'page')
  })

  it('(d) no link has active state for unknown route /unknown', () => {
    mockUsePathname.mockReturnValue('/unknown')
    render(React.createElement(Sidebar))

    const activeLinks = screen.queryAllByRole('link').filter(
      (el) => el.getAttribute('aria-current') === 'page'
    )
    expect(activeLinks).toHaveLength(0)
  })

  it('(e) sidebar is hidden on mobile via CSS class (hidden md:flex)', () => {
    mockUsePathname.mockReturnValue('/dashboard')
    const { container } = render(React.createElement(Sidebar))

    const aside = container.querySelector('aside')
    expect(aside?.className).toMatch(/hidden/)
    expect(aside?.className).toMatch(/md:flex/)
  })
})
