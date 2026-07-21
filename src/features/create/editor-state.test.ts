import { describe, it, expect } from 'vitest'
import {
  emptyEditorDraft,
  editorReducer,
  toJokePayload,
} from './editor-state'
import type { EditorDraft } from './editor-state'

// ── emptyEditorDraft ──────────────────────────────────────────────────────────

describe('emptyEditorDraft', () => {
  it('returns correct defaults for oneliner', () => {
    const d = emptyEditorDraft('oneliner')
    expect(d.format).toBe('oneliner')
    expect(d.text).toBe('')
    expect(d.setup).toBe('')
    expect(d.punchline).toBe('')
    expect(d.lines).toBeNull()
    expect(d.themes).toEqual([])
    expect(d.categories).toEqual([])
    expect(d.cultures).toEqual([])
    expect(d.ageRating).toBeNull()
    expect(d.language).toBe('en')
    expect(d.source).toBe('original')
  })

  it('returns lines:[] for knock format', () => {
    const d = emptyEditorDraft('knock')
    expect(d.format).toBe('knock')
    expect(d.lines).toEqual([])
  })

  it('returns lines:null for all non-knock formats', () => {
    for (const fmt of ['setup', 'oneliner', 'story', 'anti', 'observ'] as const) {
      expect(emptyEditorDraft(fmt).lines).toBeNull()
    }
  })
})

// ── editorReducer: setField ───────────────────────────────────────────────────

describe('editorReducer setField', () => {
  it('updates text', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setField', field: 'text', value: 'hello' })
    expect(next.text).toBe('hello')
  })

  it('updates setup', () => {
    const s = emptyEditorDraft('setup')
    const next = editorReducer(s, { type: 'setField', field: 'setup', value: 'Why?' })
    expect(next.setup).toBe('Why?')
  })

  it('updates punchline', () => {
    const s = emptyEditorDraft('setup')
    const next = editorReducer(s, { type: 'setField', field: 'punchline', value: 'Because!' })
    expect(next.punchline).toBe('Because!')
  })

  it('does not mutate the original state', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setField', field: 'text', value: 'changed' })
    expect(s.text).toBe('')
    expect(next.text).toBe('changed')
  })
})

// ── editorReducer: setLines ───────────────────────────────────────────────────

describe('editorReducer setLines', () => {
  it('updates lines array', () => {
    const s = emptyEditorDraft('knock')
    const next = editorReducer(s, { type: 'setLines', lines: ['Knock knock', "Who's there?"] })
    expect(next.lines).toEqual(['Knock knock', "Who's there?"])
  })
})

// ── editorReducer: setTags ────────────────────────────────────────────────────

describe('editorReducer setTags', () => {
  it('updates themes', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setTags', field: 'themes', value: ['work', 'tech'] })
    expect(next.themes).toEqual(['work', 'tech'])
  })

  it('updates categories', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setTags', field: 'categories', value: ['wholesome'] })
    expect(next.categories).toEqual(['wholesome'])
  })

  it('updates cultures', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setTags', field: 'cultures', value: ['en-us'] })
    expect(next.cultures).toEqual(['en-us'])
  })
})

// ── editorReducer: setMeta ────────────────────────────────────────────────────

describe('editorReducer setMeta', () => {
  it('updates ageRating', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setMeta', field: 'ageRating', value: 'family' })
    expect(next.ageRating).toBe('family')
  })

  it('updates language', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setMeta', field: 'language', value: 'es' })
    expect(next.language).toBe('es')
  })

  it('updates source', () => {
    const s = emptyEditorDraft('oneliner')
    const next = editorReducer(s, { type: 'setMeta', field: 'source', value: 'translated' })
    expect(next.source).toBe('translated')
  })
})

// ── editorReducer: hydrate ────────────────────────────────────────────────────

describe('editorReducer hydrate', () => {
  it('replaces entire state', () => {
    const initial: EditorDraft = emptyEditorDraft('setup')
    const replacement: EditorDraft = {
      format: 'oneliner',
      text: 'funny',
      setup: '',
      punchline: '',
      lines: null,
      themes: ['work'],
      categories: [],
      cultures: [],
      ageRating: 'family',
      language: 'fr',
      source: 'original',
      media: [],
    }
    const next = editorReducer(initial, { type: 'hydrate', draft: replacement })
    expect(next).toEqual(replacement)
  })
})

// ── editorReducer: changeFormat ───────────────────────────────────────────────

