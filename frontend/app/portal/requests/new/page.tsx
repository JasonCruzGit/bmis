'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import portalApi from '@/lib/portal-api'
import toast from 'react-hot-toast'
import { FileText, CheckCircle, Clock, CreditCard, FileCheck, Bell } from 'lucide-react'
import Link from 'next/link'
import PortalHeader from '@/components/PortalHeader'

const PURPOSE_OPTIONS = [
  'Employment Requirement',
  'School Requirement',
  'Scholarship Application',
  'Financial Assistance',
  'Loan Application',
  'Government Benefit Requirement',
  'Business Permit Requirement',
  'Legal Documentation',
  'Travel Requirement',
  'Other',
]

export default function NewRequestPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    documentType: '',
    purpose: '',
  })

  const { data: documentTypes } = useQuery('document-types', async () => {
    const { data } = await portalApi.get('/document-types')
    return data?.types || []
  })

  const createMutation = useMutation(
    async (data: any) => {
      console.log('Submitting request with data:', data)
      const response = await portalApi.post('/requests', data)
      return response.data
    },
    {
      onSuccess: (data) => {
        console.log('Request submitted successfully:', data)
        queryClient.invalidateQueries('my-requests')
        toast.success('Document request submitted successfully!')
        router.push('/portal/requests')
      },
      onError: (error: any) => {
        console.error('Error submitting request:', error)
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit request'
        toast.error(errorMessage)
      },
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.documentType) {
      toast.error('Please select a document type')
      return
    }
    
    console.log('Form submitted, documentType:', formData.documentType)
    
    try {
      createMutation.mutate({
        documentType: formData.documentType,
        purpose: formData.purpose || undefined,
      })
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      toast.error('An error occurred while submitting the request')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PortalHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Request Document</h1>
              <p className="text-sm text-gray-600 mt-1">Submit a new document request to the barangay office</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Document Request Form</h2>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.documentType}
                  onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                >
                  <option value="">Select document type</option>
                  {documentTypes?.map((type: any) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Purpose <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                >
                  <option value="">Select purpose (optional)</option>
                  {PURPOSE_OPTIONS.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                <Link
                  href="/portal/dashboard"
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 text-center transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || !formData.documentType}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {createMutation.isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Request Process Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Request Process</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Review Stage</h4>
                  <p className="text-sm text-gray-600">Your request will be reviewed by barangay staff</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Notification</h4>
                  <p className="text-sm text-gray-600">You will be notified once your request is approved or rejected</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Payment</h4>
                  <p className="text-sm text-gray-600">If approved, payment must be made over the counter at the barangay hall office</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-500">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Processing</h4>
                  <p className="text-sm text-gray-600">Once payment is received at the barangay office, your document will be processed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

