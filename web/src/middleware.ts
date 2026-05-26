import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  const isAuthPath = pathname.startsWith('/auth')

  // No token → send to login (except for auth pages themselves)
  if (!token && !isAuthPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Has valid token → don't re-show auth pages
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/offers', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Run on all routes except Next.js internals, static assets, and API routes
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|api/).*)',
  ],
}
