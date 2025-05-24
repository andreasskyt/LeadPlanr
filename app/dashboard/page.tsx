import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Topbar />
        <main className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          {/* Dashboard content will go here */}
        </main>
      </div>
    </div>
  )
} 