import { useState } from 'react'
import { Search, SlidersHorizontal, ArrowDownUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CollectionCard } from '@/components/CollectionCard'
import { SavedJokeRow } from '@/components/SavedJokeRow'
import { Pagination } from '@/components/Pagination'
import { useCollections } from '@/features/collections'
import { useSavedJokes } from '@/features/saved-jokes'
import { mockSavedJokes } from '@/lib/mock-data'

export function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'latest' | 'filter'>('latest')

  const { data: _collectionsData } = useCollections()
  const { data: savedJokesData } = useSavedJokes()

  const savedJokes = savedJokesData?.results || mockSavedJokes
  const totalPages = Math.ceil((savedJokesData?.count || mockSavedJokes.length) / 10)

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-8">
        <div>
          {/* Mobile label */}
          <div className="lg:hidden mb-1">
            <Badge variant="lime" size="default">Collection Hub</Badge>
          </div>
          <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F]">My Library</h1>
          <p className="text-[#6B7280] mt-1 hidden lg:block">Curate your punchlines, organize your wit.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Desktop Search */}
          <div className="hidden lg:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search my library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-11 pr-4 rounded-full border border-[#E9E8E7] bg-white text-sm w-64 outline-none focus:border-[#6A1CF6]"
            />
          </div>
          {/* Mobile new collection button */}
          <Button variant="pill" className="lg:hidden w-full gap-2">
            <Plus className="size-4" /> New Collection
          </Button>
        </div>
      </div>

      {/* ── Collections (Desktop) ── */}
      <section className="hidden lg:block mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-2xl text-[#2E2F2F]">Collections</h2>
          <button className="text-sm font-semibold text-[#6A1CF6] hover:underline">View All Collections</button>
        </div>
        <div className="grid grid-cols-4 gap-4" style={{ gridTemplateRows: 'auto' }}>
          <CollectionCard
            variant="image-overlay"
            title="Work Icebreakers"
            description="Professional giggles for the Monday standup."
            jokeCount={42}
            imageUrl="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=600&h=400&fit=crop"
            size="lg"
            className="col-span-2 row-span-2"
          />
          <CollectionCard
            variant="image-overlay"
            title="Dad Jokes"
            jokeCount={128}
            imageUrl="https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=400&h=400&fit=crop"
            className="row-span-2"
          />
          <CollectionCard
            variant="accent"
            title="Quick Hits"
            description="Short & Punchy"
            bgColor="#FFC965"
          />
          <CollectionCard variant="new" />
        </div>
      </section>

      {/* ── Collections (Mobile) ── */}
      <section className="lg:hidden mb-8 space-y-3">
        {/* All-Time Classics */}
        <Card radius="lg" className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⭐</span>
            <Badge variant="amber" size="sm">Master List</Badge>
          </div>
          <h3 className="font-display font-bold text-xl text-[#2E2F2F] mb-1">The All-Time Classics</h3>
          <p className="text-sm text-[#6B7280] mb-3">42 jokes that never fail to land at a dinner party.</p>
          <div className="flex items-center gap-1">
            {['A', 'J', 'S'].map((initial, i) => (
              <div
                key={initial}
                className="size-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: ['#6A1CF6', '#FFC965', '#CAFD00'][i], marginLeft: i > 0 ? '-4px' : '0' }}
              >
                {initial}
              </div>
            ))}
            <button className="ml-2 size-7 rounded-full bg-[#6A1CF6] flex items-center justify-center">
              <span className="text-white text-xs">→</span>
            </button>
          </div>
        </Card>

        {/* Dad Jokes */}
        <Card radius="lg" className="p-5 bg-[#FFC965]/30">
          <span className="text-lg mb-2 block">😊</span>
          <h3 className="font-display font-bold text-xl text-[#2E2F2F] mb-1">Dad Jokes</h3>
          <p className="text-sm text-[#6B7280] mb-3">12 saved groaners.</p>
          <div className="bg-white/60 rounded-2xl p-3 text-sm text-[#52525B] italic">
            "I'm afraid for the calendar. Its days are numbered."
          </div>
        </Card>

        {/* One-Liners */}
        <Card radius="lg" className="p-5">
          <span className="text-lg mb-2 block">✨</span>
          <h3 className="font-display font-bold text-xl text-[#2E2F2F]">One-Liners</h3>
          <p className="text-xs text-[#6B7280] mt-1">Updated 2h ago</p>
        </Card>

        {/* Work Humor */}
        <div className="rounded-[32px] bg-[#CAFD00] p-5">
          <span className="text-lg mb-2 block">💼</span>
          <h3 className="font-display font-bold text-xl text-[#2E2F2F]">Work Humor</h3>
        </div>

        {/* Archive */}
        <Card radius="lg" className="flex items-center gap-3 p-4">
          <span className="text-lg">📦</span>
          <div>
            <h3 className="font-display font-bold text-base text-[#2E2F2F]">Archive</h3>
            <p className="text-xs text-[#6B7280]">204 items</p>
          </div>
        </Card>
      </section>

      {/* ── All Saved Jokes ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl text-[#2E2F2F]">
            {/* Mobile label */}
            <span className="lg:hidden">Recent Saves</span>
            <span className="hidden lg:inline">All Saved Jokes</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* Mobile: count badge + view all */}
            <div className="lg:hidden flex items-center gap-2">
              <Badge variant="default" size="sm">{savedJokes.length}</Badge>
              <button className="text-sm font-semibold text-[#6A1CF6]">View all ↗</button>
            </div>
            {/* Desktop: Filter + Sort */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant={sortBy === 'filter' ? 'pill' : 'pill-outline'}
                size="sm"
                onClick={() => setSortBy('filter')}
                className="gap-1"
              >
                <SlidersHorizontal className="size-3.5" /> Filter
              </Button>
              <Button
                variant={sortBy === 'latest' ? 'pill' : 'pill-outline'}
                size="sm"
                onClick={() => setSortBy('latest')}
                className="gap-1"
              >
                <ArrowDownUp className="size-3.5" /> Latest
              </Button>
            </div>
          </div>
        </div>

        {/* Joke List */}
        <div className="divide-y divide-[#E9E8E7]">
          {savedJokes.map((savedJoke) => (
            <SavedJokeRow
              key={savedJoke.id}
              savedJoke={savedJoke}
              showActions={window.innerWidth < 1024}
            />
          ))}
        </div>

        {/* Pagination (Desktop) */}
        <div className="hidden lg:block mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </section>

      {/* Desktop: Add New Joke floating button (bottom-left) */}
      <div className="hidden lg:block fixed bottom-8 left-[240px]">
        <Button variant="pill-lime" size="xl" className="gap-2 shadow-lg">
          <Plus className="size-5" /> Add New Joke
        </Button>
      </div>
    </div>
  )
}
