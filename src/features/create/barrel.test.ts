import { describe, it, expect } from 'vitest'

// Verify that all Phase 4 components and editors are exported from the barrel.
// This is a compile-time check — if imports fail, the test file itself won't compile.
import {
  // Phase 4 components
  StatusBadge,
  PublishedStats,
  FormatTile,
  DraftCard,
  TagPicker,
  AgeRatingRadio,
  PreviewPane,
  DialogueLine,
  EditorShell,
  SubmitConfirmModal,
  ChangeFormatModal,
  DeleteDraftModal,
  SaveIndicator,
  // Editors
  KnockEditor,
  OneLinerEditor,
  ObservationalEditor,
  StoryEditor,
  SetupPunchlineEditor,
  // Registry
  EDITOR_BY_FORMAT,
  // Format icon utilities
  formatIcon,
  FORMAT_EXAMPLE,
} from './index'

describe('create barrel exports', () => {
  it('exports StatusBadge', () => { expect(StatusBadge).toBeDefined() })
  it('exports PublishedStats component', () => { expect(PublishedStats).toBeDefined() })
  it('exports FormatTile', () => { expect(FormatTile).toBeDefined() })
  it('exports DraftCard', () => { expect(DraftCard).toBeDefined() })
  it('exports TagPicker', () => { expect(TagPicker).toBeDefined() })
  it('exports AgeRatingRadio', () => { expect(AgeRatingRadio).toBeDefined() })
  it('exports PreviewPane', () => { expect(PreviewPane).toBeDefined() })
  it('exports DialogueLine', () => { expect(DialogueLine).toBeDefined() })
  it('exports EditorShell', () => { expect(EditorShell).toBeDefined() })
  it('exports SubmitConfirmModal', () => { expect(SubmitConfirmModal).toBeDefined() })
  it('exports ChangeFormatModal', () => { expect(ChangeFormatModal).toBeDefined() })
  it('exports DeleteDraftModal', () => { expect(DeleteDraftModal).toBeDefined() })
  it('exports SaveIndicator', () => { expect(SaveIndicator).toBeDefined() })
  it('exports KnockEditor', () => { expect(KnockEditor).toBeDefined() })
  it('exports OneLinerEditor', () => { expect(OneLinerEditor).toBeDefined() })
  it('exports ObservationalEditor', () => { expect(ObservationalEditor).toBeDefined() })
  it('exports StoryEditor', () => { expect(StoryEditor).toBeDefined() })
  it('exports SetupPunchlineEditor', () => { expect(SetupPunchlineEditor).toBeDefined() })
  it('exports EDITOR_BY_FORMAT registry', () => { expect(EDITOR_BY_FORMAT).toBeDefined() })
  it('exports formatIcon utility', () => { expect(formatIcon).toBeDefined() })
  it('exports FORMAT_EXAMPLE map', () => { expect(FORMAT_EXAMPLE).toBeDefined() })
})
