import { Quote, MessageCircleQuestion, DoorOpen, BookOpen, Asterisk, Eye } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import type { FormatSlug } from '../types'

/**
 * Stable module-scope component that renders the correct icon for a given format slug.
 * Using explicit JSX per slug avoids the react-hooks/static-components lint rule
 * that fires when a component is dynamically resolved inside render.
 */
export function FormatIcon({ slug, ...props }: { slug: FormatSlug } & LucideProps) {
  switch (slug) {
    case 'oneliner': return <Quote {...props} />
    case 'setup':    return <MessageCircleQuestion {...props} />
    case 'knock':    return <DoorOpen {...props} />
    case 'story':    return <BookOpen {...props} />
    case 'anti':     return <Asterisk {...props} />
    case 'observ':   return <Eye {...props} />
    default:         return null
  }
}
