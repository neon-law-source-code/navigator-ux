import { describe, expect, it } from 'vitest'

import {
  assertSupported, canonicalPayload, catalogIntegrity, catalogPayload, catalogSource,
  resolveShared, shared, sharedKeys, SUPPORTED_CATALOG_VERSION, type CatalogPayload,
} from '../../gallery/content/catalog'
import { en, pages } from '../../gallery/content/load'
import enRaw from '../../gallery/content/en.yaml?raw'
import fractionalGcRaw from '../../gallery/content/pages/fractional-gc.md?raw'
import homeRaw from '../../gallery/content/pages/home.md?raw'
import litigationRaw from '../../gallery/content/pages/litigation.md?raw'
import personalPlanRaw from '../../gallery/content/pages/personal-plan.md?raw'
import servicesRaw from '../../gallery/content/pages/services.md?raw'

/** The content files as authored, before any shared reference is resolved. */
const CONTENT_FILES: [string, string][] = [
  ['en.yaml', enRaw],
  ['pages/home.md', homeRaw],
  ['pages/services.md', servicesRaw],
  ['pages/litigation.md', litigationRaw],
  ['pages/fractional-gc.md', fractionalGcRaw],
  ['pages/personal-plan.md', personalPlanRaw],
]

/*
 * The same SHA-256 the exporter recorded, over the same canonical bytes.
 * Web Crypto rather than `node:crypto` so the check runs wherever the suite
 * does and needs no extra dependency.
 */
async function digest(payload: CatalogPayload) {
  const bytes = new TextEncoder().encode(canonicalPayload(payload))
  const hash = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `sha256:${hex}`
}

describe('the pinned marketing catalog', () => {
  it('matches the digest the exporter recorded', async () => {
    expect(await digest(catalogPayload)).toBe(catalogIntegrity)
  })

  it('fails its digest once a single entry is edited', async () => {
    const edited: CatalogPayload = {
      ...catalogPayload,
      entries: { ...catalogPayload.entries, 'litigation.title': 'Something nobody authored.' },
    }
    expect(await digest(edited)).not.toBe(catalogIntegrity)
  })

  it('names an immutable Navigator revision rather than a branch', () => {
    expect(catalogSource.repository).toBe('neon-law-source-code/navigator')
    expect(catalogSource.revision).toMatch(/^[0-9a-f]{40}$/)
    expect(catalogSource.path).toBe('neon/locales/en/shared.yaml')
    expect(catalogPayload.catalog_version).toBe(SUPPORTED_CATALOG_VERSION)
  })

  it('refuses a catalog version this build does not read', () => {
    expect(() => assertSupported({ ...catalogPayload, catalog_version: 99 })).toThrow(
      /version 99 is not supported/,
    )
  })

  it('refuses a pin that is not an immutable commit', () => {
    expect(() =>
      assertSupported({ ...catalogPayload, source: { ...catalogSource, revision: 'main' } }),
    ).toThrow(/not an immutable 40-character commit/)
  })
})

describe('shared lookup', () => {
  it('throws for a key nobody authored rather than rendering nothing', () => {
    expect(() => shared('home.nobody_wrote_this')).toThrow(/no entry for `home.nobody_wrote_this`/)
  })

  /*
   * A brand reads its own override and otherwise the shared default. It never
   * reads a different brand's override: that would put one brand's wording on
   * another brand's page, which is worse than showing the shared sentence.
   */
  it('falls back to the shared default, never to another brand', () => {
    expect(shared('litigation.title', 'a-brand-with-no-overrides')).toBe(
      catalogPayload.entries['litigation.title'],
    )
    expect(shared('litigation.title')).toBe(catalogPayload.entries['litigation.title'])
  })

  it('leaves a non-reference brace alone', () => {
    expect(resolveShared('a {shared:litigation.cta} b {not_a_reference} c')).toBe(
      `a ${shared('litigation.cta')} b {not_a_reference} c`,
    )
  })
})

describe('the content files consume the catalog rather than duplicating it', () => {
  it('references only keys the pinned catalog defines', () => {
    const defined = new Set(sharedKeys())
    const referenced = new Set<string>()
    for (const [name, raw] of CONTENT_FILES) {
      for (const match of raw.matchAll(/\{shared:([A-Za-z0-9_.]+)\}/g)) {
        referenced.add(match[1] as string)
        expect(defined, `${name} references {shared:${match[1]}}`).toContain(match[1])
      }
    }
    expect(referenced.size).toBeGreaterThan(0)
  })

  /*
   * The point of the migration: the sentence is no longer written down here.
   * Comparing the loaded value to the catalog would pass even if the YAML
   * still held its own copy, so check the raw file too.
   */
  it('no longer writes the shared sentences down in this repository', () => {
    const everyFile = CONTENT_FILES.map(([, raw]) => raw).join('\n')
    for (const key of sharedKeys()) {
      expect(everyFile, `${key} is duplicated in this repository`).not.toContain(shared(key))
    }
  })

  it('loads the catalog wording through the real YAML and Markdown pipeline', () => {
    expect(en.find.prompt).toBe(shared('home.need_prompt'))
    expect(en.subscriptions.title).toBe(shared('services.subscriptions_heading'))
    expect(en.catalog.title).toBe(shared('services.catalog_heading'))
    expect(en.litigation.cta).toBe(shared('litigation.cta'))
    expect(en.plans[0]?.amount).toBe(shared('fractional_gc.price'))
    expect(en.plans[0]?.highlights).toContain(shared('fractional_gc.included.response_window'))
    expect(en.plans[0]?.features).toContain(shared('fractional_gc.included.ownership'))
    expect(en.plans[1]?.amount).toBe(shared('personal_plan.price'))
    expect(en.plans[1]?.highlights).toContain(shared('personal_plan.included.credit_monitoring'))

    expect(pages.home.matter.title).toBe(shared('home.mission_heading'))
    expect(pages.home.matter.lede.trim()).toBe(shared('home.mission_north_star'))
    expect(pages.home.body).toContain(shared('home.mission_promise'))
    expect(pages.services.matter.eyebrow).toBe(shared('services.eyebrow'))
    expect(pages.services.matter.title).toBe(shared('services.title'))
    expect(pages.services.matter.lede.trim()).toBe(shared('services.lede'))
    expect(pages['fractional-gc'].matter.title).toBe(shared('fractional_gc.title'))
    expect(pages['fractional-gc'].matter.lede.trim()).toBe(shared('fractional_gc.lede'))
    expect(pages['personal-plan'].matter.title).toBe(shared('personal_plan.title'))
    expect(pages.litigation.matter.title).toBe(shared('litigation.title'))
    expect(pages.litigation.matter.primary?.label).toBe(shared('litigation.cta'))
    expect(pages.litigation.body).toContain(shared('litigation.cases_help_others'))
  })

  it('leaves no unresolved reference anywhere the reader can see', () => {
    const loaded = [JSON.stringify(en), JSON.stringify(pages)].join('\n')
    expect(loaded).not.toContain('{shared:')
  })
})
