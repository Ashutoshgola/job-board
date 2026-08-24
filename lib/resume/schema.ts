import { z } from 'zod'

export const parsedWorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().optional(),
  responsibilities: z.array(z.string()).default([]),
})

export const parsedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  field_of_study: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const parsedProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  technologies: z.array(z.string()).default([]),
})

export const parsedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
})

export const parsedProfileLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

export const parsedResumeSchema = z.object({
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
  work_experiences: z.array(parsedWorkExperienceSchema).default([]),
  education_entries: z.array(parsedEducationSchema).default([]),
  projects: z.array(parsedProjectSchema).default([]),
  certifications: z.array(parsedCertificationSchema).default([]),
  profile_links: z.array(parsedProfileLinkSchema).default([]),
})

export type ParsedResume = z.infer<typeof parsedResumeSchema>

export const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export type AllowedResumeMimeType = (typeof ALLOWED_RESUME_MIME_TYPES)[number]

export function isAllowedResumeMimeType(
  mimeType: string
): mimeType is AllowedResumeMimeType {
  return ALLOWED_RESUME_MIME_TYPES.includes(mimeType as AllowedResumeMimeType)
}
