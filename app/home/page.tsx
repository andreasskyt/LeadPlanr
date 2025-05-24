'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { ProfileMenu } from '@/components/ProfileMenu'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1">
          {/* Top navigation */}
          <div className="bg-white shadow">
            <div className="flex justify-between items-center px-4 py-3">
              <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
              <ProfileMenu user={user} />
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome, {user?.firstName}!
              </h2>
              <p className="text-gray-600">
                This is your dashboard. You can start adding your content here.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
} 