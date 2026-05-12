/**
 * LandingHeader component tests
 *
 * Verifies that the landing header renders the Lyrup wordmark
 * and a visible "Ingresar" link pointing to /login.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock next/link — render as plain anchor so href is queryable
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) => React.createElement('a', { href, ...props }, children),
}))

import { LandingHeader } from '../header'

describe('LandingHeader', () => {
  it('(a) renders the Lyrup wordmark', () => {
    render(React.createElement(LandingHeader))
    expect(screen.getByText('Lyrup')).toBeInTheDocument()
  })

  it('(b) renders an "Ingresar" link pointing to /login', () => {
    render(React.createElement(LandingHeader))
    const link = screen.getByRole('link', { name: /ingresar/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/login')
  })

  it('(c) "Ingresar" link has an accessible aria-label', () => {
    render(React.createElement(LandingHeader))
    const link = screen.getByRole('link', { name: /ingresar/i })
    expect(link).toHaveAttribute('aria-label')
  })
})
