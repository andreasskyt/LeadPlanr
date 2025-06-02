import { NextRequest, NextResponse } from 'next/server'
import { exchangeGoogleToken, exchangeMicrosoftToken, getGoogleUserInfo, getMicrosoftUserInfo } from '@/lib/oauth'
import { generateToken } from '@/lib/jwt'
import pool from '@/lib/db'
import { encrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const origin = req.nextUrl.origin

  if (error) {
    console.error('OAuth error:', error)
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
  }

  if (!code) {
    console.error('Missing code')
    return NextResponse.redirect(`${origin}/login?error=invalid_request`)
  }

  if (!state) {
    console.error('Missing state')
    return NextResponse.redirect(`${origin}/login?error=invalid_request`)
  }

  try {
    let tokenResponse
    let userInfo
    let provider: 'google' | 'microsoft'

    if (state === 'google') {
      console.log('Exchanging Google token...')
      tokenResponse = await exchangeGoogleToken(code)
      if (!tokenResponse.id_token) {
        throw new Error('Missing id_token from Google token response')
      }
      userInfo = await getGoogleUserInfo(tokenResponse.id_token)
      provider = 'google'
    } else if (state === 'microsoft') {
      console.log('Exchanging Microsoft token...')
      tokenResponse = await exchangeMicrosoftToken(code)
      userInfo = await getMicrosoftUserInfo(tokenResponse.access_token)
      provider = 'microsoft'
    } else {
      console.error('Invalid state:', state)
      return NextResponse.redirect(`${origin}/login?error=invalid_state`)
    }

    // Get or create user by email only
    const result = await pool.query(
      `INSERT INTO users (
        email,
        first_name,
        last_name
      ) VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE
      SET first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      RETURNING id, email, first_name, last_name`,
      [userInfo.email, userInfo.firstName, userInfo.lastName]
    )

    const user = result.rows[0]
    const scopes = tokenResponse.scope || '';

    console.log('[OAuth callback] Scopes insert:', {
      provider,
      accessToken: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      userId: user.id,
      oauthId: userInfo.id,
      scopes,
    });

    // Prepare values for calendar_accounts
    let accessToken = null;
    let encryptedRefreshToken = null;
    let validFrom = null;
    let validTo = null;
    let calendarAccess = false;

    if (tokenResponse.refresh_token) {
      // Only save access_token if we have more than minimal scopes
      accessToken = tokenResponse.access_token;
      encryptedRefreshToken = encrypt(tokenResponse.refresh_token);
      validFrom = new Date();
      validTo = tokenResponse.expires_in ? new Date(Date.now() + tokenResponse.expires_in * 1000) : null;
      calendarAccess = true;

      // Save calendar account
      await pool.query(
        `INSERT INTO calendar_accounts (
          provider,
          access_token,
          refresh_token,
          valid_from,
          valid_to,
          user_id,
          oauth_id,
          scopes,
          calendar_access
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (user_id, provider, oauth_id) DO UPDATE
        SET access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            valid_from = EXCLUDED.valid_from,
            valid_to = EXCLUDED.valid_to,
            scopes = EXCLUDED.scopes,
            calendar_access = EXCLUDED.calendar_access`,
        [
          provider,
          accessToken,
          encryptedRefreshToken,
          validFrom,
          validTo,
          user.id,
          userInfo.id,
          scopes,
          calendarAccess
        ]
      )

    } else {
      await pool.query(
        `INSERT INTO calendar_accounts (
          provider,
          user_id,
          oauth_id,
          calendar_access
        ) VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, provider, oauth_id) DO NOTHING`,
        [
          provider,
          user.id,
          userInfo.id, 
          calendarAccess
        ]
      )
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email
    })

    // Set JWT token in cookie
    const response = NextResponse.redirect(`${origin}/home/calendar`)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 1 week
    })

    return response
  } catch (error) {
    console.error('Error during OAuth callback:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`)
  }
} 