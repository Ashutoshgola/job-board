import { createClient } from '@/lib/supabase/server'
import { searchJSearch } from '@/lib/jobs/jsearch'
import { JOBS_CACHE_TTL_MS } from '@/lib/jobs/config'
import type { JobPlatform } from '@/lib/jobs/platforms'
import type { JobSearchContext } from '@/lib/jobs/profile-context'
import { JOB_PLATFORMS } from '@/lib/jobs/platforms'
import { buildJobSearchContext } from '@/lib/jobs/profile-context'
import {
  buildPlatformSearchQuery,
  buildFallbackSearchQuery,
} from '@/lib/jobs/search-query'
import {
  normalizeJSearchResults,
  type NormalizedJob,
} from '@/lib/jobs/normalize'
import { getProfileData } from '@/lib/queries/profile'
import type { Tables } from '@/lib/database.types'

export type JobRow = Tables<'jobs'>

export type JobsFetchResult = {
  jobs: JobRow[]
  fromCache: boolean
  fetchedAt: string | null
  error: string | null
}

type PlatformCacheStatus = {
  latestFetchedAt: string | null
  fresh: boolean
  jobCount: number
}

function isCacheFresh(
  fetchedAt: string | null
): boolean {
  if (!fetchedAt) return false

  const timestamp = new Date(fetchedAt).getTime()

  if (Number.isNaN(timestamp)) {
    return false
  }

  return (
    Date.now() - timestamp <
    JOBS_CACHE_TTL_MS
  )
}

async function getPlatformCacheStatus(
  userId: string,
  platforms: JobPlatform[]
): Promise<
  Record<JobPlatform, PlatformCacheStatus>
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('platform, fetched_at')
    .eq('user_id', userId)
    .in('platform', platforms)

  if (error) {
    throw error
  }

  const status = Object.fromEntries(
    platforms.map((platform) => [
      platform,
      {
        latestFetchedAt: null,
        fresh: false,
        jobCount: 0,
      },
    ])
  ) as Record<
    JobPlatform,
    PlatformCacheStatus
  >

  for (const row of data ?? []) {
    const platform =
      row.platform as JobPlatform

    if (
      !platform ||
      !status[platform]
    ) {
      continue
    }

    status[platform].jobCount += 1

    const current =
      status[platform].latestFetchedAt

    if (
      !current ||
      new Date(row.fetched_at).getTime() >
        new Date(current).getTime()
    ) {
      status[platform].latestFetchedAt =
        row.fetched_at

      status[platform].fresh =
        isCacheFresh(row.fetched_at)
    }
  }

  return status
}

