'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  UsersIcon, 
  Cog6ToothIcon, 
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Agencies', href: '/agencies', icon: BuildingOfficeIcon },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
      <div className="flex flex-col h-full">
        <div className="flex items-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Field Appointment Planner</h1>
        </div>
        
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
} 