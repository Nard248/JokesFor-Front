import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DeleteDraftModal } from './DeleteDraftModal'

describe('DeleteDraftModal', () => {
  it('renders when open=true', () => {
    render(<DeleteDraftModal open onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Delete this draft?')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(<DeleteDraftModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm when Delete button clicked', () => {
    const onConfirm = vi.fn()
    render(<DeleteDraftModal open onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn()
    render(<DeleteDraftModal open onClose={onClose} onConfirm={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
