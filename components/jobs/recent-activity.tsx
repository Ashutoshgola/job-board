import { Bookmark, RefreshCw, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PLATFORM_CONFIG } from '@/lib/jobs/platforms'

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

type RecentActivityProps = {
  activity: ActivityItem[]
}

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function RecentActivity({ activity }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Latest job discoveries and saves.</CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Search className="size-5 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Job activity will appear here after your first search.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {activity.map((item) => {
              const platform =
                PLATFORM_CONFIG[item.platform as keyof typeof PLATFORM_CONFIG]

              return (
                <li
                  key={item.id}
                  className="rounded-lg border border-border/70 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{item.title}</p>
                      <p className="truncate text-[0.625rem] text-muted-foreground">
                        {item.company ?? 'Unknown company'}
                      </p>
                    </div>
                    {platform && (
                      <Badge className={platform.badgeClass}>{platform.name}</Badge>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[0.625rem] text-muted-foreground">
                    {item.saved_status && (
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="size-2.5" />
                        Saved
                      </span>
                    )}
                    {!item.saved_status && !item.applied_status && (
                      <span className="inline-flex items-center gap-1">
                        <RefreshCw className="size-2.5" />
                        Discovered
                      </span>
                    )}
                    <span>{formatWhen(item.created_at)}</span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
