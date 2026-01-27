'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Layout from '@/components/Layout'
import { FileText, MessageSquare, CheckCircle, XCircle, Clock, Search, Filter, Plus } from 'lucide-react'

type DocumentRequest = {
  id: string
  requestNumber: string
  documentType: string
  purpose: string | null
  status: string
  fee: number | null
  paymentStatus: string
  createdAt: string
  resident: {
    id: string
    firstName: string
    lastName: string
    address: string
    contactNo: string
  }
  processor: {
    firstName: string
    lastName: string
  } | null
}

type Complaint = {
  id: string
  incidentNumber: string
  narrative: string
  status: string
  incidentDate: string
  complainant: {
    id: string
    firstName: string
    lastName: string
    address: string
    contactNo: string
  }
}

const getDocumentTypeLabel = (type: string) => {
  const types: Record<string, string> = {
    INDIGENCY: 'Certificate of Indigency',
    RESIDENCY: 'Certificate of Residency',
    CLEARANCE: 'Barangay Clearance',
    SOLO_PARENT: 'Solo Parent Certificate',
    GOOD_MORAL: 'Certificate of Good Moral Character',
  }
  return types[type] || type
}

export default function ResidentRequestsPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'complaints'>('requests')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const queryClient = useQueryClient()

  // Fetch document requests
  const { data: requestsData, isLoading: requestsLoading, error: requestsError } = useQuery(
    ['document-requests', statusFilter, searchTerm],
    async () => {
      try {
        const params = new URLSearchParams()
        if (statusFilter) params.append('status', statusFilter)
        if (searchTerm) params.append('search', searchTerm)
        const { data } = await api.get(`/resident-requests/document-requests?${params.toString()}`)
        console.log('Document requests data:', data)
        return data
      } catch (error: any) {
        console.error('Error fetching document requests:', error)
        throw error
      }
    },
    {
      onError: (error: any) => {
        console.error('Error fetching document requests:', error)
        if (error.response?.status === 401) {
          toast.error('Please log in to view requests')
        } else {
          toast.error(error.response?.data?.message || 'Failed to load document requests')
        }
      },
    }
  )

  // Fetch complaints
  const { data: complaintsData, isLoading: complaintsLoading } = useQuery(
    ['complaints', statusFilter, searchTerm],
    async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      const { data } = await api.get(`/resident-requests/complaints?${params.toString()}`)
      return data
    },
    { enabled: activeTab === 'complaints' }
  )

  // Update request status mutation
  const updateRequestMutation = useMutation(
    async ({ id, status, notes, rejectedReason, fee }: any) => {
      const { data } = await api.put(`/resident-requests/document-requests/${id}`, {
        status,
        notes,
        rejectedReason,
        fee,
      })
      return data
    },
    {
      onSuccess: (data) => {
        console.log('Request updated successfully:', data)
        queryClient.invalidateQueries('document-requests')
        queryClient.invalidateQueries('my-requests') // Also invalidate resident portal queries
        toast.success('Request updated successfully' + (data.request?.document?.filePath ? ' - PDF generated!' : ''))
        setShowRequestModal(false)
        setSelectedRequest(null)
      },
      onError: (error: any) => {
        console.error('Error updating request:', error)
        toast.error(error.response?.data?.message || 'Failed to update request')
      },
    }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  const handleUpdateRequest = (formData: any) => {
    if (!selectedRequest) return
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      ...formData,
    })
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Resident Requests</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage document requests and complaints from residents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Document Requests
                {requestsData?.requests?.length > 0 && (
                  <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    {requestsData.requests.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'complaints'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Complaints
                {complaintsData?.complaints?.length > 0 && (
                  <span className="ml-2 bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                    {complaintsData.complaints.length}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, request number, or incident number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Document Requests Tab */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow">
            {requestsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading requests...</div>
            ) : requestsError ? (
              <div className="p-8 text-center text-red-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p>Error loading requests: {requestsError instanceof Error ? requestsError.message : 'Unknown error'}</p>
                <p className="text-sm text-gray-500 mt-2">Please check your authentication and try again.</p>
              </div>
            ) : requestsData?.requests?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No document requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requestsData?.requests?.map((request: DocumentRequest) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.requestNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.resident.firstName} {request.resident.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{request.resident.contactNo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getDocumentTypeLabel(request.documentType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.paymentStatus}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRequestModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View/Update
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="bg-white rounded-lg shadow">
            {complaintsLoading ? (
              <div className="p-8 text-center text-gray-500">Loading complaints...</div>
            ) : complaintsData?.complaints?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No complaints found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Incident #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Complainant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaintsData?.complaints?.map((complaint: Complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {complaint.incidentNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {complaint.complainant.firstName} {complaint.complainant.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{complaint.complainant.contactNo}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                          {complaint.narrative.replace(/\[COMPLAINT\/REQUEST\].*?\n\n/, '').substring(0, 100)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(complaint.incidentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/incidents/${complaint.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Request Update Modal */}
        {showRequestModal && selectedRequest && (
          <RequestUpdateModal
            request={selectedRequest}
            onClose={() => {
              setShowRequestModal(false)
              setSelectedRequest(null)
            }}
            onUpdate={handleUpdateRequest}
            isLoading={updateRequestMutation.isLoading}
          />
        )}
      </div>
    </Layout>
  )
}

function RequestUpdateModal({
  request,
  onClose,
  onUpdate,
  isLoading,
}: {
  request: DocumentRequest
  onClose: () => void
  onUpdate: (data: any) => void
  isLoading: boolean
}) {
  const [status, setStatus] = useState(request.status)
  const [notes, setNotes] = useState('')
  const [rejectedReason, setRejectedReason] = useState('')
  const [fee, setFee] = useState(request.fee?.toString() || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      status,
      notes: notes || undefined,
      rejectedReason: rejectedReason || undefined,
      fee: fee ? parseFloat(fee) : undefined,
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Update Document Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Request:</strong> {request.requestNumber}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            <strong>Resident:</strong> {request.resident.firstName} {request.resident.lastName}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Document Type:</strong> {getDocumentTypeLabel(request.documentType)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee (PHP)</label>
            <input
              type="number"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {status === 'REJECTED' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
              <textarea
                value={rejectedReason}
                onChange={(e) => setRejectedReason(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

