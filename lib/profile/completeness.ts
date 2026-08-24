import type { ProfileUpdatePayload } from '@/lib/actions/profile'
import type { ProfileData } from '@/lib/queries/profile'

export type ProfileSectionId =
  | 'basic'
  | 'summary'
  | 'skills'
  | 'experience'
  | 'education'
  | 'projects'
  | 'certifications'
  | 'links'

export type ProfileSectionStatus = {
  id: ProfileSectionId
  label: string
  complete: boolean
  score: number
  maxScore: number
}

export type ProfileCompleteness = {
  percentage: number
  sections: ProfileSectionStatus[]
  incompleteLabels: string[]
}

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0
}

function countFilled(values: Array<string | null | undefined>): number {
  return values.filter((value) => !isBlank(value)).length
}

export function getProgressColors(percentage: number) {
  if (percentage >= 90) {
    return {
      ring: 'stroke-emerald-500',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      label: 'Excellent',
    }
  }

  if (percentage >= 70) {
    return {
      ring: 'stroke-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
      label: 'Good progress',
    }
  }

  if (percentage >= 40) {
    return {
      ring: 'stroke-amber-500',
      text: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
      label: 'Needs work',
    }
  }

  return {
    ring: 'stroke-red-500',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-300',
    label: 'Just getting started',
  }
}

export function calculateProfileCompleteness(
  form: ProfileUpdatePayload
): ProfileCompleteness {
  const basicFilled = countFilled([
    form.profile.full_name,
    form.profile.email,
    form.profile.phone,
    form.profile.location,
  ])
  const basicScore = Math.round((basicFilled / 4) * 20)

  const summaryComplete = !isBlank(form.profile.professional_summary)
  const summaryScore = summaryComplete ? 15 : 0

  const skillsComplete = form.skills.length > 0
  const skillsScore = skillsComplete ? 15 : 0

  const experienceComplete = form.workExperiences.some(
    (exp) => !isBlank(exp.company) && !isBlank(exp.title)
  )
  const experienceScore = experienceComplete ? 25 : 0

  const educationComplete = form.educationEntries.some(
    (edu) => !isBlank(edu.institution)
  )
  const educationScore = educationComplete ? 15 : 0

  const projectsComplete = form.projects.some((project) => !isBlank(project.name))
  const projectsScore = projectsComplete ? 5 : 0

  const certificationsComplete = form.certifications.some(
    (cert) => !isBlank(cert.name)
  )
  const certificationsScore = certificationsComplete ? 3 : 0

  const linksComplete = form.profileLinks.some(
    (link) => !isBlank(link.label) && !isBlank(link.url)
  )
  const linksScore = linksComplete ? 2 : 0

  const sections: ProfileSectionStatus[] = [
    {
      id: 'basic',
      label: 'Basic information',
      complete: basicFilled === 4,
      score: basicScore,
      maxScore: 20,
    },
    {
      id: 'summary',
      label: 'Professional summary',
      complete: summaryComplete,
      score: summaryScore,
      maxScore: 15,
    },
    {
      id: 'skills',
      label: 'Skills',
      complete: skillsComplete,
      score: skillsScore,
      maxScore: 15,
    },
    {
      id: 'experience',
      label: 'Work experience',
      complete: experienceComplete,
      score: experienceScore,
      maxScore: 25,
    },
    {
      id: 'education',
      label: 'Education',
      complete: educationComplete,
      score: educationScore,
      maxScore: 15,
    },
    {
      id: 'projects',
      label: 'Projects',
      complete: projectsComplete,
      score: projectsScore,
      maxScore: 5,
    },
    {
      id: 'certifications',
      label: 'Certifications',
      complete: certificationsComplete,
      score: certificationsScore,
      maxScore: 3,
    },
    {
      id: 'links',
      label: 'Other links',
      complete: linksComplete,
      score: linksScore,
      maxScore: 2,
    },
  ]

  const totalScore = sections.reduce((sum, section) => sum + section.score, 0)
  const incompleteLabels = sections
    .filter((section) => !section.complete)
    .map((section) => section.label)

  return {
    percentage: totalScore,
    sections,
    incompleteLabels,
  }
}

export function getIncompleteProfileSections(data: ProfileData): string[] {
  return calculateProfileCompleteness({
    profile: {
      full_name: data.profile?.full_name ?? '',
      email: data.profile?.email ?? '',
      phone: data.profile?.phone ?? '',
      location: data.profile?.location ?? '',
      linkedin_url: data.profile?.linkedin_url ?? '',
      github_url: data.profile?.github_url ?? '',
      website_url: data.profile?.website_url ?? '',
      portfolio_url: data.profile?.portfolio_url ?? '',
      professional_summary: data.profile?.professional_summary ?? '',
    },
    skills: data.skills.map((skill) => skill.skill),
    workExperiences: data.workExperiences.map((exp) => ({
      company: exp.company,
      title: exp.title,
      start_date: exp.start_date ?? '',
      end_date: exp.end_date ?? '',
      is_current: exp.is_current,
      responsibilities: exp.responsibilities,
    })),
    educationEntries: data.educationEntries.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree ?? '',
      field_of_study: edu.field_of_study ?? '',
      start_date: edu.start_date ?? '',
      end_date: edu.end_date ?? '',
      description: edu.description ?? '',
    })),
    projects: data.projects.map((project) => ({
      name: project.name,
      description: project.description ?? '',
      url: project.url ?? '',
      technologies: project.technologies,
    })),
    certifications: data.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer ?? '',
      issue_date: cert.issue_date ?? '',
      url: cert.url ?? '',
    })),
    profileLinks: data.profileLinks.map((link) => ({
      label: link.label,
      url: link.url,
    })),
  }).incompleteLabels
}

export function mergeProfileField(
  parsed: string | null | undefined,
  existing: string | null | undefined
): string | null {
  const trimmed = parsed?.trim()
  if (trimmed) return trimmed
  const existingTrimmed = existing?.trim()
  return existingTrimmed || null
}
