import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  cacheDir: '.community-cache/vite',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5187,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8017' },
  },
  build: {
    outDir: 'dist-communities',
    rollupOptions: {
      input: fileURLToPath(new URL('./communities.html', import.meta.url)),
    },
  },
})
