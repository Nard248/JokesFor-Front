import { SITE_NAME, SITE_URL } from './constants'
import type { CreatorProfile, Joke } from '@/lib/api'

/** Site-wide WebSite + Organization JSON-LD — used once, on the marketing landing page. */
export function siteJsonLd(): object[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/Logos/appicon_purple.svg`,
    },
  ]
}

/**
 * CreativeWork JSON-LD for a single joke. `/jokes/{id}/` doesn't expose the
 * submitting creator's identity (see jokes/serializers.py JokeSerializer), so
 * `author` names the platform rather than an unverifiable individual.
 */
export function jokeJsonLd(joke: Joke): object {
  const text =
    joke.setup && joke.punchline ? `${joke.setup} ${joke.punchline}` : (joke.text || joke.setup || undefined)

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    url: `${SITE_URL}/jokes/${joke.id}`,
    text,
    image: joke.share_image_url || undefined,
    datePublished: joke.created_at,
    inLanguage: joke.language?.code,
    genre: joke.format?.name,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
  }
}

/** ProfilePage/Person JSON-LD for a public creator profile. */
export function creatorJsonLd(profile: CreatorProfile): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.display_name,
      alternateName: profile.handle,
      url: `${SITE_URL}/creators/${profile.id}`,
      image: profile.avatar_url || undefined,
    },
  }
}
