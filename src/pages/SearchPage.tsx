import { useState, useMemo, useRef, useEffect, type ReactNode } from 'react'
import { useSearchParams, Link } from 'react-router'
import { Search as SearchIcon, Dice5 } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData, type FlowJokeFormat } from '@/components/FlowJokeCard'

/**
 * SearchPage — Sentence Builder redesign per
 * Docs/JokesFor/parts/flow-screens.jsx::SearchScreen.
 *
 * Pattern: "Show me [Format] jokes about [Theme] that feel [Category]."
 * Each bracket is a clickable inline pill that opens a multi-select panel.
 * Optional keyword refine input below.
 *
 * Iteration 2 wires to mock data (same shape as /explore). When the
 * /jokes/?q=&joke_format=&tones=&… endpoint grows the format/theme/category
 * dimensions, swap the filter to TanStack Query against api-adapter.jokes.search.
 */
export function SearchPage() {
  const [searchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [q, setQ] = useState(initialQuery)
  const [fmts, setFmts] = useState<Set<FlowJokeFormat>>(new Set())
  const [themes, setThemes] = useState<Set<string>>(new Set())
  const [cats, setCats] = useState<Set<string>>(new Set())
  const [openPanel, setOpenPanel] = useState<'fmt' | 'theme' | 'cat' | null>(null)

  const matches = useMemo(() => {
    const lcQ = q.toLowerCase()
    return MOCK_JOKES.filter(
      (j) =>
        (fmts.size === 0 || fmts.has(j.fmt)) &&
        (themes.size === 0 || themes.has(j.theme)) &&
        (cats.size === 0 || cats.has(j.cat)) &&
        (lcQ === '' || (j.text ?? j.setup ?? '').toLowerCase().includes(lcQ)),
    )
  }, [q, fmts, themes, cats])

  const fmtLabel =
    fmts.size === 0
      ? 'any kind of'
      : fmts.size === 1
      ? FORMATS.find((f) => f.id === [...fmts][0])?.label.toLowerCase()
      : `${fmts.size} formats`
  const themeLabel =
    themes.size === 0
      ? 'anything'
      : themes.size === 1
      ? THEMES.find((t) => t.id === [...themes][0])?.label.toLowerCase()
      : `${themes.size} themes`
  const catLabel =
    cats.size === 0
      ? 'any vibe'
      : cats.size === 1
      ? CATEGORIES.find((c) => c.id === [...cats][0])?.label.toLowerCase()
      : `${cats.size} vibes`

  const closePanel = () => setOpenPanel(null)

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="search">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', position: 'relative' }}>
          <span className="eyebrow-mono">Search · Build the moment</span>
          <h2
            style={{
              marginTop: 8,
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 'clamp(2.25rem, 4.5vw, 3rem)',
              letterSpacing: '-0.02em',
              color: '#1A1A1A',
              maxWidth: 1100,
            }}
          >
            What's the <em className="wink">moment</em>?
          </h2>
          <p style={{ marginTop: 8, fontSize: 18, color: '#52525B', maxWidth: 580 }}>
            Skip the keyword guessing. Compose the moment as a sentence — JokesFor matches the rhythm.
          </p>

          {/* Sentence Builder */}
          <div
            style={{
              marginTop: 36,
              padding: 'clamp(28px, 4vw, 40px) clamp(24px, 4vw, 36px)',
              background: '#fff',
              border: '1px solid #E9E8E7',
              borderRadius: 24,
              boxShadow: '0 8px 30px rgba(15,14,18,0.05)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(1.75rem, 4vw, 2.875rem)',
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                color: '#1A1A1A',
                textWrap: 'balance' as const,
              }}
            >
              Show me{' '}
              <SBPillContainer>
                <SBPill
                  open={openPanel === 'fmt'}
                  onClick={() => setOpenPanel(openPanel === 'fmt' ? null : 'fmt')}
                  label={fmtLabel ?? 'any kind of'}
                  color="#1A1A1A"
                  isSet={fmts.size > 0}
                />
                {openPanel === 'fmt' && (
                  <SBPanel
                    items={FORMATS}
                    selected={fmts}
                    onToggle={(id) => toggleSet(setFmts, id as FlowJokeFormat)}
                    color="#1A1A1A"
                    onClose={closePanel}
                    onClear={() => setFmts(new Set())}
                  />
                )}
              </SBPillContainer>{' '}
              jokes about{' '}
              <SBPillContainer>
                <SBPill
                  open={openPanel === 'theme'}
                  onClick={() => setOpenPanel(openPanel === 'theme' ? null : 'theme')}
                  label={themeLabel ?? 'anything'}
                  color="#6A1CF6"
                  isSet={themes.size > 0}
                />
                {openPanel === 'theme' && (
                  <SBPanel
                    items={THEMES}
                    selected={themes}
                    onToggle={(id) => toggleSet(setThemes, id)}
                    color="#6A1CF6"
                    onClose={closePanel}
                    onClear={() => setThemes(new Set())}
                  />
                )}
              </SBPillContainer>{' '}
              that feel{' '}
              <SBPillContainer>
                <SBPill
                  open={openPanel === 'cat'}
                  onClick={() => setOpenPanel(openPanel === 'cat' ? null : 'cat')}
                  label={catLabel ?? 'any vibe'}
                  color="#CAFD00"
                  isSet={cats.size > 0}
                />
                {openPanel === 'cat' && (
                  <SBPanel
                    items={CATEGORIES}
                    selected={cats}
                    onToggle={(id) => toggleSet(setCats, id)}
                    color="#CAFD00"
                    onClose={closePanel}
                    onClear={() => setCats(new Set())}
                  />
                )}
              </SBPillContainer>
              .
            </div>

            {/* Optional keyword refine */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: '1px solid #E9E8E7',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
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
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Refine with a keyword (optional) — e.g. coffee, mondays, mother-in-law…"
                style={{
                  flex: 1,
                  height: 36,
                  border: 0,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 16,
                  outline: 'none',
                  background: 'transparent',
                  color: '#1A1A1A',
                }}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  className="btn-flow-ghost"
                  style={{ height: 32, padding: '0 12px', fontSize: 11 }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick-prompt chips */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="eyebrow-mono">Or try</span>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => {
                  setFmts(new Set(qp.fmts as FlowJokeFormat[]))
                  setThemes(new Set(qp.themes))
                  setCats(new Set(qp.cats))
                  setQ('')
                }}
                style={{
                  cursor: 'pointer',
                  height: 32,
                  padding: '0 14px',
                  fontSize: 12,
                  borderRadius: 9999,
                  border: '1px solid #E9E8E7',
                  background: '#fff',
                  color: '#1A1A1A',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
              >
                {qp.label}
              </button>
            ))}
          </div>

          {/* Results header */}
          <div style={{ marginTop: 36, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span className="eyebrow-mono">
              {matches.length} match{matches.length === 1 ? '' : 'es'}
            </span>
            <span className="eyebrow-mono">Sort: relevance ↓</span>
          </div>

          {matches.length > 0 ? (
            <div style={{ marginTop: 14, columnCount: 3, columnGap: 18 }}>
              {matches.map((j) => (
                <div key={j.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                  {/* Link to detail so a click logs a real view (?source=search). */}
                  <Link to={`/jokes/${j.id}?source=search`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <FlowJokeCard joke={j} source="search" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                marginTop: 14,
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
                No jokes for that exact <em className="wink">sentence.</em>
              </div>
              <p style={{ marginTop: 8, fontSize: 18, color: '#52525B' }}>
                Loosen one of the pills, or surrender — we'll surprise you.
              </p>
              <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setFmts(new Set())
                    setCats(new Set())
                  }}
                  className="btn-flow-primary"
                  style={{ height: 42 }}
                >
                  Loosen filters
                </button>
                <button type="button" className="btn-flow-ghost" style={{ height: 42 }}>
                  <Dice5 size={14} /> Surprise me
                </button>
              </div>
            </div>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Sentence Builder pill + dropdown panel
// ──────────────────────────────────────────────────────────────────────────

function SBPillContainer({ children }: { children: ReactNode }) {
  return <span style={{ position: 'relative', display: 'inline-block' }}>{children}</span>
}

interface SBPillProps {
  open: boolean
  onClick: () => void
  label: string
  color: string
  isSet: boolean
}

function SBPill({ open, onClick, label, color, isSet }: SBPillProps) {
  const fg = isSet ? (color === '#CAFD00' ? '#3A4A00' : '#fff') : color
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 14px',
        borderRadius: 9999,
        background: isSet ? color : 'transparent',
        color: fg,
        border: isSet ? `2px solid ${color}` : `2px dashed ${color}`,
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        fontSize: 'inherit',
        lineHeight: 'inherit',
        letterSpacing: 'inherit',
        cursor: 'pointer',
      }}
    >
      {label}
      <span style={{ fontSize: '55%', transform: open ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }}>▾</span>
    </button>
  )
}

interface SBPanelProps<T extends string> {
  items: { id: T; label: string }[]
  selected: Set<T>
  onToggle: (id: T) => void
  color: string
  onClose: () => void
  onClear: () => void
}

function SBPanel<T extends string>({ items, selected, onToggle, color, onClose, onClear }: SBPanelProps<T>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handleClick), 0)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  const fgFor = (active: boolean) => (active ? (color === '#CAFD00' ? '#3A4A00' : '#fff') : '#1A1A1A')

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: 14,
        zIndex: 10,
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 18,
        padding: 18,
        boxShadow: '0 12px 40px rgba(15,14,18,0.16)',
        minWidth: 380,
        maxWidth: 520,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span className="eyebrow-mono">Pick one or many</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            background: 0,
            border: 0,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#52525B',
          }}
        >
          Clear
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it) => {
          const active = selected.has(it.id)
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => onToggle(it.id)}
              aria-pressed={active}
              style={{
                cursor: 'pointer',
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                borderRadius: 9999,
                background: active ? color : '#fff',
                color: fgFor(active),
                border: `1px solid ${active ? color : '#E9E8E7'}`,
                fontFamily: 'inherit',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {it.label}
            </button>
          )
        })}
      </div>
    </div>
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
// Static data — same as ExplorePage; consolidate if a third consumer appears.
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

