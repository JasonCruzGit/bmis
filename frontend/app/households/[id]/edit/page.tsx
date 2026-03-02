'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, MapPin, User, Home, Users } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function EditHouseholdPage() {
  const router = useRouter()
  const params = useParams()
  const householdId = params.id as string
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    headName: '',
    headFirstName: '',
    headMiddleName: '',
    headLastName: '',
    headOfFamilyName: '',
    address: '',
    houseNumber: '',
    province: '',
    purokSitio: '',
    streetSubdivision: '',
    barangay: '',
    zone: '',
    municipality: '',
    houseBuildingNumber: '',
    unitNumber: '',
    latitude: '',
    longitude: '',
    income: '',
    livingConditions: '',
    householdSize: '1',
    ownerMainFamily: '',
    extendedFamily: '',
    mainFamilyHeadId: '',
    numberOfFamilyMembers: '',
    yearFirstResided: '',
    placeOfOriginMunicipality: '',
    placeOfOriginProvince: '',
  })

  // Fetch household data
  const { data: household, isLoading: householdLoading } = useQuery(
    ['household', householdId],
    async () => {
      const { data } = await api.get(`/households/${householdId}`)
      return data
    },
    {
      enabled: !!householdId,
      onSuccess: (data) => {
        if (data) {
          setFormData({
            headName: data.headName || '',
            headFirstName: data.headFirstName || '',
            headMiddleName: data.headMiddleName || '',
            headLastName: data.headLastName || '',
            headOfFamilyName: data.headOfFamilyName || '',
            address: data.address || '',
            houseNumber: data.houseNumber || '',
            province: data.province || '',
            purokSitio: data.purokSitio || '',
            streetSubdivision: data.streetSubdivision || '',
            barangay: data.barangay || '',
            zone: data.zone || '',
            municipality: data.municipality || '',
            houseBuildingNumber: data.houseBuildingNumber || '',
            unitNumber: data.unitNumber || '',
            latitude: data.latitude?.toString() || '',
            longitude: data.longitude?.toString() || '',
            income: data.income?.toString() || '',
            livingConditions: data.livingConditions || '',
            householdSize: data.householdSize?.toString() || '1',
            ownerMainFamily: data.ownerMainFamily || '',
            extendedFamily: data.extendedFamily || '',
            mainFamilyHeadId: data.mainFamilyHeadId || '',
            numberOfFamilyMembers: data.numberOfFamilyMembers?.toString() || '',
            yearFirstResided: data.yearFirstResided?.toString() || '',
            placeOfOriginMunicipality: data.placeOfOriginMunicipality || '',
            placeOfOriginProvince: data.placeOfOriginProvince || '',
          })
        }
      }
    }
  )

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
    }
  }, [hydrated, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }))
          toast.success('Location captured successfully!')
        },
        (error) => {
          toast.error('Failed to get location: ' + error.message)
        }
      )
    } else {
      toast.error('Geolocation is not supported by your browser')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        headName: formData.headFirstName && formData.headLastName 
          ? `${formData.headFirstName} ${formData.headMiddleName ? formData.headMiddleName + ' ' : ''}${formData.headLastName}`.trim()
          : formData.headName,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        income: formData.income ? parseFloat(formData.income) : null,
        householdSize: parseInt(formData.householdSize),
      }

      await api.put(`/households/${householdId}`, submitData)

      toast.success('Household updated successfully!')
      queryClient.invalidateQueries('households')
      queryClient.invalidateQueries(['household', householdId])
      router.push('/households')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update household')
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

  if (householdLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading household data...</div>
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
              href="/households"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Household</h1>
              <p className="mt-1 text-gray-600">Update household information</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Basic Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House Number
                </label>
                <input
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleInputChange}
                  placeholder="Enter house number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  House/Building Number
                </label>
                <input
                  type="text"
                  name="houseBuildingNumber"
                  value={formData.houseBuildingNumber}
                  onChange={handleInputChange}
                  placeholder="Enter house/building number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit Number
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleInputChange}
                  placeholder="Enter unit number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street/Subdivision
                </label>
                <input
                  type="text"
                  name="streetSubdivision"
                  value={formData.streetSubdivision}
                  onChange={handleInputChange}
                  placeholder="Enter street/subdivision"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="Enter zone"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purok/Sitio
                </label>
                <input
                  type="text"
                  name="purokSitio"
                  value={formData.purokSitio}
                  onChange={handleInputChange}
                  placeholder="Enter purok/sitio"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barangay
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
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
                  Municipality
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  placeholder="Enter municipality"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="Enter complete address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">This field will be used as the main address. You can manually enter or it will be constructed from the fields above.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Household Size <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="householdSize"
                  value={formData.householdSize}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Head of Family Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Head of the Family Name</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="headFirstName"
                  value={formData.headFirstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter first name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="headMiddleName"
                  value={formData.headMiddleName}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="headLastName"
                  value={formData.headLastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter last name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Location (Optional)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 14.5995"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 120.9842"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Current Location
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Click to automatically capture your current location using GPS
                </p>
              </div>
            </div>
          </div>

          {/* Household Condition Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Home className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Household Condition</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner (Main Family)
                </label>
                <select
                  name="ownerMainFamily"
                  value={formData.ownerMainFamily}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Extended Family
                </label>
                <select
                  name="extendedFamily"
                  value={formData.extendedFamily}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indicate Head ID of main family
                </label>
                <input
                  type="text"
                  name="mainFamilyHeadId"
                  value={formData.mainFamilyHeadId}
                  onChange={handleInputChange}
                  placeholder="Enter head ID of main family"
                  disabled={formData.extendedFamily !== 'Yes'}
                  className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    formData.extendedFamily !== 'Yes' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Family Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Family Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of family members <span className="text-gray-500 font-normal">(Bilang ng myembro ng pamilya)</span>
                </label>
                <input
                  type="number"
                  name="numberOfFamilyMembers"
                  value={formData.numberOfFamilyMembers}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter number of family members"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family head's year first resided in the barangay <span className="text-gray-500 font-normal">(Unang taon nang paninirahan ng puno ng pamilya sa barangay)</span>
                </label>
                <input
                  type="number"
                  name="yearFirstResided"
                  value={formData.yearFirstResided}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2010"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of origin - Municipality <span className="text-gray-500 font-normal">(Lugar na pinanggalingan ng puno ng pamilya - Municipal)</span>
                </label>
                <input
                  type="text"
                  name="placeOfOriginMunicipality"
                  value={formData.placeOfOriginMunicipality}
                  onChange={handleInputChange}
                  placeholder="Enter municipality"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Place of origin - Province <span className="text-gray-500 font-normal">(Lugar na pinanggalingan ng puno ng pamilya - Provincial)</span>
                </label>
                <input
                  type="text"
                  name="placeOfOriginProvince"
                  value={formData.placeOfOriginProvince}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Socioeconomic Information Section */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Socioeconomic Information (Optional)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Income (₱)
                </label>
                <input
                  type="number"
                  name="income"
                  value={formData.income}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Living Conditions
                </label>
                <select
                  name="livingConditions"
                  value={formData.livingConditions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select...</option>
                  <option value="OWNED">Owned</option>
                  <option value="RENTED">Rented</option>
                  <option value="BORROWED">Borrowed</option>
                  <option value="SHARED">Shared</option>
                  <option value="TEMPORARY">Temporary</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <Link
              href="/households"
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
                  Update Household
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}



