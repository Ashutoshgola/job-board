export type AdzunaJob = {
  id?: string | number
  title?: string | null
  description?: string | null
  redirect_url?: string | null
  created?: string | null

  company?: {
    display_name?: string | null
  } | null

  location?: {
    display_name?: string | null
    area?: string[]
  } | null

  category?: {
    label?: string | null
    tag?: string | null
  } | null

  salary_min?: number | null
  salary_max?: number | null
  salary_is_predicted?: number | null

  contract_time?: string | null
  contract_type?: string | null
}

export type AdzunaResponse = {
  results?: AdzunaJob[]
  count?: number
  mean?: number
  __CLASS__?: string
}

export type AdzunaOptions = {
  location?: string | null
  remoteOnly?: boolean
  employmentType?: string | null
  page?: number
  resultsPerPage?: number
}

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api'

function getAppId(): string {
  const appId = process.env.ADZUNA_APP_ID?.trim()

  if (!appId) {
    throw new Error(
      'Adzuna API is not configured. Add ADZUNA_APP_ID to your server-side .env file and restart Next.js.'
    )
  }

  return appId
}

function getAppKey(): string {
  const appKey = process.env.ADZUNA_APP_KEY?.trim()

  if (!appKey) {
    throw new Error(
      'Adzuna API is not configured. Add ADZUNA_APP_KEY to your server-side .env file and restart Next.js.'
    )
  }

  return appKey
}

function getErrorMessage(
  status: number,
  body: string
): string {
  let detail = body

  try {
    const parsed = JSON.parse(body) as {
      display?: string
      error?: string
      message?: string
    }

    detail =
      parsed.display ??
      parsed.message ??
      parsed.error ??
      body
  } catch {
    // Keep raw response.
  }

  if (status === 401 || status === 403) {
    return (
      `Adzuna authentication failed (${status}). ` +
      `Check ADZUNA_APP_ID and ADZUNA_APP_KEY. ` +
      `Error: ${detail.slice(0, 300)}`
    )
  }

  if (status === 429) {
    return 'Adzuna rate limit reached. Please wait and try again.'
  }

  if (status === 400) {
    return (
      `Adzuna rejected the request (400). ` +
      `Check the search parameters. ` +
      `Error: ${detail.slice(0, 300)}`
    )
  }

  return (
    `Adzuna request failed (${status}). ` +
    detail.slice(0, 300)
  )
}

function getCountryCode(): string {
  // JobBuddy currently targets Indian jobs.
  return 'in'
}

function buildSearchQuery(query: string): string {
  return query
    .replace(/\s+/g, ' ')
    .replace(/[|]+/g, ' ')
    .trim()
}

function buildSalaryLabel(
  job: AdzunaJob
): string | null {
  const min = job.salary_min
  const max = job.salary_max

  if (
    typeof min === 'number' &&
    typeof max === 'number'
  ) {
    return `₹${min.toLocaleString(
      'en-IN'
    )} - ₹${max.toLocaleString('en-IN')}`
  }

  if (typeof min === 'number') {
    return `₹${min.toLocaleString('en-IN')}+`
  }

  if (typeof max === 'number') {
    return `Up to ₹${max.toLocaleString('en-IN')}`
  }

  return null
}

/**
 * Search jobs using the Adzuna API.
 *
 * Kept as `searchJSearch` intentionally so the rest of the
 * JobBuddy codebase does not need to be renamed immediately.
 *
 * Adzuna endpoint:
 *
 * /v1/api/jobs/{country}/search/{page}
 *
 * Example:
 *
 * what=full stack developer
 * where=Bangalore
 */
