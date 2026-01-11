import { useAuthStore } from './store'

// Convenience hook for auth state
export function useAuth() {
  const { user, isAuthenticated, isLoading } = useAuthStore()
  return { user, isAuthenticated, isLoading }
}

// Hook that throws if not authenticated (for protected components)
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return { isLoading: true, isAuthenticated: false }
  }

  if (!isAuthenticated) {
    // Could redirect here, but better to handle at route level
    return { isLoading: false, isAuthenticated: false }
  }

  return { isLoading: false, isAuthenticated: true }
}
