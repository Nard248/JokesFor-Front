import React from 'react'
import type { FormatSlug } from '@/features/create/types'
import type { EditorProps } from './types'

export type { EditorProps }
export { formatIcon, FORMAT_ICON, FORMAT_EXAMPLE } from './formatIcon'
export { FormatIcon } from './FormatIconComponent'

export const EDITOR_BY_FORMAT: Record<
  FormatSlug,
  React.LazyExoticComponent<React.ComponentType<EditorProps>>
> = {
  oneliner: React.lazy(() =>
    import('./OneLinerEditor').then((m) => ({ default: m.OneLinerEditor })),
  ),
  observ: React.lazy(() =>
    import('./ObservationalEditor').then((m) => ({ default: m.ObservationalEditor })),
  ),
  story: React.lazy(() =>
    import('./StoryEditor').then((m) => ({ default: m.StoryEditor })),
  ),
  setup: React.lazy(() =>
    import('./SetupPunchlineEditor').then((m) => ({ default: m.SetupPunchlineEditor })),
  ),
  anti: React.lazy(() =>
    import('./SetupPunchlineEditor').then((m) => ({ default: m.SetupPunchlineEditor })),
  ),
  knock: React.lazy(() =>
    import('./KnockEditor').then((m) => ({ default: m.KnockEditor })),
  ),
  // Placeholder wired for the FlowJokeFormat exhaustiveness check — the create
  // flow doesn't offer 'image' yet (FORMAT_SLUGS/pickers still exclude it), so
  // this is unreachable UI today; the media-jokes create-pipeline task swaps
  // it for a real ImageEditor.
  image: React.lazy(() =>
    import('./SetupPunchlineEditor').then((m) => ({ default: m.SetupPunchlineEditor })),
  ),
}
