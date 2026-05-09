import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Search as SearchIcon, Dice5, Bell } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { FlowJokeCard, type FlowJokeData, type FlowJokeFormat } from '@/components/FlowJokeCard'

/**
 * Explore — three-axis chip-rail filter + format-aware masonry results.
 * Per Docs/JokesFor/parts/flow-screens.jsx (07 · EXPLORE).
 *
 * Three filter axes:
 *   - FORMAT  ("how it lands"): one-liner, setup, knock, story, anti, observ
 *   - THEME   ("what it's about"): work, family, food, tech, school, …
 *   - CATEGORY ("how it feels"): wholesome, office, dad, kid, nerd, surreal, dark, edgy
 *
 * Results render as a 3-column masonry of FlowJokeCard. Stack any chips.
 * Editorial tiles (curator note, weekly special) interleave when there's room.
 */
export function ExplorePage() {
  const { user } = useAuth()
  const [fmts, setFmts] = useState<Set<FlowJokeFormat>>(new Set())
  const [themes, setThemes] = useState<Set<string>>(new Set())
  const [cats, setCats] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () =>
      MOCK_JOKES.filter(
        (j) =>
          (fmts.size === 0 || fmts.has(j.fmt)) &&
          (themes.size === 0 || themes.has(j.theme ?? '')) &&
          (cats.size === 0 || cats.has(j.cat ?? '')),
      ),
    [fmts, themes, cats],
  )

  const activeCount = fmts.size + themes.size + cats.size
  const clearAll = () => {
    setFmts(new Set())
    setThemes(new Set())
    setCats(new Set())
  }

  const firstName = user?.first_name || user?.username || 'friend'

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="explore" firstName={firstName}>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 32, alignItems: 'end' }}>
            <div>
              <span className="eyebrow-mono">Explore · {MOCK_JOKES.length} jokes loaded</span>
              <h2
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                  color: '#1A1A1A',
                }}
              >
                Find a joke <em className="wink">for any moment.</em>
              </h2>
              <p style={{ marginTop: 14, fontSize: 18, color: '#52525B', maxWidth: 520 }}>
                Filter by format (how it lands), theme (what it's about), and category (how it feels). Stack as many as you like.
              </p>
            </div>
            <Link
              to="/search"
              style={{
                padding: 14,
                background: '#fff',
                border: '1px solid #E9E8E7',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                textDecoration: 'none',
                color: '#1A1A1A',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#F2E9FF',
                  color: '#6A1CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <SearchIcon size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Or describe the moment…</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Try "first day at work" or "wedding toast"</div>
              </div>
              <span className="tag-flow">⌘K</span>
            </Link>
          </div>

          {/* ── Three-axis chip rails ── */}
          <div
            style={{
              marginTop: 36,
              padding: '24px 28px',
              background: '#fff',
              border: '1px solid #E9E8E7',
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(15,14,18,0.04)',
            }}
          >
            <FilterRow label="Format" sub="How it lands" eyebrowColor="#1A1A1A">
              {FORMATS.map((f) => (
                <ChipFilter
                  key={f.id}
                  active={fmts.has(f.id)}
                  onClick={() => toggleSet(setFmts, f.id)}
                  color="#1A1A1A"
                >
                  {f.label}
                </ChipFilter>
              ))}
            </FilterRow>
            <FilterRow label="Theme" sub="What it's about" eyebrowColor="#6A1CF6" topBorder>
              {THEMES.map((t) => (
                <ChipFilter
                  key={t.id}
                  active={themes.has(t.id)}
                  onClick={() => toggleSet(setThemes, t.id)}
                  color="#6A1CF6"
                >
                  {t.label}
                </ChipFilter>
              ))}
            </FilterRow>
            <FilterRow label="Category" sub="How it feels" eyebrowColor="#3A4A00" topBorder>
              {CATEGORIES.map((c) => (
                <ChipFilter
                  key={c.id}
                  active={cats.has(c.id)}
                  onClick={() => toggleSet(setCats, c.id)}
                  color="#CAFD00"
                >
                  {c.label}
                </ChipFilter>
              ))}
            </FilterRow>
          </div>

          {/* Active filters bar */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="eyebrow-mono">
              {filtered.length} of {MOCK_JOKES.length} jokes
              {activeCount > 0 ? ` · ${activeCount} filter${activeCount > 1 ? 's' : ''} on` : ' · no filters'}
            </span>
            {activeCount > 0 && (
              <>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from(fmts).map((id) => {
                    const f = FORMATS.find((x) => x.id === id)
                    return (
                      <Chip
                        key={'f' + id}
                        background="#1A1A1A"
                        color="#fff"
                        onClick={() => toggleSet(setFmts, id)}
                      >
                        {f?.label} ✕
                      </Chip>
                    )
                  })}
                  {Array.from(themes).map((id) => {
                    const t = THEMES.find((x) => x.id === id)
                    return (
                      <Chip
                        key={'t' + id}
                        background="#6A1CF6"
                        color="#fff"
                        onClick={() => toggleSet(setThemes, id)}
                      >
                        {t?.label} ✕
                      </Chip>
                    )
                  })}
                  {Array.from(cats).map((id) => {
                    const c = CATEGORIES.find((x) => x.id === id)
                    return (
                      <Chip
                        key={'c' + id}
                        background="#CAFD00"
                        color="#3A4A00"
                        onClick={() => toggleSet(setCats, id)}
                      >
                        {c?.label} ✕
                      </Chip>
                    )
                  })}
                </div>
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    height: 30,
                    fontSize: 12,
                    padding: '0 12px',
                    marginLeft: 'auto',
                    border: '1px solid #E9E8E7',
                    borderRadius: 9999,
                    background: 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          {/* ── Results: format-aware masonry ── */}
          {filtered.length > 0 ? (
            <div style={{ marginTop: 24, columnCount: 3, columnGap: 18 }}>
              {filtered.map((j, i) => (
                <div key={j.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                  <FlowJokeCard joke={j} />
                  {/* Curator note interleaved */}
                  {i === 4 && (
                    <div
                      style={{
                        marginTop: 18,
                        padding: 28,
                        borderRadius: 18,
                        background: '#6A1CF6',
                        color: '#fff',
                      }}
                    >
                      <span className="eyebrow-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>
                        Curator note
                      </span>
                      <div
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontStyle: 'italic',
                          fontWeight: 600,
                          fontSize: 24,
                          lineHeight: 1.25,
                          marginTop: 10,
                        }}
                      >
                        “This week leaned hard into puns. <em style={{ color: '#CAFD00' }}>We're not apologizing.</em>”
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          fontFamily: 'var(--font-mono)',
                          fontSize: 11,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          opacity: 0.7,
                        }}
                      >
                        — The JokesFor desk
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState onClear={clearAll} />
          )}
        </div>
      </FlowAppShell>

      <ExploreStyles />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Filter row + chip components
// ──────────────────────────────────────────────────────────────────────────

interface FilterRowProps {
  label: string
  sub: string
  eyebrowColor: string
  topBorder?: boolean
  children: React.ReactNode
}

function FilterRow({ label, sub, eyebrowColor, topBorder, children }: FilterRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        alignItems: 'center',
        gap: 18,
        padding: '14px 0',
        borderTop: topBorder ? '1px solid #E9E8E7' : '0',
      }}
    >
      <div>
        <span className="eyebrow-mono" style={{ color: eyebrowColor }}>
          {label}
        </span>
        <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginTop: 2 }}>
          {sub}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}

interface ChipFilterProps {
  active: boolean
  onClick: () => void
  color: string
  children: React.ReactNode
}

function ChipFilter({ active, onClick, color, children }: ChipFilterProps) {
  const fg = active ? (color === '#CAFD00' ? '#3A4A00' : '#fff') : '#1A1A1A'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: 'pointer',
        height: 34,
        padding: '0 14px',
        fontSize: 13,
        whiteSpace: 'nowrap',
        background: active ? color : '#fff',
        color: fg,
        border: `1px solid ${active ? color : '#E9E8E7'}`,
        borderRadius: 9999,
        fontFamily: 'inherit',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  )
}

interface ChipProps {
  background: string
  color: string
  onClick: () => void
  children: React.ReactNode
}

function Chip({ background, color, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        fontSize: 12,
        padding: '0 12px',
        background,
        color,
        border: `1px solid ${background}`,
        borderRadius: 9999,
        fontFamily: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div
      style={{
        marginTop: 32,
        padding: '56px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: 32,
          letterSpacing: '-0.02em',
          color: '#1A1A1A',
        }}
      >
        No jokes match <em className="wink">all that.</em>
      </div>
      <p style={{ marginTop: 8, fontSize: 18, color: '#52525B' }}>
        Try removing a filter — or surrender and let the editors choose.
      </p>
      <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button type="button" onClick={onClear} className="btn-flow-primary" style={{ height: 42 }}>
          Clear filters
        </button>
        <button type="button" className="btn-flow-ghost" style={{ height: 42 }}>
          <Dice5 size={14} /> Surprise me
        </button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Reused shell — same as FlowCanvas; keeping inline so pages are independent.
// If a third Flow page appears, extract into a shared component.
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

function ExploreStyles() {
  return (
    <style>{`
      .btn-flow-primary {
        height: 48px; padding: 0 24px; border: 0; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 700; font-size: 15px;
        background: #6A1CF6; color: #fff; cursor: pointer;
        display: inline-flex; align-items: center; gap: 8px;
        transition: background 0.12s ease;
      }
      .btn-flow-primary:hover { background: #5D00E4; }
      .btn-flow-ghost {
        height: 40px; padding: 0 16px; border: 1px solid #E9E8E7; border-radius: 9999px;
        font-family: var(--font-sans); font-weight: 600; font-size: 13px;
        background: transparent; color: #1A1A1A; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: background 0.12s ease;
      }
      .btn-flow-ghost:hover { background: #F4F2EE; }
    `}</style>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function toggleSet<T>(setter: (updater: (prev: Set<T>) => Set<T>) => void, value: T) {
  setter((prev) => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })
}

// ──────────────────────────────────────────────────────────────────────────
// Static data — replace with real /jokes/ + /tones/ + /context-tags/
// when the adapter gets backend wiring.
// ──────────────────────────────────────────────────────────────────────────

const FORMATS: { id: FlowJokeFormat; label: string }[] = [
  { id: 'oneliner', label: 'One-liner' },
  { id: 'setup', label: 'Setup → Punchline' },
  { id: 'knock', label: 'Knock-knock' },
  { id: 'story', label: 'Story' },
  { id: 'anti', label: 'Anti-joke' },
  { id: 'observ', label: 'Observational' },
]

const THEMES = [
  { id: 'work', label: 'Work' },
  { id: 'family', label: 'Family' },
  { id: 'food', label: 'Food' },
  { id: 'tech', label: 'Tech' },
  { id: 'school', label: 'School' },
  { id: 'dating', label: 'Dating' },
  { id: 'animals', label: 'Animals' },
  { id: 'science', label: 'Science' },
  { id: 'travel', label: 'Travel' },
  { id: 'money', label: 'Money' },
  { id: 'weather', label: 'Weather' },
  { id: 'mondays', label: 'Mondays' },
]

const CATEGORIES = [
  { id: 'wholesome', label: 'Wholesome' },
  { id: 'office', label: 'Office-proper' },
  { id: 'dad', label: 'Dad' },
  { id: 'kid', label: 'Kid-safe' },
  { id: 'nerd', label: 'Nerd' },
  { id: 'surreal', label: 'Surreal' },
  { id: 'dark', label: 'Dark' },
  { id: 'edgy', label: 'Edgy' },
]

interface ExploreJoke extends FlowJokeData {
  theme: string
  cat: string
}

const MOCK_JOKES: ExploreJoke[] = [
  { id: 1, fmt: 'setup', setup: "Why don't scientists trust atoms anymore?", punch: 'Because they make up everything.', theme: 'science', themeLabel: 'Science', cat: 'nerd', catLabel: 'Nerd', saves: '4.1K', laughs: '612' },
  { id: 2, fmt: 'oneliner', text: 'I told my wife she was drawing her eyebrows too high. She seemed surprised.', theme: 'family', themeLabel: 'Family', cat: 'dad', catLabel: 'Dad', saves: '2.8K', laughs: '411' },
  { id: 3, fmt: 'observ', text: "Adulthood is just emailing 'Sounds good!' back and forth until one of you dies.", theme: 'work', themeLabel: 'Work', cat: 'office', catLabel: 'Office-proper', saves: '4.8K', laughs: '904' },
  { id: 4, fmt: 'setup', setup: "What's the difference between a hippo and a Zippo?", punch: 'One is really heavy and the other is a little lighter.', theme: 'animals', themeLabel: 'Animals', cat: 'dad', catLabel: 'Dad', saves: '1.1K', laughs: '203' },
  { id: 5, fmt: 'oneliner', text: 'I used to hate facial hair. But then it grew on me.', theme: 'family', themeLabel: 'Family', cat: 'wholesome', catLabel: 'Wholesome', saves: '2.2K', laughs: '389' },
  { id: 6, fmt: 'setup', setup: 'Why did the scarecrow win an award?', punch: 'He was outstanding in his field.', theme: 'animals', themeLabel: 'Animals', cat: 'dad', catLabel: 'Dad', saves: '3.4K', laughs: '522' },
  { id: 7, fmt: 'anti', setup: 'Why did the chicken cross the road?', punch: 'To get to the other side.', theme: 'animals', themeLabel: 'Animals', cat: 'surreal', catLabel: 'Surreal', saves: '771', laughs: '189' },
  { id: 8, fmt: 'observ', text: 'My therapist said growth is uncomfortable. So is this email.', theme: 'work', themeLabel: 'Work', cat: 'office', catLabel: 'Office-proper', saves: '3.0K', laughs: '450' },
  { id: 9, fmt: 'oneliner', text: "I'm reading a book about anti-gravity. It's impossible to put down.", theme: 'science', themeLabel: 'Science', cat: 'nerd', catLabel: 'Nerd', saves: '1.9K', laughs: '312' },
  { id: 10, fmt: 'knock', lines: ['Knock, knock.', "Who's there?", 'Lettuce.', 'Lettuce who?', "Lettuce in. It's freezing out here."], theme: 'weather', themeLabel: 'Weather', cat: 'kid', catLabel: 'Kid-safe', saves: '1.4K', laughs: '267' },
  { id: 11, fmt: 'story', text: "A man walks into a library and asks the librarian for a book on paranoia. She whispers, 'They're right behind you.' He turned around — and to his relief, only a stack of returns. He picked one off the top: 'How to Trust Strangers.' He's been on chapter one for six years.", theme: 'work', themeLabel: 'Work', cat: 'surreal', catLabel: 'Surreal', read: '2 min', saves: '892', laughs: '341' },
  { id: 12, fmt: 'observ', text: "Coffee doesn't ask silly questions. Coffee understands.", theme: 'food', themeLabel: 'Coffee', cat: 'wholesome', catLabel: 'Wholesome', saves: '2.1K', laughs: '388' },
  { id: 13, fmt: 'oneliner', text: 'My password is the last 8 digits of pi.', theme: 'tech', themeLabel: 'Tech', cat: 'nerd', catLabel: 'Nerd', saves: '3.6K', laughs: '714' },
  { id: 14, fmt: 'setup', setup: 'How many programmers does it take to change a lightbulb?', punch: "None. That's a hardware problem.", theme: 'tech', themeLabel: 'Tech', cat: 'nerd', catLabel: 'Nerd', saves: '2.3K', laughs: '402' },
  { id: 15, fmt: 'anti', setup: "What's red and bad for your teeth?", punch: 'A brick.', theme: 'food', themeLabel: 'Food', cat: 'surreal', catLabel: 'Surreal', saves: '1.0K', laughs: '244' },
]
