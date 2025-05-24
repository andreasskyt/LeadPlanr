import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'

// Routes that require authentication
const protectedRoutes = ['/dashboard']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')
  const isHomePage = pathname.startsWith('/home')

  // Check if the route requires authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify token
      verifyToken(token.value)
    } catch (error) {
      // Token is invalid or expired
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // If trying to access /home without being logged in, redirect to login
  if (isHomePage && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
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