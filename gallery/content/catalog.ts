import catalogJson from './marketing-catalog.json'

/**
 * The shared marketing catalog, exported from Navigator at a pinned revision.
 *
 * Navigator authors the sentences this site and Navigator's own Dioxus pages
 * both publish. Rather than keeping a second copy of them here, we vendor a
 * generated artifact — `marketing-catalog.json` — and reference a key from the
 * YAML and Markdown that already drive this site.
 *
 * There is no runtime fetch and no dependency on Navigator's `main`: the
 * artifact records the exact 40-character commit it was produced from, and
 * updating the copy means re-exporting at a newer revision and committing the
 * result. See `docs/marketing-catalog.md`.
 */

/** The catalog version this build understands. */
export const SUPPORTED_CATALOG_VERSION = 1

export interface CatalogSource {
  path: string
  repository: string
  revision: string
}

export interface CatalogPayload {
  brands: Record<string, Record<string, string>>
  catalog_version: number
  entries: Record<string, string>
  source: CatalogSource
}

export interface CatalogDocument {
  generator: string
  integrity: string
  payload: CatalogPayload
}

const document = catalogJson as CatalogDocument

/**
 * Compact JSON with every object key sorted — the exact bytes the exporter's
 * SHA-256 digest covers. Reproducing them here is what lets `check:catalog`
 * and the contract tests prove the vendored artifact is the one that was
 * exported rather than one somebody edited by hand.
 */
export function canonicalPayload(payload: CatalogPayload): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical)
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.keys(value as Record<string, unknown>)
          .sort()
          .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
      )
    }
    return value
  }
  return JSON.stringify(canonical(payload))
}

/**
 * Refuse a catalog this build cannot render.
 *
 * A version mismatch is not something to paper over: a newer catalog may have
 * renamed a key this site reads, and rendering the half it still understands
 * would publish a page with a hole in it.
 */
export function assertSupported(payload: CatalogPayload): void {
  if (payload.catalog_version !== SUPPORTED_CATALOG_VERSION) {
    throw new Error(
      `marketing catalog: version ${payload.catalog_version} is not supported; this build reads version ${SUPPORTED_CATALOG_VERSION}`,
    )
  }
  if (!/^[0-9a-f]{40}$/.test(payload.source.revision)) {
    throw new Error(
      `marketing catalog: source revision \`${payload.source.revision}\` is not an immutable 40-character commit`,
    )
  }
}

assertSupported(document.payload)

/** The immutable Navigator revision this site's shared copy is pinned to. */
export const catalogSource: CatalogSource = document.payload.source

/** The recorded digest, checked against the payload by `check:catalog`. */
export const catalogIntegrity = document.integrity

export const catalogPayload: CatalogPayload = document.payload

/**
 * The wording for `key`.
 *
 * A brand's own override wins and otherwise the shared default is used — never
 * another brand's override, so an un-overridden sentence reads as the shared
 * one rather than a sibling brand's. A key nobody authored throws: a missing
 * sentence must fail the build, not render as an empty element.
 */
export function shared(key: string, brandKey = 'neon'): string {
  const override = document.payload.brands[brandKey]?.[key]
  if (override !== undefined) return override
  const value = document.payload.entries[key]
  if (value === undefined) {
    throw new Error(`marketing catalog: no entry for \`${key}\` (pinned at ${catalogSource.revision})`)
  }
  return value
}

/** Every key the pinned catalog defines. */
export function sharedKeys(): string[] {
  return Object.keys(document.payload.entries).sort()
}

const REFERENCE = /\{shared:([A-Za-z0-9_.]+)\}/g

/**
 * Replace every `{shared:<key>}` in a raw content file.
 *
 * This runs over the raw YAML and Markdown before either is parsed, exactly as
 * Navigator resolves the same token in its own catalogs, so a reference works
 * in any field without the content schema knowing about it.
 */
export function resolveShared(raw: string, brandKey = 'neon'): string {
  return raw.replace(REFERENCE, (_match, key: string) => shared(key, brandKey))
}

/** Every shared key a raw content file references. */
export function referencedKeys(raw: string): string[] {
  return [...raw.matchAll(REFERENCE)].map((match) => match[1] as string)
}
