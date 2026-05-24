import React from 'react'
import type { FormatSlug } from '@/features/create/types'
import type { EditorProps } from './types'

export type { EditorProps }
export { formatIcon, FORMAT_ICON, FORMAT_EXAMPLE } from './formatIcon'

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
}
