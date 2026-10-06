// Analytics scaffolding
export { track } from './analytics'
export type { CreateEvent } from './analytics'

// Creator store + unseen change hook
export { useCreatorStore, useUnseenSubmissionChange } from './store'

// Query hooks + key factory
export { createKeys, useFormats, useAgeRatings, useTones, useContextTags, useCultureTags, useLanguages, useDrafts, useDraft } from './queries'

// Mutation hooks
export { useCreateDraft, usePatchDraft, useSubmitDraft, useDeleteDraft, useUploadMedia } from './mutations'

// Validation utilities
export { validate, isBlank } from './validation'

// All types
export * from './types'

// Phase 3: Editor state + autosave engine
export { emptyEditorDraft, editorReducer, toJokePayload } from './editor-state'
export type { EditorDraft, EditorAction } from './editor-state'
export { useAutosave } from './autosave'
export type { SaveState, UseAutosave } from './autosave'
export { readThemeParam, newJokeHref } from './theme-param'

// Phase 3: Components
export { SaveIndicator } from './components/SaveIndicator'

// Phase 4: Presentational components
export { StatusBadge } from './components/StatusBadge'
export { PublishedStats } from './components/PublishedStats'
export { FormatTile } from './components/FormatTile'
export { DraftCard } from './components/DraftCard'
export { TagPicker } from './components/TagPicker'
export { AgeRatingRadio } from './components/AgeRatingRadio'
export { PreviewPane } from './components/PreviewPane'
export { DialogueLine } from './components/DialogueLine'
export { EditorShell } from './components/EditorShell'
export { SubmitConfirmModal } from './components/SubmitConfirmModal'
export { ChangeFormatModal } from './components/ChangeFormatModal'
export { DeleteDraftModal } from './components/DeleteDraftModal'

// Phase 4: Editor registry + format utilities
// The per-format editors are reached only through EDITOR_BY_FORMAT's
// React.lazy() imports, so each stays its own chunk. Do not re-export them
// here: a static re-export pulls them into the main bundle (Rolldown does not
// drop an unused barrel re-export the way Rollup did).
export { EDITOR_BY_FORMAT, formatIcon, FORMAT_ICON, FORMAT_EXAMPLE } from './editors/index'
export type { EditorProps } from './editors/types'
