'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Signup() {
  const router = useRouter()
  const { signup } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phone = formData.get('phone') as string

    try {
      // Validate password match
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // Validate password length
      if (password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }

      await signup(email, password, firstName, lastName, phone)
      router.push('/home')
    } catch (error) {
      console.error('Signup error:', error)
      setError(error instanceof Error ? error.message : 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
            <Input
              label="First name"
              id="firstName"
              name="firstName"
              type="text"
              autoComplete="given-name"
              required
            />
            <Input
              label="Last name"
              id="lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              required
            />
            <Input
              label="Phone number"
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
            />
            <Input
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm password"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 