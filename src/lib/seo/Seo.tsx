import { Helmet } from 'react-helmet-async'
import { DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from './constants'
import { toSafeJsonLdString } from './utils'

export interface SeoProps {
  /** Full <title> text — callers compose the whole string (incl. "· JokesFor" suffix). */
  title: string
  description?: string
  /** Site-relative path (e.g. "/jokes/42") — resolved to an absolute canonical/og:url. */
  canonicalPath: string
  /** Absolute or site-relative image URL. Defaults to the site's default OG image. */
  image?: string
  type?: 'website' | 'article' | 'profile'
  /**
   * One or more JSON-LD objects (schema.org). Each is serialized via
   * JSON.stringify into its own <script type="application/ld+json"> — never
   * string-interpolated, so user-generated content can't break out of the tag.
   */
  jsonLd?: object | object[]
}

/**
 * Seo — small reusable wrapper over react-helmet-async. Renders <title>,
 * meta description, canonical link, Open Graph, Twitter card, and optional
 * JSON-LD structured data for a single route.
 */
export function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  jsonLd,
}: SeoProps) {
  const url = `${SITE_URL}${canonicalPath}`
  const absoluteImage = image.startsWith('http') ? image : `${SITE_URL}${image}`
  const jsonLdBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {jsonLdBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {toSafeJsonLdString(block)}
        </script>
      ))}
    </Helmet>
  )
}
