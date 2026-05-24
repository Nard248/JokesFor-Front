import type { FormatSlug } from './types'
import type { JokePayload } from '@/components/JokeRenderer'

/** The user-editable view-model (ContentDraft minus server-owned fields). */
export interface EditorDraft {
  format: FormatSlug
  text: string
  setup: string
  punchline: string
  lines: string[] | null
  themes: string[]
  categories: string[]
  cultures: string[]
  ageRating: string | null
  language: string
  source: string
}

export type EditorAction =
  | { type: 'hydrate'; draft: EditorDraft }
  | { type: 'setField'; field: 'text' | 'setup' | 'punchline'; value: string }
  | { type: 'setLines'; lines: string[] }
  | { type: 'setTags'; field: 'themes' | 'categories' | 'cultures'; value: string[] }
  | { type: 'setMeta'; field: 'ageRating' | 'language' | 'source'; value: string | null }
  | { type: 'changeFormat'; format: FormatSlug }

/**
 * Format groups for changeFormat compatibility rules (product spec §7.7):
 *   text-group:    oneliner, observ, story — share `text`
 *   sp-group:      setup, anti            — share `setup` + `punchline`
 *   knock-group:   knock                  — uses `lines`
 *
 * Within the same group: keep shared fields.
 * Across groups: clear the fields that don't belong to the new group.
 */
type FormatGroup = 'text' | 'sp' | 'knock'

function groupOf(fmt: FormatSlug): FormatGroup {
  if (fmt === 'knock') return 'knock'
  if (fmt === 'setup' || fmt === 'anti') return 'sp'
  return 'text' // oneliner | observ | story
}

/**
 * Creates a blank EditorDraft for the given format.
 * - All string fields are ''.
 * - tags/arrays are [].
 * - ageRating is null.
 * - language defaults to 'en', source to 'original'.
 * - lines: [] for knock, null for everything else.
 */
export function emptyEditorDraft(format: FormatSlug): EditorDraft {
  return {
    format,
    text: '',
    setup: '',
    punchline: '',
    lines: format === 'knock' ? [] : null,
    themes: [],
    categories: [],
    cultures: [],
    ageRating: null,
    language: 'en',
    source: 'original',
  }
}

/**
 * Extracts the 5 render-relevant fields from an EditorDraft into a JokePayload.
 */
export function toJokePayload(d: EditorDraft): JokePayload {
  return {
    format: d.format,
    text: d.text,
    setup: d.setup,
    punchline: d.punchline,
    lines: d.lines,
  }
}

/**
 * Pure reducer for editor state.
 */
export function editorReducer(state: EditorDraft, action: EditorAction): EditorDraft {
  switch (action.type) {
    case 'hydrate':
      return { ...action.draft }

    case 'setField':
      return { ...state, [action.field]: action.value }

    case 'setLines':
      return { ...state, lines: action.lines }

    case 'setTags':
      return { ...state, [action.field]: action.value }

    case 'setMeta':
      return { ...state, [action.field]: action.value }

    case 'changeFormat': {
      const newFmt = action.format
      const oldGroup = groupOf(state.format)
      const newGroup = groupOf(newFmt)

      if (oldGroup === newGroup) {
        // Same group: just update format, keep all content fields intact
        return { ...state, format: newFmt }
      }

      // Crossing groups — build new content fields by keeping only what's shared
      const newState: EditorDraft = {
        ...state,
        format: newFmt,
        // Reset all content-bearing fields first
        text: '',
        setup: '',
        punchline: '',
        lines: null,
      }

      if (newGroup === 'knock') {
        // Moving TO knock: start fresh with empty lines array
        newState.lines = []
      } else if (newGroup === 'text') {
        // Moving TO text-group: keep `text` if coming from text-group (covered above),
        // or start fresh. `lines` stays null (already set).
        // If old group was 'text' we'd have returned early above, so here oldGroup is 'sp' or 'knock'
        // — text was empty/irrelevant in those formats anyway, so '' is correct.
        newState.lines = null
      } else if (newGroup === 'sp') {
        // Moving TO sp-group: keep setup/punchline if coming from sp (covered above).
        // Otherwise (from text or knock): start fresh.
        newState.lines = null
      }

      return newState
    }

    default:
      return state
  }
}
