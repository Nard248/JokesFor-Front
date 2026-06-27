import { useState } from 'react'
import { Bookmark, BookmarkCheck, Share2 } from 'lucide-react'
import { useReactToJoke, useReactions } from '@/features/reactions'
import { useSaveJoke } from '@/features/saved-jokes'
import type { Joke, ReactionSlug } from '@/lib/api'
import { JokeRenderer, SKIN, FORMAT_LABEL, tagToneFor, type FlowJokeFormat } from './JokeRenderer'

// Re-export the format type so existing importers don't break.
export type { FlowJokeFormat } from './JokeRenderer'

/**
 * FlowJokeCard — format-aware joke card for the redesign.
 *
 * Six format rhythms (per Docs/JokesFor/parts/flow.jsx):
 *  - setup     : white card; setup → blurred punch; tap to reveal (signature)
 *  - oneliner  : LIME card; single big display headline
 *  - observ    : white card; serif italic with giant decorative quote
 *  - anti      : BLACK card; "* That's it. That's the joke." footnote
 *  - knock     : white card; chat bubbles; tap to advance one line
 *  - story     : AMBER card; serif body with "📖 N min read" tag
 *
 * Each format keeps a consistent header (FormatBadge + Theme · Category) and
 * footer (laughs/saves stats + Save/Share buttons), but the body is rhythm-
 * specific.
 *
 * This is parallel to the existing src/components/JokeCard.tsx — that one
 * stays untouched for HomePage/SearchPage/etc. consumers. When the redesign
 * is approved, we'll consolidate.
 */

export interface FlowJokeData {
  id: number | string
  fmt: FlowJokeFormat

  // Format-specific text fields. Use what's relevant for the format.
  setup?: string         // setup, anti
  punch?: string         // setup, anti
  text?: string          // oneliner, observ, story
  lines?: string[]       // knock-knock alternating bubbles

  // Tagging / metadata (mock-friendly; map from real Joke when wired).
  themeLabel?: string
  catLabel?: string

  // Engagement stats (display-only — strings to allow "4.1K" style).
  laughs?: string | number
  saves?: string | number

  // Story extras
  read?: string          // "2 min" / "30 sec"
}

interface FlowJokeCardProps {
  joke: FlowJokeData
  big?: boolean
  className?: string
}

