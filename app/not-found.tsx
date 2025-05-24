import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Page not found
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The page you are looking for does not exist.
        </p>
        <div className="mt-6">
          <Link href="/" className="w-full">
            <Button className="w-full">
              Go to homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 