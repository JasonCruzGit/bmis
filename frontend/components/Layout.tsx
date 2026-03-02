'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import {
  LayoutDashboard,
  Users,
  FileText,
  Home,
  AlertCircle,
  FolderKanban,
  UserCheck,
  BookOpen,
  Megaphone,
  Package,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Shield,
  MessageSquare,
  User,
  UserPlus,
  AlertTriangle
} from 'lucide-react'

const menuItems = [
  // Core
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'core' },
  { href: '/residents', label: 'Residents', icon: Users, group: 'core' },
  { href: '/add-residents', label: 'Add Residents', icon: UserPlus, group: 'core' },
  { href: '/households', label: 'Households', icon: Home, group: 'core' },
  // Management
  { href: '/documents', label: 'Documents', icon: FileText, evaluatorRestricted: true, group: 'management' },
  { href: '/incidents', label: 'Incidents', icon: AlertCircle, evaluatorRestricted: true, group: 'management' },
  { href: '/projects', label: 'Projects', icon: FolderKanban, evaluatorRestricted: true, group: 'management' },
  { href: '/officials', label: 'Officials', icon: UserCheck, evaluatorRestricted: true, group: 'management' },
  { href: '/blotter', label: 'Blotter', icon: BookOpen, evaluatorRestricted: true, group: 'management' },
  // Communication
  { href: '/announcements', label: 'Announcements', icon: Megaphone, evaluatorRestricted: true, group: 'communication' },
  { href: '/direct-messages', label: 'Direct Messages', icon: MessageSquare, allowedRoles: ['ADMIN', 'BARANGAY_CHAIRMAN'], group: 'communication' },
  { href: '/resident-requests', label: 'Resident Requests', icon: MessageSquare, evaluatorRestricted: true, group: 'communication' },
  { href: '/complaints', label: 'Resident Complaints', icon: AlertTriangle, evaluatorRestricted: true, group: 'communication' },
  // System
  { href: '/inventory', label: 'Inventory', icon: Package, evaluatorRestricted: true, group: 'system' },
  { href: '/audit', label: 'Audit Logs', icon: ClipboardList, evaluatorRestricted: true, group: 'system' },
  { href: '/users', label: 'User Accounts', icon: Shield, adminOnly: true, group: 'system' },
]

