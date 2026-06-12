export type VerifyEvent =
  | 'verify_screen_viewed'
  | 'verify_succeeded'
  | 'verify_failed'
  | 'resend_clicked'
  | 'resend_throttled'

export function trackVerify(event: VerifyEvent, props?: Record<string, unknown>): void {
  if (import.meta.env.DEV) console.debug('[analytics]', event, props ?? {})
}
