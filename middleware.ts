import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt'

// Routes that require authentication
const protectedRoutes = ['/home']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')

  console.log('[MIDDLEWARE] Path:', pathname)
  console.log('[MIDDLEWARE] Token:', token?.value)
  
  // Check if the route requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      console.log('[MIDDLEWARE] No token found, redirecting to /login')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify token using Edge-compatible function
      await verifyTokenEdge(token.value)
      console.log('[MIDDLEWARE] Token verified successfully')
    } catch (error) {
      // Token is invalid or expired
      console.error('[MIDDLEWARE] Token verification failed:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
    '/home/:path*'
  ],
} 