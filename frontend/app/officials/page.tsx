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
  Mail,
  Phone,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  User,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { getFileUrl } from '@/lib/utils'
import { Shield } from 'lucide-react'

export default function OfficialsPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [selectedOfficial, setSelectedOfficial] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: officialsData, isLoading } = useQuery(
    ['officials', page, searchQuery, statusFilter, positionFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false')
      }
      if (positionFilter) {
        params.append('position', positionFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const { data } = await api.get(`/officials?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('officials-stats', async () => {
    const [all, active, inactive] = await Promise.all([
      api.get('/officials?limit=1'),
      api.get('/officials?isActive=true&limit=1'),
      api.get('/officials?isActive=false&limit=1'),
    ])
    return {
      total: all.data.pagination?.total || 0,
      active: active.data.pagination?.total || 0,
      inactive: inactive.data.pagination?.total || 0,
    }
  })

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/officials/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('officials')
        toast.success('Official deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete official')
      },
    }
  )

  const handleViewOfficial = (official: any) => {
    setSelectedOfficial(official)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this official?')) {
      deleteMutation.mutate(id)
    }
  }

  const officials = officialsData?.officials || []
  const pagination = officialsData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

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
                <UserCheck className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Barangay Officials</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage officials and employee directory</p>
              </div>
            </div>
            <Link
              href="/officials/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Official
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Officials</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.active || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.inactive || 0}</p>
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
                placeholder="Search by name, email, or contact number..."
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
                  showFilters || statusFilter || positionFilter
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
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    value={positionFilter}
                    onChange={(e) => {
                      setPositionFilter(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Filter by position..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setPositionFilter('')
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

        {/* Officials List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading officials...</p>
          </div>
        ) : officials.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Official
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Term
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
                    {officials.map((official: any) => (
                      <tr key={official.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {official.photo ? (
                              <img
                                src={getFileUrl(official.photo)}
                                alt={`${official.firstName} ${official.lastName}`}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <User className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {official.firstName} {official.lastName}
                              </div>
                              {official.email && (
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {official.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{official.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-gray-400" />
                            {official.contactNo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {format(new Date(official.termStart), 'MMM d, yyyy')}
                            </div>
                            {official.termEnd && (
                              <div className="text-xs text-gray-500 mt-1">
                                to {format(new Date(official.termEnd), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                            official.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {official.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewOfficial(official)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/officials/${official.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(official.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
              {officials.map((official: any) => (
                <div
                  key={official.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {official.photo ? (
                          <img
                            src={getFileUrl(official.photo)}
                            alt={`${official.firstName} ${official.lastName}`}
                            className="h-16 w-16 rounded-full object-cover mr-3"
                            onError={(e) => {
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <User className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {official.firstName} {official.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{official.position}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        official.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {official.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {official.contactNo}
                      </div>
                      {official.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {official.email}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(official.termStart), 'MMM d, yyyy')}
                        {official.termEnd && ` - ${format(new Date(official.termEnd), 'MMM d, yyyy')}`}
                      </div>
                      {official._count?.attendance !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {official._count.attendance} attendance record(s)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewOfficial(official)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/officials/${official.id}/edit`}
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
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No officials found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first official'}
            </p>
            <Link
              href="/officials/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Official
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
              of <span className="font-medium">{pagination.total}</span> officials
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
        {showViewModal && selectedOfficial && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Official Details</h2>
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
                    <div className="flex items-center">
                      {selectedOfficial.photo ? (
                        <img
                          src={getFileUrl(selectedOfficial.photo)}
                          alt={`${selectedOfficial.firstName} ${selectedOfficial.lastName}`}
                          className="h-20 w-20 rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                          <User className="h-10 w-10 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {selectedOfficial.firstName} {selectedOfficial.lastName}
                        </h3>
                        <p className="text-lg text-gray-600">{selectedOfficial.position}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${
                      selectedOfficial.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOfficial.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Contact Number</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedOfficial.contactNo}
                        </p>
                      </div>
                      {selectedOfficial.email && (
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedOfficial.email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Term Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Term Start</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(selectedOfficial.termStart), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      {selectedOfficial.termEnd && (
                        <div>
                          <p className="text-xs text-gray-500">Term End</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {format(new Date(selectedOfficial.termEnd), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      {selectedOfficial._count?.attendance !== undefined && (
                        <div>
                          <p className="text-xs text-gray-500">Attendance Records</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedOfficial._count.attendance} record(s)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {selectedOfficial.documents && selectedOfficial.documents.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedOfficial.documents.map((doc: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 truncate block text-center"
                          >
                            Document {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Link
                    href={`/officials/${selectedOfficial.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Official
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



