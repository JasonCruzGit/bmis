'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import { FileText, Download } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'
import PortalHeader from '@/components/PortalHeader'

export default function DocumentsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      if (!token) {
        router.push('/portal/login')
      }
    }
  }, [router])

  const { data: documentsData, isLoading } = useQuery(
    ['my-documents', page],
    async () => {
      const { data } = await portalApi.get(`/documents?page=${page}&limit=20`)
      return data
    }
  )

  const documents = documentsData?.documents || []
  const pagination = documentsData?.pagination

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortalHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Issued Documents</h1>
              <p className="text-sm text-gray-600 mt-1">View and download your issued documents</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading documents...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-emerald-600 to-green-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Document Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Document Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Issued Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-bold text-emerald-600">
                          {doc.documentNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {doc.documentType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {format(new Date(doc.issuedDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {doc.purpose || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {doc.filePath ? (
                          <a
                            href={getFileUrl(doc.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl font-semibold transition-all"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        ) : (
                          <span className="text-sm text-gray-400">No file available</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">You don't have any issued documents yet.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="mt-6 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-5">
            <div className="text-sm text-gray-600">
              Showing {pagination.page * pagination.limit - pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} documents
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-gray-700"
              >
                Previous
              </button>
              <div className="px-4 py-2.5 text-sm font-bold text-gray-900 bg-gray-50 rounded-xl">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-4 py-2.5 text-sm font-semibold border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

