import { NextResponse } from 'next/server'

export async function GET() {
  const envVars = {
    // OAuth Configuration
    MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID ? 'SET' : 'NOT_SET',
    MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT_SET',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    
    // Host Configuration
    NEXT_PUBLIC_HOST: process.env.NEXT_PUBLIC_HOST ? 'SET' : 'NOT_SET',
    
    // Database Configuration
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    
    // Encryption Configuration
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ? 'SET' : 'NOT_SET',
    ENCRYPTION_IV: process.env.ENCRYPTION_IV ? 'SET' : 'NOT_SET',
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT_SET',
    
    // Environment
    NODE_ENV: process.env.NODE_ENV || 'development'
  }

  const missingVars = Object.entries(envVars)
    .filter(([key, value]) => value === 'NOT_SET')
    .map(([key]) => key)

  return NextResponse.json({
    environment: envVars,
    missing: missingVars,
    hasAllRequired: missingVars.length === 0
  })
} 