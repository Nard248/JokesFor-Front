import { useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, BookmarkCheck, Share2, History, Dice5, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { FlowJokeCard, jokeToFlowData, type FlowJokeData } from '@/components/FlowJokeCard'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useTodayAugmented, useTomorrowTeaser, useTasteProfile } from '@/features/insights'
import { useStreak } from '@/features/streak'
import { useMysteryBoxStatus, useRollMysteryBox } from '@/features/mystery-box'
import { useFeaturedPack, usePacksInProgress } from '@/features/packs'
import { useJokeSearch } from '@/features/jokes'
import { useSaveJoke } from '@/features/saved-jokes'
import { useDailyJokeHistory } from '@/features/daily-joke'
import { useTopJokesters } from '@/features/trending'
import { recordShare } from '@/features/telemetry'
import { trackReveal } from '@/lib/telemetry'

/**
 * Flow Canvas — the "Today" hub, redesigned per Docs/JokesFor/parts/flow-screens.jsx
 * (06 · TODAY screen).
 *
 * Implemented sections (iteration 2):
 *   ✓ Top app shell (logo + nav + streak chip + bell + avatar)
 *   ✓ Hero strip (greeting + Yesterday/Mystery box quick actions)
 *   ✓ JOTD hero card with reveal-punchline interaction
 *   ✓ Streak rail (lime card, 14-day visualization)
 *   ✓ Mystery box (amber card, "3 left today")
 *   ✓ Tomorrow teaser (dark card, blurred preview)
 *   ✓ "You stopped mid-sip" — continue yesterday's set
 *   ✓ "Three you'll probably save" — 3-up format-aware cards
 *   ✓ Brand pull-quote footer with countdown
 *
 * Deferred to follow-ups (need backend data we don't have yet):
 *   - 7-day archive newspaper strip
 *   - Top jokesters this week
 *   - Weekly special collection card
 *   - "How you've been laughing" stats
 *   - "Themes you laugh at most" pill cloud
 *   - "Test it on a friend" share preview
 */
