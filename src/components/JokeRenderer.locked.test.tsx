import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JokeRenderer, type JokePayload } from './JokeRenderer'

const setupPayload: JokePayload = {
  format: 'setup',
  text: '',
  setup: 'Why did the scarecrow win an award?',
  punchline: 'He was outstanding in his field.',
  lines: null,
}

describe('JokeRenderer — locked payoff (paywall)', () => {
  it('renders the "Unlock with Supporter" CTA and NOT the reveal affordance', () => {
    render(<JokeRenderer payload={setupPayload} locked onUnlock={vi.fn()} onReveal={vi.fn()} />)
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
    expect(screen.getByText(/unlock with supporter/i)).toBeInTheDocument()
    // The free teaser (setup) stays visible.
    expect(screen.getByText('Why did the scarecrow win an award?')).toBeInTheDocument()
    // The reveal affordance is gone and the real punchline is never rendered.
    expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
    expect(screen.queryByText('He was outstanding in his field.')).not.toBeInTheDocument()
  })

  it('does NOT fire onReveal for a locked card, even when the body is clicked', () => {
    const onReveal = vi.fn()
    const onUnlock = vi.fn()
    render(<JokeRenderer payload={setupPayload} locked onReveal={onReveal} onUnlock={onUnlock} />)
    fireEvent.click(screen.getByText('Why did the scarecrow win an award?'))
    fireEvent.click(screen.getByTestId('unlock-supporter-cta'))
    expect(onReveal).not.toHaveBeenCalled()
    expect(onUnlock).toHaveBeenCalledTimes(1)
  })

  it('locks a text-only format (one-liner) with the CTA and no cleartext', () => {
    render(
      <JokeRenderer
        payload={{ format: 'oneliner', text: '', setup: 'A teaser', punchline: '', lines: null }}
        locked
        onUnlock={vi.fn()}
      />,
    )
    expect(screen.getByTestId('unlock-supporter-cta')).toBeInTheDocument()
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
