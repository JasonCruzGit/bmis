'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Layout from '@/components/Layout'
import {
  AlertTriangle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Phone,
  MapPin,
  X
} from 'lucide-react'
import { format } from 'date-fns'

type Complaint = {
  id: string
  incidentNumber: string
  narrative: string
  status: string
  incidentDate: string
  createdAt: string
  updatedAt: string
  complainant: {
    id: string
    firstName: string
    lastName: string
    address: string
    contactNo: string
  }
  creator: {
    firstName: string
    lastName: string
  } | null
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'RESOLVED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-800 border-amber-200'
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
      return <AlertTriangle className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

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

const extractComplaintCategory = (narrative: string) => {
  if (!narrative) return 'General'
  const lines = narrative.split('\n')
  for (const line of lines) {
    if (line.startsWith('Category:')) {
      return line.replace('Category:', '').trim()
    }
  }
  return 'General'
}

const extractComplaintDescription = (narrative: string) => {
  if (!narrative) return ''
  const lines = narrative.split('\n')
  const descriptionIndex = lines.findIndex(line => line.trim() === '')
  if (descriptionIndex !== -1 && descriptionIndex < lines.length - 1) {
    return lines.slice(descriptionIndex + 1).join('\n').trim()
  }
  // If no empty line, try to get everything after Category
  const categoryIndex = lines.findIndex(line => line.startsWith('Category:'))
  if (categoryIndex !== -1 && categoryIndex < lines.length - 1) {
    return lines.slice(categoryIndex + 1).join('\n').trim()
  }
  return lines.slice(1).join('\n').trim()
}

export default function ComplaintsPage() {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch complaints
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery(
    ['complaints', page, statusFilter, searchTerm],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      const { data } = await api.get(`/resident-requests/complaints?${params.toString()}`)
      return data
    }
  )

  // Update complaint status mutation
  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: string }) =>
      api.patch(`/incidents/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('complaints')
        toast.success('Complaint status updated successfully')
        setShowModal(false)
        setSelectedComplaint(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update complaint status')
      },
    }
  )

  const complaints = complaintsData?.complaints || []
  const pagination = complaintsData?.pagination

  const handleStatusUpdate = (status: string) => {
    if (selectedComplaint) {
      updateStatusMutation.mutate({ id: selectedComplaint.id, status })
    }
  }

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint)
    setShowModal(true)
  }

  // Calculate statistics
  const totalComplaints = pagination?.total || 0
  const pendingCount = complaints.filter((c: Complaint) => c.status === 'PENDING').length
  const inProgressCount = complaints.filter((c: Complaint) => c.status === 'IN_PROGRESS').length
  const resolvedCount = complaints.filter((c: Complaint) => c.status === 'RESOLVED').length

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resident Complaints</h1>
            <p className="text-gray-600 mt-1">Manage and track complaints submitted by residents</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Total Complaints</p>
            <p className="text-3xl font-bold text-gray-900">{totalComplaints}</p>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-2xl p-6 border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-rose-600" />
            </div>
            <p className="text-sm font-semibold text-rose-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-rose-700">{pendingCount}</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <p className="text-sm font-semibold text-amber-600 mb-1">In Progress</p>
            <p className="text-3xl font-bold text-amber-700">{inProgressCount}</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-emerald-600 mb-1">Resolved</p>
            <p className="text-3xl font-bold text-emerald-700">{resolvedCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by complaint number, subject, or resident name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Complaints Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {complaintsLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
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
                        Complainant
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Date Submitted
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.map((complaint: Complaint) => (
                      <tr key={complaint.id} className="hover:bg-rose-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-bold text-rose-600">
                            {complaint.incidentNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900 max-w-xs truncate">
                            {extractComplaintSubject(complaint.narrative)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {complaint.complainant.firstName} {complaint.complainant.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{complaint.complainant.contactNo}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {extractComplaintCategory(complaint.narrative)}
                          </span>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDetails(complaint)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
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
              <p className="text-gray-600 text-sm">
                {searchTerm || statusFilter ? 'Try adjusting your filters' : 'No complaints have been submitted yet'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Details Modal */}
      {showModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Complaint Details</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedComplaint(null)
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Complaint Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Complaint Number</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{selectedComplaint.incidentNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Status</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${getStatusColor(
                      selectedComplaint.status || 'PENDING'
                    )}`}
                  >
                    {getStatusIcon(selectedComplaint.status || 'PENDING')}
                    {selectedComplaint.status || 'PENDING'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Date Submitted</p>
                  <p className="text-sm text-gray-900 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedComplaint.incidentDate || selectedComplaint.createdAt), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Category</p>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                    {extractComplaintCategory(selectedComplaint.narrative)}
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Subject</p>
                <p className="text-lg font-bold text-gray-900">{extractComplaintSubject(selectedComplaint.narrative)}</p>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Description</p>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {extractComplaintDescription(selectedComplaint.narrative) || 'No description provided'}
                  </p>
                </div>
              </div>

              {/* Complainant Info */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-3">Complainant Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Name</p>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedComplaint.complainant.firstName} {selectedComplaint.complainant.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Contact</p>
                      <p className="text-sm font-bold text-gray-900">{selectedComplaint.complainant.contactNo}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 col-span-2">
                    <div className="p-2 bg-white rounded-lg border border-blue-200">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Address</p>
                      <p className="text-sm font-bold text-gray-900">{selectedComplaint.complainant.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-sm font-semibold text-gray-900 mb-3">Update Status</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStatusUpdate('PENDING')}
                    disabled={selectedComplaint.status === 'PENDING' || updateStatusMutation.isLoading}
                    className="flex-1 px-4 py-2.5 bg-rose-100 text-rose-700 rounded-xl font-semibold hover:bg-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Set as Pending
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('IN_PROGRESS')}
                    disabled={selectedComplaint.status === 'IN_PROGRESS' || updateStatusMutation.isLoading}
                    className="flex-1 px-4 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-semibold hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Set as In Progress
                  </button>
                  <button
                    onClick={() => handleStatusUpdate('RESOLVED')}
                    disabled={selectedComplaint.status === 'RESOLVED' || updateStatusMutation.isLoading}
                    className="flex-1 px-4 py-2.5 bg-emerald-100 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Mark as Resolved
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

