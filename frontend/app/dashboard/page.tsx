'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import { useQuery } from 'react-query'
import api from '@/lib/api'
import { 
  Users, 
  FileText, 
  AlertCircle, 
  Package, 
  Home,
  TrendingUp,
  ArrowRight,
  Calendar,
  Clock,
  Bell,
  Activity,
  Plus,
  Building2,
  X,
  Eye,
  MapPin
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { format, differenceInYears } from 'date-fns'

export default function DashboardPage() {
  const router = useRouter()
  const { user, hydrated } = useAuthStore()
  const [currentDate, setCurrentDate] = useState<string>('')
  const [currentTime, setCurrentTime] = useState<string>('')
  const [showResidentsBreakdown, setShowResidentsBreakdown] = useState(false)

  useEffect(() => {
    if (hydrated && !user) {
      router.push('/login')
    }
    if (typeof window !== 'undefined') {
      const updateDateTime = () => {
        const now = new Date()
        setCurrentDate(format(now, 'EEEE, MMMM d, yyyy'))
        setCurrentTime(format(now, 'hh:mm:ss a'))
      }
      
      // Update immediately
      updateDateTime()
      
      // Update every second
      const interval = setInterval(updateDateTime, 1000)
      
      return () => clearInterval(interval)
    }
  }, [user, router, hydrated])

  const { data: stats, isLoading: statsLoading } = useQuery('dashboard-stats', async () => {
    const [residents, households, documents, incidents, inventory] = await Promise.all([
      api.get('/residents?limit=10000'),
      api.get('/households?limit=1'),
      api.get('/documents?limit=1'),
      api.get('/incidents?limit=1'),
      api.get('/inventory?limit=1'),
    ])
    const residentList = residents.data?.residents || []

    const getAge = (dateOfBirth: string) => {
      try {
        return differenceInYears(new Date(), new Date(dateOfBirth))
      } catch {
        return 0
      }
    }

    const teenagerCount = residentList.filter((resident: any) => {
      const age = getAge(resident.dateOfBirth)
      return age >= 13 && age <= 19
    }).length

    const youthCount = residentList.filter((resident: any) => {
      const age = getAge(resident.dateOfBirth)
      return age >= 15 && age <= 30
    }).length

    const pwdCount = residentList.filter((resident: any) => resident.isPWD).length

    return {
      residents: residents.data.pagination?.total || 0,
      households: households.data.pagination?.total || 0,
      documents: documents.data.pagination?.total || 0,
      incidents: incidents.data.pagination?.total || 0,
      inventory: inventory.data.pagination?.total || 0,
      teenagers: teenagerCount,
      youth: youthCount,
      pwd: pwdCount,
    }
  })

  // Fetch residents breakdown by barangay
  const { data: residentsBreakdown, isLoading: breakdownLoading } = useQuery(
    'residents-breakdown',
    async () => {
      try {
        const { data } = await api.get('/residents?limit=10000')
        const residents = data?.residents || []
        
        // Define all barangays
        const barangays = [
          'Bagong Bayan', 'Buena Suerte', 'Barotuan', 'Bebeladan', 'Corong-corong',
          'Mabini', 'Manlag', 'Masagana', 'New Ibajay', 'Pasadeña', 'Maligaya',
          'San Fernando', 'Sibaltan', 'Teneguiban', 'Villa Libertad', 'Villa Paz',
          'Bucana', 'Aberawan'
        ]
        
        // Helper function to calculate age
        const getAge = (dateOfBirth: string) => {
          try {
            return differenceInYears(new Date(), new Date(dateOfBirth))
          } catch {
            return 0
          }
        }
        
        // Helper function to check if resident is youth (15-30 years old)
        const isYouth = (resident: any) => {
          const age = getAge(resident.dateOfBirth)
          return age >= 15 && age <= 30
        }
        
        // Group residents by barangay
        const breakdown = barangays.map(barangay => {
          const barangayResidents = residents.filter((r: any) => r.barangay === barangay)
          const count = barangayResidents.length
          const maleCount = barangayResidents.filter((r: any) => r.sex === 'MALE').length
          const femaleCount = barangayResidents.filter((r: any) => r.sex === 'FEMALE').length
          const pwdCount = barangayResidents.filter((r: any) => r.isPWD).length
          const youthCount = barangayResidents.filter((r: any) => isYouth(r)).length
          
          return {
            barangay,
            count,
            maleCount,
            femaleCount,
            pwdCount,
            youthCount,
            percentage: residents.length > 0 ? ((count / residents.length) * 100).toFixed(1) : '0'
          }
        }).sort((a, b) => b.count - a.count)
        
        // Add unassigned residents
        const unassignedResidents = residents.filter((r: any) => !r.barangay)
        const unassignedCount = unassignedResidents.length
        if (unassignedCount > 0) {
          breakdown.push({
            barangay: 'Unassigned',
            count: unassignedCount,
            maleCount: unassignedResidents.filter((r: any) => r.sex === 'MALE').length,
            femaleCount: unassignedResidents.filter((r: any) => r.sex === 'FEMALE').length,
            pwdCount: unassignedResidents.filter((r: any) => r.isPWD).length,
            youthCount: unassignedResidents.filter((r: any) => isYouth(r)).length,
            percentage: residents.length > 0 ? ((unassignedCount / residents.length) * 100).toFixed(1) : '0'
          })
        }
        
        return {
          breakdown,
          total: residents.length,
          totalMale: residents.filter((r: any) => r.sex === 'MALE').length,
          totalFemale: residents.filter((r: any) => r.sex === 'FEMALE').length,
          totalPWD: residents.filter((r: any) => r.isPWD).length,
          totalYouth: residents.filter((r: any) => isYouth(r)).length
        }
      } catch (error) {
        console.error('Error fetching residents breakdown:', error)
        return {
          breakdown: [],
          total: 0,
          totalMale: 0,
          totalFemale: 0,
          totalPWD: 0,
          totalYouth: 0
        }
      }
    },
    { enabled: showResidentsBreakdown } // Only fetch when modal is open
  )

  // Fetch historical data for charts
  const { data: chartData, isLoading: chartLoading } = useQuery(
    'dashboard-chart-data',
    async () => {
      try {
        // Get current date and calculate last 6 months
        const now = new Date()
        const months: { name: string; date: Date }[] = []
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({
            name: monthNames[date.getMonth()],
            date: date
          })
        }

        // Fetch all data
        const [residentsRes, documentsRes, incidentsRes] = await Promise.all([
          api.get('/residents?limit=10000'),
          api.get('/documents?limit=10000'),
          api.get('/incidents?limit=10000'),
        ])

        const residents = residentsRes.data?.residents || []
        const documents = documentsRes.data?.documents || []
        const incidents = incidentsRes.data?.incidents || []

        // Process data by month
        const processedData = months.map((month, index) => {
          const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1)
          const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0, 23, 59, 59)

          // Count residents created in this month
          const residentsCount = residents.filter((r: any) => {
            const createdAt = new Date(r.createdAt)
            return createdAt >= monthStart && createdAt <= monthEnd
          }).length

          // Count documents issued in this month (use issuedDate if available, else createdAt)
          const documentsCount = documents.filter((d: any) => {
            const date = d.issuedDate ? new Date(d.issuedDate) : new Date(d.createdAt)
            return date >= monthStart && date <= monthEnd
          }).length

          // Count incidents created in this month (use incidentDate if available, else createdAt)
          const incidentsCount = incidents.filter((i: any) => {
            const date = i.incidentDate ? new Date(i.incidentDate) : new Date(i.createdAt)
            return date >= monthStart && date <= monthEnd
          }).length

          return {
            name: month.name,
            residents: residentsCount,
            documents: documentsCount,
            incidents: incidentsCount,
          }
        })

        return processedData
      } catch (error) {
        console.error('Error fetching chart data:', error)
        // Return empty data structure on error
        return [
          { name: 'Jan', residents: 0, documents: 0, incidents: 0 },
          { name: 'Feb', residents: 0, documents: 0, incidents: 0 },
          { name: 'Mar', residents: 0, documents: 0, incidents: 0 },
          { name: 'Apr', residents: 0, documents: 0, incidents: 0 },
          { name: 'May', residents: 0, documents: 0, incidents: 0 },
          { name: 'Jun', residents: 0, documents: 0, incidents: 0 },
        ]
      }
    }
  )

  const pieData = [
    { name: 'Residents', value: stats?.residents || 0, color: '#3b82f6' },
    { name: 'Households', value: stats?.households || 0, color: '#10b981' },
    { name: 'Documents', value: stats?.documents || 0, color: '#f59e0b' },
    { name: 'Incidents', value: stats?.incidents || 0, color: '#ef4444' },
  ]

  const allStatCards = [
    { 
      label: 'Total Residents', 
      value: stats?.residents || 0, 
      icon: Users, 
      gradient: 'from-primary-500 via-primary-600 to-primary-700',
      bgGradient: 'from-primary-50 to-primary-100',
      iconBg: 'bg-primary-500',
      iconColor: 'text-white',
      link: '/residents',
      trend: '+12%',
      trendColor: 'text-green-600',
      hasBreakdown: true
    },
    { 
      label: 'Households', 
      value: stats?.households || 0, 
      icon: Home, 
      gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
      bgGradient: 'from-emerald-50 to-emerald-100',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      link: '/households',
      trend: '+8%',
      trendColor: 'text-green-600'
    },
    { 
      label: 'Documents Issued', 
      value: stats?.documents || 0, 
      icon: FileText, 
      gradient: 'from-amber-500 via-amber-600 to-amber-700',
      bgGradient: 'from-amber-50 to-amber-100',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      link: '/documents',
      trend: '+15%',
      trendColor: 'text-green-600',
      evaluatorRestricted: true
    },
    { 
      label: 'Active Incidents', 
      value: stats?.incidents || 0, 
      icon: AlertCircle, 
      gradient: 'from-rose-500 via-rose-600 to-rose-700',
      bgGradient: 'from-rose-50 to-rose-100',
      iconBg: 'bg-rose-500',
      iconColor: 'text-white',
      link: '/incidents',
      trend: '-5%',
      trendColor: 'text-green-600',
      evaluatorRestricted: true
    },
    { 
      label: 'Inventory Items', 
      value: stats?.inventory || 0, 
      icon: Package, 
      gradient: 'from-indigo-500 via-indigo-600 to-indigo-700',
      bgGradient: 'from-indigo-50 to-indigo-100',
      iconBg: 'bg-indigo-500',
      iconColor: 'text-white',
      link: '/inventory',
      trend: '+3%',
      trendColor: 'text-green-600',
      evaluatorRestricted: true
    },
  ]

  if (!hydrated || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    )
  }

  // Filter stat cards based on user role
  const statCards = user.role === 'BARANGAY_EVALUATOR' 
    ? allStatCards.filter(card => !card.evaluatorRestricted)
    : allStatCards

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-primary-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <Activity className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Dashboard</h1>
                  <p className="text-white/90 text-sm sm:text-base">
                    Welcome back, <span className="font-semibold">{user.firstName} {user.lastName}</span>
                  </p>
                </div>
              </div>
              
              {currentDate && (
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{currentDate}</span>
                  </div>
                  {currentTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono font-semibold">{currentTime}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            const isResidentsCard = stat.hasBreakdown
            
            if (isResidentsCard) {
              return (
                <div key={stat.label} className="relative">
                  <button
                    onClick={() => setShowResidentsBreakdown(true)}
                    className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-300 w-full text-left cursor-pointer"
                  >
                    <div className="relative p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{stat.label}</p>
                          {statsLoading ? (
                            <div className="h-12 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                          ) : (
                            <p className="text-4xl font-bold text-gray-900 mb-4">{stat.value.toLocaleString()}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs">
                              <TrendingUp className={`h-3.5 w-3.5 mr-1.5 ${stat.trendColor}`} />
                              <span className={`font-semibold ${stat.trendColor}`}>{stat.trend}</span>
                              <span className="ml-1.5 text-gray-500">vs last month</span>
                            </div>
                            <span className="text-xs font-semibold text-primary-600 flex items-center">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View Breakdown
                            </span>
                          </div>
                        </div>
                        <div className={`${stat.iconBg} p-3.5 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </div>
                    
                    {/* Bottom accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${stat.gradient} group-hover:h-1.5 transition-all duration-300`} />
                  </button>
                  <Link
                    href={stat.link}
                    className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white shadow-md"
                    title="Go to Residents page"
                  >
                    <ArrowRight className="h-4 w-4 text-primary-600" />
                  </Link>
                </div>
              )
            }
            
            return (
              <Link
                key={stat.label}
                href={stat.link}
                className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-300"
              >
                <div className="relative p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{stat.label}</p>
                      {statsLoading ? (
                        <div className="h-12 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                      ) : (
                        <p className="text-4xl font-bold text-gray-900 mb-4">{stat.value.toLocaleString()}</p>
                      )}
                      <div className="flex items-center text-xs">
                        <TrendingUp className={`h-3.5 w-3.5 mr-1.5 ${stat.trendColor}`} />
                        <span className={`font-semibold ${stat.trendColor}`}>{stat.trend}</span>
                        <span className="ml-1.5 text-gray-500">vs last month</span>
                      </div>
                    </div>
                    <div className={`${stat.iconBg} p-3.5 rounded-xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </div>
                
                {/* Bottom accent bar */}
                <div className={`h-1 bg-gradient-to-r ${stat.gradient} group-hover:h-1.5 transition-all duration-300`} />
              </Link>
            )
          })}
        </div>

        {/* Resident Demographics Summary */}
        <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-primary-300">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resident Demographics</h2>
              <Link href="/residents" className="text-xs font-semibold text-primary-600 flex items-center">
                View Residents
                <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link href="/residents?teenager=true" className="rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 hover:bg-cyan-100 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Teenagers</p>
                <p className="mt-1 text-2xl font-bold text-cyan-900">{(stats?.teenagers || 0).toLocaleString()}</p>
                <p className="text-xs text-cyan-700 mt-1">Age 13-19</p>
              </Link>
              <Link href="/residents?youth=true" className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 hover:bg-violet-100 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Youth</p>
                <p className="mt-1 text-2xl font-bold text-violet-900">{(stats?.youth || 0).toLocaleString()}</p>
                <p className="text-xs text-violet-700 mt-1">Age 15-30</p>
              </Link>
              <Link href="/residents?isPWD=true" className="rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-3 hover:bg-fuchsia-100 transition-colors">
                <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700">PWD</p>
                <p className="mt-1 text-2xl font-bold text-fuchsia-900">{(stats?.pwd || 0).toLocaleString()}</p>
                <p className="text-xs text-fuchsia-700 mt-1">Based on resident details</p>
              </Link>
            </div>
          </div>
          <div className="h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-fuchsia-500" />
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center mb-1">
                  <div className="p-2 bg-primary-100 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-primary-600" />
                  </div>
                  Activity Overview
                </h2>
                <p className="text-xs text-gray-500 ml-12">Last 6 months</p>
              </div>
            </div>
            {chartLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-200 border-t-primary-600 mx-auto mb-3"></div>
                  <p className="text-sm text-gray-600">Loading chart data...</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#6b7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6b7280' }}
                  />
                  <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '10px'
                  }}
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="residents" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="documents" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="incidents" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Distribution Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center mb-1">
                  <div className="p-2 bg-primary-100 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-primary-600" />
                  </div>
                  Data Distribution
                </h2>
                <p className="text-xs text-gray-500 ml-12">Current statistics</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <Activity className="h-5 w-5 text-primary-600" />
            </div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {user?.role !== 'BARANGAY_EVALUATOR' && (
              <>
                <Link
                  href="/documents/new"
                  className="flex flex-col items-center p-5 bg-amber-50 rounded-lg hover:bg-amber-100 border-2 border-amber-200 hover:border-amber-300 transition-all duration-200 group"
                >
                  <div className="p-2.5 bg-amber-500 rounded-lg mb-2.5 group-hover:scale-105 transition-transform duration-300">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-amber-700 text-center">Issue Document</span>
                </Link>
                <Link
                  href="/incidents/new"
                  className="flex flex-col items-center p-5 bg-rose-50 rounded-lg hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-300 transition-all duration-200 group"
                >
                  <div className="p-2.5 bg-rose-500 rounded-lg mb-2.5 group-hover:scale-105 transition-transform duration-300">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-rose-700 text-center">Report Incident</span>
                </Link>
                <Link
                  href="/announcements/new"
                  className="flex flex-col items-center p-5 bg-purple-50 rounded-lg hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-300 transition-all duration-200 group"
                >
                  <div className="p-2.5 bg-purple-500 rounded-lg mb-2.5 group-hover:scale-105 transition-transform duration-300">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 group-hover:text-purple-700 text-center">New Announcement</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Residents Breakdown Modal */}
        {showResidentsBreakdown && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Residents Breakdown by Barangay</h2>
                    <p className="text-primary-100 text-sm mt-1">Detailed distribution across all barangays</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResidentsBreakdown(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {breakdownLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading breakdown data...</p>
                    </div>
                  </div>
                ) : residentsBreakdown ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-blue-600 uppercase">Total Residents</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{residentsBreakdown.total.toLocaleString()}</p>
                          </div>
                          <Users className="h-8 w-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-green-600 uppercase">Male</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{residentsBreakdown.totalMale.toLocaleString()}</p>
                          </div>
                          <Users className="h-8 w-8 text-green-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-pink-600 uppercase">Female</p>
                            <p className="text-2xl font-bold text-pink-900 mt-1">{residentsBreakdown.totalFemale.toLocaleString()}</p>
                          </div>
                          <Users className="h-8 w-8 text-pink-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-purple-600 uppercase">PWD</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">{residentsBreakdown.totalPWD.toLocaleString()}</p>
                          </div>
                          <Users className="h-8 w-8 text-purple-500" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-orange-600 uppercase">Youth</p>
                            <p className="text-2xl font-bold text-orange-900 mt-1">{residentsBreakdown.totalYouth.toLocaleString()}</p>
                          </div>
                          <Users className="h-8 w-8 text-orange-500" />
                        </div>
                      </div>
                    </div>

                    {/* Barangay Breakdown Table */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Barangay
                                </div>
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Total
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Male
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Female
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                PWD
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Youth
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Percentage
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {residentsBreakdown.breakdown.map((item: any, index: number) => (
                              <tr key={item.barangay} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                                      item.barangay === 'Unassigned' ? 'bg-gray-400' : 'bg-primary-500'
                                    }`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">{item.barangay}</p>
                                      {item.count > 0 && (
                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                          <div
                                            className="bg-primary-600 h-1.5 rounded-full"
                                            style={{ width: `${item.percentage}%` }}
                                          ></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                    {item.count.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {item.maleCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                    {item.femaleCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {item.pwdCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {item.youthCount.toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">{item.percentage}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <Link
                                    href={`/residents?barangay=${encodeURIComponent(item.barangay)}`}
                                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Chart Visualization */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
                        Distribution Chart
                      </h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={residentsBreakdown.breakdown.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis 
                            dataKey="barangay" 
                            stroke="#6b7280" 
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            }}
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Total Residents" />
                          <Bar dataKey="maleCount" fill="#10b981" radius={[6, 6, 0, 0]} name="Male" />
                          <Bar dataKey="femaleCount" fill="#ec4899" radius={[6, 6, 0, 0]} name="Female" />
                          <Bar dataKey="youthCount" fill="#f97316" radius={[6, 6, 0, 0]} name="Youth" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No breakdown data available.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing data for {residentsBreakdown?.breakdown.length || 0} barangays
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/residents"
                    className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    View All Residents
                  </Link>
                  <button
                    onClick={() => setShowResidentsBreakdown(false)}
                    className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
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

