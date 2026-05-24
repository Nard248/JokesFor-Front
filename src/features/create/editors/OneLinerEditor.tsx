import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import type { EditorProps } from './types'

export type { EditorProps }

export function OneLinerEditor({ draft, dispatch, errors }: EditorProps) {
  const id = React.useId()
  const errorId = `${id}-error`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>
        Your joke
      </label>
      <Textarea
        id={id}
        variant="pill"
        value={draft.text}
        onChange={(e) =>
          dispatch({ type: 'setField', field: 'text', value: e.target.value })
        }
        placeholder="Write your one-liner here — short, punchy, no setup needed."
        rows={3}
        aria-describedby={errors?.text ? errorId : undefined}
      />
      {errors?.text && (
        <div
          id={errorId}
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
