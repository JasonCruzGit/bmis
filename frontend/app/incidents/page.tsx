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
  Eye, 
  Filter,
  Download,
  Calendar,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Clock,
  Shield
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getFileUrl } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'

export default function IncidentsPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedIncident, setSelectedIncident] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: incidentsData, isLoading } = useQuery(
    ['incidents', page, searchQuery, statusFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      const { data } = await api.get(`/incidents?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('incidents-stats', async () => {
    // Fetch all incidents to calculate accurate stats
    const { data } = await api.get('/incidents?limit=1000')
    const incidents = data.incidents || []
    
    return {
      total: data.pagination?.total || incidents.length,
      pending: incidents.filter((incident: any) => incident.status === 'PENDING').length,
      inProgress: incidents.filter((incident: any) => incident.status === 'IN_PROGRESS').length,
      resolved: incidents.filter((incident: any) => incident.status === 'RESOLVED').length,
    }
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/incidents/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('incidents')
        queryClient.invalidateQueries('incidents-stats')
        toast.success('Incident status updated successfully')
      },
      onError: () => {
        toast.error('Failed to update incident status')
      },
    }
  )

  const handleViewIncident = (incident: any) => {
    setSelectedIncident(incident)
    setShowViewModal(true)
  }

  const handleStatusChange = (incidentId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: incidentId, status: newStatus })
  }

  const incidents = incidentsData?.incidents || []
  const pagination = incidentsData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
                <AlertCircle className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Incidents</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and track incident reports</p>
              </div>
            </div>
            <Link
              href="/incidents/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Report Incident
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.pending || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.inProgress || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.resolved || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by incident number, complainant name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || statusFilter
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setShowFilters(false)
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Incidents Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading incidents...</p>
          </div>
        ) : incidents.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Incident Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Complainant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Respondent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Incident Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incidents.map((incident: any) => (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {incident.incidentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {incident.complainant?.firstName} {incident.complainant?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{incident.complainant?.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {incident.respondent ? (
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {incident.respondent.firstName} {incident.respondent.lastName}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(incident.incidentDate), 'MMM d, yyyy')}
                        </div>
                        {incident.hearingDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Hearing: {format(new Date(incident.hearingDate), 'MMM d, yyyy')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={incident.status}
                          onChange={(e) => handleStatusChange(incident.id, e.target.value)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(incident.status)}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewIncident(incident)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/incidents/${incident.id}/edit`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by reporting your first incident'}
            </p>
            <Link
              href="/incidents/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Report Incident
            </Link>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> incidents
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 inline" />
                Previous
              </button>
              <div className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 inline" />
              </button>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedIncident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Incident Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedIncident.incidentNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Reported on {format(new Date(selectedIncident.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(selectedIncident.status)}`}>
                      {getStatusLabel(selectedIncident.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Complainant</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedIncident.complainant?.firstName} {selectedIncident.complainant?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedIncident.complainant?.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedIncident.respondent && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Respondent</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedIncident.respondent.firstName} {selectedIncident.respondent.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedIncident.respondent.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Incident Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Incident Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(selectedIncident.incidentDate), 'MMMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {selectedIncident.hearingDate && (
                        <div>
                          <p className="text-xs text-gray-500">Hearing Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(selectedIncident.hearingDate), 'MMMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <select
                          value={selectedIncident.status}
                          onChange={(e) => {
                            handleStatusChange(selectedIncident.id, e.target.value)
                            setSelectedIncident({ ...selectedIncident, status: e.target.value })
                          }}
                          className={`mt-1 px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(selectedIncident.status)}`}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Narrative</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedIncident.narrative}
                    </p>
                  </div>
                </div>
                {selectedIncident.actionsTaken && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions Taken</h4>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {selectedIncident.actionsTaken}
                      </p>
                    </div>
                  </div>
                )}
                {selectedIncident.attachments && selectedIncident.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Attachments</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedIncident.attachments.map((attachment: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <FileText className="h-5 w-5 text-gray-400 mb-2" />
                          <a
                            href={getFileUrl(attachment)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 truncate block"
                          >
                            Attachment {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                  <Link
                    href={`/incidents/${selectedIncident.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Incident
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}



