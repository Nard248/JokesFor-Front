import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EditorShell } from './EditorShell'

function makeProps(overrides: Partial<Parameters<typeof EditorShell>[0]> = {}) {
  return {
    formatLabel: 'One-liner',
    onChangeFormat: vi.fn(),
    footer: <div>Footer content</div>,
    preview: <div>Preview content</div>,
    children: <div>Editor content</div>,
    ...overrides,
  }
}

describe('EditorShell', () => {
  it('renders the format label', () => {
    render(<EditorShell {...makeProps()} />)
    expect(screen.getByText('One-liner')).toBeInTheDocument()
  })

  it('renders children (editor content)', () => {
    render(<EditorShell {...makeProps()} />)
    expect(screen.getByText('Editor content')).toBeInTheDocument()
  })

  it('renders preview content', () => {
    render(<EditorShell {...makeProps()} />)
    expect(screen.getByText('Preview content')).toBeInTheDocument()
  })

  it('renders footer content', () => {
    render(<EditorShell {...makeProps()} />)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('clicking "Change format" calls onChangeFormat', () => {
    const onChangeFormat = vi.fn()
    render(<EditorShell {...makeProps({ onChangeFormat })} />)
    fireEvent.click(screen.getByRole('button', { name: /change format/i }))
    expect(onChangeFormat).toHaveBeenCalled()
  })

  it('mobile toggle: clicking Preview switches editor pane to hidden and preview pane to block', () => {
    render(<EditorShell {...makeProps()} />)
    fireEvent.click(screen.getByRole('button', { name: /^preview$/i }))
    const editorPane = screen.getByTestId('editor-pane')
    const previewPane = screen.getByTestId('preview-pane')
    // In jsdom md: variants don't apply — check the mobile-state class
    expect(editorPane.className).toContain('hidden')
    expect(previewPane.className).toContain('block')
  })

  it('mobile toggle: clicking Edit after Preview switches back', () => {
    render(<EditorShell {...makeProps()} />)
    // Switch to preview
    fireEvent.click(screen.getByRole('button', { name: /^preview$/i }))
    // Switch back to edit
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    const editorPane = screen.getByTestId('editor-pane')
    expect(editorPane.className).toContain('block')
    expect(screen.getByText('Editor content')).toBeInTheDocument()
  })

  it('toggle wrapper has md:hidden class (hidden on desktop)', () => {
    render(<EditorShell {...makeProps()} />)
    const editBtn = screen.getByRole('button', { name: /^edit$/i })
    // The toggle wrapper is the parent of the Edit button
    const toggleWrapper = editBtn.closest('div')!
    expect(toggleWrapper.className).toContain('md:hidden')
  })

  it('both panes carry md:block class (always visible on desktop)', () => {
    render(<EditorShell {...makeProps()} />)
    const editorPane = screen.getByTestId('editor-pane')
    const previewPane = screen.getByTestId('preview-pane')
    expect(editorPane.className).toContain('md:block')
    expect(previewPane.className).toContain('md:block')
  })
})
