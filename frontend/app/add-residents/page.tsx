'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload, X, User, UserCircle, Phone, MapPin, Briefcase, GraduationCap, Home, Camera, UserPlus, QrCode, Download, Building2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function AddResidentsPage() {
  const router = useRouter()
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [idPhotoPreview, setIdPhotoPreview] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [newResidentName, setNewResidentName] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [capturingPhoto, setCapturingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
    purokSitio: '',
    municipality: '',
    province: '',
    streetSubdivision: '',
    zone: '',
    houseBuildingNumber: '',
    unitNumber: '',
    latitude: '',
    longitude: '',
    contactNo: '',
    occupation: '',
    education: '',
    householdId: '',
    residencyStatus: 'RESIDENT',
    lengthOfStayYears: '',
    lengthOfStayMonths: '',
    isPWD: false,
  })

  const [idPhotoFile, setIdPhotoFile] = useState<File | null>(null)
  const PH_MOBILE_REGEX = /^09\d{9}$/

  // Fetch households for dropdown
  const { data: householdsData } = useQuery('households', async () => {
    const { data } = await api.get('/households?limit=1000')
    return data?.households || []
  }, {
    enabled: mounted && hydrated
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
    }
  }, [hydrated, router])

  useEffect(() => {
    return () => {
      stopCameraStream()
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'contactNo') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 11)
      setFormData(prev => ({ ...prev, contactNo: digitsOnly }))
      return
    }
    const nextValue =
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : value
    setFormData(prev => ({ ...prev, [name]: nextValue }))
  }

  const validateStepOne = () => {
    const requiredFields: Array<{ key: keyof typeof formData; label: string }> = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'sex', label: 'Sex' },
      { key: 'civilStatus', label: 'Civil Status' },
      { key: 'residencyStatus', label: 'Residency Status' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'contactNo', label: 'Contact Number' },
    ]

    const missingField = requiredFields.find(field => !String(formData[field.key] || '').trim())
    if (missingField) {
      toast.error(`${missingField.label} is required before moving to page 2`)
      return false
    }
    if (!PH_MOBILE_REGEX.test(formData.contactNo.trim())) {
      toast.error('Contact Number must be a valid Philippine mobile number (09XXXXXXXXX)')
      return false
    }
    return true
  }

  const validateBeforeSubmit = () => {
    const requiredFields: Array<{ key: keyof typeof formData; label: string }> = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'sex', label: 'Sex' },
      { key: 'civilStatus', label: 'Civil Status' },
      { key: 'residencyStatus', label: 'Residency Status' },
      { key: 'barangay', label: 'Barangay' },
      { key: 'contactNo', label: 'Contact Number' },
      { key: 'address', label: 'Complete Address' },
    ]

    const missingField = requiredFields.find(field => !String(formData[field.key] || '').trim())
    if (missingField) {
      toast.error(`${missingField.label} is required`)
      return false
    }
    if (!PH_MOBILE_REGEX.test(formData.contactNo.trim())) {
      toast.error('Contact Number must be a valid Philippine mobile number (09XXXXXXXXX)')
      return false
    }
    return true
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

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const closeCameraModal = () => {
    stopCameraStream()
    setShowCameraModal(false)
    setCapturingPhoto(false)
  }

  const handleOpenCamera = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Camera capture is not supported in this browser')
      fileInputRef.current?.click()
      return
    }

    try {
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
      } catch {
        // Fallback for devices/browsers that don't support facingMode
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      }

      streamRef.current = stream
      setShowCameraModal(true)

      // Wait for modal render then attach stream to video element
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          videoRef.current.play().catch(() => {
            toast.error('Unable to start camera preview')
            closeCameraModal()
          })
        }
      }, 0)
    } catch {
      toast.error('Unable to access camera. Please allow camera permission.')
      fileInputRef.current?.click()
    }
  }

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Camera is not ready')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      toast.error('Unable to capture photo')
      return
    }

    setCapturingPhoto(true)
    ctx.drawImage(video, 0, 0, width, height)

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCapturingPhoto(false)
          toast.error('Failed to capture photo')
          return
        }

        if (blob.size > 5 * 1024 * 1024) {
          setCapturingPhoto(false)
          toast.error('Captured image is larger than 5MB. Please try again.')
          return
        }

        const file = new File([blob], `resident-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
        setIdPhotoFile(file)
        setIdPhotoPreview(canvas.toDataURL('image/jpeg'))
        setCapturingPhoto(false)
        closeCameraModal()
        toast.success('Photo captured successfully')
      },
      'image/jpeg',
      0.92
    )
  }

  const handleUseCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast.error('Geolocation is not supported on this device/browser')
      return
    }

    setGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({
          ...prev,
          latitude: latitude.toFixed(6),
          longitude: longitude.toFixed(6),
        }))
        setGettingLocation(false)
        toast.success('Current location captured')
      },
      (error) => {
        setGettingLocation(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied')
        } else if (error.code === error.TIMEOUT) {
          toast.error('Location request timed out')
        } else {
          toast.error('Unable to get current location')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateBeforeSubmit()) return
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
          } else if (key === 'latitude' || key === 'longitude') {
            // Convert to number for latitude/longitude
            const numValue = parseFloat(value as string)
            if (!isNaN(numValue)) {
              submitData.append(key, numValue.toString())
            }
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
        // Still show success, but QR code generation failed
      }
      
      // Reset form after successful submission
      setFormData({
        firstName: '',
        middleName: '',
        lastName: '',
        suffix: '',
        dateOfBirth: '',
        sex: '',
        civilStatus: '',
        barangay: '',
        address: '',
        purokSitio: '',
        municipality: '',
        province: '',
        streetSubdivision: '',
        zone: '',
        houseBuildingNumber: '',
        unitNumber: '',
        latitude: '',
        longitude: '',
        contactNo: '',
        occupation: '',
        education: '',
        householdId: '',
        residencyStatus: 'RESIDENT',
        lengthOfStayYears: '',
        lengthOfStayMonths: '',
        isPWD: false,
      })
      setIdPhotoFile(null)
      setIdPhotoPreview(null)
      setCurrentStep(1)
      
      // Optionally redirect to residents list or stay on page for another entry
      // router.push('/residents')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add resident')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted || !hydrated) {
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
              href="/dashboard"
              className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Add Residents</h1>
              <p className="text-white/90 text-sm">Register new residents in the barangay system</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
          {/* Step Indicator */}
          <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 1 ? 'bg-primary-600 text-white' : 'bg-green-600 text-white'
              }`}>
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Page 1</p>
                <p className="text-xs text-gray-600">Personal & Contact Basics</p>
              </div>
            </div>
            <div className="flex-1 h-1 bg-gray-200 rounded-full max-w-28">
              <div className={`h-1 rounded-full transition-all duration-300 ${currentStep === 2 ? 'w-full bg-primary-600' : 'w-0 bg-primary-600'}`} />
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                currentStep === 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Page 2</p>
                <p className="text-xs text-gray-600">Address, Extras & Photo</p>
              </div>
            </div>
          </div>

          {currentStep === 1 && (
            <>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1.5" />
                  Length of Stay
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <select
                      name="lengthOfStayYears"
                      value={formData.lengthOfStayYears}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
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
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Building2 className="h-4 w-4 inline mr-1.5" />
                  Barangay <span className="text-red-500">*</span>
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
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
                  placeholder="09XXXXXXXXX"
                  inputMode="numeric"
                  maxLength={11}
                  pattern="^09\d{9}$"
                  title="Enter a valid Philippine mobile number (09XXXXXXXXX)"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
            </div>
          </div>
            </>
          )}

          {currentStep === 2 && (
            <>
          {/* Address Details Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Address Details</h2>
            </div>
            <div className="mb-5">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={gettingLocation}
                className="inline-flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold text-sm"
              >
                {gettingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Getting location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Use Current Location
                  </>
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  House/Building Number
                </label>
                <input
                  type="text"
                  name="houseBuildingNumber"
                  value={formData.houseBuildingNumber}
                  onChange={handleInputChange}
                  placeholder="Enter house/building number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Unit Number
                </label>
                <input
                  type="text"
                  name="unitNumber"
                  value={formData.unitNumber}
                  onChange={handleInputChange}
                  placeholder="Enter unit number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Street/Subdivision
                </label>
                <input
                  type="text"
                  name="streetSubdivision"
                  value={formData.streetSubdivision}
                  onChange={handleInputChange}
                  placeholder="Enter street/subdivision"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Zone
                </label>
                <input
                  type="text"
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  placeholder="Enter zone"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Purok/Sitio
                </label>
                <input
                  type="text"
                  name="purokSitio"
                  value={formData.purokSitio}
                  onChange={handleInputChange}
                  placeholder="Enter purok/sitio"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Municipality
                </label>
                <input
                  type="text"
                  name="municipality"
                  value={formData.municipality}
                  onChange={handleInputChange}
                  placeholder="Enter municipality"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Province
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="e.g., 14.5995"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  step="any"
                  placeholder="e.g., 120.9842"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none text-gray-900"
                  placeholder="Enter complete address (will be auto-filled from above fields if provided)"
                />
                <p className="text-xs text-gray-500 mt-1">This field will be used as the main address. You can manually enter or it will be constructed from the fields above.</p>
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
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg font-medium"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCamera}
                      className="inline-flex items-center px-5 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg font-medium"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Take Photo
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
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
            </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between gap-3 pt-6 border-t-2 border-gray-200">
            <Link
              href="/residents"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              View Residents
            </Link>
            <div className="flex items-center gap-3">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                >
                  Back to Page 1
                </button>
              )}
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (validateStepOne()) {
                      setCurrentStep(2)
                    }
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
                >
                  Next Page
                </button>
              ) : (
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
              )}
            </div>
          </div>
        </form>

        {/* Camera Capture Modal */}
        {showCameraModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Capture ID Photo</h2>
                <button
                  type="button"
                  onClick={closeCameraModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="rounded-lg overflow-hidden border-2 border-gray-200 bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[360px] object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Position the resident in frame, then tap capture.
                </p>
                <div className="mt-5 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    disabled={capturingPhoto}
                    className="inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-semibold"
                  >
                    {capturingPhoto ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Capturing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Capture Photo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                    }}
                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                  >
                    Close
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