const groupLabels: Record<string, string> = {
  core: 'Core',
  management: 'Management',
  communication: 'Communication',
  system: 'System'
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth, hydrated, hydrate } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    if (!hydrated) {
      hydrate()
    }
  }, [hydrated, hydrate])

  const handleLogout = () => {
    clearAuth()
    router.push('/login')
  }

  // Redirect to login if not authenticated (only on client after hydration)
  useEffect(() => {
    if (hydrated && !user && pathname !== '/login') {
      router.push('/login')
    }
  }, [hydrated, user, pathname, router])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-72 flex-col h-full bg-white shadow-2xl transform transition-transform duration-300 overflow-hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-24 items-center justify-between px-4 border-b border-primary-500/20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 shadow-md flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-14 h-14 bg-white rounded-xl p-1.5 shadow-md flex-shrink-0">
                {logoError ? (
                  <Shield className="h-10 w-10 text-primary-600" />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="El Nido Municipality Seal"
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">
                  <span className="block">Barangay Management</span>
                  <span className="block">Information System</span>
                </h1>
                <p className="text-sm text-primary-100 mt-1 font-semibold">Management Portal</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 min-h-0">
            <div className="px-3 py-3 space-y-5">
              {['core', 'management', 'communication', 'system'].map((group) => {
                const groupItems = menuItems.filter((item) => {
                  if (item.group !== group) return false
                  if (item.allowedRoles && (!user?.role || !item.allowedRoles.includes(user.role))) {
                    return false
                  }
                  // Hide admin-only items from non-admin users
                  if (item.adminOnly && user?.role !== 'ADMIN' && user?.role !== 'BARANGAY_CHAIRMAN') {
                    return false
                  }
                  // Hide evaluator-restricted items from BARANGAY_EVALUATOR
                  if (item.evaluatorRestricted && user?.role === 'BARANGAY_EVALUATOR') {
                    return false
                  }
                  return true
                })

                if (groupItems.length === 0) return null

                return (
                  <div key={group} className="space-y-1.5">
                    <div className="px-3 py-1">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {groupLabels[group]}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30'
                                : 'text-gray-700 hover:bg-white hover:text-primary-700 hover:shadow-sm'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <Icon className={`mr-3 h-4 w-4 transition-all duration-200 flex-shrink-0 ${
                              isActive 
                                ? 'text-white' 
                                : 'text-gray-500 group-hover:text-primary-600'
                            }`} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {isActive && (
                              <div className="ml-2 h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-2.5 p-2.5 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 capitalize font-medium truncate">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 bg-white group"
            >
              <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center h-24 px-4 border-b border-primary-500/20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 shadow-md flex-shrink-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative w-14 h-14 bg-white rounded-xl p-1.5 shadow-md flex-shrink-0">
                {logoError ? (
                  <Shield className="h-10 w-10 text-primary-600" />
                ) : (
                  <Image
                    src="/logo.png"
                    alt="El Nido Municipality Seal"
                    width={48}
                    height={48}
                    className="object-contain"
                    onError={() => setLogoError(true)}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-extrabold text-white leading-tight tracking-tight">
                  <span className="block">Barangay Management</span>
                  <span className="block">Information System</span>
                </h1>
                <p className="text-sm text-primary-100 mt-1 font-semibold">Management Portal</p>
              </div>
            </div>
          </div>
          
          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 min-h-0">
            <div className="px-3 py-3 space-y-5">
              {['core', 'management', 'communication', 'system'].map((group) => {
                const groupItems = menuItems.filter((item) => {
                  if (item.group !== group) return false
                  if (item.allowedRoles && (!user?.role || !item.allowedRoles.includes(user.role))) {
                    return false
                  }
                  // Hide admin-only items from non-admin users
                  if (item.adminOnly && user?.role !== 'ADMIN' && user?.role !== 'BARANGAY_CHAIRMAN') {
                    return false
                  }
                  // Hide evaluator-restricted items from BARANGAY_EVALUATOR
                  if (item.evaluatorRestricted && user?.role === 'BARANGAY_EVALUATOR') {
                    return false
                  }
                  return true
                })

                if (groupItems.length === 0) return null

                return (
                  <div key={group} className="space-y-1.5">
                    <div className="px-3 py-1">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {groupLabels[group]}
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {groupItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive
                                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md shadow-primary-600/30'
                                : 'text-gray-700 hover:bg-white hover:text-primary-700 hover:shadow-sm'
                            }`}
                          >
                            <Icon className={`mr-3 h-4 w-4 transition-all duration-200 flex-shrink-0 ${
                              isActive 
                                ? 'text-white' 
                                : 'text-gray-500 group-hover:text-primary-600'
                            }`} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {isActive && (
                              <div className="ml-2 h-1.5 w-1.5 rounded-full bg-white flex-shrink-0" />
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </nav>
          
          {/* User Section - Fixed at bottom */}
          <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center gap-2.5 mb-2.5 p-2.5 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-600 capitalize font-medium truncate">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 bg-white group"
            >
              <LogOut className="mr-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b-2 border-gray-200 shadow-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-700 hover:text-primary-600 focus:outline-none transition-colors hover:bg-gray-50"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <div className="relative w-8 h-8 bg-white rounded p-0.5">
              {logoError ? (
                <Shield className="h-6 w-6 text-primary-600" />
              ) : (
                <Image
                  src="/logo.png"
                  alt="El Nido Municipality Seal"
                  width={28}
                  height={28}
                  className="object-contain"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <h1 className="text-lg font-bold text-primary-700 tracking-tight">Barangay Management Information System</h1>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

