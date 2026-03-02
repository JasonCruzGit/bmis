import { NextRequest, NextResponse } from 'next/server'

const getBackendApiBaseCandidates = (request: NextRequest): string[] => {
  const candidates: string[] = []
  const envApi = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (envApi) {
    // localhost can resolve to IPv6 (::1) and fail if backend is IPv4-only.
    candidates.push(envApi.replace(/\/$/, '').replace('://localhost', '://127.0.0.1'))
    candidates.push(envApi.replace(/\/$/, ''))
  }

  const host = request.headers.get('host') || 'localhost:3000'
  const hostname = host.includes(':') ? host.split(':')[0] : host
  if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    candidates.push(`http://${hostname}:5001/api`)
  }

  candidates.push('http://127.0.0.1:5001/api')
  candidates.push('http://localhost:5001/api')

  // De-duplicate while preserving order
  return Array.from(new Set(candidates))
}

export async function GET(
  request: NextRequest,
  { params }: { params: { qrCode: string } }
) {
  try {
    const backendApiBases = getBackendApiBaseCandidates(request)
    let lastError: any = null

    for (const backendApiBase of backendApiBases) {
      try {
        const response = await fetch(
          `${backendApiBase}/residents/qr/${encodeURIComponent(params.qrCode)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          }
        )

        const text = await response.text()
        return new NextResponse(text, {
          status: response.status,
          headers: { 'Content-Type': response.headers.get('content-type') || 'application/json' },
        })
      } catch (error: any) {
        lastError = error
      }
    }

    throw lastError || new Error('Unable to reach backend API')
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || 'Unable to load resident information' },
      { status: 502 }
    )
  }
}
