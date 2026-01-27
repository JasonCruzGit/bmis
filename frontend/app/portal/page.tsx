'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, MessageSquare, Bell, LogIn, ArrowRight, Shield, Clock, Download, CreditCard, CheckCircle2, Lock, Zap } from 'lucide-react'

export default function PortalLandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if already logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      if (token) {
        router.push('/portal/dashboard')
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Split Layout */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 overflow-hidden">
        {/* Geometric Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 border-2 border-white rounded-full -mr-48 -mt-48"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 border-2 border-white rounded-full -ml-48 -mb-48"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white rounded-full"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[85vh] py-20">
            {/* Left Column - Content */}
            <div className="text-white space-y-8">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 w-fit">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-semibold tracking-wide uppercase">Secure Portal</span>
              </div>
              
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                  Resident
                  <span className="block text-primary-300">Portal</span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed font-light max-w-lg">
                  Streamlined access to barangay services, documents, and communications—all in one secure platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/portal/login"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-all duration-300 font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Access Portal
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all duration-300 font-semibold text-lg">
                  Learn More
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-8 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary-300" />
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

            {/* Right Column - Visual Elements */}
            <div className="hidden lg:block relative">
              <div className="relative space-y-6">
                {/* Floating Service Cards */}
                <div className="absolute top-0 right-0 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl w-64 transform rotate-3 hover:rotate-0 transition-transform duration-300 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary-600 rounded-lg">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Document Requests</h3>
                  </div>
                  <p className="text-xs text-gray-600">Submit and track requests in real-time</p>
                </div>

                <div className="absolute top-32 left-0 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl w-64 transform -rotate-3 hover:rotate-0 transition-transform duration-300 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-600 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Complaint Filing</h3>
                  </div>
                  <p className="text-xs text-gray-600">Direct communication with barangay office</p>
                </div>

                <div className="absolute bottom-0 right-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-2xl w-64 transform rotate-2 hover:rotate-0 transition-transform duration-300 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary-600 rounded-lg">
                      <Bell className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Announcements</h3>
                  </div>
                  <p className="text-xs text-gray-600">Stay updated with latest news</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Core Services</h2>
            <div className="w-20 h-1 bg-primary-600 mx-auto"></div>
            <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
              Comprehensive digital services designed for modern barangay administration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="bg-white border-l-4 border-primary-600 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Document Management</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Request certificates, clearances, and official documents. Track processing status and download completed documents instantly.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Online request submission</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Real-time status tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Digital document archive</span>
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-white border-l-4 border-red-600 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Complaint System</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                File formal complaints or service requests. Receive updates and responses directly through the portal.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>Structured complaint forms</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>Priority-based processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <span>Response notifications</span>
                </li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-white border-l-4 border-primary-600 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-50 rounded-lg">
                  <Bell className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Public Information</h3>
              </div>
              <p className="text-gray-600 leading-relaxed mb-6">
                Access announcements, events, and important notices. Stay informed about barangay programs and initiatives.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Latest announcements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Event calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                  <span>Program updates</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 border-b-2 border-gray-200 hover:border-primary-600 transition-colors duration-300">
              <Clock className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Track Request Status</h3>
              <p className="text-gray-600 text-sm">Monitor document requests with real-time status updates and notifications.</p>
            </div>

            <div className="p-6 border-b-2 border-gray-200 hover:border-primary-600 transition-colors duration-300">
              <Download className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">View Issued Documents</h3>
              <p className="text-gray-600 text-sm">Access and download previously issued documents from your personal archive.</p>
            </div>

            <div className="p-6 border-b-2 border-gray-200 hover:border-primary-600 transition-colors duration-300">
              <CreditCard className="h-8 w-8 text-primary-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Pay Fees Online</h3>
              <p className="text-gray-600 text-sm">Secure payment processing through integrated payment gateways.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Access your barangay services with a single secure login
          </p>
          <Link
            href="/portal/login"
            className="group inline-flex items-center px-10 py-4 bg-white text-primary-700 rounded-lg hover:bg-gray-100 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            <LogIn className="h-6 w-6 mr-3" />
            Access Portal Now
            <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

