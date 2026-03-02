'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import portalApi from '@/lib/portal-api'
import { FileText, Clock, CheckCircle, XCircle, Download } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'
import toast from 'react-hot-toast'
import PortalHeader from '@/components/PortalHeader'

export default function RequestDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const { data: request, isLoading, error, refetch } = useQuery(
    ['request-details', requestId],
    async () => {
      const { data } = await portalApi.get(`/requests/${requestId}`)
      console.log('Request details loaded:', data)
      console.log('Document filePath:', data?.document?.filePath)
      
      // If document exists but no filePath, wait a bit and refetch (PDF might be generating)
      if (data?.document && !data.document.filePath && (data.status === 'APPROVED' || data.status === 'COMPLETED')) {
        setTimeout(() => {
          refetch()
        }, 2000)
      }
      
      return data
    },
    { enabled: !!requestId, refetchInterval: (data) => {
      // Refetch every 2 seconds if document exists but no filePath
      if (data?.document && !data.document.filePath && (data.status === 'APPROVED' || data.status === 'COMPLETED')) {
        return 2000
      }
      return false
    } }
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'PENDING':
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5" />
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-5 w-5" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5" />
      default:
        return null
    }
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading request details...</p>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <PortalHeader />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Request not found</h2>
            <Link href="/portal/requests" className="text-blue-600 hover:text-blue-700 font-semibold">
              Back to Requests
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortalHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Details</h1>
              <p className="text-sm text-gray-600 mt-1">View details and status of your document request</p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Request #{request.requestNumber}
              </h2>
              <p className="text-sm text-gray-600">
                Submitted on {format(new Date(request.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${getStatusColor(
                request.status
              )}`}
            >
              {getStatusIcon(request.status)}
              {request.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Document Type</label>
              <p className="mt-1 text-gray-900">
                {request.documentType.replace('_', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Payment Status</label>
              <p className="mt-1 text-gray-900">{request.paymentStatus}</p>
            </div>
            {request.purpose && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Purpose</label>
                <p className="mt-1 text-gray-900">{request.purpose}</p>
              </div>
            )}
            {request.processedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">Processed Date</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(request.processedAt), 'MMMM d, yyyy')}
                </p>
              </div>
            )}
            {request.processor && (
              <div>
                <label className="text-sm font-medium text-gray-500">Processed By</label>
                <p className="mt-1 text-gray-900">
                  {request.processor.firstName} {request.processor.lastName}
                </p>
              </div>
            )}
          </div>

          {request.rejectedReason && (
            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-red-900 mb-1">Rejection Reason</h3>
              <p className="text-sm text-red-800">{request.rejectedReason}</p>
            </div>
          )}

          {request.notes && (
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-blue-900 mb-1">Notes</h3>
              <p className="text-sm text-blue-800">{request.notes}</p>
            </div>
          )}

          {request.document && (
            <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-900 mb-1">Document Ready</h3>
                  <p className="text-sm text-green-800">
                    Document #{request.document.documentNumber} has been issued
                  </p>
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-500 mt-1">
                      FilePath: {request.document.filePath || 'Not set'}
                    </p>
                  )}
                </div>
                {request.document.filePath ? (
                  <a
                    href={getFileUrl(request.document.filePath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold transition-all"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                ) : (
                  <div className="text-sm text-gray-500">
                    PDF generating...
                  </div>
                )}
              </div>
            </div>
          )}

          {request.status === 'APPROVED' && request.paymentStatus === 'UNPAID' && (
            <div className="bg-blue-50/80 backdrop-blur-sm border border-blue-200 rounded-xl p-4">
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Request Approved</h3>
                <p className="text-sm text-blue-800">
                  {request.fee ? `Fee: ₱${Number(request.fee).toFixed(2)} - Payment can be made at the barangay office` : 'Your request has been approved. Please visit the barangay office to complete the process.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