const QUICK_PROMPTS: { label: string; fmts: string[]; themes: string[]; cats: string[] }[] = [
  { label: 'First day at work', fmts: [], themes: ['work'], cats: ['wholesome'] },
  { label: 'Wedding toast', fmts: [], themes: ['dating'], cats: ['wholesome'] },
  { label: 'Dad-joke ammo', fmts: ['oneliner'], themes: ['family'], cats: ['dad'] },
  { label: 'Group-chat unhinged', fmts: [], themes: [], cats: ['edgy'] },
  { label: 'Office Slack-safe', fmts: ['oneliner', 'observ'], themes: ['work'], cats: ['office'] },
]

interface SearchJoke extends FlowJokeData {
  theme: string
  cat: string
}

const MOCK_JOKES: SearchJoke[] = [
  { id: 1, fmt: 'setup', setup: "Why don't scientists trust atoms anymore?", punch: 'Because they make up everything.', theme: 'science', themeLabel: 'Science', cat: 'nerd', catLabel: 'Nerd' },
  { id: 2, fmt: 'oneliner', text: 'I told my wife she was drawing her eyebrows too high. She seemed surprised.', theme: 'family', themeLabel: 'Family', cat: 'dad', catLabel: 'Dad' },
  { id: 3, fmt: 'observ', text: "Adulthood is just emailing 'Sounds good!' back and forth until one of you dies.", theme: 'work', themeLabel: 'Work', cat: 'office', catLabel: 'Office-proper' },
  { id: 4, fmt: 'setup', setup: "What's the difference between a hippo and a Zippo?", punch: 'One is really heavy and the other is a little lighter.', theme: 'animals', themeLabel: 'Animals', cat: 'dad', catLabel: 'Dad' },
  { id: 5, fmt: 'oneliner', text: 'I used to hate facial hair. But then it grew on me.', theme: 'family', themeLabel: 'Family', cat: 'wholesome', catLabel: 'Wholesome' },
  { id: 6, fmt: 'setup', setup: 'Why did the scarecrow win an award?', punch: 'He was outstanding in his field.', theme: 'animals', themeLabel: 'Animals', cat: 'dad', catLabel: 'Dad' },
  { id: 7, fmt: 'anti', setup: 'Why did the chicken cross the road?', punch: 'To get to the other side.', theme: 'animals', themeLabel: 'Animals', cat: 'surreal', catLabel: 'Surreal' },
  { id: 8, fmt: 'observ', text: 'My therapist said growth is uncomfortable. So is this email.', theme: 'work', themeLabel: 'Work', cat: 'office', catLabel: 'Office-proper' },
  { id: 9, fmt: 'oneliner', text: "I'm reading a book about anti-gravity. It's impossible to put down.", theme: 'science', themeLabel: 'Science', cat: 'nerd', catLabel: 'Nerd' },
  { id: 10, fmt: 'knock', lines: ['Knock, knock.', "Who's there?", 'Lettuce.', 'Lettuce who?', "Lettuce in. It's freezing out here."], theme: 'weather', themeLabel: 'Weather', cat: 'kid', catLabel: 'Kid-safe' },
  { id: 11, fmt: 'story', text: "A man walks into a library and asks the librarian for a book on paranoia. She whispers, 'They're right behind you.'", theme: 'work', themeLabel: 'Work', cat: 'surreal', catLabel: 'Surreal', read: '30 sec' },
  { id: 12, fmt: 'observ', text: "Coffee doesn't ask silly questions. Coffee understands.", theme: 'food', themeLabel: 'Coffee', cat: 'wholesome', catLabel: 'Wholesome' },
  { id: 13, fmt: 'oneliner', text: 'My password is the last 8 digits of pi.', theme: 'tech', themeLabel: 'Tech', cat: 'nerd', catLabel: 'Nerd' },
  { id: 14, fmt: 'setup', setup: 'How many programmers does it take to change a lightbulb?', punch: "None. That's a hardware problem.", theme: 'tech', themeLabel: 'Tech', cat: 'nerd', catLabel: 'Nerd' },
  { id: 15, fmt: 'anti', setup: "What's red and bad for your teeth?", punch: 'A brick.', theme: 'food', themeLabel: 'Food', cat: 'surreal', catLabel: 'Surreal' },
]
