import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import type {
  LoginCredentials,
  RegisterCredentials,
  GoogleAuthRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  UpdateUserRequest,
} from '@/lib/api'
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
      if (data.user) {
        setAuth(data.user, data.access)
      } else {
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
      if (data.user) {
        setAuth(data.user, data.access)
      } else {
        setAccessToken(data.access)
        authApi.getUser().then((res) => setAuth(res.data, data.access))
      }
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

// Google OAuth code-exchange mutation
export function useGoogleAuth() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: GoogleAuthRequest) => {
      const response = await authApi.googleAuth(payload)
      return response.data
    },
    onSuccess: (data) => {
      if (data.user) {
        setAuth(data.user, data.access)
      } else {
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
      queryClient.clear()
    },
    onError: () => {
      logout()
      queryClient.clear()
    },
  })
}

// Update current user (PATCH /auth/user/)
export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { setUser } = useAuthStore()

  return useMutation({
    mutationFn: async (patch: UpdateUserRequest) => {
      const response = await authApi.updateUser(patch)
      return response.data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: authKeys.user() })
    },
  })
}

// Password change (authenticated)
export function usePasswordChange() {
  return useMutation({
    mutationFn: async (payload: PasswordChangeRequest) => {
      const response = await authApi.passwordChange(payload)
      return response.data
    },
  })
}

// Password reset request (sends email)
export function usePasswordReset() {
  return useMutation({
    mutationFn: async (payload: PasswordResetRequest) => {
      const response = await authApi.passwordReset(payload)
      return response.data
    },
  })
}

// Password reset confirm (uid+token from email link)
export function usePasswordResetConfirm() {
  return useMutation({
    mutationFn: async (payload: PasswordResetConfirmRequest) => {
      const response = await authApi.passwordResetConfirm(payload)
      return response.data
    },
  })
}

// Resend email verification link
export function useResendVerification() {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await authApi.resendVerification(email)
      return response.data
    },
  })
}
