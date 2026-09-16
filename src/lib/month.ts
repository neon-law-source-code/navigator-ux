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

/*
 * `YYYY-MM-DD` to its three numbers, or null if it is not one.
 *
 * `parseMonth` substitutes the epoch for a malformed month because a calendar
 * with no grid at all is worse than one showing the wrong month. A date has the
 * opposite failure: a caller handed nonsense gets it back unchanged, so the bad
 * value stays visible instead of being laundered into January 1970.
 */
function parseDate(date: string): { year: number; monthNumber: number; day: number } | null {
  const [rawYear, rawMonth, rawDay] = date.split('-')
  if (rawYear === undefined || rawMonth === undefined || rawDay === undefined) return null
  const year = Number(rawYear)
  const monthNumber = Number(rawMonth)
  const day = Number(rawDay)
  if (!Number.isFinite(year) || !Number.isFinite(monthNumber) || !Number.isFinite(day)) return null
  return { year, monthNumber, day }
}

/** The `YYYY-MM` a `YYYY-MM-DD` falls in. */
export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/**
 * `YYYY-MM-DD` shifted by whole days, rolling over months and years.
 *
 * `Date.UTC` normalizes an out-of-range day, so August 33rd becomes September
 * 2nd and the leap year is the platform's problem rather than ours.
 */
export function shiftDate(date: string, by: number): string {
  const parts = parseDate(date)
  if (!parts) return date
  const shifted = new Date(Date.UTC(parts.year, parts.monthNumber - 1, parts.day + by))
  const shiftedMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0')
  return `${shifted.getUTCFullYear()}-${shiftedMonth}-${String(shifted.getUTCDate()).padStart(2, '0')}`
}

/**
 * A date's position in its week, counting from Monday at 0.
 *
 * Monday-based to match the grid. `getUTCDay` counts from Sunday, and mixing
 * the two conventions is what puts a week's first column one day out.
 */
export function weekdayIndex(date: string): number {
  const parts = parseDate(date)
  if (!parts) return 0
  const weekday = new Date(Date.UTC(parts.year, parts.monthNumber - 1, parts.day)).getUTCDay()
  return (weekday + 6) % 7
}

/** The long-form reading of a date, e.g. `August 14, 2026`. */
export function dateHeading(date: string): string {
  const parts = parseDate(date)
  if (!parts) return date
  return new Date(Date.UTC(parts.year, parts.monthNumber - 1, parts.day)).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
