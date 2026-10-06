import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

const vibe = (slug: string) => ({ slug, label: slug, subtitle: '', icon: '*', swatch_bg: '#000', swatch_fg: '#fff' })
const catalog = ['dad', 'nerd', 'dark', 'surreal'].map(vibe)
let myVibes: { vibe: { slug: string } }[] | undefined
const mutateVibes = vi.fn()

vi.mock('@/features/vibes', () => ({
  useVibesCatalog: () => ({ data: catalog }),
  useMyVibes: () => ({ data: myVibes }),
  useUpdateMyVibes: () => ({ mutate: mutateVibes, isPending: false }),
}))
vi.mock('@/features/preferences', () => ({ useUpdatePreferences: () => ({ mutate: vi.fn(), isPending: false }) }))

import { FlowPage } from './FlowPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <FlowPage />
    </MemoryRouter>,
  )
}

const pressed = (name: string) => screen.getByRole('button', { name: new RegExp(`^\\*\\s*${name}`) }).getAttribute('aria-pressed')

beforeEach(() => {
  vi.clearAllMocks()
  myVibes = undefined
})

describe('FlowPage — vibes step', () => {
  it('pre-selects the saved vibes (resume) and submits them unchanged', () => {
    myVibes = [{ vibe: { slug: 'dad' } }, { vibe: { slug: 'nerd' } }, { vibe: { slug: 'dark' } }]
    renderPage()
    expect(pressed('dad')).toBe('true')
    expect(pressed('surreal')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(mutateVibes).toHaveBeenCalledWith(['dad', 'nerd', 'dark'], expect.anything())
  })

  it('applies toggles on top of the saved selection', () => {
    myVibes = [{ vibe: { slug: 'dad' } }, { vibe: { slug: 'nerd' } }, { vibe: { slug: 'dark' } }]
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /^\*\s*dad/ }))
    fireEvent.click(screen.getByRole('button', { name: /^\*\s*surreal/ }))
    expect(pressed('dad')).toBe('false')
    expect(pressed('surreal')).toBe('true')
  })

  it('starts empty for a first-time reader', () => {
    renderPage()
    expect(pressed('dad')).toBe('false')
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled()
  })
})
