import { redirect } from 'next/navigation'

import { ProfileForm } from '@/components/profile/profile-form'
import { createClient } from '@/lib/supabase/server'
import { getProfileData } from '@/lib/queries/profile'

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/sign-in?next=/dashboard/profile')
  }

  const params = await searchParams
  const userId = data.claims.sub as string
  const profileData = await getProfileData(userId)

  return (
    <ProfileForm
      data={profileData}
      showReviewBanner={params.from === 'resume'}
    />
  )
}
