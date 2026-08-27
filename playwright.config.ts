import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end configuration: a REAL browser against a REAL SPA against a REAL
 * Django API and Postgres. Nothing is mocked.
 *
 * That is the whole point. The unit suites (799 vitest + 877 Django) both pass
 * while mocking the other side, so an FE<->BE contract can drift with every
 * test still green — which is how three P0s reached production, including a
 * paywall leak affecting 39% of the catalogue that rendered perfectly on
 * screen. This tier exists to exercise the wire between the two.
 *
 * Ports 8011/5274 are deliberately NOT the dev defaults (8000/5173) so a suite
 * run never collides with a dev server you already have open.
 */
const BACKEND_DIR =
  process.env.E2E_BACKEND_DIR ?? '/Users/narekmeloyan/PycharmProjects/JokesForProject'
const BACKEND_PORT = process.env.E2E_BACKEND_PORT ?? '8011'
const FRONTEND_PORT = process.env.E2E_FRONTEND_PORT ?? '5274'

/** Where the API drops sent emails; specs read verification codes from here. */
const MAIL_DIR = process.env.E2E_MAIL_DIR ?? path.join(os.tmpdir(), 'jokesfor-e2e-mail')
fs.mkdirSync(MAIL_DIR, { recursive: true })

const API_ORIGIN = `http://localhost:${BACKEND_PORT}`
const APP_ORIGIN = `http://localhost:${FRONTEND_PORT}`

/** Backend env: local Postgres, console email (so verification codes are
 *  readable from stdout), billing dormant, no GCS/Vision.
 *  `DATABASE_URL: ''` is load-bearing — it forces settings.py onto the DB_*
 *  fallback, so a suite run can never point at production Neon. */
const backendEnv = {
  DATABASE_URL: '',
  DB_NAME: process.env.E2E_DB_NAME ?? 'jokesfor',
  DB_USER: process.env.E2E_DB_USER ?? 'postgres',
  DB_PASSWORD: process.env.E2E_DB_PASSWORD ?? '6969',
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DEBUG: 'True',
  // File-based mail so specs can read the REAL rendered email (and its
  // verification code) off disk. This exercises the actual template and
  // sending path — no test-only endpoint, no reaching into the database, and
  // no new surface that could ever exist in production.
  EMAIL_BACKEND: 'django.core.mail.backends.filebased.EmailBackend',
  EMAIL_FILE_PATH: MAIL_DIR,
  EMAIL_VERIFICATION_REQUIRED: 'true',
  FRONTEND_URL: APP_ORIGIN,
  CORS_ALLOWED_ORIGINS: APP_ORIGIN,
  CSRF_TRUSTED_ORIGINS: APP_ORIGIN,
  STRIPE_SECRET_KEY: '',
  // The suite drives dozens of real signups and reads from ONE IP, which trips
  // the production limits within a few specs. Raised only for this process;
  // the limits themselves are covered by the backend's own throttle tests.
  THROTTLE_ANON: '100000/hour',
  THROTTLE_USER: '100000/hour',
  THROTTLE_VERIFICATION_RESEND: '1000/15min',
  // cairosvg needs Homebrew's libcairo on macOS; harmless elsewhere.
  DYLD_FALLBACK_LIBRARY_PATH: '/opt/homebrew/lib',
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  // Each spec creates its own account, so specs are logically independent — but
  // they share one Postgres and the API throttles per IP, so keep it serial.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: APP_ORIGIN,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      // Mobile-layout specs assert geometry that only holds at a phone
      // viewport; running them here fails for the wrong reason.
      testIgnore: '**/*.mobile.spec.ts',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      // Only the specs that actually assert mobile layout.
      testMatch: '**/*.mobile.spec.ts',
    },
  ],

  webServer: [
    {
      // migrate + seed BEFORE serving — a suite must never run against a stale
      // schema or an empty catalogue.
      command:
        `.venv/bin/python manage.py migrate --noinput ` +
        `&& .venv/bin/python manage.py seed_achievements ` +
        `&& .venv/bin/python manage.py seed_e2e ` +
        `&& .venv/bin/python manage.py runserver ${BACKEND_PORT} --noreload`,
      cwd: BACKEND_DIR,
      url: `${API_ORIGIN}/livez`,
      // Never reuse: a server left over from an earlier run may have been
      // started with different env (throttle limits, mail dir, DB), and the
      // resulting failures look like product bugs rather than stale state.
      // Costs a few seconds; removes a whole class of phantom flakiness.
      reuseExistingServer: false,
      timeout: 180_000,
      stdout: 'pipe',
      env: backendEnv,
    },
    {
      command: `npm run dev -- --strictPort --port ${FRONTEND_PORT}`,
      url: APP_ORIGIN,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_URL: `${API_ORIGIN}/api/v1`,
        VITE_USE_MOCKS: 'false',
        VITE_USE_REAL_PREFERENCES: 'true',
        VITE_USE_REAL_CREATE: 'true',
      },
    },
  ],
})

export { API_ORIGIN, APP_ORIGIN, BACKEND_DIR, BACKEND_PORT, FRONTEND_PORT, MAIL_DIR }