export function FlowCanvasPage() {
  const { user } = useAuth()
  const [revealed, setRevealed] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveJoke = useSaveJoke()

  // Real-API data sources for the Today hub.
  const { data: today } = useTodayAugmented()
  const { data: streak } = useStreak()
  const { data: mysteryStatus } = useMysteryBoxStatus()
  const { data: tomorrow } = useTomorrowTeaser()
  const { data: featuredPack } = useFeaturedPack()
  const { data: inProgressPacks } = usePacksInProgress()
  const { data: tasteProfile } = useTasteProfile('month')
  const { data: history } = useDailyJokeHistory()
  const { data: jokesters } = useTopJokesters(5)
  // "Three you'll probably save" — filter by user's top vibe; fall back to recent.
  const topVibe = tasteProfile?.top_vibe?.slug
  const { data: forYouJokes } = useJokeSearch(topVibe ? { vibe: topVibe, page_size: 3 } : { page_size: 3, ordering: '-created_at' })

  const firstName = user?.first_name || user?.username || 'friend'

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="today">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* ── Hero strip ─────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">
                {formatDateline()} · {today?.issue_label ?? 'Vol. I'}
              </span>
              <h2
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: '#1A1A1A',
                }}
              >
                Good {greetingTime()}, <em className="wink">{firstName}.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                One joke today. Two if you finish yesterday's saved set.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn-flow-ghost">
                <History size={14} /> Yesterday
              </button>
              <button type="button" className="btn-flow-ghost">
                <Dice5 size={14} /> Mystery box{' '}
                <span className="tag-flow lime" style={{ marginLeft: 6 }}>
                  {(mysteryStatus?.rolls_remaining_today ?? 3)} LEFT
                </span>
              </button>
            </div>
          </div>

          {/* ── Main grid: JOTD hero + right rail ─────────────── */}
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>
            {/* JOTD hero */}
            <article
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
              <header
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <span className="tag-flow">
                  Joke of the day · {today?.joke?.format?.name ?? 'Loading…'}
                </span>
                <span className="eyebrow-mono">
                  {(today?.joke?.themes?.[0]?.name ?? today?.joke?.context_tags?.[0]?.name) || ' '}
                  {(today?.joke?.categories?.[0]?.name ?? today?.joke?.tones?.[0]?.name) ? ' · ' : ''}
                  {(today?.joke?.categories?.[0]?.name ?? today?.joke?.tones?.[0]?.name) || ''}
                </span>
              </header>
              <JotdBody
                joke={today?.joke}
                revealed={revealed}
                onReveal={() => {
                  setRevealed(true)
                  if (today?.joke?.id) trackReveal(today.joke.id, 'daily')
                }}
              />
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
                    onClick={() => {
                      const id = today?.joke?.id
                      if (saved || !id) return
                      setSaved(true)
                      saveJoke.mutate({ jokeId: id }, { onError: () => setSaved(false) })
                    }}
                    aria-pressed={saved}
                    className={saved ? 'btn-flow-reward' : 'btn-flow-ghost'}
                    style={{ height: 44 }}
                  >
                    {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const id = today?.joke?.id
                      if (!id) return
                      const url = `${window.location.origin}/jokes/${id}`
                      navigator.clipboard?.writeText(url).catch(() => { /* best-effort */ })
                      recordShare(id, 'copy')
                    }}
                    className="btn-flow-ghost"
                    style={{ height: 44 }}
                  >
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </footer>
            </article>

            {/* Right rail: streak + mystery box + tomorrow teaser */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <StreakRail days={streak?.current_count ?? 0} streakState={streak} />
              <MysteryBox status={mysteryStatus} />
              <TomorrowTeaser tomorrow={tomorrow} />
            </div>
          </div>

          {/* ── You stopped mid-sip · continue yesterday's set ─── */}
          <ContinueBanner pack={inProgressPacks?.[0]} />

          {/* ── Three you'll probably save (3-up) ──────────────── */}
          <div style={{ marginTop: 48, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <span className="eyebrow-mono">Hand-picked from your vibes</span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 32,
                  marginTop: 6,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: '#1A1A1A',
                }}
              >
                Three you'll <em className="wink">probably</em> save.
              </h3>
            </div>
            <Link
              to="/explore"
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
              See more in Explore <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {forYouJokes && forYouJokes.results.length > 0
              ? forYouJokes.results.slice(0, 3).map((j) => (
                  <FlowJokeCard key={j.id} joke={jokeToFlowData(j)} source="feed" />
                ))
              : SAMPLE_JOKES.slice(0, 3).map((j) => <FlowJokeCard key={j.id} joke={j} />)}
          </div>

          {/* ── 7-day archive · newspaper strip ────────────────── */}
          <SevenDayArchive history={history?.results} />

          {/* ── Mixed-format showcase ──────────────────────────── */}
          <MixedFormatShowcase />

          {/* ── Top jokesters + Weekly special ─────────────────── */}
          <TopJokestersAndSpecial featuredPack={featuredPack} jokesters={jokesters} />

          {/* ── Stats + Themes + Test on a friend ──────────────── */}
          <StatsRow tasteProfile={tasteProfile} todayText={today?.joke?.text ?? today?.joke?.punchline ?? ''} />

          {/* ── Brand pull-quote footer ─────────────────────────── */}
          <BrandQuoteFooter />
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// JOTD body — format-aware. Handles all 6 formats correctly.
// ──────────────────────────────────────────────────────────────────────────

interface JotdBodyProps {
  joke?: {
    setup: string | null
    punchline: string | null
    text: string
    lines?: string[] | null
    format?: { slug: string }
  }
  revealed: boolean
  onReveal: () => void
}

function JotdBody({ joke, revealed, onReveal }: JotdBodyProps) {
  // Loading / no joke yet
  if (!joke) {
    return (
      <div style={{ marginTop: 32 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 'clamp(1.25rem, 2.5vw, 1.875rem)',
            color: '#52525B',
            lineHeight: 1.25,
          }}
        >
          Today's joke is brewing — check back in a moment.
        </div>
      </div>
    )
  }

  const slug = (joke.format?.slug ?? '').toLowerCase()
  const isSetupPunch = slug === 'setup' || slug === 'setup-punchline' || slug === 'setup_punchline' || slug === 'anti' || slug === 'anti-joke' || slug === 'anti_joke'
  const isKnock = slug === 'knock' || slug === 'knock-knock' || slug === 'knock_knock'
  const isAnti = slug === 'anti' || slug === 'anti-joke' || slug === 'anti_joke'

  // Setup → Punchline (and anti-joke, which has the same shape)
  if (isSetupPunch && joke.setup && joke.punchline) {
    return (
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
          {joke.setup}
        </div>
        <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 32, display: 'block' }}>
          Punchline
        </span>
        <div
          onClick={onReveal}
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
          {joke.punchline}
        </div>
        {isAnti && revealed && (
          <div
            style={{
              marginTop: 16,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.22em',
              color: '#52525B',
              textTransform: 'uppercase',
            }}
          >
            * That's it. That's the joke.
          </div>
        )}
        {!revealed && (
          <button
            type="button"
            onClick={onReveal}
            className="btn-flow-reward"
            style={{ marginTop: 24 }}
          >
            <Sparkles size={16} /> Reveal punchline
          </button>
        )}
      </div>
    )
  }

  // Knock-knock — alternating bubbles
  if (isKnock && joke.lines && joke.lines.length > 0) {
    return (
      <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 540 }}>
        {joke.lines.map((line, i) => (
          <div
            key={i}
            style={{
              alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
              maxWidth: '85%',
              padding: '12px 18px',
              borderRadius: 18,
              background: i % 2 === 0 ? '#F2E9FF' : '#1A1A1A',
              color: i % 2 === 0 ? '#6A1CF6' : '#fff',
              fontFamily: 'var(--font-display)',
              fontWeight: i === joke.lines!.length - 1 ? 800 : 600,
              fontSize: 'clamp(1rem, 1.6vw, 1.25rem)',
              lineHeight: 1.3,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    )
  }

  // One-liner / Observational / Story — single text
  // For observational, render in serif italic with a giant decorative quote.
  const isObserv = slug === 'observ' || slug === 'observational'
  const isStory = slug === 'story'

  if (isObserv) {
    return (
      <div style={{ marginTop: 32, position: 'relative', maxWidth: 760 }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -24,
            left: -8,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 96,
            lineHeight: 1,
            color: '#6A1CF6',
            opacity: 0.3,
          }}
        >
          “
        </span>
        <div
          style={{
            paddingLeft: 32,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
            color: '#1A1A1A',
            lineHeight: 1.3,
            textWrap: 'balance' as const,
          }}
        >
          {joke.text}
        </div>
      </div>
    )
  }

  if (isStory) {
    return (
      <div style={{ marginTop: 32, maxWidth: 720 }}>
        <span className="tag-flow amber" style={{ marginBottom: 16, display: 'inline-block' }}>
          📖 Story
        </span>
        <div
          style={{
            marginTop: 12,
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: 'clamp(1.125rem, 2vw, 1.375rem)',
            color: '#1A1A1A',
            lineHeight: 1.55,
            textWrap: 'pretty' as const,
          }}
        >
          {joke.text}
        </div>
      </div>
    )
  }

  // Default / one-liner: single big headline
  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          letterSpacing: '-0.025em',
          color: '#1A1A1A',
          lineHeight: 1.05,
          textWrap: 'balance' as const,
          maxWidth: 880,
        }}
      >
        {joke.text}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Right-rail components
