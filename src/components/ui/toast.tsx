import * as React from 'react'

type ToastVariant = 'default' | 'success' | 'error'
interface ToastInput { message: string; variant?: ToastVariant; durationMs?: number }
interface ToastItem extends Required<Omit<ToastInput, 'durationMs'>> { id: number; durationMs: number }

interface ToastContextValue { toast: (input: ToastInput) => void }
const ToastContext = React.createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}

const BG: Record<ToastVariant, string> = { default: '#1A1A1A', success: '#3A4A00', error: '#7f1d1d' }
const FG: Record<ToastVariant, string> = { default: '#fff', success: '#CAFD00', error: '#fff' }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([])
  const idRef = React.useRef(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timers = React.useRef(new Map<number, any>())

  const remove = React.useCallback((id: number) => {
    const handle = timers.current.get(id)
    if (handle !== undefined) {
      window.clearTimeout(handle)
      timers.current.delete(id)
    }
    setItems((xs) => xs.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback((input: ToastInput) => {
    const item: ToastItem = { id: ++idRef.current, message: input.message, variant: input.variant ?? 'default', durationMs: input.durationMs ?? 4000 }
    setItems((xs) => [...xs, item])
    timers.current.set(item.id, window.setTimeout(() => remove(item.id), item.durationMs))
  }, [remove])

  // Clear any pending timers if the provider unmounts.
  React.useEffect(() => {
    const map = timers.current
    return () => { map.forEach((h) => window.clearTimeout(h)); map.clear() }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div role="region" aria-live="polite" aria-label="Notifications"
        style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((t) => (
          <div key={t.id} className="dropdown-enter"
            style={{ background: BG[t.variant], color: FG[t.variant], padding: '10px 16px', borderRadius: 9999, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, boxShadow: '0 10px 30px rgba(26,26,26,0.25)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
