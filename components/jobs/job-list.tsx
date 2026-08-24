import { JobCard } from '@/components/jobs/job-card'
import type { JobRow } from '@/lib/queries/jobs'

type JobListProps = {
  jobs: JobRow[]
  onSavedChange?: (jobId: string, saved: boolean) => void
}

export function JobList({ jobs, onSavedChange }: JobListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Top job matches</h2>
          <p className="text-xs text-muted-foreground">
            {jobs.length} {jobs.length === 1 ? 'role' : 'roles'} ranked by profile fit
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onSavedChange={onSavedChange} />
        ))}
      </div>
    </div>
  )
}
