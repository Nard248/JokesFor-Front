export const DRAFT_NOTICE = 'DRAFT — pending counsel review'

export interface LegalDoc {
  title: string
  lastUpdated: string
  draftNotice: string
  sections: {
    heading: string
    body: string[]
  }[]
}
