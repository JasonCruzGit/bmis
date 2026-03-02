'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import { Bell, Pin, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'
import PortalHeader from '@/components/PortalHeader'

export default function AnnouncementsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [resident, setResident] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      const residentData = localStorage.getItem('portal_resident')
      
      if (!token || !residentData) {
        router.push('/portal/login')
        return
      }

      setResident(JSON.parse(residentData))
    }
  }, [router])

  const { data: announcementsData, isLoading } = useQuery(
    ['public-announcements', page, resident?.barangay],
    async () => {
      const barangayParam = resident?.barangay ? `&barangay=${encodeURIComponent(resident.barangay)}` : ''
      const { data } = await portalApi.get(`/announcements?page=${page}&limit=10${barangayParam}`)
      return data
    },
    { enabled: !!resident }
  )

  const announcements = announcementsData?.announcements || []
  const pagination = announcementsData?.pagination

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'EVENT':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'NOTICE':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'GENERAL':
      default:
        return 'bg-primary-100 text-primary-800 border-primary-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortalHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Bell className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Barangay Announcements</h1>
              <p className="text-sm text-gray-600 mt-1">Stay informed about barangay events, programs, and important notices</p>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-200 border-t-amber-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading announcements...</p>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                  announcement.isPinned ? 'border-amber-400 bg-gradient-to-br from-amber-50/80 to-white/80' : 'border-gray-200'
                } overflow-hidden`}
              >
                {announcement.isPinned && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 flex items-center gap-2">
                    <Pin className="h-4 w-4 text-white fill-white" />
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Pinned Announcement</span>
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {announcement.title}
                        </h2>
                        <span
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-lg border-2 ${getTypeColor(
                            announcement.type
                          )}`}
                        >
                          {announcement.type}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-5 flex-wrap">
                        <span className="flex items-center gap-2 font-medium">
                          <Calendar className="h-4 w-4 text-primary-600" />
                          {format(new Date(announcement.createdAt), 'MMMM d, yyyy')}
                        </span>
                        {announcement.startDate && (
                          <span className="font-medium">
                            Starts: {format(new Date(announcement.startDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {announcement.endDate && (
                          <span className="font-medium">
                            Ends: {format(new Date(announcement.endDate), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">{announcement.content}</p>
                  </div>
                  {announcement.attachments && announcement.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-100">
                      <p className="text-sm font-bold text-gray-900 mb-3">Attachments:</p>
                      <div className="flex flex-wrap gap-3">
                        {announcement.attachments.map((attachment: string, index: number) => (
                          <a
                            key={index}
                            href={getFileUrl(attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold bg-gray-100 text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 border-2 border-transparent hover:border-primary-200 transition-all duration-200"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Attachment {index + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No announcements</h3>
            <p className="text-gray-600">There are no announcements at this time.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 gap-4">
            <div className="text-sm font-medium text-gray-700">
              Showing <span className="font-bold text-gray-900">{pagination.page * pagination.limit - pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-gray-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-gray-900">{pagination.total}</span> announcements
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-gray-700"
              >
                Previous
              </button>
              <div className="px-4 py-2.5 text-sm font-bold text-gray-900 bg-gray-50 rounded-lg">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

