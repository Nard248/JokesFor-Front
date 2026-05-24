import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PublishedStats as PublishedStatsComponent } from './PublishedStats'

describe('PublishedStats', () => {
  it('renders saves, reactions and reports counts', () => {
    render(
      <PublishedStatsComponent stats={{ saves: 42, reactions: 17, reports: 3 }} />
    )
    expect(screen.getByText(/42/)).toBeInTheDocument()
    expect(screen.getByText(/17/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })

  it('returns null when stats is null', () => {
    const { container } = render(
      <PublishedStatsComponent stats={null} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('returns null when stats is undefined', () => {
    const { container } = render(<PublishedStatsComponent stats={undefined} />)
    expect(container.firstChild).toBeNull()
  })
})
