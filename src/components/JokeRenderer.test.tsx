import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { JokeRenderer, formatSlugToFlow, FLOW_FORMAT_TO_BACKEND_SLUG, type JokePayload } from './JokeRenderer'

const base: JokePayload = { format: 'oneliner', text: '', setup: '', punchline: '', lines: null, media: null }

test('oneliner renders its text', () => {
  render(<JokeRenderer payload={{ ...base, format: 'oneliner', text: 'I put down a book on anti-gravity.' }} />)
  expect(screen.getByText(/anti-gravity/)).toBeInTheDocument()
})

test('setup is revealed (no blur gate) when revealed=true', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'setup', setup: 'Why did the scarecrow win?', punchline: 'Outstanding in his field.' }}
      revealed
    />,
  )
  expect(screen.getByText('Outstanding in his field.')).toBeInTheDocument()
  expect(screen.queryByText(/tap to reveal/i)).not.toBeInTheDocument()
})

test('knock renders all lines when interactive=false', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'knock', lines: ['Knock, knock.', "Who's there?", 'Olive.', 'Olive who?'] }}
      revealed
      interactive={false}
    />,
  )
  expect(screen.getByText('Olive who?')).toBeInTheDocument()
})

test('anti renders the auto footer', () => {
  render(
    <JokeRenderer
      payload={{ ...base, format: 'anti', setup: 'Why did the chicken cross the road?', punchline: 'To get to the other side.' }}
      revealed
    />,
  )
  expect(screen.getByText(/That's it\. That's the joke\./i)).toBeInTheDocument()
})

describe('FLOW_FORMAT_TO_BACKEND_SLUG — real DB slugs', () => {
  it('maps each flow format 1:1 onto the real backend joke_format slug', () => {
    expect(FLOW_FORMAT_TO_BACKEND_SLUG).toEqual({
      setup: 'setup',
      oneliner: 'oneliner',
      observ: 'observ',
      anti: 'anti',
      knock: 'knock',
      story: 'story',
      image: 'image',
      video: 'video',
      audio: 'audio',
    })
  })
})

describe('formatSlugToFlow — saved/favorite joke skin resolution', () => {
  it('resolves the REAL DB slugs to the right skin (setup stays setup, not oneliner)', () => {
    // Regression: a saved setup-punchline (real slug `setup`) used to fall
    // through to the oneliner skin because the local mapper only knew
    // `setup_punchline`.
    expect(formatSlugToFlow('setup')).toBe('setup')
    expect(formatSlugToFlow('oneliner')).toBe('oneliner')
    expect(formatSlugToFlow('observ')).toBe('observ')
    expect(formatSlugToFlow('anti')).toBe('anti')
    expect(formatSlugToFlow('knock')).toBe('knock')
    expect(formatSlugToFlow('story')).toBe('story')
    expect(formatSlugToFlow('short-story')).toBe('story')
  })

  it('still tolerates the legacy long-form slugs', () => {
    expect(formatSlugToFlow('setup_punchline')).toBe('setup')
    expect(formatSlugToFlow('one_liner')).toBe('oneliner')
    expect(formatSlugToFlow('observational')).toBe('observ')
    expect(formatSlugToFlow('knock_knock')).toBe('knock')
  })

  it('returns null for unknown/empty slugs instead of garbling into oneliner (unknown-format guard)', () => {
    expect(formatSlugToFlow('')).toBeNull()
    expect(formatSlugToFlow(undefined)).toBeNull()
    expect(formatSlugToFlow('who-knows')).toBeNull()
  })
})
