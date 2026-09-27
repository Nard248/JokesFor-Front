import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowUpRight as ShareIcon,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  GitBranch,
  Heart,
  LoaderCircle,
  Network,
  Orbit,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { communityRequest } from './api'
import { CommunityGraph } from './CommunityGraph'
import type { Snapshot, Subject } from './types'

const number = (value: number) => value.toLocaleString()
const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('en', { month: 'short', day: 'numeric' })

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values)
  const points = values
    .map(
      (value, index) =>
        `${(index * 100) / Math.max(1, values.length - 1)},${32 - (value / max) * 27}`,
    )
    .join(' ')
  return (
    <svg
      viewBox="0 0 100 36"
      className="cl-sparkline"
      role="img"
      aria-label={`Last seven daily activity counts: ${values.join(', ')}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SubjectRow({
  subject,
  selected,
  onSelect,
}: {
  subject: Subject
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      className={`cl-subject-row ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className="cl-subject-emoji" style={{ backgroundColor: `${subject.color}13` }}>
        {subject.emoji}
      </span>
      <span className="cl-subject-row-copy">
        <strong>{subject.name}</strong>
        <small>{number(subject.members)} members</small>
      </span>
      {subject.status === 'forming' ? (
        <span className="cl-forming-dot" title="Community forming" />
      ) : (
        <ChevronRight size={13} />
      )}
    </button>
  )
}

