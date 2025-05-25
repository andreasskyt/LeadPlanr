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
    if (pathname === '/home/calendar') return 'Calendar'
    return 'Dashboard'
  }

  return (
    <div className="h-screen bg-gray-100">
      <div className="flex min-h-0 items-stretch h-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 min-h-0 flex flex-col h-full">
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
          <main className="p-2 min-h-0 flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 