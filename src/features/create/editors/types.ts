import type { EditorDraft, EditorAction } from '../editor-state'

export interface EditorProps {
  draft: EditorDraft
  dispatch: (a: EditorAction) => void
  errors?: Record<string, string>
}
