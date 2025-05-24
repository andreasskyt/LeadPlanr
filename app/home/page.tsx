'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Welcome, {user?.firstName}!
      </h2>
      <p className="text-gray-600">
        This is your dashboard. You can start adding your content here.
      </p>
    </div>
  )
} 