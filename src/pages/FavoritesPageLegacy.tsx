import { useState } from 'react'
import { Heart, Bookmark, TrendingUp, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { JokeCard } from '@/components/JokeCard'
import { SortButtons } from '@/components/search/SortButtons'
import { Chip } from '@/components/ui/chip'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/Pagination'
import { useFavorites, useFavoriteStats } from '@/features/favorites'
import { useNavigate } from 'react-router'

const humorFilters = ['All', 'Dad Joke', 'Punny', 'Sarcastic', 'Geeky', 'Classic']

export function FavoritesPageLegacy() {
  const navigate = useNavigate()
  const [sort, setSort] = useState('relevance')
  const [activeFilter, setActiveFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  const toneParam = activeFilter === 'All' ? undefined : activeFilter
  const { data: favoritesData } = useFavorites({ tones: toneParam, page: currentPage })
  const { data: stats } = useFavoriteStats()

  const filtered = favoritesData?.results || []
  const favoriteCount = stats?.totalCount ?? 0
  const topTone = stats?.topTone ?? 'Dad Jokes'
  const thisWeek = stats?.thisWeekCount ?? 0

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-6xl">
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="size-8 text-red-500 fill-red-500" />
          <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F]">
            Your Favorites
          </h1>
          <Badge variant="default" size="lg">{favoriteCount}</Badge>
        </div>
        <p className="text-[#6B7280] text-base lg:text-lg">
          The ones that made you actually laugh out loud.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-3 gap-3 lg:gap-4 mb-8">
        <Card radius="md" className="p-4 text-center">
          <Bookmark className="size-6 text-[#6A1CF6] mx-auto mb-2" />
          <p className="font-display font-bold text-2xl text-[#2E2F2F]">{favoriteCount}</p>
          <p className="text-xs text-[#6B7280]">Total Favorites</p>
        </Card>
        <Card radius="md" className="p-4 text-center">
          <TrendingUp className="size-6 text-[#FFC965] mx-auto mb-2" />
          <p className="font-display font-bold text-lg text-[#2E2F2F]">{topTone}</p>
          <p className="text-xs text-[#6B7280]">Most Liked Tone</p>
        </Card>
        <Card radius="md" className="p-4 text-center">
          <Calendar className="size-6 text-[#CAFD00] mx-auto mb-2" />
          <p className="font-display font-bold text-2xl text-[#2E2F2F]">+{thisWeek}</p>
          <p className="text-xs text-[#6B7280]">This Week</p>
        </Card>
      </section>

      {/* Filters + Sort */}
      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {humorFilters.map((filter) => (
            <Chip
              key={filter}
              selected={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
              className="shrink-0"
            >
              {filter}
            </Chip>
          ))}
        </div>
        <div className="hidden lg:block">
          <SortButtons value={sort} onChange={setSort} />
        </div>
      </section>

      {/* Favorites Grid */}
      {filtered.length > 0 ? (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            {filtered.map((fav) => (
              <div key={fav.joke.id} className="relative">
                <JokeCard joke={fav.joke} showBookmark />
                <div className="absolute top-5 right-5">
                  <Heart className="size-5 text-red-500 fill-red-500" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Pagination currentPage={currentPage} totalPages={2} onPageChange={setCurrentPage} />
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <Heart className="size-10 text-red-300" />
          </div>
          <h2 className="font-display font-bold text-2xl text-[#2E2F2F] mb-2">No favorites yet</h2>
          <p className="text-[#6B7280] max-w-md mb-6">
            Start exploring and tap ♥ on jokes you love. They'll show up here for easy access.
          </p>
          <Button variant="pill" size="xl" onClick={() => navigate('/search')}>
            Browse Jokes
          </Button>
        </div>
      )}
    </div>
  )
}
