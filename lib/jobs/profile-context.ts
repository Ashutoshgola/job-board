import type { ProfileData } from '@/lib/queries/profile'
import {
  calculateTotalExperienceMonths,
  getCandidateExperienceLevel,
  type CandidateExperienceLevel,
} from '@/lib/jobs/experience'

export type JobSearchContext = {
  role: string
  jobType: string
  location: string
  remoteOnly: boolean
  skills: string[]
  techStack: string[]
  experienceLevel: CandidateExperienceLevel
  totalExperienceMonths: number
  totalExperienceYears: number
  educationSummary: string
}

function uniqueNonEmpty(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const value of values) {
    const trimmed = value.trim()

    if (!trimmed) continue

    const key = trimmed.toLowerCase()

    if (seen.has(key)) continue

    seen.add(key)
    result.push(trimmed)
  }

  return result
}

/**
 * Infer the user's preferred work arrangement.
 *
 * India is handled separately in the search layer.
 */
function inferJobPreferences(
  location: string | null | undefined,
  summary: string | null | undefined
): {
  jobType: string
  remoteOnly: boolean
} {
  const text = `${location ?? ''} ${summary ?? ''}`.toLowerCase()

  if (/\bremote\b/.test(text)) {
    return {
      jobType: 'Remote',
      remoteOnly: true,
    }
  }

  if (/\bhybrid\b/.test(text)) {
    return {
      jobType: 'Hybrid',
      remoteOnly: false,
    }
  }

  if (/\b(on[- ]site|onsite)\b/.test(text)) {
    return {
      jobType: 'On-site',
      remoteOnly: false,
    }
  }

  return {
    jobType: 'Full-time',
    remoteOnly: false,
  }
}

/**
 * Infer experience level from previous work experience
 * and professional summary.
 */
/**
 * Normalize a job title into a broader role that JSearch
 * can search effectively.
 *
 * Examples:
 *
 * "Full Stack Developer Intern"
 *      -> "Full Stack Developer"
 *
 * "SDE Intern"
 *      -> "Software Engineer"
 *
 * "MERN Stack Developer"
 *      -> "Full Stack Developer"
 */
function normalizeRole(title: string): string {
  const role = title.trim().toLowerCase()

  if (!role) {
    return 'Software Engineer'
  }

  // Full Stack / MERN
  if (
    role.includes('full stack') ||
    role.includes('fullstack') ||
    role.includes('mern')
  ) {
    return 'Full Stack Developer'
  }

  // Software Engineer / SDE
  if (
    role.includes('software engineer') ||
    role.includes('software developer') ||
    /\bsde\b/.test(role)
  ) {
    return 'Software Engineer'
  }

  // Backend
  if (
    role.includes('backend') ||
    role.includes('back end')
  ) {
    return 'Backend Developer'
  }

  // Frontend
  if (
    role.includes('frontend') ||
    role.includes('front end')
  ) {
    return 'Frontend Developer'
  }

  // DevOps / Cloud
  if (
    role.includes('devops') ||
    role.includes('dev ops') ||
    role.includes('cloud engineer')
  ) {
    return 'DevOps Engineer'
  }

  // Machine Learning / Data
  if (
    role.includes('machine learning') ||
    /\bml\b/.test(role) ||
    role.includes('data scientist')
  ) {
    return 'Machine Learning Engineer'
  }

  // Remove internship-related words
  const cleaned = title
    .replace(/\b(intern|internship|trainee|fresher)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned) {
    return cleaned
  }

  return 'Software Engineer'
}

/**
 * Infer the primary job role from the user's profile.
 */
function inferRole(data: ProfileData): string {
  const current = data.workExperiences.find(
    (exp) => exp.is_current
  )

  if (current?.title?.trim()) {
    return normalizeRole(current.title)
  }

  const latest = data.workExperiences[0]

  if (latest?.title?.trim()) {
    return normalizeRole(latest.title)
  }

  const topSkill = data.skills[0]?.skill

  if (topSkill?.trim()) {
    return `${topSkill.trim()} Developer`
  }

  return 'Software Engineer'
}

/**
 * Create a compact education summary.
 */
function summarizeEducation(data: ProfileData): string {
  const latest = data.educationEntries[0]

  if (!latest) {
    return ''
  }

  return [
    latest.degree,
    latest.field_of_study,
    latest.institution,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Build the complete job-search context from the user's profile.
 */
export function buildJobSearchContext(
  data: ProfileData
): JobSearchContext {
  const skills = data.skills.map(
    (item) => item.skill
  )

  const projectTech = data.projects.flatMap(
    (project) => project.technologies
  )

  const summary =
    data.profile?.professional_summary ?? ''

  const preferences = inferJobPreferences(
    data.profile?.location,
    summary
  )
  const totalExperienceMonths = calculateTotalExperienceMonths(
    data.workExperiences
  )
  const experienceLevel = getCandidateExperienceLevel(totalExperienceMonths)

  console.log(
    `[Experience] Candidate total experience: ${(totalExperienceMonths / 12).toFixed(1)} years`
  )
  console.log(`[Experience] Candidate level: ${experienceLevel}`)

  return {
    /*
     * Examples:
     *
     * Full Stack Developer Intern
     * -> Full Stack Developer
     *
     * SDE Intern
     * -> Software Engineer
     *
     * MERN Stack Developer
     * -> Full Stack Developer
     */
    role: inferRole(data),

    jobType: preferences.jobType,

    /*
     * Default location is INDIA.
     *
     * This is also enforced in jobs.ts and jsearch.ts
     * so the API request uses:
     *
     * location=India
     * country=in
     */
    location:
      data.profile?.location?.trim() || 'India',

    remoteOnly: preferences.remoteOnly,

    skills: uniqueNonEmpty(skills),

    /*
     * Keep technologies for matching/ranking.
     * We don't want to put every technology into
     * the JSearch query because that makes the
     * search too restrictive.
     */
    techStack: uniqueNonEmpty([
      ...skills,
      ...projectTech,
    ]).slice(0, 8),

    experienceLevel,
    totalExperienceMonths,
    totalExperienceYears: totalExperienceMonths / 12,

    educationSummary:
      summarizeEducation(data),
  }
}