export function CommunityApp() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [search, setSearch] = useState('')
  const [joinedOnly, setJoinedOnly] = useState(false)
  const [focusOnly, setFocusOnly] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [showMethod, setShowMethod] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const inFlight = useRef(false)
  const shareEventIds = useRef(new Map<string, string>())

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const next = await communityRequest('snapshot', undefined, signal)
      setSnapshot(next)
      setSelectedId(
        (current) =>
          current ||
          next.subjects.find((subject) => subject.status === 'forming')?.id ||
          next.subjects[0]?.id ||
          '',
      )
    } catch (caught) {
      if (caught instanceof Error && caught.name === 'AbortError') return
      setError(caught instanceof Error ? caught.message : 'Community data could not be loaded.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => controller.abort()
  }, [load])

  const mutate = useCallback(
    async (endpoint: string, body: Record<string, unknown>, message: string) => {
      if (inFlight.current) return false
      inFlight.current = true
      setPending(endpoint)
      setError('')
      setAnnouncement('')
      try {
        const next = await communityRequest(endpoint, body)
        setSnapshot(next)
        setAnnouncement(message)
        return true
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : 'The action could not be completed. Try again.',
        )
        setAutoplay(false)
        return false
      } finally {
        inFlight.current = false
        setPending('')
      }
    },
    [],
  )

  useEffect(() => {
    if (!autoplay || pending || !selectedId) return
    const timer = window.setTimeout(() => {
      void mutate(
        'simulate',
        { subject_id: selectedId, steps: 2 },
        'Synthetic activity recorded. The community graph is up to date.',
      )
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [autoplay, pending, selectedId, mutate])

  async function share(contentId: string) {
    let eventId = shareEventIds.current.get(contentId)
    if (!eventId) {
      eventId = crypto.randomUUID()
      shareEventIds.current.set(contentId, eventId)
    }
    if (
      await mutate(
        'share',
        { content_id: contentId, event_id: eventId },
        'Joke shared with synthetic friends. Their reactions are now reflected in the graph.',
      )
    ) {
      shareEventIds.current.delete(contentId)
    }
  }

  if (!snapshot) {
    return (
      <main className="cl-start-state">
        <img className="cl-brand-icon" src="/Logos/appicon_purple.svg" alt="" />
        <h1>JokesFor Constellations</h1>
        {loading ? (
          <>
            <LoaderCircle className="cl-spinner" aria-hidden="true" />
            <p>Finding the things that make us laugh together…</p>
          </>
        ) : (
          <>
            <p role="alert">{error || 'No community data is available.'}</p>
            <button className="cl-button cl-primary" onClick={() => void load()}>
              <RefreshCw size={15} />
              Retry connection
            </button>
          </>
        )}
      </main>
    )
  }

  const selected =
    snapshot.subjects.find((subject) => subject.id === selectedId) || snapshot.subjects[0]
  const visibleSubjects = snapshot.subjects.filter(
    (subject) =>
      (!joinedOnly || subject.joined) &&
      `${subject.name} ${subject.description}`.toLowerCase().includes(search.trim().toLowerCase()),
  )
  const visibleIds = new Set(
    visibleSubjects
      .filter((subject) => !focusOnly || subject.id === selected?.id)
      .map((subject) => subject.id),
  )
  const selectedContent = snapshot.content
    .filter((content) => content.subject_id === selected?.id)
    .sort((a, b) => b.trending_score - a.trending_score)
    .slice(0, 3)
  const recentActivity = snapshot.activity
    .filter((event) => !focusOnly || event.subject_id === selected?.id)
    .slice(0, 5)
  const membershipProgress = selected
    ? Math.min(100, (selected.active_members / snapshot.methodology.minimum_members) * 100)
    : 0
  const displayedMemberCount = snapshot.graph.nodes.filter((node) => node.kind === 'member').length

  return (
    <div className="cl-app">
      <a className="cl-skip-link" href="#community-main">
        Skip to community explorer
      </a>
      <header className="cl-app-header">
        <div className="cl-header-left">
          <a
            className="cl-brand"
            href="/communities.html"
            aria-label="JokesFor Constellations home"
          >
            <img className="cl-brand-icon" src="/Logos/appicon_purple.svg" alt="" />
            <span>JokesFor</span>
          </a>
          <nav className="cl-app-nav" aria-label="Community page sections">
            <a href="#community-main" aria-current="page">
              Constellations
            </a>
            <a href="#community-content">Trending</a>
            <a href="#community-activity">Activity</a>
          </nav>
        </div>
        <div className="cl-header-context">
          <span className="tag-flow">Community lab</span>
          <span className="cl-header-demo">Synthetic people & activity</span>
        </div>
      </header>
      <div className="cl-workspace">
        <aside className="cl-sidebar" aria-label="Community navigation">
          <div className="cl-sidebar-intro">
            <span className="eyebrow-mono">Explore communities</span>
            <button
              className="cl-nav-item is-selected"
              onClick={() => {
                setJoinedOnly(false)
                setSearch('')
                setFocusOnly(false)
              }}
            >
              <Network size={18} />
              All communities
            </button>
          </div>
          <div className="cl-sidebar-heading">
            <span>Your communities</span>
            <span>{snapshot.subjects.filter((subject) => subject.joined).length}</span>
          </div>
          <div className="cl-side-filters">
            <button
              aria-pressed={!joinedOnly}
              className={!joinedOnly ? 'is-selected' : ''}
              onClick={() => setJoinedOnly(false)}
            >
              <Compass size={14} />
              Discover
            </button>
            <button
              aria-pressed={joinedOnly}
              className={joinedOnly ? 'is-selected' : ''}
              onClick={() => setJoinedOnly(true)}
            >
              <Heart size={14} />
              Joined
            </button>
          </div>
          <label className="cl-search">
            <Search size={15} />
            <input
              aria-label="Search communities"
              placeholder="Find your people"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} aria-label="Clear community search">
                <X size={13} />
              </button>
            )}
          </label>
          <div className="cl-community-list">
            {visibleSubjects.map((subject) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                selected={subject.id === selected?.id}
                onSelect={() => setSelectedId(subject.id)}
              />
            ))}
            {visibleSubjects.length === 0 && (
              <p className="cl-empty-copy">
                {joinedOnly
                  ? 'Your joined communities will appear here. Discover a circle and join in.'
                  : 'No matching communities. Try another subject.'}
              </p>
            )}
          </div>
          <div className="cl-sidebar-bottom">
            <div className="cl-sidebar-story">
              <Sparkles size={19} />
              <strong>
                Good jokes travel.
                <br />
                Good company follows.
              </strong>
              <p>Share a laugh. See a little community begin.</p>
            </div>
            <button className="cl-help-link" onClick={() => setShowMethod(true)}>
              <CircleHelp size={17} />
              How communities form
            </button>
            <div className="cl-viewer">
              <span className="cl-avatar">Y</span>
              <div>
                <strong>{snapshot.viewer.name}</strong>
                <small>Synthetic demo participant</small>
              </div>
            </div>
          </div>
        </aside>

        <main id="community-main" className="cl-main">
          <div className="cl-topbar">
            <div className="cl-breadcrumb">
              Explore <ChevronRight size={13} />
              <strong>Constellations</strong>
            </div>
            <span className="tag-flow lime">Interactive demo</span>
          </div>
          <section className="cl-page-intro">
            <div>
              <h1 aria-label="Find your kind of funny.">
                Find your kind of <em className="wink">funny.</em>
              </h1>
              <p>Little laughs become shared interests. Shared interests become communities.</p>
            </div>
            <button className="cl-button cl-quiet" onClick={() => setShowMethod(true)}>
              <CircleHelp size={16} />
              How it works
            </button>
          </section>
          <div className="cl-stats" aria-label="Community statistics">
            <div>
              <span className="cl-stat-icon violet">
                <Users size={18} />
              </span>
              <div>
                <strong>{number(snapshot.stats.participants)}</strong>
                <span>People in the experiment</span>
              </div>
            </div>
            <div>
              <span className="cl-stat-icon mint">
                <Orbit size={19} />
              </span>
              <div>
                <strong>
                  {number(snapshot.stats.active_communities)}
                  <small> + {number(snapshot.stats.emerging_communities)} forming</small>
                </strong>
                <span>Living communities</span>
              </div>
            </div>
            <div>
              <span className="cl-stat-icon peach">
                <ShareIcon size={19} />
              </span>
              <div>
                <strong>{number(snapshot.stats.shares)}</strong>
                <span>Laughs passed along</span>
              </div>
            </div>
            <div>
              <span className="cl-stat-icon blue">
                <GitBranch size={18} />
              </span>
              <div>
                <strong>{number(snapshot.stats.bridges)}</strong>
                <span>People connecting subjects</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="cl-alert" role="alert">
              <span>{error}</span>
              <button
                className="cl-button"
                disabled={!!pending || loading}
                onClick={() => void load()}
              >
                Reload data
              </button>
              <button aria-label="Dismiss error" onClick={() => setError('')}>
                <X size={16} />
              </button>
            </div>
          )}
          <div
            role="status"
            aria-live="polite"
            className={`cl-announcement ${announcement ? 'is-visible' : ''}`}
          >
            {announcement && (
              <>
                <Check size={15} />
                <span>{announcement}</span>
              </>
            )}
          </div>

          <div className="cl-explorer-grid">
            <section className="cl-graph-panel" aria-labelledby="constellation-heading">
              <div className="cl-panel-heading">
                <div>
                  <h2 id="constellation-heading">The laughter constellation</h2>
                  <p>Each little dot is a person. Each circle, something in common.</p>
                </div>
                <div className="cl-segmented">
                  <button
                    className={!focusOnly ? 'is-selected' : ''}
                    aria-pressed={!focusOnly}
                    onClick={() => setFocusOnly(false)}
                  >
                    All circles
                  </button>
                  <button
                    className={focusOnly ? 'is-selected' : ''}
                    aria-pressed={focusOnly}
                    onClick={() => setFocusOnly(true)}
                  >
                    Focus selected
                  </button>
                </div>
              </div>
              <CommunityGraph
                snapshot={snapshot}
                selectedId={selected?.id || ''}
                visibleIds={visibleIds}
                onSelect={setSelectedId}
              />
              <div className="cl-sample-caption">
                <span>
                  {number(displayedMemberCount)} sampled people in the full graph ·{' '}
                  {number(snapshot.meta.total_members)} distinct community members
                </span>
                <button onClick={() => setShowMethod(true)}>
                  About this graph <ChevronRight size={12} />
                </button>
              </div>
              <div className="cl-simulation-bar">
                <div className="cl-simulation-copy">
                  <span className="cl-simulation-icon">
                    <Sparkles size={18} />
                  </span>
                  <div>
                    <strong>Give this circle a little momentum</strong>
                    <span>
                      Simulate independent reactions in {selected?.name || 'a community'}.
                    </span>
                  </div>
                </div>
                <div className="cl-simulation-actions">
                  <button
                    className="cl-button cl-primary"
                    aria-label="Simulate activity"
                    disabled={!!pending || !selected}
                    onClick={() =>
                      void mutate(
                        'simulate',
                        { subject_id: selected?.id, steps: 6 },
                        'Synthetic reactions recorded. See how the community changed.',
                      )
                    }
                  >
                    {pending === 'simulate' ? (
                      <LoaderCircle size={14} className="cl-spinner" />
                    ) : (
                      <Play size={13} fill="currentColor" />
                    )}
                    Simulate sharing
                  </button>
                  <button
                    className={`cl-icon-button ${autoplay ? 'is-selected' : ''}`}
                    aria-label={
                      autoplay ? 'Pause automatic simulation' : 'Start automatic simulation'
                    }
                    aria-pressed={autoplay}
                    onClick={() => setAutoplay(!autoplay)}
                    disabled={!!pending && !autoplay}
                  >
                    {autoplay ? <Pause size={16} /> : <RefreshCw size={16} />}
                  </button>
                </div>
              </div>
            </section>

            {selected && (
              <aside className="cl-inspector" aria-label="Selected community details">
                <div
                  className="cl-inspector-top"
                  style={{ backgroundColor: `${selected.color}12` }}
                >
                  <span
                    className="cl-inspector-emoji"
                    style={{ backgroundColor: `${selected.color}19` }}
                  >
                    {selected.emoji}
                  </span>
                  <span className={`cl-status cl-status-${selected.status}`}>
                    <span />
                    {selected.status === 'active'
                      ? 'Community in motion'
                      : selected.status === 'forming'
                        ? 'A community is forming'
                        : 'A quieter moment'}
                  </span>
                </div>
                <div className="cl-inspector-body">
                  <h2>{selected.name}</h2>
                  <p className="cl-subject-description">{selected.description}</p>
                  <div className="cl-member-line">
                    <div className="cl-mini-people" aria-hidden="true">
                      <span style={{ backgroundColor: selected.color }}>☺</span>
                      <span>☺</span>
                      <span>☺</span>
                    </div>
                    <span>
                      <strong>{number(selected.members)}</strong> people found their circle
                    </span>
                  </div>
                  <button
                    className={`cl-button cl-join ${selected.joined ? 'is-joined' : 'cl-primary'}`}
                    disabled={!!pending}
                    aria-label={selected.joined ? 'Leave community' : 'Join community'}
                    onClick={() =>
                      void mutate(
                        'membership',
                        { subject_id: selected.id, action: selected.joined ? 'leave' : 'join' },
                        selected.joined
                          ? `You left ${selected.name}. Automatic membership is paused until you join again.`
                          : `You joined ${selected.name}.`,
                      )
                    }
                  >
                    {pending === 'membership' ? (
                      <LoaderCircle size={15} className="cl-spinner" />
                    ) : selected.joined ? (
                      <Check size={15} />
                    ) : (
                      <PlusIcon />
                    )}{' '}
                    {selected.joined ? 'Leave community' : 'Join this community'}
                  </button>
                  <div className="cl-inspector-metrics">
                    <div>
                      <strong>{number(selected.active_members)}</strong>
                      <span>Engaged people</span>
                    </div>
                    <div>
                      <strong className={selected.growth >= 0 ? 'cl-positive' : 'cl-negative'}>
                        {selected.growth >= 0 ? (
                          <ArrowUpRight size={15} />
                        ) : (
                          <ArrowDownRight size={15} />
                        )}
                        {selected.growth > 0 ? '+' : ''}
                        {number(selected.growth)}
                      </strong>
                      <span>Change vs. prior 7 days</span>
                    </div>
                  </div>
                  <div className="cl-activity-chart">
                    <div>
                      <strong>The past 7 days</strong>
                      <span>
                        {number(selected.activity.reduce((sum, value) => sum + value, 0))}{' '}
                        interactions
                      </span>
                    </div>
                    <Sparkline values={selected.activity} color={selected.color} />
                  </div>
                  <div className="cl-formation">
                    <div>
                      <Network size={15} />
                      <strong>
                        {selected.status === 'forming'
                          ? 'A few laughs from a community'
                          : 'Formed through shared laughter'}
                      </strong>
                    </div>
                    <p>{selected.explanation}</p>
                    {selected.status === 'forming' && (
                      <>
                        <div
                          className="cl-progress"
                          role="progressbar"
                          aria-valuenow={selected.active_members}
                          aria-valuemin={0}
                          aria-valuemax={Math.max(
                            selected.active_members,
                            snapshot.methodology.minimum_members,
                          )}
                          aria-label="Engaged people needed to form a community"
                        >
                          <span
                            style={{
                              width: `${membershipProgress}%`,
                              backgroundColor: selected.color,
                            }}
                          />
                        </div>
                        <small>
                          {selected.active_members} of {snapshot.methodology.minimum_members}{' '}
                          independently engaged people
                        </small>
                      </>
                    )}
                  </div>
                  <div className="cl-your-affinity">
                    <Heart size={14} />
                    <span>
                      Your interest score <strong>{selected.affinity.toFixed(1)}</strong>
                    </span>
                    <button
                      aria-label="Learn how interest scores work"
                      onClick={() => setShowMethod(true)}
                    >
                      <CircleHelp size={13} />
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>

          <div className="cl-bottom-grid">
            <section
              id="community-content"
              className="cl-trending"
              aria-labelledby="trending-heading"
            >
              <div className="cl-section-heading">
                <div>
                  <h2 id="trending-heading">The jokes bringing people together</h2>
                  <p>Trending in {selected?.name || 'your constellation'}</p>
                </div>
                <span className="cl-small-tag">
                  <Sparkles size={12} />
                  By engagement
                </span>
              </div>
              <div className="cl-joke-grid">
                {selectedContent.map((content) => (
                  <article className="cl-joke" key={content.id}>
                    <div className="cl-joke-meta">
                      <span>
                        {selected?.emoji} {content.format}
                      </span>
                      <span>{content.creator}</span>
                    </div>
                    <h3>{content.title}</h3>
                    <p>{content.punchline}</p>
                    <div className="cl-joke-footer">
                      <span>
                        <Heart size={13} />
                        {number(content.likes)}
                        <ShareIcon size={13} />
                        {number(content.shares)}
                      </span>
                      <button
                        disabled={!!pending}
                        onClick={() => void share(content.id)}
                        aria-label={`Share joke: ${content.title}`}
                      >
                        Share a laugh <ShareIcon size={14} />
                      </button>
                    </div>
                  </article>
                ))}
                {selectedContent.length === 0 && (
                  <p className="cl-empty-copy">
                    No trending jokes in this circle yet. Simulate sharing to start some activity.
                  </p>
                )}
              </div>
            </section>
            <section
              id="community-activity"
              className="cl-activity-ledger"
              aria-labelledby="activity-heading"
            >
              <div className="cl-section-heading">
                <div>
                  <h2 id="activity-heading">Life in the constellation</h2>
                  <p>{focusOnly ? selected?.name : 'Across all communities'}</p>
                </div>
                <span className="cl-live-tag">
                  <span />
                  Live
                </span>
              </div>
              <div className="cl-activity-list">
                {recentActivity.map((event) => (
                  <div key={event.id} className="cl-activity-item">
                    <span
                      className="cl-activity-symbol"
                      style={{
                        color: snapshot.subjects.find((subject) => subject.id === event.subject_id)
                          ?.color,
                      }}
                    >
                      <Activity size={14} />
                    </span>
                    <div>
                      <p>{event.description}</p>
                      <span>
                        {event.subject_name} <span>·</span> {shortDate(event.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <p className="cl-empty-copy">The next shared laugh starts this story.</p>
                )}
              </div>
            </section>
          </div>
          <footer className="cl-page-footer">
            <span>
              <Clock3 size={13} />
              Demo clock: {shortDate(snapshot.meta.simulated_at)}
              <span>·</span>
              {number(snapshot.stats.interactions)} persisted interactions
            </span>
            <button
              className="cl-button cl-quiet"
              aria-label="Advance 7 days"
              disabled={!!pending}
              onClick={() => {
                setAutoplay(false)
                void mutate(
                  'advance',
                  { days: 7 },
                  'The demo clock moved forward 7 days. Interest scores decayed and communities were recalculated.',
                )
              }}
            >
              {pending === 'advance' ? (
                <LoaderCircle size={13} className="cl-spinner" />
              ) : (
                <Clock3 size={13} />
              )}
              Advance 7 days
            </button>
          </footer>
        </main>
      </div>

      {showMethod && <MethodDialog snapshot={snapshot} onClose={() => setShowMethod(false)} />}
    </div>
  )
}

function PlusIcon() {
  return (
    <span aria-hidden="true" style={{ fontSize: 19, lineHeight: 0.8 }}>
      +
    </span>
  )
}

function MethodDialog({ snapshot, onClose }: { snapshot: Snapshot; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialogRef}
      className="cl-method-dialog"
      aria-labelledby="method-heading"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="cl-method-content">
        <button
          className="cl-dialog-close cl-icon-button"
          aria-label="Close explanation"
          onClick={onClose}
        >
          <X size={19} />
        </button>
        <span className="cl-method-icon">
          <Network size={29} />
        </span>
        <h2 id="method-heading">
          A community begins
          <br />
          with something in common.
        </h2>
        <p>
          Subjects are shared meeting places. There are no competing groups to pick from, and you
          can belong to several circles at once.
        </p>
        <ol>
          <li>
            <strong>Pass along a laugh.</strong>
            <span>
              Shares and independent positive reactions contribute to an interest score. A sent
              share never establishes a friend’s interest by itself.
            </span>
          </li>
          <li>
            <strong>Find a pattern.</strong>
            <span>
              At least {snapshot.methodology.minimum_content} different jokes and an interest score
              of {snapshot.methodology.membership_threshold} are needed for automatic membership.
            </span>
          </li>
          <li>
            <strong>Watch a circle form.</strong>
            <span>
              {snapshot.methodology.minimum_members} independently engaged people form an active
              community. Interests lose half their weight every{' '}
              {snapshot.methodology.half_life_days} days without new activity.
            </span>
          </li>
        </ol>
        <p className="cl-method-note">
          <strong>This is an experiment with synthetic people.</strong> Sharing triggers a bounded
          simulation of friends’ independently attributed reactions. The graph displays{' '}
          {number(snapshot.meta.sampled_nodes)} sampled people; full membership counts can include
          the same person in several communities. Joining is explicit; leaving pauses automatic
          membership until you rejoin.
        </p>
        <p className="cl-method-caption">{snapshot.meta.caption}</p>
        <button className="cl-button cl-primary" onClick={onClose}>
          Explore the constellation
        </button>
      </div>
    </dialog>
  )
}
