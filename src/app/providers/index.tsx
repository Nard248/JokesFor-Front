import type { ReactNode } from 'react'
import { usePreferences } from '@/features/preferences'
import { HelmetProvider } from 'react-helmet-async'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from '@/components/ui/toast'

interface ProvidersProps {
  children: ReactNode
}

function AnalyticsPreferences() {
  usePreferences()
  return null
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            <AnalyticsPreferences />
            {children}
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </HelmetProvider>
  )
}
