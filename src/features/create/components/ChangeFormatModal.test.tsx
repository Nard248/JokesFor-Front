import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChangeFormatModal } from './ChangeFormatModal'
import type { FormatRule } from '@/features/create/types'

function rule(slug: FormatRule['slug']): FormatRule {
  return {
    id: 1, slug, name: slug, description: '',
    required_fields: [], forbidden_fields: [], constraints: {},
  }
}

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

  describe('backend catalog gating', () => {
    it('falls back to the 7 prod-pinned formats (no Video/Audio) when no catalog is provided', () => {
      render(
        <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} />
      )
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.queryByText('Video')).not.toBeInTheDocument()
      expect(screen.queryByText('Audio')).not.toBeInTheDocument()
    })

    it('falls back to the 7 prod-pinned formats (no Video/Audio) when the catalog is empty (loading/error)', () => {
      render(
        <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} formats={[]} />
      )
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.queryByText('Video')).not.toBeInTheDocument()
      expect(screen.queryByText('Audio')).not.toBeInTheDocument()
    })

    it('filters out formats the backend catalog does not serve yet', () => {
      const formats = [
        rule('oneliner'), rule('setup'), rule('knock'),
        rule('story'), rule('anti'), rule('observ'), rule('image'),
        // no video/audio rows — mirrors the current prod backend during the
        // FE-first deploy window
      ]
      render(
        <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} formats={formats} />
      )
      expect(screen.getByText('One-liner')).toBeInTheDocument()
      expect(screen.getByText('Image')).toBeInTheDocument()
      expect(screen.queryByText('Video')).not.toBeInTheDocument()
      expect(screen.queryByText('Audio')).not.toBeInTheDocument()
    })

    it('shows video/audio once the catalog includes them', () => {
      const formats = [
        rule('oneliner'), rule('setup'), rule('knock'), rule('story'),
        rule('anti'), rule('observ'), rule('image'), rule('video'), rule('audio'),
      ]
      render(
        <ChangeFormatModal open current="oneliner" onClose={vi.fn()} onConfirm={vi.fn()} formats={formats} />
      )
      expect(screen.getByText('Video')).toBeInTheDocument()
      expect(screen.getByText('Audio')).toBeInTheDocument()
    })
  })
})
