'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from 'react-query'
import portalApi from '@/lib/portal-api'
import toast from 'react-hot-toast'
import { ArrowLeft, MessageSquare, CheckCircle, FileCheck, Bell, Phone } from 'lucide-react'
import Link from 'next/link'

export default function NewComplaintPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
  })

  const createMutation = useMutation(
    (data: any) => portalApi.post('/complaints', data),
    {
      onSuccess: () => {
        toast.success('Complaint/request submitted successfully!')
        router.push('/portal/dashboard')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to submit complaint')
      },
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <header className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-red-900 overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 border-2 border-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 border border-white rounded-full -ml-32 -mb-32"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/portal/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                Submit Complaint/Request
              </h1>
              <p className="text-lg text-gray-300 font-light">
                File a complaint or request directly to the barangay office
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 -mt-8">
        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-xl border-2 border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Complaint/Request Form</h2>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your complaint or request"
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Category <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                >
                  <option value="">Select category</option>
                  <option value="General">General</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Services">Services</option>
                  <option value="Safety">Safety & Security</option>
                  <option value="Environment">Environment</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Please provide detailed information about your complaint or request..."
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 font-medium transition-all duration-200 resize-none"
                />
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
                  disabled={createMutation.isLoading}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-xl hover:shadow-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {createMutation.isLoading ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* What Happens Next Card */}
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b-2 border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">What happens next?</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-red-500">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <FileCheck className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Review Stage</h4>
                  <p className="text-sm text-gray-600">Your complaint/request will be reviewed by barangay staff</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-red-500">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <Bell className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Status Updates</h4>
                  <p className="text-sm text-gray-600">You will receive updates on the status of your submission</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border-l-4 border-red-500">
                <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                  <Phone className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Follow-up Contact</h4>
                  <p className="text-sm text-gray-600">Staff may contact you for additional information if needed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

