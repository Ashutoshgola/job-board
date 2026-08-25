import type { ProfileData } from '@/lib/queries/profile'

export type CandidateExperienceLevel = 'Fresher' | 'Entry' | 'Mid' | 'Senior'

export type ExperienceRequirement = {
  minMonths: number
  maxMonths: number | null
  label: string
  level: CandidateExperienceLevel | null
  fresherAccepted: boolean
}

function parseMonth(value: string | null | undefined): number | null {
  if (!value?.trim()) return null
  const normalized = value.trim().toLowerCase()
  if (/^(present|current|now)$/.test(normalized)) return null

  const yearMonth = normalized.match(/^(\d{4})[-/]?(\d{1,2})?/)
  if (yearMonth) {
    const year = Number(yearMonth[1])
    const month = Number(yearMonth[2] ?? 1)
    if (month >= 1 && month <= 12) return year * 12 + month - 1
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  const date = new Date(parsed)
  return date.getUTCFullYear() * 12 + date.getUTCMonth()
}

function currentMonth(): number {
  const date = new Date()
  return date.getUTCFullYear() * 12 + date.getUTCMonth()
}

export function calculateTotalExperienceMonths(
  workExperiences: ProfileData['workExperiences']
): number {
  const intervals = workExperiences
    .map((experience) => {
      const start = parseMonth(experience.start_date)
      if (start === null) return null

      const endValue = experience.end_date?.trim() ?? ''
      if (!experience.is_current && (!endValue || /^(present|current|now)$/i.test(endValue))) {
        return null
      }

      const parsedEnd = parseMonth(experience.end_date)
      const end = experience.is_current ? currentMonth() + 1 : parsedEnd
      if (end === null) return null
      return end > start ? { start, end } : { start, end: start + 1 }
    })
    .filter((interval): interval is { start: number; end: number } => interval !== null)
    .sort((left, right) => left.start - right.start)

  let totalMonths = 0
  let merged: { start: number; end: number } | null = null

  for (const interval of intervals) {
    if (!merged) {
      merged = interval
      continue
    }

    if (interval.start <= merged.end) {
      merged.end = Math.max(merged.end, interval.end)
      continue
    }

    totalMonths += merged.end - merged.start
    merged = interval
  }

  if (merged) totalMonths += merged.end - merged.start
  return totalMonths
}

export function getCandidateExperienceLevel(totalMonths: number): CandidateExperienceLevel {
  if (totalMonths === 0) return 'Fresher'
  if (totalMonths < 24) return 'Entry'
  if (totalMonths < 60) return 'Mid'
  return 'Senior'
}

export function formatExperienceYears(totalMonths: number): string {
  return `${(totalMonths / 12).toFixed(1)} years`
}

function toMonths(value: number, unit: string): number {
  return unit.startsWith('month') || unit.startsWith('mo') ? value : value * 12
}

export function extractExperienceRequirement(text: string): ExperienceRequirement | null {
  const normalized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
  if (!normalized) return null

  if (/\b(?:freshers?|no experience required|no prior experience|entry[- ]level|new grad|recent graduate|graduate role)\b/.test(normalized)) {
    return {
      minMonths: 0,
      maxMonths: 12,
      label: 'Fresher / 0-1 year',
      level: 'Fresher',
      fresherAccepted: true,
    }
  }

  const range = normalized.match(/\b(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)?\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/)
  if (range) {
    const unit = range[4] ?? range[2] ?? 'years'
    const minMonths = Math.round(toMonths(Number(range[1]), unit))
    const maxMonths = Math.round(toMonths(Number(range[3]), unit))
    return {
      minMonths,
      maxMonths,
      label: formatRange(minMonths, maxMonths),
      level: minMonths >= 60 ? 'Senior' : minMonths >= 24 ? 'Mid' : 'Entry',
      fresherAccepted: minMonths === 0,
    }
  }

  const plus = normalized.match(/\b(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\s*\+/)
  if (plus) {
    const minMonths = Math.round(toMonths(Number(plus[1]), plus[2]))
    return {
      minMonths,
      maxMonths: null,
      label: `${formatMonths(minMonths)}+`,
      level: minMonths >= 60 ? 'Senior' : minMonths >= 24 ? 'Mid' : 'Entry',
      fresherAccepted: minMonths === 0,
    }
  }

  const minimum = normalized.match(/\b(?:minimum|at least|experience of)\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/)
  if (minimum) {
    const minMonths = Math.round(toMonths(Number(minimum[1]), minimum[2]))
    return {
      minMonths,
      maxMonths: null,
      label: `${formatMonths(minMonths)}+`,
      level: minMonths >= 60 ? 'Senior' : minMonths >= 24 ? 'Mid' : 'Entry',
      fresherAccepted: minMonths === 0,
    }
  }

  const experiencePhrase = normalized.match(/\b(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\s+(?:of\s+)?experience\b/)
  if (experiencePhrase) {
    const minMonths = Math.round(toMonths(Number(experiencePhrase[1]), experiencePhrase[2]))
    if (minMonths === 0) {
      return {
        minMonths: 0,
        maxMonths: 12,
        label: 'Fresher / 0-1 year',
        level: 'Fresher',
        fresherAccepted: true,
      }
    }
    return {
      minMonths,
      maxMonths: null,
      label: `${formatMonths(minMonths)}+`,
      level: minMonths >= 60 ? 'Senior' : minMonths >= 24 ? 'Mid' : 'Entry',
      fresherAccepted: false,
    }
  }

  const trailingExperience = normalized.match(/\bexperience\s*(?:required|:|-)?\s*(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/)
  if (trailingExperience) {
    const minMonths = Math.round(toMonths(Number(trailingExperience[1]), trailingExperience[2]))
    return {
      minMonths,
      maxMonths: null,
      label: `${formatMonths(minMonths)}+`,
      level: minMonths >= 60 ? 'Senior' : minMonths >= 24 ? 'Mid' : 'Entry',
      fresherAccepted: minMonths === 0,
    }
  }

  const level = normalized.match(/\b(senior|sr\.?|lead|staff|principal|architect|mid[- ]level|intermediate|junior|jr\.?)\b/)
  if (level) {
    const senior = /senior|sr\.?|lead|staff|principal|architect/.test(level[1])
    const minMonths = senior ? 60 : /mid|intermediate/.test(level[1]) ? 24 : 0
    return {
      minMonths,
      maxMonths: senior ? null : minMonths === 24 ? 60 : 24,
      label: senior ? '5+ years' : minMonths === 24 ? '2-5 years' : '0-2 years',
      level: senior ? 'Senior' : minMonths === 24 ? 'Mid' : 'Entry',
      fresherAccepted: minMonths === 0,
    }
  }

  return null
}

function formatMonths(months: number): string {
  if (months % 12 === 0) return `${months / 12} year${months === 12 ? '' : 's'}`
  return `${months} months`
}

function formatRange(minMonths: number, maxMonths: number): string {
  if (minMonths % 12 === 0 && maxMonths % 12 === 0) {
    return `${minMonths / 12}-${maxMonths / 12} years`
  }
  return `${formatMonths(minMonths)}-${formatMonths(maxMonths)}`
}

export function formatExperienceRequirement(requirement: ExperienceRequirement | null): string {
  return requirement?.label ?? 'Experience not specified'
}
