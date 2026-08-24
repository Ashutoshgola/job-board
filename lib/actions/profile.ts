'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUserId } from '@/lib/queries/profile'

const profileUpdateSchema = z.object({
  profile: z.object({
    full_name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    linkedin_url: z.string().nullable().optional(),
    github_url: z.string().nullable().optional(),
    website_url: z.string().nullable().optional(),
    portfolio_url: z.string().nullable().optional(),
    professional_summary: z.string().nullable().optional(),
  }),
  skills: z.array(z.string()).default([]),
  workExperiences: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        start_date: z.string().nullable().optional(),
        end_date: z.string().nullable().optional(),
        is_current: z.boolean().optional(),
        responsibilities: z.array(z.string()).default([]),
      })
    )
    .default([]),
  educationEntries: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string().nullable().optional(),
        field_of_study: z.string().nullable().optional(),
        start_date: z.string().nullable().optional(),
        end_date: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().nullable().optional(),
        url: z.string().nullable().optional(),
        technologies: z.array(z.string()).default([]),
      })
    )
    .default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().nullable().optional(),
        issue_date: z.string().nullable().optional(),
        url: z.string().nullable().optional(),
      })
    )
    .default([]),
  profileLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .default([]),
})

export type ProfileUpdatePayload = z.infer<typeof profileUpdateSchema>

export type ProfileActionResult =
  | { success: true }
  | { success: false; error: string }

export async function updateProfile(
  payload: ProfileUpdatePayload
): Promise<ProfileActionResult> {
  const userId = await getAuthenticatedUserId()
  if (!userId) {
    return { success: false, error: 'You must be signed in.' }
  }

  const parsed = profileUpdateSchema.safeParse(payload)
  if (!parsed.success) {
    return { success: false, error: 'Invalid profile data.' }
  }

  const data = parsed.data
  const supabase = await createClient()

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: data.profile.full_name ?? null,
      email: data.profile.email ?? null,
      phone: data.profile.phone ?? null,
      location: data.profile.location ?? null,
      linkedin_url: data.profile.linkedin_url ?? null,
      github_url: data.profile.github_url ?? null,
      website_url: data.profile.website_url ?? null,
      portfolio_url: data.profile.portfolio_url ?? null,
      professional_summary: data.profile.professional_summary ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileError) {
    return { success: false, error: profileError.message }
  }

  await Promise.all([
    supabase.from('profile_skills').delete().eq('user_id', userId),
    supabase.from('work_experiences').delete().eq('user_id', userId),
    supabase.from('education_entries').delete().eq('user_id', userId),
    supabase.from('projects').delete().eq('user_id', userId),
    supabase.from('certifications').delete().eq('user_id', userId),
    supabase.from('profile_links').delete().eq('user_id', userId),
  ])

  if (data.skills.length > 0) {
    const { error } = await supabase.from('profile_skills').insert(
      data.skills.map((skill, index) => ({
        user_id: userId,
        skill,
        sort_order: index,
      }))
    )
    if (error) return { success: false, error: error.message }
  }

  if (data.workExperiences.length > 0) {
    const { error } = await supabase.from('work_experiences').insert(
      data.workExperiences.map((exp, index) => ({
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
    if (error) return { success: false, error: error.message }
  }

  if (data.educationEntries.length > 0) {
    const { error } = await supabase.from('education_entries').insert(
      data.educationEntries.map((edu, index) => ({
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
    if (error) return { success: false, error: error.message }
  }

  if (data.projects.length > 0) {
    const { error } = await supabase.from('projects').insert(
      data.projects.map((project, index) => ({
        user_id: userId,
        name: project.name,
        description: project.description ?? null,
        url: project.url ?? null,
        technologies: project.technologies,
        sort_order: index,
      }))
    )
    if (error) return { success: false, error: error.message }
  }

  if (data.certifications.length > 0) {
    const { error } = await supabase.from('certifications').insert(
      data.certifications.map((cert, index) => ({
        user_id: userId,
        name: cert.name,
        issuer: cert.issuer ?? null,
        issue_date: cert.issue_date ?? null,
        url: cert.url ?? null,
        sort_order: index,
      }))
    )
    if (error) return { success: false, error: error.message }
  }

  if (data.profileLinks.length > 0) {
    const { error } = await supabase.from('profile_links').insert(
      data.profileLinks.map((link, index) => ({
        user_id: userId,
        label: link.label,
        url: link.url,
        sort_order: index,
      }))
    )
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/profile')

  return { success: true }
}
