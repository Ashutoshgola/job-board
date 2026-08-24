import { redirect } from 'next/navigation'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { OnboardingGate } from '@/components/onboarding/onboarding-gate'
import { createClient } from '@/lib/supabase/server'
import { getProfileData } from '@/lib/queries/profile'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/sign-in?next=/dashboard')
  }

  const userId = data.claims.sub as string
  const profileData = await getProfileData(userId)
  const hasResume = profileData.resumes.length > 0

  return (
    <DashboardShell>
      <OnboardingGate hasResume={hasResume} />
      {children}
    </DashboardShell>
  )
}
