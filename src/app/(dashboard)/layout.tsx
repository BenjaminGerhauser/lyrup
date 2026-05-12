import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server-cookies'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { PwaRegister } from '@/components/layout/pwa-register'

/**
 * Dashboard layout — RSC.
 * Reads the authed user session and their business profile.
 * Middleware guarantees only authenticated + onboarding-complete users reach here.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch business name from users table
  const { data: profile } = await supabase
    .from('users')
    .select('business_name')
    .eq('id', user.id)
    .single()

  const businessName = profile?.business_name ?? 'Mi negocio'
  const email = user.email ?? ''

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <Header businessName={businessName} email={email} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>

      <BottomNav />
      <PwaRegister />
    </div>
  )
}
