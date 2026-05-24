import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { KnockEditor } from './KnockEditor'
import { emptyEditorDraft } from '@/features/create'
import type { EditorAction } from '@/features/create'

function makeLines(n: number) {
  return Array.from({ length: n }, (_, i) => `Line ${i + 1}`)
}

function makeDraft(lines: string[]) {
  return { ...emptyEditorDraft('knock'), lines }
}

describe('KnockEditor', () => {
  it('renders lines with alternating A/B speaker labels', () => {
    const draft = makeDraft(['First', 'Second', 'Third', 'Fourth'])
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const aLabels = screen.getAllByText('A')
    const bLabels = screen.getAllByText('B')
    expect(aLabels).toHaveLength(2) // index 0,2
    expect(bLabels).toHaveLength(2) // index 1,3
  })

  it('Add line button appends an empty line by dispatching setLines', () => {
    const dispatch = vi.fn()
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={dispatch} />)
    fireEvent.click(screen.getByRole('button', { name: /add line/i }))
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setLines',
      lines: [...makeLines(4), ''],
    })
  })

  it('Add line button is disabled when there are 8 lines', () => {
    const draft = makeDraft(makeLines(8))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByRole('button', { name: /add line/i })).toBeDisabled()
  })

  it('Remove buttons are disabled when there are only 4 lines', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const removeButtons = screen.getAllByRole('button', { name: 'Remove line' })
    expect(removeButtons).toHaveLength(4)
    removeButtons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('editing a line dispatches setLines with updated value at that index', () => {
    const dispatch = vi.fn()
    const draft = makeDraft(['Line 1', 'Line 2', 'Line 3', 'Line 4'])
    render(<KnockEditor draft={draft} dispatch={dispatch} />)
    const textareas = screen.getAllByRole('textbox')
    fireEvent.change(textareas[0], { target: { value: 'Updated line 1' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setLines',
      lines: ['Updated line 1', 'Line 2', 'Line 3', 'Line 4'],
    })
  })

  it('Move down on index 0 dispatches setLines with first two lines swapped', () => {
    const dispatch = vi.fn()
    const lines = makeLines(4)
    const draft = makeDraft(lines)
    render(<KnockEditor draft={draft} dispatch={dispatch} />)
    const moveDownButtons = screen.getAllByRole('button', { name: 'Move line down' })
    fireEvent.click(moveDownButtons[0])
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setLines',
      lines: ['Line 2', 'Line 1', 'Line 3', 'Line 4'],
    })
  })

  it('Move up disabled on first line (index 0)', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const moveUpButtons = screen.getAllByRole('button', { name: 'Move line up' })
    expect(moveUpButtons[0]).toBeDisabled()
    expect(moveUpButtons[1]).not.toBeDisabled()
  })

  it('Move down disabled on last line', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const moveDownButtons = screen.getAllByRole('button', { name: 'Move line down' })
    expect(moveDownButtons[3]).toBeDisabled()
    expect(moveDownButtons[0]).not.toBeDisabled()
  })

  it('shows counter "N of 4–8 lines"', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    expect(screen.getByText('4 of 4–8 lines')).toBeInTheDocument()
  })

  it('counter is amber when fewer than 4 lines', () => {
    // start with 5 lines so we can see a 3-line count display
    const draft = makeDraft(makeLines(3))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const counter = screen.getByText('3 of 4–8 lines')
    expect(counter).toHaveStyle({ color: '#D97706' })
  })

  it('counter is not amber at 4 lines', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} />)
    const counter = screen.getByText('4 of 4–8 lines')
    expect(counter).not.toHaveStyle({ color: '#D97706' })
  })

  it('shows errors.lines inline when present', () => {
    const draft = makeDraft(makeLines(4))
    render(<KnockEditor draft={draft} dispatch={vi.fn()} errors={{ lines: 'Must have 4–8 lines' }} />)
    expect(screen.getByText('Must have 4–8 lines')).toBeInTheDocument()
  })
})
