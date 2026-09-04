/*
 * Gate: the typed client stays on the pinned OpenAPI snapshot.
 *
 * Fails when the generated schema is stale, when a path in the snapshot
 * leaves `/app/api`, or when the generated file carries an off-origin URL
 * that dts rollup would copy into dist.
 */

import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateApiTypes } from './generate-api-types.mjs'

const pkg = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const specPath = join(pkg, 'spec/openapi.json')
const schemaPath = join(pkg, 'src/api/schema.d.ts')

const URL_RE = /(?:https?:)?\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+(?::\d+)?[^\s'"`)<>\\]*/gi
const PERSON_ROLES = ['owner', 'admin', 'lawyer', 'clerk', 'client']

const spec = JSON.parse(await readFile(specPath, 'utf8'))
const failures = []

const paths = Object.keys(spec.paths ?? {})
if (paths.length === 0) failures.push('spec/openapi.json has no paths')

for (const path of paths) {
  if (path !== '/app/api' && !path.startsWith('/app/api/')) {
    failures.push(`path outside /app/api: ${path}`)
  }
}

const roles = spec.components?.schemas?.PersonRole?.enum
if (!Array.isArray(roles) || roles.join() !== PERSON_ROLES.join()) {
  failures.push(`PersonRole enum drifted (want ${PERSON_ROLES.join(', ')}; got ${roles ?? 'missing'})`)
}

const specText = await readFile(specPath, 'utf8')
for (const match of specText.matchAll(URL_RE)) {
  failures.push(`spec/openapi.json carries an off-origin URL: ${match[0]}`)
}

const scratch = await mkdtemp(join(tmpdir(), 'navigator-ux-api-check-'))
const fresh = join(scratch, 'schema.d.ts')
await generateApiTypes(fresh)

const committed = await readFile(schemaPath, 'utf8')
const generated = await readFile(fresh, 'utf8')
if (committed !== generated) {
  failures.push(
    `${relative(pkg, schemaPath)} is stale — run pnpm generate:api and commit the result`,
  )
}

for (const match of generated.matchAll(URL_RE)) {
  failures.push(`generated schema carries an off-origin URL: ${match[0]}`)
}

if (failures.length > 0) {
  console.error('API contract violations:\n')
  for (const failure of failures) console.error(`  ${failure}`)
  process.exit(1)
}

console.log(`check:api: clean (${paths.length} paths, schema current)`)
