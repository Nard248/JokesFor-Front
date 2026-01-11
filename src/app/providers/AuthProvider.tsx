import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/features/auth'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const setAuth = useAuthStore((state) => state.setAuth)
  const setLoading = useAuthStore((state) => state.setLoading)
  const hasCheckedAuth = useRef(false)

  useEffect(() => {
    // Prevent double-check in React StrictMode and on re-renders
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    async function checkAuth() {
      try {
        // Use raw axios to avoid interceptor loops
        // This attempts to refresh the token using httpOnly cookie
        const refreshResponse = await axios.post(
          `${API_URL}/auth/token/refresh/`,
          {},
          { withCredentials: true }
        )

        const accessToken = refreshResponse.data.access

        // Get user with the new token
        const userResponse = await axios.get(`${API_URL}/auth/user/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        })

        setAuth(userResponse.data, accessToken)
      } catch {
        // No valid session - this is normal for anonymous users
        // Just mark loading as done, don't try to refresh again
        setLoading(false)
      }
    }

    checkAuth()
  }, [setAuth, setLoading])

  return <>{children}</>
}
