import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Info, PenLine, Search as SearchIcon, Sparkles, X } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard } from '@/components/FlowJokeCard'
import { jokeToFlowData } from '@/components/flowJokeData'
import { useAuth } from '@/features/auth'
import {
  useCommunityDetail,
  useCommunityDirectory,
  useCommunityMembership,
  type Community,
  type CommunityDirectory,
  type CommunityStatus,
} from '@/features/communities'
import { CommunityMap } from '@/features/communities/CommunityMap'
import { newJokeHref } from '@/features/create/theme-param'
import { useBreakpoint } from '@/hooks/useBreakpoint'

/**
 * Communities — audiences that form on their own around shared laughs.
 *
 * A community is the people who independently enjoy several jokes on one
 * theme. The page shows how each one formed, how close *you* are to joining,
 * and lets you join or leave explicitly. Counts under five are withheld by the
 * server and shown as "fewer than 5"; no individual is ever displayed.
 */
type Filter = 'all' | 'active' | 'forming' | 'yours'

const STATUS_COPY: Record<CommunityStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-[#E7F8EF] text-[#137A4B]' },
  forming: { label: 'Forming', className: 'bg-[#F2E9FF] text-[#6A1CF6]' },
  cooling: { label: 'Cooling', className: 'bg-[#F1F1F2] text-[#52525B]' },
}

const FILTER_LABEL: Record<Filter, string> = {
  all: 'All',
  active: 'Active',
  forming: 'Forming & cooling',
  yours: 'Yours',
}

function count(value: number | null, noun = 'members'): string {
  return value === null ? `Fewer than 5 ${noun}` : `${value.toLocaleString()} ${noun}`
}

