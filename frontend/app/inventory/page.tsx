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
  Package,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  QrCode,
  AlertTriangle,
  MapPin,
  Activity,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ArrowLeft,
  Send
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Shield } from 'lucide-react'

const INVENTORY_LOG_TYPES = [
  { value: 'ADD', label: 'Add Stock', color: 'bg-green-100 text-green-800', icon: PlusCircle },
  { value: 'REMOVE', label: 'Remove', color: 'bg-red-100 text-red-800', icon: MinusCircle },
  { value: 'RELEASE', label: 'Release', color: 'bg-blue-100 text-blue-800', icon: ArrowRight },
  { value: 'RETURN', label: 'Return', color: 'bg-yellow-100 text-yellow-800', icon: ArrowLeft },
  { value: 'ADJUSTMENT', label: 'Adjustment', color: 'bg-purple-100 text-purple-800', icon: Activity },
]

const BARANGAYS = [
  'Bagong Bayan', 'Buena Suerte', 'Barotuan', 'Bebeladan', 'Corong-corong',
  'Mabini', 'Manlag', 'Masagana', 'New Ibajay', 'Pasadeña', 'Maligaya',
  'San Fernando', 'Sibaltan', 'Teneguiban', 'Villa Libertad', 'Villa Paz',
  'Bucana', 'Aberawan'
]

