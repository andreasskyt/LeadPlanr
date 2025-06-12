'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { ProfileMenu } from '@/components/ProfileMenu'

export default function LandingPage() {
  const { user } = useAuth()

  const features = [
    {
      title: 'Great Overview',
      description: 'See your appointments in the calendar and on a map at the same time. It is easy to see the routes on each day and correlate with the events in your calendar.'
    },
    {
      title: 'Intelligent Suggestions',
      description: 'Based on your availability and existing appointments, we will suggest the best times for new appointments with your clients.'
    },
    {
      title: 'Smart Route Planning',
      description: 'Optimize your travel routes by considering geography and travel time between appointments. Save time and reduce travel costs.'
    },
    {
      title: 'Efficient Scheduling',
      description: 'Quickly find the perfect time slots for appointments while taking into account travel time, location, and your availability. You will find the best time to visit a client in a few seconds.'
    },
    {
      title: 'Easy Calendar Event Creation',
      description: 'Create the perfect appointment in your calendar with a single click.'
    },
    {
      title: 'Easy Integration',
      description: 'Add links from your CRM or lead management system to LeadPlanr including an event title and location (address), then you save entering any details manually.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top navigation */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">LeadPlanr</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    href="/home/calendar"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Calendar
                  </Link>
                  <ProfileMenu user={user} />
                </>
              ) : (
                <div className="space-x-4">
                  <Link
                    href="/login"
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-6 bg-white sm:pb-6 md:pb-6 lg:max-w-2xl lg:w-full lg:pb-6 xl:pb-6">
            <main className="mt-4 mx-auto max-w-7xl px-4 sm:mt-6 sm:px-6 md:mt-8 lg:mt-10 lg:px-8 xl:mt-12">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Plan your lead</span>
                  <span className="block text-indigo-600">appointments</span>
                  <span className="block text-indigo-600">smarter</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Optimize your travel routes and schedule appointments efficiently. Perfect for sales professionals and field service teams who need to manage multiple client visits.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage lead appointments
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10">
              {features.map((feature) => (
                <div key={feature.title} className="relative">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-base text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 