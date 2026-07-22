import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FlowAppShell } from '@/components/FlowAppShell'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useCreatorInsights } from '@/features/creator-insights'
import type {
  InsightsPeriod,
  CreatorInsights,
  CreatorSuggestion,
  AudienceTasteItem,
  ReactionBreakdownItem,
  ShareBreakdownItem,
} from '@/lib/api'

const PERIODS: { id: InsightsPeriod; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'week', label: 'Week' },
  { id: 'all', label: 'All Time' },
]

// Friendly display for reaction slugs (mirrors FlowJokeCard's REACTIONS).
const REACTION_DISPLAY: Record<string, string> = {
  lol: '😂 LOL',
  crying: '🤣 Dying',
  hmm: '🤔 Hmm',
  eyeroll: '🙄 Eyeroll',
}

// Friendly display for share platform slugs.
const SHARE_DISPLAY: Record<string, string> = {
  whatsapp: 'WhatsApp',
  twitter: 'Twitter / X',
  x: 'Twitter / X',
  facebook: 'Facebook',
  copy_link: 'Copy link',
  copy: 'Copy link',
  email: 'Email',
  sms: 'SMS',
  other: 'Other',
}

function titleCase(s: string): string {
  return s
    .split(/[-_\s]+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function fmt(n: number): string {
  return n.toLocaleString()
}

function pct(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  return `${Math.round(n * 100)}%`
}

/** Format seconds as "Ns" or "Nm Ns". Returns "—" for null/undefined. */
function secs(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const total = Math.max(0, Math.round(n))
  if (total < 60) return `${total}s`
  const m = Math.floor(total / 60)
  const s = total % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

/**
 * Format seconds as `m:ss` for the watch-time chip (e.g. 12 -> '0:12', 72 -> '1:12').
 * Mirrors JokeRenderer's ms-based `formatDuration`, but `avg_watch_seconds` arrives
 * from the backend already in seconds. Returns null for missing/invalid input —
 * callers only call this once they've already confirmed the value is non-null,
 * so the chip is omitted rather than rendering a "—" placeholder.
 */
function watchDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null
  const total = Math.round(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// Fluid bar sparkline. Rendered in an intrinsic 280×40 coordinate space via
// `viewBox`, but sized to 100% of its container with a fixed pixel height, so it
// scales down cleanly on a phone instead of overflowing at its old fixed 280px.
// `preserveAspectRatio="none"` lets the bars stretch horizontally to fill the
// available width (vertical scale stays 1:1, so bar heights read correctly).
function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  const width = 280
  const height = 40
  const barW = Math.max(1, Math.floor(width / data.length) - 1)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
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

/** A labeled read-attention stat. Degrades to "—" when its value is null. */
function AttentionStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 16,
        padding: '16px 20px',
        flex: '1 1 160px',
        minWidth: 150,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#71717A',
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
          fontSize: 28,
          color: '#1A1A1A',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: '#A1A1AA', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
        {hint}
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </div>
  )
}

function BarRow({ label, count, total }: { label: string; count: number; total: number }) {
  const widthPct = Math.round((count / (total || 1)) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 110,
          fontSize: 13,
          fontWeight: 600,
          color: '#1A1A1A',
          fontFamily: 'var(--font-sans)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={label}
      >
        {label}
      </div>
      <div style={{ flex: 1, height: 8, background: '#F4F4F5', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${widthPct}%`, background: '#AC8EFF', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 12, color: '#71717A', minWidth: 40, textAlign: 'right', fontFamily: 'var(--font-sans)' }}>
        {fmt(count)}
      </div>
    </div>
  )
}

function BreakdownPanel({
  title,
  rows,
}: {
  title: string
  rows: { key: string; label: string; count: number }[]
}) {
  const total = rows.reduce((s, r) => s + r.count, 0)
  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 16,
        padding: '20px 24px',
        flex: '1 1 280px',
      }}
    >
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map((r) => (
          <BarRow key={r.key} label={r.label} count={r.count} total={total} />
        ))}
      </div>
    </section>
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
  const { isMobile } = useBreakpoint()
  const {
    overview,
    top_jokes,
    audience,
    suggestions,
    source_mix,
    reactions_breakdown,
    shares_breakdown,
  } = data

  const reactionRows = (reactions_breakdown ?? []).map((r: ReactionBreakdownItem) => ({
    key: r.reaction,
    label: REACTION_DISPLAY[r.reaction] ?? titleCase(r.reaction),
    count: r.count,
  }))
  const shareRows = (shares_breakdown ?? []).map((s: ShareBreakdownItem) => ({
    key: s.platform,
    label: SHARE_DISPLAY[s.platform] ?? titleCase(s.platform),
    count: s.count,
  }))
  const hasAudience =
    audience.top_themes.length > 0 ||
    audience.top_categories.length > 0 ||
    audience.top_formats.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* KPI row — 2-up on phones, auto-fitting columns above. */}
      <section>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(2, minmax(0, 1fr))'
              : 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
          }}
        >
          <KpiCard label="Payoff Rate" value={pct(overview.payoff_rate)} hero />
          <KpiCard label="Reach" value={fmt(overview.reach)} />
          <KpiCard label="Views" value={fmt(overview.views)} />
          <KpiCard label="Reactions" value={fmt(overview.reactions)} />
          <KpiCard label="Favorites" value={fmt(overview.favorites)} />
          <KpiCard label="Saves" value={fmt(overview.saves)} />
          <KpiCard label="Shares" value={fmt(overview.shares)} />
          <KpiCard label="Followers" value={fmt(overview.followers)} />
          {overview.peak_read_hour !== null && (
            <KpiCard label="Peak Hour" value={`${overview.peak_read_hour}:00`} />
          )}
        </div>
      </section>

      {/* Attention / Read-through — Phase-2 read-time telemetry. Each stat
          degrades gracefully to "—" when the backend has no data yet. */}
      <section>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 18,
            color: '#1A1A1A',
            marginBottom: 4,
            letterSpacing: '-0.01em',
          }}
        >
          Attention
        </h2>
        <p style={{ fontSize: 13, color: '#71717A', margin: '0 0 12px', fontFamily: 'var(--font-sans)' }}>
          How much your jokes actually get read.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
          }}
        >
          <AttentionStat
            label="Avg read time"
            value={secs(overview.avg_read_seconds)}
            hint="Time spent reading, per view"
          />
          <AttentionStat
            label="Read-through rate"
            value={pct(overview.read_rate)}
            hint="Impressions that became a real read"
          />
          <AttentionStat
            label="Completion (story)"
            value={pct(overview.completion_rate)}
            hint="Story reads scrolled to the end"
          />
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

      {/* Follower growth sparkline */}
      {overview.follower_growth_28d && overview.follower_growth_28d.length > 0 && (
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
            28-Day Follower Growth
          </div>
          <Sparkline data={overview.follower_growth_28d} />
        </section>
      )}

      {/* Reactions & Shares breakdown */}
      {(reactionRows.length > 0 || shareRows.length > 0) && (
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
            Reactions &amp; Shares
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {reactionRows.length > 0 && (
              <BreakdownPanel title="Reactions" rows={reactionRows} />
            )}
            {shareRows.length > 0 && (
              <BreakdownPanel title="Shares by platform" rows={shareRows} />
            )}
          </div>
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
                      { label: 'Avg read', val: secs(joke.avg_read_seconds) },
                      { label: 'Read rate', val: pct(joke.read_rate) },
                      // Wave-2 watch-time telemetry (media jokes only). The backend
                      // always emits these keys (null for text/image jokes), but
                      // current prod omits them entirely — so absence and null are
                      // handled identically: the chip simply isn't rendered, rather
                      // than falling back to the "—" placeholder the other stats use.
                      ...(joke.avg_watch_seconds != null
                        ? [{ label: 'Avg watch', val: watchDuration(joke.avg_watch_seconds)! }]
                        : []),
                      ...(joke.watch_completion_rate != null
                        ? [{ label: 'watched to end', val: pct(joke.watch_completion_rate) }]
                        : []),
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
      {hasAudience && (
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
      )}

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
          <SectionTitle>Where readers find you</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {source_mix.map((s) => (
              <BarRow
                key={s.source}
                label={titleCase(s.source)}
                count={s.count}
                total={source_mix.reduce((sum, r) => sum + r.count, 0)}
              />
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
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
  const { isMobile } = useBreakpoint()
  const [period, setPeriod] = useState<InsightsPeriod>('month')
  const { data, isLoading, isError, error, refetch } = useCreatorInsights(period)

  const is403 = isError && (error as { response?: { status?: number } })?.response?.status === 403

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell>
        <div style={{ padding: '40px 0', maxWidth: 860, margin: '0 auto' }}>
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
                  aria-pressed={period === id}
                  onClick={() => setPeriod(id)}
                  style={{
                    padding: isMobile ? '6px 18px' : '6px 16px',
                    minHeight: isMobile ? 44 : undefined,
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

          {/* Data or zero state — mutually exclusive */}
          {!isLoading && !isError && data && (
            data.overview.published_jokes === 0 ? (
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
            ) : (
              <InsightsDashboard data={data} />
            )
          )}
        </div>
      </FlowAppShell>
    </div>
  )
}
