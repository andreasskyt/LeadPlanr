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

  // Helper function to get CSRF token from cookies
  const getCSRFToken = () => {
    return document.cookie
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
  }, [])

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