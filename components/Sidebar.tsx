'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/home', icon: HomeIcon },
  { name: 'Clients', href: '/home/clients', icon: UserGroupIcon },
  { name: 'Calendar', href: '/home/calendar', icon: CalendarIcon },
  { name: 'Reports', href: '/home/reports', icon: ChartBarIcon },
  { name: 'Settings', href: '/home/settings', icon: CogIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-lg h-full min-h-0 flex flex-col self-stretch">
      <div className="h-16 flex items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-800">Field Appointment Planner</h1>
      </div>
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md
                  ${isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 h-6 w-6
                    ${isActive
                      ? 'text-gray-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 