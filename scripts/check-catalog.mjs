#!/usr/bin/env node
/*
 * The vendored marketing catalog must be the artifact Navigator exported.
 *
 * The exporter records a SHA-256 over the canonical payload — compact JSON
 * with every object key sorted. Recomputing it here is what turns "we vendored
 * Navigator's copy" into something provable: an edited artifact, a truncated
 * one, or one whose digest was copied from a different export all fail.
 *
 * Integrity is checked here rather than in the browser on purpose. The artifact
 * is immutable and committed, so verifying it once per build is the useful
 * moment; making every visitor hash it would buy nothing.
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const SUPPORTED_CATALOG_VERSION = 1
const root = process.cwd()
const artifact = 'gallery/content/marketing-catalog.json'

function fail(message) {
  console.error(`check:catalog — ${message}`)
  process.exit(1)
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
  }
  return value
}

const document = JSON.parse(readFileSync(resolve(root, artifact), 'utf8'))
const { integrity, payload } = document

if (payload?.catalog_version !== SUPPORTED_CATALOG_VERSION) {
  fail(`${artifact} declares version ${payload?.catalog_version}; this build reads ${SUPPORTED_CATALOG_VERSION}`)
}

if (!/^[0-9a-f]{40}$/.test(payload.source?.revision ?? '')) {
  fail(`${artifact} is pinned to \`${payload.source?.revision}\`, which is not an immutable commit`)
}

const digest = `sha256:${createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')}`
if (digest !== integrity) {
  fail(`${artifact} does not match its own digest.\n  recorded:   ${integrity}\n  recomputed: ${digest}\n  Re-export it from Navigator rather than editing it.`)
}

// Every reference the content files make must name a key the pinned catalog
// defines. A reference nobody authored would otherwise reach a reader as a
// literal brace.
const CONTENT = [
  'gallery/content/en.yaml',
  'gallery/content/pages/home.md',
  'gallery/content/pages/services.md',
  'gallery/content/pages/litigation.md',
  'gallery/content/pages/fractional-gc.md',
  'gallery/content/pages/personal-plan.md',
]
const referenced = new Set()
for (const file of CONTENT) {
  const raw = readFileSync(resolve(root, file), 'utf8')
  for (const match of raw.matchAll(/\{shared:([A-Za-z0-9_.]+)\}/g)) {
    const key = match[1]
    referenced.add(key)
    if (!(key in payload.entries)) {
      fail(`${file} references \`{shared:${key}}\`, which the pinned catalog does not define`)
    }
  }
}

if (referenced.size === 0) {
  fail('no content file references the shared catalog; the duplicate copy is back')
}

console.log(
  `check:catalog — ${artifact} v${payload.catalog_version} verified, ` +
    `${referenced.size} shared key(s) in use, pinned to ${payload.source.repository}@${payload.source.revision.slice(0, 12)}`,
)
