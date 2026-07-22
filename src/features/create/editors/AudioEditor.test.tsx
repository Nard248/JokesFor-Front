import { useReducer } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AudioEditor } from './AudioEditor'
import { emptyEditorDraft, editorReducer, type EditorAction } from '../editor-state'

const uploadMediaMock = vi.fn(async (_file: File, _kind: string, _onProgress?: (pct: number) => void) => ({
  id: 'up-aud-1', kind: 'audio', url: 'blob:mock-audio', poster_url: null,
  width: null, height: null, duration_ms: 5000, is_gif: false,
}))

vi.mock('../adapter', () => ({
  contentAdapter: {
    uploadMedia: (file: File, kind: string, onProgress?: (pct: number) => void) =>
      uploadMediaMock(file, kind, onProgress),
  },
}))

// See VideoEditor.test.tsx for why this harness drives real state instead of
// a mutable closure variable — AudioEditor is a controlled component, and
// re-render assertions need a real reducer to reflect the dispatched action.
function Harness({ onDispatch }: { onDispatch: (a: EditorAction) => void }) {
  const [draft, dispatch] = useReducer(editorReducer, emptyEditorDraft('audio'))
  const wrapped = (a: EditorAction) => {
    onDispatch(a)
    dispatch(a)
  }
  return <AudioEditor draft={draft} dispatch={wrapped} />
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

describe('AudioEditor', () => {
  it('has a caption field wired to setField setup', () => {
    const { dispatch } = renderEditor()
    fireEvent.change(screen.getByLabelText(/caption/i), { target: { value: 'my caption' } })
    expect(dispatch).toHaveBeenCalledWith({ type: 'setField', field: 'setup', value: 'my caption' })
  })

  it('uploads a picked file with kind "audio" and dispatches setMedia with the returned asset', async () => {
    const { dispatch } = renderEditor()
    const file = new File(['x'], 'voicemail.mp3', { type: 'audio/mpeg' })
    fireEvent.change(screen.getByTestId('audio-file-input'), { target: { files: [file] } })

    await waitFor(() =>
      expect(dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'setMedia', media: [expect.objectContaining({ kind: 'audio' })] }),
      ),
    )
    expect(uploadMediaMock).toHaveBeenCalledWith(file, 'audio', expect.any(Function))
  })

  it('renders a single-slot preview with controls once an asset is present, and hides the add-audio button', async () => {
    renderEditor()
    const file = new File(['x'], 'voicemail.mp3', { type: 'audio/mpeg' })
    fireEvent.change(screen.getByTestId('audio-file-input'), { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('audio-preview')).toBeInTheDocument()
    })
    expect(screen.queryByText(/^add audio$/i)).not.toBeInTheDocument()
    expect(screen.getByText('MP3 or M4A · max 60s · max 10MB')).toBeInTheDocument()
  })

  it('remove clears the media slot and restores the add-audio button', async () => {
    renderEditor()
    const file = new File(['x'], 'voicemail.mp3', { type: 'audio/mpeg' })
    fireEvent.change(screen.getByTestId('audio-file-input'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByTestId('audio-preview')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText('remove audio'))

    await waitFor(() => {
      expect(screen.queryByTestId('audio-preview')).not.toBeInTheDocument()
      expect(screen.getByText(/^add audio$/i)).toBeInTheDocument()
    })
  })
})
