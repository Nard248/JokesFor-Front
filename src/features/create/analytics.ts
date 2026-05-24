/**
 * analytics.ts — Phase 6 analytics scaffolding.
 *
 * No SDK yet (design §reconciliation note). Pure no-op in prod;
 * console.debug in DEV so developers can verify events fire.
 */

export type CreateEvent =
  | 'creator_hub_viewed'
  | 'format_picker_viewed'
  | 'format_selected'
  | 'editor_opened'
  | 'draft_created'
  | 'submit_succeeded'
  | 'draft_deleted'
  | 'format_changed'

export function track(event: CreateEvent, props?: Record<string, unknown>): void {
  // No analytics SDK yet (design §reconciliation). No-op in prod; debug in dev.
  if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {})
}
