import { Link } from 'react-router'
import { PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  useCreatorCommunityReach,
  type CommunityStatus,
  type CreatorCommunityReach,
  type CreatorCommunityRow,
  type CreatorOpportunity,
} from '@/features/communities'
import { CreatorProGate, CreatorStudioLayout, useCreatorPlan } from '@/features/creator-studio'
import { newJokeHref } from '@/features/create/theme-param'

const COMMUNITY_UNLOCKS = [
  'Which self-forming communities your readers belong to',
  'How much of each community your jokes already reach',
  'Strongholds, untapped and emerging communities worth writing for',
  'Approximate, privacy-protected counts; small ones are always withheld',
]

/** Shown above the server's notes: counts carry noise and skip new accounts. */
const PRIVACY_NOTE =
  'Counts are approximate (privacy-protected): they include a small amount of random noise, and only established accounts count.'

const STATUS_LABEL: Record<CommunityStatus, string> = { active: 'Active', forming: 'Forming', cooling: 'Cooling' }
const STATUS_CLASS: Record<CommunityStatus, string> = {
  active: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]',
  forming: 'border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]',
  cooling: 'border-border-light bg-[#F4F4F5] text-text-secondary',
}

const KIND_LABEL: Record<CreatorOpportunity['kind'], string> = {
  stronghold: 'Stronghold',
  untapped: 'Untapped',
  emerging: 'Emerging',
}
const KIND_CLASS: Record<CreatorOpportunity['kind'], string> = {
  stronghold: 'bg-[#6A1CF6] text-white',
  untapped: 'bg-lime text-lime-dark',
  emerging: 'bg-amber text-amber-dark',
}

const cardClass = 'rounded-[18px] border border-border-light bg-white'
const sectionTitleClass = 'm-0 mb-4 font-display text-lg font-extrabold tracking-[-0.01em] text-flow-ink'

function httpStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status
}

/** A suppressed (null) count is "fewer than <minimum>", never zero. */
function count(value: number | null, minimum: number): string {
  return value === null ? `<${minimum}` : value.toLocaleString()
}

/** `reach_rate` arrives as a whole percent (server floors it to 5% steps). */
function percent(rate: number): string {
  return `${Math.round(rate)}%`
}

function StatusPill({ status }: { status: CommunityStatus }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold', STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function SummaryStrip({ data }: { data: CreatorCommunityReach }) {
  const { minimum, size } = data.audience
  const active = data.communities.filter((row) => row.status === 'active')
  const reachedActive = active.filter((row) => row.reached_members !== null && row.reached_members > 0).length
  const withheld = active.filter((row) => row.reached_members === null).length
  const top = data.communities
    .filter((row): row is CreatorCommunityRow & { reached_members: number } => row.reached_members !== null && row.reached_members > 0)
    .sort((a, b) => b.reached_members - a.reached_members || (b.reach_rate ?? 0) - (a.reach_rate ?? 0))[0]

  return (
    <dl className="m-0 mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3" data-testid="community-summary">
      <div className={cn(cardClass, 'p-5')}>
        <dt className="text-xs font-bold uppercase tracking-[0.06em] text-text-muted">Your audience</dt>
        <dd className="m-0 mt-2 font-display text-2xl font-extrabold text-flow-ink">
          {size === null ? `Fewer than ${minimum} readers yet` : `${size.toLocaleString()} ${size === 1 ? 'reader' : 'readers'}`}
        </dd>
        <p className="m-0 mt-1 text-xs text-text-muted">Last {data.window_days} days · updated daily</p>
      </div>
      <div className={cn(cardClass, 'p-5')}>
        <dt className="text-xs font-bold uppercase tracking-[0.06em] text-text-muted">Active communities reached</dt>
        <dd className="m-0 mt-2 font-display text-2xl font-extrabold text-flow-ink">{reachedActive.toLocaleString()}</dd>
        <p className="m-0 mt-1 text-xs text-text-muted">
          {withheld > 0
            ? `Plus ${withheld} where fewer than ${minimum} of your readers are members`
            : `Out of ${active.length.toLocaleString()} active ${active.length === 1 ? 'community' : 'communities'}`}
        </p>
      </div>
      <div className={cn(cardClass, 'p-5')}>
        <dt className="text-xs font-bold uppercase tracking-[0.06em] text-text-muted">Top community</dt>
        <dd className="m-0 mt-2 font-display text-2xl font-extrabold text-flow-ink [overflow-wrap:anywhere]">
          {top ? <><span aria-hidden="true">{top.emoji}</span> {top.name}</> : 'Not enough readers yet'}
        </dd>
        <p className="m-0 mt-1 text-xs text-text-muted">
          {top
            ? `${top.reached_members.toLocaleString()} of your readers are members`
            : `Shown once ${minimum} or more of your readers share a community`}
        </p>
      </div>
    </dl>
  )
}

