'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import { MessageSquare, Clock, CheckCircle, AlertCircle, Filter, Plus } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import PortalHeader from '@/components/PortalHeader'

export default function ComplaintsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      if (!token) {
        router.push('/portal/login')
      }
    }
  }, [router])

  const { data: complaintsData, isLoading } = useQuery(
    ['my-complaints', page, statusFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      try {
        const { data } = await portalApi.get(`/complaints?${params}`)
        return data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return { complaints: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
        }
        throw error
      }
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PENDING':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const complaints = complaintsData?.complaints || []
  const pagination = complaintsData?.pagination

  const extractComplaintSubject = (narrative: string) => {
    if (!narrative) return 'Complaint'
    const lines = narrative.split('\n')
    for (const line of lines) {
      if (line.startsWith('Subject:')) {
        return line.replace('Subject:', '').trim()
      }
    }
    return lines[0]?.replace('[COMPLAINT/REQUEST]', '').trim() || 'Complaint'
  }

  const extractComplaintDescription = (narrative: string) => {
    if (!narrative) return ''
    const lines = narrative.split('\n')
    const descriptionIndex = lines.findIndex(line => line.trim() === '')
    if (descriptionIndex !== -1 && descriptionIndex < lines.length - 1) {
      return lines.slice(descriptionIndex + 1).join(' ').trim()
    }
    return ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortalHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
              <p className="text-sm text-gray-600 mt-1">Track the status of your submitted complaints</p>
            </div>
            <Link
              href="/portal/complaints/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
            >
              <Plus className="h-5 w-5" />
              Submit Complaint
            </Link>
          </div>
        </div>
        {/* Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-gray-900 bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Complaints List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-200 border-t-rose-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading complaints...</p>
            </div>
          ) : complaints.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-rose-600 to-pink-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Complaint Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Date Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint: any) => (
                      <tr key={complaint.id} className="hover:bg-rose-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-bold text-rose-600">
                            {complaint.incidentNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {extractComplaintSubject(complaint.narrative)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 line-clamp-2 max-w-md">
                            {extractComplaintDescription(complaint.narrative) || 'No description provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(
                              complaint.status || 'PENDING'
                            )}`}
                          >
                            {getStatusIcon(complaint.status || 'PENDING')}
                            {complaint.status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {format(new Date(complaint.incidentDate || complaint.createdAt), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-bold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                    <span className="font-bold">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className="font-bold">{pagination.total}</span> complaints
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page === pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-rose-600" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-2">No complaints found</p>
              <p className="text-gray-600 text-sm mb-6">
                {statusFilter ? 'Try adjusting your filters' : "You haven't submitted any complaints yet"}
              </p>
              <Link
                href="/portal/complaints/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
              >
                <Plus className="h-5 w-5" />
                Submit Your First Complaint
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}



