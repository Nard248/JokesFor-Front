import { useState, useEffect, type ReactNode } from 'react'
import type { SaveState } from '../autosave'

interface SaveIndicatorProps {
  saveState: SaveState
  lastSavedAt: number | null
  onRetry: () => void
}

/** Returns a short human-readable relative time string, e.g. "just now", "5s ago", "2m ago". */
function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
}

/** Displays autosave status inline. Renders inside an aria-live="polite" region. */
export function SaveIndicator({ saveState, lastSavedAt, onRetry }: SaveIndicatorProps) {
  // Tick every 10s so the relative time label stays fresh
  const [, setTick] = useState(0)
  useEffect(() => {
    if (saveState !== 'saved' && !(saveState === 'idle' && lastSavedAt !== null)) return
    const id = setInterval(() => setTick((n) => n + 1), 10_000)
    return () => clearInterval(id)
  }, [saveState, lastSavedAt])

  let content: ReactNode = null

  if (saveState === 'debouncing') {
    content = <span style={{ opacity: 0.5 }}>…</span>
  } else if (saveState === 'saving') {
    content = <span style={{ opacity: 0.7 }}>Saving…</span>
  } else if (saveState === 'saved' || (saveState === 'idle' && lastSavedAt !== null)) {
    const relative = lastSavedAt ? relativeTime(lastSavedAt) : null
    content = (
      <span style={{ color: '#4CAF50' }}>
        Saved{relative ? ` ${relative}` : ''}
      </span>
    )
  } else if (saveState === 'error') {
    content = (
      <>
        <span style={{ color: '#E53E3E' }}>Save failed</span>
        {' · '}
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#6A1CF6',
            textDecoration: 'underline',
            font: 'inherit',
          }}
        >
          retry
        </button>
      </>
    )
  }

  return (
    <span
      aria-live="polite"
      style={{
        fontSize: '0.75rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {content}
    </span>
  )
}
