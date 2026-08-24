import type { JobPlatform } from '@/lib/jobs/platforms'
import type { JobSearchContext } from '@/lib/jobs/profile-context'

function cleanPart(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[|]+/g, ' ')
    .trim()
}

/*
 * Adzuna works better with simple keyword searches.
 *
 * Do NOT put:
 * - India
 * - Full-time
 * - Remote
 * - Entry Level   
 *
 * into the main `what` query.
 *
 * Those are handled separately by jsearch.ts / Adzuna.
 */

export function buildPlatformSearchQuery(
  _platform: JobPlatform,
  _context: JobSearchContext
): string {
  return 'Full Stack Developer'
}
export function buildFallbackSearchQuery(
  _platform: JobPlatform,
  _context: JobSearchContext
): string {
  return 'Software Engineer'
}

export function buildAllPlatformQueries(
  platforms: JobPlatform[],
  context: JobSearchContext
): Record<JobPlatform, string> {
  return platforms.reduce(
    (acc, platform) => {
      acc[platform] = buildPlatformSearchQuery(
        platform,
        context
      )

      return acc
    },
    {} as Record<JobPlatform, string>
  )
}
export function buildAllPlatformFallbackQueries(
  platforms: JobPlatform[],
  context: JobSearchContext
): Record<JobPlatform, string> {
  return platforms.reduce(
    (acc, platform) => {
      acc[platform] = buildFallbackSearchQuery(
        platform,
        context
      )
      return acc
    },
    {} as Record<JobPlatform, string>
  )
}