async function getCachedJobs(
  userId: string,
  platforms: JobPlatform[]
): Promise<JobRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .in('platform', platforms)
    .order('match_score', {
      ascending: false,
    })
    .order('fetched_at', {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data ?? []
}

async function upsertJobs(
  userId: string,
  jobs: NormalizedJob[]
): Promise<JobRow[]> {
  if (jobs.length === 0) {
    return []
  }

  const supabase = await createClient()

  const sourceUrls = jobs.map(
    (job) => job.source_url
  )

  const {
    data: existingJobs,
  } = await supabase
    .from('jobs')
    .select(
      'source_url, saved_status, applied_status'
    )
    .eq('user_id', userId)
    .in('source_url', sourceUrls)

  const statusByUrl = new Map(
    (existingJobs ?? []).map((job) => [
      job.source_url,
      {
        saved_status: job.saved_status,
        applied_status: job.applied_status,
      },
    ])
  )

  const fetchedAt =
    new Date().toISOString()

  const rows = jobs.map((job) => {
    const existing =
      statusByUrl.get(job.source_url)

    return {
      user_id: userId,
      platform: job.platform,
      title: job.title,
      company: job.company,
      company_logo: job.company_logo,
      location: job.location,
      salary: job.salary,
      job_type: job.job_type,
      experience_level:
        job.experience_level,
      description: job.description,
      tags: job.tags,
      match_score: job.match_score,
      job_url: job.job_url,
      source_url: job.source_url,
      fetched_at: fetchedAt,

      // Preserve user actions.
      saved_status:
        existing?.saved_status ?? false,

      applied_status:
        existing?.applied_status ?? false,
    }
  })

  const {
    data,
    error,
  } = await supabase
    .from('jobs')
    .upsert(rows, {
      onConflict: 'user_id,source_url',
    })
    .select('*')

  if (error) {
    throw error
  }

  return data ?? []
}

function getEmploymentType(
  jobType: string
): string | null {
  switch (jobType.toLowerCase()) {
    case 'full-time':
      return 'FULLTIME'

    case 'part-time':
      return 'PARTTIME'

    case 'contract':
      return 'CONTRACTOR'

    case 'internship':
      return 'INTERN'

    default:
      return null
  }
}

async function fetchPlatformJobs(
  platform: JobPlatform,
  context: JobSearchContext
): Promise<{
  jobs: NormalizedJob[]
  query: string
  fallbackUsed: boolean
}> {
  const primaryQuery =
    buildPlatformSearchQuery(
      platform,
      context
    )

  /*
   * Adzuna handles country through /jobs/in/.
   *
   * We only pass a location when the user has
   * selected a specific city/location.
   */
  const location =
    context.location &&
    context.location.toLowerCase() !==
      'remote' &&
    context.location.toLowerCase() !==
      'india'
      ? context.location
      : null

  console.log(
    `[Jobs] Fetching ${platform} with query: "${primaryQuery}"`
  )

  let results = await searchJSearch(
    primaryQuery,
    {
      remoteOnly:
        context.remoteOnly,

      employmentType:
        getEmploymentType(
          context.jobType
        ),

      location,
    }
  )

  let fallbackUsed = false

  /*
   * If no results are found for the primary
   * query, retry with a broader query.
   */
  if (results.length === 0) {
    console.log(
      `[Jobs] No results for "${primaryQuery}", trying fallback query...`
    )

    const fallbackQuery =
      buildFallbackSearchQuery(
        platform,
        context
      )

    if (
      fallbackQuery !== primaryQuery
    ) {
      results = await searchJSearch(
        fallbackQuery,
        {
          remoteOnly:
            context.remoteOnly,

          employmentType:
            getEmploymentType(
              context.jobType
            ),

          location,
        }
      )

      fallbackUsed = true

      console.log(
        `[Jobs] Fallback query "${fallbackQuery}" returned ${results.length} results`
      )
    }
  }

  return {
    query: fallbackUsed
      ? buildFallbackSearchQuery(
          platform,
          context
        )
      : primaryQuery,

    jobs: normalizeJSearchResults(
      results,
      platform,
      context
    ),

    fallbackUsed,
  }
}

async function fetchJobsFromJSearch(
  platforms: JobPlatform[],
  context: JobSearchContext
): Promise<{
  jobs: NormalizedJob[]
  errors: string[]
}> {
  const results =
    await Promise.allSettled(
      platforms.map((platform) =>
        fetchPlatformJobs(
          platform,
          context
        )
      )
    )

  const jobs: NormalizedJob[] = []
  const errors: string[] = []

  results.forEach(
    (result, index) => {
      const platform =
        platforms[index]

      if (
        result.status ===
        'fulfilled'
      ) {
        const {
          jobs: platformJobs,
          query,
          fallbackUsed,
        } = result.value

        console.log(
          `[Jobs] ${platform} query "${query}" returned ${platformJobs.length} jobs${
            fallbackUsed
              ? ' (fallback)'
              : ''
          }`
        )

        jobs.push(...platformJobs)

        return
      }

      const message =
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown Adzuna error.'

      console.error(
        `[Jobs] ${platform} failed:`,
        message
      )

      errors.push(
        `${platform}: ${message}`
      )
    }
  )

  console.log(
    `[Jobs] Total jobs fetched: ${jobs.length} from ${platforms.length} platforms`
  )

  return {
    jobs,
    errors,
  }
}

function dedupeJobs(
  jobs: JobRow[]
): JobRow[] {
  const seen = new Set<string>()

  return jobs.filter((job) => {
    const key =
      job.source_url || job.id

    if (seen.has(key)) {
      return false
    }

    seen.add(key)

    return true
  })
}

export async function getJobsForUser(
  userId: string,
  platforms: JobPlatform[] = [
    ...JOB_PLATFORMS,
  ],
  options?: {
    forceRefresh?: boolean
  }
): Promise<JobsFetchResult> {
  const selectedPlatforms =
    platforms.length > 0
      ? platforms
      : [...JOB_PLATFORMS]

  try {
    const profileData =
      await getProfileData(userId)

    const context =
      buildJobSearchContext(
        profileData
      )

    const cacheStatus =
      await getPlatformCacheStatus(
        userId,
        selectedPlatforms
      )

    const platformsToFetch =
      options?.forceRefresh
        ? selectedPlatforms
        : selectedPlatforms.filter(
            (platform) =>
              !cacheStatus[platform]
                .fresh
          )

    /*
     * Everything is already cached and fresh.
     */
    if (
      platformsToFetch.length === 0
    ) {
      const jobs =
        await getCachedJobs(
          userId,
          selectedPlatforms
        )

      const fetchedAt =
        selectedPlatforms
          .map(
            (platform) =>
              cacheStatus[platform]
                .latestFetchedAt
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
          .sort(
            (a, b) =>
              new Date(b).getTime() -
              new Date(a).getTime()
          )[0] ?? null

      return {
        jobs,
        fromCache: true,
        fetchedAt,
        error: null,
      }
    }

    /*
     * Fetch jobs from Adzuna.
     */
    const fetchResult =
      await fetchJobsFromJSearch(
        platformsToFetch,
        context
      )

    /*
     * Save newly fetched jobs.
     */
    if (
      fetchResult.jobs.length > 0
    ) {
      await upsertJobs(
        userId,
        fetchResult.jobs
      )
    }

    /*
     * Return all selected-platform jobs
     * from the database.
     */
    const jobs = dedupeJobs(
      await getCachedJobs(
        userId,
        selectedPlatforms
      )
    )

    const latestFetchedAt =
      jobs
        .map(
          (job) => job.fetched_at
        )
        .sort(
          (a, b) =>
            new Date(b).getTime() -
            new Date(a).getTime()
        )[0] ?? null

    const error =
      fetchResult.errors.length > 0
        ? fetchResult.errors.join(
            ' | '
          )
        : null

    return {
      jobs,
      fromCache: false,
      fetchedAt: latestFetchedAt,
      error,
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch jobs.'

    /*
     * If API fails but cached jobs exist,
     * still show the cached jobs.
     */
    try {
      const jobs = dedupeJobs(
        await getCachedJobs(
          userId,
          selectedPlatforms
        )
      )

      if (jobs.length > 0) {
        return {
          jobs,
          fromCache: true,
          fetchedAt:
            jobs[0]?.fetched_at ??
            null,
          error: message,
        }
      }
    } catch {
      // Fall through to empty response.
    }

    return {
      jobs: [],
      fromCache: false,
      fetchedAt: null,
      error: message,
    }
  }
}

export async function getRecentJobActivity(
  userId: string,
  limit = 5
) {
  const supabase =
    await createClient()

  const {
    data,
    error,
  } = await supabase
    .from('jobs')
    .select(
      `
        id,
        title,
        company,
        platform,
        saved_status,
        applied_status,
        fetched_at,
        created_at
      `
    )
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    })
    .limit(limit)

  if (error) {
    throw error
  }

  return data ?? []
}