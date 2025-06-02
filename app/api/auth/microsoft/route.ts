import { NextResponse } from 'next/server'
import { getMicrosoftAuthUrl } from '@/lib/oauth'

export async function GET() {
  try {
    const authUrl = getMicrosoftAuthUrl()
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Microsoft auth error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize Microsoft authentication' },
      { status: 500 }
    )
  }
} 