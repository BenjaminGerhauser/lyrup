import type { ComponentType, SVGProps } from 'react'
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Printer,
  Box,
  Settings,
} from 'lucide-react'

/** Matches the shape lucide-react components expose */
export type NavIcon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

export interface NavItem {
  label: string
  href: string
  icon: NavIcon
}

/** Sidebar navigation items — desktop (all 6 sections) */
export const SIDEBAR_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Cotizar',
    href: '/cotizar',
    icon: Calculator,
  },
  {
    label: 'Cotizaciones',
    href: '/cotizaciones',
    icon: FileText,
  },
  {
    label: 'Impresoras',
    href: '/impresoras',
    icon: Printer,
  },
  {
    label: 'Materiales',
    href: '/materiales',
    icon: Box,
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: Settings,
  },
]

/** Bottom navigation tabs — mobile (4 tabs per spec) */
export const BOTTOM_NAV: NavItem[] = [
  {
    label: 'Cotizar',
    href: '/cotizar',
    icon: Calculator,
  },
  {
    label: 'Historial',
    href: '/cotizaciones',
    icon: FileText,
  },
  {
    label: 'Configuración',
    href: '/configuracion',
    icon: Settings,
  },
  {
    label: 'Perfil',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
]
