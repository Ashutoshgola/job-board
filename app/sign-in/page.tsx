import { AuthShell } from '@/components/auth/auth-shell'
import { SignInForm } from '@/components/auth/sign-in-form'

type SignInPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { next } = await searchParams
  const destination =
    next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access your dashboard and manage your job search."
      footer={
        <>
          By continuing, you agree to our{' '}
          <span className="text-foreground">Terms</span> and{' '}
          <span className="text-foreground">Privacy Policy</span>.
        </>
      }
    >
      <SignInForm next={destination} />
    </AuthShell>
  )
}
