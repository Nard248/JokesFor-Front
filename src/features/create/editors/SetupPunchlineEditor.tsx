import { AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { EditorProps } from './OneLinerEditor'

function InlineError({ message }: { message: string }) {
  return (
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
      <span>{message}</span>
    </div>
  )
}

export function SetupPunchlineEditor({ draft, dispatch, errors }: EditorProps) {
  const isAnti = draft.format === 'anti'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Setup field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
          {isAnti ? 'Straightforward setup' : 'Setup'}
        </label>
        <Textarea
          variant="pill"
          value={draft.setup}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'setup', value: e.target.value })
          }
          placeholder={
            isAnti
              ? 'Ask a question that sounds like it needs a clever punchline…'
              : 'Set the scene — give enough context to make the punchline land.'
          }
          rows={3}
        />
        {errors?.setup && <InlineError message={errors.setup} />}
      </div>

      {/* Downward arrow divider */}
      <div
        aria-hidden
        style={{
          textAlign: 'center',
          fontSize: 20,
          color: '#52525B',
          lineHeight: 1,
        }}
      >
        ↓
      </div>

      {/* Punchline field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
          {isAnti ? 'Literal punchline' : 'Punchline'}
        </label>
        <Textarea
          variant="pill"
          value={draft.punchline}
          onChange={(e) =>
            dispatch({ type: 'setField', field: 'punchline', value: e.target.value })
          }
          placeholder={
            isAnti
              ? 'Give the boringly literal, anticlimactic answer.'
              : 'Deliver the punchline — unexpected, punchy, satisfying.'
          }
          rows={2}
        />
        {errors?.punchline && <InlineError message={errors.punchline} />}
      </div>

      {/* Anti-joke footer hint */}
      {isAnti && (
        <p
          style={{
            margin: 0,
            fontStyle: 'italic',
            fontSize: 12,
            color: '#52525B',
          }}
        >
          * That's it. That's the joke. — added automatically
        </p>
      )}
    </div>
  )
}
