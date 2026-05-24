import { useState } from 'react'
import type { Taxon } from '@/features/create'
import { Chip } from '@/components/ui/chip'

interface TagPickerProps {
  label: string
  options: Taxon[]
  selected: string[]
  onChange: (slugs: string[]) => void
}

export function TagPicker({ label, options, selected, onChange }: TagPickerProps) {
  const [filter, setFilter] = useState('')

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(filter.toLowerCase())
  )

  function toggle(slug: string) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug))
    } else {
      onChange([...selected, slug])
    }
  }

  function remove(slug: string) {
    onChange(selected.filter((s) => s !== slug))
  }

  const selectedTaxons = options.filter((opt) => selected.includes(opt.slug))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>{label}</label>

      {selectedTaxons.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {selectedTaxons.map((opt) => (
            /* Use a non-button element for selected chips with remove, to avoid nested <button> */
            <span
              key={opt.slug}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px 6px 16px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 500,
                background: 'rgba(202, 253, 0, 0.2)',
                border: '2px solid #CAFD00',
                color: '#3A4A00',
              }}
            >
              {opt.name}
              <button
                type="button"
                aria-label={`Remove ${opt.name}`}
                onClick={() => remove(opt.slug)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 0 0 2px',
                  fontSize: 16,
                  lineHeight: 1,
                  color: '#3A4A00',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        aria-label={`Filter ${label.toLowerCase()}`}
        placeholder={`Filter ${label.toLowerCase()}…`}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 14px',
          borderRadius: 18,
          border: '1.5px solid #E9E8E7',
          fontSize: 14,
          color: '#1A1A1A',
          outline: 'none',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {filteredOptions.map((opt) => {
          const isSelected = selected.includes(opt.slug)
          return (
            <Chip
              key={opt.slug}
              selected={isSelected}
              onClick={() => toggle(opt.slug)}
            >
              {opt.name}
            </Chip>
          )
        })}
      </div>
    </div>
  )
}
