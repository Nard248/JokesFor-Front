import { LegalDocPage } from './LegalDocPage'
import { privacy } from '@/content/legal'

export function PrivacyPage() {
  return <LegalDocPage doc={privacy} path="/privacy" />
}
