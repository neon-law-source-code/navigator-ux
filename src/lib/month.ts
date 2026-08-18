/*
 * Month arithmetic for the calendar grid.
 *
 * All UTC. A grid built from local-time `Date`s puts the month boundary in the
 * wrong place for anyone east or west of the server, and the bug only shows for
 * readers in some timezones — which is how it ships.
 */

/**
 * `YYYY-MM` to its parts.
 *
 * A malformed month falls back to the epoch rather than producing `NaN` dates,
 * which render as an empty grid with no clue why.
 */
export function parseMonth(month: string): { year: number; monthNumber: number } {
  const [rawYear, rawMonth] = month.split('-')
  const year = Number(rawYear)
  const monthNumber = Number(rawMonth)
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber)) {
    return { year: 1970, monthNumber: 1 }
  }
  return { year, monthNumber }
}

/** Days in `YYYY-MM`, and the Monday-based weekday index its first falls on. */
export function monthShape(month: string): { days: number; offset: number } {
  const { year, monthNumber } = parseMonth(month)
  // Day 0 of the next month is the last day of this one.
  const days = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  const firstWeekday = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay()
  // getUTCDay is Sunday-based; these grids are Monday-based.
  return { days, offset: (firstWeekday + 6) % 7 }
}

/** `YYYY-MM` shifted by whole months, wrapping the year. */
export function shiftMonth(month: string, by: number): string {
  const { year, monthNumber } = parseMonth(month)
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + by, 1))
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`
}

/** The long-form heading for a month, e.g. `August 2026`. */
export function monthHeading(month: string): string {
  const { year, monthNumber } = parseMonth(month)
  return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
