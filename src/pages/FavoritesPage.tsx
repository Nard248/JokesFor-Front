import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router'
import { Heart, ArrowRight, Calendar, TrendingUp } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData } from '@/components/FlowJokeCard'
import { formatSlugToFlow } from '@/components/JokeRenderer'
import type { JokeMediaItem } from '@/lib/api'
import { useFavorites, useFavoriteStats } from '@/features/favorites'
import { useBreakpoint } from '@/hooks/useBreakpoint'

type RawFavorite = {
  joke: {
    id: number
    text: string
    setup: string | null
    punchline: string | null
    format?: { slug: string }
    media?: JokeMediaItem[]
  }
}

/**
 * FavoritesPage — redesigned for iteration 4.
 *
 * Sections:
 *   1. Hero (greeting + total favorited)
 *   2. Stats row (3 cards: total, top tone, this week)
 *   3. Tone filter chips
 *   4. Favorites masonry — FlowJokeCard
 *
 * Data: useFavorites() + useFavoriteStats() (mock-only adapter today;
 * real-API methods exist in api.ts for future flip).
 */
export function FavoritesPage() {
  const { isMobile, isTablet } = useBreakpoint()
  const masonryCols = isMobile ? 1 : isTablet ? 2 : 3
  const [tone, setTone] = useState<string | null>(null)

  // Current page — bumped by "Load more". Reset to 1 when the tone filter
  // changes so a new tone starts a fresh paginated listing.
  const [page, setPage] = useState(1)
  useEffect(() => setPage(1), [tone])

  const { data: favoritesData, isLoading, isError, isFetching } = useFavorites({
    tones: tone ?? undefined,
    page,
  })
  const { data: stats } = useFavoriteStats()

  const total = favoritesData?.count ?? 0

  // Accumulate favorites across pages (page 1 replaces, later pages append,
  // deduped by the underlying joke id).
  const [favorites, setFavorites] = useState<RawFavorite[]>([])
  useEffect(() => {
    if (!favoritesData) return
    const results = favoritesData.results as unknown as RawFavorite[]
    setFavorites((prev) => {
      if (page === 1) return results
      const seen = new Set(prev.map((f) => f.joke?.id))
      return [...prev, ...results.filter((f) => !seen.has(f.joke?.id))]
    })
  }, [favoritesData, page])
  const hasMore = favorites.length < total

  const flowFavorites = useMemo(
    () =>
      favorites
        .map((f, idx) => favoriteToFlowData(f, idx))
        .filter((j): j is FlowJokeData => j !== null),
    [favorites],
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="favorites">
        <div style={{ padding: '40px 0' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">Favorites · {total} total</span>
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
                The ones you <em className="wink">keep coming back to.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                Quick-access view of jokes you've heart-clicked. Filter by tone to find the right one fast.
              </p>
            </div>
            <Link
              to="/library"
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
              See full library <ArrowRight size={14} />
            </Link>
          </div>

          {/* Stats row */}
          <div
            style={{
              marginTop: 32,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
            }}
          >
            <StatCard
              eyebrow="All-time"
              value={String(stats?.totalCount ?? total)}
              label="Total favorites"
              icon={<Heart size={18} />}
              accent="purple"
            />
            <StatCard
              eyebrow="Top tone"
              value={stats?.topTone ?? '—'}
              label="Most-saved tone"
              icon={<TrendingUp size={18} />}
              accent="lime"
            />
            <StatCard
              eyebrow="This week"
              value={String(stats?.thisWeekCount ?? 0)}
              label="Saved in 7 days"
              icon={<Calendar size={18} />}
              accent="amber"
            />
          </div>

          {/* Tone filter rail */}
          <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="eyebrow-mono">Filter by tone</span>
            <ToneChip label="All" active={tone === null} onClick={() => setTone(null)} isMobile={isMobile} />
            {TONES.map((t) => (
              <ToneChip key={t.slug} label={t.label} active={tone === t.slug} onClick={() => setTone(t.slug)} isMobile={isMobile} />
            ))}
          </div>

          {/* Results */}
          <section style={{ marginTop: 24 }}>
            {isLoading ? (
              <FavoritesSkeleton cols={masonryCols} />
            ) : isError ? (
              <FavoritesError />
            ) : flowFavorites.length > 0 ? (
              <>
                <div style={{ columnCount: masonryCols, columnGap: 18 }}>
                  {flowFavorites.map((j) => (
                    <div key={j.id} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                      <FlowJokeCard joke={j} source="other" />
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
                      {isFetching ? 'Loading…' : `Load more · ${favorites.length} of ${total}`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <FavoritesEmpty filtering={tone !== null} />
            )}
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Stats card
// ──────────────────────────────────────────────────────────────────────────

interface StatCardProps {
  eyebrow: string
  value: string
  label: string
  icon: React.ReactNode
  accent: 'purple' | 'lime' | 'amber'
}

function StatCard({ eyebrow, value, label, icon, accent }: StatCardProps) {
  const palette = {
    purple: { bg: '#fff', border: '#E9E8E7', accentBg: '#6A1CF6', accentFg: '#fff' },
    lime: { bg: '#fff', border: '#E9E8E7', accentBg: '#CAFD00', accentFg: '#3A4A00' },
    amber: { bg: '#fff', border: '#E9E8E7', accentBg: '#FFC965', accentFg: '#5F4200' },
  }[accent]
  return (
    <div
      style={{
        padding: 24,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: palette.accentBg,
          color: palette.accentFg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow-mono">{eyebrow}</div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 28,
            color: '#1A1A1A',
            lineHeight: 1,
            marginTop: 2,
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Tone chip
// ──────────────────────────────────────────────────────────────────────────

function ToneChip({ label, active, onClick, isMobile }: { label: string; active: boolean; onClick: () => void; isMobile?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: 'pointer',
        height: isMobile ? 44 : 32,
        padding: isMobile ? '0 16px' : '0 14px',
        fontSize: 13,
        background: active ? '#1A1A1A' : '#fff',
        color: active ? '#fff' : '#1A1A1A',
        border: `1px solid ${active ? '#1A1A1A' : '#E9E8E7'}`,
        borderRadius: 9999,
        fontFamily: 'inherit',
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Empty + skeleton
// ──────────────────────────────────────────────────────────────────────────

function FavoritesEmpty({ filtering }: { filtering: boolean }) {
  return (
    <div
      style={{
        padding: '56px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        {filtering ? (
          <>
            Nothing in this tone <em className="wink">yet.</em>
          </>
        ) : (
          <>
            No favorites <em className="wink">yet.</em>
          </>
        )}
      </div>
      <p style={{ marginTop: 8, fontSize: 18, color: '#52525B' }}>
        {filtering ? 'Try another tone, or clear the filter.' : 'Heart-click jokes you love and they\'ll show up here.'}
      </p>
      <Link
        to="/explore"
        className="btn-flow-primary"
        style={{ display: 'inline-flex', marginTop: 16, height: 44, fontSize: 14, textDecoration: 'none' }}
      >
        Browse Explore <ArrowRight size={16} />
      </Link>
    </div>
  )
}

function FavoritesError() {
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
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 28, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
        Couldn't load your favorites.
      </div>
      <p style={{ marginTop: 8, fontSize: 16, color: '#52525B' }}>Check your connection and try again in a moment.</p>
    </div>
  )
}

function FavoritesSkeleton({ cols = 3 }: { cols?: number }) {
  return (
    <div style={{ columnCount: cols, columnGap: 18 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            breakInside: 'avoid',
            marginBottom: 18,
            padding: 24,
            background: '#fff',
            border: '1px solid #E9E8E7',
            borderRadius: 18,
            minHeight: 180,
          }}
        >
          <div style={{ height: 16, width: 100, background: '#F2F0F0', borderRadius: 4 }} />
          <div style={{ height: 32, background: '#F2F0F0', borderRadius: 6, marginTop: 16 }} />
          <div style={{ height: 16, background: '#F2F0F0', borderRadius: 4, marginTop: 8, width: '70%' }} />
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter — translate mock FavoriteJoke shape to FlowJokeData.
// FavoriteJoke from mock-data.ts has the joke text/setup/punchline + tones/etc.
// ──────────────────────────────────────────────────────────────────────────

export function favoriteToFlowData(fav: RawFavorite, idx: number): FlowJokeData | null {
  const fmt = formatSlugToFlow(fav.joke?.format?.slug)
  if (fmt === null) return null // unknown format → skip render, don't garble
  return {
    id: fav.joke?.id ?? idx,
    fmt,
    setup: fav.joke?.setup ?? undefined,
    punch: fav.joke?.punchline ?? undefined,
    text: fav.joke?.text ?? undefined,
    media: fav.joke?.media ?? undefined,
  }
}

// `slug` is the exact backend tone slug sent as the `tones` filter; `label`
// is the display text. `office` isn't a real tone — it's `office-proper`.
const TONES: { slug: string; label: string }[] = [
  { slug: 'wholesome', label: 'Wholesome' },
  { slug: 'office-proper', label: 'Office' },
  { slug: 'dad', label: 'Dad' },
  { slug: 'nerd', label: 'Nerd' },
  { slug: 'surreal', label: 'Surreal' },
  { slug: 'dark', label: 'Dark' },
  { slug: 'edgy', label: 'Edgy' },
]
