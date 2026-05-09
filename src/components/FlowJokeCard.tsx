import { useState } from 'react'
import { Bookmark, BookmarkCheck, Share2, Sparkles } from 'lucide-react'

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

export type FlowJokeFormat = 'setup' | 'oneliner' | 'observ' | 'anti' | 'knock' | 'story'

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

interface SkinSpec {
  bg: string
  fg: string
  border: string
  divider: string
}

const SKIN: Record<FlowJokeFormat, SkinSpec> = {
  setup:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  oneliner: { bg: '#CAFD00',  fg: '#3A4A00', border: 'none',              divider: 'rgba(58,74,0,0.18)' },
  observ:   { bg: '#FBFAF7',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  anti:     { bg: '#1A1A1A',  fg: '#FFFFFF', border: 'none',              divider: 'rgba(255,255,255,0.14)' },
  knock:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  story:    { bg: '#FFC965',  fg: '#5F4200', border: 'none',              divider: 'rgba(95,66,0,0.2)' },
}

const FORMAT_LABEL: Record<FlowJokeFormat, string> = {
  setup:    'Setup → Punchline',
  oneliner: 'One-liner',
  observ:   'Observational',
  anti:     'Anti-joke',
  knock:    'Knock-knock',
  story:    'Story',
}

interface FlowJokeCardProps {
  joke: FlowJokeData
  big?: boolean
  className?: string
}

export function FlowJokeCard({ joke, big = false, className }: FlowJokeCardProps) {
  const skin = SKIN[joke.fmt] ?? SKIN.setup
  const [revealed, setRevealed] = useState(joke.fmt !== 'setup')
  const [saved, setSaved] = useState(false)
  const [knockStep, setKnockStep] = useState(0)

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

      {/* Body: format-specific */}
      <Body
        joke={joke}
        skin={skin}
        big={big}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        knockStep={knockStep}
        onKnockTap={() => setKnockStep((s) => Math.min(s + 1, (joke.lines?.length ?? 1) - 1))}
      />

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
            onClick={() => setSaved((s) => !s)}
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
// Body renderer per format.
// ──────────────────────────────────────────────────────────────────────────

interface BodyProps {
  joke: FlowJokeData
  skin: SkinSpec
  big: boolean
  revealed: boolean
  onReveal: () => void
  knockStep: number
  onKnockTap: () => void
}

function Body({ joke, skin, big, revealed, onReveal, knockStep, onKnockTap }: BodyProps) {
  if (joke.fmt === 'setup') {
    const titleSize = big ? 24 : 16
    const punchSize = big ? 44 : 22
    return (
      <div onClick={() => !revealed && onReveal()} style={{ cursor: !revealed ? 'pointer' : 'default' }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: titleSize,
            color: skin.fg,
            lineHeight: 1.3,
            marginTop: 14,
          }}
        >
          {joke.setup}
        </div>
        <div
          className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
          style={{
            marginTop: 12,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: punchSize,
            letterSpacing: '-0.02em',
            color: skin.fg,
            lineHeight: 1.05,
          }}
        >
          {joke.punch}
        </div>
        {!revealed && (
          <div className="eyebrow-mono" style={{ marginTop: 14, color: '#6A1CF6' }}>
            Tap to reveal punchline →
          </div>
        )}
      </div>
    )
  }

  if (joke.fmt === 'oneliner') {
    const sz = big ? 38 : 22
    return (
      <div
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          fontSize: sz,
          letterSpacing: '-0.02em',
          color: skin.fg,
          lineHeight: 1.05,
          textWrap: 'balance' as const,
        }}
      >
        {joke.text}
      </div>
    )
  }

  if (joke.fmt === 'observ') {
    const sz = big ? 26 : 18
    return (
      <div style={{ marginTop: 14, position: 'relative' }}>
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: -12,
            left: -6,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 60,
            lineHeight: 1,
            color: '#6A1CF6',
            opacity: 0.35,
          }}
        >
          “
        </span>
        <div
          style={{
            paddingLeft: 24,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: sz,
            color: skin.fg,
            lineHeight: 1.3,
            textWrap: 'balance' as const,
          }}
        >
          {joke.text}
        </div>
      </div>
    )
  }

  if (joke.fmt === 'anti') {
    const sz = big ? 30 : 20
    return (
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: big ? 17 : 13,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.3,
          }}
        >
          {joke.setup}
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: sz,
            letterSpacing: '-0.02em',
            color: '#fff',
            lineHeight: 1.1,
          }}
        >
          {joke.punch}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
          }}
        >
          * That's it. That's the joke.
        </div>
      </div>
    )
  }

  if (joke.fmt === 'knock') {
    const lines = joke.lines ?? []
    const visible = lines.slice(0, knockStep + 1)
    return (
      <div
        onClick={onKnockTap}
        style={{
          marginTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          cursor: knockStep < lines.length - 1 ? 'pointer' : 'default',
        }}
      >
        {visible.map((l, i) => (
          <div
            key={i}
            style={{
              alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
              maxWidth: '82%',
              padding: '7px 11px',
              borderRadius: 13,
              background: i % 2 === 0 ? '#F2E9FF' : '#1A1A1A',
              color: i % 2 === 0 ? '#6A1CF6' : '#fff',
              fontSize: 13,
              fontFamily: 'var(--font-display)',
              fontWeight: i === lines.length - 1 ? 800 : 600,
            }}
          >
            {l}
          </div>
        ))}
        {knockStep < lines.length - 1 && (
          <div className="eyebrow-mono" style={{ marginTop: 6, color: '#6A1CF6' }}>
            Tap to advance · {knockStep + 1}/{lines.length}
          </div>
        )}
      </div>
    )
  }

  if (joke.fmt === 'story') {
    return (
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="tag-flow" style={{ background: '#5F4200', color: '#FFC965' }}>
            <Sparkles size={10} style={{ marginRight: 4 }} />
            {joke.read ?? '30 sec read'}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontWeight: 400,
            fontSize: big ? 17 : 14,
            color: skin.fg,
            lineHeight: 1.55,
            textWrap: 'pretty' as const,
          }}
        >
          {joke.text}
        </div>
      </div>
    )
  }

  return null
}

// Tag color tone for the format badge in the header.
function tagToneFor(fmt: FlowJokeFormat): string {
  switch (fmt) {
    case 'oneliner':
    case 'anti':
      return 'dark'
    case 'observ':
    case 'knock':
      return 'amber'
    case 'story':
      return 'amber'
    case 'setup':
    default:
      return ''
  }
}
