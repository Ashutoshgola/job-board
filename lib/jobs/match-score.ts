import type { JobSearchContext } from '@/lib/jobs/profile-context'

type MatchInput = {
  title: string
  description: string
  location: string | null
  jobType: string | null
  experienceLevel: string | null
  experienceMinMonths: number | null
  experienceMaxMonths: number | null
  requiredExperience: string
  fresherAccepted: boolean
  tags: string[]
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\s-]/g, ' ')
}

function containsKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = keyword.trim().toLowerCase()
  if (!normalizedKeyword) return false
  if (normalizedKeyword.includes(' ')) {
    return text.includes(normalizedKeyword)
  }
  const pattern = new RegExp(`\\b${normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return pattern.test(text)
}

function experienceFit(
  context: JobSearchContext,
  job: MatchInput
): { factor: number; label: string } {
  if (job.experienceMinMonths === null) {
    return { factor: 1, label: 'unknown' }
  }

  const candidateMonths = context.totalExperienceMonths

  if (candidateMonths < job.experienceMinMonths) {
    const gap = job.experienceMinMonths - candidateMonths
    return {
      factor: gap >= 24 ? 0.25 : gap >= 12 ? 0.45 : 0.7,
      label: 'poor',
    }
  }

  if (
    job.experienceMaxMonths !== null &&
    candidateMonths > job.experienceMaxMonths
  ) {
    const gap = candidateMonths - job.experienceMaxMonths
    return {
      factor: gap >= 24 ? 0.45 : gap >= 12 ? 0.7 : 0.85,
      label: 'overqualified',
    }
  }

  return { factor: 1.08, label: 'strong' }
}

export function calculateMatchScore(
  context: JobSearchContext,
  job: MatchInput
): number {
  const haystack = normalizeText(
    [job.title, job.description, job.location ?? '', job.tags.join(' ')].join(' ')
  )

  let score = 45

  for (const skill of context.skills.slice(0, 8)) {
    if (containsKeyword(haystack, skill)) score += 4
  }

  for (const tech of context.techStack.slice(0, 6)) {
    if (containsKeyword(haystack, tech)) score += 3
  }

  const roleTokens = context.role.split(/\s+/).filter((token) => token.length > 2)
  const roleMatches = roleTokens.filter((token) => containsKeyword(haystack, token)).length
  score += Math.min(roleMatches * 4, 16)

  if (context.location && job.location) {
    const locationTokens = context.location.split(/[,/]/).map((part) => part.trim())
    if (locationTokens.some((part) => containsKeyword(job.location!.toLowerCase(), part))) {
      score += 8
    }
  }

  if (context.jobType && job.jobType) {
    if (context.jobType.toLowerCase() === job.jobType.toLowerCase()) score += 6
  }

  if (
    job.experienceMinMonths === null &&
    context.experienceLevel &&
    job.experienceLevel
  ) {
    if (context.experienceLevel.toLowerCase() === job.experienceLevel.toLowerCase()) {
      score += 5
    }
  }

  const fit = experienceFit(context, job)
  const finalScore = Math.min(Math.max(Math.round(score * fit.factor), 0), 100)

  console.log(
    `[Experience] Job: ${job.title} | Required: ${job.requiredExperience} | Experience match: ${fit.label} | Final match score: ${finalScore}`
  )

  return finalScore
}
