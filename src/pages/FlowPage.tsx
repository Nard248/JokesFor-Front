import { useState, useEffect, type ReactNode } from 'react'
import { useNavigate, Link } from 'react-router'
import { ArrowLeft, ArrowRight, Bell, Check, X } from 'lucide-react'
import { useUpdatePreferences } from '@/features/preferences'
import { useVibesCatalog, useMyVibes, useUpdateMyVibes } from '@/features/vibes'
import type { Vibe } from '@/lib/api'

/**
 * Flow — onboarding journey, redesigned per Docs/JokesFor/Flow.html.
 *
 * Three steps:
 *   1. Vibes   — pick at least 3 vibe cards (rich color/icon chips)
 *   2. Formats — pick joke formats (one-liner, setup, knock, story, anti, observational)
 *   3. Ritual  — set time + days + streak forecast (the Hooked-loop trigger)
 *
 * On finish: PATCH preferences, navigate to /flow-canvas.
 * Skip from any step jumps straight to /flow-canvas.
 */
export function FlowPage() {
  const navigate = useNavigate()
  const updatePreferences = useUpdatePreferences()
  const updateMyVibes = useUpdateMyVibes()

  // Real vibes catalog + user's existing selection (for resume case).
  const { data: vibesCatalog } = useVibesCatalog()
  const { data: myVibes } = useMyVibes()

  const [step, setStep] = useState(1)
  const [vibes, setVibes] = useState<Set<string>>(new Set())
  const [formats, setFormats] = useState<Set<string>>(new Set(['setup', 'oneliner', 'observ']))
  const [ritualTime, setRitualTime] = useState('09:00')
  const [ritualDays, setRitualDays] = useState<Set<string>>(new Set(['mon', 'tue', 'wed', 'thu', 'fri']))
  // streakSaver — set true by default; UI toggle in StepRitual is purely visual today (TODO wire).
  const [streakSaver] = useState(true)
  const [vibesError, setVibesError] = useState<string | null>(null)

  // Pre-select user's existing vibes when /users/me/vibes/ resolves.
  useEffect(() => {
    if (myVibes && myVibes.length > 0) {
      setVibes(new Set(myVibes.map((mv) => mv.vibe.slug)))
    }
  }, [myVibes])

  const skip = () => navigate('/flow-canvas', { replace: true })

  const advanceFromVibes = () => {
    if (vibes.size < 3) {
      setVibesError('Pick at least 3 vibes to continue.')
      return
    }
    setVibesError(null)
    // PUT /users/me/vibes/ — atomically replaces selection.
    updateMyVibes.mutate(Array.from(vibes), {
      onSuccess: () => setStep(2),
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
        setVibesError(msg ?? 'Could not save vibes. Try again?')
      },
    })
  }

  const finish = () => {
    updatePreferences.mutate(
      {
        tones: Array.from(vibes), // legacy synonym for categories
        humorTypes: Array.from(formats),
        languages: ['english'],
        // P8: ritual scheduling — converted to snake_case by the adapter.
        notificationEnabled: true,
        notificationTime: ritualTime,
        notificationDays: Array.from(ritualDays),
        streakSaverEnabled: streakSaver,
        onboardingCompleted: true,
      },
      {
        onSettled: () => navigate('/flow-canvas', { replace: true }),
      },
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7', display: 'flex', flexDirection: 'column' }}>
      {/* Header — logo, progress, skip */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 32px',
          borderBottom: '1px solid #E9E8E7',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#1A1A1A' }}>
          <img src="/Logos/appicon_purple.svg" alt="" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>
            JokesFor
          </span>
        </Link>
        <div style={{ flex: 1, maxWidth: 400, margin: '0 32px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: s <= step ? '#6A1CF6' : '#E9E8E7',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={skip}
          className="eyebrow-mono"
          style={{
            color: '#52525B',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Skip <X size={12} />
        </button>
      </header>

      {/* Main */}
      <main style={{ flex: 1, padding: '56px 88px', display: 'flex', flexDirection: 'column' }}>
        {step === 1 && (
          <StepVibes
            catalog={vibesCatalog}
            vibes={vibes}
            error={vibesError}
            onToggle={(id) =>
              setVibes((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
          />
        )}
        {step === 2 && (
          <StepFormats
            formats={formats}
            onToggle={(id) =>
              setFormats((prev) => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
          />
        )}
        {step === 3 && (
          <StepRitual
            time={ritualTime}
            onTime={setRitualTime}
            days={ritualDays}
            onToggleDay={(d) =>
              setRitualDays((prev) => {
                const next = new Set(prev)
                if (next.has(d)) next.delete(d)
                else next.add(d)
                return next
              })
            }
          />
        )}
      </main>

      {/* Footer — back / continue */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 32px',
          borderTop: '1px solid #E9E8E7',
          background: '#fff',
        }}
      >
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            style={{
              cursor: 'pointer',
              color: '#52525B',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              background: 'none',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ fontSize: 13, color: '#6B7280' }}>You can change this anytime.</span>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 1) advanceFromVibes()
                else setStep((s) => s + 1)
              }}
              disabled={
                (step === 1 && (vibes.size < 3 || updateMyVibes.isPending)) ||
                (step === 2 && formats.size === 0)
              }
              className="btn-flow-primary"
            >
              {step === 1 && updateMyVibes.isPending ? 'Saving…' : 'Continue'}{' '}
              {!(step === 1 && updateMyVibes.isPending) && <ArrowRight size={16} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={updatePreferences.isPending}
              className="btn-flow-primary"
            >
              {updatePreferences.isPending ? 'Saving…' : "Done — show me today's joke"}
              {!updatePreferences.isPending && <ArrowRight size={16} />}
            </button>
          )}
        </div>
      </footer>

      {/* Locally-scoped button styles to avoid touching global CSS */}
      <style>{`
        .btn-flow-primary {
          height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
          font-family: var(--font-sans); font-weight: 700; font-size: 15px;
          background: #6A1CF6; color: #fff; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background 0.12s ease, transform 0.12s ease;
        }
        .btn-flow-primary:hover { background: #5D00E4; }
        .btn-flow-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-flow-primary:active { transform: translateY(1px); }
      `}</style>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 1 — Vibes
// ──────────────────────────────────────────────────────────────────────────

function StepVibes({
  catalog,
  vibes,
  error,
  onToggle,
}: {
  catalog: Vibe[] | undefined
  vibes: Set<string>
  error: string | null
  onToggle: (slug: string) => void
}) {
  return (
    <StepShell
      step={1}
      eyebrow="Vibes"
      title={
        <>
          What's your <em className="wink">flavor</em> of funny?
        </>
      }
      sub="Pick at least 3. We'll tune your daily joke around these — and you can always change them later."
    >
      {!catalog ? (
        <VibesSkeleton />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {catalog.map((v) => {
            const on = vibes.has(v.slug)
            return (
              <button
                key={v.slug}
                type="button"
                onClick={() => onToggle(v.slug)}
                aria-pressed={on}
                style={{
                  position: 'relative',
                  height: 160,
                  borderRadius: 18,
                  padding: 18,
                  border: `2px solid ${on ? v.swatch_bg : '#E9E8E7'}`,
                  background: on ? v.swatch_bg : '#fff',
                  color: on ? v.swatch_fg : '#1A1A1A',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'transform 0.12s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: 32 }}>{v.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{v.subtitle}</div>
                </div>
                {on && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: v.swatch_fg,
                      color: v.swatch_bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
      {error && (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(214, 67, 43, 0.08)',
            border: '1px solid rgba(214, 67, 43, 0.2)',
            color: '#A02B16',
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="tag-flow lime">{vibes.size} picked</span>
        <span style={{ fontSize: 13, color: '#6B7280' }}>
          {vibes.size < 3 ? `Pick at least 3 to continue.` : 'Aim for 3–6. Pick more, get more variety.'}
        </span>
      </div>
    </StepShell>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 2 — Formats
// ──────────────────────────────────────────────────────────────────────────

const FORMATS = [
  { id: 'oneliner', label: 'One-liner',        sub: 'Single punch.',                       demo: "I told my wife she was drawing her eyebrows too high. She seemed surprised." },
  { id: 'setup',    label: 'Setup → punchline', sub: 'The classic two-beat.',              demo: "Why don't scientists trust atoms? Because they make up everything." },
  { id: 'knock',    label: 'Knock-knock',       sub: 'Conversational reveal.',             demo: "Knock, knock. Lettuce in, it's freezing." },
  { id: 'story',    label: 'Story / shaggy',    sub: 'Long-form, slow burn.',              demo: 'A man walks into a library and asks for a book on paranoia…' },
  { id: 'anti',     label: 'Anti-joke',         sub: 'Refuses to land.',                   demo: 'Why did the chicken cross the road? To get to the other side.' },
  { id: 'observ',   label: 'Observational',     sub: 'Quote-style.',                       demo: "Adulthood is just emailing 'Sounds good!' until one of you dies." },
]

function StepFormats({ formats, onToggle }: { formats: Set<string>; onToggle: (id: string) => void }) {
  return (
    <StepShell
      step={2}
      eyebrow="Formats"
      title={
        <>
          How do you like your jokes <em className="wink">delivered</em>?
        </>
      }
      sub="Some people love the slow burn. Others want a one-liner and out. Pick whatever you'll actually finish reading."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {FORMATS.map((f) => {
          const on = formats.has(f.id)
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onToggle(f.id)}
              aria-pressed={on}
              style={{
                position: 'relative',
                borderRadius: 18,
                padding: 24,
                border: `2px solid ${on ? '#6A1CF6' : '#E9E8E7'}`,
                background: on ? '#F2E9FF' : '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                minHeight: 240,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="eyebrow-mono" style={{ color: on ? '#6A1CF6' : '#6B7280' }}>
                  {f.label}
                </span>
                {on && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      background: '#6A1CF6',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={13} strokeWidth={3} />
                  </div>
                )}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 18,
                  color: on ? '#6A1CF6' : '#1A1A1A',
                }}
              >
                {f.sub}
              </div>
              <div
                style={{
                  flex: 1,
                  padding: 14,
                  background: '#fff',
                  border: '1px dashed #E9E8E7',
                  borderRadius: 12,
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: '#52525B',
                  lineHeight: 1.4,
                }}
              >
                "{f.demo}"
              </div>
            </button>
          )
        })}
      </div>
    </StepShell>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Step 3 — Ritual
// ──────────────────────────────────────────────────────────────────────────

const SLOTS: { time: string; lbl: string }[] = [
  { time: '07:00', lbl: 'Pre-coffee' },
  { time: '08:00', lbl: 'Commute' },
  { time: '09:00', lbl: 'Office in' },
  { time: '12:00', lbl: 'Lunch' },
  { time: '17:00', lbl: 'Wind-down' },
  { time: '21:00', lbl: 'Late night' },
]

const DAYS: { id: string; lbl: string }[] = [
  { id: 'mon', lbl: 'M' },
  { id: 'tue', lbl: 'T' },
  { id: 'wed', lbl: 'W' },
  { id: 'thu', lbl: 'T' },
  { id: 'fri', lbl: 'F' },
  { id: 'sat', lbl: 'S' },
  { id: 'sun', lbl: 'S' },
]

function StepRitual({
  time,
  onTime,
  days,
  onToggleDay,
}: {
  time: string
  onTime: (t: string) => void
  days: Set<string>
  onToggleDay: (d: string) => void
}) {
  return (
    <StepShell
      step={3}
      eyebrow="Ritual"
      title={
        <>
          When should the <em className="wink">joke</em> arrive?
        </>
      }
      sub="One push per day. The most-loved time is 9:00 AM, with morning coffee. Pick whatever fits your routine."
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 36, alignItems: 'start' }}>
        {/* Left — slot picker + day picker + toggle */}
        <div>
          <span className="eyebrow-mono">Pick a slot</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              marginTop: 10,
            }}
          >
            {SLOTS.map((s) => {
              const on = s.time === time
              return (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => onTime(s.time)}
                  aria-pressed={on}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 14,
                    border: `1px solid ${on ? '#6A1CF6' : '#E9E8E7'}`,
                    background: on ? '#6A1CF6' : '#fff',
                    color: on ? '#fff' : '#1A1A1A',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 24,
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    textAlign: 'left',
                  }}
                >
                  <div>{s.time}</div>
                  <div
                    className="eyebrow-mono"
                    style={{ marginTop: 4, opacity: 0.7, color: on ? 'rgba(255,255,255,0.85)' : '#6B7280' }}
                  >
                    {s.lbl}
                  </div>
                </button>
              )
            })}
          </div>

          <span className="eyebrow-mono" style={{ display: 'block', marginTop: 32 }}>
            Days of the week
          </span>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {DAYS.map((d) => {
              const on = days.has(d.id)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onToggleDay(d.id)}
                  aria-pressed={on}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    border: `1px solid ${on ? '#1A1A1A' : '#E9E8E7'}`,
                    background: on ? '#1A1A1A' : '#fff',
                    color: on ? '#CAFD00' : '#52525B',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                >
                  {d.lbl}
                </button>
              )
            })}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              border: '1px solid #E9E8E7',
              borderRadius: 14,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: '#F2E9FF',
                color: '#6A1CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bell size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
                Send a streak-saver if I miss the day
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                One gentle nudge at 8 PM if you haven't read.
              </div>
            </div>
            <div style={{ width: 36, height: 22, borderRadius: 11, background: '#6A1CF6', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#fff',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right — preview + streak forecast */}
        <div>
          <span className="eyebrow-mono">Preview</span>
          <div
            style={{
              marginTop: 10,
              padding: 24,
              borderRadius: 18,
              background: 'linear-gradient(160deg, #0F0E12, #1F1B2A)',
              color: '#fff',
            }}
          >
            <div className="eyebrow-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>
              JOKESFOR · {time}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginTop: 6, lineHeight: 1.3 }}>
              Today's joke is ready. Day 1 — let's begin it.
            </div>
            <div
              style={{
                marginTop: 12,
                padding: 12,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 10,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Tap to open · 1 swipe to save · ~8 sec total
            </div>
          </div>
          <div style={{ marginTop: 18, padding: 18, borderRadius: 14, background: '#CAFD00', color: '#3A4A00' }}>
            <div className="eyebrow-mono" style={{ color: '#3A4A00' }}>
              Streak forecast
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 36, marginTop: 4 }}>
              {days.size * 2} days
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Average for someone with your settings.</div>
          </div>
        </div>
      </div>
    </StepShell>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Shared step shell — eyebrow + title + sub + body
// ──────────────────────────────────────────────────────────────────────────

interface StepShellProps {
  step: number
  eyebrow: string
  title: ReactNode
  sub: string
  children: ReactNode
}

function StepShell({ step, eyebrow, title, sub, children }: StepShellProps) {
  return (
    <>
      <span className="eyebrow-mono">
        Step {step} of 3 · {eyebrow}
      </span>
      <h2
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
          lineHeight: 1.05,
          maxWidth: 880,
        }}
      >
        {title}
      </h2>
      <p style={{ marginTop: 14, fontSize: 18, color: '#52525B', lineHeight: 1.5, maxWidth: 680 }}>{sub}</p>
      <div style={{ marginTop: 36, flex: 1 }}>{children}</div>
    </>
  )
}

function VibesSkeleton() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14,
      }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 160,
            borderRadius: 18,
            background: '#F4F2EE',
            border: '2px solid #E9E8E7',
          }}
        />
      ))}
    </div>
  )
}