// ──────────────────────────────────────────────────────────────────────────

function StreakRail({ days, streakState }: { days: number; streakState: ReturnType<typeof useStreak>['data'] }) {
  // Use last_14_days from real backend if available; otherwise approximate.
  const cells = streakState?.last_14_days ?? Array.from({ length: 14 }).map(() => ({ status: 'pending' as const }))
  const cellColor = (status: string) => {
    if (status === 'read') return '#3A4A00'
    if (status === 'frozen') return '#7B5A00'
    if (status === 'missed') return 'rgba(58, 74, 0, 0.2)'
    return 'transparent' // pending
  }
  const cellBorder = (status: string) => (status === 'pending' ? '1px dashed #3A4A00' : '0')

  const atRisk = streakState?.streak_at_risk_today ?? false

  return (
    <div style={{ padding: 24, borderRadius: 18, background: '#CAFD00', color: '#3A4A00' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="eyebrow-mono" style={{ color: '#3A4A00' }}>
          Streak{atRisk ? ' · at risk today' : ''}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em' }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 64, lineHeight: 1, marginTop: 8 }}>
        {days} <span style={{ fontSize: 20 }}>{days === 1 ? 'day' : 'days'}</span>
      </div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, gap: 3 }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              height: 14,
              borderRadius: 3,
              background: cellColor(cell.status),
              border: cellBorder(cell.status),
            }}
            aria-label={cell.status}
          />
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        {atRisk ? (
          <>
            Read today to <em className="wink" style={{ color: '#3A4A00' }}>save it.</em>
          </>
        ) : days > 0 ? (
          <>
            Longest: <em className="wink" style={{ color: '#3A4A00' }}>{streakState?.longest_count ?? days} days.</em>
          </>
        ) : (
          <>
            Read today to <em className="wink" style={{ color: '#3A4A00' }}>start a streak.</em>
          </>
        )}
      </div>
    </div>
  )
}

