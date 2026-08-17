import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Matches vite.config.ts: Vite 8's native config loader does not provide the
// CommonJS globals and warns that it will stop tolerating them, so this reads
// `import.meta.dirname` rather than `__dirname`.
const here = import.meta.dirname

/*
 * The component gallery — a dev server, not a build target.
 *
 * Kept in its own config rather than added to `vite.config.ts` because that one
 * is a library build: it has `build.lib`, it externalises React, and it runs
 * `vite-plugin-dts`. None of that applies to an app, and a single config trying
 * to be both would emit the gallery into `dist` and ship it to every consumer.
 *
 * Nothing here is published. `files` in package.json lists `dist` only.
 */

export default defineConfig({
  plugins: [react()],
  root: resolve(here,'gallery'),
  server: {
    port: 5174,
    // Fail loudly rather than wandering to another port — the launch config and
    // the docs both name 5174, and a silent move makes them wrong.
    strictPort: true,
  },
  build: {
    // Only used by `build:gallery`, for a static preview or a CI artifact.
    outDir: resolve(here,'gallery-dist'),
    emptyOutDir: true,
  },
})
