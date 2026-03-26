import type { Joke } from '@/lib/api'
import { Bookmark, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DailyJokeCardProps {
  joke: Joke
}

export function DailyJokeCard({ joke }: DailyJokeCardProps) {
  return (
    <div className="bg-gradient-purple rounded-[32px] p-6 text-white relative overflow-hidden">
      <div className="absolute top-4 right-4 text-2xl">✨</div>

      <div className="inline-flex items-center gap-1.5 bg-[#CAFD00] text-[#3A4A00] px-3 py-1 rounded-full text-[10px] font-bold uppercase mb-4">
        Joke of the Day
      </div>

      <div className="mb-6">
        {joke.setup ? (
          <>
            <p className="font-display font-bold text-lg leading-snug mb-2">
              "{joke.setup}"
            </p>
            {joke.punchline && (
              <p className="font-display font-bold italic text-lg text-[#CAFD00] leading-snug">
                "{joke.punchline}"
              </p>
            )}
          </>
        ) : (
          <p className="font-display font-bold text-lg leading-snug">
            "{joke.text}"
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="pill-outline" size="sm" className="bg-white/15 border-white/30 text-white hover:bg-white/25 gap-2">
          <Bookmark className="size-4" />
          Save to My Set
        </Button>
        <Button variant="pill-outline" size="sm" className="bg-white/15 border-white/30 text-white hover:bg-white/25 gap-2">
          <Share2 className="size-4" />
          Share
        </Button>
      </div>
    </div>
  )
}
