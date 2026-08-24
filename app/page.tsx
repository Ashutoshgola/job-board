import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              JB
            </span>
            JobBoard
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: 'sm' }))}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            Modern job search
          </p>
          <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
            Find roles you love. Track every application.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            JobBoard helps you discover opportunities, save listings, and manage
            your hiring pipeline from a single dashboard.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: 'lg' }), 'h-10 text-sm')}
            >
              Create free account
            </Link>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'h-10 text-sm'
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
