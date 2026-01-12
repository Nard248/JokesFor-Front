import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import type { LoginCredentials, RegisterCredentials } from '@/lib/api'
import { useAuthStore } from './store'
import { setAccessToken } from '@/lib/axios'

export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

// Hook to fetch current user
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: async () => {
      const response = await authApi.getUser()
      return response.data
    },
    retry: false,
    // On success, user is already authenticated (token valid)
    // This is called on app init to check if user has valid session
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await authApi.login(credentials)
      return response.data
    },
    onSuccess: (data) => {
      // User data is included in login response - no extra API call needed
      if (data.user) {
        setAuth(data.user, data.access)
      } else {
        // Fallback: fetch user if not in response
        setAccessToken(data.access)
        authApi.getUser().then((res) => setAuth(res.data, data.access))
      }
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await authApi.register(credentials)
      return response.data
    },
    onSuccess: (data) => {
      // User data is included in registration response - no extra API call needed
      if (data.user) {
        setAuth(data.user, data.access)
      } else {
        // Fallback: fetch user if not in response
        setAccessToken(data.access)
        authApi.getUser().then((res) => setAuth(res.data, data.access))
      }
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      await authApi.logout()
    },
    onSuccess: () => {
      logout()
      queryClient.clear() // Clear all cached data
    },
    onError: () => {
      // Even if logout API fails, clear local state
      logout()
      queryClient.clear()
    },
  })
}
