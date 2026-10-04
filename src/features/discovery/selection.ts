export interface ContentSelection {
  language: string
  country: string
  culture_tags: string
}

/** Explicit "every language". An empty language lets the server apply the viewer's default. */
export const ALL_LANGUAGES = 'all'

export const EMPTY_SELECTION: ContentSelection = { language: '', country: '', culture_tags: '' }
export const SELECTION_KEYS = ['language', 'country', 'culture_tags'] as const

export function normalizeSelection(value: unknown): ContentSelection {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const get = (key: keyof ContentSelection) => typeof raw[key] === 'string' ? raw[key].trim() : ''
  return { language: get('language').toLowerCase(), country: get('country').toUpperCase(), culture_tags: get('culture_tags') }
}

/** Explicit URL choices describe the complete selection, including All. */
export function resolveSelection(search: string, saved: ContentSelection): ContentSelection {
  const params = new URLSearchParams(search)
  return SELECTION_KEYS.some((key) => params.has(key))
    ? normalizeSelection(Object.fromEntries(SELECTION_KEYS.map((key) => [key, params.get(key)])))
    : saved
}

export function selectionParams(selection: ContentSelection): Partial<ContentSelection> {
  return Object.fromEntries(SELECTION_KEYS.filter((key) => selection[key]).map((key) => [key, selection[key]]))
}

export function selectionKey(selection: ContentSelection): string {
  return JSON.stringify(SELECTION_KEYS.map((key) => selection[key]))
}

export function selectionUrl(search: string, selection: ContentSelection): URLSearchParams {
  const params = new URLSearchParams(search)
  for (const key of SELECTION_KEYS) params.set(key, selection[key])
  params.delete('page')
  return params
}
