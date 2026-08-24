import Link from 'next/link'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  children: React.ReactNode
  title: string
  description: string
  footer: React.ReactNode
}

export function AuthShell({ children, title, description, footer }: AuthShellProps) {
  return (
    <div className="flex min-h-full flex-1">
      <div className="relative hidden w-1/2 overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.35_0.08_260)_0%,_transparent_55%),radial-gradient(ellipse_at_bottom_right,_oklch(0.28_0.06_200)_0%,_transparent_50%)]"
        />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
              JB
            </span>
            JobBoard
          </Link>
        </div>
        <div className="relative max-w-md space-y-4">
          <p className="text-sm font-medium tracking-wide text-white/60 uppercase">
            Find your next role
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white text-balance">
            Discover opportunities that match your skills and ambition.
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            Create an account to track applications, save jobs, and manage your
            hiring pipeline from one dashboard.
          </p>
        </div>
        <p className="relative text-sm text-white/40">
          Trusted by teams hiring across tech, design, and product.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                JB
              </span>
              JobBoard
            </Link>
          </div>

          <div className="mb-8 space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {children}

          <p className={cn('mt-8 text-center text-sm text-muted-foreground')}>
            {footer}
          </p>
        </div>
      </div>
    </div>
  )
}
