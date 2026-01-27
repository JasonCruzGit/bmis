'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload, X, User, Building2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { getFileUrl } from '@/lib/utils'

export default function EditResidentPage() {
  const router = useRouter()
  const params = useParams()
  const residentId = params.id as string
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    dateOfBirth: '',
    sex: '',
    civilStatus: '',
    barangay: '',
    address: '',
    contactNo: '',
    occupation: '',
    education: '',
    householdId: '',
    residencyStatus: 'NEW',
    lengthOfStayYears: '',
    lengthOfStayMonths: '',
    isPWD: false,
  })

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null)

  // Fetch resident data
  const { data: resident, isLoading: residentLoading } = useQuery(
    ['resident', residentId],
    async () => {
      const { data } = await api.get(`/residents/${residentId}`)
      return data
    },
    {
      enabled: !!residentId,
      onSuccess: (data) => {
        if (data) {
          // Parse lengthOfStay string to extract years and months
          let years = ''
          let months = ''
          if (data.lengthOfStay) {
            const yearsMatch = data.lengthOfStay.match(/(\d+)\s*year/i)
            const monthsMatch = data.lengthOfStay.match(/(\d+)\s*month/i)
            if (yearsMatch) {
              years = yearsMatch[1]
            }
            if (monthsMatch) {
              months = monthsMatch[1]
            }
          }
          
          setFormData({
            firstName: data.firstName || '',
            middleName: data.middleName || '',
            lastName: data.lastName || '',
            suffix: data.suffix || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            sex: data.sex || '',
            civilStatus: data.civilStatus || '',
            barangay: data.barangay || '',
            address: data.address || '',
            contactNo: data.contactNo || '',
            occupation: data.occupation || '',
            education: data.education || '',
            householdId: data.householdId || '',
            residencyStatus: data.residencyStatus || 'NEW',
            lengthOfStayYears: years,
            lengthOfStayMonths: months,
            isPWD: data.isPWD || false,
          })
          if (data.idPhoto) {
            setIdPhotoPreview(getFileUrl(data.idPhoto))
          }
        }
      }
    }
  )

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
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
      
      // Combine years and months into lengthOfStay
      const lengthOfStayParts: string[] = []
      if (formData.lengthOfStayYears && formData.lengthOfStayYears !== '0') {
        const years = parseInt(formData.lengthOfStayYears)
        lengthOfStayParts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
      }
      if (formData.lengthOfStayMonths && formData.lengthOfStayMonths !== '0') {
        const months = parseInt(formData.lengthOfStayMonths)
        lengthOfStayParts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
      }
      const lengthOfStay = lengthOfStayParts.length > 0 ? lengthOfStayParts.join(', ') : ''
      
      // Append all form fields (excluding lengthOfStayYears and lengthOfStayMonths)
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'lengthOfStayYears' || key === 'lengthOfStayMonths') {
          return // Skip these, we'll add lengthOfStay instead
        }
        if (value !== '' && value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            submitData.append(key, value.toString())
          } else {
            submitData.append(key, value)
          }
        }
      })
      
      // Append combined lengthOfStay if it has a value
      if (lengthOfStay) {
        submitData.append('lengthOfStay', lengthOfStay)
      }

      // Append photo if selected
      if (idPhotoFile) {
        submitData.append('idPhoto', idPhotoFile)
      }

      await api.put(`/residents/${residentId}`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      toast.success('Resident updated successfully!')
      queryClient.invalidateQueries('residents')
      queryClient.invalidateQueries(['resident', residentId])
      router.push('/residents')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update resident')
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

  if (residentLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading resident data...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/residents"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Resident</h1>
              <p className="mt-1 text-gray-600">Update resident information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suffix (Jr., Sr., etc.)
                </label>
                <input
                  type="text"
                  name="suffix"
                  value={formData.suffix}
                  onChange={handleInputChange}
                  placeholder="Jr., Sr., III"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sex <span className="text-red-500">*</span>
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Civil Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="civilStatus"
                  value={formData.civilStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Residency Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="residencyStatus"
                  value={formData.residencyStatus}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="NEW">New</option>
                  <option value="RETURNING">Returning</option>
                  <option value="TRANSFERRED">Transferred</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1.5" />
                  Length of Stay
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      name="lengthOfStayYears"
                      value={formData.lengthOfStayYears}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Years</option>
                      {Array.from({ length: 101 }, (_, i) => (
                        <option key={i} value={i}>
                          {i} {i === 1 ? 'year' : 'years'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      name="lengthOfStayMonths"
                      value={formData.lengthOfStayMonths}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {i} {i === 1 ? 'month' : 'months'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">How long the resident has been staying in the barangay</p>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 transition-all duration-200 cursor-pointer bg-white">
                  <input
                    type="checkbox"
                    name="isPWD"
                    checked={formData.isPWD}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-gray-700">Person with Disability (PWD)</span>
                    <p className="text-xs text-gray-500 mt-1">Check if the resident is a person with disability</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Barangay</option>
                  <option value="Bagong Bayan">Bagong Bayan</option>
                  <option value="Buena Suerte">Buena Suerte</option>
                  <option value="Barotuan">Barotuan</option>
                  <option value="Bebeladan">Bebeladan</option>
                  <option value="Corong-corong">Corong-corong</option>
                  <option value="Mabini">Mabini</option>
                  <option value="Manlag">Manlag</option>
                  <option value="Masagana">Masagana</option>
                  <option value="New Ibajay">New Ibajay</option>
                  <option value="Pasadeña">Pasadeña</option>
                  <option value="Maligaya">Maligaya</option>
                  <option value="San Fernando">San Fernando</option>
                  <option value="Sibaltan">Sibaltan</option>
                  <option value="Teneguiban">Teneguiban</option>
                  <option value="Villa Libertad">Villa Libertad</option>
                  <option value="Villa Paz">Villa Paz</option>
                  <option value="Bucana">Bucana</option>
                  <option value="Aberawan">Aberawan</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  required
                  placeholder="09XX XXX XXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  name="occupation"
                  value={formData.occupation}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education
                </label>
                <select
                  name="education"
                  value={formData.education}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Household (Optional)
                </label>
                <select
                  name="householdId"
                  value={formData.householdId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ID Photo</h2>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {idPhotoPreview ? (
                  <div className="relative">
                    <img
                      src={idPhotoPreview}
                      alt="Preview"
                      className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-32 w-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID Photo
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-500">
                    {idPhotoFile ? idPhotoFile.name : resident?.idPhoto ? 'Current photo' : 'No file selected'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Maximum file size: 5MB. Supported formats: JPG, PNG
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <Link
              href="/residents"
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Resident
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}



