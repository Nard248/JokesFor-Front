import { fromDTO, toPatchBody } from './api'
import type { ContentDraftDTO } from './types'

const baseDTO: ContentDraftDTO = {
  id: 10,
  format: 'setup',
  status: 'draft',
  text: 'some text',
  setup: 'the setup',
  punchline: 'the punchline',
  lines: null,
  tones: ['wholesome'],
  categories: undefined,
  context_tags: ['work'],
  themes: undefined,
  culture_tags: ['universal'],
  age_rating: 'family',
  language: 'en',
  source: 'original',
  last_edited_at: '2026-05-20T10:00:00Z',
  created_at: '2026-05-20T09:55:00Z',
  likes: null,
  rejection_reason: '',
  stats: null,
}

describe('fromDTO', () => {
  test('prefers themes over context_tags when both present', () => {
    const dto: ContentDraftDTO = { ...baseDTO, context_tags: ['work'], themes: ['family', 'tech'] }
    const draft = fromDTO(dto)
    expect(draft.themes).toEqual(['family', 'tech'])
  })

  test('falls back to context_tags when themes is absent', () => {
    const dto: ContentDraftDTO = { ...baseDTO, context_tags: ['work'], themes: undefined }
    const draft = fromDTO(dto)
    expect(draft.themes).toEqual(['work'])
  })

  test('prefers categories over tones when both present', () => {
    const dto: ContentDraftDTO = { ...baseDTO, tones: ['dad'], categories: ['wholesome', 'nerd'] }
    const draft = fromDTO(dto)
    expect(draft.categories).toEqual(['wholesome', 'nerd'])
  })

  test('falls back to tones when categories is absent', () => {
    const dto: ContentDraftDTO = { ...baseDTO, tones: ['dad'], categories: undefined }
    const draft = fromDTO(dto)
    expect(draft.categories).toEqual(['dad'])
  })

  test('null lines stays null', () => {
    const draft = fromDTO({ ...baseDTO, lines: null })
    expect(draft.lines).toBeNull()
  })

  test('defaults language to en when absent', () => {
    const dto: ContentDraftDTO = { ...baseDTO, language: undefined }
    const draft = fromDTO(dto)
    expect(draft.language).toBe('en')
  })

  test('defaults source to original when absent', () => {
    const dto: ContentDraftDTO = { ...baseDTO, source: undefined }
    const draft = fromDTO(dto)
    expect(draft.source).toBe('original')
  })

  test('maps culture_tags to cultures', () => {
    const dto: ContentDraftDTO = { ...baseDTO, culture_tags: ['en-us', 'universal'] }
    const draft = fromDTO(dto)
    expect(draft.cultures).toEqual(['en-us', 'universal'])
  })

  test('maps stats correctly', () => {
    const dto: ContentDraftDTO = { ...baseDTO, stats: { saves: 5, reactions: 10, reports: 0 } }
    const draft = fromDTO(dto)
    expect(draft.stats).toEqual({ saves: 5, reactions: 10, reports: 0 })
  })
})

describe('toPatchBody', () => {
  test('maps themes to context_tags (snake_case)', () => {
    const body = toPatchBody({ themes: ['family', 'work'] } as Parameters<typeof toPatchBody>[0])
    expect(body.context_tags).toEqual(['family', 'work'])
    expect((body as Record<string, unknown>).themes).toBeUndefined()
  })

  test('maps categories to tones (snake_case)', () => {
    const body = toPatchBody({ categories: ['wholesome'] } as Parameters<typeof toPatchBody>[0])
    expect(body.tones).toEqual(['wholesome'])
    expect((body as Record<string, unknown>).categories).toBeUndefined()
  })

  test('maps cultures to culture_tags', () => {
    const body = toPatchBody({ cultures: ['universal'] } as Parameters<typeof toPatchBody>[0])
    expect(body.culture_tags).toEqual(['universal'])
  })

  test('maps ageRating to age_rating', () => {
    const body = toPatchBody({ ageRating: 'family' } as Parameters<typeof toPatchBody>[0])
    expect(body.age_rating).toBe('family')
  })

  test('omits undefined fields', () => {
    const body = toPatchBody({ text: 'hello' } as Parameters<typeof toPatchBody>[0])
    expect(Object.keys(body)).toEqual(['text'])
  })

  test('maps text, setup, punchline, lines, format directly', () => {
    const body = toPatchBody({
      text: 'hi',
      setup: 's',
      punchline: 'p',
      lines: ['a', 'b'],
      format: 'knock',
    } as Parameters<typeof toPatchBody>[0])
    expect(body.text).toBe('hi')
    expect(body.setup).toBe('s')
    expect(body.punchline).toBe('p')
    expect(body.lines).toEqual(['a', 'b'])
    expect(body.format).toBe('knock')
  })

  test('toPatchBody passes through explicit lines:null (knock clear)', () => {
    const body = toPatchBody({ lines: null } as Parameters<typeof toPatchBody>[0])
    expect('lines' in body).toBe(true)
    expect(body.lines).toBeNull()
  })
})
