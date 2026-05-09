import { Link } from 'react-router'
import { ArrowRight, Sparkles, Search as SearchIcon } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData } from '@/components/FlowJokeCard'
import { useAuth } from '@/features/auth'

/**
 * HomePage — anonymous landing.
 *
 * Authenticated users get redirected to /flow-canvas via post-login redirect
 * (LoginPage / RegisterPage onSuccess). HomePage is what an unauthenticated
 * user sees at `/` — pitch the brand, show a sample of the format-aware
 * cards, drive sign-up.
 *
 * If an authed user lands here directly (deep link, refresh from /), we show
 * a "Continue to your canvas" CTA.
 *
 * Iteration 4: legacy HomePage at /legacy preserves the prior content.
 */
export function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const firstName = user?.first_name ?? user?.username

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="today" hideStreak>
        <Hero isAuthenticated={isAuthenticated} firstName={firstName} />
        <SamplesSection />
        <HowItWorks />
        <BottomCTA isAuthenticated={isAuthenticated} />
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hero
// ──────────────────────────────────────────────────────────────────────────

function Hero({ isAuthenticated, firstName }: { isAuthenticated: boolean; firstName?: string | null }) {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #5D00E4 0%, #6A1CF6 60%, #7B30FF 100%)',
        color: '#fff',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 480,
          height: 480,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(202,253,0,0.18), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -120,
          left: -80,
          width: 360,
          height: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(56px, 8vw, 96px) clamp(24px, 4vw, 56px)', position: 'relative' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          Volume I · Issue 042 · 312K daily readers
        </span>
        <h1
          style={{
            marginTop: 16,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(3rem, 7vw, 5.5rem)',
            letterSpacing: '-0.025em',
            lineHeight: 0.98,
            maxWidth: 880,
          }}
        >
          Find the right joke.{' '}
          <em className="wink" style={{ color: '#CAFD00' }}>
            For any moment.
          </em>
        </h1>
        <p
          style={{
            marginTop: 24,
            fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
            color: 'rgba(255, 255, 255, 0.85)',
            maxWidth: 600,
            lineHeight: 1.5,
          }}
        >
          A daily joke that matches your taste. A library to save the keepers. A search engine to find the right
          line for the moment that's actually in front of you.
        </p>

        {/* CTAs */}
        <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Link
              to="/flow-canvas"
              style={{
                height: 56,
                padding: '0 28px',
                background: '#CAFD00',
                color: '#3A4A00',
                border: 0,
                borderRadius: 9999,
                fontFamily: 'var(--font-sans)',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none',
              }}
            >
              {firstName ? `Continue, ${firstName}` : 'Open your canvas'} <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                style={{
                  height: 56,
                  padding: '0 28px',
                  background: '#CAFD00',
                  color: '#3A4A00',
                  border: 0,
                  borderRadius: 9999,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                }}
              >
                Get today's joke <ArrowRight size={18} />
              </Link>
              <Link
                to="/search"
                style={{
                  height: 56,
                  padding: '0 28px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 9999,
                  fontFamily: 'var(--font-sans)',
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <SearchIcon size={16} /> Or just search
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Samples — show off the format-aware cards
// ──────────────────────────────────────────────────────────────────────────

function SamplesSection() {
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 6vw, 80px) clamp(24px, 4vw, 56px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow-mono">Same library · Different rhythm</span>
          <h2
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: '#1A1A1A',
            }}
          >
            Six formats, <em className="wink">six rhythms.</em>
          </h2>
          <p style={{ marginTop: 6, fontSize: 18, color: '#52525B', maxWidth: 560 }}>
            Some jokes need a setup. Some hit best as one breath. We render each format the way it actually lands.
          </p>
        </div>
      </div>
      <div style={{ marginTop: 32, columnCount: 3, columnGap: 18 }}>
        {SAMPLES.map((j) => (
          <div key={j.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
            <FlowJokeCard joke={j} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// How it works — Hooked-loop
// ──────────────────────────────────────────────────────────────────────────

function HowItWorks() {
  const stages = [
    { num: 1, eyebrow: '9:00 AM · Trigger', body: "A push arrives. Today's joke is ready.", bg: '#6A1CF6', fg: '#fff' },
    { num: 2, eyebrow: 'One tap · Action', body: 'Open. Read. Save in 8 seconds flat.', bg: '#CAFD00', fg: '#3A4A00' },
    { num: 3, eyebrow: 'Variable reward', body: "You don't know which joke — that's the point.", bg: '#FFC965', fg: '#5F4200' },
    { num: 4, eyebrow: 'Streak grows · Investment', body: "Your taste compounds. Tomorrow's is more 'you'.", bg: '#1A1A1A', fg: '#CAFD00' },
  ]
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: 'clamp(32px, 4vw, 56px) clamp(24px, 4vw, 56px)',
        paddingBottom: 'clamp(56px, 8vw, 96px)',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <span className="eyebrow-mono">How it works</span>
        <h2
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: '#1A1A1A',
          }}
        >
          One ritual. <em className="wink">Three taps.</em>
        </h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {stages.map((s) => (
          <div
            key={s.num}
            style={{
              padding: 24,
              background: s.bg,
              color: s.fg,
              borderRadius: 18,
              minHeight: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.2)',
                color: s.fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 14,
              }}
            >
              {s.num}
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  opacity: 0.7,
                }}
              >
                {s.eyebrow}
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: 1.3,
                }}
              >
                {s.body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Bottom CTA
// ──────────────────────────────────────────────────────────────────────────

function BottomCTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) return null
  return (
    <section
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 clamp(24px, 4vw, 56px) clamp(56px, 8vw, 96px)',
      }}
    >
      <div
        style={{
          padding: 'clamp(36px, 5vw, 56px)',
          background: '#1A1A1A',
          color: '#fff',
          borderRadius: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
        }}
      >
        <div>
          <span className="eyebrow-mono" style={{ color: '#CAFD00' }}>
            Free · No spam · One push a day
          </span>
          <h2
            style={{
              marginTop: 8,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              color: '#fff',
              maxWidth: 600,
            }}
          >
            Start your <em className="wink" style={{ color: '#CAFD00' }}>streak.</em>
          </h2>
        </div>
        <Link
          to="/register"
          style={{
            height: 56,
            padding: '0 28px',
            background: '#CAFD00',
            color: '#3A4A00',
            border: 0,
            borderRadius: 9999,
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            textDecoration: 'none',
          }}
        >
          <Sparkles size={18} /> Sign up free
        </Link>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Sample joke data — showcases the 6 format rhythms.
// ──────────────────────────────────────────────────────────────────────────

const SAMPLES: FlowJokeData[] = [
  {
    id: 'home-1',
    fmt: 'setup',
    setup: "Why don't scientists trust atoms anymore?",
    punch: 'Because they make up everything.',
    themeLabel: 'Science',
    catLabel: 'Nerd',
    saves: '4.1K',
    laughs: '612',
  },
  {
    id: 'home-2',
    fmt: 'oneliner',
    text: 'I told my wife she was drawing her eyebrows too high. She seemed surprised.',
    themeLabel: 'Family',
    catLabel: 'Dad',
    saves: '2.8K',
    laughs: '411',
  },
  {
    id: 'home-3',
    fmt: 'observ',
    text: "Adulthood is just emailing 'Sounds good!' back and forth until one of you dies.",
    themeLabel: 'Work',
    catLabel: 'Office-proper',
    saves: '4.8K',
    laughs: '904',
  },
  {
    id: 'home-4',
    fmt: 'anti',
    setup: 'Why did the chicken cross the road?',
    punch: 'To get to the other side.',
    themeLabel: 'Animals',
    catLabel: 'Surreal',
    saves: '771',
    laughs: '189',
  },
  {
    id: 'home-5',
    fmt: 'knock',
    lines: ['Knock, knock.', "Who's there?", 'Lettuce.', 'Lettuce who?', "Lettuce in. It's freezing out here."],
    themeLabel: 'Weather',
    catLabel: 'Kid-safe',
    saves: '1.4K',
    laughs: '267',
  },
  {
    id: 'home-6',
    fmt: 'story',
    text: "A man walks into a library and asks the librarian for a book on paranoia. She whispers, 'They're right behind you.'",
    themeLabel: 'Work',
    catLabel: 'Surreal',
    read: '30 sec',
    saves: '892',
    laughs: '341',
  },
]
