/**
 * Dashboard header — RSC.
 * Displays the user's business name and an avatar with initials derived from email.
 */

interface HeaderProps {
  businessName: string
  email: string
}

function getInitials(email: string): string {
  const local = email.split('@')[0] ?? ''
  return (local[0] ?? '?').toUpperCase()
}

export function Header({ businessName, email }: HeaderProps) {
  const initials = getInitials(email)

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:px-6">
      <span className="font-heading text-sm font-semibold text-foreground truncate max-w-[200px]">
        {businessName}
      </span>

      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold select-none"
        aria-label={`Avatar de ${email}`}
      >
        {initials}
      </div>
    </header>
  )
}
