import { Quote, MessageCircleQuestion, DoorOpen, BookOpen, Asterisk, Eye, Image as ImageIcon, Clapperboard, AudioLines } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FormatSlug } from '../types'

export const FORMAT_ICON: Record<FormatSlug, LucideIcon> = {
  oneliner: Quote,
  setup:    MessageCircleQuestion,
  knock:    DoorOpen,
  story:    BookOpen,
  anti:     Asterisk,
  observ:   Eye,
  image:    ImageIcon,
  video:    Clapperboard,
  audio:    AudioLines,
}

export function formatIcon(slug: FormatSlug): LucideIcon {
  return FORMAT_ICON[slug]
}

/** One editorial example per format (hardcoded). */
export const FORMAT_EXAMPLE: Record<FormatSlug, string> = {
  oneliner: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
  setup:    "Why don't scientists trust atoms?\nBecause they make up everything.",
  knock:    "Knock knock.\nWho's there?\nCows go.\nCows go who?\nNo, cows go moo!",
  story:    "A programmer goes to the store and his wife says 'get a gallon of milk, and if they have eggs, get a dozen.' He comes back with 13 gallons of milk.",
  anti:     "Why did the chicken cross the road?\nTo get to the other side.",
  observ:   "Have you noticed that every time you clean something, you just move the dirt somewhere else?",
  image:    "My dog, disappointed in my life choices.",
  video:    "My cat's reaction when I said 'bath time.'",
  audio:    "Voicemail my dad left me. He does not know how voicemail works.",
}
