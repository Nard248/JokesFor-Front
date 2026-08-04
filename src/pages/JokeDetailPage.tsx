import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Bookmark, BookmarkCheck, Share2, Copy, Sparkles, Dice5, Lock } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, jokeToFlowData } from '@/components/FlowJokeCard'
import { jokeDetailApi, type JokeSource, type Joke } from '@/lib/api'
import { useReactions, useReactToJoke } from '@/features/reactions'
import { useStreak } from '@/features/streak'
import { useTasteProfile } from '@/features/insights'
import { useSaveJoke } from '@/features/saved-jokes'
import { ReportJokeButton } from '@/components/ReportJokeButton'
import { useToast } from '@/components/ui/toast'
import { useJokeSearch } from '@/features/jokes'
import { useRollMysteryBox } from '@/features/mystery-box'
import { recordShare, useDwell } from '@/features/telemetry'
import { trackReveal, type TelemetrySource } from '@/lib/telemetry'
import { dailyResetLocalLabel } from '@/lib/dailyReset'
import { useAuth } from '@/features/auth'
import type { ReactionSlug } from '@/lib/api'
import { Seo, jokeJsonLd, jokeShareUrl, truncate } from '@/lib/seo'

/** Map the URL ?source= (JokeSource) onto the telemetry source vocabulary. */
function telemetrySourceFor(source: JokeSource): TelemetrySource {
  switch (source) {
    case 'daily':
    case 'search':
    case 'explore':
    case 'pack':
      return source
    default:
      return 'other'
  }
}

/** Build <Seo> props from a loaded joke — image is the backend-generated share card. */
function jokeSeoProps(joke: Joke) {
  const titleSource = joke.setup || joke.text || 'A joke'
  const descriptionSource =
    joke.setup && joke.punchline
      ? `${joke.setup} ${joke.punchline}`
      : joke.setup || joke.text || 'A hand-picked joke from JokesFor.'

  return {
    title: `${truncate(titleSource, 60)} · JokesFor`,
    description: truncate(descriptionSource, 155),
    canonicalPath: `/jokes/${joke.id}`,
    image: joke.share_image_url || undefined,
    type: 'article' as const,
    jsonLd: jokeJsonLd(joke),
  }
}

/**
 * JokeDetailPage — full-screen joke viewer per Docs/JokesFor/parts/screens-4.jsx.
 *
 * URL pattern: /jokes/:id?source=daily|search|explore|mystery|pack|saved|share
 *
 * The ?source= param is critical — every authenticated GET /jokes/{id}/
 * logs a JokeView with that source for analytics and streak-tick.
 *
 * Sections (per §13.11):
 *   1. Pills row (themes, categories, age rating)
 *   2. Setup → Punchline display (always revealed; this is the detail view)
 *   3. Save / Share / Copy buttons
 *   4. 4-emoji reaction row
 *   5. "How the internet laughed" 4-card breakdown
 *   6. "Why you got this one" — derived from taste profile
 *   7. "Streak saved +1" rail
 *   8. "More like this" 3 cards
 *   9. "Roll a mystery joke" CTA
 */
