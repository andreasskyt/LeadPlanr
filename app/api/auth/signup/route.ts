import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import bcrypt from 'bcrypt'
import { requireCSRF, generateCSRFToken, setCSRFToken } from '@/lib/csrf'
import pool from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Verify CSRF token
    const csrfError = requireCSRF(request)
    if (csrfError) return csrfError

    const { email, password, firstName, lastName, phone } = await request.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, phone',
      [email, passwordHash, firstName, lastName, phone]
    )

    const user = result.rows[0]

    // Generate new CSRF token
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone
    })

    // Set new CSRF token
    const newToken = generateCSRFToken()
    return setCSRFToken(response, newToken)
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
} 