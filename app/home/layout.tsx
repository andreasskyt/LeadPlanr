'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProfileMenu } from '@/components/ProfileMenu'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

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
      <div className="flex flex-col h-full">
        {/* Top navigation */}
        <div className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-semibold text-gray-800">Field Appointment Planner</h1>
              <h2 className="text-lg text-gray-600">{getPageTitle()}</h2>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <Link
                  href="/home/settings"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Cog6ToothIcon className="h-6 w-6" />
                </Link>
              )}
              <ProfileMenu user={user} />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-2 min-h-0 flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
} 