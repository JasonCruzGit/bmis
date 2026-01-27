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
  Eye, 
  Filter,
  Download,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  FolderKanban,
  User,
  FileText,
  Image as ImageIcon,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Shield } from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: projectsData, isLoading } = useQuery(
    ['projects', page, searchQuery, statusFilter],
    async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      const { data } = await api.get(`/projects?${params}`)
      return data
    }
  )

  const { data: stats } = useQuery('projects-stats', async () => {
    const [all, planning, ongoing, completed] = await Promise.all([
      api.get('/projects?limit=1'),
      api.get('/projects?status=PLANNING&limit=1'),
      api.get('/projects?status=ONGOING&limit=1'),
      api.get('/projects?status=COMPLETED&limit=1'),
    ])
    return {
      total: all.data.pagination?.total || 0,
      planning: planning.data.pagination?.total || 0,
      ongoing: ongoing.data.pagination?.total || 0,
      completed: completed.data.pagination?.total || 0,
    }
  })

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: string }) => api.patch(`/projects/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('projects')
        toast.success('Project status updated successfully')
      },
      onError: () => {
        toast.error('Failed to update project status')
      },
    }
  )

  const handleViewProject = (project: any) => {
    setSelectedProject(project)
    setShowViewModal(true)
  }

  const handleStatusChange = (projectId: string, newStatus: string) => {
    updateStatusMutation.mutate({ id: projectId, status: newStatus })
  }

  const projects = projectsData?.projects || []
  const pagination = projectsData?.pagination

  useEffect(() => {
    if (hydrated && !useAuthStore.getState().user) {
      window.location.href = '/login'
    }
  }, [hydrated])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-yellow-100 text-yellow-800',
      ONGOING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  useEffect(() => {
    if (hydrated && user?.role === 'BARANGAY_EVALUATOR') {
      router.push('/dashboard')
    }
  }, [hydrated, user, router])

  if (!hydrated) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      </Layout>
    )
  }

  if (user?.role === 'BARANGAY_EVALUATOR') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You do not have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-2xl shadow-lg p-6 sm:p-8 border border-primary-500/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center">
                <FolderKanban className="h-8 w-8 text-gray-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">Projects & Programs</h1>
                <p className="text-white/90 text-sm sm:text-base">Manage barangay projects and programs</p>
              </div>
            </div>
            <Link
              href="/projects/new"
              className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-colors shadow-md font-semibold whitespace-nowrap"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Planning</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.planning || 0}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ongoing</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.ongoing || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.completed || 0}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <FolderKanban className="h-6 w-6 text-green-600" />
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
                placeholder="Search by project title, contractor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                  showFilters || statusFilter
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
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 border-l border-gray-300 ${
                    viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
              </div>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value)
                      setPage(1)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Status</option>
                    <option value="PLANNING">Planning</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('')
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

        {/* Projects List/Grid */}
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length > 0 ? (
          viewMode === 'list' ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Project Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Contractor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Timeline
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
                    {projects.map((project: any) => (
                      <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {project.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {project.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                            ₱{Number(project.budget).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {project.contractor || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                              {format(new Date(project.startDate), 'MMM d, yyyy')}
                            </div>
                            {project.endDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                to {format(new Date(project.endDate), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={project.status}
                            onChange={(e) => handleStatusChange(project.id, e.target.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(project.status)}`}
                          >
                            <option value="PLANNING">Planning</option>
                            <option value="ONGOING">Ongoing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewProject(project)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/projects/${project.id}/edit`}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
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
              {projects.map((project: any) => (
                <div
                  key={project.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">
                          {project.title}
                        </h3>
                        <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </div>
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <FolderKanban className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        Budget: ₱{Number(project.budget).toLocaleString()}
                      </div>
                      {project.contractor && (
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {project.contractor}
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {format(new Date(project.startDate), 'MMM d, yyyy')}
                        {project.endDate && ` - ${format(new Date(project.endDate), 'MMM d, yyyy')}`}
                      </div>
                      {project.progressPhotos && project.progressPhotos.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <ImageIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {project.progressPhotos.length} photo(s)
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleViewProject(project)}
                        className="flex-1 px-3 py-2 text-sm text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                      >
                        <Eye className="h-4 w-4 inline mr-1" />
                        View
                      </button>
                      <Link
                        href={`/projects/${project.id}/edit`}
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
            <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try adjusting your search criteria' : 'Get started by creating your first project'}
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Project
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
              of <span className="font-medium">{pagination.total}</span> projects
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
        {showViewModal && selectedProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {selectedProject.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created on {format(new Date(selectedProject.createdAt), 'MMMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`px-4 py-2 text-sm font-medium rounded-full ${getStatusColor(selectedProject.status)}`}>
                      {getStatusLabel(selectedProject.status)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Project Information</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Description</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedProject.description}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Budget</p>
                        <p className="text-sm font-medium text-gray-900">
                          ₱{Number(selectedProject.budget).toLocaleString()}
                        </p>
                      </div>
                      {selectedProject.contractor && (
                        <div>
                          <p className="text-xs text-gray-500">Contractor</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedProject.contractor}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Start Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(selectedProject.startDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      {selectedProject.endDate && (
                        <div>
                          <p className="text-xs text-gray-500">End Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {format(new Date(selectedProject.endDate), 'MMMM d, yyyy')}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <select
                          value={selectedProject.status}
                          onChange={(e) => {
                            handleStatusChange(selectedProject.id, e.target.value)
                            setSelectedProject({ ...selectedProject, status: e.target.value })
                          }}
                          className={`mt-1 px-3 py-1 text-sm font-medium rounded-full border-0 focus:ring-2 focus:ring-primary-500 ${getStatusColor(selectedProject.status)}`}
                        >
                          <option value="PLANNING">Planning</option>
                          <option value="ONGOING">Ongoing</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {selectedProject.progressPhotos && selectedProject.progressPhotos.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Progress Photos</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedProject.progressPhotos.map((photo: string, index: number) => (
                        <div key={index} className="relative">
                          <img
                            src={photo}
                            alt={`Progress ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProject.documents && selectedProject.documents.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Documents</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedProject.documents.map((doc: string, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <a
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-700 truncate block text-center"
                          >
                            Document {index + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                  <Link
                    href={`/projects/${selectedProject.id}/edit`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center transition-colors"
                  >
                    Edit Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

