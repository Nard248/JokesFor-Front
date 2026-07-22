import { useRef, useState } from 'react'
import { Clapperboard, RefreshCw, X } from 'lucide-react'
import { useUploadMedia } from '../mutations'
import type { EditorProps } from './types'

const MAX_VIDEO = 1
// GIF is accepted here (not just under image): a joke's video punchline can
// be a looping GIF-video — Task 1's backend contract routes GIF uploads to
// kind:'video' regardless of which picker they came through.
const ACCEPT = 'video/mp4,video/quicktime,video/webm,image/gif'

/** Format `duration_ms` as `m:ss` (e.g. 5000 → '0:05'). Null for missing/invalid input. */
function formatDuration(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function VideoEditor({ draft, dispatch, errors }: EditorProps) {
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
      // Always kind:'video' — even for a picked .gif. The backend routes GIF
      // uploads to kind:'video'/is_gif:true regardless of the declared kind,
      // so this is just the semantically-consistent choice for this editor.
      const uploaded = await upload.mutateAsync({ file, kind: 'video', onProgress: setProgress })
      dispatch({ type: 'setMedia', media: [uploaded] })
    } catch {
      setUploadError('Upload failed — check the file (MP4/MOV/WebM or GIF, max 30MB) and try again.')
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
          placeholder="My cat's reaction when I said 'bath time.'"
          style={{ width: '100%', marginTop: 8, padding: 12, borderRadius: 10, border: '1px solid #E9E8E7', fontFamily: 'var(--font-display)', fontSize: 16 }}
        />
        {errors?.setup && <span style={{ color: '#D33', fontSize: 12 }}>{errors.setup}</span>}
      </label>

      <div>
        <span className="eyebrow-mono">Video punchline ({draft.media.length}/{MAX_VIDEO})</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {asset && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E9E8E7', borderRadius: 10, padding: 8 }}>
              <video
                data-testid="video-preview"
                src={asset.url ?? undefined}
                poster={asset.poster_url ?? undefined}
                controls
                style={{ width: 120, height: 68, borderRadius: 6, objectFit: 'cover', background: '#000' }}
              />
              <span style={{ flex: 1, fontSize: 12, color: '#52525B' }}>
                {formatDuration(asset.duration_ms) ?? 'video'}
                {asset.is_gif ? ' · GIF' : ''}
              </span>
              <button
                type="button"
                aria-label="replace video"
                onClick={() => fileRef.current?.click()}
                disabled={progress !== null}
                style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
              </button>
              <button type="button" aria-label="remove video" onClick={remove} style={{ height: 44, width: 44, background: 'transparent', border: 0, cursor: 'pointer' }}>
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
              <Clapperboard size={18} />
              {progress !== null ? `Uploading… ${progress}%` : 'Add video'}
            </button>
          )}
          <input
            ref={fileRef}
            data-testid="video-file-input"
            type="file"
            accept={ACCEPT}
            style={{ display: 'none' }}
            onChange={(e) => onPick(e.target.files)}
          />
          <span style={{ fontSize: 11, color: '#8B8A87' }}>
            MP4/MOV/WebM or GIF · max 60s · max 30MB · up to 1080p
          </span>
          {uploadError && <span style={{ color: '#D33', fontSize: 12 }}>{uploadError}</span>}
          {errors?.media && <span style={{ color: '#D33', fontSize: 12 }}>{errors.media}</span>}
        </div>
      </div>
    </div>
  )
}
