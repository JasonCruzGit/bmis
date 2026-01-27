'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, AlertCircle, Shield, Heart, Flame, Home, Building2 } from 'lucide-react'

export default function EmergencyContactsPage() {
  const router = useRouter()
  const [resident, setResident] = useState<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const residentData = localStorage.getItem('portal_resident')
      const token = localStorage.getItem('portal_token')
      
      if (!token || !residentData) {
        router.push('/portal/login')
        return
      }

      setResident(JSON.parse(residentData))
    }
  }, [router])

  // Emergency contact numbers - can be updated or fetched from API later
  const emergencyContacts = [
    {
      category: 'Emergency Services',
      icon: AlertCircle,
      color: 'bg-red-600',
      contacts: [
        { name: 'Emergency Hotline', number: '911', description: 'National Emergency Hotline' },
        { name: 'Barangay Emergency', number: '0912-345-6789', description: '24/7 Emergency Response' },
        { name: 'Fire Department', number: '0917-123-4567', description: 'Fire Emergency' },
        { name: 'Police Station', number: '0918-234-5678', description: 'Police Emergency' },
      ]
    },
    {
      category: 'Medical Services',
      icon: Heart,
      color: 'bg-pink-600',
      contacts: [
        { name: 'Barangay Health Center', number: '0919-345-6789', description: 'Medical Assistance' },
        { name: 'Ambulance Service', number: '0920-456-7890', description: 'Medical Emergency' },
        { name: 'Hospital Emergency', number: '0921-567-8901', description: 'Hospital Hotline' },
      ]
    },
    {
      category: 'Barangay Office',
      icon: Building2,
      color: 'bg-primary-600',
      contacts: [
        { name: 'Barangay Chairman', number: '0922-678-9012', description: 'Office Hours: 8AM-5PM' },
        { name: 'Barangay Secretary', number: '0923-789-0123', description: 'Office Hours: 8AM-5PM' },
        { name: 'Barangay Office', number: '0924-890-1234', description: 'Main Office Line' },
      ]
    },
    {
      category: 'Disaster Response',
      icon: Shield,
      color: 'bg-blue-600',
      contacts: [
        { name: 'Disaster Response Team', number: '0925-901-2345', description: '24/7 Disaster Hotline' },
        { name: 'Evacuation Center', number: '0926-012-3456', description: 'Emergency Shelter' },
      ]
    },
  ]

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`
  }

  if (!resident) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/portal/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Emergency Contacts</h1>
              <p className="text-sm text-gray-600 mt-1">Important contact numbers for emergencies</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Important Notice */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Emergency Hotline: 911</h3>
              <p className="text-sm text-red-800">
                For life-threatening emergencies, dial 911 immediately. This is the national emergency hotline that connects you to police, fire, and medical services.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {emergencyContacts.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <div
                key={categoryIndex}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className={`${category.color} px-6 py-4`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">{category.category}</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {category.contacts.map((contact, contactIndex) => (
                    <div
                      key={contactIndex}
                      className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 mb-1">{contact.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{contact.description}</p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-lg font-semibold text-gray-900 font-mono">
                              {contact.number}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCall(contact.number)}
                          className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold text-sm flex items-center gap-2"
                        >
                          <Phone className="h-4 w-4" />
                          Call
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Important Reminders
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Save these numbers in your phone for quick access during emergencies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>For non-emergency inquiries, contact the Barangay Office during office hours (8:00 AM - 5:00 PM)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>When calling emergency services, provide your exact location and nature of the emergency</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Keep your phone charged and accessible at all times</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  )
}

