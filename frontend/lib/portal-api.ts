import axios from 'axios'

// Construct portal API URL
const getPortalApiUrl = () => {
  let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'
  
  // Ensure the URL has a protocol
  if (apiUrl && !apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
    apiUrl = `http://${apiUrl}`
  }
  
  // If API URL ends with /api, replace with /api/portal, otherwise append /portal
  if (apiUrl.endsWith('/api')) {
    return apiUrl.replace('/api', '/api/portal')
  }
  return `${apiUrl}/portal`
}

const portalApiBaseUrl = getPortalApiUrl()

// Debug: Log the portal API URL (only in browser)
if (typeof window !== 'undefined') {
  console.log('🔗 Portal API URL:', portalApiBaseUrl)
}

const portalApi = axios.create({
  baseURL: portalApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
portalApi.interceptors.request.use((config) => {
  // Ensure baseURL is always a complete URL
  if (config.baseURL && !config.baseURL.startsWith('http://') && !config.baseURL.startsWith('https://')) {
    config.baseURL = `http://${config.baseURL}`
  }
  
  // Ensure the full URL is valid
  if (config.url && config.baseURL) {
    const fullUrl = config.baseURL.endsWith('/') 
      ? `${config.baseURL}${config.url.startsWith('/') ? config.url.slice(1) : config.url}`
      : `${config.baseURL}${config.url.startsWith('/') ? config.url : `/${config.url}`}`
    
    if (typeof window !== 'undefined') {
      console.log('🌐 Portal API Request:', fullUrl)
    }
  }
  
  const token = typeof window !== 'undefined' 
    ? localStorage.getItem('residentToken') || localStorage.getItem('portal_token')
    : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
portalApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('residentToken')
      localStorage.removeItem('resident')
      localStorage.removeItem('portal_token')
      localStorage.removeItem('portal_resident')
      window.location.href = '/portal/login'
    }
    return Promise.reject(error)
  }
)

export default portalApi

