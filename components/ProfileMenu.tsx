'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { UserCircleIcon } from '@heroicons/react/24/outline'

interface ProfileMenuProps {
  user: {
    firstName: string
    lastName: string
    email: string
  } | null
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
        <UserCircleIcon className="h-8 w-8" />
        <span className="text-sm font-medium">
          {user?.firstName} {user?.lastName}
        </span>
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => router.push('/home/profile')}
                className={`
                  ${active ? 'bg-gray-100' : ''}
                  block w-full px-4 py-2 text-left text-sm text-gray-700
                `}
              >
                Your Profile
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => router.push('/home/settings')}
                className={`
                  ${active ? 'bg-gray-100' : ''}
                  block w-full px-4 py-2 text-left text-sm text-gray-700
                `}
              >
                Settings
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleLogout}
                className={`
                  ${active ? 'bg-gray-100' : ''}
                  block w-full px-4 py-2 text-left text-sm text-gray-700
                `}
              >
                Sign out
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  )
} 