import { mockContentApi, mockFormats } from './mock'

test('mockFormats returns 7 formats', async () => {
  const formats = await mockFormats()
  expect(formats).toHaveLength(7)
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
