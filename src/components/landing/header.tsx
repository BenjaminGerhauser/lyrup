import Link from 'next/link'

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-lyrup-border/50 bg-lyrup-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 sm:px-8 lg:px-8">
        {/* Wordmark */}
        <span className="font-heading text-lg font-bold text-lyrup-text-heading">
          Lyrup
        </span>

        {/* Login link — low visual weight, doesn't compete with the waitlist CTA */}
        <Link
          href="/login"
          className="text-sm text-lyrup-text-secondary transition-colors hover:text-lyrup-cyan"
          aria-label="Ingresar a tu cuenta"
        >
          Ingresar
        </Link>
      </div>
    </header>
  )
}
