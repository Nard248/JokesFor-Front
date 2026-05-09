import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  Search,
  Sparkles,
  ArrowRight,
  Bookmark,
  PenLine,
  Calendar,
  TrendingUp,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth'
import { useTodaysJoke } from '@/features/daily-joke'
import { useSavedJokes } from '@/features/saved-jokes'
import { useDrafts } from '@/features/drafts'

/**
 * Flow Canvas — the post-login hub.
 *
 * Composes:
 *  - hero band (brand gradient, glass search, action pills)
 *  - today's joke (hero card)
 *  - for your mood (placeholder mood lanes; will become preference-filtered)
 *  - recent saves (last few from saved-jokes)
 *  - drafts in progress
 *  - discover (CTAs to other destinations)
 *
 * Iteration 1: built without seeing the original Flow Canvas.html design.
 * Visual specifics will likely change when real designs arrive; structure stays.
 */
export function FlowCanvasPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: todaysJoke } = useTodaysJoke()
  const { data: savedJokes } = useSavedJokes()
  const { data: drafts } = useDrafts()

  const firstName = user?.first_name || user?.username || 'there'
  const recentSaves = savedJokes?.results.slice(0, 4) ?? []
  const draftCount = drafts?.results.length ?? 0

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F0FF] to-[#F8F6F6]">
      {/* ── Hero band ── */}
      <section
        className="relative overflow-hidden bg-gradient-purple"
        style={{ backgroundImage: 'linear-gradient(135deg, #6A1CF6 0%, #AC8EFF 100%)' }}
      >
        {/* Decorative orbs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" aria-hidden />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#CAFD00]/10 blur-3xl animate-float" aria-hidden />

        <div className="relative max-w-6xl mx-auto px-6 lg:px-8 pt-12 pb-20">
          <div className="animate-fade-in-up">
            <p className="text-white/70 font-medium text-sm uppercase tracking-wider mb-3">
              Your canvas
            </p>
            <h1
              className="font-display text-white tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', lineHeight: 1.05 }}
            >
              Hello, {firstName}.{' '}
              <span className="text-[#CAFD00]">Find a joke for any moment.</span>
            </h1>
            <p className="mt-4 text-white/85 text-lg max-w-xl">
              Search the catalog, dip into today's pick, or pick up where you left off.
            </p>
          </div>

          {/* Glass search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-10 glass rounded-full p-2 pl-6 flex items-center gap-3 max-w-2xl shadow-search"
          >
            <Search className="w-5 h-5 text-[#6A1CF6] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tone, theme, or keyword…"
              className="flex-1 bg-transparent border-0 outline-none text-[#2E2F2F] placeholder:text-[#777777] text-base"
              aria-label="Search jokes"
            />
            <Button type="submit" variant="pill-lime" size="default" className="shrink-0">
              Search
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="pill-outline" size="default" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link to="/daily">
                <Calendar className="w-4 h-4 mr-1" />
                Today's joke
              </Link>
            </Button>
            <Button asChild variant="pill-outline" size="default" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link to="/trending">
                <TrendingUp className="w-4 h-4 mr-1" />
                Trending
              </Link>
            </Button>
            <Button asChild variant="pill-outline" size="default" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
              <Link to="/library">
                <Bookmark className="w-4 h-4 mr-1" />
                Library
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Canvas grid ── */}
      <section className="max-w-6xl mx-auto px-6 lg:px-8 py-12 space-y-12">
        {/* Today's joke — hero card */}
        <div>
          <SectionHeader
            eyebrow="Today"
            title="Your daily pick"
            actionLabel="See history"
            actionTo="/daily"
          />
          <div className="bg-white rounded-[48px] p-8 lg:p-12 shadow-card hover:shadow-card-hover transition-shadow">
            {todaysJoke ? (
              <>
                <p className="text-sm uppercase tracking-wider text-[#6A1CF6] font-bold mb-3">
                  {new Date(todaysJoke.date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="font-display text-[#2E2F2F] leading-snug" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)' }}>
                  {todaysJoke.joke.text}
                </p>
                <div className="mt-6 flex items-center gap-2 flex-wrap">
                  {todaysJoke.joke.tones.slice(0, 3).map((tone) => (
                    <span
                      key={tone.id}
                      className="px-3 py-1 rounded-full bg-[#F7F0FF] text-[#6A1CF6] text-sm font-medium"
                    >
                      {tone.name}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <EmptyDailyJokePlaceholder />
            )}
          </div>
        </div>

        {/* For your mood — placeholder lanes */}
        <div>
          <SectionHeader
            eyebrow="For your mood"
            title="Pick a vibe"
            description="Start from how you're feeling. Personalized in onboarding."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {moodLanes.map((mood) => (
              <Link
                key={mood.slug}
                to={`/search?tones=${mood.slug}`}
                className="group rounded-[32px] p-6 bg-white border border-[#E9E8E7] hover:border-[#AC8EFF] hover:shadow-card-hover transition-all"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: mood.background }}
                >
                  {mood.emoji}
                </div>
                <h3 className="font-display text-xl text-[#2E2F2F]">{mood.label}</h3>
                <p className="mt-1 text-sm text-[#6B7280]">{mood.description}</p>
                <div className="mt-3 inline-flex items-center text-sm font-semibold text-[#6A1CF6] gap-1">
                  Explore
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent saves */}
        <div>
          <SectionHeader
            eyebrow="From your library"
            title="Recently saved"
            actionLabel="See all"
            actionTo="/library"
          />
          {recentSaves.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSaves.map((save) => (
                <article
                  key={save.id}
                  className="rounded-[32px] p-5 bg-white border border-[#E9E8E7] shadow-card flex flex-col"
                >
                  <p className="text-sm text-[#2E2F2F] line-clamp-4 flex-1">{save.joke.text}</p>
                  <div className="mt-3 pt-3 border-t border-[#E9E8E7] text-xs text-[#777777]">
                    {new Date(save.saved_at).toLocaleDateString()}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Bookmark className="w-6 h-6 text-[#6A1CF6]" />}
              title="Nothing saved yet"
              description="Save jokes you love and they'll show up here for quick access."
              actionLabel="Browse the library"
              actionTo="/library"
            />
          )}
        </div>

        {/* Drafts in progress */}
        {draftCount > 0 && (
          <div>
            <SectionHeader
              eyebrow="In progress"
              title={`${draftCount} draft${draftCount === 1 ? '' : 's'} waiting`}
              actionLabel="Open drafts"
              actionTo="/drafts"
            />
            <Link
              to="/drafts"
              className="block rounded-[32px] p-6 bg-[#F7F0FF] border border-[#AC8EFF]/30 hover:bg-white hover:shadow-card-hover transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#6A1CF6] flex items-center justify-center shrink-0">
                  <PenLine className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg text-[#2E2F2F]">Pick up where you left off</p>
                  <p className="text-sm text-[#52525B] truncate">
                    You have {draftCount} draft{draftCount === 1 ? '' : 's'} ready to be polished.
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-[#6A1CF6] shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* Discover — CTA row */}
        <div>
          <SectionHeader eyebrow="Keep going" title="Discover & contribute" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DiscoverCard
              to="/submit"
              title="Share your own"
              description="Got a banger? Submit a joke for the community."
              icon={<Plus className="w-5 h-5" />}
              accent="lime"
            />
            <DiscoverCard
              to="/trending"
              title="See what's trending"
              description="What's hitting hard with the community right now."
              icon={<Sparkles className="w-5 h-5" />}
              accent="purple"
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Local components — kept inside the file because they're not reused
// elsewhere yet. Promote to /components/ if a second consumer appears.
// ──────────────────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
}

function SectionHeader({ eyebrow, title, description, actionLabel, actionTo }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-[#6A1CF6] font-bold mb-1">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl lg:text-3xl text-[#2E2F2F]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[#6B7280] max-w-prose">{description}</p>
        )}
      </div>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="text-sm font-semibold text-[#6A1CF6] hover:underline shrink-0 inline-flex items-center gap-1"
        >
          {actionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  actionTo: string
}

function EmptyState({ icon, title, description, actionLabel, actionTo }: EmptyStateProps) {
  return (
    <div className="rounded-[32px] p-8 bg-white border border-dashed border-[#E3E2E2] text-center">
      <div className="w-12 h-12 rounded-full bg-[#F7F0FF] mx-auto flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-display text-lg text-[#2E2F2F]">{title}</h3>
      <p className="text-sm text-[#6B7280] mt-1 mb-4">{description}</p>
      <Button asChild variant="pill-outline" size="default">
        <Link to={actionTo}>{actionLabel}</Link>
      </Button>
    </div>
  )
}

function EmptyDailyJokePlaceholder() {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 rounded-full bg-[#F7F0FF] mx-auto flex items-center justify-center mb-3">
        <Calendar className="w-6 h-6 text-[#6A1CF6]" />
      </div>
      <p className="font-display text-lg text-[#2E2F2F]">Today's joke is brewing</p>
      <p className="text-sm text-[#6B7280] mt-1">Check back in a moment.</p>
    </div>
  )
}

interface DiscoverCardProps {
  to: string
  title: string
  description: string
  icon: React.ReactNode
  accent: 'lime' | 'purple'
}

function DiscoverCard({ to, title, description, icon, accent }: DiscoverCardProps) {
  const accentClasses =
    accent === 'lime'
      ? 'bg-[#CAFD00] text-[#3A4A00]'
      : 'bg-[#6A1CF6] text-white'

  return (
    <Link
      to={to}
      className="group rounded-[32px] p-6 bg-white border border-[#E9E8E7] hover:shadow-card-hover transition-all flex items-start gap-4"
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${accentClasses}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-xl text-[#2E2F2F]">{title}</h3>
        <p className="text-sm text-[#6B7280] mt-1">{description}</p>
      </div>
      <ArrowRight className="w-5 h-5 text-[#6A1CF6] mt-1 shrink-0 group-hover:translate-x-1 transition-transform" />
    </Link>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Static data — until tones are personalized via /preferences/me/
// ──────────────────────────────────────────────────────────────────────────

const moodLanes = [
  {
    slug: 'witty',
    label: 'Witty',
    description: 'Sharp setups, sharper landings.',
    emoji: '🎯',
    background: 'linear-gradient(135deg, #F7F0FF, #AC8EFF33)',
  },
  {
    slug: 'wholesome',
    label: 'Wholesome',
    description: 'For when you need a soft landing.',
    emoji: '🫶',
    background: 'linear-gradient(135deg, #FFF4DB, #FFC96533)',
  },
  {
    slug: 'dry',
    label: 'Dry',
    description: 'Deadpan delivery, devastating punchline.',
    emoji: '🏜️',
    background: 'linear-gradient(135deg, #F2F0F0, #DDDCDC)',
  },
  {
    slug: 'dark',
    label: 'Dark',
    description: 'Gallows humor, handle with care.',
    emoji: '🖤',
    background: 'linear-gradient(135deg, #2E2F2F, #52525B)',
  },
  {
    slug: 'goofy',
    label: 'Goofy',
    description: "When you don't need to think.",
    emoji: '🤡',
    background: 'linear-gradient(135deg, #CAFD0033, #CAFD0066)',
  },
  {
    slug: 'clever',
    label: 'Clever',
    description: "Smart enough to feel earned.",
    emoji: '🧩',
    background: 'linear-gradient(135deg, #6A1CF633, #AC8EFF33)',
  },
]
