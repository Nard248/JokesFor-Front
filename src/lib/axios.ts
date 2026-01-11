import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

// Create main API instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send httpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token state - will be connected to Zustand store in auth setup
let accessToken: string | null = null
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

// Subscribe to token refresh
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

// Notify all subscribers when token is refreshed
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

// Set access token (called from auth store)
export function setAccessToken(token: string | null) {
  accessToken = token
}

// Get current access token
export function getAccessToken(): string | null {
  return accessToken
}

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 and refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Only handle 401 errors
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error)
    }

    // Don't retry if already retried or if it's the refresh endpoint itself
    if (originalRequest._retry || originalRequest.url?.includes('/auth/token/refresh/')) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          resolve(api(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Use raw axios for refresh to avoid infinite loop
      // Refresh token is in httpOnly cookie, sent automatically with withCredentials
      const response = await axios.post(
        `${API_URL}/auth/token/refresh/`,
        {},
        { withCredentials: true }
      )

      const newToken = response.data.access
      accessToken = newToken

      // Notify queued requests
      onTokenRefreshed(newToken)

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      // Refresh failed - clear token and redirect to login
      accessToken = null
      // Don't redirect here - let the auth store handle it
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