function MysteryBox({ status }: { status: ReturnType<typeof useMysteryBoxStatus>['data'] }) {
  const roll = useRollMysteryBox()
  const left = status?.rolls_remaining_today ?? 0
  const exhausted = left === 0

  const handleRoll = () => {
    if (exhausted || roll.isPending) return
    roll.mutate(undefined, {
      onSuccess: (data) => {
        // For now, just navigate to the joke detail. Phase 7 introduces a modal.
        window.location.href = `/jokes/${data.joke.id}?source=mystery`
      },
    })
  }

  return (
    <div style={{ padding: 24, borderRadius: 18, background: '#FFC965', color: '#5F4200', position: 'relative', overflow: 'hidden' }}>
      <span className="eyebrow-mono" style={{ color: '#5F4200' }}>
        Mystery box · {left} left today
      </span>
      <h3
        style={{
          marginTop: 8,
          color: '#5F4200',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 28,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        Roll for a <em className="wink" style={{ color: '#5F4200' }}>random</em> joke.
      </h3>
      <p style={{ fontSize: 13, marginTop: 6, marginBottom: 14, color: '#5F4200', opacity: 0.8 }}>
        Pulled from your vibes. Capped daily — that's the point.
      </p>
      <button
        type="button"
        onClick={handleRoll}
        disabled={exhausted || roll.isPending}
        style={{
          background: '#5F4200',
          color: '#FFC965',
          height: 44,
          padding: '0 24px',
          border: 0,
          borderRadius: 9999,
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 14,
          cursor: exhausted ? 'not-allowed' : 'pointer',
          opacity: exhausted ? 0.5 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Dice5 size={14} /> {roll.isPending ? 'Rolling…' : exhausted ? 'No rolls left' : 'Roll'}
      </button>
    </div>
  )
}

function TomorrowTeaser({ tomorrow }: { tomorrow: ReturnType<typeof useTomorrowTeaser>['data'] }) {
  const previewText = tomorrow?.preview ?? "Tomorrow's joke is brewing…"
  const formatName = tomorrow?.format ? formatLabel(tomorrow.format) : 'TBD'
  return (
    <div style={{ padding: 24, borderRadius: 18, background: '#0F0E12', color: '#fff' }}>
      <span className="eyebrow-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
        Tomorrow · 9:00 AM
      </span>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 18,
          marginTop: 10,
          lineHeight: 1.4,
          filter: 'blur(8px)',
          color: 'rgba(255,255,255,0.85)',
        }}
      >
        {previewText}
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        Format: <span style={{ color: '#CAFD00' }}>{formatName}</span>
      </div>
    </div>
  )
}

function ContinueBanner({ pack }: { pack?: { slug: string; title: string; joke_count: number; user_progress: { last_read_entry: number; total_entries: number } | null } }) {
  if (!pack || !pack.user_progress) return null
  const { last_read_entry, total_entries } = pack.user_progress
  const remaining = total_entries - last_read_entry

  return (
    <div
      style={{
        marginTop: 48,
        padding: '22px 28px',
        background: '#F2E9FF',
        border: '1px solid #E8DAFF',
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 14,
          background: '#6A1CF6',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 22,
        }}
      >
        {last_read_entry}/{total_entries}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
          You stopped mid-sip
        </span>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginTop: 4 }}>
          Finish <em className="wink">"{pack.title}"</em> — {remaining} {remaining === 1 ? 'joke' : 'jokes'} left.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn-flow-ghost" style={{ height: 42, fontSize: 13 }}>
          <History size={14} /> Skip
        </button>
        <Link to={`/packs/${pack.slug}`} className="btn-flow-primary" style={{ height: 42, fontSize: 13, textDecoration: 'none' }}>
          Continue <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// 7-day archive — newspaper-strip layout. Static mock; would pull from
// /daily-jokes/history/ when the page transitions to real data.
// ──────────────────────────────────────────────────────────────────────────

function SevenDayArchive({ history }: { history?: { joke: { text: string; format?: { name: string } }; date: string }[] }) {
  const tints = ['transparent', 'rgba(202, 253, 0, 0.12)', '#F2E9FF', 'rgba(255, 201, 101, 0.18)', 'transparent', '#F2E9FF', 'transparent']

  // Build the days array from real history. If history is empty, show placeholder.
  const days = history && history.length > 0
    ? history.slice(0, 7).map((h, i) => {
        const d = new Date(h.date)
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' })
        const num = String(99 - i).padStart(3, '0') // crude — backend should expose issue_label per entry
        return {
          d: dayLabel,
          n: num,
          t: (h.joke?.text ?? '').slice(0, 60),
          v: h.joke?.format?.name ?? '',
          bg: tints[i % tints.length],
        }
      })
    : [
        { d: 'Wed', n: '041', t: 'On scientists trusting atoms.', v: 'Nerd', bg: 'transparent' },
        { d: 'Tue', n: '040', t: 'On eyebrows drawn too high.', v: 'One-liner', bg: 'rgba(202, 253, 0, 0.12)' },
        { d: 'Mon', n: '039', t: 'On adulthood as email reply chain.', v: 'Observ.', bg: 'transparent' },
        { d: 'Sun', n: '038', t: 'On hippos vs. Zippos.', v: 'Pun', bg: '#F2E9FF' },
        { d: 'Sat', n: '037', t: 'On facial hair growing on you.', v: 'Pun', bg: 'transparent' },
        { d: 'Fri', n: '036', t: 'On the outstanding scarecrow.', v: 'Dad', bg: 'rgba(255, 201, 101, 0.18)' },
        { d: 'Thu', n: '035', t: 'On the chicken & the road.', v: 'Anti', bg: 'transparent' },
      ]
  return (
    <div style={{ marginTop: 56 }}>
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
          <span className="eyebrow-mono">The Week in Punchlines · Vol. I · Nos. 035–041</span>
          <h3
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 28,
              marginTop: 4,
              color: '#1A1A1A',
              lineHeight: 1.05,
            }}
          >
            Last seven mornings.
          </h3>
        </div>
        <span className="tag-flow">7-day archive</span>
      </div>
      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: 0,
          borderTop: '1px solid #E9E8E7',
        }}
      >
        {days.map((d, i) => (
          <button
            key={d.n}
            type="button"
            style={{
              padding: '18px 14px',
              borderRight: i < 6 ? '1px solid #E9E8E7' : '0',
              background: d.bg,
              minHeight: 160,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              border: i < 6 ? '0' : '0',
              borderBottom: 0,
              borderTop: 0,
              borderLeft: 0,
              textAlign: 'left',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: '#52525B' }}>
                {d.d.toUpperCase()} · No. {d.n}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  marginTop: 10,
                  lineHeight: 1.3,
                  color: '#1A1A1A',
                }}
              >
                "{d.t}"
              </div>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#52525B',
                marginTop: 14,
              }}
            >
              {d.v}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Mixed-format showcase — "Same library. Different rhythm."
