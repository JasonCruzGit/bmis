'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Filter,
  Download,
  Grid,
  List,
  X,
  Home,
  MapPin,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Map,
  User,
  Phone,
  Calendar,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import { getFileUrl } from '@/lib/utils'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

export default function HouseholdsPage() {
  const { hydrated } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedResident, setSelectedResident] = useState<any>(null)
  const [showResidentModal, setShowResidentModal] = useState(false)
  const [residentLoading, setResidentLoading] = useState(false)
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [showHouseholdExportDropdown, setShowHouseholdExportDropdown] = useState(false)
  const queryClient = useQueryClient()

  // Fetch full household details when viewing
  const { data: fullHouseholdDetails, isLoading: householdDetailsLoading } = useQuery(
    ['household-details', selectedHousehold?.id],
    async () => {
      if (!selectedHousehold?.id) return null
      const { data } = await api.get(`/households/${selectedHousehold.id}`)
      return data
    },
    {
      enabled: !!selectedHousehold?.id && showViewModal,
      refetchOnWindowFocus: false,
    }
  )

  const { data: householdsData, isLoading, error, isError } = useQuery(
    ['households', page, searchQuery],
    async () => {
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '20',
        })
        const { data } = await api.get(`/households?${params}`)
        return data
      } catch (err: any) {
        console.error('Error fetching households:', err)
        throw err
      }
    },
    {
      retry: 1,
      refetchOnWindowFocus: false,
      onError: (err: any) => {
        console.error('Households query error:', err)
        toast.error('Failed to load households: ' + (err.response?.data?.message || err.message))
      }
    }
  )

  const { data: stats } = useQuery('households-stats', async () => {
    try {
      const { data } = await api.get('/households?limit=1')
      return {
        total: data.pagination?.total || 0,
        totalResidents: 0, // Calculate from data
      }
    } catch (error) {
      console.error('Error fetching households stats:', error)
      return {
        total: 0,
        totalResidents: 0,
      }
    }
  }, {
    retry: 1,
    refetchOnWindowFocus: false,
  })

  const deleteMutation = useMutation(
    (id: string) => api.delete(`/households/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('households')
        toast.success('Household deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete household')
      },
    }
  )

  const handleViewHousehold = (household: any) => {
    setSelectedHousehold(household)
    setShowViewModal(true)
  }

  const handleViewResident = async (residentId: string) => {
    try {
      setResidentLoading(true)
      const { data } = await api.get(`/residents/${residentId}`)
      setSelectedResident(data)
      setShowResidentModal(true)
      setShowViewModal(false) // Close household modal
    } catch (error: any) {
      toast.error('Failed to load resident details')
      console.error('Error fetching resident:', error)
    } finally {
      setResidentLoading(false)
    }
  }

  const households = householdsData?.households || []
  const pagination = householdsData?.pagination

  const fetchHouseholdsForExport = async () => {
    const params = new URLSearchParams({
      limit: '10000', // Get all households
    })
    if (searchQuery) {
      params.append('q', searchQuery)
    }
    
    const { data } = await api.get(`/households?${params}`)
    return data?.households || []
  }

  const prepareExportData = (households: any[]) => {
    return households.map((household: any) => ({
      'Household Number': household.householdNumber || '',
      'Head of Household': household.headName || '',
      'Address': household.address || '',
      'Barangay': household.barangay || '',
      'Members': household.householdSize || household.residents?.length || 0,
      'Income': household.income ? `₱${Number(household.income).toLocaleString()}` : 'Not specified',
      'Date Created': household.createdAt ? format(new Date(household.createdAt), 'yyyy-MM-dd HH:mm:ss') : ''
    }))
  }

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting to CSV...')
      setShowExportDropdown(false)
      
      const households = await fetchHouseholdsForExport()
      
      if (households.length === 0) {
        toast.dismiss()
        toast.error('No households to export')
        return
      }
      
      const exportData = prepareExportData(households)
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
      link.setAttribute('download', `households_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success(`Successfully exported ${households.length} households to CSV`)
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
      
      const households = await fetchHouseholdsForExport()
      
      if (households.length === 0) {
        toast.dismiss()
        toast.error('No households to export')
        return
      }
      
      const exportData = prepareExportData(households)
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Household Number
        { wch: 25 }, // Head of Household
        { wch: 40 }, // Address
        { wch: 20 }, // Barangay
        { wch: 10 }, // Members
        { wch: 15 }, // Income
        { wch: 20 }, // Date Created
      ]
      worksheet['!cols'] = columnWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Households')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `households_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success(`Successfully exported ${households.length} households to Excel`)
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export to Excel')
      console.error('Excel Export error:', error)
    }
  }

  const handleExportPDF = async () => {
    try {
      toast.loading('Exporting to PDF...')
      setShowExportDropdown(false)
      
      // Dynamically import jspdf-autotable to avoid SSR issues
      await import('jspdf-autotable')
      
      const households = await fetchHouseholdsForExport()
      
      if (households.length === 0) {
        toast.dismiss()
        toast.error('No households to export')
        return
      }
      
      const exportData = prepareExportData(households)
      
      // Create PDF document
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Add title
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('Households Report', 14, 15)
      
      // Add export date
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Exported on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, 14, 22)
      doc.text(`Total Households: ${households.length}`, 14, 27)
      
      // Prepare table data
      const tableData = exportData.map((row: any) => [
        row['Household Number'],
        row['Head of Household'],
        row['Address'],
        row['Barangay'],
        row['Members'],
        row['Income'],
        row['Date Created']
      ])
      
      // Add table using autoTable plugin (extends jsPDF prototype)
      ;(doc as any).autoTable({
        head: [['Household Number', 'Head of Household', 'Address', 'Barangay', 'Members', 'Income', 'Date Created']],
        body: tableData,
        startY: 35,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { top: 35 },
        didDrawPage: (data: any) => {
          // Add page number
          doc.setFontSize(8)
          doc.text(
            `Page ${data.pageNumber}`,
            doc.internal.pageSize.getWidth() - 20,
            doc.internal.pageSize.getHeight() - 10
          )
        }
      })
      
      // Save PDF
      doc.save(`households_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`)
      
      toast.dismiss()
      toast.success(`Successfully exported ${households.length} households to PDF`)
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export to PDF')
      console.error('PDF Export error:', error)
    }
  }

  const prepareHouseholdDetailsExport = (household: any) => {
    const data: any = {
      'Household Number': household.householdNumber || '',
      'Head of Household': household.headName || '',
      'Head First Name': household.headFirstName || '',
      'Head Middle Name': household.headMiddleName || '',
      'Head Last Name': household.headLastName || '',
      'Address': household.address || '',
      'House Number': household.houseNumber || '',
      'Street/Subdivision': household.streetSubdivision || '',
      'Purok/Sitio': household.purokSitio || '',
      'Barangay': household.barangay || '',
      'Zone': household.zone || '',
      'Municipality': household.municipality || '',
      'Province': household.province || '',
      'House/Building Number': household.houseBuildingNumber || '',
      'Unit Number': household.unitNumber || '',
      'Coordinates': household.coordinates || '',
      'Monthly Income': household.income ? `₱${Number(household.income).toLocaleString()}` : '',
      'Living Conditions': household.livingConditions || '',
      'Household Size': household.householdSize || '',
      'Number of Family Members': household.numberOfFamilyMembers || '',
      // Household Condition
      'Owner (Main Family)': household.ownerMainFamily || '',
      'Extended Family': household.extendedFamily || '',
      'Main Family Head ID': household.mainFamilyHeadId || '',
      // Family Information
      'Year First Resided': household.yearFirstResided || '',
      'Place of Origin (Municipality)': household.placeOfOriginMunicipality || '',
      'Place of Origin (Province)': household.placeOfOriginProvince || '',
      // Health Information
      'Three Meals Daily': household.threeMealsDaily || '',
      'Has Medicinal Plants': household.hasMedicinalPlants || '',
      'Medicinal Plant Types': household.medicinalPlantTypes || '',
      'Has Vegetable Garden': household.hasVegetableGarden || '',
      'Uses Iodized Salt': household.usesIodizedSalt || '',
      'Uses Family Planning': household.usesFamilyPlanning || '',
      'Family Planning Method': household.familyPlanningMethod || '',
      // Family Planning - Natural Methods
      'Basal Body Temperature': household.basalBodyTemperature ? 'Yes' : 'No',
      'Cervical Mucus': household.cervicalMucus ? 'Yes' : 'No',
      'Lactational Mucus': household.lactationalMucus ? 'Yes' : 'No',
      'Rhythm': household.rhythm ? 'Yes' : 'No',
      'Standard Days Method': household.standardDaysMethod ? 'Yes' : 'No',
      'Sympto-thermal Method': household.symptoThermalMethod ? 'Yes' : 'No',
      'Withdrawal': household.withdrawal ? 'Yes' : 'No',
      // Family Planning - Artificial Methods
      'Condom': household.condom ? 'Yes' : 'No',
      'Depo Injection': household.depoInjection ? 'Yes' : 'No',
      'IUD': household.iud ? 'Yes' : 'No',
      'Tubal Ligation': household.tubalLigation ? 'Yes' : 'No',
      'Pills': household.pills ? 'Yes' : 'No',
      'Vasectomy': household.vasectomy ? 'Yes' : 'No',
      'Subdermal Implants': household.subdermalImplants ? 'Yes' : 'No',
    }

    // Add children if available
    if (household.children && Array.isArray(household.children) && household.children.length > 0) {
      household.children.forEach((child: any, index: number) => {
        data[`Child ${index + 1} - Name`] = child?.name || ''
        data[`Child ${index + 1} - Age`] = child?.age || ''
        data[`Child ${index + 1} - Vaccination`] = child?.vaccination || ''
        data[`Child ${index + 1} - Deworming`] = child?.deworming || ''
        data[`Child ${index + 1} - Breastfeeding`] = child?.breastfeeding || ''
      })
    }

    // Add family members if available
    if (household.familyMembers && Array.isArray(household.familyMembers) && household.familyMembers.length > 0) {
      household.familyMembers.forEach((member: any, index: number) => {
        data[`Family Member ${index + 1} - Name`] = member?.name || ''
        data[`Family Member ${index + 1} - Relation`] = member?.relation || ''
        data[`Family Member ${index + 1} - Age`] = member?.age || ''
        data[`Family Member ${index + 1} - Sex`] = member?.sex || ''
      })
    }

    // Add education members if available
    if (household.educationMembers && Array.isArray(household.educationMembers) && household.educationMembers.length > 0) {
      household.educationMembers.forEach((edu: any, index: number) => {
        data[`Education ${index + 1} - Currently Studying`] = edu?.currentlyStudying || ''
        data[`Education ${index + 1} - Level`] = edu?.levelNumber || ''
        data[`Education ${index + 1} - School Type`] = edu?.schoolType || ''
        data[`Education ${index + 1} - School Name`] = edu?.schoolName || ''
      })
    }

    // Add residents if available
    if (household.residents && Array.isArray(household.residents) && household.residents.length > 0) {
      household.residents.forEach((resident: any, index: number) => {
        data[`Resident ${index + 1} - Name`] = `${resident.firstName || ''} ${resident.middleName || ''} ${resident.lastName || ''}`.trim()
        data[`Resident ${index + 1} - Date of Birth`] = resident.dateOfBirth ? format(new Date(resident.dateOfBirth), 'yyyy-MM-dd') : ''
        data[`Resident ${index + 1} - Sex`] = resident.sex || ''
        data[`Resident ${index + 1} - Civil Status`] = resident.civilStatus || ''
        data[`Resident ${index + 1} - Contact`] = resident.contactNo || ''
      })
    }

    return data
  }

  const handleExportHouseholdCSV = async () => {
    try {
      toast.loading('Exporting household to CSV...')
      setShowHouseholdExportDropdown(false)
      
      const household = fullHouseholdDetails || selectedHousehold
      if (!household) {
        toast.dismiss()
        toast.error('No household data to export')
        return
      }
      
      const exportData = prepareHouseholdDetailsExport(household)
      const headers = Object.keys(exportData)
      const csvRows = [headers.join(',')]
      
      const values = headers.map(header => {
        const value = exportData[header]?.toString() || ''
        return `"${value.replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
      
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `household_${household.householdNumber || household.id}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success('Successfully exported household to CSV')
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export household to CSV')
      console.error('CSV Export error:', error)
    }
  }

  const handleExportHouseholdExcel = async () => {
    try {
      toast.loading('Exporting household to Excel...')
      setShowHouseholdExportDropdown(false)
      
      const household = fullHouseholdDetails || selectedHousehold
      if (!household) {
        toast.dismiss()
        toast.error('No household data to export')
        return
      }
      
      const exportData = prepareHouseholdDetailsExport(household)
      
      // Create a new workbook
      const workbook = XLSX.utils.book_new()
      
      // Convert data to worksheet (single row)
      const worksheet = XLSX.utils.json_to_sheet([exportData])
      
      // Set column widths
      const maxWidth = Math.max(...Object.keys(exportData).map(key => key.length))
      worksheet['!cols'] = [{ wch: maxWidth + 5 }]
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Household Details')
      
      // Generate Excel file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // Download file
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `household_${household.householdNumber || household.id}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.dismiss()
      toast.success('Successfully exported household to Excel')
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export household to Excel')
      console.error('Excel Export error:', error)
    }
  }

  const handleExportHouseholdPDF = async () => {
    try {
      toast.loading('Exporting household to PDF...')
      setShowHouseholdExportDropdown(false)
      
      // Dynamically import jspdf-autotable to avoid SSR issues
      await import('jspdf-autotable')
      
      const household = fullHouseholdDetails || selectedHousehold
      if (!household) {
        toast.dismiss()
        toast.error('No household data to export')
        return
      }
      
      // Create PDF document
      const doc = new jsPDF('portrait', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - (margin * 2)
      
      // Helper function to add page header
      const addPageHeader = (pageNum: number) => {
        // Header background
        doc.setFillColor(59, 130, 246) // Blue
        doc.rect(0, 0, pageWidth, 30, 'F')
        
        // Organization name
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('BARANGAY INFORMATION SYSTEM', pageWidth / 2, 12, { align: 'center' })
        
        // Subtitle
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('El Nido, Palawan', pageWidth / 2, 20, { align: 'center' })
        
        // Reset text color
        doc.setTextColor(0, 0, 0)
        
        // Document title
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('HOUSEHOLD DETAILS REPORT', margin, 40)
        
        // Horizontal line
        doc.setDrawColor(200, 200, 200)
        doc.setLineWidth(0.5)
        doc.line(margin, 43, pageWidth - margin, 43)
        
        // Household number and date
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Household Number: ${household.householdNumber || 'N/A'}`, margin, 50)
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy hh:mm:ss a')}`, pageWidth - margin, 50, { align: 'right' })
        doc.setTextColor(0, 0, 0)
        
        // Another line separator
        doc.setDrawColor(200, 200, 200)
        doc.line(margin, 53, pageWidth - margin, 53)
      }
      
      // Helper function to add page footer
      const addPageFooter = (pageNum: number, totalPages: number) => {
        const footerY = pageHeight - 15
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'normal')
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: 'center' })
        doc.text('Confidential Document - Barangay Information System', pageWidth / 2, footerY + 5, { align: 'center' })
        doc.setTextColor(0, 0, 0)
      }
      
      // Helper function to add section header
      const addSectionHeader = (title: string, yPos: number) => {
        doc.setFillColor(245, 247, 250) // Light gray background
        doc.rect(margin, yPos - 5, contentWidth, 8, 'F')
        
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 58, 138) // Dark blue
        doc.text(title.toUpperCase(), margin + 2, yPos + 2)
        
        doc.setTextColor(0, 0, 0)
        return yPos + 6
      }
      
      // Helper function to add info row
      const addInfoRow = (label: string, value: string, yPos: number, indent: number = 0) => {
        const labelX = margin + 2 + indent
        const valueX = margin + 60
        
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(label, labelX, yPos)
        
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(60, 60, 60)
        // Wrap long text
        const maxWidth = pageWidth - valueX - margin
        const lines = doc.splitTextToSize(String(value || 'N/A'), maxWidth)
        doc.text(lines, valueX, yPos)
        
        doc.setTextColor(0, 0, 0)
        return yPos + (lines.length * 5) + 3
      }
      
      let yPos = 58
      let currentPage = 1
      
      // Add first page header
      addPageHeader(currentPage)
      
      // Check if new page needed
      if (yPos > pageHeight - 40) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      
      // Household Information
      yPos = addSectionHeader('Household Information', yPos)
      
      const householdInfo = [
        ['Head of Household:', household.headName || 'N/A'],
        ['Head First Name:', household.headFirstName || 'N/A'],
        ['Head Middle Name:', household.headMiddleName || 'N/A'],
        ['Head Last Name:', household.headLastName || 'N/A'],
        ['Address:', household.address || 'N/A'],
        ['House Number:', household.houseNumber || 'N/A'],
        ['Street/Subdivision:', household.streetSubdivision || 'N/A'],
        ['Purok/Sitio:', household.purokSitio || 'N/A'],
        ['Barangay:', household.barangay || 'N/A'],
        ['Zone:', household.zone || 'N/A'],
        ['Municipality:', household.municipality || 'N/A'],
        ['Province:', household.province || 'N/A'],
        ['Household Size:', household.householdSize ? `${household.householdSize} members` : 'N/A'],
        ['Number of Family Members:', household.numberOfFamilyMembers || 'N/A'],
        ['Monthly Income:', household.income ? `₱${Number(household.income).toLocaleString()}` : 'N/A'],
        ['Living Conditions:', household.livingConditions || 'N/A'],
        ['Coordinates:', household.coordinates || 'N/A'],
      ]
      
      householdInfo.forEach(([label, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        yPos = addInfoRow(label, String(value || 'N/A'), yPos)
      })

      // Household Condition
      yPos += 3
      if (yPos > pageHeight - 30) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      yPos = addSectionHeader('Household Condition', yPos)
      
      const conditionInfo = [
        ['Owner (Main Family):', household.ownerMainFamily || 'N/A'],
        ['Extended Family:', household.extendedFamily || 'N/A'],
        ['Main Family Head ID:', household.mainFamilyHeadId || 'N/A'],
      ]
      
      conditionInfo.forEach(([label, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        yPos = addInfoRow(label, String(value || 'N/A'), yPos)
      })

      // Family Information
      yPos += 3
      if (yPos > pageHeight - 30) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      yPos = addSectionHeader('Family Information', yPos)
      
      const familyInfo = [
        ['Year First Resided:', household.yearFirstResided || 'N/A'],
        ['Place of Origin (Municipality):', household.placeOfOriginMunicipality || 'N/A'],
        ['Place of Origin (Province):', household.placeOfOriginProvince || 'N/A'],
      ]
      
      familyInfo.forEach(([label, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        yPos = addInfoRow(label, String(value || 'N/A'), yPos)
      })

      // Health Information
      yPos += 3
      if (yPos > pageHeight - 30) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      yPos = addSectionHeader('Health Information', yPos)
      
      const healthInfo = [
        ['Three Meals Daily:', household.threeMealsDaily || 'N/A'],
        ['Has Medicinal Plants:', household.hasMedicinalPlants || 'N/A'],
        ['Medicinal Plant Types:', household.medicinalPlantTypes || 'N/A'],
        ['Has Vegetable Garden:', household.hasVegetableGarden || 'N/A'],
        ['Uses Iodized Salt:', household.usesIodizedSalt || 'N/A'],
        ['Uses Family Planning:', household.usesFamilyPlanning || 'N/A'],
        ['Family Planning Method:', household.familyPlanningMethod || 'N/A'],
      ]
      
      healthInfo.forEach(([label, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        yPos = addInfoRow(label, String(value || 'N/A'), yPos)
      })

      // Family Planning Details
      yPos += 3
      if (yPos > pageHeight - 40) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      yPos = addSectionHeader('Family Planning Details', yPos)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text('Natural Methods:', margin + 2, yPos)
      yPos += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const naturalMethods = [
        ['Basal Body Temperature', household.basalBodyTemperature],
        ['Cervical Mucus', household.cervicalMucus],
        ['Lactational Mucus', household.lactationalMucus],
        ['Rhythm', household.rhythm],
        ['Standard Days Method', household.standardDaysMethod],
        ['Sympto-thermal Method', household.symptoThermalMethod],
        ['Withdrawal', household.withdrawal],
      ]
      
      naturalMethods.forEach(([method, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        doc.text(`  • ${method}: ${value ? 'Yes' : 'No'}`, margin + 4, yPos)
        yPos += 5
      })

      yPos += 2
      if (yPos > pageHeight - 40) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Artificial Methods:', margin + 2, yPos)
      yPos += 6
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      const artificialMethods = [
        ['Condom', household.condom],
        ['Depo Injection', household.depoInjection],
        ['IUD', household.iud],
        ['Tubal Ligation', household.tubalLigation],
        ['Pills', household.pills],
        ['Vasectomy', household.vasectomy],
        ['Subdermal Implants', household.subdermalImplants],
      ]
      
      artificialMethods.forEach(([method, value]) => {
        if (yPos > pageHeight - 30) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        doc.text(`  • ${method}: ${value ? 'Yes' : 'No'}`, margin + 4, yPos)
        yPos += 5
      })
      doc.setTextColor(0, 0, 0)

      // Children section (always include, even if empty)
      yPos += 3
      if (yPos > pageHeight - 50) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      
      const childrenCount = household.children && Array.isArray(household.children) ? household.children.length : 0
      yPos = addSectionHeader(`Children (0-23 months) - ${childrenCount}`, yPos)
      
      if (childrenCount > 0) {
        // Prepare table data
        const childrenData = household.children.map((child: any) => [
          String(child?.name || 'N/A'),
          String(child?.age || 'N/A'),
          String(child?.vaccination || 'N/A'),
          String(child?.deworming || 'N/A'),
          String(child?.breastfeeding || 'N/A')
        ])
        
        // Add table using autoTable plugin
        ;(doc as any).autoTable({
          head: [['Name', 'Age', 'Vaccination', 'Deworming', 'Breastfeeding']],
          body: childrenData,
          startY: yPos,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: margin, right: margin },
          theme: 'grid',
        })
        yPos = (doc as any).lastAutoTable.finalY + 5
      } else {
        // Show "No data available" message
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No children data available', margin + 2, yPos + 5)
        doc.setTextColor(0, 0, 0)
        yPos += 12
      }

      // Family Members section (always include, even if empty)
      yPos += 3
      if (yPos > pageHeight - 50) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      
      const familyMembersCount = household.familyMembers && Array.isArray(household.familyMembers) ? household.familyMembers.length : 0
      yPos = addSectionHeader(`Family Members - ${familyMembersCount}`, yPos)
      
      if (familyMembersCount > 0) {
        // Prepare table data
        const familyMembersData = household.familyMembers.map((member: any) => [
          String(member?.name || 'N/A'),
          String(member?.relation || 'N/A'),
          String(member?.age || 'N/A'),
          String(member?.sex || 'N/A')
        ])
        
        // Add table using autoTable plugin
        ;(doc as any).autoTable({
          head: [['Name', 'Relation', 'Age', 'Sex']],
          body: familyMembersData,
          startY: yPos,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: margin, right: margin },
          theme: 'grid',
        })
        yPos = (doc as any).lastAutoTable.finalY + 5
      } else {
        // Show "No data available" message
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No family members data available', margin + 2, yPos + 5)
        doc.setTextColor(0, 0, 0)
        yPos += 12
      }

      // Education Information section (always include, even if empty)
      yPos += 3
      if (yPos > pageHeight - 50) {
        addPageFooter(currentPage, 1)
        doc.addPage()
        currentPage++
        addPageHeader(currentPage)
        yPos = 58
      }
      
      const educationCount = household.educationMembers && Array.isArray(household.educationMembers) ? household.educationMembers.length : 0
      yPos = addSectionHeader(`Education Information - ${educationCount}`, yPos)
      
      if (educationCount > 0) {
        // Prepare table data
        const educationData = household.educationMembers.map((edu: any) => [
          String(edu?.currentlyStudying || 'N/A'),
          String(edu?.levelNumber || 'N/A'),
          String(edu?.schoolType || 'N/A'),
          String(edu?.schoolName || 'N/A')
        ])
        
        // Add table using autoTable plugin
        ;(doc as any).autoTable({
          head: [['Currently Studying', 'Level', 'School Type', 'School Name']],
          body: educationData,
          startY: yPos,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: margin, right: margin },
          theme: 'grid',
        })
        yPos = (doc as any).lastAutoTable.finalY + 5
      } else {
        // Show "No data available" message
        doc.setFontSize(9)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(120, 120, 120)
        doc.text('No education data available', margin + 2, yPos + 5)
        doc.setTextColor(0, 0, 0)
        yPos += 12
      }
      
      // Residents section
      if (household.residents && Array.isArray(household.residents) && household.residents.length > 0) {
        yPos += 3
        if (yPos > pageHeight - 50) {
          addPageFooter(currentPage, 1)
          doc.addPage()
          currentPage++
          addPageHeader(currentPage)
          yPos = 58
        }
        yPos = addSectionHeader(`Residents (${household.residents.length})`, yPos)
        
        // Prepare table data
        const tableData = household.residents.map((resident: any) => [
          String(`${resident.firstName || ''} ${resident.lastName || ''}`.trim() || 'N/A'),
          String(resident.dateOfBirth ? format(new Date(resident.dateOfBirth), 'MMM dd, yyyy') : 'N/A'),
          String(resident.sex || 'N/A'),
          String(resident.civilStatus || 'N/A'),
          String(resident.contactNo || 'N/A')
        ])
        
        // Add table using autoTable plugin
        ;(doc as any).autoTable({
          head: [['Name', 'Date of Birth', 'Sex', 'Civil Status', 'Contact']],
          body: tableData,
          startY: yPos,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          margin: { left: margin, right: margin },
          theme: 'grid',
        })
        yPos = (doc as any).lastAutoTable.finalY + 5
      }
      
      // Calculate total pages (approximate)
      const totalPages = doc.internal.pages.length - 1
      
      // Add footer to all pages
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addPageFooter(i, totalPages)
      }
      
      // Save PDF
      doc.save(`household_${household.householdNumber || household.id}_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.pdf`)
      
      toast.dismiss()
      toast.success('Successfully exported household to PDF')
    } catch (error: any) {
      toast.dismiss()
      toast.error('Failed to export household to PDF')
      console.error('PDF Export error:', error)
    }
  }

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <Home className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Households</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage and view household information</p>
              </div>
            </div>
            <Link
              href="/households/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Household
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Households</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Home className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Residents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalResidents || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
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
                placeholder="Search by household number, head name, or address..."
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
                  showFilters
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
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-100"
                      >
                        <FileText className="h-4 w-4 mr-2 text-green-600" />
                        Export as Excel
                      </button>
                      <button
                        onClick={handleExportPDF}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <FileText className="h-4 w-4 mr-2 text-red-600" />
                        Export as PDF
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Household Size
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900">
                    <option value="">All Sizes</option>
                    <option value="1-3">1-3 members</option>
                    <option value="4-6">4-6 members</option>
                    <option value="7+">7+ members</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Households List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading households...</p>
          </div>
        ) : isError || error ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error loading households</p>
              <p className="text-sm text-gray-600 mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
            <button
              onClick={() => queryClient.invalidateQueries('households')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        ) : households.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Household Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Head of Household
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Members
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {households.map((household: any) => (
                      <tr key={household.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {household.householdNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {household.headName}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-600 max-w-xs truncate">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{household.address}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                            {household.householdSize || household.residents?.length || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            {household.income ? (
                              <>
                                <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                                ₱{Number(household.income).toLocaleString()}
                              </>
                            ) : (
                              <span className="text-gray-400">Not specified</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewHousehold(household)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/households/${household.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this household? This action cannot be undone.')) {
                                  deleteMutation.mutate(household.id)
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
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
              {households.map((household: any) => (
                <div
                  key={household.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {household.householdNumber}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">{household.headName}</p>
                      </div>
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <Home className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{household.address}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {household.householdSize || household.residents?.length || 0} members
                      </div>
                      {household.income && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                          ₱{Number(household.income).toLocaleString()}
                        </div>
                      )}
                      {household.latitude && household.longitude && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Map className="h-4 w-4 mr-2 text-gray-400" />
                          Location mapped
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewHousehold(household)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/households/${household.id}/edit`}
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
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No households found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first household'}
            </p>
            <Link
              href="/households/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Household
            </Link>
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
              of <span className="font-medium">{pagination.total}</span> households
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
        {showViewModal && selectedHousehold && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-gray-900">Household Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                  <span className="text-sm font-medium">Close</span>
                </button>
              </div>
              <div className="p-6">
                {householdDetailsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-6 mb-6">
                      <div className="p-4 bg-primary-100 rounded-xl">
                        <Home className="h-12 w-12 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {fullHouseholdDetails?.householdNumber || selectedHousehold.householdNumber}
                        </h3>
                        <p className="text-lg text-gray-600">
                          {fullHouseholdDetails?.headFirstName || fullHouseholdDetails?.headLastName 
                            ? `${fullHouseholdDetails.headFirstName || ''} ${fullHouseholdDetails.headMiddleName || ''} ${fullHouseholdDetails.headLastName || ''}`.trim()
                            : fullHouseholdDetails?.headName || selectedHousehold.headName}
                        </p>
                      </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Household Information</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Household Number</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.householdNumber || selectedHousehold.householdNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Head of Household (Full Name)</p>
                            <p className="font-medium text-gray-900">
                              {fullHouseholdDetails?.headFirstName || fullHouseholdDetails?.headLastName 
                                ? `${fullHouseholdDetails.headFirstName || ''} ${fullHouseholdDetails.headMiddleName || ''} ${fullHouseholdDetails.headLastName || ''}`.trim() || 'N/A'
                                : fullHouseholdDetails?.headName || selectedHousehold.headName || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Head First Name</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.headFirstName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Head Middle Name</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.headMiddleName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Head Last Name</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.headLastName || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Household Size</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.householdSize ? `${fullHouseholdDetails.householdSize} members` : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Number of Family Members</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.numberOfFamilyMembers || 'N/A'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Location & Income</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-500">Address</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.address || selectedHousehold.address || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">House Number</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.houseNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Street/Subdivision</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.streetSubdivision || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Purok/Sitio</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.purokSitio || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Barangay</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.barangay || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Zone</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.zone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Municipality</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.municipality || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Province</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.province || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">House/Building Number</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.houseBuildingNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Unit Number</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.unitNumber || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Coordinates</p>
                            <p className="font-medium text-gray-900">
                              {fullHouseholdDetails?.latitude && fullHouseholdDetails?.longitude
                                ? `${fullHouseholdDetails.latitude.toFixed(6)}, ${fullHouseholdDetails.longitude.toFixed(6)}`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Monthly Income</p>
                            <p className="font-medium text-gray-900">
                              {fullHouseholdDetails?.income ? `₱${Number(fullHouseholdDetails.income).toLocaleString()}` : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Living Conditions</p>
                            <p className="font-medium text-gray-900">{fullHouseholdDetails?.livingConditions || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Household Condition */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Household Condition</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Owner (Main Family)</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.ownerMainFamily || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Extended Family</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.extendedFamily || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Main Family Head ID</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.mainFamilyHeadId || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Family Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Family Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Year First Resided</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.yearFirstResided || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Place of Origin (Municipality)</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.placeOfOriginMunicipality || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Place of Origin (Province)</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.placeOfOriginProvince || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Health Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Health Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Three Meals Daily</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.threeMealsDaily || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Has Medicinal Plants</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.hasMedicinalPlants || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-500">Medicinal Plant Types</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.medicinalPlantTypes || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Has Vegetable Garden</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.hasVegetableGarden || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Uses Iodized Salt</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.usesIodizedSalt || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Uses Family Planning</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.usesFamilyPlanning || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Family Planning Method</p>
                          <p className="font-medium text-gray-900">{fullHouseholdDetails?.familyPlanningMethod || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Family Planning Details */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Family Planning Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold">Natural Methods</p>
                          <div className="space-y-1">
                            <p className={`text-gray-700 ${fullHouseholdDetails?.basalBodyTemperature ? '' : 'text-gray-400'}`}>
                              • Basal Body Temperature {fullHouseholdDetails?.basalBodyTemperature ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.cervicalMucus ? '' : 'text-gray-400'}`}>
                              • Cervical Mucus {fullHouseholdDetails?.cervicalMucus ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.lactationalMucus ? '' : 'text-gray-400'}`}>
                              • Lactational Mucus {fullHouseholdDetails?.lactationalMucus ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.rhythm ? '' : 'text-gray-400'}`}>
                              • Rhythm {fullHouseholdDetails?.rhythm ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.standardDaysMethod ? '' : 'text-gray-400'}`}>
                              • Standard Days Method {fullHouseholdDetails?.standardDaysMethod ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.symptoThermalMethod ? '' : 'text-gray-400'}`}>
                              • Sympto-thermal Method {fullHouseholdDetails?.symptoThermalMethod ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.withdrawal ? '' : 'text-gray-400'}`}>
                              • Withdrawal {fullHouseholdDetails?.withdrawal ? '(Yes)' : '(No)'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-2 font-semibold">Artificial Methods</p>
                          <div className="space-y-1">
                            <p className={`text-gray-700 ${fullHouseholdDetails?.condom ? '' : 'text-gray-400'}`}>
                              • Condom {fullHouseholdDetails?.condom ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.depoInjection ? '' : 'text-gray-400'}`}>
                              • Depo Injection {fullHouseholdDetails?.depoInjection ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.iud ? '' : 'text-gray-400'}`}>
                              • IUD {fullHouseholdDetails?.iud ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.tubalLigation ? '' : 'text-gray-400'}`}>
                              • Tubal Ligation {fullHouseholdDetails?.tubalLigation ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.pills ? '' : 'text-gray-400'}`}>
                              • Pills {fullHouseholdDetails?.pills ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.vasectomy ? '' : 'text-gray-400'}`}>
                              • Vasectomy {fullHouseholdDetails?.vasectomy ? '(Yes)' : '(No)'}
                            </p>
                            <p className={`text-gray-700 ${fullHouseholdDetails?.subdermalImplants ? '' : 'text-gray-400'}`}>
                              • Subdermal Implants {fullHouseholdDetails?.subdermalImplants ? '(Yes)' : '(No)'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Children Data */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Children (0-23 months)</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left">#</th>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Age</th>
                              <th className="px-2 py-1 text-left">Vaccination</th>
                              <th className="px-2 py-1 text-left">Deworming</th>
                              <th className="px-2 py-1 text-left">Breastfeeding</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullHouseholdDetails?.children && Array.isArray(fullHouseholdDetails.children) && fullHouseholdDetails.children.length > 0 ? (
                              fullHouseholdDetails.children.map((child: any, idx: number) => (
                                <tr key={idx} className="border-b">
                                  <td className="px-2 py-1">{idx + 1}</td>
                                  <td className="px-2 py-1">{child?.name || 'N/A'}</td>
                                  <td className="px-2 py-1">{child?.age || 'N/A'}</td>
                                  <td className="px-2 py-1">{child?.vaccination || 'N/A'}</td>
                                  <td className="px-2 py-1">{child?.deworming || 'N/A'}</td>
                                  <td className="px-2 py-1">{child?.breastfeeding || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-2 py-4 text-center text-gray-500">No children data available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Family Members */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Family Members</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left">#</th>
                              <th className="px-2 py-1 text-left">Name</th>
                              <th className="px-2 py-1 text-left">Relation</th>
                              <th className="px-2 py-1 text-left">Age</th>
                              <th className="px-2 py-1 text-left">Sex</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullHouseholdDetails?.familyMembers && Array.isArray(fullHouseholdDetails.familyMembers) && fullHouseholdDetails.familyMembers.length > 0 ? (
                              fullHouseholdDetails.familyMembers.map((member: any, idx: number) => (
                                <tr key={idx} className="border-b">
                                  <td className="px-2 py-1">{idx + 1}</td>
                                  <td className="px-2 py-1">{member?.name || 'N/A'}</td>
                                  <td className="px-2 py-1">{member?.relation || 'N/A'}</td>
                                  <td className="px-2 py-1">{member?.age || 'N/A'}</td>
                                  <td className="px-2 py-1">{member?.sex || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-2 py-4 text-center text-gray-500">No family members data available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Education Members */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Education Information</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-2 py-1 text-left">#</th>
                              <th className="px-2 py-1 text-left">Currently Studying</th>
                              <th className="px-2 py-1 text-left">Level</th>
                              <th className="px-2 py-1 text-left">School Type</th>
                              <th className="px-2 py-1 text-left">School Name</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fullHouseholdDetails?.educationMembers && Array.isArray(fullHouseholdDetails.educationMembers) && fullHouseholdDetails.educationMembers.length > 0 ? (
                              fullHouseholdDetails.educationMembers.map((edu: any, idx: number) => (
                                <tr key={idx} className="border-b">
                                  <td className="px-2 py-1">{idx + 1}</td>
                                  <td className="px-2 py-1">{edu?.currentlyStudying || 'N/A'}</td>
                                  <td className="px-2 py-1">{edu?.levelNumber || 'N/A'}</td>
                                  <td className="px-2 py-1">{edu?.schoolType || 'N/A'}</td>
                                  <td className="px-2 py-1">{edu?.schoolName || 'N/A'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="px-2 py-4 text-center text-gray-500">No education data available</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Residents List */}
                    {fullHouseholdDetails?.residents && fullHouseholdDetails.residents.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Residents ({fullHouseholdDetails.residents.length})</h4>
                        <div className="space-y-2">
                          {fullHouseholdDetails.residents.map((resident: any) => (
                            <div key={resident.id} className="p-3 bg-white rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {resident.firstName} {resident.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{resident.civilStatus}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewResident(resident.id)
                                }}
                                disabled={residentLoading}
                                className="ml-3 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                      <Link
                        href={`/households/${selectedHousehold.id}/edit`}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors font-semibold"
                      >
                        Edit Household
                      </Link>
                      <Link
                        href={`/residents?householdId=${selectedHousehold.id}`}
                        className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center transition-colors font-semibold"
                      >
                        View Residents
                      </Link>
                      <div className="relative">
                        <button 
                          onClick={() => setShowHouseholdExportDropdown(!showHouseholdExportDropdown)}
                          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Export
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        
                        {showHouseholdExportDropdown && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setShowHouseholdExportDropdown(false)}
                            ></div>
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                              <button
                                onClick={handleExportHouseholdCSV}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-100"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Export as CSV
                              </button>
                              <button
                                onClick={handleExportHouseholdExcel}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center border-b border-gray-100"
                              >
                                <FileText className="h-4 w-4 mr-2 text-green-600" />
                                Export as Excel
                              </button>
                              <button
                                onClick={handleExportHouseholdPDF}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                              >
                                <FileText className="h-4 w-4 mr-2 text-red-600" />
                                Export as PDF
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resident Details Modal */}
        {showResidentModal && selectedResident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Resident Details</h2>
                <button
                  onClick={() => {
                    setShowResidentModal(false)
                    setSelectedResident(null)
                    setShowViewModal(true) // Reopen household modal
                  }}
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
                        selectedResident.residencyStatus === 'RESIDENT' ? 'bg-green-100 text-green-800' :
                        selectedResident.residencyStatus === 'INSTITUTIONAL_HOUSEHOLD' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedResident.residencyStatus === 'RESIDENT' ? 'Resident' : 
                         selectedResident.residencyStatus === 'INSTITUTIONAL_HOUSEHOLD' ? 'Institutional Household' : 
                         selectedResident.residencyStatus}
                      </span>
                      <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
                        {selectedResident.civilStatus}
                      </span>
                      {selectedResident.isPWD && (
                        <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
                          PWD
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h4>
                    <div className="space-y-3">
                      {selectedResident.dateOfBirth && (
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(selectedResident.dateOfBirth), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Sex</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.sex}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Civil Status</p>
                        <p className="text-sm font-medium text-gray-900">{selectedResident.civilStatus}</p>
                      </div>
                      {selectedResident.barangay && (
                        <div>
                          <p className="text-xs text-gray-500">Barangay</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedResident.barangay}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      {selectedResident.contactNo && (
                        <div>
                          <p className="text-xs text-gray-500">Contact Number</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {selectedResident.contactNo}
                          </p>
                        </div>
                      )}
                      {selectedResident.address && (
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {selectedResident.address}
                          </p>
                        </div>
                      )}
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
                      {selectedResident.lengthOfStay && (
                        <div>
                          <p className="text-xs text-gray-500">Length of Stay</p>
                          <p className="text-sm font-medium text-gray-900">{selectedResident.lengthOfStay}</p>
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
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowResidentModal(false)
                      setSelectedResident(null)
                      setShowViewModal(true) // Reopen household modal
                    }}
                    className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <X className="h-4 w-4" />
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



