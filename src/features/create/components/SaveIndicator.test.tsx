import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SaveIndicator } from './SaveIndicator'

describe('SaveIndicator', () => {
  it('renders "Saving…" when saveState is saving', () => {
    render(
      <SaveIndicator saveState="saving" lastSavedAt={null} onRetry={vi.fn()} />
    )
    expect(screen.getByText(/saving/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders "Saved" with relative time when saveState is saved', () => {
    render(
      <SaveIndicator saveState="saved" lastSavedAt={Date.now()} onRetry={vi.fn()} />
    )
    // Text starts with "Saved" followed by relative time (e.g. "Saved just now")
    expect(screen.getByText(/^saved/i)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders "Saved" with relative time for idle when lastSavedAt is set', () => {
    render(
      <SaveIndicator saveState="idle" lastSavedAt={Date.now()} onRetry={vi.fn()} />
    )
    expect(screen.getByText(/^saved/i)).toBeInTheDocument()
  })

  it('renders "…" (ellipsis) when saveState is debouncing', () => {
    render(
      <SaveIndicator saveState="debouncing" lastSavedAt={null} onRetry={vi.fn()} />
    )
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('renders error message and a retry button when saveState is error', () => {
    const onRetry = vi.fn()
    render(
      <SaveIndicator saveState="error" lastSavedAt={null} onRetry={onRetry} />
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(
      <SaveIndicator saveState="error" lastSavedAt={null} onRetry={onRetry} />
    )
    await user.click(screen.getByRole('button'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('has aria-live="polite" on the container', () => {
    const { container } = render(
      <SaveIndicator saveState="idle" lastSavedAt={null} onRetry={vi.fn()} />
    )
    const el = container.firstElementChild
    expect(el).toHaveAttribute('aria-live', 'polite')
  })

  it('renders nothing meaningful for idle without lastSavedAt', () => {
    const { container } = render(
      <SaveIndicator saveState="idle" lastSavedAt={null} onRetry={vi.fn()} />
    )
    // No button, no save/error text
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/saving/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/saved/i)).not.toBeInTheDocument()
    // The element still exists for aria-live
    expect(container.firstElementChild).toBeInTheDocument()
  })
})