// One big card + two smaller cards in different formats.
// ──────────────────────────────────────────────────────────────────────────

function MixedFormatShowcase() {
  return (
    <div style={{ marginTop: 56 }}>
      <span className="eyebrow-mono">By format · Try a different shape today</span>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 32,
          marginTop: 6,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
          color: '#1A1A1A',
        }}
      >
        Same library. <em className="wink">Different rhythm.</em>
      </h3>
      <div
        style={{
          marginTop: 22,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <FlowJokeCard
          big
          joke={{
            id: 'showcase-oneliner',
            fmt: 'oneliner',
            text: 'I told my wife she was drawing her eyebrows too high. She seemed surprised.',
            themeLabel: 'Family',
            catLabel: 'Dad',
            saves: '2.8K',
            laughs: '411',
          }}
        />
        <FlowJokeCard
          joke={{
            id: 'showcase-knock',
            fmt: 'knock',
            lines: ['Knock, knock.', "Who's there?", 'Lettuce.', 'Lettuce who?', "Lettuce in. It's freezing out here."],
            themeLabel: 'Weather',
            catLabel: 'Kid-safe',
            saves: '1.4K',
            laughs: '267',
          }}
        />
        <FlowJokeCard
          joke={{
            id: 'showcase-anti',
            fmt: 'anti',
            setup: 'Why did the chicken cross the road?',
            punch: 'To get to the other side.',
            themeLabel: 'Animals',
            catLabel: 'Surreal',
            saves: '771',
            laughs: '189',
          }}
        />
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Top jokesters (left, 1fr) + Weekly special (right, 1.4fr).
// ──────────────────────────────────────────────────────────────────────────

function TopJokestersAndSpecial({
  featuredPack,
  jokesters: realJokesters,
}: {
  featuredPack: ReturnType<typeof useFeaturedPack>['data']
  jokesters: unknown // adapter currently returns mock TopJokester[]; backend returns {results: TopJokesterDTO[]}
}) {
  // Backend returns either {results: [...]} or [...] directly. Normalize.
  type Row = { name: string; username?: string; punchlineCount?: number; punchline_count?: number; rank?: number; top_vibes?: { slug: string; label: string; icon: string }[] }
  let realList: Row[] = []
  if (Array.isArray(realJokesters)) {
    realList = realJokesters as Row[]
  } else if (realJokesters && typeof realJokesters === 'object' && 'results' in realJokesters) {
    realList = ((realJokesters as { results: Row[] }).results ?? [])
  }

  const palettes = [
    { avatarBg: '#6A1CF6', avatarFg: '#fff' },
    { avatarBg: '#CAFD00', avatarFg: '#3A4A00' },
    { avatarBg: '#FFC965', avatarFg: '#5F4200' },
    { avatarBg: '#1A1A1A', avatarFg: '#fff' },
    { avatarBg: '#1A1A1A', avatarFg: '#fff' },
  ]

  const jokesters = realList.length > 0
    ? realList.slice(0, 5).map((j, i) => ({
        rank: j.rank ?? i + 1,
        name: j.name,
        handle: j.username ? `@${j.username}` : '',
        // Backend uses `punchline_count`; legacy mock uses `punchlineCount` (camelCase).
        punchlines: String(j.punchline_count ?? j.punchlineCount ?? 0),
        desc: (j.top_vibes ?? []).slice(0, 2).map((v) => v.label).join(' · ') || '—',
        avatarBg: palettes[i].avatarBg,
        avatarFg: palettes[i].avatarFg,
      }))
    : [
        { rank: 1, name: 'Maya Okonkwo',  handle: '@mayatypes', punchlines: '1,204', desc: 'Office · Observ.', avatarBg: '#6A1CF6', avatarFg: '#fff' },
        { rank: 2, name: 'Dev Patel',     handle: '@devpuns',   punchlines: '982',   desc: 'Pun · Dad',        avatarBg: '#CAFD00', avatarFg: '#3A4A00' },
        { rank: 3, name: 'Sara Rumi',     handle: '@srumi',     punchlines: '844',   desc: 'Wholesome',        avatarBg: '#FFC965', avatarFg: '#5F4200' },
        { rank: 4, name: 'Kai Bennett',   handle: '@kaib',      punchlines: '712',   desc: 'Anti · Surreal',   avatarBg: '#1A1A1A', avatarFg: '#fff' },
        { rank: 5, name: 'Lena Park',     handle: '@lenap',     punchlines: '611',   desc: 'One-liners',       avatarBg: '#1A1A1A', avatarFg: '#fff' },
      ]
  const specialJokes = [
    "Why don't teachers ever get bored?",
    'I asked my pencil for advice…',
    'First day of class, the principal said…',
    'The school clock has only two hands.',
    "Geometry teacher's favorite season?",
  ]
  return (
    <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 24 }}>
      {/* Top jokesters */}
      <div style={{ padding: 28, background: '#fff', border: '1px solid #E9E8E7', borderRadius: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <span className="eyebrow-mono">Top jokesters · This week</span>
            <h4
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 22,
                marginTop: 4,
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
              }}
            >
              The five carrying us.
            </h4>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', color: '#52525B' }}>
            FEB 06 → 12
          </span>
        </div>
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column' }}>
          {jokesters.map((j, i) => (
            <div
              key={j.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: i < 4 ? '1px solid #E9E8E7' : '0',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 22,
                  color: i === 0 ? '#6A1CF6' : '#52525B',
                  width: 32,
                }}
              >
                #{j.rank}
              </div>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: j.avatarBg,
                  color: j.avatarFg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {j.name.split(' ').map((s) => s[0]).join('')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{j.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#52525B',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {j.handle} · {j.desc}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{j.punchlines}</div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#52525B',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  punchlines
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly special */}
      <div
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #FFE6B5 0%, #FFC965 100%)',
          color: '#5F4200',
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        }}
      >
        <div
          style={{
            padding: 36,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div>
            <span className="tag-flow" style={{ background: '#5F4200', color: '#FFC965' }}>
              Weekly Special · Curated
            </span>
            <h3
              style={{
                marginTop: 14,
                color: '#5F4200',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 36,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              {featuredPack ? renderTitle(featuredPack.title) : (
                <>Back-to-school <em className="wink" style={{ color: '#5F4200' }}>survival kit.</em></>
              )}
            </h3>
            <p style={{ marginTop: 10, fontSize: 14, color: '#5F4200', opacity: 0.85, maxWidth: 280 }}>
              {featuredPack?.description ?? '45 jokes engineered to win over a Monday-morning classroom.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <Link
              to={featuredPack ? `/packs/${featuredPack.slug}` : '/library'}
              style={{
                height: 44,
                padding: '0 24px',
                background: '#5F4200',
                color: '#FFC965',
                border: 0,
                borderRadius: 9999,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              Read collection <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              style={{
                height: 44,
                padding: '0 24px',
                background: 'transparent',
                color: '#5F4200',
                border: '1px solid #5F4200',
                borderRadius: 9999,
                fontFamily: 'var(--font-sans)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Bookmark size={14} /> Save list
            </button>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.25)',
            }}
          />
          {specialJokes.map((t, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                padding: '10px 14px',
                background: 'rgba(255, 255, 255, 0.55)',
                border: '1px solid rgba(95, 66, 0, 0.18)',
                borderRadius: 12,
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 13,
                color: '#5F4200',
                backdropFilter: 'blur(4px)',
              }}
            >
              <span
                style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', opacity: 0.6, marginRight: 8 }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              "{t}"
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Stats row — "How you've been laughing" + "Themes you laugh at most" +
// "Test on a friend"
// ──────────────────────────────────────────────────────────────────────────

function StatsRow({
  tasteProfile,
  todayText,
}: {
  tasteProfile: ReturnType<typeof useTasteProfile>['data']
  todayText: string
}) {
  // Combine themes + categories + formats into a single pill cloud, biggest first.
  const themesData =
    tasteProfile
      ? [
          ...tasteProfile.top_themes,
          ...tasteProfile.top_categories,
          ...tasteProfile.top_formats,
        ]
      : []

  // Mark top 3 as "big" pills.
  const sortedThemes = themesData
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((p, i) => ({ t: p.label, s: p.count, big: i < 3 }))

  // Fallback to mock pills if no data yet.
  const themes: { t: string; s: number; big?: boolean }[] =
    sortedThemes.length > 0
      ? sortedThemes
      : [
          { t: 'Office life', s: 42, big: true },
          { t: 'Puns', s: 38, big: true },
          { t: 'Wholesome', s: 24 },
          { t: 'One-liners', s: 21, big: true },
          { t: 'Dad', s: 18 },
        ]
  // Use real 28-day reads from taste-profile if available; otherwise mock.
  const barHeights = tasteProfile?.daily_reads_28d && tasteProfile.daily_reads_28d.length === 28
    ? tasteProfile.daily_reads_28d
    : [12, 18, 8, 22, 14, 28, 16, 24, 20, 30, 18, 26, 14, 32, 22, 28, 18, 34, 26, 32, 22, 38, 28, 36, 30, 32, 40, 28]
  const barMax = Math.max(1, ...barHeights)

  return (
    <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
      {/* How you've been laughing */}
      <div
        style={{
          padding: 28,
          background: '#1A1A1A',
          color: '#fff',
          borderRadius: 22,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span className="eyebrow-mono" style={{ color: '#CAFD00' }}>
          How you've been laughing
        </span>
        <h4
          style={{
            color: '#fff',
            marginTop: 6,
            fontSize: 22,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
          }}
        >
          This month, in numbers.
        </h4>
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <StatCell value={String(tasteProfile?.jokes_read ?? '—')} label="JOKES READ" valueColor="#CAFD00" />
          <StatCell value={String(tasteProfile?.jokes_saved ?? '—')} label="SAVED" valueColor="#fff" />
          <StatCell
            value={tasteProfile?.peak_read_hour !== null && tasteProfile?.peak_read_hour !== undefined ? formatHour(tasteProfile.peak_read_hour) : '—'}
            label="PEAK READ"
            valueColor="#FFC965"
          />
          <StatCell value={tasteProfile?.top_vibe?.label ?? '—'} label="TOP VIBE" valueColor="#fff" />
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 3, alignItems: 'flex-end', height: 40 }}>
          {barHeights.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(h * 100) / barMax}%`,
                background: i >= 21 ? '#CAFD00' : 'rgba(202, 253, 0, 0.3)',
                borderRadius: 1,
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            color: 'rgba(255, 255, 255, 0.4)',
          }}
        >
          JAN 16 ────────── FEB 12
        </div>
      </div>

      {/* Themes you laugh at most */}
      <div style={{ padding: 28, background: '#fff', border: '1px solid #E9E8E7', borderRadius: 22 }}>
        <span className="eyebrow-mono">Themes you laugh at most</span>
        <h4
          style={{
            marginTop: 6,
            fontSize: 22,
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: '#1A1A1A',
          }}
        >
          Your taste, in pills.
        </h4>
        <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {themes.map((p, i) => {
            const isBig = !!p.big
            const palette = ['#6A1CF6', '#CAFD00', '#FFC965']
            const fgPalette = ['#fff', '#3A4A00', '#5F4200']
            const colorIndex = i % 3
            const bg = isBig ? palette[colorIndex] : '#FBFAF7'
            const fg = isBig ? fgPalette[colorIndex] : '#1A1A1A'
            return (
              <span
                key={p.t}
                style={{
                  height: isBig ? 38 : 30,
                  fontSize: isBig ? 14 : 12,
                  padding: isBig ? '0 16px' : '0 12px',
                  background: bg,
                  color: fg,
                  border: isBig ? 0 : '1px solid #E9E8E7',
                  borderRadius: 9999,
                  fontWeight: isBig ? 800 : 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {p.t}
                <span style={{ opacity: 0.7, marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{p.s}</span>
              </span>
            )
          })}
        </div>
        <button
          type="button"
          className="btn-flow-ghost"
          style={{ marginTop: 18, height: 40, fontSize: 13, width: '100%', justifyContent: 'center' }}
        >
          See full taste profile <ArrowRight size={14} />
        </button>
      </div>

      {/* Test on a friend */}
      <div
        style={{
          padding: 28,
          background: '#6A1CF6',
          color: '#fff',
          borderRadius: 22,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(202, 253, 0, 0.2)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <span className="eyebrow-mono" style={{ color: '#CAFD00' }}>
            Test it on a friend
          </span>
          <h4
            style={{
              color: '#fff',
              marginTop: 6,
              fontSize: 22,
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            Did today's land?
          </h4>
          <p style={{ fontSize: 13, marginTop: 8, color: 'rgba(255, 255, 255, 0.8)', maxWidth: 240 }}>
            Share the punchline. We'll tell you if they laughed (or lied).
          </p>
        </div>
        <div
          style={{
            position: 'relative',
            marginTop: 18,
            padding: 14,
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: 14,
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255, 255, 255, 0.5)' }}>
            TO · SAM
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 14, marginTop: 6, lineHeight: 1.4 }}>
            "{todayText}" 😂
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <span className="tag-flow" style={{ background: '#CAFD00', color: '#3A4A00' }}>
              😂 Laughed
            </span>
            <span className="tag-flow" style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#fff' }}>
              🙄 Lied
            </span>
          </div>
        </div>
        <button
          type="button"
          style={{
            position: 'relative',
            marginTop: 14,
            height: 44,
            padding: '0 20px',
            background: '#CAFD00',
            color: '#3A4A00',
            border: 0,
            borderRadius: 9999,
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          <Share2 size={14} /> Share today's joke
        </button>
      </div>
    </div>
  )
}

function StatCell({ value, label, valueColor }: { value: string; label: string; valueColor: string }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function BrandQuoteFooter() {
  return (
    <div
      style={{
        marginTop: 56,
        padding: 'clamp(28px, 4vw, 48px) clamp(28px, 4vw, 56px)',
        borderRadius: 24,
        background: '#FBFAF7',
        border: '1px solid #E9E8E7',
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        position: 'relative',
        overflow: 'hidden',
        flexWrap: 'wrap',
      }}
    >
      <div
        aria-hidden
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 96,
          lineHeight: 0.6,
          color: '#6A1CF6',
          opacity: 0.4,
        }}
      >
        “
      </div>
      <div style={{ flex: 1, minWidth: 280 }}>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(1.25rem, 2.2vw, 1.75rem)',
            lineHeight: 1.3,
            color: '#1A1A1A',
            letterSpacing: '-0.005em',
          }}
        >
          Comedy is the gentlest way of telling the truth. JokesFor is a calendar of small truths —{' '}
          <em style={{ color: '#6A1CF6' }}>one per morning,</em> dressed as punchlines.
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#52525B',
          }}
        >
          The JokesFor Editors · Vol. I · No. 042
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180 }}>
        <span className="eyebrow-mono">Tomorrow at 9:00 AM</span>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 48, color: '#1A1A1A', lineHeight: 0.95 }}>
          15h
          <br />
          <span style={{ color: '#6A1CF6' }}>22m</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', color: '#52525B' }}>
          UNTIL THE NEXT ONE
        </div>
      </div>
    </div>
  )
}

// Button styles for .btn-flow-* live in FlowAppShell so they're available
// wherever FlowAppShell renders.

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function formatDateline() {
  const d = new Date()
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

function greetingTime() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

/** Map a format slug to a human label. */
function formatLabel(slug: string): string {
  const map: Record<string, string> = {
    setup: 'Setup → Punchline',
    'setup-punchline': 'Setup → Punchline',
    setup_punchline: 'Setup → Punchline',
    oneliner: 'One-liner',
    one_liner: 'One-liner',
    'one-liner': 'One-liner',
    observ: 'Observational',
    observational: 'Observational',
    anti: 'Anti-joke',
    anti_joke: 'Anti-joke',
    'anti-joke': 'Anti-joke',
    knock: 'Knock-knock',
    knock_knock: 'Knock-knock',
    'knock-knock': 'Knock-knock',
    story: 'Story',
  }
  return map[slug.toLowerCase()] ?? slug
}

/** Format hour 0-23 as "9 AM" / "10 PM" */
function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  if (h < 12) return `${h} AM`
  return `${h - 12} PM`
}

/** Wrap the last word of a pack title in a `wink` italic for the brand pattern. */
function renderTitle(title: string) {
  const words = title.split(' ')
  if (words.length < 2) return title
  const last = words[words.length - 1]
  const prefix = words.slice(0, -1).join(' ')
  return (
    <>
      {prefix} <em className="wink" style={{ color: '#5F4200' }}>{last}</em>
    </>
  )
}

// Sample jokes — local mock data shaped to FlowJokeData. Replace with real
// API fetches once the backend grows the format/themeLabel/laughs/saves
// fields the design uses.
const SAMPLE_JOKES: FlowJokeData[] = [
  {
    id: 2,
    fmt: 'oneliner',
    text: "I told my wife she was drawing her eyebrows too high. She seemed surprised.",
    themeLabel: 'Family',
    catLabel: 'Dad',
    saves: '2.8K',
    laughs: '411',
  },
  {
    id: 3,
    fmt: 'observ',
    text: "Adulthood is just emailing 'Sounds good!' back and forth until one of you dies.",
    themeLabel: 'Work',
    catLabel: 'Office-proper',
    saves: '4.8K',
    laughs: '904',
  },
  {
    id: 7,
    fmt: 'anti',
    setup: 'Why did the chicken cross the road?',
    punch: 'To get to the other side.',
    themeLabel: 'Animals',
    catLabel: 'Surreal',
    saves: '771',
    laughs: '189',
  },
]
