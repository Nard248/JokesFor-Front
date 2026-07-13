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

// ─────────────────────────────────────────────────────────────────────────
// CSRF (cross-site double-submit)
//
// The API enforces CSRF on the cookie-auth path (JWT cookie present, no
// Authorization header). Because the SPA is on a DIFFERENT origin than the API,
// it cannot read the SameSite=None `csrftoken` cookie via document.cookie, so the
// classic "read the cookie in JS" trick fails. Instead we GET /auth/csrf/ to
// obtain the token VALUE and echo it back in the X-CSRFToken header on every
// mutating request; the browser sends the matching cookie automatically and
// Django compares the two.
//
// Note most authenticated requests carry the Bearer header (in-memory access
// token), which takes the header auth path and is NOT CSRF-checked — so this is
// defence-in-depth for any cookie-only mutation (e.g. the brief window after a
// reload before the token is rehydrated). The token/refresh endpoint sets
// authentication_classes=() server-side and is never CSRF-checked, so the
// bootstrap refresh needs no token (no chicken-and-egg).
// ─────────────────────────────────────────────────────────────────────────
const CSRF_HEADER = 'X-CSRFToken'
const CSRF_STORAGE_KEY = 'jokesfor-csrf'
const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function readStoredCsrf(): string | null {
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStoredCsrf(token: string | null) {
  try {
    if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token)
    else sessionStorage.removeItem(CSRF_STORAGE_KEY)
  } catch {
    // sessionStorage unavailable (SSR / privacy mode) — module state still works.
  }
}

let csrfToken: string | null = readStoredCsrf()
let csrfFetchPromise: Promise<string | null> | null = null

function isMutating(method?: string): boolean {
  return !!method && MUTATING_METHODS.has(method.toLowerCase())
}

function isCsrfFailure(error: AxiosError): boolean {
  if (error.response?.status !== 403) return false
  const detail = (error.response.data as { detail?: unknown } | undefined)?.detail
  // Django/dj-rest-auth returns {"detail": "CSRF Failed: <reason>"}.
  return typeof detail === 'string' && detail.includes('CSRF')
}

/** Force-fetch a fresh CSRF token (and cookie). De-duplicated across callers. */
export function fetchCsrfToken(): Promise<string | null> {
  if (!csrfFetchPromise) {
    csrfFetchPromise = axios
      .get<{ csrfToken: string }>(`${API_URL}/auth/csrf/`, { withCredentials: true })
      .then((res) => {
        csrfToken = res.data?.csrfToken ?? null
        writeStoredCsrf(csrfToken)
        return csrfToken
      })
      .catch(() => null)
      .finally(() => {
        csrfFetchPromise = null
      })
  }
  return csrfFetchPromise
}

/** Fetch a CSRF token only if we don't already have one. Call on app init. */
export function ensureCsrfToken(): Promise<string | null> {
  if (csrfToken) return Promise.resolve(csrfToken)
  return fetchCsrfToken()
}

export function getCsrfToken(): string | null {
  return csrfToken
}

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

// Request interceptor - attach access token + CSRF token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    // Attach the CSRF token on state-changing requests only. Harmless on
    // Bearer-authenticated requests (server ignores it on the header path) and
    // required for any cookie-only mutation.
    if (isMutating(config.method) && csrfToken) {
      config.headers[CSRF_HEADER] = csrfToken
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle CSRF 403 (retry once) and 401 (refresh)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean; _csrfRetry?: boolean })
      | undefined

    // CSRF recovery: a cookie-authenticated mutation can 403 if the token is
    // stale/missing. Fetch a fresh token and retry the request exactly ONCE.
    if (
      originalRequest &&
      !originalRequest._csrfRetry &&
      isMutating(originalRequest.method) &&
      isCsrfFailure(error)
    ) {
      originalRequest._csrfRetry = true
      const token = await fetchCsrfToken()
      if (token) {
        originalRequest.headers[CSRF_HEADER] = token
      }
      return api(originalRequest)
    }

    // Only handle 401 errors below this point
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