export async function searchJSearch(
  query: string,
  options: AdzunaOptions = {}
): Promise<AdzunaJob[]> {
  const appId = getAppId()
  const appKey = getAppKey()

  const cleanQuery = buildSearchQuery(query)

  if (!cleanQuery) {
    throw new Error(
      'Search query cannot be empty.'
    )
  }

  const country = getCountryCode()

  const page = Math.max(
    1,
    options.page ?? 1
  )

  const resultsPerPage = Math.min(
    50,
    Math.max(
      1,
      options.resultsPerPage ?? 20
    )
  )

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: String(resultsPerPage),
    what: cleanQuery,
    'content-type': 'application/json',
  })

  /*
   * Location
   *
   * The country is already specified in:
   *
   * /jobs/in/search/1
   *
   * Therefore we only send `where` when the user has
   * selected a specific location such as:
   *
   * Bangalore
   * Delhi
   * Mumbai
   */
  if (
    options.location &&
    options.location.trim()
  ) {
    const location =
      options.location.trim()

    if (
      location.toLowerCase() !== 'india'
    ) {
      params.set('where', location)
    }
  }

  /*
   * Employment type
   *
   * Adzuna does not use the same enum as JSearch.
   */
  if (options.employmentType) {
    switch (options.employmentType) {
      case 'FULLTIME':
        params.set('full_time', '1')
        break

      case 'PARTTIME':
        params.set('part_time', '1')
        break

      case 'CONTRACTOR':
        params.set('contract', '1')
        break

      case 'INTERN':
        /*
         * Adzuna does not provide the same internship
         * filter. Internship is handled through the
         * search query itself.
         */
        break
    }
  }

  /*
   * Remote jobs
   *
   * Adzuna does not have the same `remoteOnly` parameter
   * as JSearch.
   *
   * We therefore add remote-related terms to the query.
   */
  if (options.remoteOnly) {
    params.set(
      'what',
      `${cleanQuery} remote`
    )
  }

  const url =
    `${ADZUNA_BASE_URL}/jobs/${country}/search/${page}?` +
    params.toString()

  console.log(
    `[Adzuna] Query: "${cleanQuery}"`
  )

  console.log(
    `[Adzuna] Location: ${
      options.location ?? 'India'
    }`
  )

  console.log(
    `[Adzuna] Page: ${page}`
  )

  console.log(
    `[Adzuna] Results per page: ${resultsPerPage}`
  )

  console.log(
    `[Adzuna] Remote only: ${
      options.remoteOnly ?? false
    }`
  )

  let response: Response

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
  } catch (error) {
    console.error(
      '[Adzuna] Network error:',
      error
    )

    throw new Error(
      'Unable to connect to Adzuna. Please check your internet connection and try again.'
    )
  }

  if (!response.ok) {
    const body = await response.text()

    console.error(
      `[Adzuna] API Error (${response.status}):`,
      body
    )

    throw new Error(
      getErrorMessage(
        response.status,
        body
      )
    )
  }

  let body: AdzunaResponse

  try {
    body =
      (await response.json()) as AdzunaResponse
  } catch (error) {
    console.error(
      '[Adzuna] JSON parsing error:',
      error
    )

    throw new Error(
      'Adzuna returned an invalid JSON response.'
    )
  }

  if (
    !body ||
    !Array.isArray(body.results)
  ) {
    console.error(
      '[Adzuna] Invalid response:',
      body
    )

    throw new Error(
      'Adzuna returned an invalid response: results array is missing.'
    )
  }

  console.log(
    `[Adzuna] Found ${body.results.length} jobs for "${cleanQuery}"`
  )

  /*
   * Debug information.
   *
   * This helps us verify that Adzuna is actually
   * returning useful job records.
   */
  if (body.results.length > 0) {
    const firstJob = body.results[0]

    console.log(
      '[Adzuna] First job:',
      {
        id: firstJob.id,
        title: firstJob.title,
        company:
          firstJob.company?.display_name,
        location:
          firstJob.location?.display_name,
        salary: buildSalaryLabel(firstJob),
        contractType:
          firstJob.contract_type,
        contractTime:
          firstJob.contract_time,
        url:
          firstJob.redirect_url,
      }
    )
  }

  return body.results
}