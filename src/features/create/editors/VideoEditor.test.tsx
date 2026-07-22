import { useReducer } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { VideoEditor } from './VideoEditor'
import { emptyEditorDraft, editorReducer, type EditorAction } from '../editor-state'

const uploadMediaMock = vi.fn(async (_file: File, _kind: string, _onProgress?: (pct: number) => void) => ({
  id: 'up-vid-1', kind: 'video', url: 'blob:mock-video', poster_url: 'blob:mock-poster',
  width: 1280, height: 720, duration_ms: 5000, is_gif: false,
}))

vi.mock('../adapter', () => ({
  contentAdapter: {
    uploadMedia: (file: File, kind: string, onProgress?: (pct: number) => void) =>
      uploadMediaMock(file, kind, onProgress),
  },
}))

// A thin stateful harness: VideoEditor is a controlled component (draft/dispatch
// as props), so exercising re-renders after a dispatched action needs a real
// reducer driving state — a plain mutable closure variable (as some sibling
// editor tests use) never triggers React to re-render with the new draft.
function Harness({ onDispatch }: { onDispatch: (a: EditorAction) => void }) {
  const [draft, dispatch] = useReducer(editorReducer, emptyEditorDraft('video'))
  const wrapped = (a: EditorAction) => {
    onDispatch(a)
    dispatch(a)
  }
  return <VideoEditor draft={draft} dispatch={wrapped} />
}

function renderEditor() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const dispatch = vi.fn<(a: EditorAction) => void>()
  const utils = render(
    <QueryClientProvider client={qc}>
      <Harness onDispatch={dispatch} />
    </QueryClientProvider>,
  )
  return { dispatch, ...utils }
}

describe('VideoEditor', () => {
  it('has a caption field wired to setField setup', () => {
    const { dispatch } = renderEditor()
    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'my caption' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setField', field: 'setup', value: 'my caption' })
  })

  it('uploads a picked file with kind "video" and dispatches setMedia with the returned asset', async () => {
    const { dispatch } = renderEditor()
    const file = new File(['x'], 'joke.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByTestId('video-file-input'), { target: { files: [file] } })

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'setMedia', media: [expect.objectContaining({ kind: 'video' })] }),
      ),
    )
    // The upload seam receives kind:'video' — a picked .gif goes through the
    // same path (see the self-review note in VideoEditor.tsx for the reasoning).
    expect(uploadMediaMock).toHaveBeenCalledWith(file, 'video', expect.any(Function))
  })

  it('renders a single-slot preview with controls once an asset is present, and hides the add-video button', async () => {
    renderEditor()
    const file = new File(['x'], 'joke.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByTestId('video-file-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('video-preview')).toBeInTheDocument()
    })
    expect(screen.queryByText(/^add video$/i)).not.toBeInTheDocument()
    expect(screen.getByText('MP4/MOV/WebM or GIF · max 60s · max 30MB · up to 1080p')).toBeInTheDocument()
  })

  it('remove clears the media slot and restores the add-video button', async () => {
    renderEditor()
    const file = new File(['x'], 'joke.mp4', { type: 'video/mp4' })
    fireEvent.change(screen.getByTestId('video-file-input'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('video-preview')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('remove video'))

    await waitFor(() => {
      expect(screen.queryByTestId('video-preview')).not.toBeInTheDocument()
      expect(screen.getByText(/^add video$/i)).toBeInTheDocument()
    })
  })
})
