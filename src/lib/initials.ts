/**
 * The initials shown when a person has no portrait.
 *
 * Two characters at most, from the first and last whitespace-separated parts.
 * Shared by `Avatar` and `TestimonialCard`, which had grown separate copies
 * that were already one edge case apart.
 *
 * Deliberately naive, and it will get plenty of names wrong — mononyms,
 * particles, non-Latin scripts, anyone whose family name comes first. That is
 * why every caller takes an `initials` override: this is the fallback for the
 * fallback, not an opinion about what a name is.
 */
export function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''

  const first = parts[0]
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined

  return [first, last]
    .filter((part): part is string => Boolean(part))
    .map((part) => [...part][0]?.toUpperCase() ?? '')
    .join('')
}
