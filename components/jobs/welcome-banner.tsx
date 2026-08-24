import { Sparkles } from 'lucide-react'

type WelcomeBannerProps = {
  firstName: string | null
  role: string
  fromCache: boolean
  fetchedAt: string | null
}

function formatFetchedAt(value: string | null): string | null {
  if (!value) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function WelcomeBanner({
  firstName,
  role,
  fromCache,
  fetchedAt,
}: WelcomeBannerProps) {
  const greeting = firstName ? `Welcome back, ${firstName}` : 'Welcome back'
  const cacheLabel = formatFetchedAt(fetchedAt)

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background p-6">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[0.625rem] font-medium text-primary">
            <Sparkles className="size-3" />
            AI Job Application Agent
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Top matches for <span className="font-medium text-foreground">{role}</span>{' '}
              across Greenhouse, Lever, Workable, and Wellfound — ranked by your profile.
            </p>
          </div>
        </div>
        {cacheLabel && (
          <p className="shrink-0 text-xs text-muted-foreground">
            {fromCache ? 'Cached results from' : 'Updated'} {cacheLabel}
          </p>
        )}
      </div>
    </div>
  )
}
