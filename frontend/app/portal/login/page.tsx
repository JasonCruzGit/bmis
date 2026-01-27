'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Calendar, Phone, LogIn, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import portalApi from '@/lib/portal-api'

export default function PortalLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [usePassword, setUsePassword] = useState(true) // Default to password mode
  const [logoError, setLogoError] = useState(false)
  const [formData, setFormData] = useState({
    contactNo: '',
    password: '',
    dateOfBirth: '',
  })

  // Check localStorage for login mode preference
  useEffect(() => {
    const savedMode = localStorage.getItem('portal_login_mode')
    if (savedMode === 'dob') {
      setUsePassword(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
      const loginData = {
        contactNo: formData.contactNo,
        ...(usePassword ? { password: formData.password } : { dateOfBirth: formData.dateOfBirth }),
      }

      const response = await fetch(`${apiUrl}/portal/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      // Debug logging
      console.log('Login response:', data)
      console.log('requiresPasswordSetup:', data.requiresPasswordSetup)

      if (!response.ok) {
        // If password is required but not provided, switch to password mode
        if (data.requiresPassword && !usePassword) {
          setUsePassword(true)
          toast.error('Please use your password to login')
          setLoading(false)
          return
        }
        // If date of birth is required, switch to date of birth mode
        if (data.message?.includes('Date of birth') || data.message?.includes('first-time')) {
          setUsePassword(false)
          localStorage.setItem('portal_login_mode', 'dob')
          toast.error(data.message || 'Please use your date of birth for first-time login')
          setLoading(false)
          return
        }
        throw new Error(data.message || 'Login failed')
      }

      // Store token and resident info
      localStorage.setItem('portal_token', data.token)
      localStorage.setItem('residentToken', data.token) // Also store as residentToken for compatibility
      localStorage.setItem('portal_resident', JSON.stringify(data.resident))
      localStorage.setItem('resident', JSON.stringify(data.resident)) // Also store as resident for compatibility

      // If password setup is required, show modal
      console.log('Checking requiresPasswordSetup:', data.requiresPasswordSetup, typeof data.requiresPasswordSetup)
      
      // Check if password setup is needed (handle both true and "true" string)
      const needsPasswordSetup = data.requiresPasswordSetup === true || data.requiresPasswordSetup === 'true'
      
      if (needsPasswordSetup) {
        console.log('Showing password setup modal')
        setLoading(false)
        // Use setTimeout to ensure state update happens before modal renders
        setTimeout(() => {
          setShowPasswordSetup(true)
        }, 100)
        return
      }

      // Save login mode preference
      if (usePassword) {
        localStorage.setItem('portal_login_mode', 'password')
      }

      toast.success('Login successful!')
      router.push('/portal/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [settingPassword, setSettingPassword] = useState(false)

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.password !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setSettingPassword(true)

    try {
      await portalApi.put('/password', {
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword,
      })

      toast.success('Password set successfully!')
      setShowPasswordSetup(false)
      // Update login mode preference
      localStorage.setItem('portal_login_mode', 'password')
      setUsePassword(true)
      router.push('/portal/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set password')
    } finally {
      setSettingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #1e40af 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative max-w-md w-full">
        {/* Hero Header Section */}
        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 rounded-t-2xl overflow-hidden mb-0">
          {/* Geometric Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 border-2 border-white rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 border border-white rounded-full -ml-24 -mb-24"></div>
          </div>

          <div className="relative px-8 py-10 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl border-2 border-white/30 mb-6 shadow-lg">
              {logoError ? (
                <LogIn className="h-8 w-8 text-primary-600" />
              ) : (
                <Image
                  src="/logo.png"
                  alt="El Nido Municipality Seal"
                  width={48}
                  height={48}
                  className="object-contain"
                  priority
                  onError={() => setLogoError(true)}
                />
              )}
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Resident Portal</h1>
            <p className="text-lg text-gray-300 font-light">Access your documents and services</p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-b-2xl shadow-2xl border-2 border-gray-100 border-t-0 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Contact Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  placeholder="09XX XXX XXXX"
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                />
              </div>
            </div>

            {usePassword ? (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  First time?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setUsePassword(false)
                      setFormData({ ...formData, password: '' })
                    }}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    Use date of birth instead
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                  />
                </div>
                <p className="mt-3 text-xs text-gray-600">
                  Have a password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setUsePassword(true)
                      setFormData({ ...formData, dateOfBirth: '' })
                    }}
                    className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                  >
                    Use password instead
                  </button>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:hover:scale-100"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-gray-100 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Need help? Contact the barangay office.
            </p>
          </div>
        </div>
      </div>

      {/* Password Setup Modal */}
      {showPasswordSetup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8 max-w-md w-full">
            {/* Modal Header */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 rounded-xl overflow-hidden mb-6 -mt-8 -mx-8">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 border border-white rounded-full -mr-16 -mt-16"></div>
              </div>
              <div className="relative px-8 py-6 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 mb-4">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Set Your Password</h2>
                <p className="text-gray-300 text-sm">
                  For security, please set a password for your account
                </p>
              </div>
            </div>

            <form onSubmit={handleSetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordData.password}
                    onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                    placeholder="Enter password (min. 6 characters)"
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 font-medium transition-all duration-200 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPasswordConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordSetup(false)
                    router.push('/portal/dashboard')
                  }}
                  className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={settingPassword}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200 font-bold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] disabled:hover:scale-100"
                >
                  {settingPassword ? 'Setting...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

