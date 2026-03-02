'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Home,
  FileText,
  Loader2,
  Shield,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

export default function PublicResidentPage() {
  const params = useParams()
  const residentId = params.id as string
  const [resident, setResident] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResident = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/public/residents/qr/${residentId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || 'Resident not found')
        }
        
        const data = await response.json()
        setResident(data)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching resident:', err)
        setError(err.message || 'Resident not found')
      } finally {
        setLoading(false)
      }
    }

    if (residentId) {
      fetchResident()
    }
  }, [residentId])

  // Helper function to get file URL
  const getFileUrl = (filePath: string | null | undefined): string => {
    if (!filePath) return ''
    if (filePath.startsWith('http')) return filePath
    
    // Determine API base URL
    let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
    
    if (!apiBaseUrl && typeof window !== 'undefined') {
      const protocol = window.location.protocol
      const hostname = window.location.hostname
      apiBaseUrl = `${protocol}//${hostname}:5001`
    }
    
    return `${apiBaseUrl}${filePath}`
  }

  // Set page title when resident is loaded
  useEffect(() => {
    if (resident) {
      document.title = `${resident.firstName} ${resident.lastName} - Resident Information | BIS`
    }
  }, [resident])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-sm w-full border border-white/50">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <Loader2 className="relative h-16 w-16 text-primary-600 animate-spin mx-auto" />
          </div>
          <p className="text-gray-700 font-semibold text-lg mb-2">Loading resident information...</p>
          <p className="text-xs text-gray-400">Please wait while we fetch the data</p>
          <div className="mt-4 flex justify-center gap-1">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !resident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-white/50">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-red-200 rounded-full blur-xl opacity-30"></div>
            <div className="relative h-20 w-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto border-4 border-red-100">
              <User className="h-10 w-10 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Resident Not Found</h1>
          <p className="text-gray-600 mb-6 text-lg">{error || 'The resident information could not be found.'}</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200">
            <Shield className="h-4 w-4 text-gray-400" />
            <p className="text-xs text-gray-500">Please verify the QR code is valid and try again</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto py-6 sm:py-10 px-4">
        {/* Verified Badge */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-full shadow-sm backdrop-blur-sm">
            <div className="p-1.5 bg-green-100 rounded-full">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-700">Verified Resident Information</span>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </div>

        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 mb-6 border border-white/50 overflow-hidden relative">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Photo Section */}
            <div className="flex-shrink-0 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-blue-500 rounded-full blur-xl opacity-30"></div>
              {resident.idPhoto ? (
                <img
                  src={getFileUrl(resident.idPhoto)}
                  alt={`${resident.firstName} ${resident.lastName}`}
                  className="relative h-36 w-36 sm:h-44 sm:w-44 rounded-full object-cover border-4 border-white shadow-2xl ring-4 ring-primary-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                    ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div className={`relative h-36 w-36 sm:h-44 sm:w-44 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 flex items-center justify-center border-4 border-white shadow-2xl ring-4 ring-primary-100 ${resident.idPhoto ? 'hidden' : ''}`}>
                <User className="h-20 w-20 sm:h-24 sm:w-24 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* Name and Info Section */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
              </h1>
              
              {/* Address and Contact - Corporate Style */}
              <div className="space-y-3 mb-4">
                <div className="flex items-start justify-center sm:justify-start gap-3 text-gray-700">
                  <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                  <span className="text-base sm:text-lg font-medium leading-relaxed">{resident.address}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-gray-700">
                  <Phone className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <a href={`tel:${resident.contactNo}`} className="text-base sm:text-lg font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    {resident.contactNo}
                  </a>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start mt-4">
                <span className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-primary-100 to-primary-50 text-primary-800 rounded-full flex items-center gap-2 shadow-sm border border-primary-200">
                  <CheckCircle className="h-4 w-4" />
                  {resident.residencyStatus}
                </span>
                <span className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 rounded-full shadow-sm border border-gray-200">
                  {resident.civilStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-8 border border-white/50">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-gray-200">
            <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-50 rounded-xl shadow-sm">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Date of Birth</p>
              <div className="flex items-center text-gray-900">
                <Calendar className="h-4 w-4 mr-2 text-primary-600" />
                <span className="font-semibold text-base">
                  {format(new Date(resident.dateOfBirth), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sex</p>
              <p className="font-semibold text-base text-gray-900">{resident.sex}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Civil Status</p>
              <p className="font-semibold text-base text-gray-900">{resident.civilStatus}</p>
            </div>
            {resident.occupation && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Occupation</p>
                <div className="flex items-center text-gray-900">
                  <Briefcase className="h-4 w-4 mr-2 text-primary-600" />
                  <span className="font-semibold text-base">{resident.occupation}</span>
                </div>
              </div>
            )}
            {resident.education && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
                <div className="flex items-center text-gray-900">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary-600" />
                  <span className="font-semibold text-base">{resident.education}</span>
                </div>
              </div>
            )}
            {resident.household && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Household</p>
                <div className="flex items-center text-gray-900">
                  <Home className="h-4 w-4 mr-2 text-primary-600" />
                  <span className="font-semibold text-base">
                    {resident.household.householdNumber} - {resident.household.headName}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        {resident.documents && resident.documents.length > 0 && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 sm:p-7 mt-5 sm:mt-6 border border-white/50">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-yellow-50 rounded-xl shadow-sm">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Documents</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resident.documents.map((doc: any) => (
                <div
                  key={doc.documentNumber}
                  className="group p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                      <FileText className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 mb-1 truncate">{doc.documentType}</p>
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-mono text-xs">{doc.documentNumber}</span>
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(doc.issuedDate), 'MMM d, yyyy')}</span>
                      </div>
                      {doc.purpose && (
                        <p className="text-xs text-gray-400 mt-2 line-clamp-2">{doc.purpose}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-10 pt-8 border-t border-gray-200/50">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border-2 border-primary-100">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-blue-600 rounded-full">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">Barangay Management Information System</p>
              <p className="text-xs text-gray-500">Official Resident Information</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">This information is verified and secure</p>
        </div>
      </div>
    </div>
  )
}