function StatusPill({ status }: { status: CommunityStatus }) {
  const copy = STATUS_COPY[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${copy.className}`}>
      {copy.label}
    </span>
  )
}

function ActivityBars({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values)
  const days = ['6 days ago', '5 days ago', '4 days ago', '3 days ago', '2 days ago', 'Yesterday', 'Today']
  return (
    <div className="flex h-14 items-end gap-1.5" role="img" aria-label={`Signals over the last 7 days: ${values.join(', ')}`}>
      {values.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-md"
          style={{ height: `${Math.max(6, (value / max) * 100)}%`, background: color, opacity: 0.25 + 0.75 * (value / max) }}
          title={`${days[index]}: ${value}`}
        />
      ))}
    </div>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-[#E9E8E7] bg-white px-4 py-3">
      <div className="text-2xl font-black tracking-tight text-[#1A1A1A]" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <div className="text-xs font-semibold text-[#6B7280]">{label}</div>
    </div>
  )
}

function privacyNote(m: CommunityDirectory['methodology']): string {
  const parts = ['Counts are approximate (privacy-protected).']
  if (m.noise_epsilon) {
    parts.push(
      `Each count includes a small random adjustment that stays the same all day, is rounded to ${m.minimum_display} and is hidden below ${m.minimum_display}.`,
    )
  }
  if (m.established_account_days && m.established_min_jokes) {
    parts.push(
      `Only established accounts count: at least ${m.established_account_days} days old, with laughs on ${m.established_min_jokes} or more different jokes.`,
    )
  }
  return parts.join(' ')
}

function MethodologyDialog({ directory, onClose }: { directory: CommunityDirectory; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal?.()
  }, [])
  const m = directory.methodology
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="cm-method-title"
      className="m-auto w-[min(560px,calc(100vw-32px))] rounded-3xl border border-[#E9E8E7] bg-white p-0 text-[#1A1A1A] backdrop:bg-black/30"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id="cm-method-title" className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
            How communities form
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-[#F4F4F5]"
          >
            <X size={18} />
          </button>
        </div>
        <p className="mt-3 text-[15px] leading-relaxed text-[#3F3F46]">{m.description}</p>
        <p className="mt-3 rounded-2xl bg-[#F2E9FF] p-3 text-sm leading-relaxed text-[#4B327A]" data-testid="cm-privacy-note">
          {privacyNote(m)}
        </p>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          {[
            ['Signal half-life', `${m.half_life_days} days`],
            ['To be a member', `${m.membership_threshold} points, ${m.minimum_content}+ jokes`],
            ['To activate', `${m.minimum_members} people`],
            ['Max per joke', `${m.content_cap} points`],
            ['Window', `${m.window_days} days`],
            ['Hidden below', `${m.minimum_display} people`],
          ].map(([term, value]) => (
            <div key={term} className="rounded-2xl bg-[#FBFAF7] p-3">
              <dt className="text-xs font-semibold text-[#6B7280]">{term}</dt>
              <dd className="mt-0.5 font-bold">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-[#6B7280]">
          Signal points: {Object.entries(m.weights).map(([k, v]) => `${k} ${v}`).join(' · ')}. Watching alone never counts.
        </p>
      </div>
    </dialog>
  )
}

function CommunityInspector({ slug, onBack }: { slug: string; onBack?: () => void }) {
  const { isAuthenticated } = useAuth()
  const { data, isLoading, isError } = useCommunityDetail(slug)
  const membership = useCommunityMembership()

  if (isLoading) {
    return <div className="h-[420px] animate-pulse rounded-3xl border border-[#E9E8E7] bg-white" aria-busy="true" />
  }
  if (isError || !data) {
    return (
      <div className="rounded-3xl border border-[#E9E8E7] bg-white p-6 text-sm text-[#52525B]" role="alert">
        This community could not be loaded. Try again in a moment.
      </div>
    )
  }
  const { community, trending, newest, creators, bridges } = data
  const viewer = community.viewer
  const isMember = !!viewer?.member
  const trendingCards = trending.map(jokeToFlowData).filter((joke) => joke !== null)
  const trendingIds = new Set(trending.map((joke) => joke.id))
  const newestCards = newest
    .filter((joke) => !trendingIds.has(joke.id))
    .map(jokeToFlowData)
    .filter((joke) => joke !== null)

  return (
    <section aria-labelledby="cm-inspector-title" className="flex flex-col gap-5">
      <div className="rounded-3xl border border-[#E9E8E7] bg-white p-5 sm:p-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[#6A1CF6]"
          >
            <ArrowLeft size={16} /> All communities
          </button>
        )}
        <div className="flex items-start gap-4">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-3xl"
            style={{ background: `${community.color}1F` }}
            aria-hidden
          >
            {community.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="cm-inspector-title"
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {community.name}
              </h2>
              <StatusPill status={community.status} />
            </div>
            <p className="mt-1 text-sm text-[#52525B]">
              {count(community.members)}
              {community.growth !== null && community.growth !== 0 && (
                <span className={community.growth > 0 ? 'text-[#137A4B]' : 'text-[#B42318]'}>
                  {' '}
                  · {community.growth > 0 ? '+' : ''}
                  {community.growth} this week
                </span>
              )}{' '}
              · {community.joke_count} jokes
            </p>
          </div>
        </div>
        {community.description && <p className="mt-4 text-[15px] text-[#3F3F46]">{community.description}</p>}
        <p className="mt-3 rounded-2xl bg-[#FBFAF7] p-3 text-sm leading-relaxed text-[#3F3F46]" data-testid="community-explanation">
          {community.explanation}
        </p>

        <div className="mt-4">
          <div className="mb-1 text-xs font-semibold text-[#6B7280]">Laughs, saves and shares · last 7 days</div>
          {community.activity ? (
            <ActivityBars values={community.activity} color={community.color} />
          ) : (
            <p className="rounded-xl border border-dashed border-[#E9E8E7] p-3 text-xs text-[#6B7280]">
              Activity appears once at least 5 people take part, so no one’s laughs can be singled out.
            </p>
          )}
        </div>

        {viewer && (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#6B7280]">
              <span>Your affinity</span>
              <span>
                {viewer.content_count} {viewer.content_count === 1 ? 'joke' : 'jokes'} enjoyed
              </span>
            </div>
            <div
              className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#F1F1F2]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(viewer.progress * 100)}
              aria-label="Progress toward membership"
            >
              <div className="h-full rounded-full" style={{ width: `${viewer.progress * 100}%`, background: community.color }} />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {!isAuthenticated ? (
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center rounded-full bg-[#6A1CF6] px-5 text-sm font-bold text-white"
            >
              Sign in to join
            </Link>
          ) : (
            <button
              type="button"
              disabled={membership.isPending}
              onClick={() => membership.mutate({ slug: community.slug, action: isMember ? 'leave' : 'join' })}
              className={
                isMember
                  ? 'inline-flex min-h-11 items-center rounded-full border border-[#E9E8E7] bg-white px-5 text-sm font-bold text-[#1A1A1A] disabled:opacity-60'
                  : 'inline-flex min-h-11 items-center rounded-full bg-[#6A1CF6] px-5 text-sm font-bold text-white disabled:opacity-60'
              }
            >
              {membership.isPending ? 'Saving…' : isMember ? 'Leave community' : 'Join community'}
            </button>
          )}
          {isAuthenticated && (
            <Link
              to={newJokeHref(community.slug)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E9E8E7] bg-white px-5 text-sm font-bold text-[#1A1A1A] hover:border-[#6A1CF6]"
            >
              <PenLine size={14} aria-hidden="true" />
              Write a {community.name} joke
            </Link>
          )}
          {membership.isError && (
            <span role="alert" className="self-center text-sm text-[#B42318]">
              Couldn’t save that. Try again.
            </span>
          )}
        </div>

        {bridges.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Overlaps with</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {bridges.map((bridge) => (
                <li key={bridge.slug}>
                  <Link
                    to={`/communities/${bridge.slug}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#E9E8E7] bg-white px-3 text-sm font-semibold text-[#1A1A1A] hover:border-[#6A1CF6]"
                  >
                    <span aria-hidden>{bridge.emoji}</span> {bridge.name}
                    <span className="text-xs font-medium text-[#6B7280]">{bridge.members} shared</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {creators.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#1A1A1A]">Creators writing for {community.name}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {creators.map((creator) => (
                <li key={creator.id}>
                  <Link
                    to={`/creators/${creator.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#FBFAF7] px-3 text-sm font-semibold text-[#1A1A1A] hover:bg-[#F2E9FF]"
                  >
                    {creator.display_name}
                    <span className="text-xs font-medium text-[#6B7280]">
                      {creator.joke_count} {creator.joke_count === 1 ? 'joke' : 'jokes'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
          Trending in {community.name}
        </h3>
        {trendingCards.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No jokes on this theme are visible to you yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {trendingCards.map((joke) => (
              <FlowJokeCard key={joke.id} joke={joke} source="explore" />
            ))}
          </div>
        )}
        {newestCards.length > 0 && (
          <>
            <h3 className="mb-3 mt-6 text-lg font-black" style={{ fontFamily: 'var(--font-display)' }}>
              Newest
            </h3>
            <div className="flex flex-col gap-4">
              {newestCards.map((joke) => (
                <FlowJokeCard key={joke.id} joke={joke} source="explore" />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function CommunityListItem({
  community,
  selected,
  onSelect,
}: {
  community: Community
  selected: boolean
  onSelect: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left transition-colors ${
          selected ? 'border-[#6A1CF6] ring-2 ring-[#6A1CF6]/15' : 'border-[#E9E8E7] hover:border-[#C9B8F5]'
        }`}
      >
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl"
          style={{ background: `${community.color}1F` }}
          aria-hidden
        >
          {community.emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-[#1A1A1A]">{community.name}</span>
            <StatusPill status={community.status} />
            {community.viewer?.member && (
              <span className="rounded-full bg-[#6A1CF6] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                You
              </span>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-[#6B7280]">
            {count(community.members)} · {community.joke_count} jokes
          </span>
        </span>
      </button>
    </li>
  )
}

export function CommunitiesPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { isMobile, isDesktop } = useBreakpoint()
  const { data, isLoading, isError, refetch } = useCommunityDirectory()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [showMethod, setShowMethod] = useState(false)

  const communities = useMemo(() => data?.communities ?? [], [data])
  const fallback = useMemo(
    () => communities.find((c) => c.viewer?.member)?.slug ?? communities[0]?.slug ?? null,
    [communities],
  )
  const selected = slug ?? (isMobile ? null : fallback)
  const select = (next: string) => navigate(`/communities/${next}`)
  const filters: Filter[] = isAuthenticated ? ['all', 'active', 'forming', 'yours'] : ['all', 'active', 'forming']

  const visible = communities.filter((community) => {
    if (query && !community.name.toLowerCase().includes(query.toLowerCase())) return false
    if (filter === 'active') return community.status === 'active'
    if (filter === 'forming') return community.status !== 'active'
    if (filter === 'yours') return !!community.viewer?.member
    return true
  })

  // Mobile detail view: the inspector replaces the directory.
  if (isMobile && slug) {
    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <FlowAppShell active="communities">
          <div className="py-6">
            <CommunityInspector slug={slug} onBack={() => navigate('/communities')} />
          </div>
        </FlowAppShell>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <FlowAppShell active="communities">
        <div className="py-8 sm:py-10">
          <header className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div>
              <span className="eyebrow-mono">Communities · formed by laughter</span>
              <h1
                className="mt-2 text-[clamp(2.25rem,5vw,3.5rem)] font-black leading-[1.05] tracking-[-0.02em] text-[#1A1A1A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Find your people <em className="wink">through what makes you laugh.</em>
              </h1>
              <p className="mt-3 max-w-[560px] text-[17px] text-[#52525B]">
                Nobody creates these groups. They form on their own when enough people independently enjoy the same kind of
                jokes, and they fade when the laughs stop.
              </p>
              <button
                type="button"
                onClick={() => setShowMethod(true)}
                disabled={!data}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E9E8E7] bg-white px-4 text-sm font-bold text-[#1A1A1A] hover:border-[#6A1CF6] disabled:opacity-50"
              >
                <Info size={16} /> How communities form
              </button>
            </div>
            {data && (
              <div className="grid grid-cols-2 gap-3">
                <Stat value={String(data.stats.active_communities)} label="Active communities" />
                <Stat value={String(data.stats.forming_communities)} label="Forming right now" />
                <Stat
                  value={data.stats.members === null ? '<5' : data.stats.members.toLocaleString()}
                  label="Members counted"
                />
                <Stat
                  value={
                    data.stats.multi_community_members === null ? '<5' : data.stats.multi_community_members.toLocaleString()
                  }
                  label="In two or more"
                />
                <p className="col-span-2 text-xs text-[#6B7280]">
                  Counts are approximate (privacy-protected){data.counts_date ? ' and update daily' : ''}.
                </p>
              </div>
            )}
          </header>

          {data && !isAuthenticated && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E9E8E7] bg-white p-4 text-sm text-[#3F3F46]">
              <Sparkles size={18} className="text-[#6A1CF6]" />
              <span className="flex-1">Sign in to see which communities your laughs already put you in.</span>
              <Link to="/login" className="inline-flex min-h-11 items-center rounded-full bg-[#6A1CF6] px-4 font-bold text-white">
                Sign in
              </Link>
            </div>
          )}
          {data?.viewer && !data.viewer.counted && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E9E8E7] bg-white p-4 text-sm text-[#3F3F46]">
              <Info size={18} className="text-[#6A1CF6]" />
              <span className="flex-1">
                {data.viewer.shares_analytics && data.methodology.established_account_days
                  ? `You can see your own affinity. You’ll count toward community totals once your account is ${data.methodology.established_account_days} days old and you’ve laughed at ${data.methodology.established_min_jokes} or more different jokes.`
                  : 'You can see your own affinity, but you aren’t counted in community totals. Turn on audience analytics to help communities form. Adults only, and you can turn it off any time.'}
              </span>
              <Link
                to="/settings"
                className="inline-flex min-h-11 items-center rounded-full border border-[#E9E8E7] px-4 font-bold text-[#1A1A1A]"
              >
                Privacy settings
              </Link>
            </div>
          )}

          {isLoading && (
            <div className="mt-8 h-[520px] animate-pulse rounded-3xl border border-[#E9E8E7] bg-white" aria-busy="true" />
          )}
          {isError && (
            <div className="mt-8 rounded-3xl border border-[#E9E8E7] bg-white p-6" role="alert">
              <p className="text-[#3F3F46]">Communities couldn’t be loaded.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 inline-flex min-h-11 items-center rounded-full bg-[#6A1CF6] px-4 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          )}

          {data && (
            <div className={`mt-8 grid gap-6 ${isDesktop ? 'grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
              <div className="flex min-w-0 flex-col gap-6">
                <div className="rounded-3xl border border-[#E9E8E7] bg-white p-3 sm:p-5">
                  {communities.length === 0 ? (
                    <p className="p-8 text-center text-[#6B7280]">
                      No communities yet. They appear as soon as people start laughing together.
                    </p>
                  ) : (
                    <CommunityMap communities={communities} bridges={data.bridges} selected={selected} onSelect={select} />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="relative min-w-[200px] flex-1">
                      <span className="sr-only">Search communities</span>
                      <SearchIcon
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                      />
                      <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search communities"
                        className="h-12 w-full rounded-full border border-[#E9E8E7] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#6A1CF6]"
                      />
                    </label>
                    <div className="flex max-w-full gap-1.5 overflow-x-auto" role="group" aria-label="Filter communities">
                      {filters.map((key) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={filter === key}
                          onClick={() => setFilter(key)}
                          className={`min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-bold ${
                            filter === key ? 'bg-[#1A1A1A] text-white' : 'border border-[#E9E8E7] bg-white text-[#3F3F46]'
                          }`}
                        >
                          {FILTER_LABEL[key]}
                        </button>
                      ))}
                    </div>
                  </div>
                  {visible.length === 0 ? (
                    <p className="mt-4 text-sm text-[#6B7280]">
                      {filter === 'yours'
                        ? 'You’re not in a community yet. Laugh at a few jokes on a theme you love, or join one.'
                        : 'No communities match.'}
                    </p>
                  ) : (
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visible.map((community) => (
                        <CommunityListItem
                          key={community.slug}
                          community={community}
                          selected={community.slug === selected}
                          onSelect={() => select(community.slug)}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {selected && (
                <aside className={isDesktop ? 'sticky top-24 self-start' : ''}>
                  <CommunityInspector slug={selected} />
                </aside>
              )}
            </div>
          )}
          {showMethod && data && <MethodologyDialog directory={data} onClose={() => setShowMethod(false)} />}
        </div>
      </FlowAppShell>
    </div>
  )
}
