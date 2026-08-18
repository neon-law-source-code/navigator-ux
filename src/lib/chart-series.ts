/*
 * The categorical series palette, as token references.
 *
 * A separate module from `Charts.tsx` because both the charts and `GraphView`
 * need it, and because a file that exports a plain function beside a component
 * breaks fast refresh — the lint rule that says so is right.
 */

const SERIES_TOKENS = [
  'var(--nav-chart-1)',
  'var(--nav-chart-2)',
  'var(--nav-chart-3)',
  'var(--nav-chart-4)',
  'var(--nav-chart-5)',
  'var(--nav-chart-6)',
] as const

/** How many distinct series the palette can carry before it repeats. */
export const SERIES_COUNT = SERIES_TOKENS.length

/** The color for series `index`, wrapping at six. */
export function seriesColor(index: number): string {
  // Negative and fractional indices are caller error rather than a crash: a
  // chart missing a color is a chart nobody can read, so it falls to series 1.
  const slot = Math.abs(Math.trunc(index)) % SERIES_TOKENS.length
  return SERIES_TOKENS[slot] ?? SERIES_TOKENS[0]
}
