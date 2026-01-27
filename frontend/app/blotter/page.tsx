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
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Shield } from 'lucide-react'

const BLOTTER_CATEGORIES = [
  { value: 'DOMESTIC_DISPUTE', label: 'Domestic Dispute' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'BARANGAY_DISPUTE', label: 'Barangay Dispute' },
  { value: 'YOUTH_RELATED', label: 'Youth Related' },
  { value: 'PROPERTY_DISPUTE', label: 'Property Dispute' },
  { value: 'OTHER', label: 'Other' },
]

const BLOTTER_STATUSES = [
  { value: 'OPEN', label: 'Open', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  { value: 'CLOSED', label: 'Closed', color: 'bg-gray-100 text-gray-800' },
]

export default function BlotterPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: blotterData, isLoading } = useQuery(
    ['blotter', page, searchQuery, categoryFilter, statusFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (categoryFilter) {
        params.append('category', categoryFilter)
      }
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const { data } = await api.get(`/blotter?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('blotter-stats', async () => {
    const [all, open, inProgress, resolved, closed] = await Promise.all([
      api.get('/blotter?limit=1'),
      api.get('/blotter?status=OPEN&limit=1'),
      api.get('/blotter?status=IN_PROGRESS&limit=1'),
      api.get('/blotter?status=RESOLVED&limit=1'),
      api.get('/blotter?status=CLOSED&limit=1'),
    ])
    return {
      total: all.data.pagination?.total || 0,
      open: open.data.pagination?.total || 0,
      inProgress: inProgress.data.pagination?.total || 0,
      resolved: resolved.data.pagination?.total || 0,
      closed: closed.data.pagination?.total || 0,
    }
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/blotter/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('blotter')
        toast.success('Blotter status updated successfully')
      },
      onError: () => {
        toast.error('Failed to update blotter status')
      },
    }
  )

  const handleViewEntry = (entry: any) => {
    setSelectedEntry(entry)
    setShowViewModal(true)
  }

  const handleStatusChange = (entryId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: entryId, status: newStatus })
  }

  const handleExport = async () => {
    try {
      const response = await api.get('/blotter/export?format=xlsx', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `blotter-report-${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('Blotter report exported successfully')
    } catch (error: any) {
      toast.error('Failed to export blotter report')
    }
  }

  const entries = blotterData?.entries || []
  const pagination = blotterData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  const getStatusColor = (status: string) => {
    const statusObj = BLOTTER_STATUSES.find(s => s.value === status)
    return statusObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const statusObj = BLOTTER_STATUSES.find(s => s.value === status)
    return statusObj?.label || status
  }

  const getCategoryLabel = (category: string) => {
    const categoryObj = BLOTTER_CATEGORIES.find(c => c.value === category)
    return categoryObj?.label || category
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
                <BookOpen className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Blotter System</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage barangay blotter entries and case reports</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/30 transition-colors shadow-sm font-semibold"
              >
                <Download className="h-5 w-5 mr-2" />
                Export Report
              </button>
              <Link
                href="/blotter/new"
                className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Entry
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.open || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
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
                <Clock className="h-6 w-6 text-blue-600" />
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
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.closed || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <XCircle className="h-6 w-6 text-gray-600" />
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
                placeholder="Search by entry number, narrative, or resident name..."
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
                  showFilters || categoryFilter || statusFilter
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 border-l border-gray-300 ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {BLOTTER_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
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
                    {BLOTTER_STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setCategoryFilter('')
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

        {/* Blotter Entries List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading blotter entries...</p>
          </div>
        ) : entries.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Entry Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Category
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
                    {entries.map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {entry.entryNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {entry.resident?.firstName} {entry.resident?.lastName}
                          </div>
                          {entry.resident?.address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.resident.address}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {getCategoryLabel(entry.category)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            {format(new Date(entry.incidentDate), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={entry.status}
                            onChange={(e) => handleStatusChange(entry.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(entry.status)}`}
                          >
                            {BLOTTER_STATUSES.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewEntry(entry)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/blotter/${entry.id}/edit`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry: any) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {entry.entryNumber}
                        </h3>
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                          {getStatusLabel(entry.status)}
                        </span>
                      </div>
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <BookOpen className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {entry.resident?.firstName} {entry.resident?.lastName}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        {getCategoryLabel(entry.category)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(entry.incidentDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {entry.narrative}
                    </p>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewEntry(entry)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/blotter/${entry.id}/edit`}
                        className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                      >
                        <Edit className="h-4 w-4 inline mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No blotter entries found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first blotter entry'}
            </p>
            <Link
              href="/blotter/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Entry
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
              of <span className="font-medium">{pagination.total}</span> entries
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
        {showViewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Blotter Entry Details</h2>
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
                        {selectedEntry.entryNumber}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created on {format(new Date(selectedEntry.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(selectedEntry.status)}`}>
                      {getStatusLabel(selectedEntry.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Resident Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedEntry.resident?.firstName} {selectedEntry.resident?.lastName}
                        </p>
                      </div>
                      {selectedEntry.resident?.address && (
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedEntry.resident.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Entry Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">
                          {getCategoryLabel(selectedEntry.category)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Incident Date</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(selectedEntry.incidentDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <select
                          value={selectedEntry.status}
                          onChange={(e) => {
                            handleStatusChange(selectedEntry.id, e.target.value)
                            setSelectedEntry({ ...selectedEntry, status: e.target.value })
                          }}
                          className={`mt-1 px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(selectedEntry.status)}`}
                        >
                          {BLOTTER_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>{status.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Narrative</h4>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {selectedEntry.narrative}
                  </p>
                </div>
                {selectedEntry.actionsTaken && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Actions Taken</h4>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedEntry.actionsTaken}
                    </p>
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Link
                    href={`/blotter/${selectedEntry.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Entry
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



