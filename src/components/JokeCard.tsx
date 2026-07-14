import type { Joke } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Copy, Share2, Bookmark } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ReportJokeButton } from '@/components/ReportJokeButton'

interface JokeCardProps {
  joke: Joke
  className?: string
  showBookmark?: boolean
  /** Show the report (flag) affordance. Off by default so presentational
   * call sites (and their tests) don't need router/query providers. */
  showReport?: boolean
}

const toneBadgeVariant: Record<string, 'default' | 'lime' | 'amber' | 'purple' | 'muted'> = {
  punny: 'default',
  dad_joke: 'amber',
  sarcastic: 'purple',
  classic: 'muted',
  geeky: 'default',
  dark: 'muted',
}

export function JokeCard({ joke, className, showBookmark, showReport }: JokeCardProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(joke.text)
  }

  return (
    <Card radius="lg" hover className={cn('flex flex-col gap-4 p-6', className)}>
      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {joke.tones.map((tone) => (
          <Badge key={tone.id} variant={toneBadgeVariant[tone.slug] || 'default'} size="default">
            {tone.name}
          </Badge>
        ))}
        {showBookmark && (
          <button className="ml-auto text-[#6B7280] hover:text-[#6A1CF6] transition-colors">
            <Bookmark className="size-5" />
          </button>
        )}
      </div>

      {/* Joke Content */}
      <div className="flex-1">
        {joke.setup ? (
          <>
            <p className="font-semibold text-[#2E2F2F] text-base leading-relaxed mb-3">
              {joke.setup}
            </p>
            {joke.punchline && (
              <div className="flex gap-3">
                <div className="w-[3px] bg-[#6A1CF6] rounded-full shrink-0" />
                <p className="font-display font-bold italic text-base text-[#6A1CF6]">
                  {joke.punchline}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="font-semibold text-[#2E2F2F] text-base leading-relaxed">
            {joke.text}
          </p>
        )}
      </div>

      {/* Separator */}
      <hr className="border-[#E9E8E7]" />

      {/* Actions — no author byline: the Joke payload carries no author, so a
          per-card handle would be fabricated. On the single-creator profile page
          the creator identity is shown in the page header above the grid. */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={handleCopy} className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0] text-[#6B7280] transition-colors">
          <Copy className="size-4" />
        </button>
        <button className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0] text-[#6B7280] transition-colors">
          <Share2 className="size-4" />
        </button>
        {showReport && <ReportJokeButton jokeId={joke.id} />}
      </div>
    </Card>
  )
}
