import type { FormatRule } from '@/features/create'
import { formatIcon } from '@/features/create/editors/formatIcon'

interface FormatTileProps {
  format: FormatRule
  example: string
  onClick: () => void
}

export function FormatTile({ format, example, onClick }: FormatTileProps) {
  const Icon = formatIcon(format.slug)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '16px 20px',
        borderRadius: 18,
        border: '1.5px solid #E9E8E7',
        background: '#FFFFFF',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#AC8EFF'
        el.style.background = '#F7F0FF'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#E9E8E7'
        el.style.background = '#FFFFFF'
      }}
      onFocus={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#6A1CF6'
      }}
      onBlur={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#E9E8E7'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#F7F0FF',
              color: '#6A1CF6',
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </span>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1A1A1A', fontFamily: 'var(--font-display)' }}>
            {format.name}
          </div>
          <div style={{ fontSize: 13, color: '#52525B', marginTop: 1 }}>
            {format.description}
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: '#6B7280',
          fontStyle: 'italic',
          lineHeight: 1.4,
          borderLeft: '3px solid #E9E8E7',
          paddingLeft: 10,
          whiteSpace: 'pre-line',
        }}
      >
        {example}
      </div>
    </div>
  )
}
