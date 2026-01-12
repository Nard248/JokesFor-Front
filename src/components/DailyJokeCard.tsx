import { useState } from 'react'
import { Bookmark, ThumbsUp, ThumbsDown, Share2, Sparkles, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Joke } from '@/features/jokes'

interface DailyJokeCardProps {
  joke: Joke
  date: string
  className?: string
}

/**
 * Featured joke display component for the Daily Joke page
 * Large, centered card with hero-like styling
 * Shows today's date, joke content, and action buttons
 */
export function DailyJokeCard({ joke, date, className }: DailyJokeCardProps) {
  const [punchlineRevealed, setPunchlineRevealed] = useState(false)
  const isTwoParter = joke.setup && joke.punchline

  // Format date nicely (e.g., "January 12, 2026")
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <article
      className={cn(
        'relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5',
        'border-2 border-primary/20 rounded-2xl shadow-lg',
        'p-6 md:p-10',
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative flex items-center justify-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
        <h2 className="text-sm md:text-base font-medium text-primary uppercase tracking-wide">
          Today's Joke - {formattedDate}
        </h2>
        <Sparkles className="w-5 h-5 text-primary animate-pulse" />
      </div>

      {/* Joke content */}
      <div className="relative text-center mb-8">
        {isTwoParter ? (
          <div className="space-y-6">
            <p className="text-xl md:text-2xl lg:text-3xl text-foreground font-medium leading-relaxed">
              {joke.setup}
            </p>
            {punchlineRevealed ? (
              <p className="text-xl md:text-2xl lg:text-3xl text-primary font-bold italic leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500">
                {joke.punchline}
              </p>
            ) : (
              <Button
                size="lg"
                onClick={() => setPunchlineRevealed(true)}
                className="mt-4"
              >
                <Eye className="w-5 h-5 mr-2" />
                Reveal Punchline
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed">
            {joke.text}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="relative flex flex-wrap items-center justify-center gap-3 mb-6">
        {/* Format badge */}
        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-primary/15 text-primary border border-primary/20">
          {joke.format.name}
        </span>

        {/* Age rating badge */}
        <span
          className={cn(
            'inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border',
            joke.age_rating.slug === 'kid-safe' && 'bg-green-100 text-green-700 border-green-200',
            joke.age_rating.slug === 'family-friendly' && 'bg-blue-100 text-blue-700 border-blue-200',
            joke.age_rating.slug === 'teen' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
            joke.age_rating.slug === 'adult' && 'bg-red-100 text-red-700 border-red-200',
            !['kid-safe', 'family-friendly', 'teen', 'adult'].includes(joke.age_rating.slug) &&
              'bg-gray-100 text-gray-700 border-gray-200'
          )}
        >
          {joke.age_rating.name}
        </span>
      </div>

      {/* Tone tags */}
      {joke.tones.length > 0 && (
        <div className="relative flex flex-wrap items-center justify-center gap-2 mb-8">
          {joke.tones.map((tone) => (
            <span
              key={tone.id}
              className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-secondary/50 text-secondary-foreground"
            >
              {tone.name}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="relative flex items-center justify-center gap-2 pt-6 border-t border-border/50">
        <Button variant="ghost" size="lg" className="gap-2" title="Like">
          <ThumbsUp className="w-5 h-5" />
          <span className="hidden sm:inline">Like</span>
        </Button>
        <Button variant="ghost" size="lg" className="gap-2" title="Dislike">
          <ThumbsDown className="w-5 h-5" />
          <span className="hidden sm:inline">Dislike</span>
        </Button>
        <Button variant="ghost" size="lg" className="gap-2" title="Share">
          <Share2 className="w-5 h-5" />
          <span className="hidden sm:inline">Share</span>
        </Button>
        <Button variant="ghost" size="lg" className="gap-2 text-primary hover:text-primary" title="Save">
          <Bookmark className="w-5 h-5" />
          <span className="hidden sm:inline">Save</span>
        </Button>
      </div>
    </article>
  )
}
