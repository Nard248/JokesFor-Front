import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { Seo, type SeoProps } from './Seo'

afterEach(() => {
  cleanup()
  document.title = ''
  document.head.querySelectorAll('meta, link[rel="canonical"], script[type="application/ld+json"]').forEach((el) => el.remove())
})

function renderSeo(props: Partial<SeoProps> = {}) {
  return render(
    <HelmetProvider>
      <Seo title="Test Title" description="Test description" canonicalPath="/test" {...props} />
    </HelmetProvider>,
  )
}

describe('Seo', () => {
  it('renders the document title', () => {
    renderSeo()
    expect(document.title).toBe('Test Title')
  })

  it('renders the meta description', () => {
    renderSeo()
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Test description',
    )
  })

  it('renders an absolute canonical link resolved from canonicalPath', () => {
    renderSeo({ canonicalPath: '/jokes/42' })
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://jokesforfront.web.app/jokes/42',
    )
  })

  it('renders Open Graph tags with the JokesFor site name and website default type', () => {
    renderSeo()
    expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe(
      'JokesFor',
    )
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('website')
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('Test Title')
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute('content')).toBe(
      'Test description',
    )
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://jokesforfront.web.app/test',
    )
  })

  it('honors an explicit og:type', () => {
    renderSeo({ type: 'profile' })
    expect(document.querySelector('meta[property="og:type"]')?.getAttribute('content')).toBe('profile')
  })

  it('renders a Twitter summary_large_image card mirroring title/description', () => {
    renderSeo()
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    )
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe('Test Title')
    expect(document.querySelector('meta[name="twitter:description"]')?.getAttribute('content')).toBe(
      'Test description',
    )
  })

  it('falls back to the default OG image when none is given', () => {
    renderSeo()
    const image = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
    expect(image).toMatch(/^https:\/\/jokesforfront\.web\.app\//)
  })

  it('resolves a site-relative image against the site origin', () => {
    renderSeo({ image: '/custom-card.png' })
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://jokesforfront.web.app/custom-card.png',
    )
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute('content')).toBe(
      'https://jokesforfront.web.app/custom-card.png',
    )
  })

  it('passes through an already-absolute image unchanged', () => {
    renderSeo({ image: 'https://cdn.example.com/card.jpg' })
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://cdn.example.com/card.jpg',
    )
  })

  it('renders no JSON-LD script when jsonLd is omitted', () => {
    renderSeo()
    expect(document.querySelector('script[type="application/ld+json"]')).toBeNull()
  })

  it('renders a single JSON-LD object as one script tag', () => {
    renderSeo({ jsonLd: { '@context': 'https://schema.org', '@type': 'Thing', name: 'A joke' } })
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(1)
    expect(JSON.parse(scripts[0].textContent ?? '')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Thing',
      name: 'A joke',
    })
  })

  it('renders an array of JSON-LD objects as separate script tags', () => {
    renderSeo({
      jsonLd: [
        { '@type': 'WebSite', name: 'JokesFor' },
        { '@type': 'Organization', name: 'JokesFor' },
      ],
    })
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts.length).toBe(2)
  })

  it('escapes "</script>" inside JSON-LD content so it cannot break out of the tag', () => {
    const malicious = '</script><script>alert(1)</script>'
    renderSeo({ jsonLd: { '@type': 'Thing', name: malicious } })
    const script = document.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    // The raw closing sequence must never appear verbatim in the serialized text.
    expect(script!.textContent).not.toContain('</script>')
    // But it round-trips back to the original value through JSON.parse.
    expect(JSON.parse(script!.textContent ?? '').name).toBe(malicious)
  })
})
