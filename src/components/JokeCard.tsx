import type { Joke } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Copy, Share2, Bookmark } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { mockAuthors } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface JokeCardProps {
  joke: Joke
  className?: string
  showBookmark?: boolean
}

const toneBadgeVariant: Record<string, 'default' | 'lime' | 'amber' | 'purple' | 'muted'> = {
  punny: 'default',
  dad_joke: 'amber',
  sarcastic: 'purple',
  classic: 'muted',
  geeky: 'default',
  dark: 'muted',
}

export function JokeCard({ joke, className, showBookmark }: JokeCardProps) {
  const author = mockAuthors[(joke.id % Object.keys(mockAuthors).length) + 1] || mockAuthors[1]

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

      {/* Author + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar initials={author.initials} color={author.color} size="sm" />
          <span className="text-sm text-[#6B7280]">{author.username}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0] text-[#6B7280] transition-colors">
            <Copy className="size-4" />
          </button>
          <button className="size-8 flex items-center justify-center rounded-full hover:bg-[#F2F0F0] text-[#6B7280] transition-colors">
            <Share2 className="size-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}