export function JokeDetailPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const source = (searchParams.get('source') ?? 'other') as JokeSource
  const navigate = useNavigate()

  const jokeId = Number(id)

  // Single GET that also logs the JokeView server-side (debounced 60 sec).
  const { data: joke, isLoading } = useQuery({
    queryKey: ['joke', jokeId, source],
    queryFn: () => jokeDetailApi.get(jokeId, source).then((r) => r.data),
    enabled: !!jokeId && !isNaN(jokeId),
  })

  // The detail view normally shows the punchline, so loading it IS the reveal.
  // Deduped per session by the telemetry client. A LOCKED joke (server-stripped
  // payoff) has nothing to reveal, so no reveal is fired.
  useEffect(() => {
    if (joke?.id && !joke.is_locked) trackReveal(joke.id, telemetrySourceFor(source))
  }, [joke?.id, joke?.is_locked, source])

  if (isLoading || !joke) {
    return (
      <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
        <Seo
          title="Joke · JokesFor"
          description="A hand-picked joke from JokesFor."
          canonicalPath={`/jokes/${id ?? ''}`}
        />
        <FlowAppShell active="today">
          <div style={{ padding: '40px 0' }}>
            <DetailSkeleton />
          </div>
        </FlowAppShell>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <Seo {...jokeSeoProps(joke)} />
      <FlowAppShell active="today">
        <div style={{ padding: '40px 0', maxWidth: 1100, margin: '0 auto' }}>
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

          {/* Hero */}
          <JokeHero joke={joke} source={telemetrySourceFor(source)} />

          {/* Reactions breakdown */}
          <ReactionsBreakdown jokeId={joke.id} />

          {/* Why you got this one */}
          <WhyYouGotThis />

          {/* Streak rail */}
          <StreakSavedRail />

          {/* More like this */}
          <MoreLikeThis joke={joke} />

          {/* Mystery box CTA */}
          <RollMysteryCTA />
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hero — themes/categories pills + setup/punch + save/share/copy + reaction row
// ──────────────────────────────────────────────────────────────────────────

function JokeHero({ joke, source }: { joke: Joke; source: TelemetrySource }) {
  const [saved, setSaved] = useState(false)
  const saveJoke = useSaveJoke()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  // Read-time: dwell on the joke content with scroll depth (strongest signal).
  // Media jokes render a FlowJokeCard that runs its own dwell/impression on the
  // same joke+source (dwell is deliberately not deduped), so the hero-level
  // dwell must not run for those — pass undefined to no-op it.
  const heroDwellId = (joke.media?.length ?? 0) > 0 ? undefined : joke.id
  const dwellRef = useDwell<HTMLElement>(heroDwellId, source)
  const locked = joke.is_locked === true
  const flowData = jokeToFlowData(joke)

  const themes = joke.themes ?? joke.context_tags ?? []
  const categories = joke.categories ?? joke.tones ?? []

  const handleSave = () => {
    setSaved(true)
    // No collection → saves to the library. Revert the optimistic state on failure.
    saveJoke.mutate(
      { jokeId: joke.id },
      {
        onSuccess: () => toast({ message: 'Saved to your library.', variant: 'success' }),
        onError: () => {
          setSaved(false)
          toast({ message: "Couldn't save that joke. Please try again.", variant: 'error' })
        },
      },
    )
  }

  const handleCopy = () => {
    // A locked joke's `text` still carries the withheld punchline for non-one-liner
    // formats — copy only the visible setup so Copy can't bypass the paywall.
    const text = locked
      ? joke.setup || ''
      : joke.setup && joke.punchline
        ? `${joke.setup} ${joke.punchline}`
        : joke.text
    if (text) {
      navigator.clipboard
        .writeText(text)
        .then(() => toast({ message: 'Copied to clipboard.', variant: 'success' }))
        .catch(() => toast({ message: "Couldn't copy.", variant: 'error' }))
    }
  }

  const handleShare = () => {
    const url = jokeShareUrl(joke.id)
    navigator.clipboard
      .writeText(url)
      .then(() => toast({ message: 'Link copied to clipboard.', variant: 'success' }))
      .catch(() => toast({ message: "Couldn't copy the link.", variant: 'error' }))
    // Record a real share for creator analytics (fire-and-forget).
    recordShare(joke.id, 'copy')
  }

  return (
    <article
      ref={dwellRef}
      style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #FBFAF7 100%)',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
        padding: 'clamp(28px, 4vw, 48px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -80,
          right: -80,
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #F2E9FF, transparent 70%)',
        }}
      />
      <div style={{ position: 'relative' }}>
        {/* Pills row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {themes.map((t) => (
            <span key={t.slug} className="tag-flow">
              {t.name}
            </span>
          ))}
          {categories.map((c) => (
            <span key={c.slug} className="tag-flow lime">
              {c.name}
            </span>
          ))}
          {joke.age_rating && (
            <span className="tag-flow amber">{joke.age_rating.name}</span>
          )}
        </div>

        {/* Body */}
        {locked ? (
          (joke.media?.length ?? 0) > 0 ? (
            flowData ? <FlowJokeCard joke={flowData} big source={source} /> : null
          ) : (
          <div data-testid="detail-locked">
            {joke.setup && (
              <>
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
                  }}
                >
                  {joke.setup}
                </div>
              </>
            )}
            <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 24, display: 'block' }}>
              Punchline
            </span>
            <div
              aria-hidden
              className="punch-blur"
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '-0.025em',
                color: '#1A1A1A',
                lineHeight: 1.02,
              }}
            >
              ████ ███████ ██ ████
            </div>
            <p style={{ marginTop: 18, fontSize: 15, color: '#52525B', maxWidth: 460 }}>
              You've hit your free daily jokes. Go unlimited with Supporter to reveal every punchline.
            </p>
            <button
              type="button"
              data-testid="detail-unlock-cta"
              onClick={() => navigate(isAuthenticated ? '/settings/billing' : '/register')}
              className="btn-flow-reward"
              style={{ marginTop: 16 }}
            >
              <Lock size={16} /> {isAuthenticated ? 'Unlock with Supporter' : 'Sign up free'}
            </button>
          </div>
          )
        ) : (joke.media?.length ?? 0) > 0 ? (
          flowData ? <FlowJokeCard joke={flowData} big source={source} /> : null
        ) : joke.setup && joke.punchline ? (
          <>
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
              }}
            >
              {joke.setup}
            </div>
            <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 24, display: 'block' }}>
              Punchline
            </span>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                letterSpacing: '-0.025em',
                color: '#1A1A1A',
                lineHeight: 1.02,
                marginTop: 8,
              }}
            >
              {joke.punchline}
            </div>
          </>
        ) : joke.lines && joke.lines.length > 0 && flowData ? (
          <FlowJokeCard joke={flowData} big />
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.75rem, 4vw, 3rem)',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              lineHeight: 1.1,
            }}
          >
            {joke.text}
          </div>
        )}

        {/* Action row */}
        <footer
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: '1px solid #E9E8E7',
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={handleSave}
            className={saved ? 'btn-flow-reward' : 'btn-flow-ghost'}
            style={{ height: 48 }}
          >
            {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            {saved ? 'Saved' : 'Save to library'}
          </button>
          <button type="button" onClick={handleShare} className="btn-flow-ghost" style={{ height: 48 }}>
            <Share2 size={16} /> Share
          </button>
          <button type="button" onClick={handleCopy} className="btn-flow-ghost" style={{ height: 48 }}>
            <Copy size={16} /> Copy
          </button>
          <ReportJokeButton jokeId={joke.id} />
        </footer>
      </div>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// "How the internet laughed" — 4-card reaction breakdown
// ──────────────────────────────────────────────────────────────────────────

const REACTION_DISPLAY: { slug: ReactionSlug; emoji: string; label: string; bg: string; fg: string }[] = [
  { slug: 'lol', emoji: '😂', label: 'LOL', bg: '#CAFD00', fg: '#3A4A00' },
  { slug: 'crying', emoji: '🤣', label: 'Dying', bg: '#FFC965', fg: '#5F4200' },
  { slug: 'hmm', emoji: '🤔', label: 'Hmm', bg: '#F2E9FF', fg: '#5D00E4' },
  { slug: 'eyeroll', emoji: '🙄', label: 'Eyeroll', bg: '#1A1A1A', fg: '#fff' },
]

function ReactionsBreakdown({ jokeId }: { jokeId: number }) {
  const { data } = useReactions(jokeId, true)
  const reactMutation = useReactToJoke(jokeId)

  return (
    <section style={{ marginTop: 48 }}>
      <span className="eyebrow-mono">How the internet laughed</span>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 28,
          marginTop: 4,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
          marginBottom: 18,
        }}
      >
        React to <em className="wink">land it.</em>
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {REACTION_DISPLAY.map((r) => {
          const count = data?.counts?.[r.slug] ?? 0
          const active = data?.my_reaction === r.slug
          return (
            <button
              key={r.slug}
              type="button"
              onClick={() => reactMutation.mutate(r.slug)}
              aria-pressed={active}
              style={{
                padding: 24,
                background: active ? r.bg : '#fff',
                color: active ? r.fg : '#1A1A1A',
                border: `2px solid ${active ? r.bg : '#E9E8E7'}`,
                borderRadius: 18,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'center',
                transition: 'transform 0.12s ease, background 0.12s ease',
              }}
            >
              <div style={{ fontSize: 36 }}>{r.emoji}</div>
              <div
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 28,
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {count}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                {r.label}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// "Why you got this one" — derived from taste profile
// ──────────────────────────────────────────────────────────────────────────

function WhyYouGotThis() {
  const { data: taste } = useTasteProfile('month')
  const topVibe = taste?.top_vibe?.label
  const topTheme = taste?.top_themes?.[0]
  const topCategory = taste?.top_categories?.[0]

  return (
    <section
      style={{
        marginTop: 48,
        padding: 28,
        background: '#F2E9FF',
        borderRadius: 22,
      }}
    >
      <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
        Why you got this one
      </span>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 22,
          marginTop: 6,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
        }}
      >
        Picked because{' '}
        <em className="wink">
          {topVibe ? topVibe.toLowerCase() : 'your taste'}
          {topTheme ? ` & ${topTheme.label.toLowerCase()}` : ''}.
        </em>
      </h3>
      <p style={{ marginTop: 10, fontSize: 14, color: '#52525B', maxWidth: 580 }}>
        {topVibe ? (
          <>
            {topVibe} is your top vibe — you've saved {topTheme?.count ?? 0} {topTheme?.label.toLowerCase() ?? 'jokes'}{' '}
            this month and react most to {topCategory?.label.toLowerCase() ?? 'the obvious'} ones.{' '}
          </>
        ) : (
          <>We're getting to know you — read a few more jokes and your feed will tune itself. </>
        )}
        <Link to="/onboarding" style={{ color: '#6A1CF6', fontWeight: 700, textDecoration: 'none' }}>
          Tune your feed →
        </Link>
      </p>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Streak rail — "saved +1, that's N"
// ──────────────────────────────────────────────────────────────────────────

function StreakSavedRail() {
  const { data: streak } = useStreak()
  if (!streak) return null
  const days = streak.current_count
  if (days === 0) return null

  return (
    <section
      style={{
        marginTop: 24,
        padding: 24,
        background: '#1A1A1A',
        color: '#CAFD00',
        borderRadius: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
      }}
    >
      <Sparkles size={22} />
      <div style={{ flex: 1, minWidth: 200 }}>
        <span className="eyebrow-mono" style={{ color: '#CAFD00' }}>
          Streak
        </span>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 24,
            lineHeight: 1.1,
            color: '#fff',
            marginTop: 2,
          }}
        >
          That's <em className="wink" style={{ color: '#CAFD00' }}>{days}</em>{' '}
          {days === 1 ? 'day' : 'days'}.{' '}
          {streak.streak_at_risk_today ? "Don't drop it." : 'Keep going.'}
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Next joke unlocks at {dailyResetLocalLabel()}</span>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// More like this — 3 cards filtered by joke's first theme
// ──────────────────────────────────────────────────────────────────────────

function MoreLikeThis({ joke }: { joke: Joke }) {
  const themeSlug = (joke.themes ?? joke.context_tags)?.[0]?.slug
  const { data: searchData } = useJokeSearch(themeSlug ? { context_tags: themeSlug } : {})
  const more = searchData?.results.filter((j) => j.id !== joke.id).slice(0, 3) ?? []

  if (more.length === 0) return null

  return (
    <section style={{ marginTop: 48 }}>
      <span className="eyebrow-mono">More like this</span>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 28,
          marginTop: 4,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
          marginBottom: 18,
        }}
      >
        If you liked that, <em className="wink">you'll like these.</em>
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {more.map((j) => {
          const flow = jokeToFlowData(j)
          return flow && (
            <Link key={j.id} to={`/jokes/${j.id}?source=other`} style={{ textDecoration: 'none' }}>
              <FlowJokeCard joke={flow} source="other" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Mystery box CTA
// ──────────────────────────────────────────────────────────────────────────

function RollMysteryCTA() {
  const navigate = useNavigate()
  const roll = useRollMysteryBox()

  const handleRoll = () => {
    if (roll.isPending) return
    roll.mutate(undefined, {
      onSuccess: (data) => navigate(`/jokes/${data.joke.id}?source=mystery`),
    })
  }

  return (
    <section
      style={{
        marginTop: 48,
        padding: 24,
        background: '#FFC965',
        borderRadius: 22,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        flexWrap: 'wrap',
        color: '#5F4200',
      }}
    >
      <div style={{ flex: 1, minWidth: 240 }}>
        <span className="eyebrow-mono" style={{ color: '#5F4200' }}>
          Want another?
        </span>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 22,
            marginTop: 4,
            letterSpacing: '-0.01em',
            color: '#5F4200',
          }}
        >
          Roll a <em className="wink" style={{ color: '#5F4200' }}>mystery</em> joke.
        </div>
      </div>
      <button
        type="button"
        onClick={handleRoll}
        disabled={roll.isPending}
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
        }}
      >
        <Dice5 size={14} /> {roll.isPending ? 'Rolling…' : 'Roll'}
      </button>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 24,
        padding: 48,
        minHeight: 400,
      }}
    >
      <div style={{ height: 14, width: 160, background: '#F2F0F0', borderRadius: 4 }} />
      <div style={{ height: 32, background: '#F2F0F0', borderRadius: 6, marginTop: 24 }} />
      <div style={{ height: 60, background: '#F2F0F0', borderRadius: 6, marginTop: 24, width: '90%' }} />
    </div>
  )
}
