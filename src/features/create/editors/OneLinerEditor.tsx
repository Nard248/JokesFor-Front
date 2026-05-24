import { AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { EditorDraft, EditorAction } from '@/features/create'

export interface EditorProps {
  draft: EditorDraft
  dispatch: (action: EditorAction) => void
  errors?: Record<string, string>
}

export function OneLinerEditor({ draft, dispatch, errors }: EditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
        Your joke
      </label>
      <Textarea
        variant="pill"
        value={draft.text}
        onChange={(e) =>
          dispatch({ type: 'setField', field: 'text', value: e.target.value })
        }
        placeholder="Write your one-liner here — short, punchy, no setup needed."
        rows={3}
      />
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
