import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = import.meta.dirname

export default defineConfig({
  plugins: [react()],
  root: resolve(here, 'harness'),
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/app/api': {
        target: `http://127.0.0.1:${process.env.E2E_API_PORT ?? '4010'}`,
        changeOrigin: true,
      },
    },
  },
})
