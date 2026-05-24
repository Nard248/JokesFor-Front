import { AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { EditorProps } from './OneLinerEditor'

export function ObservationalEditor({ draft, dispatch, errors }: EditorProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
        Your observation
      </label>
      <Textarea
        variant="pill"
        value={draft.text}
        onChange={(e) =>
          dispatch({ type: 'setField', field: 'text', value: e.target.value })
        }
        placeholder={'Start with “Have you ever noticed…” — share what you’ve observed about everyday life.'}
        rows={4}
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
