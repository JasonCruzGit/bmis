'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Layout from '@/components/Layout'
import { Shield } from 'lucide-react'

export function useEvaluatorAccessControl() {
  const router = useRouter()
  const { hydrated, user } = useAuthStore()

  useEffect(() => {
    if (hydrated && user?.role === 'BARANGAY_EVALUATOR') {
      router.push('/dashboard')
    }
  }, [hydrated, user, router])

  if (!hydrated) {
    return {
      loading: true,
      denied: false,
      component: (
        <Layout>
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        </Layout>
      )
    }
  }

  if (user?.role === 'BARANGAY_EVALUATOR') {
    return {
      loading: false,
      denied: true,
      component: (
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
  }

  return {
    loading: false,
    denied: false,
    component: null
  }
}

