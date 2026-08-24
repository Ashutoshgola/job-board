'use client'

import { useMemo, useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'

import { JobsEmptyState } from '@/components/jobs/jobs-empty-state'
import { JobsErrorState } from '@/components/jobs/jobs-error-state'
import { JobList } from '@/components/jobs/job-list'
import { JobsSkeleton } from '@/components/jobs/jobs-skeleton'
import { PlatformCards } from '@/components/jobs/platform-cards'
import { RecentActivity } from '@/components/jobs/recent-activity'
import { WelcomeBanner } from '@/components/jobs/welcome-banner'
import { ProfileCompletenessCard } from '@/components/profile/profile-completeness-card'
import { Button } from '@/components/ui/button'
import { loadJobsAction, refreshJobsAction } from '@/lib/actions/jobs'
import type { JobPlatform } from '@/lib/jobs/platforms'
import { JOB_PLATFORMS } from '@/lib/jobs/platforms'
import type { ProfileCompleteness } from '@/lib/profile/completeness'
import type { JobRow } from '@/lib/queries/jobs'

type ActivityItem = {
  id: string
  title: string
  company: string | null
  platform: string
  saved_status: boolean
  applied_status: boolean
  fetched_at: string
  created_at: string
}

type JobsDashboardProps = {
  initialJobs: JobRow[]
  initialFromCache: boolean
  initialFetchedAt: string | null
  initialError: string | null
  firstName: string | null
  role: string
  completeness: ProfileCompleteness
  activity: ActivityItem[]
  profileIncomplete: boolean
}

export function JobsDashboard({
  initialJobs,
  initialFromCache,
  initialFetchedAt,
  initialError,
  firstName,
  role,
  completeness,
  activity,
  profileIncomplete,
}: JobsDashboardProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [selectedPlatforms, setSelectedPlatforms] = useState<JobPlatform[]>([
    ...JOB_PLATFORMS,
  ])
  const [fromCache, setFromCache] = useState(initialFromCache)
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt)
  const [error, setError] = useState(initialError)
  const [isRefreshing, startRefresh] = useTransition()

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) =>
        selectedPlatforms.includes(job.platform as JobPlatform)
      ),
    [jobs, selectedPlatforms]
  )

  function handleSavedChange(jobId: string, saved: boolean) {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, saved_status: saved } : job
      )
    )
  }

  function handlePlatformsChange(nextPlatforms: JobPlatform[]) {
    setSelectedPlatforms(nextPlatforms)

    startRefresh(async () => {
      setError(null)
      const result = await loadJobsAction(nextPlatforms)

      if (!result.success) {
        setError(result.error)
        return
      }

      setJobs(result.data.jobs)
      setFromCache(result.data.fromCache)
      setFetchedAt(result.data.fetchedAt)
      setError(result.data.error)
    })
  }

  function handleRefresh() {
    startRefresh(async () => {
      setError(null)
      const result = await refreshJobsAction(selectedPlatforms)

      if (!result.success) {
        setError(result.error)
        return
      }

      setJobs(result.data.jobs)
      setFromCache(result.data.fromCache)
      setFetchedAt(result.data.fetchedAt)
      setError(result.data.error)
    })
  }

  return (
    <div className="space-y-6">
      <WelcomeBanner
        firstName={firstName}
        role={role}
        fromCache={fromCache}
        fetchedAt={fetchedAt}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PlatformCards
              selected={selectedPlatforms}
              onChange={handlePlatformsChange}
              disabled={isRefreshing}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="shrink-0"
          >
            <RefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            Refresh jobs
          </Button>
        </div>
      </div>

      {error && (
        <JobsErrorState
          message={error}
          onRetry={handleRefresh}
          isRetrying={isRefreshing}
        />
      )}

      {isRefreshing ? (
        <JobsSkeleton />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {filteredJobs.length > 0 ? (
              <JobList jobs={filteredJobs} onSavedChange={handleSavedChange} />
            ) : (
              <JobsEmptyState incompleteProfile={profileIncomplete} />
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <ProfileCompletenessCard completeness={completeness} />
            <RecentActivity activity={activity} />
          </aside>
        </div>
      )}
    </div>
  )
}
