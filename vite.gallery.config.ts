import { copyFile } from 'node:fs/promises'
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
 *
 * History-API paths need the site to answer every address with the SPA. Vite's
 * dev server already does. GitHub Pages does not, so the build copies
 * index.html to 404.html and the router reads the original pathname.
 */

function spaFallback() {
  return {
    name: 'gallery-spa-fallback',
    async closeBundle() {
      const index = resolve(here, 'gallery-dist/index.html')
      await copyFile(index, resolve(here, 'gallery-dist/404.html'))
    },
  }
}

export default defineConfig({
  plugins: [react(), spaFallback()],
  root: resolve(here, 'gallery'),
  appType: 'spa',
  resolve: {
    alias: {
      '@fontsource': resolve(here, 'node_modules/@fontsource'),
    },
  },
  // GitHub Pages serves this repository below /navigator-ux/. Locally the
  // gallery owns the host root so `/pages` and `/components/...` resolve.
  base: process.env.GITHUB_PAGES === '1' ? '/navigator-ux/' : '/',
  server: {
    port: 5174,
    // Fail loudly rather than wandering to another port — the launch config and
    // the docs both name 5174, and a silent move makes them wrong.
    strictPort: true,
  },
  build: {
    // Only used by `build:gallery`, for a static preview or a CI artifact.
    outDir: resolve(here, 'gallery-dist'),
    emptyOutDir: true,
  },
})
