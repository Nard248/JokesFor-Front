import { Bookmark, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Joke } from '@/features/jokes'

interface JokeCardProps {
  joke: Joke
  className?: string
}

/**
 * Reusable joke display component
 * Shows joke text with format/age badges and tone tags
 * Includes placeholder buttons for save, rating, and share (non-functional)
 */
export function JokeCard({ joke, className }: JokeCardProps) {
  const isTwoParter = joke.setup && joke.punchline

  return (
    <article
      className={cn(
        'bg-card border border-border rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Joke content */}
      <div className="mb-4">
        {isTwoParter ? (
          <div className="space-y-3">
            <p className="text-foreground font-medium">{joke.setup}</p>
            <p className="text-primary font-semibold italic">{joke.punchline}</p>
          </div>
        ) : (
          <p className="text-foreground leading-relaxed">{joke.text}</p>
        )}
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Format badge */}
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
          {joke.format.name}
        </span>

        {/* Age rating badge */}
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            joke.age_rating.slug === 'kid-safe' && 'bg-green-100 text-green-700',
            joke.age_rating.slug === 'family-friendly' && 'bg-blue-100 text-blue-700',
            joke.age_rating.slug === 'teen' && 'bg-yellow-100 text-yellow-700',
            joke.age_rating.slug === 'adult' && 'bg-red-100 text-red-700',
            !['kid-safe', 'family-friendly', 'teen', 'adult'].includes(joke.age_rating.slug) &&
              'bg-gray-100 text-gray-700'
          )}
        >
          {joke.age_rating.name}
        </span>
      </div>

      {/* Tone tags */}
      {joke.tones.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {joke.tones.map((tone) => (
            <span
              key={tone.id}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-secondary text-secondary-foreground"
            >
              {tone.name}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons (placeholders) */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Like"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Dislike"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
            title="Save to collection"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
