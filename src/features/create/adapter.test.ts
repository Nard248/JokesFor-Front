import { contentAdapter } from './adapter'
import { resetMockStore } from './mock'

// The adapter defaults to the mock path (VITE_USE_REAL_CREATE is not 'true' in tests)

test('createDraft resolves a ContentDraft with status "draft" and correct format', async () => {
  const draft = await contentAdapter.createDraft('knock')
  expect(draft.status).toBe('draft')
  expect(draft.format).toBe('knock')
  expect(typeof draft.id).toBe('number')
  // ContentDraft-specific camelCase fields
  expect(draft).toHaveProperty('themes')
  expect(draft).toHaveProperty('categories')
  expect(draft).toHaveProperty('ageRating')
  expect(draft).toHaveProperty('lastEditedAt')
})

test('listDrafts returns an array of ContentDraft', async () => {
  const drafts = await contentAdapter.listDrafts()
  expect(Array.isArray(drafts)).toBe(true)
  expect(drafts.length).toBeGreaterThan(0)
  // Each item should be a mapped ContentDraft (camelCase)
  const first = drafts[0]
  expect(first).toHaveProperty('themes')
  expect(first).toHaveProperty('categories')
  expect(first).toHaveProperty('lastEditedAt')
})

test('getDraft returns a ContentDraft for a known seed id', async () => {
  const draft = await contentAdapter.getDraft(1)
  expect(draft.id).toBe(1)
  expect(draft).toHaveProperty('themes')
})

test('patchDraft returns updated ContentDraft', async () => {
  // create a fresh draft to avoid mutating seeds
  const created = await contentAdapter.createDraft('oneliner')
  const patched = await contentAdapter.patchDraft(created.id, { text: 'patched text' })
  expect(patched.text).toBe('patched text')
})

test('submitDraft flips status to pending', async () => {
  const created = await contentAdapter.createDraft('anti')
  const result = await contentAdapter.submitDraft(created.id)
  expect(result.status).toBe('pending')
})

test('deleteDraft resolves without throwing for an existing seed draft', async () => {
  resetMockStore()
  await expect(contentAdapter.deleteDraft(1)).resolves.toBeUndefined()
})

test('uploadMedia resolves a kind-aware MediaAssetDTO for video', async () => {
  const file = new File(['x'], 'clip.mp4', { type: 'video/mp4' })
  const asset = await contentAdapter.uploadMedia(file, 'video')
  expect(asset.kind).toBe('video')
  expect(asset.duration_ms).toBe(5000)
  expect(asset.poster_url).toBeTruthy()
})

test('uploadMedia resolves a kind-aware MediaAssetDTO for audio', async () => {
  const file = new File(['x'], 'voicemail.mp3', { type: 'audio/mpeg' })
  const asset = await contentAdapter.uploadMedia(file, 'audio')
  expect(asset.kind).toBe('audio')
  expect(asset.duration_ms).toBe(5000)
  expect(asset.poster_url).toBeNull()
})
