'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, FileText, Search, FileCheck, User, Edit3, X } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function NewDocumentPage() {
  const router = useRouter()
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [searchResident, setSearchResident] = useState('')
  const [selectedResident, setSelectedResident] = useState<any>(null)
  const [showResidentSearch, setShowResidentSearch] = useState(false)

  const [formData, setFormData] = useState({
    documentType: '',
    residentId: '',
    purpose: '',
    template: '',
  })

  // Fetch document types
  const { data: documentTypes } = useQuery('document-types', async () => {
    const { data } = await api.get('/documents/types')
    return data?.types || []
  })

  // Search residents
  const { data: searchResults } = useQuery(
    ['search-residents', searchResident],
    async () => {
      if (searchResident.length < 2) return []
      const { data } = await api.get(`/residents/search?q=${searchResident}`)
      return data || []
    },
    {
      enabled: searchResident.length >= 2 && showResidentSearch,
    }
  )

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
    }
  }, [hydrated, router])

  // Helper function to replace placeholders in template
  const replacePlaceholders = (template: string, resident: any, purpose: string) => {
    if (!template) return template
    
    let updatedTemplate = template
    
    if (resident) {
      const residentName = `${resident.firstName} ${resident.lastName}`.trim()
      updatedTemplate = updatedTemplate.replace(/\[RESIDENT_NAME\]/g, residentName)
      updatedTemplate = updatedTemplate.replace(/\[RESIDENT_ADDRESS\]/g, resident.address || '')
    }
    
    if (purpose) {
      updatedTemplate = updatedTemplate.replace(/\[PURPOSE\]/g, purpose)
    }
    
    return updatedTemplate
  }

  // Auto-update template when resident or purpose changes
  useEffect(() => {
    if (selectedResident && formData.template && formData.documentType) {
      // Check if template still has placeholders that need to be replaced
      if (formData.template.includes('[RESIDENT_NAME]') || 
          formData.template.includes('[RESIDENT_ADDRESS]') || 
          (formData.purpose && formData.template.includes('[PURPOSE]'))) {
        setFormData(prev => ({
          ...prev,
          template: replacePlaceholders(prev.template, selectedResident, prev.purpose)
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResident, formData.purpose])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      // If purpose changes and template has placeholders, update them
      if (name === 'purpose' && updated.template && selectedResident) {
        // Only update if template still has placeholders (user hasn't manually edited it completely)
        if (updated.template.includes('[PURPOSE]')) {
          updated.template = replacePlaceholders(updated.template, selectedResident, value)
        }
      }
      return updated
    })
  }

  const handleSelectResident = (resident: any) => {
    setSelectedResident(resident)
    setFormData(prev => {
      const updated = { ...prev, residentId: resident.id }
      // Update template with resident information
      if (updated.template) {
        updated.template = replacePlaceholders(updated.template, resident, updated.purpose)
      }
      return updated
    })
    setSearchResident('')
    setShowResidentSearch(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/documents', formData)

      toast.success('Document issued successfully!')
      queryClient.invalidateQueries('documents')
      router.push('/documents')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to issue document')
    } finally {
      setLoading(false)
    }
  }

  const getDefaultTemplate = (type: string) => {
    const templates: Record<string, string> = {
      INDIGENCY: `This is to certify that [RESIDENT_NAME], of legal age, [RESIDENT_ADDRESS], is a bonafide resident of this barangay and is indigent. This certification is issued upon the request of the above-named person for [PURPOSE].`,
      RESIDENCY: `This is to certify that [RESIDENT_NAME], of legal age, [RESIDENT_ADDRESS], is a bonafide resident of this barangay. This certification is issued upon the request of the above-named person for [PURPOSE].`,
      CLEARANCE: `This is to certify that [RESIDENT_NAME], of legal age, [RESIDENT_ADDRESS], is a bonafide resident of this barangay and has no pending case or derogatory record in this office. This certification is issued upon the request of the above-named person for [PURPOSE].`,
      SOLO_PARENT: `This is to certify that [RESIDENT_NAME], of legal age, [RESIDENT_ADDRESS], is a bonafide resident of this barangay and is a solo parent. This certification is issued upon the request of the above-named person for [PURPOSE].`,
      GOOD_MORAL: `This is to certify that [RESIDENT_NAME], of legal age, [RESIDENT_ADDRESS], is a bonafide resident of this barangay and is known to be of good moral character. This certification is issued upon the request of the above-named person for [PURPOSE].`,
    }
    return templates[type] || ''
  }

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value
    setFormData(prev => {
      const defaultTemplate = getDefaultTemplate(type)
      // If resident is already selected, replace placeholders immediately
      const template = selectedResident 
        ? replacePlaceholders(defaultTemplate, selectedResident, prev.purpose)
        : defaultTemplate
      
      return {
      ...prev,
      documentType: type,
        template,
      }
    })
  }

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Enhanced Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-xl shadow-lg p-6 border border-primary-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <Link
              href="/documents"
              className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Issue Document</h1>
              <p className="text-white/90 text-sm">Generate a new barangay document</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
          {/* Document Type Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <FileCheck className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Document Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Document Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleTypeChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select document type...</option>
                  {documentTypes?.map((type: any) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purpose
                </label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="e.g., For scholarship application"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Resident Selection Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Resident Information</h2>
            </div>
            <div className="space-y-4">
              {selectedResident ? (
                <div className="p-5 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border-2 border-primary-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {selectedResident.firstName} {selectedResident.lastName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{selectedResident.address}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResident(null)
                        setFormData(prev => ({ ...prev, residentId: '' }))
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Search className="h-4 w-4 inline mr-1.5" />
                    Search Resident <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name or address..."
                      value={searchResident}
                      onChange={(e) => {
                        setSearchResident(e.target.value)
                        setShowResidentSearch(true)
                      }}
                      onFocus={() => setShowResidentSearch(true)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                    />
                  </div>
                  {showResidentSearch && searchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {searchResults.map((resident: any) => (
                        <button
                          key={resident.id}
                          type="button"
                          onClick={() => handleSelectResident(resident)}
                          className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <p className="font-semibold text-gray-900">
                            {resident.firstName} {resident.lastName}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5">{resident.address}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Template Section */}
          {formData.documentType && (
            <div className="border-t border-gray-200 pt-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Edit3 className="h-5 w-5 text-primary-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">Document Template</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Template (Optional)
                </label>
                <textarea
                  name="template"
                  value={formData.template}
                  onChange={handleInputChange}
                  rows={8}
                  placeholder="Enter custom template text. Use [RESIDENT_NAME], [RESIDENT_ADDRESS], and [PURPOSE] as placeholders."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white font-mono text-sm resize-none"
                />
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Note:</span> Leave empty to use default template. Available placeholders: 
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded mx-1">[RESIDENT_NAME]</span>, 
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded mx-1">[RESIDENT_ADDRESS]</span>, 
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded mx-1">[PURPOSE]</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <Link
              href="/documents"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.residentId}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Issuing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Issue Document
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}



