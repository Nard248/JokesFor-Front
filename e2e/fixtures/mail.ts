/**
 * Reading the mail the API actually sent.
 *
 * The suite runs the backend with Django's file-based email backend, so every
 * message lands as a real `.log` file containing the rendered template. Specs
 * read the verification code out of that file.
 *
 * This is deliberate: the alternative was a test-only "activate this user"
 * endpoint, which would mean shipping a code path whose whole purpose is to
 * skip authentication. Reading the sent mail keeps the entire flow honest —
 * template rendering, the notification service, and the code issuing path all
 * run exactly as they do in production, and the only thing swapped is the
 * transport.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const MAIL_DIR =
  process.env.E2E_MAIL_DIR ?? path.join(os.tmpdir(), 'jokesfor-e2e-mail')

function mailFiles(): string[] {
  if (!fs.existsSync(MAIL_DIR)) return []
  return fs
    .readdirSync(MAIL_DIR)
    .filter((f) => f.endsWith('.log'))
    .map((f) => path.join(MAIL_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
}

/** Most recent message addressed to `email`, or null. */
export function latestMailTo(email: string): string | null {
  for (const file of mailFiles()) {
    const body = fs.readFileSync(file, 'utf8')
    if (body.toLowerCase().includes(`to: ${email.toLowerCase()}`)) return body
  }
  return null
}

/**
 * The 6-digit verification code most recently sent to `email`.
 *
 * Polls, because the request that triggers the send returns before the file is
 * necessarily flushed.
 */
export async function waitForVerificationCode(
  email: string,
  timeoutMs = 15_000,
): Promise<string> {
  const deadline = Date.now() + timeoutMs
  let lastSeen: string | null = null
  while (Date.now() < deadline) {
    const mail = latestMailTo(email)
    if (mail) {
      lastSeen = mail
      const match = mail.match(/Your code:\s*(\d{6})/) ?? mail.match(/\b(\d{6})\b/)
      if (match) return match[1]
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(
    `No verification code for ${email} within ${timeoutMs}ms.\n` +
      `Mail dir: ${MAIL_DIR} (${mailFiles().length} messages)\n` +
      (lastSeen
        ? `Most recent message to that address had no 6-digit code:\n${lastSeen.slice(0, 400)}`
        : 'No message to that address was found at all — is EMAIL_FILE_PATH wired through?'),
  )
}

/** Drop messages from previous runs so `latestMailTo` cannot read a stale code. */
export function clearMailbox(): void {
  for (const file of mailFiles()) {
    try {
      fs.unlinkSync(file)
    } catch {
      /* another worker got there first */
    }
  }
}
