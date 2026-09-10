import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'
import { defineConfig } from 'cypress'

/*
 * The API specs hit the fake OpenAPI harness (CYPRESS_BASE_URL, :5175).
 * neon-site.cy.ts hits the gallery (CYPRESS_GALLERY_URL) and asserts copy from
 * gallery/content/en.yaml plus the Markdown page files.
 */

const root = process.cwd()

function pageDoc(name: string) {
  const raw = readFileSync(resolve(root, `gallery/content/pages/${name}.md`), 'utf8')
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
    env: {
      GALLERY_URL: process.env.CYPRESS_GALLERY_URL ?? 'http://127.0.0.1:5176',
    },
    setupNodeEvents(on) {
      on('task', {
        neonEn() {
          return parse(readFileSync(resolve(root, 'gallery/content/en.yaml'), 'utf8'))
        },
        neonPage(name: string) {
          return pageDoc(name)
        },
      })
    },
  },
})
