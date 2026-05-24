import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { RadioGroup } from '@/components/ui/radio-group'
import type { FormatSlug } from '@/features/create/types'

export interface ChangeFormatModalProps {
  open: boolean
  current: FormatSlug
  onClose: () => void
  onConfirm: (slug: FormatSlug) => void
}

const FORMAT_OPTIONS: { value: FormatSlug; label: string }[] = [
  { value: 'oneliner', label: 'One-liner' },
  { value: 'setup', label: 'Setup / Punchline' },
  { value: 'knock', label: 'Knock-Knock' },
  { value: 'story', label: 'Story' },
  { value: 'anti', label: 'Anti-joke' },
  { value: 'observ', label: 'Observational' },
]

export function ChangeFormatModal({ open, current, onClose, onConfirm }: ChangeFormatModalProps) {
  const [selected, setSelected] = useState<FormatSlug>(current)

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
          options={FORMAT_OPTIONS}
        />
      </div>
    </Modal>
  )
}
