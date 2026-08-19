import type { SortDirection } from '../components/DataTable'

/*
 * The JSON:API sort query parameter — <https://jsonapi.org/format/#fetching-sorting>.
 *
 * A JSON:API server reads one `sort` value: a comma-separated field list,
 * each field optionally led by `-` for descending. `sort=-created,name` is
 * "newest first, ties broken by name" in one string. `DataTable` already
 * takes its sort state through caller-owned URLs and has no opinion of its
 * own on the query string — this is that opinion, written once so every
 * consuming app reads and writes the same `sort` value the server expects
 * instead of each inventing its own `?sort=x&dir=y` pair.
 */

export interface SortDescriptor {
  /** The field name as JSON:API and the server both know it. */
  key: string
  direction: SortDirection
}

/** Parses a `sort` value into ordered descriptors. Missing or empty input sorts by nothing. */
export function parseJsonApiSort(sort: string | null | undefined): SortDescriptor[] {
  if (!sort) return []
  return sort
    .split(',')
    .map((field) => field.trim())
    .filter(Boolean)
    .map((field) =>
      field.startsWith('-')
        ? { key: field.slice(1), direction: 'desc' as const }
        : { key: field, direction: 'asc' as const },
    )
}

/** The inverse of {@link parseJsonApiSort} — descriptors back into one `sort` value. */
export function serializeJsonApiSort(sorts: SortDescriptor[]): string {
  return sorts.map((sort) => (sort.direction === 'desc' ? `-${sort.key}` : sort.key)).join(',')
}

export interface ToggleJsonApiSortOptions {
  /**
   * Keep the other columns as tiebreakers instead of replacing them.
   * `DataTable` only ever highlights one active column, so this is for a
   * custom sortable header built on the `Table` primitives.
   */
  multi?: boolean
}

/**
 * The descriptor list after a reader clicks column `key`.
 *
 * Clicking the current primary column reverses it in place; clicking any
 * other column promotes it to primary, ascending — the same rule `DataTable`
 * already applies to a single column, generalized to a list so it also
 * covers multi-field JSON:API sort.
 */
export function toggleJsonApiSort(
  current: SortDescriptor[],
  key: string,
  options?: ToggleJsonApiSortOptions,
): SortDescriptor[] {
  const existing = current.find((sort) => sort.key === key)
  const toggled: SortDescriptor = {
    key,
    direction: existing?.direction === 'asc' ? 'desc' : 'asc',
  }

  if (!options?.multi) return [toggled]

  const rest = current.filter((sort) => sort.key !== key)
  return existing ? [toggled, ...rest] : [...rest, toggled]
}
