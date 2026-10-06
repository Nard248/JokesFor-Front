import { describe, it, expect } from 'vitest'
import * as barrel from './index'

// Verify that all Phase 4 components and the editor registry are exported from
// the barrel. This is a compile-time check — if imports fail, the test file
// itself won't compile.
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
  it('exports EDITOR_BY_FORMAT registry', () => { expect(EDITOR_BY_FORMAT).toBeDefined() })
  it('exports formatIcon utility', () => { expect(formatIcon).toBeDefined() })
  it('exports FORMAT_EXAMPLE map', () => { expect(FORMAT_EXAMPLE).toBeDefined() })
})

// The per-format editors must stay out of the barrel: a static re-export puts
// every editor in the main bundle, defeating EDITOR_BY_FORMAT's lazy chunks.
describe('create barrel keeps editors lazy', () => {
  it('does not re-export the per-format editor components', () => {
    for (const name of [
      'OneLinerEditor', 'ObservationalEditor', 'StoryEditor', 'SetupPunchlineEditor',
      'KnockEditor', 'ImageEditor', 'VideoEditor', 'AudioEditor',
    ]) {
      expect(barrel).not.toHaveProperty(name)
    }
  })

  it('serves every format through a React.lazy component', () => {
    const lazyType = Symbol.for('react.lazy')
    for (const editor of Object.values(EDITOR_BY_FORMAT)) {
      expect((editor as unknown as { $$typeof: symbol }).$$typeof).toBe(lazyType)
    }
  })
})
