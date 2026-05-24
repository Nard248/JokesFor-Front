import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DialogueLine } from './DialogueLine'

function makeProps(overrides: Partial<Parameters<typeof DialogueLine>[0]> = {}) {
  return {
    index: 0,
    value: 'Hello',
    onChange: vi.fn(),
    onRemove: vi.fn(),
    onMoveUp: vi.fn(),
    onMoveDown: vi.fn(),
    canRemove: true,
    canMoveUp: true,
    canMoveDown: true,
    ...overrides,
  }
}

describe('DialogueLine', () => {
  it('shows speaker label A for even index', () => {
    render(<DialogueLine {...makeProps({ index: 0 })} />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows speaker label B for odd index', () => {
    render(<DialogueLine {...makeProps({ index: 1 })} />)
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('renders the value in the textarea', () => {
    render(<DialogueLine {...makeProps({ value: 'Test line' })} />)
    expect(screen.getByDisplayValue('Test line')).toBeInTheDocument()
  })

  it('calls onChange when textarea changes', () => {
    const onChange = vi.fn()
    render(<DialogueLine {...makeProps({ onChange })} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } })
    expect(onChange).toHaveBeenCalledWith('new text')
  })

  it('calls onMoveUp when Move line up button clicked', () => {
    const onMoveUp = vi.fn()
    render(<DialogueLine {...makeProps({ onMoveUp })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move line up' }))
    expect(onMoveUp).toHaveBeenCalled()
  })

  it('calls onMoveDown when Move line down button clicked', () => {
    const onMoveDown = vi.fn()
    render(<DialogueLine {...makeProps({ onMoveDown })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Move line down' }))
    expect(onMoveDown).toHaveBeenCalled()
  })

  it('calls onRemove when Remove line button clicked', () => {
    const onRemove = vi.fn()
    render(<DialogueLine {...makeProps({ onRemove })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove line' }))
    expect(onRemove).toHaveBeenCalled()
  })

  it('disables Move line up when canMoveUp=false', () => {
    render(<DialogueLine {...makeProps({ canMoveUp: false })} />)
    expect(screen.getByRole('button', { name: 'Move line up' })).toBeDisabled()
  })

  it('disables Move line down when canMoveDown=false', () => {
    render(<DialogueLine {...makeProps({ canMoveDown: false })} />)
    expect(screen.getByRole('button', { name: 'Move line down' })).toBeDisabled()
  })

  it('disables Remove line when canRemove=false', () => {
    render(<DialogueLine {...makeProps({ canRemove: false })} />)
    expect(screen.getByRole('button', { name: 'Remove line' })).toBeDisabled()
  })

  it('shows char counter for the value', () => {
    render(<DialogueLine {...makeProps({ value: 'Hello' })} />)
    // 5 chars shown
    expect(screen.getByText('5 / 200')).toBeInTheDocument()
  })
})
