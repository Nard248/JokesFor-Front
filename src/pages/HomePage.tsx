import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Search, MapPin, BookOpen, Smile, Briefcase, Lightbulb, Gift, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { JokeOfTheDayCard } from '@/components/JokeOfTheDayCard'
import { DailyJokeCard } from '@/components/DailyJokeCard'
import { VibeCard } from '@/components/VibeCard'
import { FreshArrivalCard } from '@/components/FreshArrivalCard'
import { TopJokesterItem } from '@/components/TopJokesterItem'
import { WeeklySpecialCard } from '@/components/WeeklySpecialCard'
import { useTodaysJoke } from '@/features/daily-joke'
import { useTopJokesters, usePopularThemes } from '@/features/trending'
import { useJokeSearch } from '@/features/jokes'
import { mockHotNowTags } from '@/lib/mock-data'

const browseByVibe = [
  { icon: Smile, label: 'Kid-Safe' },
  { icon: Briefcase, label: 'Office Proper' },
  { icon: Lightbulb, label: 'Punny' },
  { icon: Gift, label: 'Nerd Humor' },
]

export function HomePage() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const { data: todayData } = useTodaysJoke()
  const { data: topJokesters = [] } = useTopJokesters(3)
  const { data: popularThemes = [] } = usePopularThemes()
  // Fresh arrivals: recent jokes (page 1, no filters)
  const { data: freshData } = useJokeSearch({ page: 1 })

  const dailyJoke = todayData?.joke
  const freshArrivals = (freshData?.results || []).slice(0, 3)

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-6xl">
      {/* ── Hero ── */}
      <section className="mb-8 lg:mb-12">
        <h1 className="font-display font-black text-4xl lg:text-7xl text-[#2E2F2F] leading-[1] mb-4">
          Who are you{' '}
          <span className="italic text-[#CAFD00]" style={{ WebkitTextStroke: '1px #3A4A00' }}>
            laughing
          </span>{' '}
          for?
        </h1>
        <p className="text-[#6B7280] text-base lg:text-lg max-w-xl leading-relaxed">
          The web's most curated library of punchlines for parents, teachers, and anyone who needs a quick giggle.
        </p>
      </section>

      {/* ── Search Bar ── */}
      <section className="mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by topic, vibe, or occasion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 lg:h-14 pl-13 pr-5 rounded-full border border-[#E9E8E7] bg-white text-base shadow-[var(--shadow-search)] outline-none focus:border-[#6A1CF6] focus:ring-2 focus:ring-[#6A1CF6]/20 transition-all"
            />
          </div>
          <Button variant="pill" size="xl" type="submit" className="shrink-0 hidden lg:flex">
            Find Jokes
          </Button>
        </form>

        {/* Hot Now Tags */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <Badge variant="hot" size="default">Hot Now:</Badge>
          {mockHotNowTags.map((tag) => (
            <button
              key={tag}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              className="px-4 py-1.5 rounded-full bg-white border border-[#E9E8E7] text-sm text-[#52525B] hover:border-[#6A1CF6] hover:text-[#6A1CF6] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      {/* ── JOTD + Vibes (Desktop) ── */}
      <section className="hidden lg:grid grid-cols-5 gap-5 mb-10">
        <div className="col-span-3">
          {dailyJoke && <JokeOfTheDayCard joke={dailyJoke} />}
        </div>
        <div className="col-span-2 grid grid-rows-2 gap-5">
          <VibeCard title="Wholesome & Pure" size="lg" gradient="from-purple-400 to-purple-600" searchQuery="wholesome" />
          <div className="grid grid-cols-2 gap-5">
            <VibeCard title="Quick Puns" size="sm" gradient="from-lime-300 to-lime-400" searchQuery="puns" />
            <VibeCard title="Classic Dad" size="sm" gradient="from-amber-300 to-amber-400" searchQuery="dad jokes" />
          </div>
        </div>
      </section>

      {/* ── JOTD (Mobile) ── */}
      <section className="lg:hidden mb-6">
        {dailyJoke && <DailyJokeCard joke={dailyJoke} />}
      </section>

      {/* ── Morning Kickoff (Mobile) ── */}
      <section className="lg:hidden mb-6">
        <Card radius="lg" className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-full bg-[#CAFD00] flex items-center justify-center shrink-0">
            <MapPin className="size-5 text-[#3A4A00]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#2E2F2F]">Morning Kickoff</h3>
            <p className="text-sm text-[#6B7280]">Perfect for 8:00 AM meetings</p>
          </div>
          <ChevronRight className="size-5 text-[#6B7280] ml-auto" />
        </Card>
      </section>

      {/* ── Weekly Curated (Mobile) ── */}
      <section className="lg:hidden mb-6">
        <Card radius="lg" className="flex items-center gap-4 p-4">
          <div className="size-10 rounded-full bg-[#F2F0F0] flex items-center justify-center shrink-0">
            <BookOpen className="size-5 text-[#52525B]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-[#2E2F2F]">Weekly Curated</h3>
            <p className="text-sm text-[#6B7280]">Hand-picked by editors</p>
          </div>
          <ChevronRight className="size-5 text-[#6B7280] ml-auto" />
        </Card>
      </section>

      {/* ── Browse by Vibe (Mobile) ── */}
      <section className="lg:hidden mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-xl text-[#2E2F2F]">Browse by Vibe</h2>
          <button className="text-sm font-semibold text-[#6A1CF6] flex items-center gap-1">
            View all <ChevronRight className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {browseByVibe.map((vibe) => (
            <button
              key={vibe.label}
              onClick={() => navigate(`/search?q=${encodeURIComponent(vibe.label)}`)}
              className="flex flex-col items-center gap-2 py-5 bg-[#FAFAFA] rounded-[32px] hover:bg-[#F7F0FF] transition-colors"
            >
              <div className="size-12 rounded-full bg-[#F2F0F0] flex items-center justify-center">
                <vibe.icon className="size-6 text-[#52525B]" />
              </div>
              <span className="text-sm font-semibold text-[#2E2F2F]">{vibe.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Fresh Arrivals + Sidebar (Desktop) ── */}
      <section className="lg:grid lg:grid-cols-3 lg:gap-8 mb-10">
        {/* Left: Fresh Arrivals */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-[#2E2F2F]">Fresh Arrivals</h2>
            <button className="text-sm font-semibold text-[#6A1CF6]">Newest ▾</button>
          </div>
          <div className="space-y-4">
            {freshArrivals.map((joke, i) => (
              <FreshArrivalCard
                key={joke.id}
                joke={joke}
                likes={[412, 1200, 890][i]}
                comments={[12, 84, 33][i]}
                timeAgo={['2 mins ago', '1 hour ago', '3 hours ago'][i]}
              />
            ))}
          </div>

          {/* Load More */}
          <div className="flex justify-center mt-8">
            <Button variant="pill-outline" size="xl">
              Load More Laughs
            </Button>
          </div>
        </div>

        {/* Right: Sidebar (Desktop) */}
        <div className="hidden lg:flex flex-col gap-6">
          {/* Popular Themes */}
          <Card radius="lg" className="p-5">
            <h3 className="font-display font-bold text-lg text-[#2E2F2F] mb-4">Popular Themes</h3>
            <div className="flex flex-wrap gap-2">
              {popularThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(theme)}`)}
                  className="px-3 py-1.5 rounded-full bg-[#F2F0F0] text-sm text-[#52525B] hover:bg-[#F7F0FF] hover:text-[#6A1CF6] transition-colors"
                >
                  {theme}
                </button>
              ))}
            </div>
          </Card>

          {/* Top Jokesters */}
          <Card radius="lg" className="p-5">
            <h3 className="font-display font-bold text-lg text-[#2E2F2F] mb-4">Top Jokesters</h3>
            <div className="divide-y divide-[#E9E8E7]">
              {topJokesters.map((jokester) => (
                <TopJokesterItem key={jokester.id} jokester={jokester} />
              ))}
            </div>
          </Card>

          {/* Weekly Special */}
          <WeeklySpecialCard />
        </div>
      </section>
    </div>
  )
}