export function FlowJokeCard({ joke, big = false, className }: FlowJokeCardProps) {
  const skin = SKIN[joke.fmt] ?? SKIN.setup
  const [saved, setSaved] = useState(false)
  const saveJoke = useSaveJoke()

  const handleSave = () => {
    if (saved) return // save-only here; unsave lives in the Library
    setSaved(true)
    saveJoke.mutate({ jokeId: Number(joke.id) }, { onError: () => setSaved(false) })
  }

  const isAnti = joke.fmt === 'anti'
  const mutedFg = isAnti ? 'rgba(255,255,255,0.6)' : '#52525B'
  const ghostBg = isAnti ? 'rgba(255,255,255,0.08)' : 'transparent'
  const ghostBorder = isAnti ? 'rgba(255,255,255,0.18)' : '#E9E8E7'
  const ghostFg = isAnti ? '#fff' : '#1A1A1A'

  return (
    <article
      className={className}
      style={{
        background: skin.bg,
        color: skin.fg,
        border: skin.border,
        borderRadius: 18,
        padding: big ? 28 : 18,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
    >
      {/* Header: format badge + theme · category */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span className={`tag-flow ${tagToneFor(joke.fmt)}`}>{FORMAT_LABEL[joke.fmt]}</span>
        {(joke.themeLabel || joke.catLabel) && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: mutedFg,
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            {joke.themeLabel && <span>{joke.themeLabel}</span>}
            {joke.themeLabel && joke.catLabel && <span>·</span>}
            {joke.catLabel && <span>{joke.catLabel}</span>}
          </span>
        )}
      </header>

      {/* Body: format-specific — delegates to JokeRenderer (interactive reader defaults). */}
      <JokeRenderer
        payload={{
          format: joke.fmt,
          text: joke.text ?? '',
          setup: joke.setup ?? '',
          punchline: joke.punch ?? '',
          lines: joke.lines ?? null,
        }}
        big={big}
        read={joke.read}
      />

      {/* Reaction row: only for real jokes with numeric IDs (skip previews/mocks). */}
      {typeof joke.id === 'number' && (
        <ReactionRow jokeId={joke.id} isAnti={isAnti} divider={skin.divider} />
      )}

      {/* Footer: stats + actions */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          paddingTop: 12,
          borderTop: `1px solid ${skin.divider}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 10,
            fontSize: 12,
            color: mutedFg,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
          }}
        >
          {joke.laughs !== undefined && <span>😂 {joke.laughs}</span>}
          {joke.saves !== undefined && <span>💾 {joke.saves}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={handleSave}
            aria-pressed={saved}
            style={{
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              fontFamily: 'inherit',
              fontWeight: 700,
              borderRadius: 9999,
              background: saved ? '#1A1A1A' : ghostBg,
              color: saved ? '#CAFD00' : ghostFg,
              border: saved ? 'none' : `1px solid ${ghostBorder}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'background 0.12s ease',
            }}
          >
            {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            {saved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            aria-label="Share joke"
            style={{
              height: 32,
              width: 32,
              fontFamily: 'inherit',
              borderRadius: 9999,
              background: ghostBg,
              color: ghostFg,
              border: `1px solid ${ghostBorder}`,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </footer>
    </article>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// ReactionRow — 4 emoji reactions per P4. Toggles via /jokes/{id}/react/.
// ──────────────────────────────────────────────────────────────────────────

const REACTIONS: { slug: ReactionSlug; emoji: string; label: string }[] = [
  { slug: 'lol', emoji: '😂', label: 'LOL' },
  { slug: 'crying', emoji: '🤣', label: 'Dying' },
  { slug: 'hmm', emoji: '🤔', label: 'Hmm' },
  { slug: 'eyeroll', emoji: '🙄', label: 'Eyeroll' },
]

function ReactionRow({ jokeId, isAnti, divider }: { jokeId: number; isAnti: boolean; divider: string }) {
  const { data: reactions } = useReactions(jokeId, false) // don't fetch eagerly; only when interacted
  const reactMutation = useReactToJoke(jokeId)
  const [optimistic, setOptimistic] = useState<ReactionSlug | null>(null)

  const myReaction = optimistic !== null ? optimistic : reactions?.my_reaction ?? null
  const counts = reactions?.counts

  const handleReact = (slug: ReactionSlug) => {
    setOptimistic(slug === myReaction ? null : slug)
    reactMutation.mutate(slug, {
      onSettled: () => setOptimistic(null),
    })
  }

  const baseColor = isAnti ? 'rgba(255,255,255,0.7)' : '#52525B'

  return (
    <div
      style={{
        marginTop: 12,
        paddingTop: 10,
        borderTop: `1px solid ${divider}`,
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {REACTIONS.map((r) => {
        const active = myReaction === r.slug
        const count = counts?.[r.slug] ?? 0
        return (
          <button
            key={r.slug}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleReact(r.slug)
            }}
            aria-pressed={active}
            aria-label={r.label}
            style={{
              height: 28,
              padding: '0 10px',
              borderRadius: 9999,
              background: active ? '#6A1CF6' : 'transparent',
              color: active ? '#fff' : baseColor,
              border: `1px solid ${active ? '#6A1CF6' : isAnti ? 'rgba(255,255,255,0.18)' : '#E9E8E7'}`,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background 0.12s ease, color 0.12s ease',
            }}
          >
            <span style={{ fontSize: 14 }}>{r.emoji}</span>
            {count > 0 && <span style={{ fontWeight: 500, opacity: 0.8 }}>{formatCount(count)}</span>}
          </button>
        )
      })}
    </div>
  )
}

function formatCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}K`
  return `${Math.round(n / 1000)}K`
}

// ──────────────────────────────────────────────────────────────────────────
// Adapter: real Joke (with new schema) → FlowJokeData
// Use this when you have a Joke from the backend and want to render it.
// ──────────────────────────────────────────────────────────────────────────

export function jokeToFlowData(joke: Joke): FlowJokeData {
  const slug = joke.format?.slug?.toLowerCase() ?? ''
  const fmt: FlowJokeFormat =
    slug === 'setup_punchline' || slug === 'setup-punchline' || slug === 'setup'
      ? 'setup'
      : slug === 'one_liner' || slug === 'one-liner' || slug === 'oneliner'
      ? 'oneliner'
      : slug === 'observational' || slug === 'observ'
      ? 'observ'
      : slug === 'anti_joke' || slug === 'anti-joke' || slug === 'anti'
      ? 'anti'
      : slug === 'knock_knock' || slug === 'knock-knock' || slug === 'knock'
      ? 'knock'
      : slug === 'story'
      ? 'story'
      : joke.setup && joke.punchline
      ? 'setup'
      : 'oneliner'

  // Prefer new vocabulary (themes/categories), fall back to legacy (context_tags/tones).
  const themeLabel = joke.themes?.[0]?.name ?? joke.context_tags?.[0]?.name
  const catLabel = joke.categories?.[0]?.name ?? joke.tones?.[0]?.name

  return {
    id: joke.id,
    fmt,
    setup: joke.setup ?? undefined,
    punch: joke.punchline ?? undefined,
    text: joke.text,
    lines: joke.lines ?? undefined,
    themeLabel,
    catLabel,
  }
}
