import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SubmitConfirmModal } from './SubmitConfirmModal'

describe('SubmitConfirmModal', () => {
  it('renders when open=true', () => {
    render(<SubmitConfirmModal open onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Send to moderators?')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(<SubmitConfirmModal open={false} onClose={vi.fn()} onConfirm={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('calls onConfirm when Submit button clicked', () => {
    const onConfirm = vi.fn()
    render(<SubmitConfirmModal open onClose={vi.fn()} onConfirm={onConfirm} />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onClose when Cancel button clicked', () => {
    const onClose = vi.fn()
    render(<SubmitConfirmModal open onClose={onClose} onConfirm={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })
})
