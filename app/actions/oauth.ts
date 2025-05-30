'use server'

import { redirect } from 'next/navigation'

const MS_CLIENT_ID = process.env.MS_CLIENT_ID as string
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
const HOST = process.env.NEXT_PUBLIC_HOST as string

if (!MS_CLIENT_ID || !GOOGLE_CLIENT_ID || !HOST) {
  throw new Error('Missing required environment variables for OAuth configuration')
}

export async function initiateMicrosoftOAuth() {
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    redirect_uri: `${HOST}/oauth/callback`,
    response_type: 'code',
    scope: 'Calendars.ReadWrite offline_access',
    prompt: 'consent',
    state: 'microsoft'
  })

  redirect(`https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`)
}

export async function initiateGoogleOAuth() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${HOST}/oauth/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent',
    state: 'google'
  })

  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
} 