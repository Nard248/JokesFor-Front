import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Vite 7 plugin types differ from the existing Vitest 2 bundled Vite types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any],
  cacheDir: '.community-cache/vitest',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/features/communities/**/*.test.{ts,tsx}'],
  },
})
