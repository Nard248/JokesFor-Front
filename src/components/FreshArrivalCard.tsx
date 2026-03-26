import type { Joke } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { mockAuthors } from '@/lib/mock-data'

interface FreshArrivalCardProps {
  joke: Joke
  likes?: number
  comments?: number
  timeAgo?: string
}

export function FreshArrivalCard({ joke, likes = 412, comments = 12, timeAgo = '2 mins ago' }: FreshArrivalCardProps) {
  const author = mockAuthors[(joke.id % Object.keys(mockAuthors).length) + 1] || mockAuthors[1]

  return (
    <Card radius="lg" hover className="p-5">
      {/* Tags */}
      <div className="flex items-center gap-2 mb-3">
        {joke.context_tags.map((tag) => (
          <Badge key={tag.id} variant="muted" size="default">
            {tag.name}
          </Badge>
        ))}
        {joke.tones.slice(0, 1).map((tone) => (
          <Badge key={tone.id} variant="muted" size="default">
            {tone.name}
          </Badge>
        ))}
      </div>

      {/* Joke */}
      {joke.setup ? (
        <>
          <p className="font-semibold text-[#2E2F2F] text-base mb-2">{joke.setup}</p>
          {joke.punchline && (
            <p className="font-display font-bold text-[#2E2F2F] text-lg mb-3">{joke.punchline}</p>
          )}
        </>
      ) : (
        <p className="font-semibold text-[#2E2F2F] text-base mb-3">{joke.text}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-[#6B7280]">
        <div className="flex items-center gap-2">
          <span>Shared by</span>
          <span className="font-semibold text-[#2E2F2F]">{author.username}</span>
          <span>• {timeAgo}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <ThumbsUp className="size-4" /> {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-4" /> {comments}
          </span>
        </div>
      </div>
    </Card>
  )
}
