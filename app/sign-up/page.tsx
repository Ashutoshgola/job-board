import { AuthShell } from '@/components/auth/auth-shell'
import { SignUpForm } from '@/components/auth/sign-up-form'

type SignUpPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { next } = await searchParams
  const destination =
    next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  return (
    <AuthShell
      title="Create your account"
      description="Join JobBoard to save roles, track applications, and land your next job."
      footer={
        <>
          By creating an account, you agree to our{' '}
          <span className="text-foreground">Terms</span> and{' '}
          <span className="text-foreground">Privacy Policy</span>.
        </>
      }
    >
      <SignUpForm next={destination} />
    </AuthShell>
  )
}
