/**
 * Onboarding layout override.
 *
 * WHY this file exists:
 * The onboarding route lives under (dashboard)/ so that Next.js resolves it to
 * `/onboarding` without any URL segment change. However, onboarding must NOT
 * inherit the dashboard shell (sidebar + header + bottom-nav) because the user
 * hasn't completed setup yet. Next.js layout nesting allows a nested layout.tsx
 * to completely replace the parent layout for that subtree.
 *
 * This file renders only `{children}` inside a minimal centered wrapper —
 * no sidebar, no header, no bottom nav.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen overflow-y-auto bg-lyrup-bg flex items-center justify-center p-4">
      {children}
    </div>
  )
}
