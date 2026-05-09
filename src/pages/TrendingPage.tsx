import { useState } from 'react'
import { Link } from 'react-router'
import { Flame, TrendingUp, ArrowRight } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData, type FlowJokeFormat } from '@/components/FlowJokeCard'
import {
  useTrendingJokes,
  useTrendingTags,
  useRisingTopics,
  useTopJokesters,
  usePopularThemes,
} from '@/features/trending'

/**
 * TrendingPage — redesigned for iteration 4.
 *
 * Sections:
 *   1. Hero with period selector (24h / week / month)
 *   2. Trending jokes masonry (top 6-9 in selected period)
 *   3. Rising topics (lime band)
 *   4. Top jokesters list (mirrors FlowCanvas pattern)
 *   5. Trending tags + popular themes (combined chip cloud)
 */
export function TrendingPage() {
  const [period, setPeriod] = useState<'24h' | 'week' | 'month'>('week')

  const { data: trendingJokes } = useTrendingJokes(period)
  const { data: trendingTags } = useTrendingTags()
  const { data: risingTopics } = useRisingTopics()
  const { data: jokesters } = useTopJokesters(5)
  const { data: themes } = usePopularThemes()

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="explore">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)' }}>
          {/* Hero */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span className="eyebrow-mono">Trending · what's landing right now</span>
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
                What's <em className="wink">hitting hard.</em>
              </h2>
              <p style={{ marginTop: 6, fontSize: 18, color: '#52525B' }}>
                The community's funniest, most-saved, most-shared. Updated continuously.
              </p>
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
              Filter all of Explore <ArrowRight size={14} />
            </Link>
          </div>

          {/* Period selector */}
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="eyebrow-mono">Period</span>
            <PeriodChip label="Last 24h" active={period === '24h'} onClick={() => setPeriod('24h')} />
            <PeriodChip label="This week" active={period === 'week'} onClick={() => setPeriod('week')} />
            <PeriodChip label="This month" active={period === 'month'} onClick={() => setPeriod('month')} />
          </div>

          {/* Trending jokes */}
          <section style={{ marginTop: 36 }}>
            <SectionHeader
              eyebrow="Trending jokes"
              title={
                <>
                  Top of the <em className="wink">stack.</em>
                </>
              }
            />
            {trendingJokes && trendingJokes.length > 0 ? (
              <div style={{ marginTop: 18, columnCount: 3, columnGap: 18 }}>
                {trendingJokes.slice(0, 9).map((tj, i) => (
                  <div key={tj.joke?.id ?? i} style={{ breakInside: 'avoid', marginBottom: 18 }}>
                    <FlowJokeCard joke={trendingToFlowData(tj, i)} />
                  </div>
                ))}
              </div>
            ) : (
              <SectionEmpty />
            )}
          </section>

          {/* Rising topics + Top jokesters */}
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 24 }}>
            {/* Rising topics — lime band */}
            <div style={{ padding: 28, background: '#CAFD00', color: '#3A4A00', borderRadius: 22 }}>
              <span className="eyebrow-mono" style={{ color: '#3A4A00' }}>
                Rising fast
              </span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 26,
                  marginTop: 6,
                  letterSpacing: '-0.02em',
                  color: '#3A4A00',
                  lineHeight: 1.1,
                }}
              >
                Topics with <em className="wink" style={{ color: '#3A4A00' }}>velocity.</em>
              </h3>
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(risingTopics ?? []).slice(0, 5).map((topic, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.4)',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: '#3A4A00',
                        color: '#CAFD00',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>
                      {topic.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>+{topic.growth}%</div>
                  </div>
                ))}
                {(!risingTopics || risingTopics.length === 0) && (
                  <p style={{ fontSize: 13, opacity: 0.85 }}>Nothing rising yet — quiet week in the catalog.</p>
                )}
              </div>
            </div>

            {/* Top jokesters */}
            <div style={{ padding: 28, background: '#fff', border: '1px solid #E9E8E7', borderRadius: 22 }}>
              <span className="eyebrow-mono">Top jokesters · {period === '24h' ? '24h' : period === 'week' ? 'This week' : 'This month'}</span>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 26,
                  marginTop: 6,
                  letterSpacing: '-0.02em',
                  color: '#1A1A1A',
                  lineHeight: 1.1,
                  marginBottom: 18,
                }}
              >
                The five <em className="wink">carrying us.</em>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {(jokesters ?? []).map((j, i, arr) => (
                  <div
                    key={j.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid #E9E8E7' : '0',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 22,
                        color: i === 0 ? '#6A1CF6' : '#52525B',
                        width: 32,
                      }}
                    >
                      #{j.rank}
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: i === 0 ? '#6A1CF6' : i === 1 ? '#CAFD00' : i === 2 ? '#FFC965' : '#1A1A1A',
                        color: i === 1 ? '#3A4A00' : i === 2 ? '#5F4200' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 900,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {(j.name ?? '?').split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{j.name}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
                        Rank #{j.rank}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{j.punchlineCount}</div>
                      <div style={{ fontSize: 10, color: '#6B7280', fontFamily: 'var(--font-mono)', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                        punchlines
                      </div>
                    </div>
                  </div>
                ))}
                {(!jokesters || jokesters.length === 0) && (
                  <p style={{ fontSize: 13, color: '#6B7280' }}>No jokesters surfaced yet for this period.</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags + themes cloud */}
          <section style={{ marginTop: 56 }}>
            <SectionHeader
              eyebrow="Tags & themes"
              title={
                <>
                  What's being <em className="wink">talked about.</em>
                </>
              }
            />
            <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(themes ?? []).map((t, i) => (
                <span
                  key={i}
                  style={{
                    height: 36,
                    padding: '0 16px',
                    fontSize: 14,
                    background: '#6A1CF6',
                    color: '#fff',
                    border: 0,
                    borderRadius: 9999,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  {t}
                </span>
              ))}
              {(trendingTags ?? []).map((t, i) => (
                <span
                  key={`tag-${i}`}
                  style={{
                    height: 30,
                    padding: '0 12px',
                    fontSize: 12,
                    background: '#fff',
                    color: '#1A1A1A',
                    border: '1px solid #E9E8E7',
                    borderRadius: 9999,
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  #{t.name ?? t}
                  {t.count !== undefined && (
                    <span style={{ opacity: 0.6, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{t.count}</span>
                  )}
                </span>
              ))}
              {(!themes || themes.length === 0) && (!trendingTags || trendingTags.length === 0) && (
                <p style={{ fontSize: 14, color: '#6B7280' }}>No tag data yet.</p>
              )}
            </div>
          </section>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function PeriodChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        cursor: 'pointer',
        height: 36,
        padding: '0 16px',
        fontSize: 13,
        background: active ? '#1A1A1A' : '#fff',
        color: active ? '#fff' : '#1A1A1A',
        border: `1px solid ${active ? '#1A1A1A' : '#E9E8E7'}`,
        borderRadius: 9999,
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {active && <Flame size={13} />}
      {label}
    </button>
  )
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: React.ReactNode }) {
  return (
    <div>
      <span className="eyebrow-mono">{eyebrow}</span>
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
        {title}
      </h3>
    </div>
  )
}

function SectionEmpty() {
  return (
    <div
      style={{
        marginTop: 18,
        padding: '40px 32px',
        border: '1px dashed #E9E8E7',
        borderRadius: 18,
        textAlign: 'center',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <TrendingUp size={28} color="#6B7280" />
      <p style={{ fontSize: 14, color: '#6B7280' }}>Nothing trending yet for this period.</p>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter — TrendingJoke (mock-data) → FlowJokeData
// ──────────────────────────────────────────────────────────────────────────

function trendingToFlowData(
  tj: {
    joke: {
      id: number
      text: string
      setup: string | null
      punchline: string | null
      format?: { slug: string; name: string }
      tones?: { name: string }[]
    }
    likes: number
    shares: number
  },
  fallbackId: number,
): FlowJokeData {
  const slug = (tj.joke?.format?.slug ?? '').toLowerCase()
  const fmt: FlowJokeFormat =
    slug.includes('setup')
      ? 'setup'
      : slug.includes('one') || slug.includes('liner')
      ? 'oneliner'
      : slug.includes('observ') || slug.includes('quote')
      ? 'observ'
      : slug.includes('anti')
      ? 'anti'
      : slug.includes('knock')
      ? 'knock'
      : slug.includes('story')
      ? 'story'
      : tj.joke?.setup && tj.joke?.punchline
      ? 'setup'
      : 'oneliner'

  return {
    id: tj.joke?.id ?? fallbackId,
    fmt,
    setup: tj.joke?.setup ?? undefined,
    punch: tj.joke?.punchline ?? undefined,
    text: tj.joke?.text,
    catLabel: tj.joke?.tones?.[0]?.name,
    saves: String(tj.shares ?? '—'),
    laughs: String(tj.likes ?? '—'),
  }
}
