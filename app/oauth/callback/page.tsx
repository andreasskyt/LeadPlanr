'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { exchangeMicrosoftToken, exchangeGoogleToken } from '@/lib/oauth'
import { calendarAccounts } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function OAuthCallback({
  searchParams,
}: {
  searchParams: { code?: string; state?: string; error?: string }
}) {
  const { code, state, error } = searchParams

  if (error) {
    redirect('/home/settings?error=oauth_failed')
  }

  if (!code || !state) {
    redirect('/home/settings?error=invalid_callback')
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      redirect('/home/settings?error=not_authenticated')
    }

    let tokenResponse
    let provider: 'Microsoft' | 'Google'

    if (state === 'microsoft') {
      tokenResponse = await exchangeMicrosoftToken(code)
      provider = 'Microsoft'
    } else if (state === 'google') {
      tokenResponse = await exchangeGoogleToken(code)
      provider = 'Google'
    } else {
      redirect('/home/settings?error=invalid_state')
    }

    // Save the calendar account to the database
    await calendarAccounts.create({
      provider,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      valid_from: new Date(),
      valid_to: new Date(Date.now() + tokenResponse.expires_in * 1000),
      user_id: session.user.id
    })

    redirect('/home/settings?success=calendar_added')
  } catch (error) {
    console.error('Error during OAuth callback:', error)
    redirect('/home/settings?error=token_exchange_failed')
  }
}
