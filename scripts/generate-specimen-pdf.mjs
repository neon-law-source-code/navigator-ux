/*
 * Generates the one specimen PDF the gallery ships: a synthetic complaint in
 * the invented matter `Vance v. Northwind` (see `gallery/outline-specimen.tsx`,
 * the same caption the Harvard-outline and cite-the-record specimens use).
 *
 * The file is never committed — CLAUDE.md bans binaries outright, and `.pdf`
 * is blocked in `.gitignore` with no exception. This script is the "generate
 * it from source" side of that rule: it writes into `gallery/public/`, which
 * Vite serves as a same-origin static asset in `pnpm gallery` and copies
 * verbatim into `gallery-dist` on a build, so `PdfViewer` can load a real,
 * selectable-text PDF without ever pointing at a CDN or committing a file.
 *
 * Runs as a `pre*` hook ahead of every gallery script in package.json, so it
 * never goes stale relative to what the gallery expects to find.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '..', 'gallery', 'public', 'specimens')
const outFile = resolve(outDir, 'vance-v-northwind-complaint.pdf')

const PAGE = { width: 612, height: 792 } // US Letter, in points.
const MARGIN = { top: 96, left: 96, right: 96, bottom: 96 }

const BODY = [
  'Plaintiff Adaeze Vance, by and through undersigned counsel, alleges as follows:',
  '',
  'NATURE OF THE ACTION',
  '',
  '1. This is an action for breach of contract arising from a supply agreement between Vance ' +
    'and Defendant Northwind Holdings, Inc. dated 14 March 2023 (the "Agreement").',
  '2. Section 8.2 of the Agreement entitles Northwind to thirty days’ written notice and an ' +
    'opportunity to cure any alleged default before Vance may terminate or seek damages.',
  '3. Northwind failed to perform its delivery obligations under the Agreement, and the cure ' +
    'period Section 8.2 promises never ran before Vance’s losses became irreversible.',
  '',
  'PARTIES',
  '',
  '4. Plaintiff Adaeze Vance is an individual residing in Clark County, Nevada.',
  '5. Defendant Northwind Holdings, Inc. is a Nevada corporation with its principal place of ' +
    'business in Las Vegas, Nevada.',
  '',
  'FIRST CLAIM FOR RELIEF',
  '(Breach of Contract)',
  '',
  '6. Vance realleges and incorporates by reference each preceding paragraph.',
  '7. The Agreement is a valid and enforceable contract between Vance and Northwind.',
  '8. Northwind breached the Agreement by failing to deliver the goods described in Exhibit A ' +
    'by the delivery date the Agreement required.',
  '9. Vance has performed all conditions, covenants, and promises required on her part under ' +
    'the Agreement.',
  '10. As a direct and proximate result of Northwind’s breach, Vance has suffered damages in ' +
    'an amount to be proven at trial.',
  '',
  'PRAYER FOR RELIEF',
  '',
  'WHEREFORE, Plaintiff Adaeze Vance respectfully requests that this Court enter judgment in ' +
    'her favor and against Defendant Northwind Holdings, Inc. for damages, costs, and such ' +
    'other relief as the Court deems just and proper.',
]

function wrap(text, font, size, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line || lines.length === 0) lines.push(line)
  return lines
}

async function main() {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Complaint — Vance v. Northwind (specimen)')
  pdf.setAuthor('Navigator UX gallery')
  pdf.setSubject('Invented specimen document. No real matter, no real parties.')

  const serif = await pdf.embedFont(StandardFonts.TimesRoman)
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold)

  const contentWidth = PAGE.width - MARGIN.left - MARGIN.right
  const lineHeight = 16
  const bodySize = 11

  let page = pdf.addPage([PAGE.width, PAGE.height])
  let cursor = PAGE.height - MARGIN.top

  function newPage() {
    page = pdf.addPage([PAGE.width, PAGE.height])
    cursor = PAGE.height - MARGIN.top
  }

  function ensureSpace(needed) {
    if (cursor - needed < MARGIN.bottom) newPage()
  }

  function drawLine(text, { font = serif, size = bodySize, indent = 0 } = {}) {
    ensureSpace(lineHeight)
    page.drawText(text, {
      x: MARGIN.left + indent,
      y: cursor - size,
      size,
      font,
      color: rgb(0.09, 0.09, 0.09),
    })
    cursor -= lineHeight
  }

  drawLine('DISTRICT COURT, CLARK COUNTY, NEVADA', { font: serifBold, size: 12 })
  cursor -= lineHeight / 2
  drawLine('ADAEZE VANCE,', { font: serifBold })
  drawLine('    Plaintiff,')
  drawLine('v.', { font: serifBold })
  drawLine('NORTHWIND HOLDINGS, INC.,', { font: serifBold })
  drawLine('    Defendant.')
  cursor -= lineHeight
  drawLine('Case No. CV-26-041782', { font: serifBold })
  cursor -= lineHeight
  drawLine('COMPLAINT', { font: serifBold, size: 13 })
  cursor -= lineHeight / 2

  for (const paragraph of BODY) {
    if (paragraph === '') {
      cursor -= lineHeight / 2
      continue
    }
    const isHeading = paragraph === paragraph.toUpperCase() && /[A-Z]/.test(paragraph)
    const font = isHeading ? serifBold : serif
    for (const line of wrap(paragraph, font, bodySize, contentWidth)) {
      drawLine(line, { font })
    }
  }

  cursor -= lineHeight
  drawLine('Respectfully submitted,')
  cursor -= lineHeight
  drawLine('/s/ Sample Counsel', { font: serifBold })
  drawLine('Attorney for Plaintiff Adaeze Vance')

  const bytes = await pdf.save()
  await mkdir(outDir, { recursive: true })
  await writeFile(outFile, bytes)
  console.log(`generate-specimen-pdf: wrote ${bytes.byteLength} bytes to gallery/public/specimens/${outFile.split('/').pop()}`)
}

await main()
