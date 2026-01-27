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
  Eye, 
  Filter,
  Download,
  Grid,
  List,
  X,
  Home,
  MapPin,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Map,
  User,
  Phone,
  Calendar,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { getFileUrl } from '@/lib/utils'

export default function HouseholdsPage() {
  const { hydrated } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedResident, setSelectedResident] = useState<any>(null)
  const [showResidentModal, setShowResidentModal] = useState(false)
  const [residentLoading, setResidentLoading] = useState(false)
  const queryClient = useQueryClient()

  const { data: householdsData, isLoading } = useQuery(
    ['households', page, searchQuery],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      const { data } = await api.get(`/households?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('households-stats', async () => {
    const { data } = await api.get('/households?limit=1')
    return {
      total: data.pagination?.total || 0,
      totalResidents: 0, // Calculate from data
    }
  })

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/households/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('households')
        toast.success('Household deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete household')
      },
    }
  )

  const handleViewHousehold = (household: any) => {
    setSelectedHousehold(household)
    setShowViewModal(true)
  }

  const handleViewResident = async (residentId: string) => {
    try {
      setResidentLoading(true)
      const { data } = await api.get(`/residents/${residentId}`)
      setSelectedResident(data)
      setShowResidentModal(true)
      setShowViewModal(false) // Close household modal
    } catch (error: any) {
      toast.error('Failed to load resident details')
      console.error('Error fetching resident:', error)
    } finally {
      setResidentLoading(false)
    }
  }

  const households = householdsData?.households || []
  const pagination = householdsData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  if (!hydrated) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
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
                <Home className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Households</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and view household information</p>
              </div>
            </div>
            <Link
              href="/households/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Household
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Households</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalResidents || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
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
                placeholder="Search by household number, head name, or address..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showFilters
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
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 border-l border-gray-300 ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
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
                    Household Size
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900">
                    <option value="">All Sizes</option>
                    <option value="1-3">1-3 members</option>
                    <option value="4-6">4-6 members</option>
                    <option value="7+">7+ members</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Households List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading households...</p>
          </div>
        ) : households.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Household Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Head of Household
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {households.map((household: any) => (
                      <tr key={household.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {household.householdNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {household.headName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 max-w-xs truncate">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{household.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {household.householdSize || household.residents?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            {household.income ? (
                              <>
                                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                                ₱{Number(household.income).toLocaleString()}
                              </>
                            ) : (
                              <span className="text-gray-400">Not specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewHousehold(household)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/households/${household.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this household? This action cannot be undone.')) {
                                  deleteMutation.mutate(household.id)
                                }
                              }}
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
              {households.map((household: any) => (
                <div
                  key={household.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {household.householdNumber}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{household.headName}</p>
                      </div>
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <Home className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{household.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {household.householdSize || household.residents?.length || 0} members
                      </div>
                      {household.income && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          ₱{Number(household.income).toLocaleString()}
                        </div>
                      )}
                      {household.latitude && household.longitude && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Map className="h-4 w-4 mr-2 text-gray-400" />
                          Location mapped
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewHousehold(household)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/households/${household.id}/edit`}
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
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No households found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first household'}
            </p>
            <Link
              href="/households/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Household
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
              of <span className="font-medium">{pagination.total}</span> households
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
        {showViewModal && selectedHousehold && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Household Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Close</span>
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  <div className="p-4 bg-primary-100 rounded-xl">
                    <Home className="h-12 w-12 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedHousehold.householdNumber}
                    </h3>
                    <p className="text-lg text-gray-600">{selectedHousehold.headName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Household Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Household Number</p>
                        <p className="text-sm font-medium text-gray-900">{selectedHousehold.householdNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Head of Household</p>
                        <p className="text-sm font-medium text-gray-900">{selectedHousehold.headName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Household Size</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedHousehold.householdSize || selectedHousehold.residents?.length || 0} members
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Location & Income</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">{selectedHousehold.address}</p>
                      </div>
                      {selectedHousehold.income && (
                        <div>
                          <p className="text-xs text-gray-500">Monthly Income</p>
                          <p className="text-sm font-medium text-gray-900">
                            ₱{Number(selectedHousehold.income).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {selectedHousehold.livingConditions && (
                        <div>
                          <p className="text-xs text-gray-500">Living Conditions</p>
                          <p className="text-sm font-medium text-gray-900">{selectedHousehold.livingConditions}</p>
                        </div>
                      )}
                      {selectedHousehold.latitude && selectedHousehold.longitude && (
                        <div>
                          <p className="text-xs text-gray-500">Coordinates</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedHousehold.latitude.toFixed(6)}, {selectedHousehold.longitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedHousehold.residents && selectedHousehold.residents.length > 0 && (
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Residents ({selectedHousehold.residents.length})</h4>
                      <div className="space-y-2">
                        {selectedHousehold.residents.map((resident: any) => (
                          <div key={resident.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {resident.firstName} {resident.lastName}
                              </p>
                              <p className="text-xs text-gray-500">{resident.civilStatus}</p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewResident(resident.id)
                              }}
                              disabled={residentLoading}
                              className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Link
                    href={`/households/${selectedHousehold.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Household
                  </Link>
                  <Link
                    href={`/residents?householdId=${selectedHousehold.id}`}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    View Residents
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resident Details Modal */}
        {showResidentModal && selectedResident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Resident Details</h2>
                <button
                  onClick={() => {
                    setShowResidentModal(false)
                    setSelectedResident(null)
                    setShowViewModal(true) // Reopen household modal
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {selectedResident.idPhoto ? (
                      <img src={getFileUrl(selectedResident.idPhoto)} alt="" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedResident.firstName} {selectedResident.middleName} {selectedResident.lastName} {selectedResident.suffix}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedResident.residencyStatus === 'NEW' ? 'bg-green-100 text-green-800' :
                        selectedResident.residencyStatus === 'RETURNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedResident.residencyStatus}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                        {selectedResident.civilStatus}
                      </span>
                      {selectedResident.isPWD && (
                        <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                          PWD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                    <div className="space-y-3">
                      {selectedResident.dateOfBirth && (
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(selectedResident.dateOfBirth), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Sex</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.sex}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Civil Status</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.civilStatus}</p>
                      </div>
                      {selectedResident.barangay && (
                        <div>
                          <p className="text-xs text-gray-500">Barangay</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedResident.barangay}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      {selectedResident.contactNo && (
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {selectedResident.contactNo}
                          </p>
                        </div>
                      )}
                      {selectedResident.address && (
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedResident.address}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
                    <div className="space-y-3">
                      {selectedResident.occupation && (
                        <div>
                          <p className="text-xs text-gray-500">Occupation</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.occupation}</p>
                        </div>
                      )}
                      {selectedResident.education && (
                        <div>
                          <p className="text-xs text-gray-500">Education</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.education}</p>
                        </div>
                      )}
                      {selectedResident.lengthOfStay && (
                        <div>
                          <p className="text-xs text-gray-500">Length of Stay</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.lengthOfStay}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedResident.household && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Household</h4>
                      <div>
                        <p className="text-xs text-gray-500">Household Number</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.household.householdNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowResidentModal(false)
                      setSelectedResident(null)
                      setShowViewModal(true) // Reopen household modal
                    }}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}



