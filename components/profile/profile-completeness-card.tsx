'use client'

import { cn } from '@/lib/utils'
import {
  getProgressColors,
  type ProfileCompleteness,
  type ProfileSectionId,
} from '@/lib/profile/completeness'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type ProfileCompletenessCardProps = {
  completeness: ProfileCompleteness
  showReviewHint?: boolean
  className?: string
  onSectionClick?: (sectionId: ProfileSectionId) => void
}

const CIRCLE_RADIUS = 54
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

export function ProfileCompletenessCard({
  completeness,
  showReviewHint = false,
  className,
  onSectionClick,
}: ProfileCompletenessCardProps) {
  const colors = getProgressColors(completeness.percentage)
  const strokeOffset =
    CIRCLE_CIRCUMFERENCE -
    (completeness.percentage / 100) * CIRCLE_CIRCUMFERENCE

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Profile completeness</CardTitle>
        <CardDescription>
          Complete your profile to improve job matches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-36">
            <svg
              viewBox="0 0 120 120"
              className="size-full -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx="60"
                cy="60"
                r={CIRCLE_RADIUS}
                fill="none"
                strokeWidth="10"
                className="stroke-muted"
              />
              <circle
                cx="60"
                cy="60"
                r={CIRCLE_RADIUS}
                fill="none"
                strokeWidth="10"
                strokeLinecap="round"
                className={cn('transition-all duration-500', colors.ring)}
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-semibold tabular-nums', colors.text)}>
                {completeness.percentage}%
              </span>
              <span className="text-xs text-muted-foreground">complete</span>
            </div>
          </div>
          <Badge className={colors.badge}>{colors.label}</Badge>
        </div>

        {showReviewHint && (
          <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            We pre-filled details from your resume. Review each tab and add
            anything that&apos;s missing.
          </p>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground">Sections</p>
          <ul className="space-y-1.5">
            {completeness.sections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSectionClick?.(section.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                    onSectionClick && 'hover:bg-muted/70',
                    section.complete
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  <span>{section.label}</span>
                  <span
                    className={cn(
                      'font-medium tabular-nums',
                      section.complete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    )}
                  >
                    {section.complete ? 'Done' : 'Incomplete'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
