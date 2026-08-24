export const JOB_PLATFORMS = [
  'adzuna',
] as const

export type JobPlatform =
  (typeof JOB_PLATFORMS)[number]

export type PlatformConfig = {
  id: JobPlatform
  name: string
  siteQuery: string
  domains: string[]
  accentClass: string
  badgeClass: string
}

export const PLATFORM_CONFIG: Record<
  JobPlatform,
  PlatformConfig
> = {
  adzuna: {
    id: 'adzuna',
    name: 'Adzuna',
    siteQuery: 'Adzuna jobs',
    domains: ['adzuna.com'],
    accentClass:
      'border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10',
    badgeClass:
      'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300',
  },
}

export function isJobPlatform(
  value: string
): value is JobPlatform {
  return JOB_PLATFORMS.includes(
    value as JobPlatform
  )
}