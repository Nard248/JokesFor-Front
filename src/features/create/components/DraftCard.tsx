import type { ContentDraft } from '../types'
import { FormatIcon } from '@/features/create/editors/FormatIconComponent'
import { StatusBadge } from './StatusBadge'

interface DraftCardProps {
  draft: ContentDraft
  onClick: () => void
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = Date.now()
  const diff = now - date.getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getExcerpt(draft: ContentDraft, maxChars = 100): string {
  const text = draft.text || draft.setup || ''
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

export function DraftCard({ draft, onClick }: DraftCardProps) {
  const excerpt = getExcerpt(draft)
  const relativeTime = formatRelativeTime(draft.lastEditedAt)
  const labels = [...draft.themes, ...draft.categories].slice(0, 3)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '14px 18px',
        borderRadius: 16,
        border: '1.5px solid #E9E8E7',
        background: '#FFFFFF',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#6A1CF6', display: 'inline-flex', alignItems: 'center' }}>
              <FormatIcon slug={draft.format} size={16} />
            </span>
          <StatusBadge status={draft.status} />
        </div>
        <span style={{ fontSize: 12, color: '#52525B' }}>{relativeTime}</span>
      </div>

      {excerpt && (
        <p style={{ margin: 0, fontSize: 14, color: '#1A1A1A', lineHeight: 1.5 }}>
          {excerpt}
        </p>
      )}

      {labels.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {labels.map((label) => (
            <span
              key={label}
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 999,
                background: '#F3F4F6',
                color: '#52525B',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
