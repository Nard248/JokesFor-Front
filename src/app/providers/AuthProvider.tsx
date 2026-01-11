import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth'
import { authApi } from '@/lib/api'
import { setAccessToken } from '@/lib/axios'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { setAuth, logout } = useAuthStore()

  useEffect(() => {
    // On mount, try to get user (validates if session is still valid via httpOnly cookie)
    async function checkAuth() {
      try {
        // Try to refresh token first (in case access token expired but refresh is valid)
        const refreshResponse = await authApi.refreshToken()
        setAccessToken(refreshResponse.data.access)

        // Then get user
        const userResponse = await authApi.getUser()
        setAuth(userResponse.data, refreshResponse.data.access)
      } catch {
        // No valid session
        logout()
      }
    }

    checkAuth()
  }, [setAuth, logout])

  return <>{children}</>
}
