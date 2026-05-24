import type { SaveState } from '../autosave'

interface SaveIndicatorProps {
  saveState: SaveState
  lastSavedAt: number | null
  onRetry: () => void
}

/** Displays autosave status inline. Renders inside an aria-live="polite" region. */
export function SaveIndicator({ saveState, lastSavedAt, onRetry }: SaveIndicatorProps) {
  let content: React.ReactNode = null

  if (saveState === 'debouncing') {
    content = <span style={{ opacity: 0.5 }}>…</span>
  } else if (saveState === 'saving') {
    content = <span style={{ opacity: 0.7 }}>Saving…</span>
  } else if (saveState === 'saved' || (saveState === 'idle' && lastSavedAt !== null)) {
    content = <span style={{ color: '#4CAF50' }}>Saved</span>
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
