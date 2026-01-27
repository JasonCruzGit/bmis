'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  Megaphone,
  Calendar,
  Pin,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getFileUrl } from '@/lib/utils'
import { Shield } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  type: string
  isPinned: boolean
  attachments: string[]
  startDate: string | null
  endDate: string | null
  createdAt: string
  creator: {
    firstName: string
    lastName: string
  }
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: announcementsData, isLoading } = useQuery(
    ['announcements', page, searchQuery, typeFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (typeFilter) {
        params.append('type', typeFilter)
      }
      const { data } = await api.get(`/announcements?${params}`)
      return data
    }
  )

  const deleteMutation = useMutation(
    async (id: string) => {
      await api.delete(`/announcements/${id}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('announcements')
        toast.success('Announcement deleted successfully')
        setShowDeleteModal(false)
        setSelectedAnnouncement(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to delete announcement')
      },
    }
  )

  const announcements = announcementsData?.announcements || []
  const pagination = announcementsData?.pagination

  useEffect(() => {
    if (hydrated && !user) {
      window.location.href = '/login'
    }
  }, [hydrated, user])

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'bg-blue-100 text-blue-800',
      URGENT: 'bg-red-100 text-red-800',
      NOTICE: 'bg-yellow-100 text-yellow-800',
      EVENT: 'bg-green-100 text-green-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const isActive = (announcement: Announcement) => {
    const now = new Date()
    const startDate = announcement.startDate ? new Date(announcement.startDate) : null
    const endDate = announcement.endDate ? new Date(announcement.endDate) : null
    
    if (!startDate && !endDate) return true
    if (startDate && endDate) {
      return now >= startDate && now <= endDate
    }
    if (startDate) return now >= startDate
    if (endDate) return now <= endDate
    return true
  }

  const handleDelete = () => {
    if (selectedAnnouncement) {
      deleteMutation.mutate(selectedAnnouncement.id)
    }
  }

  useEffect(() => {
    if (hydrated && user?.role === 'BARANGAY_EVALUATOR') {
      router.push('/dashboard')
    }
  }, [hydrated, user, router])

  if (!hydrated) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (user?.role === 'BARANGAY_EVALUATOR') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Megaphone className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Announcements</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and view all announcements</p>
              </div>
            </div>
            <Link
              href="/announcements/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Announcement
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              >
                <option value="">All Types</option>
                <option value="GENERAL">General</option>
                <option value="URGENT">Urgent</option>
                <option value="NOTICE">Notice</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
          </div>
        </div>

        {/* Announcements List */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100">
            <div className="text-center text-gray-500">Loading announcements...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-100">
            <div className="text-center">
              <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No announcements found</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: Announcement) => (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                  announcement.isPinned ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {announcement.isPinned && (
                          <Pin className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                        )}
                        <h3 className="text-xl font-bold text-gray-900">{announcement.title}</h3>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getTypeColor(announcement.type)}`}>
                          {announcement.type}
                        </span>
                        {isActive(announcement) ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 line-clamp-2 mb-4">{announcement.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5" />
                          {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1.5">By:</span>
                          {announcement.creator.firstName} {announcement.creator.lastName}
                        </div>
                        {announcement.startDate && (
                          <div className="flex items-center">
                            <span className="mr-1.5">Start:</span>
                            {format(new Date(announcement.startDate), 'MMM d, yyyy')}
                          </div>
                        )}
                        {announcement.endDate && (
                          <div className="flex items-center">
                            <span className="mr-1.5">End:</span>
                            {format(new Date(announcement.endDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </div>
                      {announcement.attachments && announcement.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {announcement.attachments.map((attachment, idx) => (
                            <a
                              key={idx}
                              href={getFileUrl(attachment)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                              <FileText className="h-3 w-3 mr-1.5" />
                              Attachment {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement)
                          setShowViewModal(true)
                        }}
                        className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <Link
                        href={`/announcements/${announcement.id}/edit`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedAnnouncement(announcement)
                          setShowDeleteModal(true)
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {((page - 1) * (pagination.limit || 20)) + 1} to{' '}
              {Math.min(page * (pagination.limit || 20), pagination.total)} of {pagination.total} announcements
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.pages}
                className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-xl bg-white">
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h3 className="text-2xl font-bold text-gray-900">{selectedAnnouncement.title}</h3>
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getTypeColor(selectedAnnouncement.type)}`}>
                    {selectedAnnouncement.type}
                  </span>
                  {selectedAnnouncement.isPinned && (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                      <Pin className="h-4 w-4 mr-1 fill-yellow-600" />
                      Pinned
                    </span>
                  )}
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
                </div>
                {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {selectedAnnouncement.attachments.map((attachment, idx) => (
                        <a
                          key={idx}
                          href={getFileUrl(attachment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <FileText className="h-5 w-5 mr-3 text-gray-600" />
                          <span className="text-sm text-gray-700">Attachment {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t text-sm text-gray-500">
                  <p>Created: {format(new Date(selectedAnnouncement.createdAt), 'MMMM d, yyyy h:mm a')}</p>
                  <p>By: {selectedAnnouncement.creator.firstName} {selectedAnnouncement.creator.lastName}</p>
                  {selectedAnnouncement.startDate && (
                    <p>Start Date: {format(new Date(selectedAnnouncement.startDate), 'MMMM d, yyyy')}</p>
                  )}
                  {selectedAnnouncement.endDate && (
                    <p>End Date: {format(new Date(selectedAnnouncement.endDate), 'MMMM d, yyyy')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAnnouncement && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-xl bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Delete Announcement</h3>
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedAnnouncement.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedAnnouncement(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

