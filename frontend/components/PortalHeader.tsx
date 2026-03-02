'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Home } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PortalHeader() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_resident')
    router.push('/portal/login')
    toast.success('Logged out successfully')
  }

  return (
    <header className="bg-white/80 border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/portal/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Home className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Resident Portal</h1>
              <p className="text-xs text-gray-600">El Nido, Palawan</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

