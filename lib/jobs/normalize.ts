import type { JobPlatform } from '@/lib/jobs/platforms'
import { calculateMatchScore } from '@/lib/jobs/match-score'
import type { AdzunaJob } from '@/lib/jobs/jsearch'
import type { JobSearchContext } from '@/lib/jobs/profile-context'

export type NormalizedJob = {
  platform: JobPlatform
  title: string
  company: string | null
  company_logo: string | null
  location: string | null
  salary: string | null
  job_type: string | null
  experience_level: string | null
  description: string | null
  tags: string[]
  match_score: number
  job_url: string
  source_url: string
}

const EXPERIENCE_PATTERNS: Array<{
  pattern: RegExp
  level: string
}> = [
  {
    pattern: /\b(principal|staff|director|vp|head of)\b/i,
    level: 'Senior',
  },
  {
    pattern: /\b(senior|sr\.?|lead|architect)\b/i,
    level: 'Senior',
  },
  {
    pattern: /\b(mid[- ]level|intermediate)\b/i,
    level: 'Mid',
  },
  {
    pattern:
      /\b(junior|jr\.?|entry[- ]level|graduate|intern|fresher|trainee)\b/i,
    level: 'Entry',
  },
]

function normalizeText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractExperienceLevel(text: string): string | null {
  for (const { pattern, level } of EXPERIENCE_PATTERNS) {
    if (pattern.test(text)) {
      return level
    }
  }

  return null
}

function normalizeEmploymentType(
  value: string | null | undefined
): string | null {
  if (!value) return null

  const normalized = value.toLowerCase().replace(/[_-]+/g, ' ')

  if (
    normalized.includes('full') ||
    normalized.includes('permanent')
  ) {
    return 'Full-time'
  }

  if (normalized.includes('part')) {
    return 'Part-time'
  }

  if (
    normalized.includes('contract') ||
    normalized.includes('contractor')
  ) {
    return 'Contract'
  }

  if (
    normalized.includes('intern') ||
    normalized.includes('internship')
  ) {
    return 'Internship'
  }

  if (normalized.includes('temporary') || normalized.includes('temp')) {
    return 'Temporary'
  }

  return value
}

function buildLocation(job: AdzunaJob): string | null {
  const location = job.location?.display_name?.trim()

  if (location) {
    return location
  }

  const area = job.location?.area

  if (Array.isArray(area) && area.length > 0) {
    return area
      .filter((item): item is string => Boolean(item?.trim()))
      .map((item) => item.trim())
      .join(', ')
  }

  return null
}

function formatSalary(job: AdzunaJob): string | null {
  const min =
    typeof job.salary_min === 'number'
      ? job.salary_min
      : null

  const max =
    typeof job.salary_max === 'number'
      ? job.salary_max
      : null

  if (min === null && max === null) {
    return null
  }

  const format = (value: number) =>
    value.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    })

  if (min !== null && max !== null) {
    return `₹${format(min)} - ₹${format(max)}`
  }

  if (min !== null) {
    return `₹${format(min)}+`
  }

  return `Up to ₹${format(max ?? 0)}`
}

function extractTags(
  job: AdzunaJob,
  context: JobSearchContext,
  text: string
): string[] {
  const haystack = text.toLowerCase()

  const candidates = [
    ...context.techStack,
    ...context.skills,
  ]

  const tags: string[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const normalized = candidate?.trim()

    if (!normalized) continue

    const key = normalized.toLowerCase()

    if (seen.has(key)) continue

    if (haystack.includes(key)) {
      tags.push(normalized)
      seen.add(key)
    }

    if (tags.length >= 8) {
      break
    }
  }

  return tags
}

function buildDescription(job: AdzunaJob): string | null {
  const description = normalizeText(job.description ?? '')

  return description || null
}

function companyLogoUrl(
  job: AdzunaJob,
  jobUrl: string
): string | null {
  if (!job.company?.display_name) {
    return null
  }

  try {
    const hostname = new URL(jobUrl).hostname

    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return null
  }
}

function buildJobType(
  job: AdzunaJob,
  context: JobSearchContext
): string | null {
  const contractType = normalizeEmploymentType(
    job.contract_type
  )

  if (contractType) {
    return contractType
  }

  const contractTime = normalizeEmploymentType(
    job.contract_time
  )

  if (contractTime) {
    return contractTime
  }

  return context.jobType || null
}

export function normalizeJSearchResult(
  result: AdzunaJob,
  requestedPlatform: JobPlatform,
  context: JobSearchContext
): NormalizedJob | null {
  const title = normalizeText(result.title ?? '')

  const description = buildDescription(result)

  const jobUrl = result.redirect_url?.trim()

  if (!title || !jobUrl) {
    return null
  }

  const location = buildLocation(result)

  const jobType = buildJobType(result, context)

  const combinedText = [
    title,
    description ?? '',
    location ?? '',
    result.company?.display_name ?? '',
    result.category?.label ?? '',
    result.category?.tag ?? '',
    result.contract_type ?? '',
    result.contract_time ?? '',
  ].join(' ')

  const experienceLevel =
    extractExperienceLevel(combinedText) ??
    context.experienceLevel

  const tags = extractTags(
    result,
    context,
    combinedText
  )

  const normalized: NormalizedJob = {
    platform: requestedPlatform,

    title,

    company:
      result.company?.display_name?.trim() || null,

    company_logo: companyLogoUrl(
      result,
      jobUrl
    ),

    location,

    salary: formatSalary(result),

    job_type: jobType,

    experience_level: experienceLevel,

    description,

    tags,

    match_score: 0,

    job_url: jobUrl,

    source_url: jobUrl,
  }

  normalized.match_score = calculateMatchScore(
    context,
    {
      title: normalized.title,
      description: normalized.description ?? '',
      location: normalized.location,
      jobType: normalized.job_type,
      experienceLevel: normalized.experience_level,
      tags: normalized.tags,
    }
  )

  return normalized
}

export function normalizeJSearchResults(
  results: AdzunaJob[],
  platform: JobPlatform,
  context: JobSearchContext
): NormalizedJob[] {
  const seen = new Set<string>()

  return results
    .map((result) =>
      normalizeJSearchResult(
        result,
        platform,
        context
      )
    )
    .filter(
      (job): job is NormalizedJob => {
        if (!job) {
          return false
        }

        if (seen.has(job.source_url)) {
          return false
        }

        seen.add(job.source_url)

        return true
      }
    )
}