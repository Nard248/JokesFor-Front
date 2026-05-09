import { useState, useMemo } from 'react'
import { Link } from 'react-router'
import { Search, Plus, ArrowRight, Bookmark } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData } from '@/components/FlowJokeCard'
import { useCollections } from '@/features/collections'
import { useSavedJokes } from '@/features/saved-jokes'

/**
 * LibraryPage — redesigned in the dev iteration to match the new design
 * language. Wraps in FlowAppShell so the top-nav is consistent across
 * Today / Explore / Search / Library.
 *
 * Iteration 4 reskin: legacy LibraryPage used CollectionCard + SavedJokeRow
 * components with the old visual language. They stay in the codebase
 * (untouched, used elsewhere) but this page no longer imports them.
 */
export function LibraryPage() {
  const [query, setQuery] = useState('')
  const { data: collectionsData } = useCollections()
  const { data: savedJokesData } = useSavedJokes()

  const collections = collectionsData?.results ?? []
  const savedJokes = savedJokesData?.results ?? []

  const filteredCollections = useMemo(() => {
    if (!query.trim()) return collections
    const q = query.toLowerCase()
    return collections.filter((c) => c.name.toLowerCase().includes(q))
  }, [query, collections])

  const filteredSaves = useMemo(() => {
    if (!query.trim()) return savedJokes
    const q = query.toLowerCase()
    return savedJokes.filter((s) => (s.joke?.text ?? '').toLowerCase().includes(q))
  }, [query, savedJokes])

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">Your library · {savedJokes.length} saved</span>
              <h2
                style={{
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 900,
                  fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  lineHeight: 1.05,
                }}
              >
                Your <em className="wink">canon.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                Every joke you've kept. Organized into collections, searchable, retrievable in seconds.
              </p>
            </div>
            <button type="button" className="btn-flow-primary" style={{ height: 48, fontSize: 14 }}>
              <Plus size={16} /> New collection
            </button>
          </div>

          {/* Search bar */}
          <div
            style={{
              marginTop: 32,
              padding: 8,
              paddingLeft: 18,
              background: '#fff',
              border: '1px solid #E9E8E7',
              borderRadius: 9999,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              maxWidth: 640,
            }}
          >
            <Search size={16} color="#6A1CF6" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library by collection or joke text…"
              aria-label="Search library"
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                outline: 'none',
                color: '#1A1A1A',
                fontSize: 14,
                fontFamily: 'var(--font-sans)',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="btn-flow-ghost"
                style={{ height: 32, padding: '0 12px', fontSize: 11 }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Collections grid */}
          <section style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="eyebrow-mono">Collections</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 28,
                    marginTop: 4,
                    letterSpacing: '-0.02em',
                    color: '#1A1A1A',
                  }}
                >
                  {filteredCollections.length === 1 ? 'One' : filteredCollections.length} <em className="wink">curated</em>{' '}
                  {filteredCollections.length === 1 ? 'set' : 'sets'}.
                </h3>
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#52525B',
                }}
              >
                Click to open
              </span>
            </div>

            {filteredCollections.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                }}
              >
                {filteredCollections.map((c, i) => (
                  <CollectionTile key={c.id} name={c.name} count={c.joke_count} isDefault={c.is_default} index={i} />
                ))}
              </div>
            ) : (
              <CollectionsEmpty searching={!!query.trim()} />
            )}
          </section>

          {/* Recent saves */}
          <section style={{ marginTop: 56 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <span className="eyebrow-mono">Recently saved</span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 800,
                    fontSize: 28,
                    marginTop: 4,
                    letterSpacing: '-0.02em',
                    color: '#1A1A1A',
                  }}
                >
                  Things you've <em className="wink">kept.</em>
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
                Find more in Explore <ArrowRight size={14} />
              </Link>
            </div>

            {filteredSaves.length > 0 ? (
              <div style={{ columnCount: 3, columnGap: 18 }}>
                {filteredSaves.slice(0, 12).map((s) => (
                  <div key={s.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                    <FlowJokeCard joke={savedJokeToFlowData(s)} />
                  </div>
                ))}
              </div>
            ) : (
              <SavesEmpty searching={!!query.trim()} />
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Tile components
// ──────────────────────────────────────────────────────────────────────────

interface CollectionTileProps {
  name: string
  count: number
  isDefault: boolean
  index: number
}

function CollectionTile({ name, count, isDefault, index }: CollectionTileProps) {
  // Cycle through 4 background tints to give the grid visual rhythm.
  const tints = [
    { bg: '#fff', border: '#E9E8E7', accent: '#6A1CF6' },
    { bg: '#F2E9FF', border: '#E8DAFF', accent: '#6A1CF6' },
    { bg: '#FBFAF7', border: '#E9E8E7', accent: '#1A1A1A' },
    { bg: '#fff', border: '#E9E8E7', accent: '#5F4200' },
  ]
  const tint = tints[index % tints.length]

  return (
    <button
      type="button"
      style={{
        position: 'relative',
        padding: 24,
        background: tint.bg,
        border: `1px solid ${tint.border}`,
        borderRadius: 18,
        textAlign: 'left',
        cursor: 'pointer',
        minHeight: 160,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
        fontFamily: 'inherit',
        color: '#1A1A1A',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 28px rgba(15,14,18,0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: tint.accent,
          color: tint.accent === '#1A1A1A' ? '#CAFD00' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Bookmark size={18} />
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 20,
            color: '#1A1A1A',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {name}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#52525B',
          }}
        >
          {count} {count === 1 ? 'joke' : 'jokes'}
          {isDefault && ' · Default'}
        </div>
      </div>
    </button>
  )
}

function CollectionsEmpty({ searching }: { searching: boolean }) {
  return (
    <div
      style={{
        padding: '48px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 24,
          color: '#1A1A1A',
          letterSpacing: '-0.01em',
        }}
      >
        {searching ? (
          <>
            No collections match <em className="wink">that.</em>
          </>
        ) : (
          <>
            Your <em className="wink">first</em> collection awaits.
          </>
        )}
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: '#52525B' }}>
        {searching
          ? 'Try a shorter search, or create a new collection.'
          : 'Group your saved jokes into themes — "Office-safe", "Wedding speech", "Dad jokes" — anything that helps you find them later.'}
      </p>
      <button type="button" className="btn-flow-primary" style={{ marginTop: 16, height: 42, fontSize: 13 }}>
        <Plus size={14} /> Create collection
      </button>
    </div>
  )
}

function SavesEmpty({ searching }: { searching: boolean }) {
  return (
    <div
      style={{
        padding: '48px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 24,
          color: '#1A1A1A',
          letterSpacing: '-0.01em',
        }}
      >
        {searching ? (
          <>
            Nothing saved matches <em className="wink">that.</em>
          </>
        ) : (
          <>
            No jokes saved <em className="wink">yet.</em>
          </>
        )}
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: '#52525B' }}>
        {searching ? 'Loosen the search and try again.' : "Save jokes you love and they'll show up here for quick access."}
      </p>
      <Link to="/explore" className="btn-flow-primary" style={{ display: 'inline-flex', marginTop: 16, height: 42, fontSize: 13, textDecoration: 'none' }}>
        Browse Explore <ArrowRight size={14} />
      </Link>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter — translates a real-API SavedJoke into FlowJokeData.
// Format inference is lossy (legacy Joke has format.slug; we map to FlowJokeFormat).
// ──────────────────────────────────────────────────────────────────────────

function savedJokeToFlowData(saved: {
  id: number
  joke: { id: number; text: string; setup: string | null; punchline: string | null; format?: { slug: string } }
}): FlowJokeData {
  const slug = saved.joke?.format?.slug ?? 'oneliner'
  const fmt =
    slug === 'setup_punchline' || slug === 'setup-punchline'
      ? 'setup'
      : slug === 'one_liner' || slug === 'one-liner'
      ? 'oneliner'
      : slug === 'observational'
      ? 'observ'
      : slug === 'anti_joke' || slug === 'anti-joke'
      ? 'anti'
      : slug === 'knock_knock' || slug === 'knock-knock'
      ? 'knock'
      : slug === 'story'
      ? 'story'
      : 'oneliner'

  return {
    id: saved.id,
    fmt,
    setup: saved.joke?.setup ?? undefined,
    punch: saved.joke?.punchline ?? undefined,
    text: saved.joke?.text ?? undefined,
  }
}
