import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ObservationalEditor } from './ObservationalEditor'
import { emptyEditorDraft } from '@/features/create'
import type { EditorAction } from '@/features/create'

describe('ObservationalEditor', () => {
  it('renders a textarea', () => {
    const draft = emptyEditorDraft('observ')
    render(<ObservationalEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('dispatches setField text when typing', () => {
    const dispatch = vi.fn()
    const draft = emptyEditorDraft('observ')
    render(<ObservationalEditor draft={draft} dispatch={dispatch} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Have you noticed…' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setField',
      field: 'text',
      value: 'Have you noticed…',
    })
  })

  it('renders inline error from errors.text', () => {
    const draft = emptyEditorDraft('observ')
    render(
      <ObservationalEditor draft={draft} dispatch={vi.fn()} errors={{ text: 'Required field' }} />
    )
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('does not render an error element when errors is absent', () => {
    const draft = emptyEditorDraft('observ')
    render(<ObservationalEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
