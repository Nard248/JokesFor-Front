import { useEffect, useState } from 'react'
import { usePublicIdentity, useUpdateIdentity } from '@/features/profile'

/** Pull a human-readable message out of a DRF 400 ({handle: ['...']}) or fall back. */
function extractError(error: unknown): string {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (data) {
    const fieldErr = data.handle ?? data.display_name ?? data.detail
    if (Array.isArray(fieldErr) && fieldErr.length) return String(fieldErr[0])
    if (typeof fieldErr === 'string') return fieldErr
  }
  return 'Could not save. Please try again.'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  borderRadius: 10,
  border: '1px solid #E4E4E7',
  background: '#fff',
  fontSize: 14,
  color: '#1A1A1A',
}

const labelStyle: React.CSSProperties = { display: 'block', marginBottom: 6 }

/**
 * Edit the user's public display name + @handle. Real path: PATCH /users/me/profile/
 * (validated server-side: 3–30 chars, lowercase alphanumeric/underscore, unique).
 */
export function PublicIdentityEditor() {
  const { data: identity, isLoading } = usePublicIdentity()
  const update = useUpdateIdentity()

  const [displayName, setDisplayName] = useState('')
  const [handle, setHandle] = useState('')
  const [dirty, setDirty] = useState(false)

  // Seed local inputs from the loaded identity (once, until the user edits).
  useEffect(() => {
    if (identity && !dirty) {
      setDisplayName(identity.display_name)
      setHandle(identity.handle ?? '')
    }
  }, [identity, dirty])

  const onSave = () => {
    setDirty(false)
    update.mutate({ display_name: displayName.trim(), handle: handle.trim() })
  }

  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase()
  const previewHandle = cleanHandle ? `@${cleanHandle}` : identity?.username || '@you'

  if (isLoading) {
    return <div style={{ fontSize: 13, color: '#6B7280' }}>Loading your public identity…</div>
  }

  return (
    <div>
      <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>
        How you appear on your creator profile and follower lists. Your email is never shown publicly.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <label style={labelStyle}>
          <span className="eyebrow-mono">Display name</span>
          <input
            data-testid="identity-display-name"
            style={inputStyle}
            value={displayName}
            placeholder="e.g. Pun Queen"
            maxLength={50}
            onChange={(e) => { setDisplayName(e.target.value); setDirty(true) }}
          />
        </label>
        <label style={labelStyle}>
          <span className="eyebrow-mono">Handle</span>
          <input
            data-testid="identity-handle"
            style={inputStyle}
            value={handle}
            placeholder="e.g. punqueen"
            maxLength={30}
            onChange={(e) => { setHandle(e.target.value); setDirty(true) }}
          />
        </label>
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>
        Preview: <strong data-testid="identity-preview">{previewHandle}</strong>
        <span style={{ marginLeft: 6 }}>· lowercase letters, numbers, underscore (3–30 chars)</span>
      </div>

      {update.isError && (
        <div data-testid="identity-error" role="alert" style={{ marginTop: 10, fontSize: 13, color: '#B91C1C' }}>
          {extractError(update.error)}
        </div>
      )}
      {update.isSuccess && !dirty && (
        <div data-testid="identity-success" style={{ marginTop: 10, fontSize: 13, color: '#15803D' }}>
          Saved.
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          data-testid="identity-save"
          className="btn-flow-primary"
          style={{ height: 40, fontSize: 13, opacity: update.isPending ? 0.6 : 1 }}
          disabled={update.isPending}
          onClick={onSave}
        >
          {update.isPending ? 'Saving…' : 'Save identity'}
        </button>
      </div>
    </div>
  )
}