function OpportunityCard({ item }: { item: CreatorOpportunity }) {
  const canWriteFor = item.kind === 'untapped' || item.kind === 'emerging'
  return (
    <li className={cn(cardClass, 'flex min-w-0 flex-col p-5')} data-testid={`opportunity-${item.slug}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]', KIND_CLASS[item.kind])}>
          {KIND_LABEL[item.kind]}
        </span>
        <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
      </div>
      <h3 className="m-0 mt-3 font-display text-lg font-extrabold text-flow-ink [overflow-wrap:anywhere]">{item.name}</h3>
      <p className="m-0 mt-2 text-sm leading-relaxed text-text-secondary">{item.evidence}</p>
      <p className="m-0 mt-3 rounded-xl bg-purple-tint p-3 text-sm leading-relaxed text-[#4B327A]">{item.action}</p>
      <div className="mt-auto flex flex-wrap gap-x-5 pt-3">
        <Link
          to={`/communities/${encodeURIComponent(item.slug)}`}
          className="inline-flex min-h-11 items-center text-sm font-bold text-[#6A1CF6] underline underline-offset-4"
        >
          View community
        </Link>
        {canWriteFor && (
          <Link
            to={newJokeHref(item.slug)}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#6A1CF6] underline underline-offset-4"
          >
            <PenLine size={14} aria-hidden="true" />
            Write a {item.name} joke
          </Link>
        )}
      </div>
    </li>
  )
}

function ReachRow({ row, minimum }: { row: CreatorCommunityRow; minimum: number }) {
  return (
    <li className="border-b border-flow-line2 py-4 last:border-b-0" data-testid={`reach-row-${row.slug}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-xl" aria-hidden="true">{row.emoji}</span>
          <Link
            to={`/communities/${encodeURIComponent(row.slug)}`}
            className="min-w-0 font-display text-base font-extrabold text-flow-ink no-underline hover:underline [overflow-wrap:anywhere]"
          >
            {row.name}
          </Link>
          <StatusPill status={row.status} />
        </div>
        <span className="text-sm text-text-secondary">
          <strong className="text-flow-ink">{row.your_jokes.toLocaleString()}</strong> of your jokes
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-flow-line2" aria-hidden="true">
          {row.reach_rate !== null && (
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, Math.min(100, row.reach_rate))}%`, background: row.color }}
            />
          )}
        </div>
        <span className="shrink-0 text-right text-sm font-bold text-flow-ink">
          {row.reach_rate === null ? 'Not enough data' : `${percent(row.reach_rate)} reached`}
        </span>
      </div>
      <dl className="m-0 mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-text-secondary">
        <div className="flex gap-1.5"><dt>Members</dt><dd className="m-0 font-bold text-flow-ink">{count(row.members, minimum)}</dd></div>
        <div className="flex gap-1.5"><dt>Your readers in it</dt><dd className="m-0 font-bold text-flow-ink">{count(row.reached_members, minimum)}</dd></div>
      </dl>
    </li>
  )
}

function LoadingState() {
  return (
    <div role="status" aria-label="Loading community audience" data-testid="communities-loading">
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[112px] rounded-[18px]" />)}
      </div>
      <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[220px] rounded-[18px]" />)}
      </div>
      <Skeleton className="h-[260px] rounded-[18px]" />
    </div>
  )
}

function NotCreatorYet() {
  return (
    <section className={cn(cardClass, 'border-dashed px-6 py-12 text-center sm:px-8')}>
      <h2 className="m-0 font-display text-[22px] font-extrabold tracking-[-0.01em] text-flow-ink">Publish your first joke</h2>
      <p className="mx-auto mb-6 mt-2 max-w-[420px] text-[15px] leading-relaxed text-text-secondary">
        Community reach appears once readers can find something you have published.
      </p>
      <Button asChild variant="pill" className="min-h-11 px-6">
        <Link to="/create/new">Write a joke</Link>
      </Button>
    </section>
  )
}

function CommunitiesBody() {
  const plan = useCreatorPlan()
  const { data, isLoading, isError, error, refetch } = useCreatorCommunityReach()

  if (isLoading) return <LoadingState />

  if (isError && httpStatus(error) === 403) {
    // The server is authoritative; the plan only decides which explanation fits.
    if (plan.isLoading) return <LoadingState />
    if (!plan.features.creator_community_insights) {
      return (
        <CreatorProGate
          feature="Community audience"
          description="See which self-forming communities your readers belong to, and where your next joke could find an audience."
          unlocks={COMMUNITY_UNLOCKS}
        />
      )
    }
    return <NotCreatorYet />
  }

  if (isError || !data) {
    return (
      <div role="alert" className="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] p-8 text-center">
        <p className="m-0 mb-3 font-semibold text-[#991B1B]">Could not load your community audience</p>
        <Button variant="outline" className="min-h-11" onClick={() => { void refetch() }}>Retry</Button>
      </div>
    )
  }

  const minimum = data.audience.minimum
  return (
    <>
      <SummaryStrip data={data} />

      <section className="mb-8" aria-labelledby="community-opportunities">
        <h2 id="community-opportunities" className={sectionTitleClass}>Opportunities</h2>
        {data.opportunities.length === 0 ? (
          <p className={cn(cardClass, 'm-0 p-5 text-sm text-text-secondary')}>
            No opportunities yet. They appear once enough of your readers share a community.
          </p>
        ) : (
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
            {data.opportunities.map((item) => <OpportunityCard key={`${item.kind}-${item.slug}`} item={item} />)}
          </ul>
        )}
      </section>

      <section className="mb-8" aria-labelledby="community-reach">
        <h2 id="community-reach" className={sectionTitleClass}>Reach by community</h2>
        {data.communities.length === 0 ? (
          <p className={cn(cardClass, 'm-0 p-5 text-sm text-text-secondary')}>
            None of your readers belong to a community yet.
          </p>
        ) : (
          <ul className={cn(cardClass, 'm-0 list-none px-5 py-1 sm:px-6')}>
            {data.communities.map((row) => <ReachRow key={row.slug} row={row} minimum={minimum} />)}
          </ul>
        )}
      </section>

      <section aria-labelledby="community-notes" className="text-xs leading-relaxed text-text-muted">
        <h2 id="community-notes" className="m-0 mb-2 text-xs font-bold uppercase tracking-[0.06em] text-text-muted">How this is measured</h2>
        <ul className="m-0 list-disc space-y-1 pl-5">
          <li data-testid="community-privacy-note">{PRIVACY_NOTE}</li>
          {data.measurement_notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </section>
    </>
  )
}

export function CreatorCommunitiesPage() {
  return (
    <CreatorStudioLayout
      section="communities"
      title="Communities"
      subtitle="Which self-forming communities your audience belongs to"
    >
      <CommunitiesBody />
    </CreatorStudioLayout>
  )
}
