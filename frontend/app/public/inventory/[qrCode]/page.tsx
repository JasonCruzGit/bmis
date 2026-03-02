'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  Package, 
  Box, 
  MapPin, 
  FileText,
  Loader2,
  AlertCircle,
  QrCode,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import { format } from 'date-fns'
import Image from 'next/image'

export default function PublicInventoryPage() {
  const params = useParams()
  const qrCode = params.qrCode as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        // Determine API URL based on current hostname
        let apiUrl = process.env.NEXT_PUBLIC_API_URL
        
        if (!apiUrl && typeof window !== 'undefined') {
          // If on production domain, use production backend
          if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('frontend-blush-chi-30')) {
            // Use your production backend URL here
            apiUrl = 'https://your-backend-render-url.onrender.com/api'
          } else {
            apiUrl = 'http://localhost:5000/api'
          }
        }
        
        if (!apiUrl) {
          apiUrl = 'http://localhost:5000/api'
        }
        
        const response = await fetch(`${apiUrl}/inventory/qr/${qrCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Inventory item not found')
          } else {
            setError('Failed to load inventory item')
          }
          setLoading(false)
          return
        }

        const data = await response.json()
        setItem(data)
      } catch (err: any) {
        console.error('Error fetching inventory item:', err)
        setError('Failed to load inventory item')
      } finally {
        setLoading(false)
      }
    }

    if (qrCode) {
      fetchItem()
    }
  }, [qrCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory item...</p>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h1>
          <p className="text-gray-600">{error || 'The inventory item you are looking for does not exist.'}</p>
        </div>
      </div>
    )
  }

  const isLowStock = item.quantity <= item.minStock
  const apiUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api')
    : 'http://localhost:5000/api'
  const photoUrl = item.photo ? `${apiUrl.replace('/api', '')}${item.photo}` : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">{item.itemName}</h1>
                <p className="text-primary-100 text-sm">Inventory Item Details</p>
              </div>
            </div>
          </div>

          {/* Photo and Basic Info */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo */}
              <div>
                {photoUrl ? (
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50">
                    <img
                      src={photoUrl}
                      alt={item.itemName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square rounded-lg border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                    <Package className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{item.category}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quantity</label>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-3xl font-bold text-gray-900">{item.quantity}</p>
                    <span className="text-lg text-gray-600">{item.unit}</span>
                    {isLowStock && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>

                {item.minStock > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Minimum Stock Level</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{item.minStock} {item.unit}</p>
                  </div>
                )}

                {item.location && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{item.location}</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <QrCode className="h-3 w-3" />
                    QR Code ID
                  </label>
                  <p className="text-sm font-mono text-gray-600 mt-1 break-all">{item.qrCode}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {item.notes && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary-600" />
              Additional Notes
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}

        {/* Recent Activity */}
        {item.logs && item.logs.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {item.logs.map((log: any, index: number) => (
                <div key={log.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    log.type === 'ADD' || log.type === 'RETURN' ? 'bg-green-100 text-green-700' :
                    log.type === 'REMOVE' || log.type === 'RELEASE' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {log.type === 'ADD' || log.type === 'RETURN' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : log.type === 'REMOVE' || log.type === 'RELEASE' ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : (
                      <Minus className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">{log.type}</p>
                      <span className="text-sm text-gray-500">
                        {format(new Date(log.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quantity: {log.quantity} {item.unit}
                    </p>
                    {log.notes && (
                      <p className="text-sm text-gray-500 mt-1">{log.notes}</p>
                    )}
                    {log.creator && (
                      <p className="text-xs text-gray-400 mt-1">
                        By: {log.creator.firstName} {log.creator.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Barangay Management Information System</p>
          <p className="mt-1">Scanned via QR Code</p>
        </div>
      </div>
    </div>
  )
}



