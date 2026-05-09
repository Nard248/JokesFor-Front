import type { ReactNode } from 'react'
import { Navigate, useSearchParams } from 'react-router'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth'

interface GuestOnlyRouteProps {
  children: ReactNode
}

/**
 * Inverse of ProtectedRoute: only render for anonymous users.
 * Used on /login and /register so that an already-authenticated user
 * doesn't see a sign-in form.
 */
export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F6]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated) {
    const returnTo = searchParams.get('returnTo') || '/'
    return <Navigate to={returnTo} replace />
  }

  return <>{children}</>
}
