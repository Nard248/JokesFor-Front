import { LegalDocPage } from './LegalDocPage'
import { terms } from '@/content/legal'

export function TermsPage() {
  return <LegalDocPage doc={terms} path="/terms" />
}
