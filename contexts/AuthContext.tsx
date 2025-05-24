'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  // Helper function to get CSRF token from cookies
  const getCSRFToken = () => {
    return csrfToken || document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1]
  }

  // Helper function to make authenticated requests
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getCSRFToken()
    console.log('Making authenticated request with CSRF token:', {
      url,
      hasToken: !!token,
      token
    })

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'x-csrf-token': token }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || 'Request failed')
    }

    return response
  }

  // Initialize CSRF token
  useEffect(() => {
    const initCSRF = async () => {
      try {
        console.log('Initializing CSRF token...')
        const response = await fetch('/api/auth/csrf', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to initialize CSRF token')
        }

        // Get token from header
        const token = response.headers.get('x-csrf-token')
        if (token) {
          console.log('Got CSRF token from header:', token)
          setCsrfToken(token)
        }

        // Also check cookie
        const cookieToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrf-token='))
          ?.split('=')[1]

        console.log('CSRF token status:', { 
          hasHeaderToken: !!token,
          hasCookieToken: !!cookieToken,
          allCookies: document.cookie
        })
      } catch (error) {
        console.error('Failed to initialize CSRF token:', error)
      }
    }

    initCSRF()
  }, [])

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetchWithAuth('/api/auth/me')
        if (response.ok) {
          const user = await response.json()
          setUser(user)
        } else if (response.status === 401) {
          // This is expected when not logged in
          setUser(null)
        } else {
          throw new Error('Failed to check authentication status')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [csrfToken])

  const login = async (email: string, password: string) => {
    try {
      const response = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const signup = async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      const response = await fetchWithAuth('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, phone }),
      })

      const userData = await response.json()
      setUser(userData)
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 