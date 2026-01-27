'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import { ArrowLeft, Bell, Pin, Calendar, FileText } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'

export default function AnnouncementsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      if (!token) {
        router.push('/portal/login')
      }
    }
  }, [router])

  const { data: announcementsData, isLoading } = useQuery(
    ['public-announcements', page],
    async () => {
      const { data } = await portalApi.get(`/announcements?page=${page}&limit=10`)
      return data
    }
  )

  const announcements = announcementsData?.announcements || []
  const pagination = announcementsData?.pagination

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'URGENT':
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
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 border-2 border-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 border border-white rounded-full -ml-32 -mb-32"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                Barangay Announcements
              </h1>
              <p className="text-lg text-gray-300 font-light">
                Stay informed about barangay events, programs, and important notices
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-8">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading announcements...</p>
          </div>
        ) : announcements.length > 0 ? (
          <div className="space-y-6">
            {announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                  announcement.isPinned ? 'border-amber-400 bg-gradient-to-br from-amber-50/50 to-white' : 'border-gray-100'
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
          <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-16 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Bell className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No announcements</h3>
            <p className="text-gray-600 text-lg">There are no announcements at this time.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6 gap-4">
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

