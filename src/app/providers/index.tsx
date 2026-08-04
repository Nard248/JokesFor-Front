import type { ReactNode } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { ToastProvider } from '@/components/ui/toast'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <HelmetProvider>
      <QueryProvider>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </QueryProvider>
    </HelmetProvider>
  )
}
