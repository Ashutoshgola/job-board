import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/lib/database.types'

export type ProfileData = {
  profile: Tables<'profiles'> | null
  resumes: Tables<'resumes'>[]
  skills: Tables<'profile_skills'>[]
  workExperiences: Tables<'work_experiences'>[]
  educationEntries: Tables<'education_entries'>[]
  projects: Tables<'projects'>[]
  certifications: Tables<'certifications'>[]
  profileLinks: Tables<'profile_links'>[]
}

export async function getProfileData(userId: string): Promise<ProfileData> {
  const supabase = await createClient()

  const [
    profileResult,
    resumesResult,
    skillsResult,
    workResult,
    educationResult,
    projectsResult,
    certificationsResult,
    linksResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('profile_skills')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('education_entries')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('certifications')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('profile_links')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true }),
  ])

  if (profileResult.error) throw profileResult.error
  if (resumesResult.error) throw resumesResult.error
  if (skillsResult.error) throw skillsResult.error
  if (workResult.error) throw workResult.error
  if (educationResult.error) throw educationResult.error
  if (projectsResult.error) throw projectsResult.error
  if (certificationsResult.error) throw certificationsResult.error
  if (linksResult.error) throw linksResult.error

  return {
    profile: profileResult.data,
    resumes: resumesResult.data ?? [],
    skills: skillsResult.data ?? [],
    workExperiences: workResult.data ?? [],
    educationEntries: educationResult.data ?? [],
    projects: projectsResult.data ?? [],
    certifications: certificationsResult.data ?? [],
    profileLinks: linksResult.data ?? [],
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const sub = data?.claims?.sub
  return typeof sub === 'string' ? sub : null
}
