/*
 * Types for `fake.mjs`, written by hand. The implementation has to stay plain
 * JavaScript so `e2e/fixtures.mjs` can import it under bare `node`, and this
 * file is what lets the Vitest suite and the gallery import it under `strict`.
 * The two are kept in step by nothing but review; there is one function each.
 */

export interface FakePerson {
  firstName: string
  lastName: string
  name: string
  email: string
  initials: string
}

/** Keys name the role the datum plays: `fakePerson('feed-judge')`. */
export function fakePerson(key: string): FakePerson
export function fakeJudge(key: string): FakePerson
export function fakeName(key: string): string
export function fakeFirstName(key: string): string
export function fakeLastName(key: string): string
export function fakeEmail(key: string): string
export function fakeInitials(name: string): string
export function fakeCompany(key: string, suffix?: string): string
export function fakeCaption(key: string): string
export function fakeMatterCode(key: string): string
export function fakeSlug(key: string, words?: number): string
export function fakeWords(key: string, count?: number): string
export function fakeSentence(key: string): string
export function fakeSentences(key: string, count?: number): string
export function fakeParagraph(key: string, sentences?: number): string
export function fakeTitle(key: string, words?: number): string
