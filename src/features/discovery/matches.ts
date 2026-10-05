import type { Joke } from '@/lib/api'
import type { ContentSelection } from './selection'

/** The preview transport observes the same strict intersection as the API. */
export function matchesContentSelection(joke: Joke, selection?: Partial<ContentSelection>): boolean {
  if (!selection) return true
  if (selection.language && joke.language.code !== selection.language) return false
  if (selection.country && !joke.countries?.some((country) => country.code === selection.country)) return false
  if (selection.culture_tags && !joke.culture_tags.some((culture) => selection.culture_tags?.split(',').includes(culture.slug))) return false
  return true
}
