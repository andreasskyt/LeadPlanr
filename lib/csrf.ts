import { randomBytes } from 'crypto'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'your-csrf-secret-key'

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex')
}

export function setCSRFToken(response: NextResponse, token: string): NextResponse {
  // Set token in cookie
  response.cookies.set('csrf-token', token, {
    httpOnly: false, // For development
    secure: false, // For development
    sameSite: 'lax',
    path: '/',
    maxAge: 3600 // 1 hour
  })

  // Also set token in header for easier debugging
  response.headers.set('x-csrf-token', token)

  console.log('Setting CSRF token:', {
    token,
    cookie: response.cookies.get('csrf-token'),
    header: response.headers.get('x-csrf-token')
  })

  return response
}

export function verifyCSRFToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get('csrf-token')?.value
  const headerToken = request.headers.get('x-csrf-token')

  console.log('Verifying CSRF token:', {
    hasCookieToken: !!cookieToken,
    hasHeaderToken: !!headerToken,
    cookieToken,
    headerToken,
    allCookies: Array.from(request.cookies.getAll()).map(c => ({ name: c.name, value: c.value }))
  })

  if (!cookieToken || !headerToken) {
    console.error('Missing CSRF token:', { cookieToken, headerToken })
    return false
  }

  if (cookieToken !== headerToken) {
    console.error('CSRF token mismatch:', { cookieToken, headerToken })
    return false
  }

  return true
}

export function requireCSRF(request: NextRequest): NextResponse | null {
  if (!verifyCSRFToken(request)) {
    console.error('CSRF verification failed')
    return NextResponse.json(
      { error: 'CSRF verification failed' },
      { status: 403 }
    )
  }
  return null
} 