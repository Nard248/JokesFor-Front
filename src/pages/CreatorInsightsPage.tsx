import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreatorInsights } from '@/features/creator-insights'
import type { InsightsPeriod, CreatorInsights, CreatorSuggestion, AudienceTasteItem } from '@/lib/api'

const PERIODS: { id: InsightsPeriod; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'all', label: 'All Time' },
]

function fmt(n: number): string {
  return n.toLocaleString()
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const width = 280
  const height = 40
  const barW = Math.floor(width / data.length) - 1

  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {data.map((val, i) => {
        const barH = Math.max(2, Math.round((val / max) * height))
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={height - barH}
            width={barW}
            height={barH}
            rx={2}
            fill="#AC8EFF"
            opacity={0.7}
          />
        )
      })}
    </svg>
  )
}

function KpiCard({ label, value, hero }: { label: string; value: string; hero?: boolean }) {
  return (
    <div
      style={{
        background: hero ? '#6A1CF6' : '#fff',
        border: hero ? 'none' : '1px solid #E9E8E7',
        borderRadius: 16,
        padding: hero ? '20px 24px' : '16px 20px',
        minWidth: 110,
        flex: '1 1 110px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: hero ? 'rgba(255,255,255,0.75)' : '#71717A',
          marginBottom: 6,
          fontFamily: 'var(--font-sans)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: hero ? 36 : 24,
          color: hero ? '#fff' : '#1A1A1A',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SuggestionCard({ s }: { s: CreatorSuggestion }) {
  const icons: Record<CreatorSuggestion['kind'], string> = {
    peak_hour: '🕘',
    what_resonates: '✨',
    consistency: '📅',
  }
  return (
    <div
      style={{
        background: '#F7F0FF',
        border: '1px solid #E6D8FF',
        borderRadius: 16,
        padding: '18px 20px',
        flex: '1 1 200px',
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icons[s.kind]}</div>
      <div
        style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 14,
          color: '#3B0D9E',
          marginBottom: 6,
        }}
      >
        {s.title}
      </div>
      <div style={{ fontSize: 13, color: '#52525B', lineHeight: 1.5 }}>{s.detail}</div>
    </div>
  )
}

function TasteChip({ item }: { item: AudienceTasteItem }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 12px',
        borderRadius: 999,
        background: '#F4F4F5',
        border: '1px solid #E9E8E7',
        fontSize: 13,
        fontWeight: 600,
        color: '#1A1A1A',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {item.label}
      <span style={{ fontSize: 11, color: '#71717A', fontWeight: 500 }}>{item.count}</span>
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Skeleton style={{ height: 120, borderRadius: 16 }} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Array(6).fill(0).map((_, i) => (
          <Skeleton key={i} style={{ height: 80, width: 130, borderRadius: 12 }} />
        ))}
      </div>
      <Skeleton style={{ height: 200, borderRadius: 16 }} />
      <Skeleton style={{ height: 160, borderRadius: 16 }} />
    </div>
  )
}

function InsightsDashboard({ data }: { data: CreatorInsights }) {
  const { overview, top_jokes, audience, suggestions, source_mix } = data
  const totalSource = source_mix.reduce((s, r) => s + r.count, 0) || 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* KPI row */}
      <section>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <KpiCard label="Payoff Rate" value={pct(overview.payoff_rate)} hero />
          <KpiCard label="Reach" value={fmt(overview.reach)} />
          <KpiCard label="Views" value={fmt(overview.views)} />
          <KpiCard label="Reactions" value={fmt(overview.reactions)} />
          <KpiCard label="Favorites" value={fmt(overview.favorites)} />
          <KpiCard label="Saves" value={fmt(overview.saves)} />
          <KpiCard label="Shares" value={fmt(overview.shares)} />
          {overview.peak_read_hour !== null && (
            <KpiCard label="Peak Hour" value={`${overview.peak_read_hour}:00`} />
          )}
        </div>
      </section>

      {/* 28-day sparkline */}
      {overview.daily_reach_28d.length > 0 && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #E9E8E7',
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
              fontFamily: 'var(--font-sans)',
            }}
          >
            28-Day Reach
          </div>
          <Sparkline data={overview.daily_reach_28d} />
        </section>
      )}

      {/* Top Jokes */}
      {top_jokes.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 18,
              color: '#1A1A1A',
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}
          >
            Top Jokes
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {top_jokes.map((joke, idx) => (
              <div
                key={joke.id}
                style={{
                  background: '#fff',
                  border: '1px solid #E9E8E7',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 900,
                    fontSize: 20,
                    color: '#AC8EFF',
                    minWidth: 28,
                    lineHeight: 1.2,
                  }}
                >
                  {idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#1A1A1A',
                      marginBottom: 6,
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {joke.text}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Views', val: fmt(joke.views) },
                      { label: 'Reactions', val: fmt(joke.reactions) },
                      { label: 'Saves', val: fmt(joke.saves) },
                      { label: 'Shares', val: fmt(joke.shares) },
                      { label: 'Payoff', val: pct(joke.payoff_rate) },
                    ].map(({ label, val }) => (
                      <span key={label} style={{ fontSize: 12, color: '#71717A', fontFamily: 'var(--font-sans)' }}>
                        <span style={{ fontWeight: 700, color: '#52525B' }}>{val}</span> {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Audience taste */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            color: '#1A1A1A',
            marginBottom: 12,
            letterSpacing: '-0.01em',
          }}
        >
          Audience Taste
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {audience.top_themes.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>Themes</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {audience.top_themes.map((t) => <TasteChip key={t.label} item={t} />)}
              </div>
            </div>
          )}
          {audience.top_categories.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>Categories</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {audience.top_categories.map((t) => <TasteChip key={t.label} item={t} />)}
              </div>
            </div>
          )}
          {audience.top_formats.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#71717A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>Formats</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {audience.top_formats.map((t) => <TasteChip key={t.label} item={t} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Source mix */}
      {source_mix.length > 0 && (
        <section
          style={{
            background: '#fff',
            border: '1px solid #E9E8E7',
            borderRadius: 16,
            padding: '20px 24px',
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#71717A',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 12,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Where readers find you
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {source_mix.map((s) => (
              <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 70, fontSize: 13, fontWeight: 600, color: '#1A1A1A', textTransform: 'capitalize', fontFamily: 'var(--font-sans)' }}>
                  {s.source}
                </div>
                <div style={{ flex: 1, height: 8, background: '#F4F4F5', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round((s.count / totalSource) * 100)}%`,
                      background: '#AC8EFF',
                      borderRadius: 4,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#71717A', minWidth: 36, textAlign: 'right', fontFamily: 'var(--font-sans)' }}>
                  {fmt(s.count)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <section>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 18,
              color: '#1A1A1A',
              marginBottom: 12,
              letterSpacing: '-0.01em',
            }}
          >
            Growth Suggestions
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {suggestions.map((s) => (
              <SuggestionCard key={s.kind} s={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export function CreatorInsightsPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<InsightsPeriod>('month')
  const { data, isLoading, isError, error, refetch } = useCreatorInsights(period)

  const is403 = isError && (error as { response?: { status?: number } })?.response?.status === 403

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 860, margin: '0 auto' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              Creator Insights
            </h1>

            {/* Period selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {PERIODS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setPeriod(id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 9999,
                    border: period === id ? '1px solid #AC8EFF' : '1px solid #E9E8E7',
                    background: period === id ? '#F7F0FF' : 'transparent',
                    color: period === id ? '#6A1CF6' : '#52525B',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: period === id ? 700 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {isLoading && <LoadingSkeleton />}

          {/* 403: not a creator yet */}
          {is403 && (
            <div
              style={{
                padding: '56px 32px',
                border: '1px dashed #E9E8E7',
                borderRadius: 18,
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 22,
                  color: '#1A1A1A',
                  letterSpacing: '-0.01em',
                  marginBottom: 8,
                }}
              >
                Insights unlock when you publish
              </h2>
              <p style={{ fontSize: 15, color: '#52525B', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Publish a joke to start seeing your reach, reactions, and audience data here.
              </p>
              <Button variant="pill" onClick={() => navigate('/create/new')}>
                Publish a joke
              </Button>
            </div>
          )}

          {/* Generic error */}
          {isError && !is403 && (
            <div
              style={{
                padding: '32px',
                borderRadius: 16,
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: 12 }}>
                Failed to load insights
              </p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Data */}
          {!isLoading && !isError && data && <InsightsDashboard data={data} />}

          {/* Zero state: loaded but no data */}
          {!isLoading && !isError && data && data.overview.published_jokes === 0 && (
            <div
              style={{
                marginTop: 32,
                padding: '40px 32px',
                border: '1px dashed #E9E8E7',
                borderRadius: 18,
                textAlign: 'center',
                background: '#fff',
              }}
            >
              <p style={{ fontSize: 15, color: '#52525B' }}>No data yet for this period.</p>
            </div>
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
