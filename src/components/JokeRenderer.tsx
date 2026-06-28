import { useState } from 'react'
import { Sparkles } from 'lucide-react'

export type FlowJokeFormat = 'setup' | 'oneliner' | 'observ' | 'anti' | 'knock' | 'story'

/** The canonical render payload — identical shape the editor preview and the card both build. */
export interface JokePayload {
  format: FlowJokeFormat
  text: string
  setup: string
  punchline: string
  lines: string[] | null
}

export interface SkinSpec { bg: string; fg: string; border: string; divider: string }

export const SKIN: Record<FlowJokeFormat, SkinSpec> = {
  setup:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  oneliner: { bg: '#CAFD00',  fg: '#3A4A00', border: 'none',              divider: 'rgba(58,74,0,0.18)' },
  observ:   { bg: '#FBFAF7',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  anti:     { bg: '#1A1A1A',  fg: '#FFFFFF', border: 'none',              divider: 'rgba(255,255,255,0.14)' },
  knock:    { bg: '#FFFFFF',  fg: '#1A1A1A', border: '1px solid #E9E8E7', divider: '#F1EFEC' },
  story:    { bg: '#FFC965',  fg: '#5F4200', border: 'none',              divider: 'rgba(95,66,0,0.2)' },
}

export const FORMAT_LABEL: Record<FlowJokeFormat, string> = {
  setup: 'Setup → Punchline', oneliner: 'One-liner', observ: 'Observational',
  anti: 'Anti-joke', knock: 'Knock-knock', story: 'Story',
}

export function formatLabelFor(fmt: FlowJokeFormat): string { return FORMAT_LABEL[fmt] }

export function tagToneFor(fmt: FlowJokeFormat): string {
  switch (fmt) {
    case 'oneliner':
    case 'anti': return 'dark'
    case 'observ':
    case 'knock':
    case 'story': return 'amber'
    case 'setup':
    default: return ''
  }
}

interface JokeRendererProps {
  payload: JokePayload
  big?: boolean
  /** Force the punchline/all-knock-lines visible. Editor preview passes true. */
  revealed?: boolean
  /** When false, disables tap-to-reveal and knock step-through (preview mode). */
  interactive?: boolean
  /** Story reading-time label (e.g. "2 min"). Optional. */
  read?: string
  className?: string
  /** Fired once when the user reveals the payoff (setup→punchline tap, or the
   * knock-knock chain reaching its final line). Used for real reveal telemetry. */
  onReveal?: () => void
}

/**
 * Pure, format-aware joke body renderer. Single source of rendering truth shared by
 * FlowJokeCard (reader) and the creator editor PreviewPane (always-revealed preview).
 */
export function JokeRenderer({
  payload, big = false, revealed: revealedProp, interactive = true, read, className, onReveal,
}: JokeRendererProps) {
  const { format: fmt } = payload
  const skin = SKIN[fmt] ?? SKIN.setup
  const [localRevealed, setLocalRevealed] = useState(fmt !== 'setup')
  const [knockStep, setKnockStep] = useState(0)

  const revealed = revealedProp ?? localRevealed
  const lines = payload.lines ?? []
  const visibleKnock = interactive ? lines.slice(0, knockStep + 1) : lines

  // Reveal the setup→punchline payoff and fire the reveal callback once.
  const revealSetup = () => {
    setLocalRevealed(true)
    onReveal?.()
  }

  // Advance the knock-knock chain; fire the reveal callback when the last
  // line (the payoff) becomes visible.
  const advanceKnock = () => {
    setKnockStep((s) => {
      const next = Math.min(s + 1, lines.length - 1)
      if (next === lines.length - 1 && s !== next) onReveal?.()
      return next
    })
  }

  if (fmt === 'setup') {
    const titleSize = big ? 24 : 16
    const punchSize = big ? 44 : 22
    const canReveal = interactive && !revealed
    return (
      <div className={className} onClick={() => canReveal && revealSetup()} style={{ cursor: canReveal ? 'pointer' : 'default' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: titleSize, color: skin.fg, lineHeight: 1.3, marginTop: 14 }}>
          {payload.setup}
        </div>
        <div className={`punch-blur ${revealed ? 'is-revealed' : ''}`}
          style={{ marginTop: 12, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: punchSize, letterSpacing: '-0.02em', color: skin.fg, lineHeight: 1.05 }}>
          {payload.punchline}
        </div>
        {canReveal && <div className="eyebrow-mono" style={{ marginTop: 14, color: '#6A1CF6' }}>Tap to reveal punchline →</div>}
      </div>
    )
  }

  if (fmt === 'oneliner') {
    const sz = big ? 38 : 22
    return (
      <div className={className} style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: sz, letterSpacing: '-0.02em', color: skin.fg, lineHeight: 1.05, textWrap: 'balance' as const }}>
        {payload.text}
      </div>
    )
  }

  if (fmt === 'observ') {
    const sz = big ? 26 : 18
    return (
      <div className={className} style={{ marginTop: 14, position: 'relative' }}>
        <span aria-hidden style={{ position: 'absolute', top: -12, left: -6, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 60, lineHeight: 1, color: '#6A1CF6', opacity: 0.35 }}>"</span>
        <div style={{ paddingLeft: 24, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 500, fontSize: sz, color: skin.fg, lineHeight: 1.3, textWrap: 'balance' as const }}>
          {payload.text}
        </div>
      </div>
    )
  }

  if (fmt === 'anti') {
    const sz = big ? 30 : 20
    return (
      <div className={className} style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: big ? 17 : 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>{payload.setup}</div>
        <div style={{ marginTop: 10, fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: sz, letterSpacing: '-0.02em', color: '#fff', lineHeight: 1.1 }}>{payload.punchline}</div>
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>* That's it. That's the joke.</div>
      </div>
    )
  }

  if (fmt === 'knock') {
    const canAdvance = interactive && knockStep < lines.length - 1
    return (
      <div className={className} onClick={() => canAdvance && advanceKnock()}
        style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6, cursor: canAdvance ? 'pointer' : 'default' }}>
        {visibleKnock.map((l, i) => (
          <div key={i} style={{ alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end', maxWidth: '82%', padding: '7px 11px', borderRadius: 13, background: i % 2 === 0 ? '#F2E9FF' : '#1A1A1A', color: i % 2 === 0 ? '#6A1CF6' : '#fff', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: i === lines.length - 1 ? 800 : 600 }}>
            {l}
          </div>
        ))}
        {canAdvance && <div className="eyebrow-mono" style={{ marginTop: 6, color: '#6A1CF6' }}>Tap to advance · {knockStep + 1}/{lines.length}</div>}
      </div>
    )
  }

  if (fmt === 'story') {
    return (
      <div className={className} style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="tag-flow" style={{ background: '#5F4200', color: '#FFC965' }}>
            <Sparkles size={10} style={{ marginRight: 4 }} />{read ?? '30 sec read'}
          </span>
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: big ? 17 : 14, color: skin.fg, lineHeight: 1.55, textWrap: 'pretty' as const }}>
          {payload.text}
        </div>
      </div>
    )
  }

  return null
}
