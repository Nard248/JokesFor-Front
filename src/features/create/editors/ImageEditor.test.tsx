import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImageEditor } from './ImageEditor'
import { emptyEditorDraft, editorReducer, type EditorAction } from '../editor-state'

vi.mock('../adapter', () => ({
  contentAdapter: {
    uploadMedia: vi.fn(async () => ({
      id: 'up-1', kind: 'image', url: 'blob:mock', poster_url: null,
      width: 800, height: 600, duration_ms: null, is_gif: false,
    })),
  },
}))

function renderEditor() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let draft = emptyEditorDraft('image')
  const dispatch = vi.fn((a: EditorAction) => { draft = editorReducer(draft, a) })
  const utils = render(
    <QueryClientProvider client={qc}>
      <ImageEditor draft={draft} dispatch={dispatch} />
    </QueryClientProvider>,
  )
  return { dispatch, get draft() { return draft }, ...utils }
}

describe('ImageEditor', () => {
  it('has a caption field wired to setField setup', () => {
    const { dispatch } = renderEditor()
    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'my caption' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setField', field: 'setup', value: 'my caption' })
  })

  it('uploads a picked file and dispatches setMedia with the returned asset', async () => {
    const { dispatch } = renderEditor()
    const file = new File(['x'], 'joke.png', { type: 'image/png' })
    fireEvent.change(screen.getByTestId('image-file-input'), { target: { files: [file] } })
    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'setMedia' }),
      ),
    )
  })
})
