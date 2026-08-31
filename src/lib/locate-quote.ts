/**
 * Split a record excerpt around a quoted span so the matching words can be
 * marked. The match is literal: a brief that paraphrases the record will not
 * light up, which is the point of "cite the record".
 */
export function locateQuote(
  excerpt: string,
  quote: string,
): { before: string; match: string; after: string; found: boolean } {
  if (quote.length === 0) {
    return { before: excerpt, match: '', after: '', found: false }
  }
  const index = excerpt.indexOf(quote)
  if (index === -1) {
    return { before: excerpt, match: '', after: '', found: false }
  }
  return {
    before: excerpt.slice(0, index),
    match: excerpt.slice(index, index + quote.length),
    after: excerpt.slice(index + quote.length),
    found: true,
  }
}
