import { NextResponse } from 'next/server'
import { generateCSRFToken, setCSRFToken } from '@/lib/csrf'

export async function GET() {
  const token = generateCSRFToken()
  const response = NextResponse.json({ success: true })
  
  return setCSRFToken(response, token)
} 