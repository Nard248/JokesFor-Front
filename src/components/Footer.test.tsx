import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Footer } from './Footer'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer links', () => {
  it('has a Privacy link pointing to /privacy', () => {
    renderFooter()
    const allLinks = screen.getAllByRole('link')
    const privacyLink = allLinks.find(
      (l) => l.getAttribute('href') === '/privacy',
    )
    expect(privacyLink).toBeDefined()
    expect(privacyLink).toHaveAttribute('href', '/privacy')
  })

  it('has a Terms link pointing to /terms', () => {
    renderFooter()
    const link = screen.getByRole('link', { name: /terms/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/terms')
  })

  it('has a Cookie Policy link pointing to /cookie-policy', () => {
    renderFooter()
    const link = screen.getByRole('link', { name: /cookie policy/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/cookie-policy')
  })

  it("has a Children's Privacy link pointing to /childrens-privacy", () => {
    renderFooter()
    const link = screen.getByRole('link', { name: /children/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/childrens-privacy')
  })

  it('does NOT have a link pointing to the dead /about route', () => {
    renderFooter()
    const allLinks = screen.getAllByRole('link')
    const aboutLink = allLinks.find((l) => l.getAttribute('href') === '/about')
    expect(aboutLink).toBeUndefined()
  })
})
