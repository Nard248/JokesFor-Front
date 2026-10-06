import * as React from 'react'

export type ToastVariant = 'default' | 'success' | 'error'
export interface ToastInput { message: string; variant?: ToastVariant; durationMs?: number }

export interface ToastContextValue { toast: (input: ToastInput) => void }
/** Provided by <ToastProvider> (toast-provider.tsx). */
export const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
