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
  FileText,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Printer,
  X,
  Shield
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'

export default function DocumentsPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: documentsData, isLoading } = useQuery(
    ['documents', page, searchQuery, typeFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      if (typeFilter) {
        params.append('type', typeFilter)
      }
      const { data } = await api.get(`/documents?${params}`)
      return data
    }
  )

  const { data: documentTypes } = useQuery('document-types', async () => {
    const { data } = await api.get('/documents/types')
    return data?.types || []
  })

  const { data: stats } = useQuery('documents-stats', async () => {
    const { data } = await api.get('/documents?limit=1')
    return {
      total: data.pagination?.total || 0,
    }
  })

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document)
    setShowViewModal(true)
  }

  const handleDownloadPDF = async (documentId: string) => {
    try {
      const response = await api.get(`/documents/${documentId}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `document-${documentId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF downloaded successfully')
    } catch (error: any) {
      toast.error('Failed to download PDF')
    }
  }

  const documents = documentsData?.documents || []
  const pagination = documentsData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INDIGENCY: 'bg-blue-100 text-blue-800',
      RESIDENCY: 'bg-green-100 text-green-800',
      CLEARANCE: 'bg-yellow-100 text-yellow-800',
      SOLO_PARENT: 'bg-purple-100 text-purple-800',
      GOOD_MORAL: 'bg-indigo-100 text-indigo-800',
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getDocumentTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                <FileText className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Documents</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and issue barangay documents</p>
              </div>
            </div>
            <Link
              href="/documents/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Issue Document
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          {documentTypes?.slice(0, 3).map((type: any) => (
            <div key={type.value} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{type.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">-</p>
                </div>
                <div className={`p-3 rounded-lg ${getDocumentTypeColor(type.value)}`}>
                  <FileText className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by document number, resident name..."
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
                  showFilters || typeFilter
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
                    Document Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    {documentTypes?.map((type: any) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setTypeFilter('')
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

        {/* Documents Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Resident
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Issued Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Issued By
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((document: any) => (
                    <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {document.documentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getDocumentTypeColor(document.documentType)}`}>
                          {getDocumentTypeLabel(document.documentType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {document.resident?.firstName} {document.resident?.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{document.resident?.address}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {format(new Date(document.issuedDate), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {document.issuer?.firstName} {document.issuer?.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDocument(document)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(document.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.print()}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
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
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by issuing your first document'}
            </p>
            <Link
              href="/documents/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Issue Document
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
              of <span className="font-medium">{pagination.total}</span> documents
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
        {showViewModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Document Details</h2>
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
                        {getDocumentTypeLabel(selectedDocument.documentType)}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Document No: {selectedDocument.documentNumber}</p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getDocumentTypeColor(selectedDocument.documentType)}`}>
                      {getDocumentTypeLabel(selectedDocument.documentType)}
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
                          {selectedDocument.resident?.firstName} {selectedDocument.resident?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedDocument.resident?.address}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Document Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Issued Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(selectedDocument.issuedDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Issued By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedDocument.issuer?.firstName} {selectedDocument.issuer?.lastName}
                        </p>
                      </div>
                      {selectedDocument.purpose && (
                        <div>
                          <p className="text-xs text-gray-500">Purpose</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedDocument.purpose}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={() => handleDownloadPDF(selectedDocument.id)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    <Printer className="h-4 w-4 inline mr-2" />
                    Print
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



