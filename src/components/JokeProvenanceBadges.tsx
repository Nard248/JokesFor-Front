import { AI_GENERATED_DESCRIPTION, hasProvenance, type JokeProvenance } from '@/lib/jokeProvenance'

interface JokeProvenanceBadgesProps {
  provenance: JokeProvenance | undefined
  className?: string
  style?: React.CSSProperties
}

/**
 * Compact language / origin / AI-generated tags for a joke. Renders nothing
 * when there is nothing to say (an English joke with no origin and a human
 * editorial status), so English-only cards stay as they were.
 */
export function JokeProvenanceBadges({ provenance, className, style }: JokeProvenanceBadgesProps) {
  if (!hasProvenance(provenance)) return null
  const { languageLabel, languageCode, languageName, origin, aiGenerated } = provenance

  return (
    <div
      lang="en"
      data-testid="joke-provenance"
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', gap: 6, ...style }}
    >
      {languageLabel && (
        <span
          className="tag-flow meta"
          title={languageName ? `Written in ${languageName}` : undefined}
          data-testid="joke-language-badge"
        >
          <span className="sr-only">Language: </span>
          <span lang={languageCode}>{languageLabel}</span>
        </span>
      )}
      {origin && (
        <span className="tag-flow meta" title={`From ${origin.name}`} data-testid="joke-origin-badge">
          {origin.flag && <span aria-hidden="true">{origin.flag}</span>}
          <span className="sr-only">From </span>
          <span>{origin.name}</span>
        </span>
      )}
      {aiGenerated && (
        // `title` is the pointer tooltip. The same description is part of the
        // accessible text (screen readers don't reliably announce
        // aria-describedby on a generic span).
        <span
          className="tag-flow meta"
          title={AI_GENERATED_DESCRIPTION}
          data-testid="joke-ai-badge"
        >
          AI-generated
          <span className="sr-only">
            {` — ${AI_GENERATED_DESCRIPTION}`}
          </span>
        </span>
      )}
    </div>
  )
}
