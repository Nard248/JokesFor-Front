import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JokeRenderer, type JokePayload } from './JokeRenderer'

const setupPayload: JokePayload = {
  format: 'setup',
  text: '',
  setup: 'Why did the scarecrow win an award?',
  punchline: 'He was outstanding in his field.',
  lines: null,
  media: null,
}

describe('JokeRenderer — unavailable content', () => {
  it('keeps withheld content hidden without a payment CTA', () => {
    render(<JokeRenderer payload={setupPayload} locked onReveal={vi.fn()} />)
    expect(screen.getByText('This joke is unavailable.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock|subscribe/i })).toBeNull()
    // The free teaser (setup) stays visible.
    expect(screen.getByText('Why did the scarecrow win an award?')).toBeInTheDocument()
    // The reveal affordance is gone and the real punchline is never rendered.
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    expect(screen.queryByText('He was outstanding in his field.')).not.toBeInTheDocument()
  })

  it('does NOT fire onReveal for a locked card, even when the body is clicked', () => {
    const onReveal = vi.fn()
    render(<JokeRenderer payload={setupPayload} locked onReveal={onReveal} />)
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    fireEvent.click(screen.getByText('This joke is unavailable.'))
    expect(onReveal).not.toHaveBeenCalled()
  })

  it('locks a text-only format (one-liner) with the CTA and no cleartext', () => {
    render(
      <JokeRenderer
        payload={{ format: 'oneliner', text: '', setup: 'A teaser', punchline: '', lines: null, media: null }}
        locked

      />,
    )
    expect(screen.getByText('This joke is unavailable.')).toBeInTheDocument()
  })
})

describe('JokeRenderer — unlocked card still reveals', () => {
  it('shows the reveal affordance and fires onReveal on tap', () => {
    const onReveal = vi.fn()
    render(<JokeRenderer payload={setupPayload} onReveal={onReveal} />)
    expect(screen.getByText(/tap to reveal punchline/i)).toBeInTheDocument()
    // Click bubbles from the setup text to the card's reveal handler.
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    expect(onReveal).toHaveBeenCalledTimes(1)
    // Affordance disappears once revealed.
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('unlock-supporter-cta')).not.toBeInTheDocument()
  })
})
