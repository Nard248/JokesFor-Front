// Store
export { useAuthStore } from './store'

// Mutations & queries
export {
  authKeys,
  useCurrentUser,
  useLogin,
  useRegister,
  useGoogleAuth,
  useLogout,
  useUpdateUser,
  usePasswordChange,
  usePasswordReset,
  usePasswordResetConfirm,
  useResendVerification,
} from './api'

// Convenience hooks
export { useAuth, useRequireAuth } from './hooks'

// Google OAuth helper
export { getGoogleAuthUrl, GOOGLE_OAUTH_REDIRECT_URI } from './google-oauth'
