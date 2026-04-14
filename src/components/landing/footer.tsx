const NAV_LINKS = [
  { label: 'Blog', href: '#' },
  { label: 'Contacto', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Twitter', href: '#' },
]

export function Footer() {
  return (
    <footer id="footer" className="border-t border-lyrup-border bg-lyrup-bg">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-heading text-2xl font-bold text-lyrup-text-heading">
              Lyrup
            </span>
            <span className="text-sm text-lyrup-text-muted">
              Hecho en Argentina para emprendedores 3D de toda Latinoamérica.
            </span>
          </div>

          {/* Navigation */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="text-sm text-lyrup-text-secondary transition-colors hover:text-lyrup-cyan"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Email */}
          <a
            href="mailto:hola@lyrup.com"
            className="text-sm text-lyrup-text-secondary transition-colors hover:text-lyrup-cyan"
          >
            hola@lyrup.com
          </a>

          {/* Copyright */}
          <p className="text-xs text-lyrup-text-muted">
            © {new Date().getFullYear()} Lyrup. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
