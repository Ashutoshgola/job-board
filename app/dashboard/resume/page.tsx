import { redirect } from 'next/navigation'

import { ResumeList } from '@/components/resume/resume-list'
import { createClient } from '@/lib/supabase/server'
import { getProfileData } from '@/lib/queries/profile'

export default async function ResumePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()

  if (!data?.claims) {
    redirect('/sign-in?next=/dashboard/resume')
  }

  const userId = data.claims.sub as string
  const profileData = await getProfileData(userId)

  return <ResumeList resumes={profileData.resumes} />
}
