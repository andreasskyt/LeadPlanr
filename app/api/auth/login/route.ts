import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { requireCSRF, generateCSRFToken, setCSRFToken } from '@/lib/csrf'
import pool from '@/lib/db'
import { generateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfError = requireCSRF(request)
    if (csrfError) return csrfError

    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      )
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    )

    const user = result.rows[0]

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Create response with user data
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone
    })

    // Set JWT token in cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 1 week
    })

    // Generate new CSRF token
    const newToken = generateCSRFToken()
    return setCSRFToken(response, newToken)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
} 