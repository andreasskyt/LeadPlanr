import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string
const ENCRYPTION_IV = process.env.ENCRYPTION_IV as string

if (!ENCRYPTION_KEY || !ENCRYPTION_IV) {
  throw new Error('Missing required environment variables for encryption')
}

// Convert hex string to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
const ivBuffer = Buffer.from(ENCRYPTION_IV, 'hex')

// Ensure the key and IV are the correct length
if (keyBuffer.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded from hex')
}
if (ivBuffer.length !== 16) {
  throw new Error('ENCRYPTION_IV must be 16 bytes (128 bits) when decoded from hex')
}

export function encrypt(text: string): string {
  const cipher = createCipheriv('aes-256-cbc', keyBuffer, ivBuffer)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

export function decrypt(encrypted: string): string {
  const decipher = createDecipheriv('aes-256-cbc', keyBuffer, ivBuffer)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
} 