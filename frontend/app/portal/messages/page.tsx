'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import portalApi from '@/lib/portal-api'
import { ArrowLeft, Calendar, Inbox, MessageSquare, User, ChevronDown, ChevronUp, Paperclip, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { getFileUrl } from '@/lib/utils'

export default function PortalMessagesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [resident, setResident] = useState<any>(null)
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('portal_token')
      const residentData = localStorage.getItem('portal_resident')
      if (!token || !residentData) {
        router.push('/portal/login')
        return
      }
      setResident(JSON.parse(residentData))
    }
  }, [router])

  const { data, isLoading } = useQuery(
    ['portal-messages'],
    async () => {
      const { data } = await portalApi.get('/messages?limit=100')
      return data
    },
    { enabled: !!resident }
  )

  const markViewedMutation = useMutation(
    async (messageId: string) => {
      await portalApi.patch(`/messages/${messageId}/view`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('portal-messages')
      },
    }
  )

  const handleToggleMessage = (msg: any) => {
    const isOpening = openMessageId !== msg.id
    setOpenMessageId((prev) => (prev === msg.id ? null : msg.id))
    if (isOpening && !msg.isViewed) {
      markViewedMutation.mutate(msg.id)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      <header className="bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/portal/dashboard" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center shadow-md">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Direct Messages</h1>
                <p className="text-xs text-gray-600">Messages sent by barangay admin</p>
              </div>
            </div>
          </div>
          <Link href="/portal/dashboard" className="text-sm text-primary-600 font-semibold hover:text-primary-700">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Inbox
              </h2>
              <p className="text-sm text-white/90 mt-1">Open a message title to read the full details.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/80">Total Messages</p>
              <p className="text-2xl font-extrabold">{data?.messages?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading messages...</p>
          ) : (data?.messages || []).length > 0 ? (
            <div className="space-y-4">
              {data.messages.map((msg: any) => (
                <div key={msg.id} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow">
                  <button
                    type="button"
                    onClick={() => handleToggleMessage(msg)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900 flex items-center">
                          <MessageSquare className="h-4 w-4 mr-2 text-primary-600" />
                          {msg.subject}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1 flex items-center">
                          <User className="h-3.5 w-3.5 mr-1.5" />
                          From: {msg.sender?.firstName} {msg.sender?.lastName} ({msg.sender?.role || 'Admin'})
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          {!msg.isViewed && (
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                              New
                            </span>
                          )}
                          {(msg.attachments || []).length > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              <Paperclip className="h-3 w-3 mr-1" />
                              {(msg.attachments || []).length} attachment{(msg.attachments || []).length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 flex items-center whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 mr-1.5" />
                          {format(new Date(msg.sentAt), 'MMM d, yyyy HH:mm')}
                        </p>
                        <p className="mt-2 text-xs text-primary-600 font-semibold inline-flex items-center">
                          {openMessageId === msg.id ? (
                            <>
                              Hide
                              <ChevronUp className="h-3.5 w-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              Open
                              <ChevronDown className="h-3.5 w-3.5 ml-1" />
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </button>
                  {openMessageId === msg.id && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                      {(msg.attachments || []).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Attachments</p>
                          <div className="space-y-1">
                            {msg.attachments.map((path: string, idx: number) => (
                              <a
                                key={`${msg.id}-att-${idx}`}
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Inbox className="h-7 w-7 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">No direct messages yet</h2>
              <p className="text-sm text-gray-600 mt-1">When admin sends you a direct message, it will appear here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

