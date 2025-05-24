'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { ProfileMenu } from '@/components/ProfileMenu'
import { usePathname } from 'next/navigation'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  const pathname = usePathname()

  const getPageTitle = () => {
    if (pathname === '/home/settings') return 'Settings'
    return 'Dashboard'
  }

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
              <h1 className="text-xl font-semibold text-gray-800">
                {getPageTitle()}
              </h1>
              <ProfileMenu user={user} />
            </div>
          </div>

          {/* Page content */}
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 