describe('editorReducer changeFormat', () => {
  it('setup → anti keeps setup and punchline', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('setup'),
      setup: 'Why did the chicken?',
      punchline: 'Because.',
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'anti' })
    expect(next.format).toBe('anti')
    expect(next.setup).toBe('Why did the chicken?')
    expect(next.punchline).toBe('Because.')
    expect(next.text).toBe('')
    expect(next.lines).toBeNull()
  })

  it('anti → setup keeps setup and punchline', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('anti'),
      setup: 'Q',
      punchline: 'A',
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'setup' })
    expect(next.setup).toBe('Q')
    expect(next.punchline).toBe('A')
  })

  it('setup → oneliner clears setup and punchline, keeps text (empty)', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('setup'),
      setup: 'Why?',
      punchline: 'Because.',
      text: '',
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'oneliner' })
    expect(next.format).toBe('oneliner')
    expect(next.setup).toBe('')
    expect(next.punchline).toBe('')
    expect(next.lines).toBeNull()
  })

  it('oneliner → observ keeps text', () => {
    const s: EditorDraft = { ...emptyEditorDraft('oneliner'), text: 'Funny observation' }
    const next = editorReducer(s, { type: 'changeFormat', format: 'observ' })
    expect(next.format).toBe('observ')
    expect(next.text).toBe('Funny observation')
    expect(next.setup).toBe('')
    expect(next.punchline).toBe('')
    expect(next.lines).toBeNull()
  })

  it('observ → story keeps text', () => {
    const s: EditorDraft = { ...emptyEditorDraft('observ'), text: 'My long story' }
    const next = editorReducer(s, { type: 'changeFormat', format: 'story' })
    expect(next.format).toBe('story')
    expect(next.text).toBe('My long story')
  })

  it('→ knock sets lines:[] and clears text/setup/punchline', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('setup'),
      setup: 'Why?',
      punchline: 'Because.',
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'knock' })
    expect(next.format).toBe('knock')
    expect(next.lines).toEqual([])
    expect(next.text).toBe('')
    expect(next.setup).toBe('')
    expect(next.punchline).toBe('')
  })

  it('knock → setup sets lines:null and clears lines', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('knock'),
      lines: ['Knock knock', "Who's there?"],
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'setup' })
    expect(next.format).toBe('setup')
    expect(next.lines).toBeNull()
    expect(next.setup).toBe('')
    expect(next.punchline).toBe('')
  })

  it('knock → oneliner sets lines:null', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('knock'),
      lines: ['Knock knock'],
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'oneliner' })
    expect(next.lines).toBeNull()
  })

  it('non-shared fields (setup/punchline) are cleared when going to text-group', () => {
    const s: EditorDraft = {
      ...emptyEditorDraft('setup'),
      setup: 'S',
      punchline: 'P',
    }
    const next = editorReducer(s, { type: 'changeFormat', format: 'story' })
    expect(next.setup).toBe('')
    expect(next.punchline).toBe('')
    expect(next.lines).toBeNull()
  })
})

// ── toJokePayload ─────────────────────────────────────────────────────────────

describe('toJokePayload', () => {
  it('extracts exactly the render fields for a text-type format', () => {
    const d: EditorDraft = {
      format: 'oneliner',
      text: 'Funny',
      setup: 'ignored setup',
      punchline: 'ignored punchline',
      lines: null,
      themes: ['work'],
      categories: ['wholesome'],
      cultures: ['en-us'],
      ageRating: 'family',
      language: 'en',
      source: 'original',
      media: [],
    }
    const payload = toJokePayload(d)
    expect(payload).toEqual({
      format: 'oneliner',
      text: 'Funny',
      setup: 'ignored setup',
      punchline: 'ignored punchline',
      lines: null,
      media: null,
    })
    // Should NOT have extra fields
    expect((payload as unknown as Record<string, unknown>).themes).toBeUndefined()
    expect((payload as unknown as Record<string, unknown>).categories).toBeUndefined()
  })

  it('extracts lines for knock format', () => {
    const d: EditorDraft = {
      ...emptyEditorDraft('knock'),
      lines: ['Knock knock', "Who's there?", 'Boo', 'Boo who? Don\'t cry!'],
    }
    const payload = toJokePayload(d)
    expect(payload.lines).toEqual(['Knock knock', "Who's there?", 'Boo', 'Boo who? Don\'t cry!'])
  })

  it('has exactly 6 keys', () => {
    const d = emptyEditorDraft('setup')
    const payload = toJokePayload(d)
    expect(Object.keys(payload)).toHaveLength(6)
    expect(Object.keys(payload).sort()).toEqual(['format', 'lines', 'media', 'punchline', 'setup', 'text'])
  })
})
