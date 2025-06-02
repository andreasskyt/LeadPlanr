import { NextResponse } from 'next/server'
import { getGoogleAuthUrl } from '@/lib/oauth'

export async function GET() {
  try {
    const authUrl = getGoogleAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Google auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Google authentication' },
      { status: 500 }
    )
  }
} 