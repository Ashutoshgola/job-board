import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/database.types'
import { mergeProfileField } from '@/lib/profile/completeness'
import type { ParsedResume } from '@/lib/resume/schema'

type Client = SupabaseClient<Database>

export async function saveParsedProfileData(
  supabase: Client,
  userId: string,
  parsed: ParsedResume
) {
  const { profile, skills, work_experiences, education_entries, projects, certifications, profile_links } =
    parsed

  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (fetchError) throw fetchError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: mergeProfileField(profile.full_name, existingProfile.full_name),
      email: mergeProfileField(profile.email, existingProfile.email),
      phone: mergeProfileField(profile.phone, existingProfile.phone),
      location: mergeProfileField(profile.location, existingProfile.location),
      linkedin_url: mergeProfileField(profile.linkedin_url, existingProfile.linkedin_url),
      github_url: mergeProfileField(profile.github_url, existingProfile.github_url),
      website_url: mergeProfileField(profile.website_url, existingProfile.website_url),
      portfolio_url: mergeProfileField(profile.portfolio_url, existingProfile.portfolio_url),
      professional_summary: mergeProfileField(
        profile.professional_summary,
        existingProfile.professional_summary
      ),
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) throw profileError

  await Promise.all([
    supabase.from('profile_skills').delete().eq('user_id', userId),
    supabase.from('work_experiences').delete().eq('user_id', userId),
    supabase.from('education_entries').delete().eq('user_id', userId),
    supabase.from('projects').delete().eq('user_id', userId),
    supabase.from('certifications').delete().eq('user_id', userId),
    supabase.from('profile_links').delete().eq('user_id', userId),
  ])

  if (skills.length > 0) {
    const { error } = await supabase.from('profile_skills').insert(
      skills.map((skill, index) => ({
        user_id: userId,
        skill,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (work_experiences.length > 0) {
    const { error } = await supabase.from('work_experiences').insert(
      work_experiences.map((exp, index) => ({
        user_id: userId,
        company: exp.company,
        title: exp.title,
        start_date: exp.start_date ?? null,
        end_date: exp.end_date ?? null,
        is_current: exp.is_current ?? false,
        responsibilities: exp.responsibilities,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (education_entries.length > 0) {
    const { error } = await supabase.from('education_entries').insert(
      education_entries.map((edu, index) => ({
        user_id: userId,
        institution: edu.institution,
        degree: edu.degree ?? null,
        field_of_study: edu.field_of_study ?? null,
        start_date: edu.start_date ?? null,
        end_date: edu.end_date ?? null,
        description: edu.description ?? null,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (projects.length > 0) {
    const { error } = await supabase.from('projects').insert(
      projects.map((project, index) => ({
        user_id: userId,
        name: project.name,
        description: project.description ?? null,
        url: project.url ?? null,
        technologies: project.technologies,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (certifications.length > 0) {
    const { error } = await supabase.from('certifications').insert(
      certifications.map((cert, index) => ({
        user_id: userId,
        name: cert.name,
        issuer: cert.issuer ?? null,
        issue_date: cert.issue_date ?? null,
        url: cert.url ?? null,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (profile_links.length > 0) {
    const { error } = await supabase.from('profile_links').insert(
      profile_links.map((link, index) => ({
        user_id: userId,
        label: link.label,
        url: link.url,
        sort_order: index,
      }))
    )
    if (error) throw error
  }
}
