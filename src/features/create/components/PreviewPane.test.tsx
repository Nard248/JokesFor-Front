import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PreviewPane } from './PreviewPane'
import type { JokePayload } from '@/features/create'

describe('PreviewPane', () => {
  it('renders the "How readers will see it" header', () => {
    const payload: JokePayload = {
      format: 'oneliner',
      text: 'A funny joke text.',
      setup: '',
      punchline: '',
      lines: null,
      media: null,
    }
    render(<PreviewPane payload={payload} />)
    expect(screen.getByText(/how readers will see it/i)).toBeInTheDocument()
  })

  it('renders oneliner text content via JokeRenderer', () => {
    const payload: JokePayload = {
      format: 'oneliner',
      text: 'My unique test joke text here.',
      setup: '',
      punchline: '',
      lines: null,
      media: null,
    }
    render(<PreviewPane payload={payload} />)
    expect(screen.getByText('My unique test joke text here.')).toBeInTheDocument()
  })

  it('renders setup and punchline text for setup format', () => {
    const payload: JokePayload = {
      format: 'setup',
      text: '',
      setup: 'Why did the chicken?',
      punchline: 'Because it could.',
      lines: null,
      media: null,
    }
    render(<PreviewPane payload={payload} />)
    expect(screen.getByText('Why did the chicken?')).toBeInTheDocument()
    expect(screen.getByText('Because it could.')).toBeInTheDocument()
  })
})
