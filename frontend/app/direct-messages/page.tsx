'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { MessageSquare, Send, User, Search, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { getFileUrl } from '@/lib/utils'
import { useAuthStore } from '@/lib/store'
import { useRouter } from 'next/navigation'

export default function DirectMessagesPage() {
  const router = useRouter()
  const { user, hydrated } = useAuthStore()
  const queryClient = useQueryClient()
  const [residentSearch, setResidentSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])

  const { data: residentsSearchData, isLoading: residentsLoading } = useQuery(
    ['message-recipients-search', residentSearch],
    async () => {
      const { data } = await api.get(`/residents/search?q=${encodeURIComponent(residentSearch.trim())}`)
      return data
    },
    {
      enabled: residentSearch.trim().length >= 2,
    }
  )

  const { data: messagesData, isLoading: messagesLoading } = useQuery(
    ['direct-messages'],
    async () => {
      const { data } = await api.get('/direct-messages?limit=20')
      return data
    }
  )

  const searchResults = useMemo(() => {
    const list = residentsSearchData || []
    return list.filter((resident: any) => !selectedRecipients.some((r: any) => r.id === resident.id)).slice(0, 12)
  }, [residentsSearchData, selectedRecipients])

  const sendMessageMutation = useMutation(
    async () => {
      const formData = new FormData()
      formData.append('residentIds', JSON.stringify(selectedRecipients.map((r: any) => r.id)))
      formData.append('subject', subject)
      formData.append('message', message)
      attachments.forEach((file) => {
        formData.append('attachments', file)
      })
      return api.post('/direct-messages', formData)
    },
    {
      onSuccess: () => {
        toast.success(`Direct message sent to ${selectedRecipients.length} resident(s)`)
        setSubject('')
        setMessage('')
        setSelectedRecipients([])
        setAttachments([])
        setResidentSearch('')
        queryClient.invalidateQueries('direct-messages')
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || 'Failed to send direct message')
      },
    }
  )

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one resident')
      return
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required')
      return
    }
    sendMessageMutation.mutate()
  }

  const addRecipient = (resident: any) => {
    if (selectedRecipients.some((r: any) => r.id === resident.id)) return
    setSelectedRecipients((prev) => [...prev, resident])
    setResidentSearch('')
  }

  const removeRecipient = (residentId: string) => {
    setSelectedRecipients((prev) => prev.filter((r: any) => r.id !== residentId))
  }

  if (hydrated && user && !['ADMIN', 'BARANGAY_CHAIRMAN'].includes(user.role)) {
    if (typeof window !== 'undefined') {
      toast.error('You do not have permission to access Direct Messages')
      router.push('/dashboard')
    }
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-gray-500">Redirecting...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold text-white flex items-center">
            <MessageSquare className="h-8 w-8 mr-3" />
            Direct Messages
          </h1>
          <p className="text-primary-100 mt-2">Send direct messages to residents through their portal account.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Compose Message</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Find Resident</label>
                <div className="relative mb-2">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={residentSearch}
                    onChange={(e) => setResidentSearch(e.target.value)}
                    placeholder="Search by name or contact number..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                {residentSearch.trim().length > 0 && (
                  <div className="border border-gray-300 rounded-lg max-h-44 overflow-y-auto bg-white">
                    {residentSearch.trim().length < 2 ? (
                      <p className="text-sm text-gray-500 p-3">Type at least 2 characters to search.</p>
                    ) : residentsLoading ? (
                      <p className="text-sm text-gray-500 p-3">Searching residents...</p>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((resident: any) => (
                        <button
                          key={resident.id}
                          type="button"
                          onClick={() => addRecipient(resident)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-sm text-gray-800">
                            {resident.firstName} {resident.lastName} - {resident.barangay || 'N/A'}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 p-3">No residents found.</p>
                    )}
                  </div>
                )}
                {selectedRecipients.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedRecipients.map((resident: any) => (
                      <span
                        key={resident.id}
                        className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium border border-primary-200"
                      >
                        {resident.firstName} {resident.lastName}
                        <button
                          type="button"
                          onClick={() => removeRecipient(resident.id)}
                          className="ml-2 text-primary-700 hover:text-primary-900"
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">No recipients selected yet.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-800 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  placeholder="Write your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-800 placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Attachments (optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setAttachments(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {attachments.length > 0 && (
                  <p className="text-xs text-gray-600 mt-2">{attachments.length} file(s) selected</p>
                )}
              </div>

              <button
                type="submit"
                disabled={sendMessageMutation.isLoading}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMessageMutation.isLoading ? 'Sending...' : 'Send Direct Message'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Sent Messages</h2>
            {messagesLoading ? (
              <div className="text-gray-500 text-sm">Loading messages...</div>
            ) : (messagesData?.messages || []).length > 0 ? (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {messagesData.messages.map((item: any) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.subject}</p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center">
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          To: {item.recipient?.firstName} {item.recipient?.lastName}
                        </p>
                        <p className="text-xs mt-1.5">
                          {item.isViewed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              Viewed{item.viewedAt ? ` • ${format(new Date(item.viewedAt), 'MMM d, yyyy HH:mm')}` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                              <EyeOff className="h-3.5 w-3.5 mr-1" />
                              Not viewed yet
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(item.sentAt), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap">{item.message}</p>
                    {(item.attachments || []).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Attachments</p>
                        <div className="space-y-1">
                          {item.attachments.map((path: string, idx: number) => (
                            <a
                              key={`${item.id}-att-${idx}`}
                              href={getFileUrl(path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs text-primary-600 hover:text-primary-700 hover:underline break-all"
                            >
                              {path.split('/').pop()}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">No direct messages sent yet.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

