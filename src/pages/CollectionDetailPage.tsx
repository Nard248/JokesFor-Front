import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData, type FlowJokeFormat } from '@/components/FlowJokeCard'
import { useCollections, useCollectionJokes } from '@/features/collections'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/**
 * CollectionDetailPage — lists the saved jokes in a single collection.
 *
 * Backend: CollectionViewSet.jokes action —
 *   GET /api/v1/collections/:id/jokes/  → PaginatedResponse<SavedJoke>
 * Each SavedJoke embeds the full joke (SavedJokeSerializer). We reuse
 * FlowJokeCard to render them, matching the LibraryPage saves grid.
 */
export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const collectionId = Number(id)
  const { isMobile, isTablet } = useBreakpoint()
  const masonryCols = isMobile ? 1 : isTablet ? 2 : 3

  // The jokes endpoint doesn't return the collection's own name, so pull it
  // from the already-cached collections list for the header.
  const { data: collectionsData } = useCollections()
  const collection = collectionsData?.results.find((c) => c.id === collectionId)

  const { data, isLoading, isError, refetch } = useCollectionJokes(collectionId)
  const saves = data?.results ?? []

  const title = collection?.name ?? 'Collection'

  const flowJokes = useMemo(() => saves.map(savedJokeToFlowData), [saves])

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px 0', maxWidth: 1080, margin: '0 auto' }}>
          <Link
            to="/collections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#6A1CF6',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={16} /> All collections
          </Link>

          {/* Hero */}
          <div style={{ marginTop: 16 }}>
            <span className="eyebrow-mono">
              Collection{collection ? ` · ${collection.joke_count} ${collection.joke_count === 1 ? 'joke' : 'jokes'}` : ''}
            </span>
            <h2
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 3.25rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
              }}
            >
              {title}
            </h2>
          </div>

          <section style={{ marginTop: 40 }}>
            {!Number.isFinite(collectionId) || collectionId <= 0 ? (
              <StateCard>That collection link looks broken.</StateCard>
            ) : isLoading ? (
              <StateCard>Loading jokes…</StateCard>
            ) : isError ? (
              <StateCard>
                Couldn't load this collection.{' '}
                <button type="button" className="btn-flow-ghost" style={{ height: 34, fontSize: 12 }} onClick={() => refetch()}>
                  Retry
                </button>
              </StateCard>
            ) : flowJokes.length === 0 ? (
              <StateCard>
                No jokes in this collection yet. Save jokes to it from anywhere in the app and they'll show up here.
              </StateCard>
            ) : (
              <div style={{ columnCount: masonryCols, columnGap: 18 }}>
                {flowJokes.map((joke) => (
                  <div key={joke.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                    <FlowJokeCard joke={joke} source="other" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────

function StateCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '48px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
        color: '#52525B',
        fontSize: 15,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Translate a real-API SavedJoke into FlowJokeData. Mirrors LibraryPage's
 * mapper (format inference is lossy — legacy Joke has format.slug).
 */
function savedJokeToFlowData(saved: {
  id: number
  joke: { id: number; text: string; setup: string | null; punchline: string | null; format?: { slug: string } }
}): FlowJokeData {
  const slug = saved.joke?.format?.slug ?? 'oneliner'
  const fmt: FlowJokeFormat =
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
