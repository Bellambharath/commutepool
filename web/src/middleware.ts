import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value
  const { pathname } = request.nextUrl

  const isAuthPath = pathname.startsWith('/auth')

  // No token → redirect to login (except auth pages)
  if (!token && !isAuthPath) {
    const loginUrl = new URL('/auth/login', request.url)
    const res = NextResponse.redirect(loginUrl)
    // Prevent this redirect response from being cached
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  }

  // Has token → don't show auth pages again
  if (token && isAuthPath) {
    const offersUrl = new URL('/offers', request.url)
    const res = NextResponse.redirect(offersUrl)
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return res
  }

  // Pass through — also strip CDN cache for protected pages
  const res = NextResponse.next()
  if (!isAuthPath) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - icons/
     * - manifest.json
     * - api/          (API routes handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest\.json|api/).*)',
  ],
}
