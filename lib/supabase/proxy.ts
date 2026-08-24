import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/sign-in', '/sign-up']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const path = request.nextUrl.pathname

  if (protectedRoutes.some((r) => path.startsWith(r)) && !user) {
    const url = new URL('/sign-in', request.url)
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  if (authRoutes.some((r) => path.startsWith(r)) && user) {
    const next = request.nextUrl.searchParams.get('next')
    const destination =
      next?.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return response
}