import { useParams, Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, jokeToFlowData } from '@/components/FlowJokeCard'
import { usePack, useRecordPackProgress } from '@/features/packs'

/**
 * PackDetailPage — editorial joke bundle.
 * URL: /packs/:slug
 *
 * Sections:
 *   1. Cover hero (cover_color, title, subtitle, description)
 *   2. Progress indicator if user has started
 *   3. Joke list (FlowJokeCard for each, ordered by entry.order)
 */
export function PackDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { data: pack, isLoading, isError } = usePack(slug)
  const recordProgress = useRecordPackProgress(slug ?? '')

  if (isError) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
        <FlowAppShell active="library">
          <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 32,
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
              }}
            >
              Pack <em className="wink">not found.</em>
            </h2>
            <p style={{ marginTop: 8, color: '#52525B' }}>It may have expired or been unpublished.</p>
            <Link
              to="/library"
              className="btn-flow-primary"
              style={{ display: 'inline-flex', marginTop: 16, height: 42, fontSize: 13, textDecoration: 'none' }}
            >
              Back to library <ArrowRight size={14} />
            </Link>
          </div>
        </FlowAppShell>
      </div>
    )
  }

  if (isLoading || !pack) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
        <FlowAppShell active="library">
          <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
            <PackSkeleton />
          </div>
        </FlowAppShell>
      </div>
    )
  }

  const lastReadEntry = pack.user_progress?.last_read_entry ?? 0
  const isCompleted = !!pack.user_progress?.completed_at

  const handleStartReading = () => {
    // Record progress at entry 1 if not started yet, then jump to first joke detail.
    if (lastReadEntry === 0 && pack.jokes.length > 0) {
      recordProgress.mutate(1)
    }
    if (pack.jokes[0]) {
      navigate(`/jokes/${pack.jokes[0].joke.id}?source=pack`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 1100, margin: '0 auto' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: '#52525B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {/* Cover hero */}
          <article
            style={{
              padding: 'clamp(36px, 5vw, 56px)',
              background: pack.cover_color || 'linear-gradient(160deg, #FFE6B5, #FFC965)',
              color: pickReadableTextColor(pack.cover_color),
              borderRadius: 24,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 24,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.75,
                }}
              >
                {pack.is_featured ? 'Featured pack' : 'Pack'} · {pack.joke_count}{' '}
                {pack.joke_count === 1 ? 'joke' : 'jokes'}
              </span>
              <h1
                style={{
                  marginTop: 12,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.05,
                }}
              >
                {pack.title}
              </h1>
              {pack.subtitle && (
                <p
                  style={{
                    marginTop: 10,
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(1.125rem, 1.8vw, 1.375rem)',
                    opacity: 0.9,
                    maxWidth: 600,
                  }}
                >
                  {pack.subtitle}
                </p>
              )}
              {pack.description && (
                <p style={{ marginTop: 14, fontSize: 16, opacity: 0.85, maxWidth: 600, lineHeight: 1.5 }}>
                  {pack.description}
                </p>
              )}
            </div>

            {/* Progress indicator */}
            {pack.user_progress && (
              <ProgressIndicator
                lastRead={pack.user_progress.last_read_entry}
                total={pack.joke_count}
                completed={isCompleted}
              />
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleStartReading}
                style={{
                  height: 52,
                  padding: '0 28px',
                  background: pickContrastBg(pack.cover_color),
                  color: pickContrastFg(pack.cover_color),
                  border: 0,
                  borderRadius: 9999,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {lastReadEntry === 0
                  ? 'Start reading'
                  : isCompleted
                  ? 'Read again'
                  : `Continue from ${lastReadEntry}`}{' '}
                <ArrowRight size={16} />
              </button>
            </div>
          </article>

          {/* Joke list */}
          <section style={{ marginTop: 48 }}>
            <span className="eyebrow-mono">All {pack.joke_count} jokes</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 28,
                marginTop: 4,
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                marginBottom: 24,
              }}
            >
              The full <em className="wink">set.</em>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pack.jokes
                .sort((a, b) => a.order - b.order)
                .map((entry) => (
                  <PackEntry
                    key={entry.joke.id}
                    order={entry.order}
                    joke={entry.joke}
                    isRead={entry.order <= lastReadEntry}
                    onOpen={() => {
                      recordProgress.mutate(entry.order)
                      navigate(`/jokes/${entry.joke.id}?source=pack`)
                    }}
                  />
                ))}
            </div>
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function ProgressIndicator({ lastRead, total, completed }: { lastRead: number; total: number; completed: boolean }) {
  const pct = Math.round((lastRead / Math.max(1, total)) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <div
        style={{
          flex: 1,
          minWidth: 200,
          height: 8,
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: 'rgba(255, 255, 255, 0.85)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {completed ? `Read all ${total}` : `${lastRead} of ${total}`}
      </span>
    </div>
  )
}

function PackEntry({
  order,
  joke,
  isRead,
  onOpen,
}: {
  order: number
  joke: import('@/lib/api').Joke
  isRead: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        position: 'relative',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isRead ? '#CAFD00' : '#1A1A1A',
            color: isRead ? '#3A4A00' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 14,
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          {String(order).padStart(2, '0')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FlowJokeCard joke={jokeToFlowData(joke)} />
        </div>
      </div>
    </button>
  )
}

function PackSkeleton() {
  return (
    <div>
      <div style={{ height: 280, background: '#F2F0F0', borderRadius: 24 }} />
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ height: 140, background: '#F2F0F0', borderRadius: 18 }} />
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Tiny color helpers — adapt button/text colors to the pack's cover.
// ──────────────────────────────────────────────────────────────────────────

function pickReadableTextColor(coverColor: string): string {
  // Crude heuristic: if cover is very dark (1A, 2D, …) use white; otherwise dark ink.
  if (!coverColor) return '#5F4200'
  const c = coverColor.toLowerCase()
  if (c.includes('#0') || c.includes('#1') || c.includes('#2') || c.includes('rgb(0') || c.includes('linear-gradient(160deg, #0') || c.includes('#5d')) {
    return '#fff'
  }
  return '#1A1A1A'
}

function pickContrastBg(coverColor: string): string {
  const fg = pickReadableTextColor(coverColor)
  return fg === '#fff' ? '#CAFD00' : '#1A1A1A'
}

function pickContrastFg(coverColor: string): string {
  const fg = pickReadableTextColor(coverColor)
  return fg === '#fff' ? '#3A4A00' : '#fff'
}
