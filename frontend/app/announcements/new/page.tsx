'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, X, Upload, FileText } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { hydrated, user } = useAuthStore()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL',
    isPinned: false,
    startDate: '',
    endDate: '',
    targetBarangays: [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const BARANGAYS = [
    'Bagong Bayan', 'Buena Suerte', 'Barotuan', 'Bebeladan', 'Corong-corong',
    'Mabini', 'Manlag', 'Masagana', 'New Ibajay', 'Pasadeña', 'Maligaya',
    'San Fernando', 'Sibaltan', 'Teneguiban', 'Villa Libertad', 'Villa Paz',
    'Bucana', 'Aberawan'
  ]

  useEffect(() => {
    if (hydrated && !user) {
      router.push('/login')
    }
  }, [hydrated, user, router])

  const createMutation = useMutation(
    async (data: FormData) => {
      const response = await api.post('/announcements', data, {
        timeout: 30000, // 30 second timeout for file uploads
      })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('announcements')
        toast.success('Announcement created successfully!')
        router.push('/announcements')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to create announcement')
        setLoading(false)
      },
    }
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.title)
    formDataToSend.append('content', formData.content)
    formDataToSend.append('type', formData.type)
    formDataToSend.append('isPinned', formData.isPinned.toString())
    formDataToSend.append('targetBarangays', JSON.stringify(formData.targetBarangays))
    if (formData.startDate) {
      formDataToSend.append('startDate', formData.startDate)
    }
    if (formData.endDate) {
      formDataToSend.append('endDate', formData.endDate)
    }

    files.forEach((file) => {
      formDataToSend.append('attachments', file)
    })

    createMutation.mutate(formDataToSend)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/announcements"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Announcements
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">New Announcement</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="Enter announcement title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                placeholder="Enter announcement content"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="GENERAL">General</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="NOTICE">Notice</option>
                  <option value="EVENT">Event</option>
                </select>
              </div>

              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Barangays (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Leave empty to send to all barangays. Select specific barangays to target the announcement.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-300 rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
                {BARANGAYS.map((barangay) => (
                  <label key={barangay} className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.targetBarangays.includes(barangay)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetBarangays: [...formData.targetBarangays, barangay] })
                        } else {
                          setFormData({ ...formData, targetBarangays: formData.targetBarangays.filter(b => b !== barangay) })
                        }
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{barangay}</span>
                  </label>
                ))}
              </div>
              {formData.targetBarangays.length > 0 && (
                <p className="text-sm text-primary-600 mt-2">
                  Selected: {formData.targetBarangays.length} barangay(s)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center cursor-pointer"
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload files or drag and drop
                  </span>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link
                href="/announcements"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || createMutation.isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading || createMutation.isLoading ? 'Creating...' : 'Create Announcement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}

