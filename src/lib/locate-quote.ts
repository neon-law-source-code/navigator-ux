function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Split a record excerpt around a quoted span so the matching words can be
 * marked.
 *
 * The match is literal apart from whitespace. Every run of whitespace in the
 * quote matches any run in the excerpt — a line break included — because the
 * record is notation text that wraps where the source wrapped, and a brief
 * quotes it on one line. Anything else has to be character-for-character: a
 * paraphrase does not light up, and neither does a quote one word off. That
 * exactness is the function. A cite that matches was copied, not remembered.
 */
export function locateQuote(
  excerpt: string,
  quote: string,
): { before: string; match: string; after: string; found: boolean } {
  const words = quote.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return { before: excerpt, match: '', after: '', found: false }
  }
  const found = new RegExp(words.map(escapeRegExp).join('\\s+')).exec(excerpt)
  if (!found) {
    return { before: excerpt, match: '', after: '', found: false }
  }
  const end = found.index + found[0].length
  return {
    before: excerpt.slice(0, found.index),
    match: found[0],
    after: excerpt.slice(end),
    found: true,
  }
}
