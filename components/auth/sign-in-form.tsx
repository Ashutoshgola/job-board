'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { signIn, type AuthActionState } from '@/lib/actions/auth'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

type SignInFormProps = {
  next?: string
}

const initialState: AuthActionState = {}

export function SignInForm({ next = '/dashboard' }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <div className="space-y-6">
      <GoogleAuthButton next={next} />

      <div className="relative">
        <Separator />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
          or continue with email
        </span>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            required
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="h-10 text-sm"
          />
        </div>

        {state.error ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="h-10 w-full text-sm"
          disabled={pending}
        >
          {pending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href={`/sign-up${next !== '/dashboard' ? `?next=${encodeURIComponent(next)}` : ''}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
