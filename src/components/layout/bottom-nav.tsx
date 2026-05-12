'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV } from '@/lib/constants/nav'

/**
 * Mobile bottom navigation — visible only on viewport < 768px (md:hidden).
 * 4 tabs: Cotizar, Historial, Configuración, Perfil.
 * Active tab highlighted via usePathname.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-card"
      aria-label="Navegación móvil"
    >
      {BOTTOM_NAV.map((item) => {
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
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon
              size={20}
              strokeWidth={isActive ? 2.5 : 2}
              aria-hidden="true"
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
