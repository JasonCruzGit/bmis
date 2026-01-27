'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import toast from 'react-hot-toast'
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Plus,
  Download,
  MessageSquare,
  LogOut,
  User,
  Phone,
  Calendar,
  ArrowRight,
  Sparkles,
  Pin,
  ChevronRight,
  MapPin,
  Mail,
  Home,
  Briefcase,
  Heart,
  Shield,
  Award,
  Activity,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Eye
} from 'lucide-react'
import { format, differenceInYears } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'

export default function PortalDashboardPage() {
  const router = useRouter()
  const [resident, setResident] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const residentData = localStorage.getItem('portal_resident')
      const token = localStorage.getItem('portal_token')
      
      if (!token || !residentData) {
        router.push('/portal/login')
        return
      }

      setResident(JSON.parse(residentData))
    }
  }, [router])

  const { data: requestsData, isLoading: requestsLoading } = useQuery(
    'my-requests',
    async () => {
      const { data } = await portalApi.get('/requests?limit=100')
      return data
    },
    { 
      enabled: !!resident,
      refetchInterval: 30000, // Refetch every 30 seconds for live updates
    }
  )

  const { data: complaintsData, isLoading: complaintsLoading } = useQuery(
    'my-complaints',
    async () => {
      try {
        // Try to fetch complaints - if endpoint doesn't exist, return empty array
        const { data } = await portalApi.get('/complaints?limit=100')
        return data
      } catch (error: any) {
        // If endpoint doesn't exist, return empty array
        if (error.response?.status === 404) {
          return { complaints: [] }
        }
        throw error
      }
    },
    { 
      enabled: !!resident,
      refetchInterval: 30000, // Refetch every 30 seconds for live updates
    }
  )

  const { data: documentsData, isLoading: documentsLoading } = useQuery(
    'my-documents',
    async () => {
      const { data } = await portalApi.get('/documents?limit=5')
      return data
    },
    { enabled: !!resident }
  )

  const { data: announcementsData } = useQuery('public-announcements', async () => {
    const { data } = await portalApi.get('/announcements?limit=10')
    return data
  })

  const handleLogout = () => {
    localStorage.removeItem('portal_token')
    localStorage.removeItem('portal_resident')
    router.push('/portal/login')
    toast.success('Logged out successfully')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  if (!resident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
          </div>
          <p className="text-gray-700 font-semibold text-lg">Loading your portal...</p>
        </div>
      </div>
    )
  }

  const pinnedAnnouncements = announcementsData?.announcements?.filter((a: any) => a.isPinned) || []
  const regularAnnouncements = announcementsData?.announcements?.filter((a: any) => !a.isPinned) || []
  const age = resident.dateOfBirth ? differenceInYears(new Date(), new Date(resident.dateOfBirth)) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Compact Modern Header */}
      <header className="bg-white/80 border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Home className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Resident Portal</h1>
                <p className="text-xs text-gray-600">El Nido, Palawan</p>
              </div>
            </div>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Main Layout: Left Content + Right Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT SIDE - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/portal/requests/new"
                className="group relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg hover:shadow-xl p-5 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                    <Plus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Request Document</h3>
                  <p className="text-blue-100 text-xs mt-1">Submit a new request</p>
                </div>
              </Link>

              <Link
                href="/portal/complaints/new"
                className="group relative bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl shadow-lg hover:shadow-xl p-5 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Submit Complaint</h3>
                  <p className="text-rose-100 text-xs mt-1">File a complaint or request</p>
                </div>
              </Link>

              <Link
                href="/portal/announcements"
                className="group relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl p-5 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Announcements</h3>
                  <p className="text-purple-100 text-xs mt-1">View barangay updates</p>
                  {announcementsData?.announcements?.length > 0 && (
                    <div className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xs font-bold text-purple-600">{announcementsData.announcements.length}</span>
                    </div>
                  )}
                </div>
              </Link>

              <Link
                href="/portal/emergency-contacts"
                className="group relative bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg hover:shadow-xl p-5 transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-sm">Emergency</h3>
                  <p className="text-orange-100 text-xs mt-1">Emergency numbers</p>
                </div>
              </Link>
            </div>

            {/* ANNOUNCEMENTS SECTION - Always visible above Live Status Monitor */}
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-3xl shadow-lg border-2 border-amber-300 overflow-hidden">
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        {pinnedAnnouncements.length > 0 ? (
                          <Pin className="h-6 w-6 text-white" />
                        ) : (
                          <Bell className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          {pinnedAnnouncements.length > 0 ? 'Important Announcements' : 'Latest Announcements'}
                          {pinnedAnnouncements.length > 0 && <Sparkles className="h-5 w-5 text-amber-500" />}
                        </h2>
                        <p className="text-sm text-gray-600">
                          {pinnedAnnouncements.length > 0 ? '📌 Pinned for your attention' : 'Stay informed with the latest updates'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/portal/announcements"
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-sm flex items-center gap-2"
                    >
                      View All
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {pinnedAnnouncements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pinnedAnnouncements.slice(0, 2).map((announcement: any) => (
                        <div
                          key={announcement.id}
                          className="group/card relative bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-5 hover:shadow-xl hover:border-amber-400 transition-all duration-300"
                        >
                          <div className="relative">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2.5 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex-shrink-0 group-hover/card:scale-110 transition-transform">
                                <Bell className="h-5 w-5 text-amber-600" />
                              </div>
                              <h3 className="font-bold text-gray-900 text-base flex-1 line-clamp-2 leading-snug">
                                {announcement.title}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                              {announcement.content}
                            </p>
                            <div className="flex items-center justify-between pt-3 border-t border-amber-100">
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                              </span>
                              <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                                PINNED
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : regularAnnouncements.length > 0 ? (
                    <div className="space-y-3">
                      {regularAnnouncements.slice(0, 3).map((announcement: any) => (
                        <div
                          key={announcement.id}
                          className="group/card relative bg-white rounded-2xl shadow-lg border-2 border-amber-200 p-4 hover:shadow-xl hover:border-amber-400 transition-all duration-300"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex-shrink-0 group-hover/card:scale-110 transition-transform">
                              <Bell className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
                                {announcement.title}
                              </h3>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {announcement.content}
                              </p>
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/50 rounded-xl border border-amber-200">
                      <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-amber-600" />
                      </div>
                      <p className="text-gray-600 font-medium text-sm">No announcements at this time</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* LIVE STATUS MONITORING SECTION */}
            <div className="relative group">
              <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-lg border-2 border-indigo-200 overflow-hidden">
                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Activity className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                          Live Status Monitor
                          <div className="relative">
                            <div className="relative w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Real-time tracking of your requests & complaints</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1.5 bg-white/80 rounded-xl border border-indigo-200">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <RefreshCw className="h-3 w-3 text-indigo-600 animate-spin" />
                          <span className="font-semibold">Auto-refresh: 30s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {/* Total Requests */}
                    <div className="bg-white/80 rounded-xl p-4 border border-indigo-200 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Total Requests</p>
                      <p className="text-2xl font-bold text-gray-900">{requestsData?.requests?.length || 0}</p>
                    </div>

                    {/* Pending */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-200 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Pending</p>
                      <p className="text-2xl font-bold text-amber-700">
                        {(requestsData?.requests || []).filter((r: any) => r.status === 'PENDING' || r.status === 'PROCESSING').length}
                      </p>
                    </div>

                    {/* Approved/Completed */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-200 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Completed</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {(requestsData?.requests || []).filter((r: any) => r.status === 'APPROVED' || r.status === 'COMPLETED').length}
                      </p>
                    </div>

                    {/* Complaints */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-200 shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <MessageSquare className="h-5 w-5 text-rose-600" />
                        <TrendingUp className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-600 font-medium mb-1">Complaints</p>
                      <p className="text-2xl font-bold text-rose-700">{complaintsData?.complaints?.length || 0}</p>
                    </div>
                  </div>

                  {/* Tabs for Requests/Complaints */}
                  <div className="bg-white/80 rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-lg font-bold text-gray-900">Active Requests & Complaints</h3>
                      </div>
                    </div>
                    
                    <div className="p-6 max-h-[500px] overflow-y-auto">
                      {/* Requests List */}
                      <div className="space-y-4 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <FileText className="h-4 w-4 text-indigo-600" />
                          <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Document Requests</h4>
                          <span className="ml-auto px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                            {(requestsData?.requests || []).length} total
                          </span>
                        </div>

                        {requestsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Loading requests...</p>
                          </div>
                        ) : (requestsData?.requests || []).length > 0 ? (
                          <div className="space-y-3">
                            {(requestsData.requests || []).slice(0, 10).map((request: any) => (
                              <Link
                                key={request.id}
                                href={`/portal/requests/${request.id}`}
                                className="block group relative bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border-2 border-gray-200 hover:border-indigo-300 p-4 transition-all duration-200 hover:shadow-lg"
                              >
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="p-2 bg-white rounded-lg border border-gray-200 flex-shrink-0 group-hover:border-indigo-300 transition-colors">
                                        <FileText className="h-5 w-5 text-indigo-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm mb-1 truncate">
                                          {request.documentType.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-xs text-gray-600 flex items-center gap-2">
                                          <span className="font-mono text-indigo-600">#{request.requestNumber}</span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(request.createdAt), 'MMM d, yyyy')}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border flex-shrink-0 ${getStatusColor(request.status)}`}>
                                      {getStatusIcon(request.status)}
                                      {request.status}
                                    </span>
                                  </div>

                                  {/* Status Progress Bar */}
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-gray-700">Progress</span>
                                      <span className="text-xs text-gray-600">
                                        {request.paymentStatus && (
                                          <span className={`px-2 py-0.5 rounded ${
                                            request.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                                            request.paymentStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                          }`}>
                                            Payment: {request.paymentStatus}
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className={`h-full transition-all duration-500 ${
                                          request.status === 'COMPLETED' || request.status === 'APPROVED' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                          request.status === 'PROCESSING' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                                          request.status === 'REJECTED' ? 'bg-gradient-to-r from-rose-500 to-red-500' :
                                          'bg-gradient-to-r from-indigo-500 to-blue-500'
                                        }`}
                                        style={{
                                          width: request.status === 'COMPLETED' || request.status === 'APPROVED' ? '100%' :
                                                 request.status === 'PROCESSING' ? '75%' :
                                                 request.status === 'REJECTED' ? '100%' :
                                                 request.status === 'PENDING' ? '25%' : '0%'
                                        }}
                                      ></div>
                                    </div>
                                  </div>

                                  {request.processedAt && (
                                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      Processed: {format(new Date(request.processedAt), 'MMM d, yyyy HH:mm')}
                                    </p>
                                  )}
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white/50 rounded-xl border border-gray-200">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <FileText className="h-6 w-6 text-indigo-600" />
                            </div>
                            <p className="text-gray-600 font-medium text-sm">No requests yet</p>
                            <Link
                              href="/portal/requests/new"
                              className="inline-flex items-center gap-2 mt-3 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                            >
                              Create your first request
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}

                        {/* View All Requests Link */}
                        {(requestsData?.requests || []).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                              href="/portal/requests"
                              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              View All Requests
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* Complaints List */}
                      <div className="space-y-4 pt-6 border-t-2 border-gray-200">
                        <div className="flex items-center gap-2 mb-4">
                          <MessageSquare className="h-4 w-4 text-rose-600" />
                          <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide">Complaints</h4>
                          <span className="ml-auto px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">
                            {(complaintsData?.complaints || []).length} total
                          </span>
                        </div>

                        {complaintsLoading ? (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-200 border-t-rose-600 mx-auto mb-3"></div>
                            <p className="text-sm text-gray-600">Loading complaints...</p>
                          </div>
                        ) : (complaintsData?.complaints || []).length > 0 ? (
                          <div className="space-y-3">
                            {(complaintsData.complaints || []).slice(0, 5).map((complaint: any) => (
                              <div
                                key={complaint.id}
                                className="block group relative bg-gradient-to-r from-gray-50 to-rose-50 rounded-xl border-2 border-gray-200 hover:border-rose-300 p-4 transition-all duration-200 hover:shadow-lg"
                              >
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                      <div className="p-2 bg-white rounded-lg border border-gray-200 flex-shrink-0 group-hover:border-rose-300 transition-colors">
                                        <MessageSquare className="h-5 w-5 text-rose-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                                          {complaint.narrative?.split('\n')[0]?.replace('[COMPLAINT/REQUEST]', '').trim() || 'Complaint'}
                                        </p>
                                        <p className="text-xs text-gray-600 flex items-center gap-2">
                                          <span className="font-mono text-rose-600">#{complaint.incidentNumber}</span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(complaint.incidentDate || complaint.createdAt), 'MMM d, yyyy')}
                                          </span>
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border flex-shrink-0 ${
                                      complaint.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                      complaint.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                      'bg-rose-100 text-rose-800 border-rose-200'
                                    }`}>
                                      {complaint.status === 'RESOLVED' ? <CheckCircle className="h-4 w-4" /> :
                                       complaint.status === 'IN_PROGRESS' ? <Clock className="h-4 w-4" /> :
                                       <AlertCircle className="h-4 w-4" />}
                                      {complaint.status || 'PENDING'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-white/50 rounded-xl border border-gray-200">
                            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                              <MessageSquare className="h-6 w-6 text-rose-600" />
                            </div>
                            <p className="text-gray-600 font-medium text-sm">No complaints submitted</p>
                            <Link
                              href="/portal/complaints/new"
                              className="inline-flex items-center gap-2 mt-3 text-rose-600 hover:text-rose-700 font-semibold text-sm"
                            >
                              Submit a complaint
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}

                        {/* View Complaint Status Link */}
                        {(complaintsData?.complaints || []).length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                              href="/portal/complaints"
                              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-sm"
                            >
                              <Eye className="h-4 w-4" />
                              View Complaint Status
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer - Last Updated */}
                    <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200 flex items-center justify-center">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <RefreshCw className="h-3 w-3 text-indigo-500" />
                        <span>Last updated: {format(new Date(), 'HH:mm:ss')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white/80 rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Recent Requests</h2>
                </div>
                <Link
                  href="/portal/requests"
                  className="text-sm text-white/90 hover:text-white font-semibold transition-colors flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="p-6">
                {requestsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading requests...</p>
                  </div>
                ) : requestsData?.requests?.length > 0 ? (
                  <div className="space-y-3">
                    {requestsData.requests.map((request: any) => (
                      <Link
                        key={request.id}
                        href={`/portal/requests/${request.id}`}
                        className="block group p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-white rounded-lg border border-gray-200 flex-shrink-0 group-hover:border-blue-300 transition-colors">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {request.documentType.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(request.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-gray-900 font-bold mb-2">No requests yet</p>
                    <p className="text-gray-600 text-sm mb-4">Start by creating your first document request</p>
                    <Link
                      href="/portal/requests/new"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      Create Request
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Issued Documents */}
            <div className="bg-white/80 rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Issued Documents</h2>
                </div>
                <Link
                  href="/portal/documents"
                  className="text-sm text-white/90 hover:text-white font-semibold transition-colors flex items-center gap-1"
                >
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="p-6">
                {documentsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-3"></div>
                    <p className="text-sm text-gray-600">Loading documents...</p>
                  </div>
                ) : documentsData?.documents?.length > 0 ? (
                  <div className="space-y-3">
                    {documentsData.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="group flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-white rounded-lg border border-gray-200 flex-shrink-0 group-hover:border-emerald-300 transition-colors">
                            <FileText className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {doc.documentType.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Issued: {format(new Date(doc.issuedDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                        {doc.filePath && (
                          <a
                            href={getFileUrl(doc.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <p className="text-gray-900 font-bold mb-2">No documents issued yet</p>
                    <p className="text-gray-600 text-sm">Your issued documents will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Profile Card + Announcements */}
          <div className="lg:col-span-1 space-y-6">
            {/* RESIDENT PROFILE CARD */}
            <div className="sticky top-24">
              <div className="relative group">
                <div className="relative bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Profile Header Background */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/10"></div>
                  </div>

                  {/* Profile Content */}
                  <div className="relative px-6 pb-6">
                    {/* Profile Image */}
                    <div className="flex justify-center -mt-16 mb-4">
                      <div className="relative">
                        <div className="relative w-32 h-32 rounded-3xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                          {resident.idPhoto ? (
                            <img
                              src={getFileUrl(resident.idPhoto)}
                              alt={`${resident.firstName} ${resident.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                              <User className="h-16 w-16 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {resident.firstName} {resident.middleName?.charAt(0)}. {resident.lastName}
                      </h2>
                      <p className="text-sm text-gray-600 mb-3">Registered Resident</p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-bold text-blue-900">Verified Account</span>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">Age</p>
                          <p className="text-sm font-bold text-gray-900">{age ? `${age} years old` : 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">Gender</p>
                          <p className="text-sm font-bold text-gray-900">{resident.sex === 'MALE' ? 'Male' : 'Female'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-pink-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Heart className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">Civil Status</p>
                          <p className="text-sm font-bold text-gray-900">{resident.civilStatus?.replace(/_/g, ' ') || 'N/A'}</p>
                        </div>
                      </div>

                      {resident.barangay && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 font-medium">Barangay</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{resident.barangay}</p>
                          </div>
                        </div>
                      )}

                      {resident.occupation && (
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 font-medium">Occupation</p>
                            <p className="text-sm font-bold text-gray-900 truncate">{resident.occupation}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium">Contact</p>
                          <p className="text-sm font-bold text-gray-900">{resident.contactNo || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Updates - Compact */}
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Latest Updates</h3>
                      <p className="text-purple-100 text-xs">Stay informed</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 max-h-[400px] overflow-y-auto">
                  {regularAnnouncements.length > 0 ? (
                    <div className="space-y-3">
                      {regularAnnouncements.slice(0, 5).map((announcement: any) => (
                        <div
                          key={announcement.id}
                          className="bg-white rounded-xl border border-purple-100 p-3 hover:border-purple-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex-shrink-0">
                              <Bell className="h-4 w-4 text-purple-600" />
                            </div>
                            <h4 className="font-bold text-gray-900 text-xs flex-1 line-clamp-2">
                              {announcement.title}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2 ml-8">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-gray-500 ml-8 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-purple-600" />
                      </div>
                      <p className="text-gray-600 text-sm">No updates yet</p>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <Link
                    href="/portal/announcements"
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all text-sm"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
