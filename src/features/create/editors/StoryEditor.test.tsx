import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { StoryEditor } from './StoryEditor'
import { emptyEditorDraft } from '@/features/create'
import type { EditorDraft, EditorAction } from '@/features/create'

function draftWithText(text: string): EditorDraft {
  return { ...emptyEditorDraft('story'), text }
}

describe('StoryEditor', () => {
  it('renders a textarea', () => {
    const draft = emptyEditorDraft('story')
    render(<StoryEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('dispatches setField text when typing', () => {
    const dispatch = vi.fn()
    const draft = emptyEditorDraft('story')
    render(<StoryEditor draft={draft} dispatch={dispatch} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Once upon a time' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setField',
      field: 'text',
      value: 'Once upon a time',
    })
  })

  it('shows word count of 0 for empty draft', () => {
    const draft = emptyEditorDraft('story')
    render(<StoryEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByText(/0 \/ 30 words/i)).toBeInTheDocument()
  })

  it('shows amber styling when word count is below 30', () => {
    const draft = draftWithText('one two three')
    const { container } = render(<StoryEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByText(/3 \/ 30 words/i)).toBeInTheDocument()
    // amber color is present in the counter element
    const counter = container.querySelector('[data-testid="word-counter"]')
    expect(counter).toHaveStyle({ color: '#D97706' })
  })

  it('shows green styling when word count reaches 30', () => {
    const thirtyWords = Array.from({ length: 30 }, (_, i) => `word${i + 1}`).join(' ')
    const draft = draftWithText(thirtyWords)
    const { container } = render(<StoryEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByText(/30 \/ 30 words/i)).toBeInTheDocument()
    const counter = container.querySelector('[data-testid="word-counter"]')
    expect(counter).toHaveStyle({ color: '#16A34A' })
  })

  it('renders inline error from errors.text', () => {
    const draft = emptyEditorDraft('story')
    render(
      <StoryEditor draft={draft} dispatch={vi.fn()} errors={{ text: 'Story too short' }} />
    )
    expect(screen.getByText('Story too short')).toBeInTheDocument()
  })
})
