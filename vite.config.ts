import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
// vitest/config re-exports defineConfig with the `test` block typed.
import { defineConfig } from 'vitest/config'

// `import.meta.dirname` rather than `__dirname`: Vite 8's native config loader
// does not provide the CommonJS globals, and warns that it will stop tolerating
// them.
const here = import.meta.dirname

/* The emitted stylesheet's name, stated once.
 *
 * In library mode Vite derives the CSS filename from the *package name*, so
 * renaming the package silently renames the file — and the `exports` map in
 * package.json goes on pointing at the old one. That is a 404 for every
 * consumer's `import '.../styles.css'`, with nothing failing at build time to
 * say so. Pinning the name here decouples the two: the package can be renamed
 * again and this file will not move. */
const STYLESHEET = 'navigator-ux.css'

export default defineConfig({
  // `rollupTypes` bundles the public API into one index.d.ts, which is what
  // `types` points at, but it leaves the per-file declarations beside it — and
  // src/test is under `include`, so a published tarball carried a .d.ts for
  // every test file. They are unreachable and describe nothing a consumer can
  // import; excluding them keeps the suite out of the package.
  plugins: [react(), dts({ include: ['src'], exclude: ['src/test'], rollupTypes: true })],
  build: {
    lib: {
      entry: resolve(here, 'src/index.ts'),
      name: 'NeonLawUx',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // React is supplied by the consuming app, never bundled here.
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: { react: 'React', 'react-dom': 'ReactDOM' },
        // Emit assets under stable, unhashed names so the `exports` map can
        // point at them. The stylesheet is pinned outright; everything else
        // keeps the name it arrived with.
        assetFileNames: (asset) =>
          asset.names?.some((name) => name.endsWith('.css'))
            ? STYLESHEET
            : (asset.names?.[0] ?? '[name][extname]'),
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Scoped to src rather than left to Vitest's default glob. The package
    // root is now the repository root, so the default would also match any
    // checkout sitting inside it — a git worktree under .claude/, say, whose
    // copy of an older suite then runs and fails against today's source.
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        // Re-exports only. Importing it in a test would score 100% without
        // exercising anything, so counting it either way is noise.
        'src/index.ts',
      ],
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 90,
      },
    },
  },
})
