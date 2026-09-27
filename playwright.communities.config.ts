import { defineConfig, devices } from '@playwright/test'

// This suite intentionally uses the running, isolated Community Lab services.
// Never start the main project's production-aware settings from here.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'community-lab.e2e.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: '.community-cache/e2e-results',
  use: {
    baseURL: 'http://127.0.0.1:5187',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'community-lab', use: { ...devices['Desktop Chrome'] } }],
})
