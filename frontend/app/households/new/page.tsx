'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from 'react-query'
import api from '@/lib/api'
import Layout from '@/components/Layout'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, MapPin, Home, Navigation, DollarSign, Users, User, ChevronRight, ChevronLeft, Calendar, Hash, Heart } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'

export default function NewHouseholdPage() {
  const router = useRouter()
  const { hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 8

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
    // Health Information
    threeMealsDaily: '',
    hasMedicinalPlants: '',
    medicinalPlantTypes: '',
    hasVegetableGarden: '',
    usesIodizedSalt: '',
    usesFamilyPlanning: '',
    familyPlanningMethod: '',
    // Natural Family Planning Methods
    basalBodyTemperature: false,
    cervicalMucus: false,
    lactationalMucus: false,
    rhythm: false,
    standardDaysMethod: false,
    symptoThermalMethod: false,
    withdrawal: false,
    // Artificial Family Planning Methods
    condom: false,
    depoInjection: false,
    iud: false,
    tubalLigation: false,
    pills: false,
    vasectomy: false,
    subdermalImplants: false,
    // Children 0-23 months data (up to 5 children)
    children: Array(5).fill(null).map(() => ({
      name: '',
      // Vaccination
      bcg: false,
      pentavalent1: false,
      pentavalent2: false,
      pentavalent3: false,
      opv1: false,
      opv2: false,
      opv3: false,
      hvb1: false,
      hvb2: false,
      hvb3: false,
      mov: false,
      measles: false,
      rotaDose2: false,
      // Deworming
      dewormed: '',
      dateLastDewormed: '',
      // Micronutrient
      vitaminADateLastReceived: '',
      ironDateLastReceived: '',
      usingMNP: '',
      usingIFR: '',
      // Breastfeeding
      exclusivelyBreastfed1stMo: '',
      exclusivelyBreastfed2ndMo: '',
      exclusivelyBreastfed3rdMo: '',
      exclusivelyBreastfed4thMo: '',
      exclusivelyBreastfed5thMo: '',
      dateLastBreastfed: '',
      feedingStatus6to23Months: '',
    })),
    // Family Members Information (up to 9 members)
    familyMembers: Array(9).fill(null).map(() => ({
      name: '',
      relationToHHHead: '',
      religion: '',
      status: '',
      sex: '',
      citizenship: '',
      ethnicity: '',
      registeredBirthAtCivilRegistrar: '',
      registeredCOMELECVoterInBarangay: '',
      civilStatus: '',
      birthDate: '',
      nuclearFamilyCode: '',
    })),
    // Education Information (up to 9 members, matching family members)
    educationMembers: Array(9).fill(null).map(() => ({
      currentlyStudying: '',
      levelNumber: '',
      schoolType: '',
      seniorHighTrackStrand: '',
      highestAttainment: '',
      collegeCourseCompleted: '',
      schoolName: '',
      currentlyAttendingTraining: '',
      attendedAnyTraining: '',
              trainingName: '',
              whyNotStudying: '',
              notGraduatedSecondaryStudying: '',
              whyNotStudyingSecondary: '',
              canReadWrite: '',
            })),
    // Type of School Attended (up to 9 members, matching family members)
    schoolTypeMembers: Array(9).fill(null).map(() => ({
      schoolType: '',
      schoolName: '',
      schoolLocation: '',
      schoolLevel: '',
    })),
    // Livelihood Characteristics (up to 10 members)
    livelihoodMembers: Array(10).fill(null).map(() => ({
      name: '',
      mainSourceOfIncome: '',
      statusOfWork: '',
      monthlyIncome: '',
      otherSourceOfIncome: '',
      whereIncomeSpent: '',
      hasSavingsInvestment: '',
      reasonNotWorking: '',
      dependsOn: '',
      lastJobDate: '',
      workStatus15PlusUnemployed: '',
      isOFW: '',
      migrationStatus: '',
    })),
  })

  useEffect(() => {
    // Ensure hydration happens on client side
    if (typeof window !== 'undefined') {
      const state = useAuthStore.getState()
      
      // Try to hydrate immediately
      if (!state.hydrated) {
        state.hydrate()
      }
      
      // Fallback: Force hydration after a short delay if still not hydrated
      const timeout = setTimeout(() => {
        const currentState = useAuthStore.getState()
        if (!currentState.hydrated) {
          console.warn('Forcing hydration after timeout')
          currentState.hydrate()
        }
      }, 50)
      
      return () => clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    // Force hydration on mount
    if (typeof window !== 'undefined' && !hydrated) {
      useAuthStore.getState().hydrate()
    }
  }, [])

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      router.push('/login')
    }
  }, [hydrated, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    // Handle education members array fields (format: edu{index}_{fieldName})
    if (name.startsWith('edu') && name.includes('_')) {
      const match = name.match(/^edu(\d+)_(.+)$/)
      if (match) {
        const eduIndex = parseInt(match[1])
        const fieldName = match[2]
        
        if (!isNaN(eduIndex) && eduIndex >= 0 && eduIndex < 9) {
          setFormData(prev => {
            const newEduMembers = [...prev.educationMembers]
            const currentEduMember = newEduMembers[eduIndex] || {
              currentlyStudying: '',
              levelNumber: '',
              schoolType: '',
              seniorHighTrackStrand: '',
              highestAttainment: '',
              collegeCourseCompleted: '',
              schoolName: '',
              currentlyAttendingTraining: '',
              attendedAnyTraining: '',
              trainingName: '',
              whyNotStudying: '',
              notGraduatedSecondaryStudying: '',
              whyNotStudyingSecondary: '',
              canReadWrite: '',
            }
            
            newEduMembers[eduIndex] = { ...currentEduMember, [fieldName]: value }
            return { ...prev, educationMembers: newEduMembers }
          })
          return
        }
      }
    }
    
    // Handle school type members array fields (format: schoolType{index}_{fieldName})
    if (name.startsWith('schoolType') && name.includes('_')) {
      const match = name.match(/^schoolType(\d+)_(.+)$/)
      if (match) {
        const schoolTypeIndex = parseInt(match[1])
        const fieldName = match[2]
        
        if (!isNaN(schoolTypeIndex) && schoolTypeIndex >= 0 && schoolTypeIndex < 9) {
          setFormData(prev => {
            const newSchoolTypeMembers = [...prev.schoolTypeMembers]
            const currentSchoolTypeMember = newSchoolTypeMembers[schoolTypeIndex] || {
              schoolType: '',
              schoolName: '',
              schoolLocation: '',
              schoolLevel: '',
            }
            
            newSchoolTypeMembers[schoolTypeIndex] = { ...currentSchoolTypeMember, [fieldName]: value }
            return { ...prev, schoolTypeMembers: newSchoolTypeMembers }
          })
          return
        }
      }
    }
    
    // Handle family members array fields (format: member{index}_{fieldName})
    if (name.startsWith('member') && name.includes('_')) {
      const match = name.match(/^member(\d+)_(.+)$/)
      if (match) {
        const memberIndex = parseInt(match[1])
        const fieldName = match[2]
        
        if (!isNaN(memberIndex) && memberIndex >= 0 && memberIndex < 9) {
          setFormData(prev => {
            const newMembers = [...prev.familyMembers]
            const currentMember = newMembers[memberIndex] || {
              name: '',
              relationToHHHead: '',
              religion: '',
              status: '',
              sex: '',
              citizenship: '',
              ethnicity: '',
              registeredBirthAtCivilRegistrar: '',
              registeredCOMELECVoterInBarangay: '',
              civilStatus: '',
              birthDate: '',
              nuclearFamilyCode: '',
            }
            
            newMembers[memberIndex] = { ...currentMember, [fieldName]: value }
            return { ...prev, familyMembers: newMembers }
          })
          return
        }
      }
    }
    
    // Handle children array fields (format: childIndex_fieldName)
    if (name.includes('_') && name.match(/^\d+_/)) {
      const parts = name.split('_')
      const childIndex = parseInt(parts[0])
      const fieldName = parts.slice(1).join('_') // Handle field names that might contain underscores
      
      if (!isNaN(childIndex) && childIndex >= 0 && childIndex < 5) {
        setFormData(prev => {
          const newChildren = [...prev.children]
          const currentChild = newChildren[childIndex] || {
            name: '',
            bcg: false,
            pentavalent1: false,
            pentavalent2: false,
            pentavalent3: false,
            opv1: false,
            opv2: false,
            opv3: false,
            hvb1: false,
            hvb2: false,
            hvb3: false,
            mov: false,
            measles: false,
            rotaDose2: false,
            dewormed: '',
            dateLastDewormed: '',
            vitaminADateLastReceived: '',
            ironDateLastReceived: '',
            usingMNP: '',
            usingIFR: '',
            exclusivelyBreastfed1stMo: '',
            exclusivelyBreastfed2ndMo: '',
            exclusivelyBreastfed3rdMo: '',
            exclusivelyBreastfed4thMo: '',
            exclusivelyBreastfed5thMo: '',
            dateLastBreastfed: '',
            feedingStatus6to23Months: '',
          }
          
          if (type === 'checkbox') {
            newChildren[childIndex] = { ...currentChild, [fieldName]: checked }
          } else {
            newChildren[childIndex] = { ...currentChild, [fieldName]: value }
          }
          
          return { ...prev, children: newChildren }
        })
        return
      }
    }
    
    // Handle regular form fields
    if (type === 'radio') {
      setFormData(prev => ({ ...prev, [name]: value }))
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
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
    
    // Only allow submission on the last step
    if (currentStep !== totalSteps) {
      return
    }
    
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        headName: formData.headFirstName && formData.headLastName 
          ? `${formData.headFirstName}${formData.headMiddleName ? ' ' + formData.headMiddleName : ''} ${formData.headLastName}`.trim()
          : formData.headName || '',
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        income: formData.income ? parseFloat(formData.income) : null,
        householdSize: parseInt(formData.householdSize),
        numberOfFamilyMembers: formData.numberOfFamilyMembers ? parseInt(formData.numberOfFamilyMembers) : null,
        yearFirstResided: formData.yearFirstResided ? parseInt(formData.yearFirstResided) : null,
        placeOfOriginMunicipality: formData.placeOfOriginMunicipality || null,
        placeOfOriginProvince: formData.placeOfOriginProvince || null,
        // Health Information
        threeMealsDaily: formData.threeMealsDaily || null,
        hasMedicinalPlants: formData.hasMedicinalPlants || null,
        medicinalPlantTypes: formData.medicinalPlantTypes || null,
        hasVegetableGarden: formData.hasVegetableGarden || null,
        usesIodizedSalt: formData.usesIodizedSalt || null,
        usesFamilyPlanning: formData.usesFamilyPlanning || null,
        familyPlanningMethod: formData.familyPlanningMethod || null,
        // Natural Family Planning Methods
        basalBodyTemperature: formData.basalBodyTemperature || false,
        cervicalMucus: formData.cervicalMucus || false,
        lactationalMucus: formData.lactationalMucus || false,
        rhythm: formData.rhythm || false,
        standardDaysMethod: formData.standardDaysMethod || false,
        symptoThermalMethod: formData.symptoThermalMethod || false,
        withdrawal: formData.withdrawal || false,
        // Artificial Family Planning Methods
        condom: formData.condom || false,
        depoInjection: formData.depoInjection || false,
        iud: formData.iud || false,
        tubalLigation: formData.tubalLigation || false,
        pills: formData.pills || false,
        vasectomy: formData.vasectomy || false,
        subdermalImplants: formData.subdermalImplants || false,
        // Children 0-23 months data
        children: formData.children || [],
        // Family Members data
        familyMembers: formData.familyMembers || [],
        // Education Members data
        educationMembers: formData.educationMembers || [],
        // School Type Members data
        schoolTypeMembers: formData.schoolTypeMembers || [],
        // Livelihood Members data
        livelihoodMembers: formData.livelihoodMembers || [],
      }

      await api.post('/households', submitData)

      toast.success('Household added successfully!')
      queryClient.invalidateQueries('households')
      router.push('/households')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add household')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="w-full space-y-6">
        {/* Enhanced Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-xl shadow-lg p-6 border border-primary-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <div className="relative flex items-center gap-4">
            <Link
              href="/households"
              className="p-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors border border-white/20"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </Link>
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Home className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Add New Household</h1>
              <p className="text-white/90 text-sm">Enter household information to register in the system</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={currentStep >= 1 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 1 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  1
                </div>
                <span className="font-medium">Basic Information</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 2 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 2 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  2
                </div>
                <span className="font-medium">Family Information</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 3 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 3 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  3
                </div>
                <span className="font-medium">Health Information</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 4 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 4 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  4
                </div>
                <span className="font-medium">Family Planning</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 5 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 5 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  5
                </div>
                <span className="font-medium">Health & Nutrition (0-23 months)</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 6 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 6 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  6
                </div>
                <span className="font-medium">Family Members</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
              <div className={currentStep >= 7 ? 'flex items-center gap-2 text-primary-600' : 'flex items-center gap-2 text-gray-400'}>
                <div className={currentStep >= 7 ? 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-primary-600 text-white' : 'w-8 h-8 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-500'}>
                  7
                </div>
                <span className="font-medium">Education</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
          {/* Page 1: Basic Information and Other Sections */}
          {currentStep === 1 && (
            <>
          {/* Basic Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Home className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  House Number
                </label>
                <input
                  type="text"
                  name="houseNumber"
                  value={formData.houseNumber}
                  onChange={handleInputChange}
                  placeholder="Enter house number"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
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
                  Barangay
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5" />
                  Complete Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Enter complete address"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white resize-none text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">This field will be used as the main address. You can manually enter or it will be constructed from the fields above.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1.5" />
                  Household Size
                </label>
                <input
                  type="number"
                  name="householdSize"
                  value={formData.householdSize}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Head of Family Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Head of the Family Name</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="headFirstName"
                  value={formData.headFirstName}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="headMiddleName"
                  value={formData.headMiddleName}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="headLastName"
                  value={formData.headLastName}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
            </div>
          </div>
          </>
          )}

          {/* Page 2: Family Information */}
          {currentStep === 2 && (
            <>
          {/* Family Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Family Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Hash className="h-4 w-4 inline mr-1.5 text-primary-600" />
                  Number of family members
                </label>
                <p className="text-xs text-gray-500 mb-3 ml-6 italic">(Bilang ng myembro ng pamilya)</p>
                <input
                  type="number"
                  name="numberOfFamilyMembers"
                  value={formData.numberOfFamilyMembers}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter number of family members"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1.5 text-primary-600" />
                  Family head's year first resided in the barangay
                </label>
                <p className="text-xs text-gray-500 mb-3 ml-6 italic">(Unang taon nang paninirahan ng puno ng pamilya sa barangay)</p>
                <input
                  type="number"
                  name="yearFirstResided"
                  value={formData.yearFirstResided}
                  onChange={handleInputChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="e.g., 2010"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5 text-primary-600" />
                  Place of origin - Municipality
                </label>
                <p className="text-xs text-gray-500 mb-3 ml-6 italic">(Lugar na pinanggalingan ng puno ng pamilya - Municipal)</p>
                <input
                  type="text"
                  name="placeOfOriginMunicipality"
                  value={formData.placeOfOriginMunicipality}
                  onChange={handleInputChange}
                  placeholder="Enter municipality"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1.5 text-primary-600" />
                  Place of origin - Province
                </label>
                <p className="text-xs text-gray-500 mb-3 ml-6 italic">(Lugar na pinanggalingan ng puno ng pamilya - Provincial)</p>
                <input
                  type="text"
                  name="placeOfOriginProvince"
                  value={formData.placeOfOriginProvince}
                  onChange={handleInputChange}
                  placeholder="Enter province"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Navigation className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Location (Optional)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 14.5995"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 120.9842"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div className="md:col-span-2">
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="flex items-center px-5 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold mb-2"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Current Location
                  </button>
                  <p className="text-xs text-gray-600">
                    Click to automatically capture your current location using GPS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Household Condition Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Home className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Household Condition</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Owner (Main Family)
                </label>
                <select
                  name="ownerMainFamily"
                  value={formData.ownerMainFamily}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Extended Family
                </label>
                <select
                  name="extendedFamily"
                  value={formData.extendedFamily}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Indicate Head ID of main family
                </label>
                <input
                  type="text"
                  name="mainFamilyHeadId"
                  value={formData.mainFamilyHeadId}
                  onChange={handleInputChange}
                  placeholder="Enter head ID of main family"
                  disabled={formData.extendedFamily !== 'Yes'}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                    formData.extendedFamily !== 'Yes' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Socioeconomic Information Section */}
          <div className="border-t border-gray-200 pt-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Socioeconomic Information (Optional)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1.5" />
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Living Conditions
                </label>
                <select
                  name="livingConditions"
                  value={formData.livingConditions}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white text-gray-900"
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
          </>
          )}

          {/* Page 3: Health Information */}
          {currentStep === 3 && (
            <>
          {/* Health Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Heart className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Health Information</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Question 1: Three meals daily */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  1. Kumakain po ba kayo ng tatlong beses (meals) araw-araw?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="threeMealsDaily"
                      value="Yes"
                      checked={formData.threeMealsDaily === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Oo (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="threeMealsDaily"
                      value="No"
                      checked={formData.threeMealsDaily === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Hindi (No)</span>
                  </label>
                </div>
              </div>

              {/* Question 2: Has medicinal plants */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  2. May tanim na halamang gamot?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasMedicinalPlants"
                      value="Yes"
                      checked={formData.hasMedicinalPlants === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Oo (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasMedicinalPlants"
                      value="No"
                      checked={formData.hasMedicinalPlants === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Hindi (No)</span>
                  </label>
                </div>
              </div>

              {/* Question 3: Medicinal plant types */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kung Oo, anong uri ng halamang gamot?
                </label>
                <input
                  type="text"
                  name="medicinalPlantTypes"
                  value={formData.medicinalPlantTypes}
                  onChange={handleInputChange}
                  placeholder="Enter types of medicinal plants"
                  disabled={formData.hasMedicinalPlants !== 'Yes'}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                    formData.hasMedicinalPlants !== 'Yes' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-900'
                  }`}
                />
              </div>

              {/* Question 4: Has vegetable garden */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  4. May taniman ng gulay sa bakuran?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasVegetableGarden"
                      value="Yes"
                      checked={formData.hasVegetableGarden === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Oo (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="hasVegetableGarden"
                      value="No"
                      checked={formData.hasVegetableGarden === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Hindi (No)</span>
                  </label>
                </div>
              </div>

              {/* Question 5: Uses iodized salt */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  5. Gumagamit ng iodized salt?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="usesIodizedSalt"
                      value="Yes"
                      checked={formData.usesIodizedSalt === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Oo (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="usesIodizedSalt"
                      value="No"
                      checked={formData.usesIodizedSalt === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Hindi (No)</span>
                  </label>
                </div>
              </div>

              {/* Question 6: Uses family planning */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  6. Gumagamit ng Family Planning?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="usesFamilyPlanning"
                      value="Yes"
                      checked={formData.usesFamilyPlanning === 'Yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Oo (Yes)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="usesFamilyPlanning"
                      value="No"
                      checked={formData.usesFamilyPlanning === 'No'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">Hindi (No)</span>
                  </label>
                </div>
              </div>

              {/* Question 7: Family planning method */}
              <div className="border-b border-gray-200 pb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kung oo, anong paraan ng family planning ang ginagamit?
                </label>
                <input
                  type="text"
                  name="familyPlanningMethod"
                  value={formData.familyPlanningMethod}
                  onChange={handleInputChange}
                  placeholder="Enter family planning method"
                  disabled={formData.usesFamilyPlanning !== 'Yes'}
                  className={`w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                    formData.usesFamilyPlanning !== 'Yes' 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-white text-gray-900'
                  }`}
                />
              </div>

            </div>
          </div>
          </>
          )}

          {/* Page 4: Natural Family Planning Methods */}
          {currentStep === 4 && (
            <>
          {/* Natural Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Heart className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Family Planning</h2>
            </div>
            
            {/* Natural Subsection */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Natural</h3>
              <div className="grid grid-cols-1 gap-6">
                {/* Basal Body Temperature */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="basalBodyTemperature"
                    checked={formData.basalBodyTemperature}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">1. Basal Body Temperature</span>
                </label>
              </div>

              {/* Cervical Mucus */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="cervicalMucus"
                    checked={formData.cervicalMucus}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">2. Cervical Mucus</span>
                </label>
              </div>

              {/* Lactational Mucus */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="lactationalMucus"
                    checked={formData.lactationalMucus}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">3. Lactational Mucus</span>
                </label>
              </div>

              {/* Rhythm */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="rhythm"
                    checked={formData.rhythm}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">4. Rhythm</span>
                </label>
              </div>

              {/* Standard Days Method */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="standardDaysMethod"
                    checked={formData.standardDaysMethod}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">5. Standard Days Method</span>
                </label>
              </div>

              {/* Sympto-thermal Method */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="symptoThermalMethod"
                    checked={formData.symptoThermalMethod}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">6. Sympto-thermal Method</span>
                </label>
              </div>

              {/* Withdrawal */}
              <div className="border-b border-gray-200 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="withdrawal"
                    checked={formData.withdrawal}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                  />
                  <span className="text-sm font-semibold text-gray-700">7. Withdrawal</span>
                </label>
              </div>
              </div>
            </div>

            {/* Artificial Subsection */}
            <div className="mb-6">
              <h3 className="text-md font-semibold text-gray-800 mb-4">Artificial</h3>
              <div className="grid grid-cols-1 gap-6">
                {/* Condom */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="condom"
                      checked={formData.condom}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">8. Condom</span>
                  </label>
                </div>

                {/* Depo Injection */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="depoInjection"
                      checked={formData.depoInjection}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">9. Depo Injection</span>
                  </label>
                </div>

                {/* IUD */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="iud"
                      checked={formData.iud}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">10. IUD</span>
                  </label>
                </div>

                {/* Tubal Ligation */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="tubalLigation"
                      checked={formData.tubalLigation}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">11. Tubal Ligation</span>
                  </label>
                </div>

                {/* Pills */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="pills"
                      checked={formData.pills}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">12. Pills</span>
                  </label>
                </div>

                {/* Vasectomy */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="vasectomy"
                      checked={formData.vasectomy}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">13. Vasectomy</span>
                  </label>
                </div>

                {/* Subdermal Implants */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="subdermalImplants"
                      checked={formData.subdermalImplants}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 rounded border-gray-300"
                    />
                    <span className="text-sm font-semibold text-gray-700">14. Subdermal Implants</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Page 5: Health and Nutrition Information for Children aged 0-23 months */}
          {currentStep === 5 && (
            <>
          {/* Health and Nutrition Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Heart className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Health and Nutrition Information for Children aged 0-23 months</h2>
                <p className="text-sm text-gray-600 mt-1">Uri ng Pagbabakuna na Natanggap (0-23 buwan) (pakisuri)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {/* Vaccination Records Table */}
              <div className="w-full overflow-x-auto -mx-4 px-4" style={{ maxWidth: '100%' }}>
                <h3 className="text-md font-semibold text-gray-800 mb-4">Vaccination Records</h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
                  <table className="min-w-[1400px] divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Name</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">BCG<br/>(0 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pentavalent 1<br/>(1.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pentavalent 2<br/>(2.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pentavalent 3<br/>(3.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">OPV1<br/>(1.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">OPV2<br/>(2.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">OPV3<br/>(3.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">HVB1<br/>(0 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">HVB2<br/>(1.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">HVB3<br/>(3.5 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">MOV<br/>(0 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">MEASLES<br/>(12-15 Mos.)</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700">ROTA dose 2<br/>(0 Mos.)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`${index}_name`}
                              value={formData.children[index]?.name || ''}
                              onChange={handleInputChange}
                              placeholder="Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_bcg`} checked={formData.children[index]?.bcg || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_pentavalent1`} checked={formData.children[index]?.pentavalent1 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_pentavalent2`} checked={formData.children[index]?.pentavalent2 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_pentavalent3`} checked={formData.children[index]?.pentavalent3 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_opv1`} checked={formData.children[index]?.opv1 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_opv2`} checked={formData.children[index]?.opv2 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_opv3`} checked={formData.children[index]?.opv3 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_hvb1`} checked={formData.children[index]?.hvb1 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_hvb2`} checked={formData.children[index]?.hvb2 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_hvb3`} checked={formData.children[index]?.hvb3 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_mov`} checked={formData.children[index]?.mov || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="checkbox" name={`${index}_measles`} checked={formData.children[index]?.measles || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input type="checkbox" name={`${index}_rotaDose2`} checked={formData.children[index]?.rotaDose2 || false} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deworming, Micronutrient, and Breastfeeding Status Table */}
              <div className="w-full overflow-x-auto -mx-4 px-4" style={{ maxWidth: '100%' }}>
                <h3 className="text-md font-semibold text-gray-800 mb-4">Deworming, Micronutrient, and Breastfeeding Status</h3>
                <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
                  <table className="min-w-[1800px] divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">NAME</th>
                        <th colSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Dewormed</th>
                        <th colSpan={6} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Micronutrient</th>
                        <th colSpan={12} className="px-2 py-2 text-center font-semibold text-gray-700">Exclusively Breastfed</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Date last dewormed</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Vitamin A date last received</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Iron date last received</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Using MNP</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Using IFR</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">1st mo.</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">2nd mo.</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">3rd mo.</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">4th mo.</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">5th mo.</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Date last breastfed</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700">Feeding Status 6 to 23 months</th>
                      </tr>
                      <tr>
                        <th className="px-3 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Yes</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">no</th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`${index}_name`}
                              value={formData.children[index]?.name || ''}
                              onChange={handleInputChange}
                              placeholder="Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Dewormed */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_dewormed`} value="Yes" checked={formData.children[index]?.dewormed === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_dewormed`} value="no" checked={formData.children[index]?.dewormed === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input type="date" name={`${index}_dateLastDewormed`} value={formData.children[index]?.dateLastDewormed || ''} onChange={handleInputChange} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-gray-900" />
                          </td>
                          {/* Micronutrient */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input type="date" name={`${index}_vitaminADateLastReceived`} value={formData.children[index]?.vitaminADateLastReceived || ''} onChange={handleInputChange} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-gray-900" />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input type="date" name={`${index}_ironDateLastReceived`} value={formData.children[index]?.ironDateLastReceived || ''} onChange={handleInputChange} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-gray-900" />
                          </td>
                          {/* Using MNP - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_usingMNP`} value="Yes" checked={formData.children[index]?.usingMNP === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Using MNP - no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_usingMNP`} value="no" checked={formData.children[index]?.usingMNP === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Using IFR - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_usingIFR`} value="Yes" checked={formData.children[index]?.usingIFR === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Using IFR - no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_usingIFR`} value="no" checked={formData.children[index]?.usingIFR === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 1st mo. Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed1stMo`} value="Yes" checked={formData.children[index]?.exclusivelyBreastfed1stMo === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 1st mo. no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed1stMo`} value="no" checked={formData.children[index]?.exclusivelyBreastfed1stMo === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 2nd mo. Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed2ndMo`} value="Yes" checked={formData.children[index]?.exclusivelyBreastfed2ndMo === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 2nd mo. no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed2ndMo`} value="no" checked={formData.children[index]?.exclusivelyBreastfed2ndMo === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 3rd mo. Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed3rdMo`} value="Yes" checked={formData.children[index]?.exclusivelyBreastfed3rdMo === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 3rd mo. no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed3rdMo`} value="no" checked={formData.children[index]?.exclusivelyBreastfed3rdMo === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 4th mo. Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed4thMo`} value="Yes" checked={formData.children[index]?.exclusivelyBreastfed4thMo === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 4th mo. no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed4thMo`} value="no" checked={formData.children[index]?.exclusivelyBreastfed4thMo === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 5th mo. Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed5thMo`} value="Yes" checked={formData.children[index]?.exclusivelyBreastfed5thMo === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Exclusively Breastfed - 5th mo. no */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`${index}_exclusivelyBreastfed5thMo`} value="no" checked={formData.children[index]?.exclusivelyBreastfed5thMo === 'no'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input type="date" name={`${index}_dateLastBreastfed`} value={formData.children[index]?.dateLastBreastfed || ''} onChange={handleInputChange} className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-gray-900" />
                          </td>
                          <td className="px-2 py-2">
                            <input type="text" name={`${index}_feedingStatus6to23Months`} value={formData.children[index]?.feedingStatus6to23Months || ''} onChange={handleInputChange} placeholder="Code" className="w-full px-1 py-1 text-xs border border-gray-300 rounded text-gray-900" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">KODIGO - Use Code (Feeding Status 6 to 23 months):</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
                  <div>(1) Exclusively Breastfeed</div>
                  <div>(2) Breastfeed + formula milk</div>
                  <div>(3) Formula milk only</div>
                  <div>(4) Breastfeed + complementary food</div>
                  <div>(5) Formula milk + complementary food</div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Page 6: Family Members Information */}
          {currentStep === 6 && (
            <>
          {/* Family Members Information Section */}
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">IMPORMASYON NG MIYEMBRO NG PAMILYA (FAMILY MEMBERS INFORMATION)</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Family Members Table */}
              <div className="overflow-x-auto -mx-4 px-4" style={{ maxWidth: '100%' }}>
                <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
                  <table className="min-w-[2000px] divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-center font-semibold text-gray-700 border-r border-gray-300 w-12">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Relation to the HH Head</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Religion</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Sex/Gender</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Citizenship</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Ethnicity</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Registered Birth at Civil Registrar</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Registered COMELEC Voter in the barangay</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Civil Status</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-700 border-r border-gray-300">Birth Date mm/dd/yyyy</th>
                        <th className="px-3 py-2 text-left font-semibold text-red-600">Sa aling Nukleyar na pamilya nabibilang</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <tr key={index}>
                          <td className="px-3 py-2 text-center border-r border-gray-300 font-semibold">{index + 1}</td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_name`}
                              value={formData.familyMembers[index]?.name || ''}
                              onChange={handleInputChange}
                              placeholder="Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_relationToHHHead`}
                              value={formData.familyMembers[index]?.relationToHHHead || ''}
                              onChange={handleInputChange}
                              placeholder="Relation"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_religion`}
                              value={formData.familyMembers[index]?.religion || ''}
                              onChange={handleInputChange}
                              placeholder="Religion"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_status`}
                              value={formData.familyMembers[index]?.status || ''}
                              onChange={handleInputChange}
                              placeholder="Status"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <select
                              name={`member${index}_sex`}
                              value={formData.familyMembers[index]?.sex || ''}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            >
                              <option value="">Select</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_citizenship`}
                              value={formData.familyMembers[index]?.citizenship || ''}
                              onChange={handleInputChange}
                              placeholder="Citizenship"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`member${index}_ethnicity`}
                              value={formData.familyMembers[index]?.ethnicity || ''}
                              onChange={handleInputChange}
                              placeholder="Ethnicity"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <select
                              name={`member${index}_registeredBirthAtCivilRegistrar`}
                              value={formData.familyMembers[index]?.registeredBirthAtCivilRegistrar || ''}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <select
                              name={`member${index}_registeredCOMELECVoterInBarangay`}
                              value={formData.familyMembers[index]?.registeredCOMELECVoterInBarangay || ''}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            >
                              <option value="">Select</option>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <select
                              name={`member${index}_civilStatus`}
                              value={formData.familyMembers[index]?.civilStatus || ''}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            >
                              <option value="">Select</option>
                              <option value="Single">Single</option>
                              <option value="Married">Married</option>
                              <option value="Widowed">Widowed</option>
                              <option value="Divorced">Divorced</option>
                              <option value="Separated">Separated</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="date"
                              name={`member${index}_birthDate`}
                              value={formData.familyMembers[index]?.birthDate || ''}
                              onChange={handleInputChange}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              name={`member${index}_nuclearFamilyCode`}
                              value={formData.familyMembers[index]?.nuclearFamilyCode || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-red-300 rounded text-gray-900"
                            />
                          </td>
                        </tr>
                      ))}
                      {/* KODIGO Row */}
                      <tr>
                        <td className="px-3 py-2 text-center border-r border-gray-300 font-semibold">10</td>
                        <td colSpan={11} className="px-2 py-2 border-r border-gray-300">
                          <span className="text-xs font-semibold text-gray-700">KODIGO (Use Code:)</span>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            placeholder="Code"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            disabled
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Code Legend */}
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
                <h3 className="text-md font-bold text-gray-900 mb-4">KODIGO (Use Code)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Relation to the HH Head */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Relation to the HH Head</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(1) Adopted</div>
                      <div>(2) Brother/Sister</div>
                      <div>(3) Brother-in-law</div>
                      <div>(4) Child</div>
                      <div>(5) Daughter/Son-in-law</div>
                      <div>(6) Employee</div>
                      <div>(7) Grandchild</div>
                      <div>(8) Grandparents</div>
                      <div>(9) Head of the family</div>
                      <div>(10) Live in / cohabit</div>
                      <div>(11) Niece/Nephew</div>
                      <div>(12) Parent/s</div>
                      <div>(13) Parent-in-law</div>
                      <div>(14) Relative</div>
                      <div>(15) Sister-in-law</div>
                      <div>(16) Spouse</div>
                      <div>(17) Stepson/Daughter</div>
                      <div>(18) Step-parent</div>
                      <div>(19) Student</div>
                      <div>(20) Not related (Housemaid)</div>
                      <div>(21) Other</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Status</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(22) Active</div>
                      <div>(23) Transferred</div>
                      <div>(24) Died (If dead, write cause of death)</div>
                      <div className="mt-2 font-semibold">Sex:</div>
                      <div>(25) Male</div>
                      <div>(26) Female</div>
                      <div className="mt-2 font-semibold">Gender:</div>
                      <div>(27) Lesbian</div>
                      <div>(28) Gay</div>
                      <div>(29) Bisexual</div>
                      <div>(30) Transgender</div>
                    </div>
                  </div>

                  {/* Registered Birth at Civil Registrar */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Registered Birth at Civil Registrar</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(31) Yes - Registered Birth at Civil Registrar</div>
                      <div>(32) No - Birth not registered at Civil Registrar</div>
                    </div>
                  </div>

                  {/* Registered COMELEC Voter */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Registered COMELEC Voter in the barangay</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(33) Yes - I am registered in barangay</div>
                      <div>(34) No - I'm not registered in the barangay</div>
                      <div>(35) NR - I'm not registered in any barangay</div>
                      <div>(36) NA - I'm not yet a voter (age 0-17 yrs old)</div>
                    </div>
                  </div>

                  {/* Civil Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Civil Status</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(37) Married</div>
                      <div>(38) Single</div>
                      <div>(39) Solo Parent</div>
                      <div>(40) Not Married Widow</div>
                      <div>(41) Legally Separated</div>
                      <div>(42) Separated</div>
                      <div>(43) Divorced</div>
                    </div>
                  </div>

                  {/* Nukleyar na uri ng pamilya */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Nukleyar na uri ng pamilya</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(44) Magulang at Anak (Parents and Child)</div>
                      <div>(45) Magulang, Anak, at Lolo/Lola (Parents, Child Grandparents - Extended with Grandparents)</div>
                      <div>(46) Single Parent at Anak (Single Parent and Children)</div>
                      <div>(47) Mag-asawa lamang (Married Couple only)</div>
                      <div>(48) Magkaparehong Kasarian na Magulang at Anak (Same-sex Parents and Child)</div>
                      <div>(49) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Page 7: Education */}
          {currentStep === 7 && (
            <>
          {/* Education Section */}
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">EDUKASYON AT KARUNUNGAN (EDUCATION)</h2>
                <p className="text-sm text-gray-600 mt-1">Configuration of Family Members Information (Pls. Follow the sequence of members on the previous table)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Education Table */}
              <div className="overflow-x-auto -mx-4 px-4" style={{ maxWidth: '100%' }}>
                <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
                  <table className="min-w-[2800px] divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      {/* First header row */}
                      <tr>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300 w-12">#</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Kasalukuyang nag-aaral</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Nasa anong antas/Bilang</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Uri ng paaral</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Kung nagtapos ng Senior High School, anong Track o Strand?</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pinakamataas na natamo sa edukasyon</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Kung nakapagtapos ng Koleheyo, anong kurso, ang natapos?</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pangalan ng Paaralan</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Kasalukuyang dumadalo ng Pagsasanay</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Nakadalo ba ng kabit anong skills training?</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Pangalan ng pagsasanay</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">KUNG HINDI NAG-AARAL</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700">KUNG HINDI NAKAPAGTAPOS NG SEKUNYARYA</th>
                      </tr>
                      {/* Second header row */}
                      <tr>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Hindi</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Hindi</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Hindi</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Hindi</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Bakit hindi nag-aaral</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700">Nakakabasa ba at Nakakasulat ng simpleng mensahe sa alinmang wika o dialekto?</th>
                      </tr>
                      {/* Third header row - code references */}
                      <tr className="bg-gray-100">
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 border-r border-gray-300"></th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Tignan ang Kodigo sa ibaba</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700">Hindi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 text-center border-r border-gray-300 font-semibold">{index + 1}</td>
                          {/* Currently studying - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_currentlyStudying`} value="Yes" checked={formData.educationMembers[index]?.currentlyStudying === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Currently studying - No */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_currentlyStudying`} value="No" checked={formData.educationMembers[index]?.currentlyStudying === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Level/Number */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_levelNumber`}
                              value={formData.educationMembers[index]?.levelNumber || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* School Type / Track/Strand */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_schoolType`}
                              value={formData.educationMembers[index]?.schoolType || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Senior High Track/Strand */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_seniorHighTrackStrand`}
                              value={formData.educationMembers[index]?.seniorHighTrackStrand || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Highest attainment */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_highestAttainment`}
                              value={formData.educationMembers[index]?.highestAttainment || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* College course completed */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_collegeCourseCompleted`}
                              value={formData.educationMembers[index]?.collegeCourseCompleted || ''}
                              onChange={handleInputChange}
                              placeholder="Course"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* School Name */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_schoolName`}
                              value={formData.educationMembers[index]?.schoolName || ''}
                              onChange={handleInputChange}
                              placeholder="School Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Currently attending training - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_currentlyAttendingTraining`} value="Yes" checked={formData.educationMembers[index]?.currentlyAttendingTraining === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Currently attending training - No */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_currentlyAttendingTraining`} value="No" checked={formData.educationMembers[index]?.currentlyAttendingTraining === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Attended any training - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_attendedAnyTraining`} value="Yes" checked={formData.educationMembers[index]?.attendedAnyTraining === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Attended any training - No */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_attendedAnyTraining`} value="No" checked={formData.educationMembers[index]?.attendedAnyTraining === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Training name */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_trainingName`}
                              value={formData.educationMembers[index]?.trainingName || ''}
                              onChange={handleInputChange}
                              placeholder="Training name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Why not studying - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_whyNotStudying`} value="Yes" checked={formData.educationMembers[index]?.whyNotStudying === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Why not studying - No */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_whyNotStudying`} value="No" checked={formData.educationMembers[index]?.whyNotStudying === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Not graduated secondary - reason code */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`edu${index}_notGraduatedSecondaryStudying`}
                              value={formData.educationMembers[index]?.notGraduatedSecondaryStudying || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Can read and write - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`edu${index}_canReadWrite`} value="Yes" checked={formData.educationMembers[index]?.canReadWrite === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* Can read and write - No */}
                          <td className="px-2 py-2 text-center">
                            <input type="radio" name={`edu${index}_canReadWrite`} value="No" checked={formData.educationMembers[index]?.canReadWrite === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* KODIGO Section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-xs">
                <h3 className="font-bold text-sm mb-3 text-gray-800">KODIGO:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Kasalukuyang nag-aaral */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Kasalukuyang nag-aaral</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(1) Oo - Kasalukuyang nag-aaral</div>
                      <div>(2) Hindi - Hindi kasalukuyang nag-aaral</div>
                    </div>
                  </div>
                  
                  {/* Nasa anong antas/Bilang */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Nasa anong antas/Bilang</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(3) Day Care</div>
                      <div>(4) Kindergarten</div>
                      <div>(5) Grade 1</div>
                      <div>(6) Grade 2</div>
                      <div>(7) Grade 3</div>
                      <div>(8) Grade 4</div>
                      <div>(9) Grade 5</div>
                      <div>(10) Grade 6</div>
                      <div>(11) Grade 7</div>
                      <div>(12) Grade 8</div>
                      <div>(13) Grade 9</div>
                      <div>(14) Grade 10</div>
                      <div>(15) Grade 11</div>
                      <div>(16) Grade 12</div>
                      <div>(17) 1st Year College</div>
                      <div>(18) 2nd Year College</div>
                      <div>(19) 3rd Year College</div>
                      <div>(20) 4th Year College</div>
                      <div>(21) 5th Year College</div>
                      <div>(22) Vocational</div>
                      <div>(23) Masteral</div>
                      <div>(24) Doctoral</div>
                      <div>(25) ALS</div>
                      <div>(26) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                  
                  {/* Uri ng paaral nag-aaral */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Uri ng paaral nag-aaral</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(27) Pampubliko (Public)</div>
                      <div>(28) Pribado (Private)</div>
                      <div>(29) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                  
                  {/* Kung nagtapos ng Senior High School, anong Track o Strand? */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Kung nagtapos ng Senior High School, anong Track o Strand?</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(30) Academic Track (STEM, ABM, HUMSS, GAS)</div>
                      <div>(31) Technical-Vocational-Livelihood (TVL) Track</div>
                      <div>(32) Sports Track</div>
                      <div>(33) Arts and Design Track</div>
                      <div>(34) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                  
                  {/* Pinakamataas na natamo edukasa. yoo. */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Pinakamataas na natamo edukasa. yoo.</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(35) Walang Pormal na Edukasyon (No Formal Education)</div>
                      <div>(36) Natapos ang Ilang Taon sa Elementarya (Some Elementary)</div>
                      <div>(37) Nakapagtapos ng Elementarya (Elementary Graduate)</div>
                      <div>(38) Natapos ang Ilang Taon sa Sekundarya (Some Secondary)</div>
                      <div>(39) Nakapagtapos ng Sekundarya (Secondary Graduate)</div>
                      <div>(40) Natapos ang Ilang Taon sa Kolehiyo/Vocational (Some College/Vocational)</div>
                      <div>(41) Nakapagtapos ng Kolehiyo/Vocational (College/Vocational Graduate)</div>
                      <div>(42) Masteral (Master's Degree)</div>
                      <div>(43) Doctoral (Doctorate Degree)</div>
                      <div>(44) ALS Graduate</div>
                      <div>(45) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                  
                  {/* Bakit hindi nag-aaral */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Bakit hindi nag-aaral</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(46) Kakulangan sa Pinansyal (Financial Constraints)</div>
                      <div>(47) Walang Interes (Lack of Interest)</div>
                      <div>(48) May Kapansanan (With Disability)</div>
                      <div>(49) Malayo ang Paaralan (School is too far)</div>
                      <div>(50) Maagang Pag-aasawa/Pagbubuntis (Early Marriage/Pregnancy)</div>
                      <div>(51) Nagtatrabaho (Working)</div>
                      <div>(52) Tapos na sa Pag-aaral (Finished Studying)</div>
                      <div>(53) Iba pa (Others, please specify:)</div>
                    </div>
                  </div>
                  
                  {/* Nakakabasa ba at Nakakasulat ng simpleng mensahe sa alinmang wika o dialekto? */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Nakakabasa ba at Nakakasulat ng simpleng mensahe sa alinmang wika o dialekto?</h4>
                    <div className="space-y-1 text-xs text-gray-700">
                      <div>(54) Oo (Yes)</div>
                      <div>(55) Hindi (No)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Page 8: Type of School Attended & Livelihood Characteristics */}
          {currentStep === 8 && (
            <>
          {/* Type of School Attended Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">URI NG PAARAL NAG-AARAL (TYPE OF SCHOOL ATTENDED)</h2>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700 text-sm">
              <div className="space-y-2">
                <div>(1) Public School (Pampublikong Paaralan)</div>
                <div>(2) Private School (Pribadong Paaralan)</div>
                <div>(3) Vocational/Technical School (Bokasyonal/Teknikal na Paaralan)</div>
                <div>(4) Others (specify) (Iba pa (ilagay))</div>
              </div>
            </div>
          </div>

          {/* Livelihood Characteristics Section */}
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">KATANGIANG PANGKABUHAYAN (LIVELIHOOD CHARACTERISTICS)</h2>
                <p className="text-sm text-gray-600 mt-1">Configuration of Family Members Information (Pls. Follow the sequence of members on the previous table)</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {/* Livelihood Characteristics Table */}
              <div className="overflow-x-auto -mx-4 px-4" style={{ maxWidth: '100%' }}>
                <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
                  <table className="min-w-[3000px] divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      {/* First header row */}
                      <tr>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300 w-12">#</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Name</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Main Source of Income</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Status of Work</th>
                        <th colSpan={4} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">KUNG OO (IF YES)</th>
                        <th colSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">KUNG HIND (IF NO)</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300 bg-blue-50">Kelanhuling nagkaroon ng trabaho</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Work status of ≥15yrs old and unemployed</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Write "Y" if OFW</th>
                        <th rowSpan={3} className="px-2 py-2 text-center font-semibold text-gray-700">Migration Status</th>
                      </tr>
                      {/* Second header row */}
                      <tr>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Magkani ang tinatayang buwanang kita (TIGNAN ANG KODIGO SA IBABA)</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Other source of income (ITALA)</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Saan karaniwa ng ginagasto sang kita?</th>
                        <th colSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Mayroon bang naipon o investment</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Dahilan kung bakit hindi nag trabaho</th>
                        <th rowSpan={2} className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Saan panguna hing umaasa</th>
                      </tr>
                      {/* Third header row */}
                      <tr>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Oo</th>
                        <th className="px-2 py-2 text-center font-semibold text-gray-700 border-r border-gray-300">Hindi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
                        <tr key={index}>
                          <td className="px-2 py-2 text-center border-r border-gray-300 font-semibold">{index + 1}</td>
                          {/* Name */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_name`}
                              value={formData.livelihoodMembers[index]?.name || ''}
                              onChange={handleInputChange}
                              placeholder="Name"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Main Source of Income */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_mainSourceOfIncome`}
                              value={formData.livelihoodMembers[index]?.mainSourceOfIncome || ''}
                              onChange={handleInputChange}
                              placeholder="Main Source"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Status of Work */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_statusOfWork`}
                              value={formData.livelihoodMembers[index]?.statusOfWork || ''}
                              onChange={handleInputChange}
                              placeholder="Status"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* KUNG OO - Monthly Income */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_monthlyIncome`}
                              value={formData.livelihoodMembers[index]?.monthlyIncome || ''}
                              onChange={handleInputChange}
                              placeholder="Code"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* KUNG OO - Other source of income */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_otherSourceOfIncome`}
                              value={formData.livelihoodMembers[index]?.otherSourceOfIncome || ''}
                              onChange={handleInputChange}
                              placeholder="List"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* KUNG OO - Where income is spent */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_whereIncomeSpent`}
                              value={formData.livelihoodMembers[index]?.whereIncomeSpent || ''}
                              onChange={handleInputChange}
                              placeholder="Where spent"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* KUNG OO - Savings/Investment - Yes */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`livelihood${index}_hasSavingsInvestment`} value="Yes" checked={formData.livelihoodMembers[index]?.hasSavingsInvestment === 'Yes'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* KUNG OO - Savings/Investment - No */}
                          <td className="px-2 py-2 text-center border-r border-gray-300">
                            <input type="radio" name={`livelihood${index}_hasSavingsInvestment`} value="No" checked={formData.livelihoodMembers[index]?.hasSavingsInvestment === 'No'} onChange={handleInputChange} className="w-4 h-4" />
                          </td>
                          {/* KUNG HIND - Reason for not working */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_reasonNotWorking`}
                              value={formData.livelihoodMembers[index]?.reasonNotWorking || ''}
                              onChange={handleInputChange}
                              placeholder="Reason"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* KUNG HIND - Who they depend on */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_dependsOn`}
                              value={formData.livelihoodMembers[index]?.dependsOn || ''}
                              onChange={handleInputChange}
                              placeholder="Depends on"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Kelanhuling nagkaroon ng trabaho */}
                          <td className="px-2 py-2 border-r border-gray-300 bg-blue-50">
                            <input
                              type="text"
                              name={`livelihood${index}_lastJobDate`}
                              value={formData.livelihoodMembers[index]?.lastJobDate || ''}
                              onChange={handleInputChange}
                              placeholder="When last had job"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Work status of ≥15yrs old and unemployed */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_workStatus15PlusUnemployed`}
                              value={formData.livelihoodMembers[index]?.workStatus15PlusUnemployed || ''}
                              onChange={handleInputChange}
                              placeholder="Status"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Write "Y" if OFW */}
                          <td className="px-2 py-2 border-r border-gray-300">
                            <input
                              type="text"
                              name={`livelihood${index}_isOFW`}
                              value={formData.livelihoodMembers[index]?.isOFW || ''}
                              onChange={handleInputChange}
                              placeholder="Y if OFW"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                          {/* Migration Status */}
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              name={`livelihood${index}_migrationStatus`}
                              value={formData.livelihoodMembers[index]?.migrationStatus || ''}
                              onChange={handleInputChange}
                              placeholder="Y if OFW"
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded text-gray-900"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Footer note */}
              <div className="text-center text-xs text-gray-600 italic">
                Configuration of Family Members Information (Pls. Follow the sequence of members on the previous table)
              </div>
            </div>
          </div>
          </>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
            <Link
              href="/households"
              className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
            >
              Cancel
            </Link>
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setCurrentStep(currentStep + 1)
                }}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Household
                  </>
                )}
              </button>
            )}
            </div>
          </div>
        </form>
      </div>
    </Layout>
  )
}



