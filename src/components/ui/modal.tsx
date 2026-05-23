import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export interface ModalProps {
  open: boolean
  onClose: () => void
  /** Accessible dialog title — rendered as a heading and used as the dialog's accessible name. */
  title?: string
  children: React.ReactNode
  /** Footer actions row (buttons). */
  footer?: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  const panelRef = React.useRef<HTMLDivElement>(null)
  const lastFocused = React.useRef<HTMLElement | null>(null)
  const onCloseRef = React.useRef(onClose)
  const titleId = React.useId()

  React.useLayoutEffect(() => { onCloseRef.current = onClose })

  // Focus management + body scroll lock — runs only on open/close transitions.
  React.useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      lastFocused.current?.focus()
    }
  }, [open])

  // Keydown: Escape + focus trap. Stable listener (reads onClose via ref).
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
      if (e.key === 'Tab') trapFocus(e, panelRef.current)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(26,26,26,0.45)', padding: 16 }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn('dropdown-enter', className)}
        style={{ background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%', padding: 24, boxShadow: '0 30px 60px -15px rgba(46,47,47,0.25)' }}
      >
        {title && <h2 id={titleId} style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#1A1A1A', marginBottom: 12 }}>{title}</h2>}
        <div>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

function trapFocus(e: KeyboardEvent, container: HTMLElement | null) {
  if (!container) return
  const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE)
  if (focusable.length === 0) return
  if (focusable.length === 1) { e.preventDefault(); focusable[0].focus(); return }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}
