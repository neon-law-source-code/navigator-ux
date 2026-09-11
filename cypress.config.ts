import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { defineConfig } from 'cypress'

/*
 * Specs share one origin: the fake OpenAPI harness (CYPRESS_BASE_URL, :5175).
 * neon-site.cy.ts visits `/neon` (legacy `?showcase=neon` still parses) on that origin and asserts copy from
 * gallery/content/en.yaml plus the Markdown page files.
 *
 * Those files reference Navigator's shared marketing catalog with `{shared:<key>}`. The tasks below resolve those
 * references the same way the browser build does, so a spec that asserts a sentence is asserting the sentence the
 * pinned catalog actually publishes — not the token standing in for it.
 */

const root = process.cwd()

const catalog = JSON.parse(readFileSync(resolve(root, 'gallery/content/marketing-catalog.json'), 'utf8'))

function shared(key: string): string {
  const value = catalog.payload.entries[key]
  if (value === undefined) throw new Error(`marketing catalog: no entry for \`${key}\``)
  return value
}

function resolveShared(raw: string): string {
  return raw.replace(/\{shared:([A-Za-z0-9_.]+)\}/g, (_match, key: string) => shared(key))
}

function pageDoc(name: string) {
  const raw = resolveShared(readFileSync(resolve(root, `gallery/content/pages/${name}.md`), 'utf8'))
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match?.[1]) throw new Error(`missing front matter in ${name}.md`)
  return { matter: parse(match[1]), body: (match[2] ?? '').trim() }
}

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:5175',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
    setupNodeEvents(on) {
      on('task', {
        neonEn() {
          return parse(resolveShared(readFileSync(resolve(root, 'gallery/content/en.yaml'), 'utf8')))
        },
        neonPage(name: string) {
          return pageDoc(name)
        },
        /** The pinned catalog itself, so a spec can assert the rendered page carries it. */
        neonCatalog() {
          return catalog
        },
      })
    },
  },
})
