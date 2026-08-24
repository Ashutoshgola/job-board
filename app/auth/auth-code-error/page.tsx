import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication failed
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t sign you in. The link may have expired or already
            been used. Please try again.
          </p>
        </div>
        <Link
          href="/sign-in"
          className={cn(buttonVariants({ size: 'lg' }), 'inline-flex h-10 text-sm')}
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
