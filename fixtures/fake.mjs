/*
 * Every name, address, and sentence of specimen data in this repository comes
 * from here. CLAUDE.md carries the rule and what generating a name does not
 * buy; this file is the mechanism.
 *
 * It lives outside `src/` because coverage counts `src/**`, and a generator
 * that exists to feed tests should not be graded by them. It is plain `.mjs`
 * with a hand-written `fake.d.mts` beside it because it has three consumers on
 * two runtimes: the Vitest suite and the gallery (bundled, TypeScript) and
 * `e2e/fixtures.mjs` (bare `node`, no TS loader).
 *
 * # Why every generator takes a key
 *
 * faker is a single instance holding one PRNG cursor, so `faker.seed(1)` makes
 * a *sequence* reproducible, not a call. Two modules drawing from that cursor
 * get values that depend on which of them was evaluated first — and Vitest
 * gives a worker several test files in an order that is its business, not ours.
 * Seeding once at import would buy determinism within a file and lose it across
 * the suite.
 *
 * So the key, not the cursor, decides the value: each generator reseeds from a
 * hash of the string it is handed. `fakePerson('feed/judge')` is the same
 * person in every process, in any call order. Keys are read by humans in
 * failure output, so name them for the role the datum plays.
 */

import { faker } from '@faker-js/faker'

/*
 * FNV-1a. Any stable string→uint32 would do; this one is eight lines and needs
 * no dependency. `>>> 0` after the multiply is what keeps it in uint32 — a bare
 * `*` in JS silently leaves float territory at these magnitudes.
 */
function seedFrom(key) {
  let hash = 0x811c9dc5
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash
}

function at(key) {
  faker.seed(seedFrom(key))
  return faker
}

/** Two letters for an avatar, derived the same way `src/lib/initials.ts` does. */
export function fakeInitials(name) {
  const words = name.replace(/^(Judge|Hon\.|Dr\.|Mr\.|Ms\.|Mx\.)\s+/, '').split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * A person, with the address derived from the same draw so the two agree —
 * a fixture whose email belongs to a different name is a fixture that reads
 * as a copy-paste slip.
 */
export function fakePerson(key) {
  const generator = at(key)
  const firstName = generator.person.firstName()
  const lastName = generator.person.lastName()
  const name = `${firstName} ${lastName}`
  return {
    firstName,
    lastName,
    name,
    email: generator.internet
      .email({ firstName, lastName, provider: 'example.com' })
      .toLowerCase(),
    initials: fakeInitials(name),
  }
}

export function fakeName(key) {
  return fakePerson(key).name
}

export function fakeFirstName(key) {
  return fakePerson(key).firstName
}

export function fakeLastName(key) {
  return fakePerson(key).lastName
}

export function fakeEmail(key) {
  return fakePerson(key).email
}

/** A judge, titled. The title is ours; only the name is drawn. */
export function fakeJudge(key) {
  const person = fakePerson(key)
  return { ...person, name: `Judge ${person.name}` }
}

/**
 * A company, with the entity suffix supplied rather than drawn — the suffix is
 * a legal fact about the entity (an LLC is not an Inc.) and the specimen data
 * has to stay consistent with whatever `entity_type` sits beside it.
 */
export function fakeCompany(key, suffix = '') {
  const base = at(key)
    .company.name()
    // faker appends its own suffix and joins two surnames with a spaced
    // hyphen; both read as generator output rather than as a party name.
    .replace(/,?\s+(Inc|LLC|Ltd|Group|and Sons)\.?$/i, '')
    .replace(/\s+-\s+/g, '-')
  return suffix ? `${base} ${suffix}` : base
}

/**
 * A case caption: family name against company, the shape a docket actually
 * takes. Both halves are drawn from the one key, so a caption and the parties
 * elsewhere in the same specimen can be keyed together.
 */
export function fakeCaption(key) {
  return `${fakeLastName(`${key}/plaintiff`)} v. ${fakeCompany(`${key}/defendant`)}`
}

/** A docket-style matter code: two letters and four digits, e.g. `KH-4182`. */
export function fakeMatterCode(key) {
  const generator = at(key)
  const letters = generator.string.alpha({ length: 2, casing: 'upper' })
  return `${letters}-${generator.string.numeric({ length: 4, allowLeadingZeros: true })}`
}

/** Lowercase, hyphenated, safe in a URL path or a project code. */
export function fakeSlug(key, words = 2) {
  return at(key)
    .lorem.words(words)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
}

export function fakeWords(key, count = 3) {
  return at(key).lorem.words(count)
}

export function fakeSentence(key) {
  return at(key).lorem.sentence()
}

export function fakeSentences(key, count = 3) {
  return at(key).lorem.sentences(count)
}

export function fakeParagraph(key, sentences = 4) {
  return at(key).lorem.paragraph(sentences)
}

/** Capitalized lorem, for a title or a heading where sentence case reads wrong. */
export function fakeTitle(key, words = 3) {
  return fakeWords(key, words)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
