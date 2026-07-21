import { describe, it, expect } from 'vitest'
import { editorReducer, emptyEditorDraft, toJokePayload } from './editor-state'
import { toPatchBody, fromDTO } from './api'
import { validate } from './validation'
import type { ContentDraftDTO, FormatRule } from './types'
import type { MediaAssetDTO } from './types'

const asset: MediaAssetDTO = {
  id: 'aaaa-bbbb', kind: 'image', url: 'http://x/a.webp', poster_url: null,
  width: 800, height: 600, duration_ms: null, is_gif: false,
}

const imageRule: FormatRule = {
  id: 9, slug: 'image', name: 'Image', description: '',
  required_fields: ['setup', 'media'], forbidden_fields: ['punchline', 'lines'],
  constraints: { min_media: 1, max_media: 6 },
}

describe('media in editor state', () => {
  it('setMedia stores assets and changeFormat across groups clears them', () => {
    let draft = emptyEditorDraft('image')
    draft = editorReducer(draft, { type: 'setMedia', media: [asset] })
    expect(draft.media).toHaveLength(1)
    draft = editorReducer(draft, { type: 'changeFormat', format: 'oneliner' })
    expect(draft.media).toHaveLength(0)
  })

  it('toJokePayload carries media for the preview/validator', () => {
    let draft = emptyEditorDraft('image')
    draft = editorReducer(draft, { type: 'setMedia', media: [asset] })
    expect(toJokePayload(draft).media).toHaveLength(1)
  })
})

describe('media in API mapping', () => {
  it('toPatchBody maps media to media_asset_ids', () => {
    expect(toPatchBody({ media: [asset] }).media_asset_ids).toEqual(['aaaa-bbbb'])
  })

  it('fromDTO hydrates media from the draft DTO', () => {
    const dto = {
      id: 5, text: 'c', setup: 'c', punchline: '', lines: null, format: 'image',
      status: 'draft', tones: [], context_tags: [], culture_tags: [],
      age_rating: null, last_edited_at: 'now', created_at: 'now', likes: null,
      media: [asset],
    } as unknown as ContentDraftDTO
    expect(fromDTO(dto).media).toHaveLength(1)
  })
})

describe('media validation', () => {
  it('image format requires at least one attachment', () => {
    const payload = toJokePayload(emptyEditorDraft('image'))
    payload.setup = 'caption'
    expect(validate(payload, imageRule)).toHaveProperty('media')
  })

  it('image format caps at max_media', () => {
    let draft = emptyEditorDraft('image')
    draft = editorReducer(draft, { type: 'setMedia', media: Array(7).fill(asset) })
    const payload = toJokePayload(draft)
    payload.setup = 'caption'
    expect(validate(payload, imageRule)).toHaveProperty('media')
  })
})
