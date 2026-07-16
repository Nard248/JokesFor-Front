import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router'
import { Search as SearchIcon, Dice5 } from 'lucide-react'
import { FlowJokeCard, jokeToFlowData } from '@/components/FlowJokeCard'
import { type FlowJokeFormat, FLOW_FORMAT_TO_BACKEND_SLUG } from '@/components/JokeRenderer'
import { FlowAppShell } from '@/components/FlowAppShell'
import { useJokeSearch, type JokeSearchParams, type Joke } from '@/features/jokes'
import { useBreakpoint } from '@/hooks/useBreakpoint'

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
 */
export function ExplorePage() {
  const { isMobile, isTablet } = useBreakpoint()
  const masonryCols = isMobile ? 1 : isTablet ? 2 : 3
  const [fmts, setFmts] = useState<Set<FlowJokeFormat>>(new Set())
  const [themes, setThemes] = useState<Set<string>>(new Set())
  const [cats, setCats] = useState<Set<string>>(new Set())

  // Current page — bumped by "Load more". Reset to 1 whenever the filter axes
  // change (below) so a new filter starts a fresh paginated listing.
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [fmts, themes, cats])

  // Build the real /jokes/ query from the three chip axes. `page` keeps the
  // query enabled even with no filters (so the default listing shows real
  // jokes, not an empty grid). Filters map to the backend params per the API:
  //   Format chips  → joke_format (backend format slug)
  //   Theme chips   → context_tags (comma slugs)
  //   Category chips→ tones (comma slugs)
  const params = useMemo<JokeSearchParams>(() => {
    const p: JokeSearchParams = { page, page_size: 30, ordering: '-created_at' }
    if (fmts.size > 0) {
      p.joke_format = Array.from(fmts).map((f) => FLOW_FORMAT_TO_BACKEND_SLUG[f]).join(',')
    }
    if (themes.size > 0) p.context_tags = Array.from(themes).join(',')
    if (cats.size > 0) p.tones = Array.from(cats).join(',')
    return p
  }, [fmts, themes, cats, page])

  const { data, isLoading, isError, isFetching } = useJokeSearch(params)
  const totalCount = data?.count ?? 0

  // Accumulate results across pages. Page 1 (fresh filter/first load) replaces;
  // later pages append, deduped by id so a keepPreviousData transition can't
  // double-insert the current page.
  const [jokes, setJokes] = useState<Joke[]>([])
  useEffect(() => {
    if (!data) return
    setJokes((prev) => {
      if (page === 1) return data.results
      const seen = new Set(prev.map((j) => j.id))
      return [...prev, ...data.results.filter((j) => !seen.has(j.id))]
    })
  }, [data, page])
  const hasMore = jokes.length < totalCount

  const activeCount = fmts.size + themes.size + cats.size
  const clearAll = () => {
    setFmts(new Set())
    setThemes(new Set())
    setCats(new Set())
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="explore">
        <div style={{ padding: '40px 0' }}>
          {/* Hero */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: isMobile ? 20 : 32, alignItems: 'end' }}>
            <div>
              <span className="eyebrow-mono">Explore · {totalCount} jokes loaded</span>
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
              marginTop: isMobile ? 24 : 36,
              padding: isMobile ? '16px 16px' : '24px 28px',
              background: '#fff',
              border: '1px solid #E9E8E7',
              borderRadius: 20,
              boxShadow: '0 4px 20px rgba(15,14,18,0.04)',
            }}
          >
            <FilterRow label="Format" sub="How it lands" eyebrowColor="#1A1A1A" isMobile={isMobile}>
              {FORMATS.map((f) => (
                <ChipFilter
                  key={f.id}
                  active={fmts.has(f.id)}
                  onClick={() => toggleSet(setFmts, f.id)}
                  color="#1A1A1A"
                  isMobile={isMobile}
                >
                  {f.label}
                </ChipFilter>
              ))}
            </FilterRow>
            <FilterRow label="Theme" sub="What it's about" eyebrowColor="#6A1CF6" topBorder isMobile={isMobile}>
              {THEMES.map((t) => (
                <ChipFilter
                  key={t.id}
                  active={themes.has(t.id)}
                  onClick={() => toggleSet(setThemes, t.id)}
                  color="#6A1CF6"
                  isMobile={isMobile}
                >
                  {t.label}
                </ChipFilter>
              ))}
            </FilterRow>
            <FilterRow label="Category" sub="How it feels" eyebrowColor="#3A4A00" topBorder isMobile={isMobile}>
              {CATEGORIES.map((c) => (
                <ChipFilter
                  key={c.id}
                  active={cats.has(c.id)}
                  onClick={() => toggleSet(setCats, c.id)}
                  color="#CAFD00"
                  isMobile={isMobile}
                >
                  {c.label}
                </ChipFilter>
              ))}
            </FilterRow>
          </div>

          {/* Active filters bar */}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <span className="eyebrow-mono">
              {totalCount} joke{totalCount === 1 ? '' : 's'}
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
          {isLoading ? (
            <ResultsSkeleton cols={masonryCols} />
          ) : isError ? (
            <ErrorState />
          ) : jokes.length > 0 ? (
            <>
            <div style={{ marginTop: 24, columnCount: masonryCols, columnGap: 18 }}>
              {jokes.map((joke) => (
                <div key={joke.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                  {/* Link to the real detail so a click opens the correct joke and
                      logs a real view (?source=explore). */}
                  <Link to={`/jokes/${joke.id}?source=explore`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <FlowJokeCard joke={jokeToFlowData(joke)} source="explore" />
                  </Link>
                </div>
              ))}
            </div>
            {hasMore && (
              <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  className="btn-flow-ghost"
                  style={{ height: 44, padding: '0 24px' }}
                  disabled={isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {isFetching ? 'Loading…' : `Load more · ${jokes.length} of ${totalCount}`}
                </button>
              </div>
            )}
            </>
          ) : (
            <EmptyState onClear={clearAll} />
          )}
        </div>
      </FlowAppShell>
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
  isMobile?: boolean
  children: React.ReactNode
}

function FilterRow({ label, sub, eyebrowColor, topBorder, isMobile, children }: FilterRowProps) {
  return (
    <div
      style={{
        display: 'grid',
        // Stack the label above the chips on mobile so the chip rail gets full width.
        gridTemplateColumns: isMobile ? '1fr' : '110px 1fr',
        alignItems: isMobile ? 'start' : 'center',
        gap: isMobile ? 10 : 18,
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
  isMobile?: boolean
  children: React.ReactNode
}

function ChipFilter({ active, onClick, color, isMobile, children }: ChipFilterProps) {
  const fg = active ? (color === '#CAFD00' ? '#3A4A00' : '#fff') : '#1A1A1A'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: 'pointer',
        height: isMobile ? 44 : 34,
        padding: isMobile ? '0 16px' : '0 14px',
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

function ResultsSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div style={{ marginTop: 24, columnCount: cols, columnGap: 18 }} aria-busy="true">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            breakInside: 'avoid',
            marginBottom: 18,
            height: 160 + (i % 3) * 40,
            background: '#F2F0F0',
            borderRadius: 18,
          }}
        />
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <div
      style={{
        marginTop: 24,
        padding: '48px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Couldn't load jokes.
      </div>
      <p style={{ marginTop: 8, fontSize: 16, color: '#52525B' }}>Check your connection and try again in a moment.</p>
    </div>
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

// `id` is the exact backend tone slug sent as `tones`. Verified against
// /jokes/?tones=… — `office`/`kid` returned 0 rows, the real slugs are
// `office-proper` (10) and `kid-safe` (22).
const CATEGORIES = [
  { id: 'wholesome', label: 'Wholesome' },
  { id: 'office-proper', label: 'Office-proper' },
  { id: 'dad', label: 'Dad' },
  { id: 'kid-safe', label: 'Kid-safe' },
  { id: 'nerd', label: 'Nerd' },
  { id: 'surreal', label: 'Surreal' },
  { id: 'dark', label: 'Dark' },
  { id: 'edgy', label: 'Edgy' },
]
