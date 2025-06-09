'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = () => {
    setError('')
    setLoading(true)
    try {
      window.location.href = '/api/auth/google'
    } catch (error) {
      console.error('Google login error:', error)
      setError(error instanceof Error ? error.message : 'Failed to login with Google')
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoftLogin = () => {
    setError('')
    setLoading(true)
    try {
      window.location.href = '/api/auth/microsoft'
    } catch (error) {
      console.error('Microsoft login error:', error)
      setError(error instanceof Error ? error.message : 'Failed to login with Microsoft')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="button"
              className="w-full flex items-center justify-center"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            <Button
              type="button"
              className="w-full flex items-center justify-center"
              onClick={handleMicrosoftLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                <path
                  fill="#f3f3f3"
                  d="M0 0h23v23H0z"
                />
                <path
                  fill="#f35325"
                  d="M1 1h10v10H1z"
                />
                <path
                  fill="#81bc06"
                  d="M12 1h10v10H12z"
                />
                <path
                  fill="#05a6f0"
                  d="M1 12h10v10H1z"
                />
                <path
                  fill="#ffba08"
                  d="M12 12h10v10H12z"
                />
              </svg>
              {loading ? 'Signing in...' : 'Sign in with Microsoft'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 