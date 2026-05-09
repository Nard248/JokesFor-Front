import { useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, BookmarkCheck, Share2, History, Dice5, Bell, Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { FlowJokeCard, type FlowJokeData } from '@/components/FlowJokeCard'

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

  const firstName = user?.first_name || user?.username || 'friend'

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="today" firstName={firstName}>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* ── Hero strip ─────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">{formatDateline()} · Vol. I · No. 042</span>
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
                <Dice5 size={14} /> Mystery box <span className="tag-flow lime" style={{ marginLeft: 6 }}>3 LEFT</span>
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
                <span className="tag-flow">Joke of the day · Setup → Punchline</span>
                <span className="eyebrow-mono">Nerd · Pun</span>
              </header>
              <div style={{ marginTop: 32, position: 'relative' }}>
                <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>Setup</span>
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
                  Why don't scientists trust atoms anymore?
                </div>
                <span className="eyebrow-mono" style={{ color: '#6A1CF6', marginTop: 32, display: 'block' }}>
                  Punchline
                </span>
                <div
                  onClick={() => setRevealed(true)}
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
                  Because they make up <em className="wink">everything.</em>
                </div>
                {!revealed && (
                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="btn-flow-reward"
                    style={{ marginTop: 24 }}
                  >
                    <Sparkles size={16} /> Reveal punchline
                  </button>
                )}
              </div>
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
                <div style={{ display: 'flex', gap: 18, fontSize: 13, color: '#52525B' }}>
                  <span>😂 612 laughs</span>
                  <span>💾 4.1K saves</span>
                  <span>🔁 312 retold</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setSaved((s) => !s)}
                    aria-pressed={saved}
                    className={saved ? 'btn-flow-reward' : 'btn-flow-ghost'}
                    style={{ height: 44 }}
                  >
                    {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    {saved ? 'Saved' : 'Save'}
                  </button>
                  <button type="button" className="btn-flow-ghost" style={{ height: 44 }}>
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </footer>
            </article>

            {/* Right rail: streak + mystery box + tomorrow teaser */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <StreakRail days={14} />
              <MysteryBox left={3} />
              <TomorrowTeaser />
            </div>
          </div>

          {/* ── You stopped mid-sip · continue yesterday's set ─── */}
          <ContinueBanner />

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
            {SAMPLE_JOKES.slice(0, 3).map((j) => (
              <FlowJokeCard key={j.id} joke={j} />
            ))}
          </div>

          {/* ── Brand pull-quote footer ─────────────────────────── */}
          <BrandQuoteFooter />
        </div>
      </FlowAppShell>

      <FlowStyles />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Top app shell — replaces the existing Layout for this redesigned hub.
// Includes: logo, nav (Today/Explore/Search/Library), streak, bell, avatar.
// ──────────────────────────────────────────────────────────────────────────

interface FlowAppShellProps {
  active: 'today' | 'explore' | 'search' | 'library'
  firstName: string
  children: React.ReactNode
}

function FlowAppShell({ active, firstName, children }: FlowAppShellProps) {
  const initial = (firstName?.[0] ?? 'A').toUpperCase()
  return (
    <>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 32px',
          borderBottom: '1px solid #E9E8E7',
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A' }}>
            <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
              JokesFor
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {(
              [
                ['today', 'Today', '/flow-canvas'],
                ['explore', 'Explore', '/explore'],
                ['search', 'Search', '/search'],
                ['library', 'Library', '/library'],
              ] as const
            ).map(([key, label, to]) => (
              <Link
                key={key}
                to={to}
                style={{
                  color: active === key ? '#1A1A1A' : '#52525B',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  padding: '8px 14px',
                  borderRadius: 9999,
                  background: active === key ? '#fff' : 'transparent',
                  border: active === key ? '1px solid #E9E8E7' : '1px solid transparent',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="streak-chip">
            <span className="dot">🔥</span>
            14-day streak
          </span>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-flow-ghost"
              aria-label="Notifications"
              style={{ height: 40, width: 40, padding: 0, borderRadius: 12 }}
            >
              <Bell size={16} />
            </button>
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                background: '#6A1CF6',
              }}
            />
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: '#6A1CF6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
            }}
          >
            {initial}
          </div>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Right-rail components
// ──────────────────────────────────────────────────────────────────────────

function StreakRail({ days }: { days: number }) {
  return (
    <div style={{ padding: 24, borderRadius: 18, background: '#CAFD00', color: '#3A4A00' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="eyebrow-mono" style={{ color: '#3A4A00' }}>
          Streak
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em' }}>
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 64, lineHeight: 1, marginTop: 8 }}>
        {days} <span style={{ fontSize: 20 }}>days</span>
      </div>
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: `repeat(${days}, 1fr)`, gap: 3 }}>
        {Array.from({ length: days }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 14,
              borderRadius: 3,
              background: i < days - 1 ? '#3A4A00' : 'transparent',
              border: i < days - 1 ? 0 : '1px dashed #3A4A00',
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: 14, fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        One more lands you in the <em className="wink" style={{ color: '#3A4A00' }}>Top 10%.</em>
      </div>
    </div>
  )
}

function MysteryBox({ left }: { left: number }) {
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
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Dice5 size={14} /> Roll
      </button>
    </div>
  )
}

function TomorrowTeaser() {
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
        A man walks into a library and asks for a book on…
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
        Format: <span style={{ color: '#CAFD00' }}>Story · 2-min read</span>
      </div>
    </div>
  )
}

function ContinueBanner() {
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
        2/4
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
          You stopped mid-sip · Yesterday
        </span>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, marginTop: 4 }}>
          Finish the <em className="wink">"Office Proper"</em> set — 2 jokes left.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn-flow-ghost" style={{ height: 42, fontSize: 13 }}>
          <History size={14} /> Skip
        </button>
        <button type="button" className="btn-flow-primary" style={{ height: 42, fontSize: 13 }}>
          Continue <ArrowRight size={14} />
        </button>
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

// ──────────────────────────────────────────────────────────────────────────
// Local styles
// ──────────────────────────────────────────────────────────────────────────

function FlowStyles() {
  return (
    <style>{`
      .btn-flow-primary {
        height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 700; font-size: 15px;
        background: #6A1CF6; color: #fff; cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        transition: background 0.12s ease, transform 0.12s ease;
      }
      .btn-flow-primary:hover { background: #5D00E4; }
      .btn-flow-primary:active { transform: translateY(1px); }

      .btn-flow-ghost {
        height: 40px; padding: 0 16px; border: 1px solid #E9E8E7; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 600; font-size: 13px;
        background: transparent; color: #1A1A1A; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: background 0.12s ease;
      }
      .btn-flow-ghost:hover { background: #F4F2EE; }

      .btn-flow-reward {
        height: 52px; padding: 0 24px; border: 0; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 700; font-size: 15px;
        background: #1A1A1A; color: #CAFD00; cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        transition: background 0.12s ease, transform 0.12s ease;
      }
      .btn-flow-reward:hover { background: #000; }
      .btn-flow-reward:active { transform: translateY(1px); }
    `}</style>
  )
}

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
