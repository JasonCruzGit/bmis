'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useSearchParams } from 'next/navigation'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Archive, 
  Eye, 
  Filter,
  Download,
  Grid,
  List,
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  QrCode,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { getFileUrl } from '@/lib/utils'
import * as XLSX from 'xlsx'

export default function ResidentsPage() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [civilStatusFilter, setCivilStatusFilter] = useState<string>('')
  const [pwdFilter, setPwdFilter] = useState<string>('')
  const [youthFilter, setYouthFilter] = useState<boolean>(false)
  const [barangayFilter, setBarangayFilter] = useState<string>('')
  const [selectedResident, setSelectedResident] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const queryClient = useQueryClient()

  // Handle URL query parameters (e.g., from dashboard breakdown)
  useEffect(() => {
    const barangayParam = searchParams.get('barangay')
    if (barangayParam) {
      setBarangayFilter(barangayParam)
      setShowFilters(true) // Auto-show filters when a barangay is pre-selected
    }
  }, [searchParams])

  const { data: residentsData, isLoading } = useQuery(
    ['residents', page, searchQuery, statusFilter, civilStatusFilter, pwdFilter, youthFilter, barangayFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      if (statusFilter) {
        params.append('residencyStatus', statusFilter)
      }
      if (civilStatusFilter) {
        params.append('civilStatus', civilStatusFilter)
      }
      if (pwdFilter) {
        params.append('isPWD', pwdFilter)
      }
      if (youthFilter) {
        params.append('youth', 'true')
      }
      if (barangayFilter) {
        params.append('barangay', barangayFilter)
      }
      const { data } = await api.get(`/residents?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('residents-stats', async () => {
    const { data } = await api.get('/residents?limit=1')
    return {
      total: data.pagination?.total || 0,
      new: 0, // Calculate from data
      returning: 0,
      transferred: 0
    }
  })

  const fetchResidentsForExport = async () => {
    const params = new URLSearchParams({
      limit: '10000', // Get all residents
    })
    if (searchQuery) {
      params.append('q', searchQuery)
    }
    if (statusFilter) {
      params.append('residencyStatus', statusFilter)
    }
    if (civilStatusFilter) {
      params.append('civilStatus', civilStatusFilter)
    }
    if (pwdFilter) {
      params.append('isPWD', pwdFilter)
    }
    if (youthFilter) {
      params.append('youth', 'true')
    }
    if (barangayFilter) {
      params.append('barangay', barangayFilter)
    }
    
    const { data } = await api.get(`/residents?${params}`)
    return data?.residents || []
  }

  const prepareExportData = (residents: any[]) => {
    return residents.map((resident: any) => {
      const age = resident.dateOfBirth 
        ? Math.floor((new Date().getTime() - new Date(resident.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : ''
      
      return {
        'ID': resident.id || '',
        'First Name': resident.firstName || '',
        'Middle Name': resident.middleName || '',
        'Last Name': resident.lastName || '',
        'Suffix': resident.suffix || '',
        'Date of Birth': resident.dateOfBirth ? format(new Date(resident.dateOfBirth), 'yyyy-MM-dd') : '',
        'Age': age,
        'Sex': resident.sex || '',
        'Civil Status': (resident.civilStatus || '').replace(/_/g, ' '),
        'Barangay': resident.barangay || '',
        'Address': resident.address || '',
        'Contact Number': resident.contactNo || '',
        'Occupation': resident.occupation || '',
        'Education': (resident.education || '').replace(/_/g, ' '),
        'Length of Stay': resident.lengthOfStay || '',
        'PWD Status': resident.isPWD ? 'Yes' : 'No',
        'Residency Status': (resident.residencyStatus || '').replace(/_/g, ' '),
        'Household': resident.household?.householdNumber || '',
        'Date Registered': resident.createdAt ? format(new Date(resident.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''
      }
    })
  }

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...')
      setShowExportDropdown(false)
      
      const residents = await fetchResidentsForExport()
      
      if (residents.length === 0) {
        toast.dismiss()
        toast.error('No residents to export')
        return
      }
      
      const exportData = prepareExportData(residents)
      const headers = Object.keys(exportData[0])
      const csvRows = [headers.join(',')]
      
      exportData.forEach((row: any) => {
        const values = headers.map(header => {
          const value = row[header]?.toString() || ''
          return `"${value.replace(/"/g, '""')}"`
        })
        csvRows.push(values.join(','))
      })
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `residents_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success(`Successfully exported ${residents.length} residents to CSV`)
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export to CSV')
      console.error('CSV Export error:', error)
    }
  }

  const handleExportExcel = async () => {
    try {
      toast.loading('Exporting to Excel...')
      setShowExportDropdown(false)
      
      const residents = await fetchResidentsForExport()
      
      if (residents.length === 0) {
        toast.dismiss()
        toast.error('No residents to export')
        return
      }
      
      const exportData = prepareExportData(residents)
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      const columnWidths = [
        { wch: 36 }, // ID
        { wch: 15 }, // First Name
        { wch: 15 }, // Middle Name
        { wch: 15 }, // Last Name
        { wch: 10 }, // Suffix
        { wch: 12 }, // Date of Birth
        { wch: 5 },  // Age
        { wch: 8 },  // Sex
        { wch: 12 }, // Civil Status
        { wch: 20 }, // Barangay
        { wch: 40 }, // Address
        { wch: 15 }, // Contact Number
        { wch: 20 }, // Occupation
        { wch: 15 }, // Education
        { wch: 15 }, // Length of Stay
        { wch: 12 }, // PWD Status
        { wch: 15 }, // Residency Status
        { wch: 15 }, // Household
        { wch: 20 }, // Date Registered
      ]
      worksheet['!cols'] = columnWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Residents')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `residents_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success(`Successfully exported ${residents.length} residents to Excel`)
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export to Excel')
      console.error('Excel Export error:', error)
    }
  }

  const archiveMutation = useMutation(
    (id: string) => api.patch(`/residents/${id}/archive`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('residents')
        toast.success('Resident archived successfully')
      },
      onError: () => {
        toast.error('Failed to archive resident')
      },
    }
  )

  const handleViewResident = (resident: any) => {
    setSelectedResident(resident)
    setShowViewModal(true)
  }

  const handleGenerateQR = async (residentId: string) => {
    try {
      const { data } = await api.get(`/residents/${residentId}/qrcode`)
      setQrCodeData(data.qrCode)
      setQrCodeUrl(data.qrCodeUrl)
      setShowQRModal(true)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate QR code')
    }
  }

  const residents = residentsData?.residents || []
  const pagination = residentsData?.pagination

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Residents</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and view resident information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Residents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.new || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Returning</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.returning || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <User className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transferred</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.transferred || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, address, or contact number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || statusFilter || civilStatusFilter || pwdFilter || youthFilter || barangayFilter
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 ${
                    viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 border-l border-gray-300 ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>
                
                {showExportDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowExportDropdown(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        onClick={handleExportCSV}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-100"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as CSV
                      </button>
                      <button
                        onClick={handleExportExcel}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2 text-green-600" />
                        Export as Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Residency Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="">All Status</option>
                    <option value="NEW">New</option>
                    <option value="RETURNING">Returning</option>
                    <option value="TRANSFERRED">Transferred</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Civil Status
                  </label>
                  <select
                    value={civilStatusFilter}
                    onChange={(e) => {
                      setCivilStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="WIDOWED">Widowed</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="SEPARATED">Separated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PWD Status
                  </label>
                  <select
                    value={pwdFilter}
                    onChange={(e) => {
                      setPwdFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All</option>
                    <option value="true">PWD</option>
                    <option value="false">Non-PWD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Barangay
                  </label>
                  <select
                    value={barangayFilter}
                    onChange={(e) => {
                      setBarangayFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
                  >
                    <option value="">All Barangays</option>
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
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-3 border-2 border-gray-300 rounded-lg hover:border-primary-300 transition-all cursor-pointer bg-white w-full">
                    <input
                      type="checkbox"
                      checked={youthFilter}
                      onChange={(e) => {
                        setYouthFilter(e.target.checked)
                        setPage(1)
                      }}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Youth (15-30 years old)</span>
                  </label>
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={() => {
                      setStatusFilter('')
                      setCivilStatusFilter('')
                      setPwdFilter('')
                      setYouthFilter(false)
                      setBarangayFilter('')
                      setShowFilters(false)
                    }}
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Residents List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading residents...</p>
          </div>
        ) : residents.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Resident
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {residents.map((resident: any) => (
                      <tr key={resident.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                              {resident.idPhoto ? (
                                <img src={getFileUrl(resident.idPhoto)} alt="" className="h-10 w-10 rounded-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-primary-600" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {resident.firstName} {resident.middleName} {resident.lastName} {resident.suffix}
                              </div>
                              <div className="text-xs text-gray-500">{resident.civilStatus}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {resident.contactNo}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 max-w-xs truncate">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{resident.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {format(new Date(resident.dateOfBirth), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${
                            resident.residencyStatus === 'NEW' ? 'bg-green-100 text-green-800' :
                            resident.residencyStatus === 'RETURNING' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {resident.residencyStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewResident(resident)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateQR(resident.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="QR Code"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/residents/${resident.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to archive this resident?')) {
                                  archiveMutation.mutate(resident.id)
                                }
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {residents.map((resident: any) => (
                <div
                  key={resident.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                          {resident.idPhoto ? (
                            <img src={getFileUrl(resident.idPhoto)} alt="" className="h-16 w-16 rounded-full object-cover" />
                          ) : (
                            <User className="h-8 w-8 text-primary-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {resident.firstName} {resident.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">{resident.civilStatus}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        resident.residencyStatus === 'NEW' ? 'bg-green-100 text-green-800' :
                        resident.residencyStatus === 'RETURNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {resident.residencyStatus}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {resident.contactNo}
                      </div>
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{resident.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(resident.dateOfBirth), 'MMM d, yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewResident(resident)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleGenerateQR(resident.id)}
                        className="px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        title="QR Code"
                      >
                        <QrCode className="h-4 w-4 inline" />
                      </button>
                      <Link
                        href={`/residents/${resident.id}/edit`}
                        className="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-center"
                      >
                        <Edit className="h-4 w-4 inline mr-1" />
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No residents found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'No residents available'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium">{pagination.total}</span> residents
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 inline" />
                Previous
              </button>
              <div className="px-3 py-2 text-sm text-gray-700">
                Page {pagination.page} of {pagination.pages}
              </div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4 inline" />
              </button>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedResident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Resident Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-start gap-6 mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {selectedResident.idPhoto ? (
                      <img src={getFileUrl(selectedResident.idPhoto)} alt="" className="h-24 w-24 rounded-full object-cover" />
                    ) : (
                      <User className="h-12 w-12 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedResident.firstName} {selectedResident.middleName} {selectedResident.lastName} {selectedResident.suffix}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedResident.residencyStatus === 'NEW' ? 'bg-green-100 text-green-800' :
                        selectedResident.residencyStatus === 'RETURNING' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedResident.residencyStatus}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                        {selectedResident.civilStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(selectedResident.dateOfBirth), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sex</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.sex}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Civil Status</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.civilStatus}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Contact Number</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.contactNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Address</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.address}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Information</h4>
                    <div className="space-y-3">
                      {selectedResident.occupation && (
                        <div>
                          <p className="text-xs text-gray-500">Occupation</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.occupation}</p>
                        </div>
                      )}
                      {selectedResident.education && (
                        <div>
                          <p className="text-xs text-gray-500">Education</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.education}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedResident.household && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Household</h4>
                      <div>
                        <p className="text-xs text-gray-500">Household Number</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.household.householdNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Link
                    href={`/residents/${selectedResident.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Resident
                  </Link>
                  <Link
                    href={`/documents?residentId=${selectedResident.id}`}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors"
                  >
                    View Documents
                  </Link>
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
                <h2 className="text-xl font-bold text-gray-900">Resident QR Code</h2>
                <button
                  onClick={() => {
                    setShowQRModal(false)
                    setQrCodeData(null)
                    setQrCodeUrl(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 text-center">
                <img src={qrCodeData} alt="QR Code" className="mx-auto mb-4 w-64 h-64" />
                <p className="text-sm text-gray-600 mb-2">
                  Scan this QR code to view resident information
                </p>
                {qrCodeUrl && (
                  <p className="text-xs text-gray-400 font-mono break-all">{qrCodeUrl}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCodeData
                      link.download = 'resident-qrcode.png'
                      link.click()
                    }}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="h-4 w-4 inline mr-2" />
                    Download QR Code
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
