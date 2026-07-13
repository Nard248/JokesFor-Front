import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import type {
  LoginCredentials,
  RegisterCredentials,
  GoogleAuthRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  AccountDeleteRequest,
  UpdateUserRequest,
  VerifyEmailRequest,
} from '@/lib/api'
import { useAuthStore } from './store'
import { setAccessToken, fetchCsrfToken } from '@/lib/axios'

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
      // Refresh the CSRF token now that a session (JWT cookie) exists, so any
      // cookie-only mutation this session is covered.
      void fetchCsrfToken()
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
      // Gated mode (EMAIL_VERIFICATION_REQUIRED on): no tokens — do NOT log in.
      // RegisterPage reads `data.email` and routes to /verify-email.
      if ('access' in data) {
        void fetchCsrfToken() // session established → refresh CSRF token
        setAuth(data.user, data.access)
        queryClient.invalidateQueries({ queryKey: authKeys.user() })
      }
    },
  })
}

// Verify email (6-digit code) → establishes a session.
export function useVerifyEmail() {
  const queryClient = useQueryClient()
  const { setAuth } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: VerifyEmailRequest) => {
      const response = await authApi.verifyEmail(payload)
      return response.data // { user }
    },
    onSuccess: async (data) => {
      // verify-email sets HttpOnly cookies but returns NO access token in the
      // body. Pull a fresh access token into memory via the refresh cookie
      // (mirrors AuthProvider bootstrap), then establish auth state. setAuth()
      // syncs the token to the axios instance internally.
      //
      // The user IS verified at this point (cookies are set server-side). If the
      // refresh hiccups, don't strand them in an error state — establish auth
      // from the verified user with an empty in-memory token; the axios 401
      // interceptor will acquire one lazily on the first authenticated request.
      void fetchCsrfToken() // verified → session (cookies) established, refresh CSRF token
      const user = data.user ?? (await authApi.getUser().then((r) => r.data).catch(() => data.user))
      try {
        const refresh = await authApi.refreshToken()
        setAuth(user, refresh.data.access)
      } catch {
        setAuth(user, '')
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
      void fetchCsrfToken() // session established → refresh CSRF token
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

// Delete account (DELETE /users/me/) — irreversible. Clears local auth state on
// success so the app drops to a logged-out state; the caller handles redirect.
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const { logout } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: AccountDeleteRequest) => {
      await authApi.deleteAccount(payload)
    },
    onSuccess: () => {
      logout()
      queryClient.clear()
    },
  })
}

// Data export (GET /users/me/data-export/) — receives a zip blob and triggers a
// browser download. Kept in the hook so any caller gets the download for free.
export function useDataExport() {
  return useMutation({
    mutationFn: async () => {
      const response = await authApi.dataExport()
      return response.data
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'jokes-for-data-export.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    },
  })
}
