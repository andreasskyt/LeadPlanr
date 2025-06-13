'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ProfileMenu } from '@/components/ProfileMenu'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useCalendar } from '@/contexts/CalendarContext'
import { CalendarProvider } from '@/contexts/CalendarContext'

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CalendarProvider>
      <HomeLayoutContent>{children}</HomeLayoutContent>
    </CalendarProvider>
  )
}

function HomeLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const { availableCalendars, selectedCalendarId, setSelectedCalendarId, loading: calendarsLoading } = useCalendar()

  const getPageTitle = () => {
    if (pathname === '/home/settings') return 'Settings'
    if (pathname === '/home/calendar') return 'Calendar'
    if (pathname === '/home/clients') return 'Clients'
    if (pathname === '/home/reports') return 'Reports'
    return 'Calendar'
  }

  return (
    <div className="h-screen bg-gray-100">
      <div className="flex flex-col h-full">
        {/* Top navigation */}
        <div className="bg-white shadow">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-semibold text-gray-800 hover:text-gray-900">
                LeadPlanr
              </Link>
              <div className="flex items-center gap-4">
                <h2 className="text-lg text-gray-600">{getPageTitle()}</h2>
                {pathname === '/home/calendar' && (
                  <select
                    className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedCalendarId || ''}
                    onChange={(e) => setSelectedCalendarId(e.target.value)}
                    disabled={calendarsLoading}
                  >
                    {calendarsLoading ? (
                      <option value="">Loading calendars...</option>
                    ) : (
                      availableCalendars.map((calendar) => (
                        <option key={calendar.id} value={calendar.id}>
                          {calendar.name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
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