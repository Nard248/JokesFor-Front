import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useCreateDraft, usePatchDraft, useSubmitDraft, useDeleteDraft } from './mutations'
import { createKeys } from './queries'
import { resetMockStore } from './mock'
import type { ContentDraft } from './types'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper: Wrapper, qc }
}

beforeEach(() => {
  resetMockStore()
})

test('useCreateDraft().mutateAsync("oneliner") resolves a ContentDraft with format "oneliner" and status "draft"', async () => {
  const { wrapper } = makeWrapper()
  const { result } = renderHook(() => useCreateDraft(), { wrapper })

  let draft: ContentDraft | undefined
  await act(async () => {
    draft = await result.current.mutateAsync('oneliner')
  })

  expect(draft).toBeDefined()
  expect(draft!.format).toBe('oneliner')
  expect(draft!.status).toBe('draft')
  expect(typeof draft!.id).toBe('number')
})

test('useCreateDraft writes the detail cache on success', async () => {
  const { wrapper, qc } = makeWrapper()
  const { result } = renderHook(() => useCreateDraft(), { wrapper })

  let draft: ContentDraft | undefined
  await act(async () => {
    draft = await result.current.mutateAsync('oneliner')
  })

  const cached = qc.getQueryData<ContentDraft>(createKeys.drafts.detail(draft!.id))
  expect(cached).toBeDefined()
  expect(cached!.id).toBe(draft!.id)
})

test('usePatchDraft optimistically updates the detail cache before settling', async () => {
  const { wrapper, qc } = makeWrapper()

  // Seed a detail entry in the query cache
  const seedDraft: ContentDraft = {
    id: 1,
    format: 'setup',
    status: 'draft',
    text: '',
    setup: 'Original setup',
    punchline: '',
    lines: null,
    themes: [],
    categories: [],
    cultures: [],
    ageRating: null,
    language: 'en',
    source: 'original',
    lastEditedAt: '2026-05-20T10:00:00Z',
    rejectionReason: '',
    likes: null,
    stats: null,
    media: [],
  }
  qc.setQueryData(createKeys.drafts.detail(1), seedDraft)

  const { result } = renderHook(() => usePatchDraft(1), { wrapper })

  // Start the mutation but don't await — check the optimistic update before settling
  let settled = false
  act(() => {
    result.current.mutateAsync({ setup: 'Optimistically updated' }).then(() => {
      settled = true
    })
  })

  // The cache should be updated optimistically (before the promise resolves)
  await waitFor(() => {
    const cached = qc.getQueryData<ContentDraft>(createKeys.drafts.detail(1))
    expect(cached?.setup).toBe('Optimistically updated')
  })

  // Wait for the mutation to finish
  await waitFor(() => expect(settled).toBe(true))
})

test('useSubmitDraft().mutateAsync(id) resolves without throwing', async () => {
  resetMockStore()
  const { wrapper } = makeWrapper()
  const { result } = renderHook(() => useSubmitDraft(), { wrapper })

  await act(async () => {
    // Draft id 1 exists in the seed store
    await expect(result.current.mutateAsync(1)).resolves.not.toThrow()
  })
})

test('useDeleteDraft().mutateAsync(id) resolves without throwing', async () => {
  resetMockStore()
  const { wrapper } = makeWrapper()
  const { result } = renderHook(() => useDeleteDraft(), { wrapper })

  await act(async () => {
    // Draft id 2 exists in the seed store
    await expect(result.current.mutateAsync(2)).resolves.not.toThrow()
  })
})
