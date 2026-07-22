import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import type { FormatRule, FormatSlug } from '@/features/create/types'

export interface ChangeFormatModalProps {
  open: boolean
  current: FormatSlug
  onClose: () => void
  onConfirm: (slug: FormatSlug) => void
  /**
   * Backend format catalog (typically `useFormats().data`). When present and
   * non-empty, options are filtered down to slugs the catalog actually serves —
   * during the FE-first deploy window the current prod backend has no `video`/
   * `audio` Format row yet, and picking one would PATCH format:'video' into a
   * 400 that breaks autosave. Loading/error states resolve to an empty/undefined
   * array here, which falls back to the full static list.
   */
  formats?: FormatRule[]
}

const FORMAT_OPTIONS: { value: FormatSlug; label: string }[] = [
  { value: 'oneliner', label: 'One-liner' },
  { value: 'setup', label: 'Setup / Punchline' },
  { value: 'knock', label: 'Knock-Knock' },
  { value: 'story', label: 'Story' },
  { value: 'anti', label: 'Anti-joke' },
  { value: 'observ', label: 'Observational' },
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
]

function visibleOptions(formats: FormatRule[] | undefined): typeof FORMAT_OPTIONS {
  if (!formats || formats.length === 0) return FORMAT_OPTIONS
  const known = new Set(formats.map((f) => f.slug))
  const filtered = FORMAT_OPTIONS.filter((o) => known.has(o.value))
  // Never show zero options — a catalog missing every known slug is more
  // likely a bad response shape than an intentional empty catalog.
  return filtered.length > 0 ? filtered : FORMAT_OPTIONS
}

export function ChangeFormatModal({ open, current, onClose, onConfirm, formats }: ChangeFormatModalProps) {
  const [selected, setSelected] = useState<FormatSlug>(current)
  const options = visibleOptions(formats)

  function handleConfirm() {
    onConfirm(selected)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Change format?"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="pill" onClick={handleConfirm}>
            Change format
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: '#D97706',
            background: '#FEF3C7',
            borderRadius: 10,
            padding: '8px 12px',
            lineHeight: 1.5,
          }}
        >
          Switching formats may mean some of your content may be cleared. This action cannot
          be undone.
        </p>
        <RadioGroup
          name="change-format"
          value={selected}
          onChange={(v) => setSelected(v as FormatSlug)}
          label="Select format"
          options={options}
        />
      </div>
    </Modal>
  )
}
