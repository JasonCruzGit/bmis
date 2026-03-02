'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload, X, User, UserCircle, Phone, MapPin, Briefcase, GraduationCap, Home, Camera, QrCode, Download } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function NewResidentPage() {
  const router = useRouter()
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [newResidentName, setNewResidentName] = useState<string>('')

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    sex: '',
    civilStatus: '',
    address: '',
    contactNo: '',
    occupation: '',
    education: '',
    householdId: '',
    residencyStatus: 'RESIDENT',
  })

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null)

  // Fetch households for dropdown
  const { data: householdsData } = useQuery('households', async () => {
    const { data } = await api.get('/households?limit=1000')
    return data?.households || []
  })

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
    }
  }, [hydrated, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setIdPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setIdPhotoFile(null)
    setIdPhotoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = new FormData()
      
      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          submitData.append(key, value)
        }
      })

      // Append photo if selected
      if (idPhotoFile) {
        submitData.append('idPhoto', idPhotoFile)
      }

      const { data: newResident } = await api.post('/residents', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Resident added successfully!')
      queryClient.invalidateQueries('residents')
      
      // Generate and show QR code immediately
      try {
        const { data: qrData } = await api.get(`/residents/${newResident.id}/qrcode`)
        setQrCodeData(qrData.qrCode)
        setQrCodeUrl(qrData.qrCodeUrl)
        setNewResidentName(qrData.residentName || `${formData.firstName} ${formData.lastName}`)
        setShowQRModal(true)
      } catch (qrError: any) {
        console.error('Failed to generate QR code:', qrError)
        // If QR code generation fails, just redirect
        router.push('/residents')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add resident')
    } finally {
      setLoading(false)
    }
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
              href="/residents"
              className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <UserCircle className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Add New Resident</h1>
              <p className="text-white/90 text-sm">Enter resident information to register in the system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
          {/* Personal Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                  placeholder="Enter middle name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Suffix (Jr., Sr., etc.)
                </label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleInputChange}
                  placeholder="Jr., Sr., III"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Civil Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="SINGLE">Single</option>
                  <option value="MARRIED">Married</option>
                  <option value="WIDOWED">Widowed</option>
                  <option value="DIVORCED">Divorced</option>
                  <option value="SEPARATED">Separated</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Residency Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="residencyStatus"
                  value={formData.residencyStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="RESIDENT">Resident</option>
                  <option value="INSTITUTIONAL_HOUSEHOLD">Institutional Household</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none text-gray-900"
                  placeholder="Enter complete address"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1.5" />
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  required
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Additional Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Briefcase className="h-4 w-4 inline mr-1.5" />
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                  placeholder="Enter occupation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <GraduationCap className="h-4 w-4 inline mr-1.5" />
                  Education
                </label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="ELEMENTARY">Elementary</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="SENIOR_HIGH_SCHOOL">Senior High School</option>
                  <option value="VOCATIONAL">Vocational</option>
                  <option value="COLLEGE">College</option>
                  <option value="POST_GRADUATE">Post Graduate</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Home className="h-4 w-4 inline mr-1.5" />
                  Household (Optional)
                </label>
                <select
                  name="householdId"
                  value={formData.householdId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select household...</option>
                  {householdsData?.map((household: any) => (
                    <option key={household.id} value={household.id}>
                      {household.householdNumber} - {household.headName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ID Photo Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Camera className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">ID Photo</h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="flex-shrink-0">
                {idPhotoPreview ? (
                  <div className="relative group">
                    <img
                      src={idPhotoPreview}
                      alt="Preview"
                      className="h-40 w-40 rounded-xl object-cover border-2 border-gray-200 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-40 w-40 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-primary-400 transition-colors">
                    <div className="text-center">
                      <Camera className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No photo</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload ID Photo
                </label>
                <div className="space-y-3">
                  <label className="inline-flex items-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors shadow-md hover:shadow-lg font-medium">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  {idPhotoFile && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm font-medium text-gray-700">
                        Selected: <span className="text-primary-600">{idPhotoFile.name}</span>
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Maximum file size: 5MB. Supported formats: JPG, PNG
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <Link
              href="/residents"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Resident
                </>
              )}
            </button>
          </div>
        </form>

        {/* QR Code Modal */}
        {showQRModal && qrCodeData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">QR Code Generated</h2>
                  <p className="text-sm text-gray-500 mt-1">{newResidentName}</p>
                </div>
                <button
                  onClick={() => {
                    setShowQRModal(false)
                    setQrCodeData(null)
                    setQrCodeUrl(null)
                    setNewResidentName('')
                    router.push('/residents')
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 text-center">
                <div className="mb-4">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-3">
                    <QrCode className="h-8 w-8 text-primary-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    QR code has been generated successfully!
                  </p>
                </div>
                <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4 w-64 h-64 border-2 border-gray-200 rounded-lg p-2 bg-white" />
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code to view resident information
                </p>
                {qrCodeUrl && (
                  <p className="text-xs text-gray-400 font-mono break-all mb-4 px-2">{qrCodeUrl}</p>
                )}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCodeData
                      link.download = `resident-qrcode-${newResidentName.replace(/\s+/g, '-')}.png`
                      link.click()
                      toast.success('QR code downloaded successfully!')
                    }}
                    className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold flex items-center justify-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </button>
                  <button
                    onClick={() => {
                      setShowQRModal(false)
                      setQrCodeData(null)
                      setQrCodeUrl(null)
                      setNewResidentName('')
                      router.push('/residents')
                    }}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    View Residents
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



