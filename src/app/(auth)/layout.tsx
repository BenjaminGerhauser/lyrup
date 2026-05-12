import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lyrup — Acceso',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-lyrup-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Wordmark */}
      <a
        href="/"
        className="mb-8 text-2xl font-heading font-bold text-lyrup-cyan tracking-tight"
        aria-label="Lyrup — Inicio"
      >
        Lyrup
      </a>

      {/* Card */}
      <div className="w-full max-w-sm bg-lyrup-bg-elevated border border-lyrup-border rounded-2xl p-8 shadow-xl">
        {children}
      </div>
    </div>
  )
}
