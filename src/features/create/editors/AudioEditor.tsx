import { useRef, useState } from 'react'
import { Music, RefreshCw, X } from 'lucide-react'
import { useUploadMedia } from '../mutations'
import type { EditorProps } from './types'

const MAX_AUDIO = 1
const ACCEPT = 'audio/mpeg,audio/mp4,audio/aac'

/** Format `duration_ms` as `m:ss` (e.g. 5000 → '0:05'). Null for missing/invalid input. */
function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function AudioEditor({ draft, dispatch, errors }: EditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadMedia()
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const asset = draft.media[0]

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setUploadError(null)
    setProgress(0)
    try {
      const uploaded = await upload.mutateAsync({ file, kind: 'audio', onProgress: setProgress })
      dispatch({ type: 'setMedia', media: [uploaded] })
    } catch {
      setUploadError('Upload failed — check the file (MP3 or M4A, max 10MB) and try again.')
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = () => dispatch({ type: 'setMedia', media: [] })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'block' }}>
        <span className="eyebrow-mono">Caption (the setup)</span>
        <textarea
          aria-label="Caption"
          value={draft.setup}
          onChange={(e) => dispatch({ type: 'setField', field: 'setup', value: e.target.value })}
          rows={2}
          placeholder="Voicemail my dad left me. He does not know how voicemail works."
          style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #E9E8E7', fontFamily: 'var(--font-display)', fontSize: 16 }}
        />
        {errors?.setup && <span style={{ color: '#D33', fontSize: 12 }}>{errors.setup}</span>}
      </label>

      <div>
        <span className="eyebrow-mono">Audio punchline ({draft.media.length}/{MAX_AUDIO})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {asset && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E9E8E7', borderRadius: 10, padding: 8 }}>
              <audio data-testid="audio-preview" src={asset.url ?? undefined} controls style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: '#52525B' }}>{formatDuration(asset.duration_ms) ?? 'audio'}</span>
              <button
                type="button"
                aria-label="replace audio"
                onClick={() => fileRef.current?.click()}
                disabled={progress !== null}
                style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
              </button>
              <button type="button" aria-label="remove audio" onClick={remove} style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          )}
          {!asset && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={progress !== null}
              style={{ height: 64, borderRadius: 10, border: '2px dashed #E9E8E7', background: '#FBFAF7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#52525B', fontWeight: 600 }}
            >
              <Music size={18} />
              {progress !== null ? `Uploading… ${progress}%` : 'Add audio'}
            </button>
          )}
          <input
            ref={fileRef}
            data-testid="audio-file-input"
            type="file"
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => onPick(e.target.files)}
          />
          <span style={{ fontSize: 11, color: '#8B8A87' }}>MP3 or M4A · max 60s · max 10MB</span>
          {uploadError && <span style={{ color: '#D33', fontSize: 12 }}>{uploadError}</span>}
          {errors?.media && <span style={{ color: '#D33', fontSize: 12 }}>{errors.media}</span>}
        </div>
      </div>
    </div>
  )
}
