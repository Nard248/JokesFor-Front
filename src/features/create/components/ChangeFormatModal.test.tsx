import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChangeFormatModal } from './ChangeFormatModal'

describe('ChangeFormatModal', () => {
  it('renders when open=true', () => {
    render(
      <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Change format?')).toBeInTheDocument()
  })

  it('does not render when open=false', () => {
    render(
      <ChangeFormatModal open={false} current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows all 7 format options', () => {
    render(
      <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    expect(screen.getByText('One-liner')).toBeInTheDocument()
    expect(screen.getByText('Setup / Punchline')).toBeInTheDocument()
    expect(screen.getByText('Knock-Knock')).toBeInTheDocument()
    expect(screen.getByText('Story')).toBeInTheDocument()
    expect(screen.getByText('Anti-joke')).toBeInTheDocument()
    expect(screen.getByText('Observational')).toBeInTheDocument()
    expect(screen.getByText('Image')).toBeInTheDocument()
  })

  it('calls onConfirm with the selected slug when Change format clicked', () => {
    const onConfirm = vi.fn()
    render(
      <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={onConfirm} />
    )
    // Select "Knock-Knock"
    fireEvent.click(screen.getByLabelText('Knock-Knock'))
    fireEvent.click(screen.getByRole('button', { name: /change format/i }))
    expect(onConfirm).toHaveBeenCalledWith('knock')
  })

  it('calls onClose when Cancel clicked', () => {
    const onClose = vi.fn()
    render(
      <ChangeFormatModal open current="oneliner" onClose={onClose} onConfirm={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('shows warning copy about content clearing', () => {
    render(
      <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} />
    )
    // Warning copy should mention content may be cleared
    expect(screen.getByText(/content may be cleared/i)).toBeInTheDocument()
  })
})
