import { AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { EditorProps } from './OneLinerEditor'

function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function StoryEditor({ draft, dispatch, errors }: EditorProps) {
  const wordCount = countWords(draft.text)
  const meetsMin = wordCount >= 30

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
        Your story
      </label>
      <Textarea
        variant="pill"
        value={draft.text}
        onChange={(e) =>
          dispatch({ type: 'setField', field: 'text', value: e.target.value })
        }
        placeholder="Tell a story with a comedic twist at the end. Aim for at least 30 words."
        rows={6}
      />
      <div
        data-testid="word-counter"
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: meetsMin ? '#16A34A' : '#D97706',
          alignSelf: 'flex-end',
        }}
      >
        {wordCount} / 30 words
      </div>
      {errors?.text && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#DC2626',
            fontSize: 13,
          }}
        >
          <AlertCircle size={14} />
          <span>{errors.text}</span>
        </div>
      )}
    </div>
  )
}
