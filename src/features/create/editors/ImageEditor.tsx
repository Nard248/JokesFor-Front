import { useRef, useState } from 'react'
import { ImagePlus, X, ArrowUp, ArrowDown } from 'lucide-react'
import { useUploadMedia } from '../mutations'
import type { EditorProps } from './types'

const MAX_IMAGES = 6

export function ImageEditor({ draft, dispatch, errors }: EditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadMedia()
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onPick = async (files: FileList | null) => {
    const file = files?.[0]
    if (!file || draft.media.length >= MAX_IMAGES) return
    setUploadError(null)
    setProgress(0)
    try {
      const asset = await upload.mutateAsync({ file, onProgress: setProgress })
      dispatch({ type: 'setMedia', media: [...draft.media, asset] })
    } catch {
      setUploadError('Upload failed — check the file (JPEG/PNG/WebP, max 10MB) and try again.')
    } finally {
      setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeAt = (i: number) =>
    dispatch({ type: 'setMedia', media: draft.media.filter((_, idx) => idx !== i) })

  const move = (i: number, dir: -1 | 1) => {
    const next = [...draft.media]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    dispatch({ type: 'setMedia', media: next })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <label style={{ display: 'block' }}>
        <span className="eyebrow-mono">Caption (the setup)</span>
        <textarea
          aria-label="Caption"
          value={draft.setup}
          onChange={(e) => dispatch({ type: 'setField', field: 'setup', value: e.target.value })}
          rows={2}
          placeholder="When the intern says 'quick question'…"
          style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #E9E8E7', fontFamily: 'var(--font-display)', fontSize: 16 }}
        />
        {errors?.setup && <span style={{ color: '#D33', fontSize: 12 }}>{errors.setup}</span>}
      </label>

      <div>
        <span className="eyebrow-mono">Image punchline ({draft.media.length}/{MAX_IMAGES})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {draft.media.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E9E8E7', borderRadius: 10, padding: 8 }}>
              <img src={m.url ?? undefined} alt={`panel ${i + 1}`} style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 6 }} />
              <span style={{ flex: 1, fontSize: 12, color: '#52525B' }}>Panel {i + 1}</span>
              <button type="button" aria-label={`move panel ${i + 1} up`} onClick={() => move(i, -1)} disabled={i === 0} style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}><ArrowUp size={16} /></button>
              <button type="button" aria-label={`move panel ${i + 1} down`} onClick={() => move(i, 1)} disabled={i === draft.media.length - 1} style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}><ArrowDown size={16} /></button>
              <button type="button" aria-label={`remove panel ${i + 1}`} onClick={() => removeAt(i)} style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}><X size={16} /></button>
            </div>
          ))}
          {draft.media.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={progress !== null}
              style={{ height: 64, borderRadius: 10, border: '2px dashed #E9E8E7', background: '#FBFAF7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#52525B', fontWeight: 600 }}
            >
              <ImagePlus size={18} />
              {progress !== null ? `Uploading… ${progress}%` : 'Add image (JPEG/PNG/WebP, max 10MB)'}
            </button>
          )}
          <input
            ref={fileRef}
            data-testid="image-file-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => onPick(e.target.files)}
          />
          {uploadError && <span style={{ color: '#D33', fontSize: 12 }}>{uploadError}</span>}
          {errors?.media && <span style={{ color: '#D33', fontSize: 12 }}>{errors.media}</span>}
        </div>
      </div>
    </div>
  )
}
