import type { JokePayload } from '@/features/create'
import { JokeRenderer } from '@/components/JokeRenderer'

interface PreviewPaneProps {
  payload: JokePayload
}

export function PreviewPane({ payload }: PreviewPaneProps) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: '1.5px solid #E9E8E7',
        background: 'rgba(106, 28, 246, 0.04)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: '#6A1CF6',
          fontFamily: 'var(--font-display)',
        }}
      >
        How readers will see it
      </p>
      <JokeRenderer payload={payload} revealed interactive={false} big />
    </div>
  )
}
