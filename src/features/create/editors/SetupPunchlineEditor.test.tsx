import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SetupPunchlineEditor } from './SetupPunchlineEditor'
import { emptyEditorDraft } from '@/features/create'
import type { EditorDraft, EditorAction } from '@/features/create'

function setupDraft(overrides: Partial<EditorDraft> = {}): EditorDraft {
  return { ...emptyEditorDraft('setup'), ...overrides }
}

function antiDraft(overrides: Partial<EditorDraft> = {}): EditorDraft {
  return { ...emptyEditorDraft('anti'), ...overrides }
}

describe('SetupPunchlineEditor', () => {
  it('renders two textareas (setup and punchline)', () => {
    const draft = setupDraft()
    render(<SetupPunchlineEditor draft={draft} dispatch={vi.fn()} />)
    const textareas = screen.getAllByRole('textbox')
    expect(textareas).toHaveLength(2)
  })

  it('dispatches setField setup when typing in the setup textarea', () => {
    const dispatch = vi.fn()
    const draft = setupDraft()
    render(<SetupPunchlineEditor draft={draft} dispatch={dispatch} />)
    const [setupTextarea] = screen.getAllByRole('textbox')
    fireEvent.change(setupTextarea, { target: { value: 'Why did the chicken?' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setField',
      field: 'setup',
      value: 'Why did the chicken?',
    })
  })

  it('dispatches setField punchline when typing in the punchline textarea', () => {
    const dispatch = vi.fn()
    const draft = setupDraft()
    render(<SetupPunchlineEditor draft={draft} dispatch={dispatch} />)
    const [, punchlineTextarea] = screen.getAllByRole('textbox')
    fireEvent.change(punchlineTextarea, { target: { value: 'To get to the other side.' } })
    expect(dispatch).toHaveBeenCalledWith<[EditorAction]>({
      type: 'setField',
      field: 'punchline',
      value: 'To get to the other side.',
    })
  })

  it('shows the anti format footer hint when format is "anti"', () => {
    const draft = antiDraft()
    render(<SetupPunchlineEditor draft={draft} dispatch={vi.fn()} />)
    expect(
      screen.getByText(/that's it\. that's the joke/i)
    ).toBeInTheDocument()
  })

  it('does NOT show the anti footer hint when format is "setup"', () => {
    const draft = setupDraft()
    render(<SetupPunchlineEditor draft={draft} dispatch={vi.fn()} />)
    expect(
      screen.queryByText(/that's it\. that's the joke/i)
    ).not.toBeInTheDocument()
  })

  it('renders setup error when errors.setup is set', () => {
    const draft = setupDraft()
    render(
      <SetupPunchlineEditor draft={draft} dispatch={vi.fn()} errors={{ setup: 'Setup is required' }} />
    )
    expect(screen.getByText('Setup is required')).toBeInTheDocument()
  })

  it('renders punchline error when errors.punchline is set', () => {
    const draft = setupDraft()
    render(
      <SetupPunchlineEditor draft={draft} dispatch={vi.fn()} errors={{ punchline: 'Punchline is required' }} />
    )
    expect(screen.getByText('Punchline is required')).toBeInTheDocument()
  })
})
