'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { exchangeMicrosoftToken, exchangeGoogleToken } from '@/lib/oauth'
import { calendarAccounts, query } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { encrypt } from '@/lib/encryption'

export default async function OAuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; state?: string; error?: string }
}) {
  const { code, state, error } = searchParams
  console.log('OAuth callback received:', { code: code?.substring(0, 10) + '...', state, error })

  if (error) {
    console.error('OAuth error:', error)
    redirect('/home/settings?error=oauth_failed')
  }

  if (!code || !state) {
    console.error('Missing code or state:', { code: !!code, state: !!state })
    redirect('/home/settings?error=invalid_callback')
  }

  try {
    // Test database connection
    console.log('Testing database connection...')
    try {
      const testResult = await query('SELECT current_user, current_database()')
      console.log('Database connection test:', {
        user: testResult.rows[0].current_user,
        database: testResult.rows[0].current_database
      })
    } catch (dbError) {
      console.error('Database connection test failed:', dbError)
      throw dbError
    }

    // Get user from JWT token
    const token = cookies().get('token')?.value
    if (!token) {
      console.error('No authentication token found')
      redirect('/home/settings?error=not_authenticated')
    }

    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      console.error('Invalid authentication token')
      redirect('/home/settings?error=not_authenticated')
    }

    console.log('User authenticated:', { userId: decoded.userId })

    let tokenResponse
    let provider: 'Microsoft' | 'Google'

    if (state === 'microsoft') {
      console.log('Exchanging Microsoft token...')
      tokenResponse = await exchangeMicrosoftToken(code)
      provider = 'Microsoft'
    } else if (state === 'google') {
      console.log('Exchanging Google token...')
      tokenResponse = await exchangeGoogleToken(code)
      provider = 'Google'
    } else {
      console.error('Invalid state:', state)
      redirect('/home/settings?error=invalid_state')
    }

    console.log('Token response received:', {
      hasAccessToken: !!tokenResponse.access_token,
      hasRefreshToken: !!tokenResponse.refresh_token,
      expiresIn: tokenResponse.expires_in
    })

    // Encrypt the refresh token before storing
    const encryptedRefreshToken = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null
    console.log('Refresh token encrypted:', !!encryptedRefreshToken)

    // Save the calendar account to the database
    console.log('Saving calendar account...')
    try {
      const savedAccount = await calendarAccounts.create({
        provider,
        access_token: tokenResponse.access_token,
        refresh_token: encryptedRefreshToken,
        valid_from: new Date(),
        valid_to: new Date(Date.now() + tokenResponse.expires_in * 1000),
        user_id: decoded.userId
      })
      console.log('Calendar account saved:', { id: savedAccount.id })
    } catch (dbError) {
      console.error('Database error details:', {
        error: dbError,
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined
      })
      throw dbError
    }

    redirect('/home/settings?success=calendar_added')
  } catch (error) {
    console.error('Error during OAuth callback:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    redirect('/home/settings?error=token_exchange_failed')
  }
}
