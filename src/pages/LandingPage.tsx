import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { ArrowRight, Sunrise, Eye, Bookmark, Check } from 'lucide-react'
import { useAuth } from '@/features/auth'
import {
  JokeRenderer,
  SKIN,
  FORMAT_LABEL,
  tagToneFor,
} from '@/components/JokeRenderer'
import type { FlowJokeFormat } from '@/components/JokeRenderer'

/**
 * LandingPage — the anonymous marketing landing at `/`.
 *
 * This is the first impression and the "sale": a dedicated, conversion-optimized
 * page with its OWN marketing header/footer (NOT wrapped in FlowAppShell). It
 * reuses the brand tokens (index.css), the format-aware `JokeRenderer` skins,
 * and the `.punch-blur` reveal mechanic — the signature moment lives in the hero
 * try-it card.
 *
 * Authenticated users never see the pitch: they redirect straight into the app
 * (`/flow-canvas`, matching the post-login target in LoginPage). All primary /
 * secondary CTAs go to `/register`; "Sign in" goes to `/login`.
 *
 * The prior in-shell HomePage is preserved at `/legacy`.
 */
export function LandingPage() {
  const { isAuthenticated } = useAuth()

  // Authed visitors redirect into the app — they never see the marketing pitch.
  // `isAuthenticated` rehydrates synchronously from sessionStorage, so a returning
  // user redirects on first paint (no landing flash); anon users render instantly.
  if (isAuthenticated) {
    return <Navigate to="/flow-canvas" replace />
  }

  return (
    <div className="lp-root">
      <LandingStyles />
      <LandingHeader />
      <main>
        <Hero />
        <ThreeBeats />
        <FormatsShowcase />
        <WhyDifferent />
        <CreatorBand />
        <EarlyAccess />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Header — marketing chrome (logo · Sign in · Start free)
// ──────────────────────────────────────────────────────────────────────────

function LandingHeader() {
  return (
    <header className="lp-header">
      <Link to="/" className="lp-brand" aria-label="JokesFor home">
        <img src="/Logos/appicon_purple.svg" alt="" width={30} height={30} style={{ borderRadius: 8 }} />
        <span>JokesFor</span>
      </Link>
      <div className="lp-header-actions">
        <Link to="/login" className="lp-btn lp-btn-ghost">
          Sign in
        </Link>
        <Link to="/register" className="lp-btn lp-btn-primary lp-btn-sm">
          Start free
        </Link>
      </div>
    </header>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Hero — split layout: editorial headline + interactive try-it card
// ──────────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="lp-hero" aria-labelledby="lp-hero-title">
      <div className="lp-wrap lp-hero-grid">
        <div className="lp-hero-copy">
          <span className="eyebrow-mono">A new joke every morning</span>
          <h1 id="lp-hero-title" className="lp-h1">
            You're ten seconds from your new <span className="lp-hl">favorite joke.</span>
          </h1>
          <p className="lp-sub">
            Hand-picked, format-crafted, and blissfully free of recycled memes. Read them,
            react, save the best — and if you're funny, publish your own.
          </p>
          <div className="lp-cta-row">
            <Link to="/register" className="lp-btn lp-btn-primary">
              Start reading free <ArrowRight size={18} />
            </Link>
          </div>
          <p className="lp-trust">Free · no card · 10 fresh jokes a day.</p>
        </div>
        <div className="lp-hero-card">
          <TryItCard />
        </div>
      </div>
    </section>
  )
}

/**
 * TryItCard — the signature moment. A real setup with the punchline blurred via
 * `.punch-blur`; one tap (or keypress) reveals it with a smooth transition, then
 * a soft "Loved it? Sign up to keep reading →" appears. Fully keyboard-accessible
 * (native <button>), and the reveal transition is honored/skipped per
 * `prefers-reduced-motion` (handled in index.css + the scoped styles below).
 */
function TryItCard() {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="lp-try-stage">
      <div className="lp-try-block" aria-hidden />
      <article className={`lp-try-card ${revealed ? 'is-open' : ''}`}>
        <div className="lp-try-head">
          <span className="tag-flow">{FORMAT_LABEL.setup}</span>
          <span className="eyebrow-mono" style={{ letterSpacing: '0.2em' }}>
            Try it
          </span>
        </div>

        <p className="lp-try-setup">My therapist says I have a preoccupation with revenge.</p>

        <button
          type="button"
          className="lp-reveal-btn"
          onClick={() => setRevealed(true)}
          disabled={revealed}
          aria-label={revealed ? undefined : 'Reveal the punchline'}
          data-testid="try-it-reveal"
        >
          <span className={`lp-punch punch-blur ${revealed ? 'is-revealed' : ''}`}>
            We'll see about that.
          </span>
        </button>

        <div className="lp-try-foot">
          {revealed ? (
            <Link to="/register" className="lp-signup-line" data-testid="try-it-signup">
              Loved it? Sign up to keep reading <ArrowRight size={16} />
            </Link>
          ) : (
            <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
              Tap to reveal the punchline →
            </span>
          )}
        </div>
      </article>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// What it is — three beats: Discover → Reveal → Keep
// ──────────────────────────────────────────────────────────────────────────

const BEATS = [
  {
    icon: Sunrise,
    title: 'Discover',
    head: 'A fresh set every morning',
    body: 'Ten hand-picked jokes land at dawn. New material daily — never the same feed twice.',
    badgeBg: '#F2E9FF',
    iconColor: '#6A1CF6',
  },
  {
    icon: Eye,
    title: 'Reveal',
    head: 'Tap for the payoff',
    body: 'Every setup hides its punchline behind a blur. Tap when you are ready — the wait is the fun.',
    badgeBg: '#CAFD00',
    iconColor: '#3A4A00',
  },
  {
    icon: Bookmark,
    title: 'Keep',
    head: 'Save, react, build a streak',
    body: 'Bookmark the keepers, react in a tap, and watch your streak grow one morning at a time.',
    badgeBg: '#FFC965',
    iconColor: '#5F4200',
  },
] as const

function ThreeBeats() {
  return (
    <section className="lp-section" aria-labelledby="lp-beats-title">
      <div className="lp-wrap">
        <span className="eyebrow-mono">What it is</span>
        <h2 id="lp-beats-title" className="lp-h2">
          Discover, reveal, <em className="wink">keep.</em>
        </h2>
        <p className="lp-lead">Three small moments that turn into a daily habit.</p>
        <div className="lp-beats">
          {BEATS.map((b) => {
            const Icon = b.icon
            return (
              <div key={b.title} className="lp-beat">
                <span className="lp-beat-badge" style={{ background: b.badgeBg }}>
                  <Icon size={22} color={b.iconColor} />
                </span>
                <div className="eyebrow-mono" style={{ marginTop: 18 }}>
                  {b.title}
                </div>
                <h3 className="lp-beat-h">{b.head}</h3>
                <p className="lp-beat-p">{b.body}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Six formats — showcase the real card skins via JokeRenderer
// ──────────────────────────────────────────────────────────────────────────

interface ShowcaseJoke {
  fmt: FlowJokeFormat
  setup?: string
  punchline?: string
  text?: string
  lines?: string[]
  read?: string
}

const SHOWCASE: ShowcaseJoke[] = [
  {
    fmt: 'setup',
    setup: 'I finally told my suitcase we are not going on vacation this year.',
    punchline: 'Now I am dealing with a lot of emotional baggage.',
  },
  {
    fmt: 'oneliner',
    text: "I don't trust stairs. They're always up to something.",
  },
  {
    fmt: 'observ',
    text: "Nothing makes you feel poor faster than a waiter asking, 'Still or sparkling?'",
  },
  {
    fmt: 'anti',
    setup: 'What do you call a fish with no eyes?',
    punchline: 'A fish. It just cannot see very well.',
  },
  {
    fmt: 'knock',
    lines: ['Knock, knock.', "Who's there?", 'Interrupting cow.', 'Interrupting cow w—', 'MOO.'],
  },
  {
    fmt: 'story',
    text: "A man tells his doctor, 'I've broken my arm in three places.' The doctor nods and says, 'Well, stop going to those three places.'",
    read: '20 sec read',
  },
]

function FormatsShowcase() {
  return (
    <section className="lp-section lp-section-tint" aria-labelledby="lp-formats-title">
      <div className="lp-wrap">
        <span className="eyebrow-mono">Six formats · one library</span>
        <h2 id="lp-formats-title" className="lp-h2">
          Six ways to <em className="wink">laugh.</em>
        </h2>
        <p className="lp-lead">
          Some jokes need a setup. Some hit best in one breath. We render each format the
          way it actually lands.
        </p>
        <div className="lp-formats">
          {SHOWCASE.map((j) => {
            const skin = SKIN[j.fmt]
            return (
              <article
                key={j.fmt}
                className="lp-format-card"
                style={{ background: skin.bg, color: skin.fg, border: skin.border }}
              >
                <span className={`tag-flow ${tagToneFor(j.fmt)}`}>{FORMAT_LABEL[j.fmt]}</span>
                <JokeRenderer
                  payload={{
                    format: j.fmt,
                    text: j.text ?? '',
                    setup: j.setup ?? '',
                    punchline: j.punchline ?? '',
                    lines: j.lines ?? null,
                    media: null,
                  }}
                  interactive={false}
                  revealed
                  read={j.read}
                />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Why it's different
// ──────────────────────────────────────────────────────────────────────────

const WHY = [
  {
    head: 'Curated, not scraped.',
    body: 'Every joke is chosen by a human who actually thought it was funny. No bot-farmed, recycled feeds.',
  },
  {
    head: 'Every format, crafted.',
    body: 'Setups, one-liners, anti-jokes, stories — each one rendered the way it lands best.',
  },
  {
    head: 'A daily habit, not a doomscroll.',
    body: 'Ten jokes, then you are done. A ritual with an ending — not an endless feed built to trap you.',
  },
  {
    head: 'Made by real comedians.',
    body: 'Written and picked by people who do this for a living, not an algorithm chasing engagement.',
  },
]

function WhyDifferent() {
  return (
    <section className="lp-section" aria-labelledby="lp-why-title">
      <div className="lp-wrap">
        <span className="eyebrow-mono">Why it's different</span>
        <h2 id="lp-why-title" className="lp-h2">
          Not another <em className="wink">meme feed.</em>
        </h2>
        <div className="lp-why">
          {WHY.map((w) => (
            <div key={w.head} className="lp-why-item">
              <h3 className="lp-why-h">{w.head}</h3>
              <p className="lp-why-p">{w.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Creator hook — distinct dark / lime band
// ──────────────────────────────────────────────────────────────────────────

const CREATOR_PERKS = [
  'Publish in any of the six formats',
  'See exactly what lands — analytics built for comedians',
  'Grow real fans, not vanity followers',
]

function CreatorBand() {
  return (
    <section className="lp-section" aria-labelledby="lp-creator-title">
      <div className="lp-wrap">
        <div className="lp-band">
          <div>
            <span className="eyebrow-mono" style={{ color: '#CAFD00' }}>
              For creators
            </span>
            <h2 id="lp-creator-title" className="lp-band-h">
              Funny? Turn it into a <em className="wink" style={{ color: '#CAFD00' }}>following.</em>
            </h2>
            <p className="lp-band-p">
              Publish in any format, grow real fans, and see exactly what lands — analytics
              built for comedians, not influencers.
            </p>
            <div className="lp-cta-row">
              <Link to="/register" className="lp-btn lp-btn-lime">
                Become a creator <ArrowRight size={18} />
              </Link>
            </div>
          </div>
          <ul className="lp-perks">
            {CREATOR_PERKS.map((p) => (
              <li key={p} className="lp-perk">
                <span className="lp-perk-dot" aria-hidden>
                  <Check size={13} color="#3A4A00" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Get in early — honest early-access framing
// ──────────────────────────────────────────────────────────────────────────

function EarlyAccess() {
  return (
    <section className="lp-section" aria-labelledby="lp-early-title">
      <div className="lp-wrap">
        <div className="lp-early">
          <span className="tag-flow lime">Founding readers</span>
          <h2 id="lp-early-title" className="lp-h2" style={{ marginTop: 14 }}>
            Get in <em className="wink">early.</em>
          </h2>
          <p className="lp-lead" style={{ marginTop: 12 }}>
            JokesFor is just getting started. Be one of the first readers — the ones who
            shape what it becomes, and get bragging rights when everyone else shows up.
          </p>
        </div>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Final CTA
// ──────────────────────────────────────────────────────────────────────────

function FinalCta() {
  return (
    <section className="lp-section lp-final" aria-labelledby="lp-final-title">
      <div className="lp-final-glow" aria-hidden />
      <div className="lp-wrap" style={{ position: 'relative' }}>
        <span className="eyebrow-mono">One tap away</span>
        <h2 id="lp-final-title" className="lp-final-h">
          Your first joke is <em className="wink">waiting.</em>
        </h2>
        <div className="lp-cta-row" style={{ justifyContent: 'center', marginTop: 28 }}>
          <Link to="/register" className="lp-btn lp-btn-primary">
            Start reading free <ArrowRight size={18} />
          </Link>
        </div>
        <p className="lp-trust" style={{ textAlign: 'center' }}>
          Free · no card · 10 fresh jokes a day.
        </p>
      </div>
    </section>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Footer — slim: logo · Sign in · legal links
// ──────────────────────────────────────────────────────────────────────────

function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-wrap lp-footer-inner">
        <Link to="/" className="lp-brand" aria-label="JokesFor home">
          <img src="/Logos/appicon_purple.svg" alt="" width={26} height={26} style={{ borderRadius: 7 }} />
          <span style={{ fontSize: 16 }}>JokesFor</span>
        </Link>
        <nav className="lp-footer-links" aria-label="Footer">
          <Link to="/login">Sign in</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookie-policy">Cookie Policy</Link>
          <Link to="/childrens-privacy">Children's Privacy</Link>
        </nav>
        <span className="lp-copyright">© {new Date().getFullYear()} JokesFor</span>
      </div>
    </footer>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Scoped styles — responsive layout, hover/focus, tilt, reduced-motion.
// Inline styles can't express media queries / :hover / :focus-visible, so the
// landing's layout + interaction lives here (mirrors FlowAppShell's approach).
// ──────────────────────────────────────────────────────────────────────────

function LandingStyles() {
  return (
    <style>{`
      .lp-root { background:#FBFAF7; color:#1A1A1A; min-height:100vh; font-family:var(--font-sans); overflow-x:hidden; }
      .lp-root *, .lp-root *::before, .lp-root *::after { box-sizing:border-box; }
      .lp-wrap { max-width:1180px; margin:0 auto; padding-left:clamp(20px,4vw,56px); padding-right:clamp(20px,4vw,56px); }

      /* Focus visibility — accessible keyboard outline on every interactive element */
      .lp-root a:focus-visible, .lp-root button:focus-visible {
        outline:3px solid #6A1CF6; outline-offset:3px; border-radius:10px;
      }

      /* Header */
      .lp-header {
        position:sticky; top:0; z-index:20;
        display:flex; align-items:center; justify-content:space-between; gap:16px;
        padding:14px clamp(20px,4vw,56px);
        background:rgba(251,250,247,0.82);
        backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);
        border-bottom:1px solid #E9E8E7;
      }
      .lp-brand { display:flex; align-items:center; gap:10px; text-decoration:none; color:#1A1A1A; }
      .lp-brand span { font-family:var(--font-display); font-weight:800; font-size:18px; letter-spacing:-0.01em; }
      .lp-header-actions { display:flex; align-items:center; gap:10px; }

      /* Buttons */
      .lp-btn {
        display:inline-flex; align-items:center; justify-content:center; gap:8px;
        font-family:var(--font-sans); font-weight:700; text-decoration:none; cursor:pointer;
        border:0; border-radius:9999px; white-space:nowrap;
        transition:transform .12s ease, background .15s ease, box-shadow .15s ease;
      }
      .lp-btn:active { transform:translateY(1px); }
      .lp-btn-primary {
        background:#6A1CF6; color:#fff; height:54px; padding:0 26px; font-size:16px;
        box-shadow:0 10px 24px -8px rgba(106,28,246,0.5);
      }
      .lp-btn-primary:hover { background:#5D00E4; box-shadow:0 14px 32px -8px rgba(106,28,246,0.55); }
      .lp-btn-lime { background:#CAFD00; color:#3A4A00; height:54px; padding:0 26px; font-size:16px; }
      .lp-btn-lime:hover { background:#bff000; }
      .lp-btn-ghost {
        background:transparent; color:#1A1A1A; border:1px solid #E3E2E2;
        height:44px; padding:0 18px; font-size:14px; font-weight:600;
      }
      .lp-btn-ghost:hover { background:#F1EFEC; }
      .lp-btn-sm { height:44px; padding:0 20px; font-size:14px; box-shadow:none; }

      /* Hero */
      .lp-hero { position:relative; overflow:hidden; }
      .lp-hero-grid {
        display:grid; grid-template-columns:1.05fr 0.95fr; gap:clamp(32px,5vw,64px);
        align-items:center;
        padding-top:clamp(44px,7vw,84px); padding-bottom:clamp(52px,8vw,96px);
      }
      .lp-h1 {
        margin:18px 0 0; font-family:var(--font-display); font-weight:900;
        letter-spacing:-0.03em; line-height:0.98;
        font-size:clamp(2.6rem,6vw,4.4rem); color:#1A1A1A;
      }
      .lp-hl { background:linear-gradient(transparent 60%, #CAFD00 60%); padding:0 .05em; }
      .lp-sub { margin:22px 0 0; font-size:clamp(1.05rem,1.6vw,1.25rem); line-height:1.55; color:#52525B; max-width:36ch; }
      .lp-trust { margin:18px 0 0; font-family:var(--font-mono); font-size:12px; letter-spacing:0.05em; color:#6B7280; }
      .lp-cta-row { margin-top:30px; display:flex; flex-wrap:wrap; gap:14px; align-items:center; }

      /* Try-it card — the tilted "physical joke card" aesthetic risk */
      .lp-try-stage { position:relative; }
      .lp-try-block { position:absolute; inset:0; transform:rotate(3deg) translate(14px,16px); background:#CAFD00; border-radius:24px; }
      .lp-try-card {
        position:relative; background:#fff; border:1px solid #E9E8E7; border-radius:22px;
        padding:clamp(22px,3vw,30px);
        box-shadow:0 30px 60px -24px rgba(46,47,47,0.28);
        transform:rotate(-1.6deg);
        transition:transform .5s cubic-bezier(.2,.6,.2,1);
      }
      .lp-try-card.is-open { transform:rotate(0deg); }
      .lp-try-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
      .lp-try-setup { margin:16px 0 0; font-family:var(--font-display); font-weight:600; font-size:clamp(1.15rem,2vw,1.4rem); line-height:1.3; color:#1A1A1A; }
      .lp-reveal-btn { display:block; width:100%; text-align:left; background:transparent; border:0; padding:0; margin:14px 0 0; cursor:pointer; min-height:44px; }
      .lp-reveal-btn:disabled { cursor:default; }
      .lp-punch { display:block; font-family:var(--font-display); font-weight:900; letter-spacing:-0.02em; font-size:clamp(1.6rem,3vw,2.15rem); line-height:1.06; color:#1A1A1A; }
      .lp-try-foot { margin-top:18px; min-height:24px; }
      .lp-signup-line { display:inline-flex; align-items:center; gap:6px; font-family:var(--font-sans); font-weight:700; font-size:15px; color:#6A1CF6; text-decoration:none; }
      .lp-signup-line:hover { text-decoration:underline; }

      /* Sections */
      .lp-section { padding-top:clamp(46px,7vw,84px); padding-bottom:clamp(46px,7vw,84px); }
      .lp-section-tint { background:#FFFFFF; border-top:1px solid #F1EFEC; border-bottom:1px solid #F1EFEC; }
      .lp-h2 { margin:8px 0 0; font-family:var(--font-display); font-weight:900; letter-spacing:-0.02em; line-height:1.04; font-size:clamp(2rem,4.2vw,3.1rem); color:#1A1A1A; }
      .lp-lead { margin:14px 0 0; font-size:clamp(1.02rem,1.4vw,1.18rem); color:#52525B; max-width:58ch; line-height:1.55; }

      /* Three beats */
      .lp-beats { margin-top:clamp(28px,4vw,44px); display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
      .lp-beat { background:#fff; border:1px solid #E9E8E7; border-radius:20px; padding:26px; }
      .lp-beat-badge { display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:14px; }
      .lp-beat-h { margin:6px 0 0; font-family:var(--font-display); font-weight:800; font-size:1.28rem; color:#1A1A1A; }
      .lp-beat-p { margin:8px 0 0; color:#52525B; line-height:1.5; font-size:0.98rem; }

      /* Formats showcase — editorial masonry columns */
      .lp-formats { margin-top:clamp(28px,4vw,44px); columns:3; column-gap:18px; }
      .lp-format-card { break-inside:avoid; margin-bottom:18px; border-radius:18px; padding:22px; overflow:hidden; }

      /* Why it's different */
      .lp-why { margin-top:clamp(28px,4vw,44px); display:grid; grid-template-columns:repeat(2,1fr); gap:18px 40px; }
      .lp-why-item { border-top:2px solid #1A1A1A; padding-top:16px; }
      .lp-why-h { margin:0; font-family:var(--font-display); font-weight:800; font-size:1.2rem; color:#1A1A1A; }
      .lp-why-p { margin:8px 0 0; color:#52525B; line-height:1.55; }

      /* Creator band */
      .lp-band { background:#1A1A1A; color:#fff; border-radius:28px; padding:clamp(30px,5vw,56px); display:grid; grid-template-columns:1.1fr 0.9fr; gap:clamp(28px,4vw,48px); align-items:center; }
      .lp-band-h { margin:12px 0 0; font-family:var(--font-display); font-weight:900; letter-spacing:-0.02em; line-height:1.04; font-size:clamp(1.9rem,3.6vw,2.7rem); color:#fff; }
      .lp-band-p { margin:16px 0 0; color:rgba(255,255,255,0.72); line-height:1.55; font-size:1.05rem; max-width:44ch; }
      .lp-perks { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:14px; }
      .lp-perk { display:flex; align-items:flex-start; gap:12px; color:#fff; font-weight:600; font-size:1.02rem; line-height:1.4; }
      .lp-perk-dot { flex:0 0 auto; margin-top:2px; width:24px; height:24px; border-radius:50%; background:#CAFD00; display:inline-flex; align-items:center; justify-content:center; }

      /* Early access */
      .lp-early { background:#F2E9FF; border:1px solid #E6D6FF; border-radius:24px; padding:clamp(28px,4vw,44px); }

      /* Final CTA */
      .lp-final { position:relative; text-align:center; overflow:hidden; }
      .lp-final-glow { position:absolute; top:50%; left:50%; width:min(680px,90vw); height:340px; transform:translate(-50%,-50%); background:radial-gradient(ellipse at center, rgba(106,28,246,0.14), transparent 68%); pointer-events:none; }
      .lp-final-h { margin:8px auto 0; max-width:16ch; font-family:var(--font-display); font-weight:900; letter-spacing:-0.025em; line-height:1.0; font-size:clamp(2.4rem,6vw,4rem); color:#1A1A1A; }

      /* Footer */
      .lp-footer { border-top:1px solid #E9E8E7; background:#fff; }
      .lp-footer-inner { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:16px; padding-top:26px; padding-bottom:26px; }
      .lp-footer-links { display:flex; flex-wrap:wrap; align-items:center; gap:6px 20px; }
      .lp-footer-links a { display:inline-flex; align-items:center; min-height:44px; color:#6B7280; text-decoration:none; font-size:14px; font-weight:500; }
      .lp-footer-links a:hover { color:#6A1CF6; }
      .lp-copyright { color:#9A9A9A; font-size:13px; font-family:var(--font-mono); }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .lp-hero-grid { grid-template-columns:1fr; gap:38px; }
        .lp-hero-card { order:2; }
        .lp-try-card { transform:rotate(0deg); }
        .lp-try-block { transform:rotate(2.5deg) translate(8px,10px); }
        .lp-band { grid-template-columns:1fr; }
        .lp-formats { columns:2; }
        .lp-why { grid-template-columns:1fr; gap:0; }
        .lp-why-item { margin-top:18px; }
      }
      @media (max-width: 620px) {
        .lp-beats { grid-template-columns:1fr; }
        .lp-formats { columns:1; }
        .lp-sub { max-width:none; }
        .lp-btn-primary { height:52px; font-size:15px; }
        .lp-footer-inner { justify-content:flex-start; }
      }

      /* ── Reduced motion ── */
      @media (prefers-reduced-motion: reduce) {
        .lp-btn, .lp-try-card { transition:none !important; }
        .lp-try-card { transform:rotate(0deg) !important; }
      }
    `}</style>
  )
}
