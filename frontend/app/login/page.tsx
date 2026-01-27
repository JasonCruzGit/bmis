'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, Shield, Building2, Users, FileText, Activity, Sparkles, Bell, MessageSquare, Lock as LockIcon, Zap, CheckCircle2, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [logoError, setLogoError] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔐 Attempting login with:', { email })
      const { data } = await api.post('/auth/login', { email, password })
      console.log('✅ Login successful:', data)
      setAuth(data.user, data.token)
      toast.success('Login successful')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('❌ Login error:', error)
      console.error('❌ Error response:', error.response)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10 bg-gradient-to-br from-gray-50 via-white to-primary-50/30 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #1e40af 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-5"></div>

        {/* Geometric Shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 border-2 border-primary-200 rounded-full opacity-20"></div>
        <div className="absolute bottom-32 left-32 w-24 h-24 border-2 border-primary-300 rounded-full opacity-15"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-primary-200 rounded-lg rotate-45 opacity-10"></div>

        <div className="relative mx-auto w-full max-w-md z-10">
          {/* Logo and Header */}
          <div className="mb-10">
            <div className="flex items-center mb-8">
              <div className="relative">
                <div className="relative w-16 h-16 bg-white rounded-lg shadow-lg border-2 border-primary-200 p-2 flex items-center justify-center">
                  {logoError ? (
                    <Building2 className="h-10 w-10 text-primary-600" />
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
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  BIS
                </h1>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mt-0.5">Barangay Management Information System</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <h2 className="text-3xl font-semibold text-gray-900 leading-tight">
                Welcome back
              </h2>
              <p className="text-sm text-gray-600">
                Sign in to access your administrative dashboard
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'email' ? 'text-primary-600' : 'text-gray-400'}`} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-200"
                  placeholder="admin@barangay.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 transition-colors duration-200 ${focusedField === 'password' ? 'text-primary-600' : 'text-gray-400'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="block w-full pl-10 pr-10 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900 placeholder-gray-400 bg-white shadow-sm transition-all duration-200"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  Forgot password?
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 hover:shadow-xl hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Sign in
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Visual/Branding with Floating Cards */}
      <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900">
          {/* Geometric Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 border-2 border-white rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 border-2 border-white rounded-full -ml-48 -mb-48"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full"></div>
          </div>

          <div className="flex flex-col justify-center items-start h-full px-12 text-white relative z-10">
            <div className="max-w-lg">
              {/* Secure Portal Badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 w-fit mb-8">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Secure Portal</span>
              </div>
              
              {/* Title */}
              <div className="space-y-6 mb-8">
                <h2 className="text-6xl lg:text-7xl xl:text-8xl font-bold leading-tight tracking-tight">
                  Barangay Management
                  <span className="block text-primary-300">Information System</span>
                </h2>
                <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed font-light max-w-lg">
                  Comprehensive management solution for modern barangay administration
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 mb-12">
                <div className="flex items-center gap-2">
                  <LockIcon className="h-5 w-5 text-primary-300" />
                  <span className="text-sm text-gray-300">Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary-300" />
                  <span className="text-sm text-gray-300">Fast</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary-300" />
                  <span className="text-sm text-gray-300">Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


