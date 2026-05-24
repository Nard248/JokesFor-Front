import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { OneLinerEditor } from './OneLinerEditor'
import { emptyEditorDraft } from '@/features/create'
import type { EditorAction } from '@/features/create'

describe('OneLinerEditor', () => {
  it('renders a textarea', () => {
    const draft = emptyEditorDraft('oneliner')
    render(<OneLinerEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('dispatches setField text when typing', () => {
    const dispatch = vi.fn()
    const draft = emptyEditorDraft('oneliner')
    render(<OneLinerEditor draft={draft} dispatch={dispatch} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Hello joke' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setField',
      field: 'text',
      value: 'Hello joke',
    })
  })

  it('renders inline error from errors.text', () => {
    const draft = emptyEditorDraft('oneliner')
    render(
      <OneLinerEditor draft={draft} dispatch={vi.fn()} errors={{ text: 'Text is required' }} />
    )
    expect(screen.getByText('Text is required')).toBeInTheDocument()
  })

  it('does not render error when errors.text is absent', () => {
    const draft = emptyEditorDraft('oneliner')
    render(<OneLinerEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
