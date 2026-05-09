import { useNavigate } from 'react-router'
import { Flame, TrendingUp, ArrowUpRight, ThumbsUp, Share2, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'
import { TopJokesterItem } from '@/components/TopJokesterItem'
import { FreshArrivalCard } from '@/components/FreshArrivalCard'
import { useTrendingJokes, useTrendingTags, useRisingTopics, useTopJokesters } from '@/features/trending'
import { mockAuthors } from '@/lib/mock-data'

export function TrendingPageLegacy() {
  const navigate = useNavigate()
  const { data: trendingJokes = [] } = useTrendingJokes()
  const { data: trendingTags = [] } = useTrendingTags()
  const { data: risingTopics = [] } = useRisingTopics()
  const { data: topJokesters = [] } = useTopJokesters(5)

  const topJoke = trendingJokes[0]
  const restJokes = trendingJokes.slice(1)
  const author = mockAuthors[1]

  return (
    <div className="px-4 lg:px-8 py-6 lg:py-10 max-w-6xl">
      {/* Hero */}
      <section className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="size-8 text-orange-500" />
          <h1 className="font-display font-black text-3xl lg:text-5xl text-[#2E2F2F]">
            What's Trending
          </h1>
        </div>
        <p className="text-[#6B7280] text-base lg:text-lg">
          The hottest punchlines heating up the community right now.
        </p>
      </section>

      {/* Trending Tags Row */}
      <section className="mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {trendingTags.map((tag) => (
            <button
              key={tag.name}
              onClick={() => navigate(`/search?q=${encodeURIComponent(tag.name)}`)}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-[#E9E8E7] hover:border-[#6A1CF6] transition-colors"
            >
              <span className="text-sm font-semibold text-[#2E2F2F]">{tag.name}</span>
              <span className="text-xs text-[#6B7280]">🔥 {tag.count >= 1000 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* #1 Trending Joke */}
      {topJoke && <section className="mb-10">
        <div className="bg-gradient-to-br from-[#FFC965] to-[#FFB800] rounded-[32px] p-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <Badge variant="default" size="lg" className="bg-[#2E2F2F]">🏆 #1 Trending</Badge>
            </div>
            {topJoke.joke.setup ? (
              <>
                <p className="font-display font-bold text-xl lg:text-2xl text-[#2E2F2F] mb-2">
                  "{topJoke.joke.setup}"
                </p>
                {topJoke.joke.punchline && (
                  <p className="font-display font-bold italic text-xl lg:text-2xl text-[#5F4200] mb-6">
                    "{topJoke.joke.punchline}"
                  </p>
                )}
              </>
            ) : (
              <p className="font-display font-bold text-xl lg:text-2xl text-[#2E2F2F] mb-6">
                "{topJoke.joke.text}"
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar initials={author.initials} color={author.color} size="sm" />
                <span className="text-sm font-medium text-[#5F4200]">{author.username}</span>
                <span className="text-sm text-[#5F4200]/60">• {topJoke.trendingSince}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-[#5F4200]">
                <span className="flex items-center gap-1"><ThumbsUp className="size-4" /> {(topJoke.likes / 1000).toFixed(1)}k</span>
                <span className="flex items-center gap-1"><Share2 className="size-4" /> {(topJoke.shares / 1000).toFixed(1)}k</span>
                <span className="flex items-center gap-1"><MessageCircle className="size-4" /> {topJoke.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </section>}

      {/* Main Content: Trending Grid + Sidebar */}
      <section className="lg:grid lg:grid-cols-3 lg:gap-8">
        {/* Trending Jokes */}
        <div className="lg:col-span-2">
          <h2 className="font-display font-bold text-2xl text-[#2E2F2F] mb-5">Climbing the Charts</h2>
          <div className="space-y-4">
            {restJokes.map((item) => (
              <div key={item.rank} className="relative">
                {/* Rank badge */}
                <div className="absolute -left-2 top-6 z-10 size-8 rounded-full bg-[#6A1CF6] text-white flex items-center justify-center font-bold text-sm shadow-lg">
                  #{item.rank}
                </div>
                <FreshArrivalCard
                  joke={item.joke}
                  likes={item.likes}
                  comments={item.comments}
                  timeAgo={item.trendingSince}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:flex flex-col gap-6 mt-0">
          {/* Rising Topics */}
          <Card radius="lg" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="size-5 text-[#6A1CF6]" />
              <h3 className="font-display font-bold text-lg text-[#2E2F2F]">Rising Topics</h3>
            </div>
            <div className="space-y-3">
              {risingTopics.map((topic) => (
                <button
                  key={topic.name}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(topic.name)}`)}
                  className="w-full flex items-center justify-between py-2 hover:bg-[#F7F0FF] rounded-xl px-2 -mx-2 transition-colors"
                >
                  <span className="text-sm font-medium text-[#2E2F2F]">{topic.name}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                    <ArrowUpRight className="size-3" /> +{topic.growth}%
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Jokesters on Fire */}
          <Card radius="lg" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="size-5 text-orange-500" />
              <h3 className="font-display font-bold text-lg text-[#2E2F2F]">Jokesters on Fire</h3>
            </div>
            <div className="divide-y divide-[#E9E8E7]">
              {topJokesters.map((jokester) => (
                <TopJokesterItem key={jokester.id} jokester={jokester} />
              ))}
            </div>
          </Card>

          {/* Trending Collections */}
          <Card radius="lg" className="p-5">
            <h3 className="font-display font-bold text-lg text-[#2E2F2F] mb-4">Hot Collections</h3>
            <div className="space-y-3">
              {[
                { name: 'Monday Meeting Survival', count: 38, emoji: '💼' },
                { name: 'Science Fair Icebreakers', count: 24, emoji: '🔬' },
                { name: 'Wedding Toast Gems', count: 52, emoji: '🥂' },
              ].map((col) => (
                <button key={col.name} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F2F0F0] transition-colors">
                  <span className="text-2xl">{col.emoji}</span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#2E2F2F]">{col.name}</p>
                    <p className="text-xs text-[#6B7280]">{col.count} jokes</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
