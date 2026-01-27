'use client'

import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import { 
  Search, 
  Eye, 
  Filter,
  Download,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Calendar,
  Activity,
  FileText,
  Monitor,
  Globe,
  Shield
} from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

const ENTITY_TYPES = [
  'RESIDENT',
  'HOUSEHOLD',
  'DOCUMENT',
  'INCIDENT',
  'PROJECT',
  'OFFICIAL',
  'BLOTTER',
  'FINANCIAL',
  'ANNOUNCEMENT',
  'DISASTER',
  'INVENTORY',
  'INVENTORY_LOG',
  'ATTENDANCE',
  'AUDIT',
]

const ACTION_TYPES = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'UPDATE_STATUS',
  'LOGIN',
  'LOGOUT',
]

export default function AuditPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [selectedLog, setSelectedLog] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)

  const { data: auditData, isLoading } = useQuery(
    ['audit', page, searchQuery, entityTypeFilter, actionFilter, dateRange],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (entityTypeFilter) {
        params.append('entityType', entityTypeFilter)
      }
      if (actionFilter) {
        params.append('action', actionFilter)
      }
      if (dateRange.start) {
        params.append('startDate', dateRange.start)
      }
      if (dateRange.end) {
        params.append('endDate', dateRange.end)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const { data } = await api.get(`/audit?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('audit-stats', async () => {
    try {
      const { data } = await api.get('/audit?limit=1')
      return {
        total: data.pagination?.total || 0,
      }
    } catch {
      return { total: 0 }
    }
  })

  const handleViewLog = (log: any) => {
    setSelectedLog(log)
    setShowViewModal(true)
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      if (entityTypeFilter) params.append('entityType', entityTypeFilter)
      if (actionFilter) params.append('action', actionFilter)
      
      const { data } = await api.get(`/audit?${params}&limit=10000`)
      const csv = convertToCSV(data.logs)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `audit-logs-${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error: any) {
      console.error('Failed to export audit logs')
    }
  }

  const convertToCSV = (logs: any[]) => {
    const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity ID', 'IP Address', 'User Agent']
    const rows = logs.map(log => [
      format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      `${log.user?.firstName} ${log.user?.lastName}`,
      log.action,
      log.entityType,
      log.entityId || '',
      log.ipAddress || '',
      log.userAgent || ''
    ])
    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
  }

  const logs = auditData?.logs || []
  const pagination = auditData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATE')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETE')) return 'bg-red-100 text-red-800'
    if (action.includes('LOGIN')) return 'bg-purple-100 text-purple-800'
    return 'bg-gray-100 text-gray-800'
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
                <ClipboardList className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Audit Logs</h1>
                <p className="text-white/90 text-sm sm:text-base">Track all system activities and changes</p>
              </div>
            </div>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Log Entries</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <ClipboardList className="h-6 w-6 text-blue-600" />
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
                placeholder="Search by user, action, entity type, or entity ID..."
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
                  showFilters || entityTypeFilter || actionFilter || dateRange.start || dateRange.end
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type
                  </label>
                  <select
                    value={entityTypeFilter}
                    onChange={(e) => {
                      setEntityTypeFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    {ENTITY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action
                  </label>
                  <select
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Actions</option>
                    {ACTION_TYPES.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, start: e.target.value }))
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => {
                      setDateRange(prev => ({ ...prev, end: e.target.value }))
                      setPage(1)
                    }}
                    min={dateRange.start}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-end">
                  <button
                    onClick={() => {
                      setEntityTypeFilter('')
                      setActionFilter('')
                      setDateRange({ start: '', end: '' })
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

        {/* Audit Logs Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading audit logs...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(log.createdAt), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(new Date(log.createdAt), 'h:mm:ss a')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user?.firstName} {log.user?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.user?.email} • {log.user?.role}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {log.entityType || '—'}
                        </div>
                        {log.entityId && (
                          <div className="text-xs text-gray-500 font-mono mt-1">
                            ID: {log.entityId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.ipAddress ? (
                          <div className="text-sm text-gray-600 flex items-center">
                            <Globe className="h-4 w-4 mr-1 text-gray-400" />
                            {log.ipAddress}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewLog(log)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No audit logs found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria' : 'Audit logs will appear here as system activities occur'}
            </p>
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
              of <span className="font-medium">{pagination.total}</span> log entries
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
        {showViewModal && selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Audit Log Details</h2>
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
                        {selectedLog.action}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(selectedLog.createdAt), 'MMMM d, yyyy h:mm:ss a')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">User Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">User</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedLog.user?.firstName} {selectedLog.user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{selectedLog.user?.email}</p>
                        <p className="text-xs text-gray-500">Role: {selectedLog.user?.role}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Entity Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Entity Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedLog.entityType || '—'}
                        </p>
                      </div>
                      {selectedLog.entityId && (
                        <div>
                          <p className="text-xs text-gray-500">Entity ID</p>
                          <p className="text-sm font-medium text-gray-900 font-mono">
                            {selectedLog.entityId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Technical Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.ipAddress && (
                      <div>
                        <p className="text-xs text-gray-500">IP Address</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedLog.ipAddress}
                        </p>
                      </div>
                    )}
                    {selectedLog.userAgent && (
                      <div>
                        <p className="text-xs text-gray-500">User Agent</p>
                        <p className="text-sm font-medium text-gray-900 flex items-center">
                          <Monitor className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{selectedLog.userAgent}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {selectedLog.changes && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Changes</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono overflow-x-auto">
                        {typeof selectedLog.changes === 'string' 
                          ? selectedLog.changes 
                          : JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}



