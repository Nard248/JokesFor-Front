import type { Joke } from '@/lib/api'
import { Star, Share2, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'

interface JokeOfTheDayCardProps {
  joke: Joke
  curatorName?: string
  curatorRole?: string
}

export function JokeOfTheDayCard({ joke, curatorName = 'Sarah P.', curatorRole = 'Science Teacher' }: JokeOfTheDayCardProps) {
  return (
    <div className="bg-gradient-purple rounded-[32px] p-8 text-white relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />

      {/* Top row */}
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-[#FFC965] fill-[#FFC965]" />
          <span className="text-xs font-bold uppercase tracking-wider">Joke of the Day</span>
        </div>
        <Badge variant="lime" size="default">Viral</Badge>
      </div>

      {/* Joke Text */}
      <div className="relative z-10 mb-6">
        {joke.setup ? (
          <>
            <p className="font-display font-bold text-xl lg:text-2xl leading-snug mb-3">
              "{joke.setup}"
            </p>
            {joke.punchline && (
              <p className="font-display font-bold italic text-xl lg:text-2xl text-[#CAFD00] leading-snug">
                "{joke.punchline}"
              </p>
            )}
          </>
        ) : (
          <p className="font-display font-bold text-xl lg:text-2xl leading-snug">
            "{joke.text}"
          </p>
        )}
      </div>

      {/* Bottom: Curator + Actions */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Avatar name={curatorName} size="sm" color="#FFC965" />
          <div>
            <p className="text-sm font-semibold">Curated by {curatorName}</p>
            <p className="text-xs text-white/60">{curatorRole} • NYC</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="size-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <Share2 className="size-5" />
          </button>
          <button className="size-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors">
            <Heart className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
