'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SIDEBAR_NAV } from '@/lib/constants/nav'

/**
 * Collapsible sidebar navigation — visible on desktop (md+), hidden on mobile.
 * Active link is highlighted via usePathname comparison.
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'hidden md:flex md:flex-col',
        'w-60 shrink-0 border-r border-border bg-sidebar',
        'min-h-screen sticky top-0 h-screen overflow-y-auto'
      )}
      aria-label="Navegación principal"
    >
      {/* Wordmark */}
      <div className="flex h-14 items-center px-5 border-b border-border">
        <span className="font-heading text-lg font-bold text-primary tracking-tight">
          Lyrup
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-3" aria-label="Secciones">
        {SIDEBAR_NAV.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <item.icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
