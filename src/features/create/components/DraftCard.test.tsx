import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DraftCard } from './DraftCard'
import type { ContentDraft } from '@/features/create'

const baseDraft: ContentDraft = {
  id: 1,
  format: 'oneliner',
  text: 'A funny one-liner joke.',
  setup: '',
  punchline: '',
  lines: null,
  status: 'draft',
  themes: ['tech'],
  categories: ['programming'],
  cultures: [],
  ageRating: null,
  language: 'en',
  source: 'original',
  lastEditedAt: '2026-05-23T10:00:00Z',
  rejectionReason: '',
  likes: null,
  stats: null,
}

describe('DraftCard', () => {
  it('shows excerpt from text field for oneliner format', () => {
    render(<DraftCard draft={baseDraft} onClick={vi.fn()} />)
    expect(screen.getByText(/funny one-liner/i)).toBeInTheDocument()
  })

  it('shows excerpt from setup field for setup format', () => {
    const setupDraft: ContentDraft = {
      ...baseDraft,
      format: 'setup',
      text: '',
      setup: 'Why did the chicken?',
      punchline: 'To get to the other side.',
    }
    render(<DraftCard draft={setupDraft} onClick={vi.fn()} />)
    expect(screen.getByText(/Why did the chicken/i)).toBeInTheDocument()
  })

  it('shows status badge', () => {
    render(<DraftCard draft={baseDraft} onClick={vi.fn()} />)
    expect(screen.getByLabelText('Status: draft')).toBeInTheDocument()
  })

  it('shows a pending status badge for pending draft', () => {
    const pending: ContentDraft = { ...baseDraft, status: 'pending' }
    render(<DraftCard draft={pending} onClick={vi.fn()} />)
    expect(screen.getByLabelText('Status: pending')).toBeInTheDocument()
  })
})
