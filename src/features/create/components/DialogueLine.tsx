import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export interface DialogueLineProps {
  index: number
  value: string
  onChange: (v: string) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canRemove: boolean
  canMoveUp: boolean
  canMoveDown: boolean
}

const CHAR_LIMIT = 200

export function DialogueLine({
  index,
  value,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove,
  canMoveUp,
  canMoveDown,
}: DialogueLineProps) {
  const speaker = index % 2 === 0 ? 'A' : 'B'
  const charCount = value.length
  const isNearLimit = charCount >= CHAR_LIMIT - 20

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '10px 12px',
        background: '#F2E9FF',
        borderRadius: 16,
        border: '1px solid #E9E8E7',
      }}
    >
      {/* Speaker label */}
      <div
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: speaker === 'A' ? '#6A1CF6' : '#CAFD00',
          color: speaker === 'A' ? '#fff' : '#3A4A00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 13,
          marginTop: 2,
        }}
      >
        {speaker}
      </div>

      {/* Textarea + counter */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Textarea
          variant="pill"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={CHAR_LIMIT}
          rows={2}
          style={{ padding: '8px 14px', borderRadius: 12, fontSize: 14 }}
        />
        <div
          style={{
            fontSize: 11,
            color: isNearLimit ? '#D97706' : '#9CA3AF',
            textAlign: 'right',
          }}
        >
          {charCount} / {CHAR_LIMIT}
        </div>
      </div>

      {/* Reorder + Remove buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <button
          type="button"
          aria-label="Move line up"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canMoveUp ? 'pointer' : 'not-allowed',
            padding: 4,
            borderRadius: 6,
            color: canMoveUp ? '#6A1CF6' : '#D1D5DB',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          aria-label="Move line down"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canMoveDown ? 'pointer' : 'not-allowed',
            padding: 4,
            borderRadius: 6,
            color: canMoveDown ? '#6A1CF6' : '#D1D5DB',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          aria-label="Remove line"
          disabled={!canRemove}
          onClick={onRemove}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: canRemove ? 'pointer' : 'not-allowed',
            padding: 4,
            borderRadius: 6,
            color: canRemove ? '#DC2626' : '#D1D5DB',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