export default function InventoryPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [barangayFilter, setBarangayFilter] = useState<string>('')
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showLogModal, setShowLogModal] = useState(false)
  const [showReleaseModal, setShowReleaseModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: inventoryData, isLoading } = useQuery(
    ['inventory', page, searchQuery, categoryFilter, barangayFilter, lowStockFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (categoryFilter) {
        params.append('category', categoryFilter)
      }
      if (barangayFilter && user?.role === 'ADMIN') {
        params.append('barangay', barangayFilter)
      }
      if (lowStockFilter) {
        params.append('lowStock', 'true')
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const { data } = await api.get(`/inventory?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery(['inventory-stats', barangayFilter], async () => {
    const params = new URLSearchParams({ limit: '1' })
    if (barangayFilter && user?.role === 'ADMIN') {
      params.append('barangay', barangayFilter)
    }
    const [all, lowStock] = await Promise.all([
      api.get(`/inventory?${params}`),
      api.get(`/inventory?lowStock=true&${params}`),
    ])
    return {
      total: all.data.pagination?.total || 0,
      lowStock: lowStock.data.pagination?.total || 0,
    }
  })

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/inventory/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('inventory')
        toast.success('Inventory item deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete inventory item')
      },
    }
  )

  const handleViewItem = async (item: any) => {
    setSelectedItem(item)
    setShowViewModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this inventory item?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleGenerateQR = async (itemId: string) => {
    try {
      const { data } = await api.get(`/inventory/${itemId}/qrcode`)
      setQrCodeData(data.qrCode)
      setShowQRModal(true)
    } catch (error: any) {
      toast.error('Failed to generate QR code')
    }
  }

  const handleRelease = (item: any) => {
    setSelectedItem(item)
    setShowReleaseModal(true)
  }

  const items = inventoryData?.items || []
  const pagination = inventoryData?.pagination

  const isLowStock = (item: any) => item.quantity <= item.minStock

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
      return
    }
    if (hydrated && user?.role === 'BARANGAY_EVALUATOR') {
      router.push('/dashboard')
      return
    }
  }, [hydrated, user, router])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Inventory Management</h1>
                <p className="text-white/90 text-sm sm:text-base">Track barangay equipment and supplies</p>
              </div>
            </div>
            <Link
              href="/inventory/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats?.lowStock || 0}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
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
                placeholder="Search by item name, category, location, or QR code..."
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
                  showFilters || categoryFilter || barangayFilter || lowStockFilter
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
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value)
                      setPage(1)
                    }}
                    placeholder="Filter by category..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                </div>
                {user?.role === 'ADMIN' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay
                    </label>
                    <select
                      value={barangayFilter}
                      onChange={(e) => {
                        setBarangayFilter(e.target.value)
                        setPage(1)
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                    >
                      <option value="">All Barangays</option>
                      {BARANGAYS.map((barangay) => (
                        <option key={barangay} value={barangay}>
                          {barangay}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Status
                  </label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={lowStockFilter}
                      onChange={(e) => {
                        setLowStockFilter(e.target.checked)
                        setPage(1)
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Show only low stock items
                    </label>
                  </div>
                </div>
                <div className="sm:col-span-2 flex items-end">
                  <button
                    onClick={() => {
                      setCategoryFilter('')
                      setLowStockFilter(false)
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

        {/* Inventory Items List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading inventory items...</p>
          </div>
        ) : items.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Photo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      {user?.role === 'ADMIN' && (
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Barangay
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.photo ? (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${item.photo}`}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className={`text-sm font-semibold ${isLowStock(item) ? 'text-red-600' : 'text-gray-900'}`}>
                                {item.itemName}
                              </div>
                              {isLowStock(item) && (
                                <div className="flex items-center mt-1">
                                  <AlertTriangle className="h-3 w-3 text-red-500 mr-1" />
                                  <span className="text-xs text-red-600">Low stock</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{item.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${isLowStock(item) ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.quantity} {item.unit}
                          </div>
                          {item.minStock > 0 && (
                            <div className={`text-xs ${isLowStock(item) ? 'text-red-500' : 'text-gray-500'}`}>
                              Min: {item.minStock} {item.unit}
                            </div>
                          )}
                        </td>
                        {user?.role === 'ADMIN' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.barangay || 'N/A'}
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.location ? (
                            <div className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {item.location}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleGenerateQR(item.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleRelease(item)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Release Item"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleViewItem(item)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/inventory/${item.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(item.id)}
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
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden ${
                    isLowStock(item) ? 'border-red-200' : 'border-gray-100'
                  }`}
                >
                  {/* Item Image */}
                  {item.photo && (
                    <div className="w-full h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${item.photo}`}
                        alt={item.itemName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {item.itemName}
                        </h3>
                        {isLowStock(item) && (
                          <span className="px-2 py-1 inline-flex text-xs font-medium rounded-full bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <Package className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Category</p>
                        <p className="text-sm font-medium text-gray-900">{item.category}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Quantity</p>
                        <p className={`text-lg font-bold ${
                          isLowStock(item) ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {item.quantity} {item.unit}
                        </p>
                        {item.minStock > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Min: {item.minStock} {item.unit}
                          </p>
                        )}
                      </div>
                      {item.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {item.location}
                        </div>
                      )}
                      {user?.role === 'ADMIN' && item.barangay && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Shield className="h-4 w-4 mr-2 text-gray-400" />
                          {item.barangay}
                        </div>
                      )}
                      {item._count?.logs !== undefined && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Activity className="h-4 w-4 mr-2 text-gray-400" />
                          {item._count.logs} log(s)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleRelease(item)}
                        className="flex-1 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <Send className="h-4 w-4 inline mr-1" />
                        Release
                      </button>
                      <button
                        onClick={() => handleGenerateQR(item.id)}
                        className="flex-1 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <QrCode className="h-4 w-4 inline mr-1" />
                        QR Code
                      </button>
                      <button
                        onClick={() => handleViewItem(item)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/inventory/${item.id}/edit`}
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
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No inventory items found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first inventory item'}
            </p>
            <Link
              href="/inventory/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Item
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
              of <span className="font-medium">{pagination.total}</span> items
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
        {showViewModal && selectedItem && (
          <InventoryViewModal
            item={selectedItem}
            onClose={() => setShowViewModal(false)}
            onLogClick={() => {
              setShowViewModal(false)
              setShowLogModal(true)
            }}
          />
        )}

        {/* Log Modal */}
        {showLogModal && selectedItem && (
          <InventoryLogModal
            item={selectedItem}
            onClose={() => {
              setShowLogModal(false)
              setSelectedItem(null)
            }}
            onSuccess={() => {
              queryClient.invalidateQueries('inventory')
              setShowLogModal(false)
            }}
          />
        )}

        {/* Release Modal */}
        {showReleaseModal && selectedItem && (
          <InventoryReleaseModal
            item={selectedItem}
            onClose={() => {
              setShowReleaseModal(false)
              setSelectedItem(null)
            }}
            onSuccess={() => {
              queryClient.invalidateQueries('inventory')
              setShowReleaseModal(false)
            }}
          />
        )}

        {/* QR Code Modal */}
        {showQRModal && qrCodeData && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">QR Code</h2>
                  <button
                    onClick={() => {
                      setShowQRModal(false)
                      setQrCodeData(null)
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-4">{selectedItem.itemName}</p>
                  <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4" />
                  <p className="text-xs text-gray-500">{selectedItem.qrCode}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

// Inventory View Modal Component
function InventoryViewModal({ item, onClose, onLogClick }: { item: any; onClose: () => void; onLogClick: () => void }) {
  const { user } = useAuthStore()
  const { data: itemDetails } = useQuery(
    ['inventory-item', item.id],
    async () => {
      const { data } = await api.get(`/inventory/${item.id}`)
      return data
    },
    { enabled: !!item.id }
  )

  const isLowStock = item.quantity <= item.minStock

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Inventory Item Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
            aria-label="Close"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {/* Item Photo */}
          {(itemDetails?.photo || item.photo) && (
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${itemDetails?.photo || item.photo}`}
                  alt={item.itemName}
                  className="max-w-full h-auto max-h-80 rounded-lg border-2 border-gray-200 object-contain bg-gray-50 shadow-sm"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {item.itemName}
                </h3>
                {isLowStock && (
                  <span className="px-3 py-1 inline-flex text-xs font-medium rounded-full bg-red-100 text-red-800 mt-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low Stock Alert
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Item Information</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900">{item.category}</p>
                </div>
                {user?.role === 'ADMIN' && item.barangay && (
                  <div>
                    <p className="text-xs text-gray-500">Barangay</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {item.barangay}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className={`text-2xl font-bold ${
                    isLowStock ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {item.quantity} {item.unit}
                  </p>
                  {item.minStock > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum Stock: {item.minStock} {item.unit}
                    </p>
                  )}
                </div>
                {item.location && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {item.location}
                    </p>
                  </div>
                )}
                {item.qrCode && (
                  <div>
                    <p className="text-xs text-gray-500">QR Code</p>
                    <p className="text-sm font-medium text-gray-900 font-mono">{item.qrCode}</p>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
              <div className="space-y-3">
                {item.notes && (
                  <div>
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{item.notes}</p>
                  </div>
                )}
                {itemDetails?._count && (
                  <div>
                    <p className="text-xs text-gray-500">Activity Logs</p>
                    <p className="text-sm font-medium text-gray-900">
                      {itemDetails._count.logs || 0} log(s)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          {itemDetails?.logs && itemDetails.logs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {itemDetails.logs.slice(0, 5).map((log: any) => {
                  const logType = INVENTORY_LOG_TYPES.find(t => t.value === log.type)
                  const Icon = logType?.icon || Activity
                  return (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full mr-2 ${logType?.color || 'bg-gray-100 text-gray-800'}`}>
                          <Icon className="h-3 w-3 inline mr-1" />
                          {logType?.label || log.type}
                        </span>
                        <span className="text-sm text-gray-700">
                          {log.quantity} {item.unit}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={onLogClick}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
            >
              Add Log Entry
            </button>
            <Link
              href={`/inventory/${item.id}/edit`}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
            >
              Edit Item
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inventory Release Modal Component
function InventoryReleaseModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    quantity: '',
    notes: '',
    officialId: '',
  })
  const [loading, setLoading] = useState(false)
  const [officialSearch, setOfficialSearch] = useState('')
  const [selectedOfficial, setSelectedOfficial] = useState<any>(null)
  const [showOfficialSearch, setShowOfficialSearch] = useState(false)

  // Fetch active officials
  const { data: officialsData } = useQuery(
    ['officials', officialSearch],
    async () => {
      const params = new URLSearchParams({
        isActive: 'true',
        limit: '50',
      })
      if (officialSearch) {
        params.append('search', officialSearch)
      }
      const { data } = await api.get(`/officials?${params}`)
      return data
    },
    {
      enabled: showOfficialSearch,
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedOfficial) {
      toast.error('Please select a barangay official')
      return
    }

    if (parseInt(formData.quantity) > item.quantity) {
      toast.error('Quantity cannot exceed available stock')
      return
    }

    setLoading(true)

    try {
      await api.post(`/inventory/${item.id}/logs`, {
        type: 'RELEASE',
        quantity: formData.quantity,
        notes: formData.notes,
        releasedTo: selectedOfficial.id,
      })
      toast.success('Item released successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to release item')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOfficial = (official: any) => {
    setSelectedOfficial(official)
    setFormData(prev => ({ ...prev, officialId: official.id }))
    setOfficialSearch('')
    setShowOfficialSearch(false)
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!showOfficialSearch) {
      setOfficialSearch('')
    }
  }, [showOfficialSearch])

  const officials = officialsData?.officials || []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Release Item</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{item.itemName}</p>
                <p className="text-sm text-gray-500">Available: {item.quantity} {item.unit}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Release To (Barangay Official) <span className="text-red-500">*</span>
              </label>
              {selectedOfficial ? (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedOfficial.firstName} {selectedOfficial.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{selectedOfficial.position}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOfficial(null)
                        setFormData(prev => ({ ...prev, officialId: '' }))
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search barangay official..."
                    value={officialSearch}
                    onChange={(e) => {
                      setOfficialSearch(e.target.value)
                      setShowOfficialSearch(true)
                    }}
                    onFocus={() => setShowOfficialSearch(true)}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  />
                  {showOfficialSearch && officials.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {officials.map((official: any) => (
                        <button
                          key={official.id}
                          type="button"
                          onClick={() => handleSelectOfficial(official)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">
                            {official.firstName} {official.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{official.position}</p>
                        </button>
                      ))}
                    </div>
                  )}
                  {showOfficialSearch && officialSearch && officials.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                      <p className="text-sm text-gray-500">No officials found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                min="1"
                max={item.quantity}
                placeholder={`Enter quantity (max: ${item.quantity} ${item.unit})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes about the release..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedOfficial}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Releasing...' : 'Release Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Inventory Log Modal Component
function InventoryLogModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'ADD',
    quantity: '',
    notes: '',
    releasedTo: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/inventory/${item.id}/logs`, formData)
      toast.success('Inventory log added successfully!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add inventory log')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Add Inventory Log</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                {INVENTORY_LOG_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
                min="1"
                placeholder={`Enter quantity in ${item.unit}`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            {(formData.type === 'RELEASE' || formData.type === 'RETURN') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Released To
                </label>
                <input
                  type="text"
                  value={formData.releasedTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, releasedTo: e.target.value }))}
                  placeholder="Person or department name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Log'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

