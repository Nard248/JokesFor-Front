import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JokeProvenanceBadges } from './JokeProvenanceBadges'
import { AI_GENERATED_DESCRIPTION, jokeProvenance } from '@/lib/jokeProvenance'

describe('JokeProvenanceBadges', () => {
  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<JokeProvenanceBadges provenance={jokeProvenance({ language: 'en' })} />)
    expect(container).toBeEmptyDOMElement()
    const { container: c2 } = render(<JokeProvenanceBadges provenance={undefined} />)
    expect(c2).toBeEmptyDOMElement()
  })

  it('shows the native language name with its own lang attribute inside English chrome', () => {
    render(<JokeProvenanceBadges provenance={jokeProvenance({ language: { code: 'hy', name: 'Armenian', native_name: 'Հայերեն' } })} />)
    expect(screen.getByTestId('joke-provenance')).toHaveAttribute('lang', 'en')
    const badge = screen.getByTestId('joke-language-badge')
    expect(badge).toHaveAttribute('title', 'Written in Armenian')
    expect(screen.getByText('Հայերեն')).toHaveAttribute('lang', 'hy')
    expect(badge).toHaveTextContent('Language: Հայերեն')
  })

  it('shows the origin flag (decorative) and the country name', () => {
    render(<JokeProvenanceBadges provenance={jokeProvenance({ origin_country: { code: 'ES', name: 'Spain', native_name: 'España' } })} />)
    const badge = screen.getByTestId('joke-origin-badge')
    expect(badge).toHaveTextContent('Spain')
    expect(badge).toHaveAttribute('title', 'From Spain')
    expect(screen.getByText('\u{1F1EA}\u{1F1F8}')).toHaveAttribute('aria-hidden', 'true')
  })

  it('labels AI-screened jokes with a tooltip and an accessible description', () => {
    render(<JokeProvenanceBadges provenance={jokeProvenance({ editorial_status: 'ai_screened' })} />)
    const badge = screen.getByTestId('joke-ai-badge')
    expect(badge).toHaveTextContent('AI-generated')
    expect(badge).toHaveAttribute('title', AI_GENERATED_DESCRIPTION)
    expect(AI_GENERATED_DESCRIPTION).toBe('Written with AI and screened; not yet reviewed by a native speaker')
    expect(badge).toHaveTextContent(AI_GENERATED_DESCRIPTION)
  })

  it('renders all three together', () => {
    render(
      <JokeProvenanceBadges
        provenance={jokeProvenance({
          language: { code: 'es', name: 'Spanish', native_name: 'Español' },
          origin_country: { code: 'MX', name: 'Mexico', native_name: 'México' },
          editorial_status: 'ai_screened',
        })}
      />,
    )
    expect(screen.getByTestId('joke-language-badge')).toBeInTheDocument()
    expect(screen.getByTestId('joke-origin-badge')).toHaveTextContent('Mexico')
    expect(screen.getByTestId('joke-ai-badge')).toBeInTheDocument()
  })
})
