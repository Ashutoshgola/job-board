'use client'

import Image from 'next/image'
import { Bookmark, ExternalLink, MapPin, Briefcase, DollarSign } from 'lucide-react'
import { useTransition } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toggleSavedJobAction } from '@/lib/actions/jobs'
import { PLATFORM_CONFIG } from '@/lib/jobs/platforms'
import type { JobRow } from '@/lib/queries/jobs'
import { cn } from '@/lib/utils'

type JobCardProps = {
  job: JobRow
  onSavedChange?: (jobId: string, saved: boolean) => void
}

function getMatchColor(score: number) {
  if (score >= 85) return 'bg-emerald-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 55) return 'bg-amber-500'
  return 'bg-muted-foreground/60'
}

function parseTags(tags: JobRow['tags']): string[] {
  if (Array.isArray(tags)) {
    return tags.filter((tag): tag is string => typeof tag === 'string')
  }
  return []
}

export function JobCard({ job, onSavedChange }: JobCardProps) {
  const [isPending, startTransition] = useTransition()
  const platform = PLATFORM_CONFIG[job.platform as keyof typeof PLATFORM_CONFIG]
  const tags = parseTags(job.tags)
  const matchScore = Math.round(Number(job.match_score))

  function handleSave() {
    const nextSaved = !job.saved_status
    startTransition(async () => {
      const result = await toggleSavedJobAction(job.id, nextSaved)
      if (result.success) {
        onSavedChange?.(job.id, nextSaved)
      }
    })
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-sm">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40">
            {job.company_logo ? (
              <Image
                src={job.company_logo}
                alt={job.company ?? 'Company logo'}
                width={44}
                height={44}
                className="size-11 object-contain p-1.5"
                unoptimized
              />
            ) : (
              <Briefcase className="size-4 text-muted-foreground" />
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-medium">{job.title}</h3>
              {platform && (
                <Badge className={cn('shrink-0', platform.badgeClass)}>
                  {platform.name}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {job.company ?? 'Company not listed'}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">{matchScore}%</p>
            <p className="text-[0.625rem] text-muted-foreground">match</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', getMatchColor(matchScore))}
              style={{ width: `${matchScore}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {job.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {job.location}
            </span>
          )}
          {job.salary && (
            <span className="inline-flex items-center gap-1">
              <DollarSign className="size-3" />
              {job.salary}
            </span>
          )}
          {job.job_type && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="size-3" />
              {job.job_type}
            </span>
          )}
          {job.experience_level && (
            <Badge variant="outline">{job.experience_level}</Badge>
          )}
          <Badge variant="outline">{job.required_experience}</Badge>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            render={
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Apply Now
            <ExternalLink data-icon="inline-end" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={job.saved_status ? 'secondary' : 'outline'}
            onClick={handleSave}
            disabled={isPending}
          >
            <Bookmark
              className={cn('size-3', job.saved_status && 'fill-current')}
            />
            {job.saved_status ? 'Saved' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
