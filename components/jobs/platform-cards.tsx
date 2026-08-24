'use client'

import { cn } from '@/lib/utils'
import type { JobPlatform } from '@/lib/jobs/platforms'
import { JOB_PLATFORMS, PLATFORM_CONFIG } from '@/lib/jobs/platforms'
import { Check } from 'lucide-react'

type PlatformCardsProps = {
  selected: JobPlatform[]
  onChange: (platforms: JobPlatform[]) => void
  disabled?: boolean
}

export function PlatformCards({
  selected,
  onChange,
  disabled = false,
}: PlatformCardsProps) {
  function togglePlatform(platform: JobPlatform) {
    if (disabled) return

    if (selected.includes(platform)) {
      const next = selected.filter((item) => item !== platform)
      onChange(next.length > 0 ? next : [platform])
      return
    }

    onChange([...selected, platform])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium">Job platforms</h2>
          <p className="text-xs text-muted-foreground">
            Select platforms to include in your search.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...JOB_PLATFORMS])}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          Select all
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {JOB_PLATFORMS.map((platform) => {
          const config = PLATFORM_CONFIG[platform]
          const isSelected = selected.includes(platform)

          return (
            <button
              key={platform}
              type="button"
              disabled={disabled}
              onClick={() => togglePlatform(platform)}
              className={cn(
                'group relative rounded-xl border p-4 text-left transition-all',
                config.accentClass,
                isSelected
                  ? 'ring-2 ring-primary/30'
                  : 'opacity-70 hover:opacity-100',
                disabled && 'pointer-events-none opacity-50'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{config.name}</p>
                  <p className="mt-1 text-[0.625rem] text-muted-foreground">
                    {config.siteQuery}
                  </p>
                </div>
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background'
                  )}
                >
                  {isSelected && <Check className="size-3" />}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
