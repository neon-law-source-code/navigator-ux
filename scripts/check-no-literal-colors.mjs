/*
 * Gate: no literal color outside the token layer.
 *
 * The JavaScript counterpart of the Rust build's
 * `components_declare_no_literal_colors`. A literal color in a component pins
 * one brand's identity into code all three brands consume — and it does it
 * invisibly, because the component looks right in whichever brand the author
 * happened to be running.
 *
 * Two populations, one rule each:
 *
 *   Component source   No color at all. Components emit semantic class names;
 *                      color is the stylesheet's job.
 *   Stylesheets        No color except in the token layer. `tokens.css` and
 *                      any brand layer are where color is *defined*; every
 *                      other rule resolves it through `var(--nav-*)`.
 *
 * A boundary that lives only in a document erodes on the first deadline, so
 * this runs in `pnpm check` and fails the build.
 */

import { readFile, readdir } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// The gallery is covered too. It is the most visible code in the package and
// the easiest place for a hardcoded color to look reasonable.
const ROOTS = [join(pkg, 'src'), join(pkg, 'gallery')]

/** Where color is allowed to be written down.
 *
 * `tokens.css` is the shipped identity. The gallery's example layer is the
 * template an app copies to write its own brand, so it is a token layer too —
 * a brand layer that could not name a color would be useless. */
const TOKEN_LAYER = new Set(['src/styles/tokens.css', 'gallery/brand-example-tokens.css'])

/** Tests assert on color strings; that is not shipping a color. */
const isTest = (rel) => rel.startsWith('src/test/')

const PATTERNS = [
  { name: 'hex color', re: /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g },
  { name: 'rgb()/rgba()', re: /\brgba?\s*\(/g },
  { name: 'hsl()/hsla()', re: /\bhsla?\s*\(/g },
  { name: 'oklch()/oklab()', re: /\bokl(?:ch|ab)\s*\(/g },
  // The handful of named colors someone actually reaches for. `currentColor`,
  // `transparent`, and `inherit` are keywords, not colors, and stay legal.
  {
    name: 'named color',
    re: /(?<![\w-])(?:white|black|red|blue|green|yellow|orange|purple|gray|grey|silver|navy|teal|cyan|magenta)(?![\w-])/gi,
  },
]

/**
 * Blank comments out so prose about a color is not a color.
 *
 * Every character becomes a space and every newline is kept, rather than the
 * comment collapsing to a single space. That is what makes the reported line
 * numbers below exact: they are computed by counting newlines up to the match
 * offset, so a collapsing replacement shifts every offset after the first
 * comment — and in a file that opens with a header comment, that is all of them.
 */
function blankComments(text, ext) {
  const blank = (match) => match.replace(/[^\n]/g, ' ')
  const withoutBlock = text.replace(/\/\*[\s\S]*?\*\//g, blank)
  // CSS has no line comments; stripping `//` there would eat `url(//host)`,
  // which the other gate needs to see.
  return ext === '.css' ? withoutBlock : withoutBlock.replace(/\/\/[^\n]*/g, blank)
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else yield full
  }
}

async function* walkAll(dirs) {
  for (const dir of dirs) yield* walk(dir)
}

/*
 * Numeric character references are not colors.
 *
 * `&#8249;` is a single left angle quote, and `&#8722;` a minus sign — both
 * routine in a control that draws its own chevrons. The hex pattern reads the
 * `#8249` inside them as a four-digit color and fails the build, which is a
 * false positive that costs an afternoon to recognise: the reported "color"
 * does not appear anywhere in the file you are told to look at.
 *
 * Blanked to spaces rather than removed, so byte offsets — and therefore the
 * reported line numbers — stay true to the original text.
 */
function blankNumericEntities(text) {
  return text.replace(/&#(?:x[0-9a-fA-F]+|\d+);/g, (entity) => ' '.repeat(entity.length))
}

const failures = []
let scanned = 0

for await (const file of walkAll(ROOTS)) {
  const ext = extname(file)
  if (!['.ts', '.tsx', '.css'].includes(ext)) continue

  const rel = relative(pkg, file).split('\\').join('/')
  if (TOKEN_LAYER.has(rel) || isTest(rel)) continue

  scanned += 1
  const raw = await readFile(file, 'utf8')
  const text = blankNumericEntities(blankComments(raw, ext))

  for (const { name, re } of PATTERNS) {
    for (const match of text.matchAll(re)) {
      // Report the line from the original text so the number is navigable.
      const line = raw.slice(0, match.index).split('\n').length
      failures.push(`${rel}:${line}  ${name}: ${match[0].trim()}`)
    }
  }
}

if (failures.length > 0) {
  console.error('Literal colors outside the token layer:\n')
  for (const failure of failures) console.error(`  ${failure}`)
  console.error(
    `\n${failures.length} found. Route each through a --nav-* custom property, or, if it is a` +
      `\nnew token, declare it in src/styles/tokens.css with its contrast measured.`,
  )
  process.exit(1)
}

console.log(`no-literal-colors: clean (${scanned} files scanned)`)
