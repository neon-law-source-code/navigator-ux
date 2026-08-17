/*
 * Post-build: emit the font layer, which Vite must not bundle.
 *
 * Vite *would* process `fonts.css`, and processing it is the problem. Library
 * mode inlines every asset a stylesheet references as a data: URI regardless of
 * `assetsInlineLimit`, turning already-compressed woff2 into base64 that gzip
 * cannot shrink — roughly a third larger, in a render-blocking stylesheet, on
 * every cold load. It was measured at 42 KB → 163 KB when the vendored face was
 * 88 KB; the face is 44 KB now, so the penalty is smaller and just as pointless.
 * Copying the files and prepending the `@import` keeps the stylesheet at its own
 * size and leaves the font a separately cacheable asset. Consumers still import
 * one stylesheet.
 *
 * This script used to copy brand token layers out to `dist` as well. It no
 * longer does: the library ships one identity, the Neon Law teal, and it is
 * declared in `tokens.css` where the Vite build already sees it. A brand layer
 * is now something an app writes for itself — see `gallery/brand-example-
 * tokens.css` for the template — so there is nothing left here to copy.
 */

import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const pkg = resolve(here, '..')
const at = (...parts) => resolve(pkg, ...parts)

/* ------------------------------------------------- the exports map holds -- */

/* The one failure mode nothing else catches.
 *
 * `exports["./styles.css"]` points at a file this build produces. If the two
 * ever disagree — because the stylesheet was renamed, or because Vite derived a
 * new name from a renamed package — nothing fails here. The build succeeds, the
 * package publishes, and every consumer's `import '.../styles.css'` resolves to
 * nothing. The first report is an unstyled page in someone else's app.
 *
 * It has already happened once, when the package was renamed and Vite quietly
 * renamed `ux.css` to match. So it is asserted rather than remembered. */
const manifest = JSON.parse(await readFile(at('package.json'), 'utf8'))
const declared = manifest.exports?.['./styles.css']

if (typeof declared !== 'string') {
  throw new Error('package.json declares no exports["./styles.css"] for this build to satisfy.')
}

const stylesheet = declared.replace(/^\.\//, '')

try {
  await readFile(at(stylesheet))
} catch {
  throw new Error(
    `package.json exports "./styles.css" as ${declared}, which this build did not emit. ` +
      `Vite names the library stylesheet after the package unless it is pinned — see ` +
      `STYLESHEET in vite.config.ts — so check that the two still agree.`,
  )
}

/* --------------------------------------------------------- font layer -- */

/* The woff2 files, and the licence that has to travel with them.
 *
 * Source Serif 4 is under the OFL, which permits redistribution on the
 * condition that the copyright and licence notice go with the font. Copying
 * `OFL.txt` into `dist` beside the two binaries is how that condition is met
 * for consumers, who receive `dist` and nothing else. `THIRD-PARTY-NOTICES.md`
 * carries the same text for anyone reading the repository. */
const FONTS = [
  'src/assets/fonts/source-serif-4/SourceSerif4-Regular.woff2',
  'src/assets/fonts/source-serif-4/SourceSerif4-Bold.woff2',
  'src/assets/fonts/source-serif-4/OFL.txt',
]

await Promise.all(
  FONTS.map(async (font) => {
    await copyFile(at(font), at('dist', basename(font)))
    console.log(`emit: ${font} -> dist/${basename(font)}`)
  }),
)

// The source stylesheet points up and out of `src/styles` at the vendored
// files. In `dist` everything is siblings, so the paths flatten.
const fontCss = (await readFile(at('src/styles/fonts.css'), 'utf8')).replace(
  /url\('\.\.\/assets\/fonts\/source-serif-4\//g,
  "url('./",
)

const stillPointingUp = fontCss.match(/url\('(?!\.\/)[^']*'/g)
if (stillPointingUp) {
  throw new Error(
    `fonts.css has URLs the flattening step did not rewrite: ${stillPointingUp.join(', ')}. ` +
      `Every src/ font URL must be '../assets/fonts/source-serif-4/<file>'.`,
  )
}

await writeFile(at('dist/fonts.css'), fontCss)
console.log('emit: src/styles/fonts.css -> dist/fonts.css')

// Prepend rather than append: `@import` is only valid ahead of every rule.
const bundled = await readFile(at(stylesheet), 'utf8')
if (bundled.includes("@import './fonts.css'")) {
  throw new Error(`${stylesheet} already imports the font layer — is this script running twice?`)
}
await writeFile(at(stylesheet), `@import './fonts.css';\n${bundled}`)
console.log(`emit: prepended @import './fonts.css' to ${stylesheet}`)
