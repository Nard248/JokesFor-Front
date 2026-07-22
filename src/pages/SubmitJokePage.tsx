import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { Sparkles, Eye, Send, ArrowLeft } from 'lucide-react'
import { FlowAppShell } from '@/components/FlowAppShell'
import { FlowJokeCard, type FlowJokeData, type FlowJokeFormat } from '@/components/FlowJokeCard'
import { useCreateDraft, useSubmitDraft } from '@/features/drafts'

/**
 * SubmitJokePage — redesigned for iteration 4.
 *
 * Two-pane layout:
 *   Left  — form: format picker, setup/punch/text inputs (format-dependent),
 *           tags, age rating
 *   Right — live preview using FlowJokeCard with the form fields piped in
 *
 * Submit options:
 *   - "Save as draft"     → useCreateDraft (status: draft)
 *   - "Submit for review" → useCreateDraft + useSubmitDraft chained
 *
 * Existing SubmitJokePage component preserved at /legacy/submit.
 */
export function SubmitJokePage() {
  const navigate = useNavigate()
  const createDraft = useCreateDraft()
  const submitDraft = useSubmitDraft()

  const [format, setFormat] = useState<FlowJokeFormat>('setup')
  const [setupText, setSetupText] = useState('')
  const [punchText, setPunchText] = useState('')
  const [oneLineText, setOneLineText] = useState('')
  const [knockLines, setKnockLines] = useState<string[]>(['', '', '', '', ''])
  const [tones, setTones] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const previewJoke: FlowJokeData = useMemo(() => {
    const base: FlowJokeData = {
      id: 'preview',
      fmt: format,
      themeLabel: tones.size > 0 ? [...tones][0] : undefined,
      catLabel: tones.size > 1 ? [...tones][1] : undefined,
      saves: '—',
      laughs: '—',
    }
    if (format === 'setup' || format === 'anti') {
      return { ...base, setup: setupText || 'Your setup goes here…', punch: punchText || 'And the punchline.' }
    }
    if (format === 'knock') {
      return { ...base, lines: knockLines.filter((l) => l.trim()).length > 0 ? knockLines.filter((l) => l.trim()) : ['Knock, knock.', "Who's there?", '…', 'Who?', '…'] }
    }
    return { ...base, text: oneLineText || 'Your joke goes here…' }
  }, [format, setupText, punchText, oneLineText, knockLines, tones])

  const validate = (): string | null => {
    if (format === 'setup' || format === 'anti') {
      if (!setupText.trim()) return 'Setup is required'
      if (!punchText.trim()) return 'Punchline is required'
    } else if (format === 'knock') {
      if (knockLines.filter((l) => l.trim()).length < 2) return 'Knock-knock needs at least 2 lines'
    } else {
      if (!oneLineText.trim()) return 'Joke text is required'
    }
    if (tones.size === 0) return 'Pick at least one tone'
    return null
  }

  const buildPayload = () => ({
    setup:
      format === 'setup' || format === 'anti'
        ? setupText.trim()
        : '',
    punchline:
      format === 'setup' || format === 'anti'
        ? punchText.trim()
        : '',
    text:
      format === 'oneliner' || format === 'observ' || format === 'story'
        ? oneLineText.trim()
        : format === 'knock'
        ? knockLines.filter((l) => l.trim()).join(' / ')
        : `${setupText.trim()} ${punchText.trim()}`.trim(),
    format: FORMAT_LABELS[format],
    status: 'draft' as const,
    tones: Array.from(tones),
    lastEditedAt: new Date().toISOString(),
  })

  const handleSaveDraft = () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    createDraft.mutate(buildPayload(), {
      onSuccess: () => navigate('/drafts'),
      onError: () => setError('Could not save draft. Try again?'),
    })
  }

  const handleSubmitForReview = () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    createDraft.mutate(buildPayload(), {
      onSuccess: (created) => {
        if (created?.id) {
          submitDraft.mutate(created.id, {
            onSuccess: () => navigate('/drafts'),
            onError: () => setError('Saved as draft, but submit-for-review failed. Try from the drafts page.'),
          })
        } else {
          navigate('/drafts')
        }
      },
      onError: () => setError('Could not save. Try again?'),
    })
  }

  const updateKnockLine = (i: number, v: string) => {
    setKnockLines((prev) => prev.map((line, idx) => (idx === i ? v : line)))
  }

  const toggleTone = (t: string) =>
    setTones((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  return (
    <div style={{ minHeight: '100vh', background: '#FBFAF7' }}>
      <FlowAppShell active="library">
        <div style={{ padding: '40px clamp(24px, 4vw, 56px)', maxWidth: 1200, margin: '0 auto' }}>
          <Link
            to="/drafts"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 14,
              color: '#52525B',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 16,
            }}
          >
            <ArrowLeft size={14} /> Back to drafts
          </Link>

          {/* Hero */}
          <div>
            <span className="eyebrow-mono">Submit · craft your joke</span>
            <h2
              style={{
                marginTop: 8,
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                letterSpacing: '-0.02em',
                color: '#1A1A1A',
                lineHeight: 1.05,
              }}
            >
              Got a <em className="wink">good one?</em>
            </h2>
            <p style={{ marginTop: 6, fontSize: 18, color: '#52525B', maxWidth: 600 }}>
              Pick the format, write the joke, watch the preview. Submit for review when it's ready to land.
            </p>
          </div>

          {/* Two-pane */}
          <div
            style={{
              marginTop: 36,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
              gap: 32,
              alignItems: 'start',
            }}
          >
            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Format picker */}
              <FormSection title="Format" subtitle="How does it land? Different formats render differently in the catalog.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      aria-pressed={format === f.id}
                      style={{
                        padding: '14px 12px',
                        background: format === f.id ? '#F2E9FF' : '#fff',
                        color: '#1A1A1A',
                        border: `1px solid ${format === f.id ? '#6A1CF6' : '#E9E8E7'}`,
                        borderRadius: 12,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{f.label}</span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>{f.hint}</span>
                    </button>
                  ))}
                </div>
              </FormSection>

              {/* Joke fields — vary by format */}
              <FormSection title="Joke" subtitle="Type. The preview updates as you go.">
                {format === 'setup' || format === 'anti' ? (
                  <>
                    <TextField label="Setup" value={setupText} onChange={setSetupText} placeholder={format === 'anti' ? 'Why did the chicken cross the road?' : "Why don't scientists trust atoms?"} />
                    <TextField label="Punchline" value={punchText} onChange={setPunchText} placeholder={format === 'anti' ? 'To get to the other side.' : 'Because they make up everything.'} />
                  </>
                ) : format === 'knock' ? (
                  <>
                    <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                      Knock-knocks alternate speakers — odd lines for the visitor, even lines for the door.
                    </p>
                    {knockLines.map((line, i) => (
                      <TextField
                        key={i}
                        label={`Line ${i + 1}`}
                        value={line}
                        onChange={(v) => updateKnockLine(i, v)}
                        placeholder={['Knock, knock.', "Who's there?", 'Lettuce.', 'Lettuce who?', "Lettuce in. It's freezing."][i] ?? ''}
                      />
                    ))}
                  </>
                ) : (
                  <TextArea
                    label={format === 'story' ? 'Story' : format === 'observ' ? 'Observation' : 'Joke text'}
                    value={oneLineText}
                    onChange={setOneLineText}
                    placeholder={
                      format === 'observ'
                        ? "Adulthood is just emailing 'Sounds good!' until one of you dies."
                        : format === 'story'
                        ? 'A man walks into a library and asks…'
                        : 'I told my wife she was drawing her eyebrows too high. She seemed surprised.'
                    }
                    rows={format === 'story' ? 6 : 3}
                  />
                )}
              </FormSection>

              {/* Tones */}
              <FormSection title="Tones" subtitle="Pick one or more. We use these for filtering and recommendations.">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TONE_OPTIONS.map((t) => {
                    const active = tones.has(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTone(t)}
                        aria-pressed={active}
                        style={{
                          height: 32,
                          padding: '0 14px',
                          fontSize: 13,
                          background: active ? '#6A1CF6' : '#fff',
                          color: active ? '#fff' : '#1A1A1A',
                          border: `1px solid ${active ? '#6A1CF6' : '#E9E8E7'}`,
                          borderRadius: 9999,
                          fontFamily: 'inherit',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </FormSection>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: 'rgba(214, 67, 43, 0.08)',
                    border: '1px solid rgba(214, 67, 43, 0.2)',
                    color: '#A02B16',
                    fontSize: 14,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={createDraft.isPending}
                  className="btn-flow-ghost"
                  style={{ height: 48, fontSize: 14 }}
                >
                  {createDraft.isPending && !submitDraft.isPending ? 'Saving…' : 'Save as draft'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={createDraft.isPending || submitDraft.isPending}
                  className="btn-flow-primary"
                  style={{ height: 48, flex: 1, fontSize: 14, justifyContent: 'center' }}
                >
                  <Send size={14} />
                  {submitDraft.isPending ? 'Submitting…' : createDraft.isPending ? 'Saving…' : 'Submit for review'}
                </button>
              </div>
            </div>

            {/* Preview pane */}
            <aside
              style={{
                position: 'sticky',
                top: 88,
              }}
            >
              <div
                style={{
                  padding: 24,
                  background: 'linear-gradient(160deg, #FFFFFF 0%, #FBFAF7 100%)',
                  border: '1px solid #E9E8E7',
                  borderRadius: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    top: -60,
                    right: -60,
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #F2E9FF, transparent 70%)',
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, position: 'relative' }}>
                  <Eye size={14} color="#6A1CF6" />
                  <span className="eyebrow-mono" style={{ color: '#6A1CF6' }}>
                    Live preview
                  </span>
                </div>
                <FlowJokeCard joke={previewJoke} />
                <p style={{ marginTop: 14, fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
                  <Sparkles size={11} style={{ marginRight: 4 }} />
                  This is exactly how it'll show up in the catalog.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </FlowAppShell>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Form atoms
// ──────────────────────────────────────────────────────────────────────────

function FormSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        padding: 24,
        background: '#fff',
        border: '1px solid #E9E8E7',
        borderRadius: 18,
      }}
    >
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: '#1A1A1A', letterSpacing: '-0.01em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 14 }}>{subtitle}</p>
      {children}
    </section>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label className="eyebrow-mono" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flow-input"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="eyebrow-mono" style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #E9E8E7',
          background: '#fff',
          fontFamily: 'var(--font-sans)',
          fontSize: 15,
          color: '#1A1A1A',
          outline: 'none',
          resize: 'vertical',
          lineHeight: 1.5,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#6A1CF6'
          e.target.style.boxShadow = '0 0 0 4px #F2E9FF'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#E9E8E7'
          e.target.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// Static data
// ──────────────────────────────────────────────────────────────────────────

const FORMAT_OPTIONS: { id: FlowJokeFormat; label: string; hint: string }[] = [
  { id: 'oneliner', label: 'One-liner', hint: 'Single punch.' },
  { id: 'setup', label: 'Setup → Punch', hint: 'Two-beat classic.' },
  { id: 'knock', label: 'Knock-knock', hint: 'Conversational.' },
  { id: 'story', label: 'Story', hint: 'Long-form, slow burn.' },
  { id: 'anti', label: 'Anti-joke', hint: 'Refuses to land.' },
  { id: 'observ', label: 'Observational', hint: 'Quote-style.' },
]

const FORMAT_LABELS: Record<FlowJokeFormat, string> = {
  oneliner: 'One-liner',
  setup: 'Setup & Punchline',
  knock: 'Knock-knock',
  story: 'Story',
  anti: 'Anti-joke',
  observ: 'Observational',
  // Not offered in FORMAT_OPTIONS above — this component is unrouted (the live
  // create flow is FormatPickerPage + EditorPage/ImageEditor, which does support
  // 'image'/'video'/'audio'); entries exist only to satisfy Record<FlowJokeFormat, …>.
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
}

const TONE_OPTIONS = [
  'Wholesome',
  'Office-proper',
  'Dad',
  'Kid-safe',
  'Nerd',
  'Surreal',
  'Dark',
  'Edgy',
  'Witty',
  'Punny',
]
