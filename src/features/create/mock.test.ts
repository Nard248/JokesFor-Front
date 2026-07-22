import { mockContentApi, mockFormats } from './mock'

test('mockFormats returns 9 formats', async () => {
  const formats = await mockFormats()
  expect(formats).toHaveLength(9)
})

test('mockFormats video and audio require setup+media, cap at 1 attachment, max 60s', async () => {
  const formats = await mockFormats()
  for (const slug of ['video', 'audio'] as const) {
    const rule = formats.find((f) => f.slug === slug)
    expect(rule).toBeDefined()
    expect(rule!.required_fields).toEqual(expect.arrayContaining(['setup', 'media']))
    expect(rule!.constraints.max_media).toBe(1)
    expect(rule!.constraints.max_duration_ms).toBe(60000)
  }
})

test('mockFormats knock has min_lines=4 max_lines=8', async () => {
  const formats = await mockFormats()
  const knock = formats.find((f) => f.slug === 'knock')
  expect(knock).toBeDefined()
  expect(knock!.constraints.min_lines).toBe(4)
  expect(knock!.constraints.max_lines).toBe(8)
  expect(knock!.constraints.max_line_chars).toBe(200)
})

test('mockFormats story has min_text_words=30', async () => {
  const formats = await mockFormats()
  const story = formats.find((f) => f.slug === 'story')
  expect(story).toBeDefined()
  expect(story!.constraints.min_text_words).toBe(30)
})

test('createDraft returns draft status with given format', async () => {
  const draft = await mockContentApi.createDraft({ format: 'oneliner' })
  expect(draft.status).toBe('draft')
  expect(draft.format).toBe('oneliner')
})

test('patchDraft merges fields', async () => {
  const created = await mockContentApi.createDraft({ format: 'setup' })
  const patched = await mockContentApi.patchDraft(created.id, { text: 'hello world' })
  expect(patched.text).toBe('hello world')
  expect(patched.format).toBe('setup')
})

test('submitDraft flips status to pending', async () => {
  const created = await mockContentApi.createDraft({ format: 'anti' })
  const submitted = await mockContentApi.submitDraft(created.id)
  expect(submitted.status).toBe('pending')
})

test('listDrafts returns seeded rows', async () => {
  const result = await mockContentApi.listDrafts()
  expect(result.results.length).toBeGreaterThanOrEqual(3)
})

test('seeded drafts include one published with stats and one rejected with rejection_reason', async () => {
  const result = await mockContentApi.listDrafts()
  const published = result.results.find((d) => d.status === 'published')
  const rejected = result.results.find((d) => d.status === 'rejected')
  expect(published).toBeDefined()
  expect(published!.stats).toBeDefined()
  expect(rejected).toBeDefined()
  expect(rejected!.rejection_reason).toBeTruthy()
})

describe('mockContentApi.uploadMedia — kind-aware DTO', () => {
  test('defaults to kind "image" with dims, no poster, no duration', async () => {
    const file = new File(['x'], 'pic.png', { type: 'image/png' })
    const asset = await mockContentApi.uploadMedia(file)
    expect(asset.kind).toBe('image')
    expect(asset.url).toBeTruthy()
    expect(asset.poster_url).toBeNull()
    expect(asset.width).toBe(800)
    expect(asset.height).toBe(600)
    expect(asset.duration_ms).toBeNull()
    expect(asset.is_gif).toBe(false)
  })

  test('kind "video" returns a poster and a 5000ms duration', async () => {
    const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
    const asset = await mockContentApi.uploadMedia(file, 'video')
    expect(asset.kind).toBe('video')
    expect(asset.url).toBeTruthy()
    expect(asset.poster_url).toBeTruthy()
    expect(asset.duration_ms).toBe(5000)
    expect(asset.is_gif).toBe(false)
  })

  test('kind "video" with a .gif filename sets is_gif true', async () => {
    const file = new File(['x'], 'reaction.gif', { type: 'image/gif' })
    const asset = await mockContentApi.uploadMedia(file, 'video')
    expect(asset.kind).toBe('video')
    expect(asset.is_gif).toBe(true)
  })

  test('kind "audio" returns a 5000ms duration and no poster or dims', async () => {
    const file = new File(['x'], 'voicemail.mp3', { type: 'audio/mpeg' })
    const asset = await mockContentApi.uploadMedia(file, 'audio')
    expect(asset.kind).toBe('audio')
    expect(asset.url).toBeTruthy()
    expect(asset.poster_url).toBeNull()
    expect(asset.width).toBeNull()
    expect(asset.height).toBeNull()
    expect(asset.duration_ms).toBe(5000)
  })
})
