import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('renders "draft" status text and aria-label', () => {
    render(<StatusBadge status="draft" />)
    expect(screen.getByText(/draft/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Status: draft')).toBeInTheDocument()
  })

  it('renders "pending" status text and aria-label', () => {
    render(<StatusBadge status="pending" />)
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Status: pending')).toBeInTheDocument()
  })

  it('renders "published" status text and aria-label', () => {
    render(<StatusBadge status="published" />)
    expect(screen.getByText(/published/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Status: published')).toBeInTheDocument()
  })

  it('renders "rejected" status text and aria-label', () => {
    render(<StatusBadge status="rejected" />)
    expect(screen.getByText(/rejected/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Status: rejected')).toBeInTheDocument()
  })
})
