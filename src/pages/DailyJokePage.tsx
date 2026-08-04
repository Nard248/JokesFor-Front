import { useState } from 'react'
import { Link } from 'react-router'
import { History, ArrowRight, Bookmark, BookmarkCheck, Share2, Sparkles, Music } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useTodaysJoke, useDailyJokeHistory } from '@/features/daily-joke'
import { useSaveJoke } from '@/features/saved-jokes'
import { recordShare, useDwell } from '@/features/telemetry'
import { trackReveal } from '@/lib/telemetry'
import type { JokeMediaItem } from '@/lib/api'
import { Seo, jokeShareUrl } from '@/lib/seo'

/**
 * DailyJokePage — reskinned in iteration 4 to match FlowCanvasPage's
 * Today-hero treatment. Linked from FlowCanvas's "See history" + "Today's
 * joke" quick action.
 *
 * Sections:
 *   1. Hero JOTD card with reveal-on-tap punchline
 *   2. History grid — 7-day archive style tiles
 */
export function DailyJokePage() {
  const { data: today, isLoading: loadingToday } = useTodaysJoke()
  const { data: history, isLoading: loadingHistory } = useDailyJokeHistory()

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <Seo
        title="Daily Joke · JokesFor"
        description="A fresh hand-picked joke every day — new material, new laugh, every single morning."
        canonicalPath="/daily"
      />
      <FlowAppShell active="today">
        <div style={{ padding: '40px 0' }}>
          {/* Hero strip */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">{today?.issue_label ? `Daily · ${today.issue_label}` : 'Daily'}</span>
              <h2
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  lineHeight: 1.05,
                }}
              >
                Today's <em className="wink">joke.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                One per morning. Fresh. Picked for you.
              </p>
            </div>
            <Link
              to="/flow-canvas"
              style={{
                color: '#6A1CF6',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Back to Today <ArrowRight size={14} />
            </Link>
          </div>

          {/* Hero JOTD */}
          <div style={{ marginTop: 32 }}>
            {loadingToday ? <JotdSkeleton /> : <JotdHero jokeId={today?.joke?.id} text={today?.joke?.text} setup={today?.joke?.setup} punchline={today?.joke?.punchline} media={today?.joke?.media} date={today?.date} />}
          </div>

          {/* History */}
          <section style={{ marginTop: 56 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                borderBottom: '2px solid #1A1A1A',
                paddingBottom: 12,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span className="eyebrow-mono">History · The week in punchlines</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: 600,
                    fontSize: 28,
                    marginTop: 4,
                    color: '#1A1A1A',
                  }}
                >
                  Every joke we've sent.
                </h3>
              </div>
              <span className="tag-flow">
                <History size={10} style={{ marginRight: 4 }} />
                Archive
              </span>
            </div>
            {loadingHistory ? (
              <HistorySkeleton />
            ) : history?.results && history.results.length > 0 ? (
              <div
                style={{
                  marginTop: 18,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16,
                }}
              >
                {history.results.slice(0, 12).map((entry, i) => (
                  <HistoryTile key={entry.date ?? i} text={entry.joke?.text} date={entry.date} index={i} />
                ))}
              </div>
            ) : (
              <p style={{ marginTop: 24, fontSize: 14, color: '#6B7280' }}>
                No history yet. Come back tomorrow for the next one.
              </p>
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// JOTD hero — adapted from FlowCanvas's hero card.
// ──────────────────────────────────────────────────────────────────────────

interface JotdHeroProps {
  jokeId?: number
  setup?: string | null
  punchline?: string | null
  text?: string
  media?: JokeMediaItem[] | null
  date?: string
}

function JotdHero({ jokeId, setup, punchline, text, media, date }: JotdHeroProps) {
  const [revealed, setRevealed] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveJoke = useSaveJoke()
  // Read-time on the daily hero. No-op until the joke id resolves.
  const dwellRef = useDwell<HTMLElement>(jokeId, 'daily')

  const hasMedia = (media?.length ?? 0) > 0
  const isSetupPunch = !!(setup && punchline)
  const headlineText = isSetupPunch ? null : text ?? setup ?? ''

  const handleReveal = () => {
    setRevealed(true)
    if (jokeId) trackReveal(jokeId, 'daily')
  }

  const handleSave = () => {
    if (saved || !jokeId) return
    setSaved(true)
    saveJoke.mutate({ jokeId }, { onError: () => setSaved(false) })
  }

  const handleShare = () => {
    if (!jokeId) return
    const url = jokeShareUrl(jokeId)
    navigator.clipboard?.writeText(url).catch(() => { /* best-effort */ })
    recordShare(jokeId, 'copy')
  }

  const dateline = date
    ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <article
      ref={dwellRef}
      style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FBFAF7 100%)',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
        padding: 'clamp(28px, 4vw, 40px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F2E9FF, transparent 70%)',
        }}
      />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', flexWrap: 'wrap', gap: 8 }}>
        <span className="tag-flow">{dateline}</span>
        <span className="eyebrow-mono">{hasMedia ? 'Image' : isSetupPunch ? 'Setup → Punchline' : 'One-liner'}</span>
      </header>

      {hasMedia ? (
        <div style={{ marginTop: 32, position: 'relative' }}>
          <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
            Setup
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
              color: '#1A1A1A',
              lineHeight: 1.25,
              marginTop: 8,
              maxWidth: 640,
            }}
          >
            {setup}
          </div>
          <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 32, display: 'block' }}>
            Punchline
          </span>
          {/* Kind-aware: video shows its poster stub (never the raw mp4 url);
              audio has no visual frame at all, so it gets the same static
              Music-icon placeholder as JokeRenderer's audio card. The daily
              hero stays image-based either way — no players here, reveal
              behaves as before. */}
          {media![0].kind === 'audio' ? (
            <div
              onClick={handleReveal}
              className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
              data-testid="daily-audio-placeholder"
              style={{
                cursor: revealed ? 'default' : 'pointer',
                marginTop: 8,
                maxWidth: 640,
                height: 88,
                borderRadius: 14,
                overflow: 'hidden',
                background: '#F2E9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Music size={28} color="#6A1CF6" aria-hidden />
            </div>
          ) : (
            <div
              onClick={handleReveal}
              className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
              style={{
                cursor: revealed ? 'default' : 'pointer',
                marginTop: 8,
                maxWidth: 640,
                aspectRatio: media![0].width && media![0].height ? `${media![0].width} / ${media![0].height}` : '4 / 3',
                borderRadius: 14,
                overflow: 'hidden',
                background: '#F1EFEC',
              }}
            >
              <img
                src={(media![0].kind === 'video' ? media![0].poster_url : media![0].url) ?? undefined}
                alt={setup ?? undefined}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      ) : isSetupPunch ? (
        <div style={{ marginTop: 32, position: 'relative' }}>
          <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
            Setup
          </span>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
              color: '#1A1A1A',
              lineHeight: 1.25,
              marginTop: 8,
              maxWidth: 640,
            }}
          >
            {setup}
          </div>
          <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 32, display: 'block' }}>
            Punchline
          </span>
          <div
            onClick={handleReveal}
            className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
            style={{
              cursor: revealed ? 'default' : 'pointer',
              marginTop: 8,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 5vw, 4rem)',
              letterSpacing: '-0.025em',
              color: '#1A1A1A',
              lineHeight: 1.02,
            }}
          >
            {punchline}
          </div>
          {!revealed && (
            <button
              type="button"
              onClick={handleReveal}
              className="btn-flow-reward"
              style={{ marginTop: 24 }}
            >
              <Sparkles size={16} /> Reveal punchline
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            marginTop: 32,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
            lineHeight: 1.1,
            position: 'relative',
          }}
        >
          {headlineText}
        </div>
      )}

      <footer
        style={{
          marginTop: 32,
          paddingTop: 24,
          borderTop: '1px solid #E9E8E7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        {/* Engagement-stat literals removed — no real per-joke counts here yet. */}
        <div />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            className={saved ? 'btn-flow-reward' : 'btn-flow-ghost'}
            style={{ height: 44 }}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saved ? 'Saved' : 'Save'}
          </button>
          <button type="button" onClick={handleShare} className="btn-flow-ghost" style={{ height: 44 }}>
            <Share2 size={14} /> Share
          </button>
        </div>
      </footer>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// History tile
// ──────────────────────────────────────────────────────────────────────────

function HistoryTile({ text, date, index }: { text?: string; date?: string; index: number }) {
  const tints = ['transparent', 'rgba(202, 253, 0, 0.12)', '#F2E9FF', 'rgba(255, 201, 101, 0.18)']
  const bg = tints[index % tints.length]
  const dateline = date ? new Date(date) : null
  const day = dateline?.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() ?? '—'

  return (
    <button
      type="button"
      style={{
        padding: 24,
        background: bg,
        borderRadius: 18,
        border: bg === 'transparent' ? '1px solid #E9E8E7' : '0',
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 180,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: 'inherit',
        color: 'inherit',
      }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: '#52525B' }}>
          {day}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 16,
            marginTop: 12,
            lineHeight: 1.35,
            color: '#1A1A1A',
          }}
        >
          "{(text ?? '').slice(0, 140)}{(text?.length ?? 0) > 140 ? '…' : ''}"
        </div>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#52525B',
        }}
      >
        Open →
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Skeletons
// ──────────────────────────────────────────────────────────────────────────

function JotdSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
        padding: 40,
        minHeight: 300,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ height: 22, width: 180, background: '#F2F0F0', borderRadius: 6 }} />
        <div style={{ height: 28, background: '#F2F0F0', borderRadius: 6, width: '70%' }} />
        <div style={{ height: 60, background: '#F2F0F0', borderRadius: 6, marginTop: 16 }} />
      </div>
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div
      style={{
        marginTop: 18,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
      }}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: 24,
            background: '#FBFAF7',
            border: '1px solid #E9E8E7',
            borderRadius: 18,
            minHeight: 180,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ height: 12, width: 80, background: '#F2F0F0', borderRadius: 4 }} />
          <div style={{ height: 56, background: '#F2F0F0', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}
