import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [
        'fs', 'path', 'os', 'child_process', 'crypto', 'stream', 'util', 'url', 'events', 'http', 'https', 'assert', 'zlib', 'v8', 'buffer'
      ],
    },
  },
})
