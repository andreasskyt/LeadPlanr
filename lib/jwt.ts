import jwt from 'jsonwebtoken'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key' // I produktion skal dette være en sikker hemmelighed

export interface JWTPayload {
  userId: number
  email: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Edge-compatible verification for middleware
export async function verifyTokenEdge(token: string): Promise<JWTPayload> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  try {
    const { payload } = await jwtVerify(token, secret)
    // payload is JWTPayload, but may contain extra fields
    return {
      userId: payload.userId as number,
      email: payload.email as string,
    }
  } catch (error) {
    throw new Error('Invalid token')
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.split(' ')[1]
} 