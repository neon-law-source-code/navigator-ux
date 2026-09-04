/**
 * Client-side view of the Navigator session.
 *
 * The Pingora gateway in front of each Neon Law app is the only thing that
 * verifies the `navigator_session` JWT — the browser never sees the signing
 * key and must never try to validate the token itself. The gateway exposes
 * the already-verified claims at `/__session` on the same origin, and this
 * module is a typed reader for that endpoint.
 *
 * Claims mirror `portal::session::SessionData` in the Navigator workspace:
 * `sub` (subject), `exp` (unix seconds), and `role`.
 */

import type { components } from '../api/schema'

/** Roles as declared by `PersonRole` in the pinned OpenAPI snapshot. */
export type SessionRole = components['schemas']['PersonRole']

export interface Session {
  /** Subject — the authenticated principal, usually an email address. */
  sub: string
  /** Expiry, in unix seconds, taken from the verified JWT. */
  exp: number
  role: SessionRole
}

/** The endpoint the gateway serves with the verified claims. */
export const SESSION_ENDPOINT = '/__session'

/** Where the gateway sends an unauthenticated or expired reader. */
export const LOGIN_PATH = '/__login'

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000)
}

export function secondsRemaining(session: Session, now = nowUnix()): number {
  return session.exp - now
}

export function isExpired(session: Session, now = nowUnix()): boolean {
  return secondsRemaining(session, now) <= 0
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.sub === 'string' &&
    typeof candidate.exp === 'number' &&
    Number.isFinite(candidate.exp) &&
    typeof candidate.role === 'string'
  )
}

/**
 * Read the verified session from the gateway.
 *
 * Returns `null` when the gateway reports no session (401/403) so callers can
 * redirect. Any other failure throws, because a broken gateway must not be
 * mistaken for a signed-out reader.
 */
export async function fetchSession(
  endpoint: string = SESSION_ENDPOINT,
  init?: RequestInit,
): Promise<Session | null> {
  const response = await fetch(endpoint, {
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
    ...init,
  })

  if (response.status === 401 || response.status === 403) {
    return null
  }

  if (!response.ok) {
    throw new Error(`session endpoint returned ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (!isSession(payload)) {
    throw new Error('session endpoint returned an unrecognized payload')
  }

  // A token the gateway let through but which has since lapsed is treated as
  // signed out rather than trusted.
  return isExpired(payload) ? null : payload
}

/** Send the reader to Navigator to re-authenticate, preserving their place. */
export function redirectToLogin(loginPath: string = LOGIN_PATH): void {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
  window.location.assign(`${loginPath}?return_to=${returnTo}`)
}
