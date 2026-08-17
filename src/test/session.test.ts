import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSession, isExpired, secondsRemaining, type Session } from '../session/session'

function session(overrides: Partial<Session> = {}): Session {
  return { sub: 'attorney@example.com', role: 'admin', exp: 4_000_000_000, ...overrides }
}

function respondWith(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('session claims', () => {
  it('counts down against the JWT expiry', () => {
    const now = 1_000
    expect(secondsRemaining(session({ exp: 1_300 }), now)).toBe(300)
    expect(isExpired(session({ exp: 1_300 }), now)).toBe(false)
    expect(isExpired(session({ exp: 1_000 }), now)).toBe(true)
  })
})

describe('fetchSession', () => {
  it('returns the verified claims the gateway reports', async () => {
    respondWith(200, session())
    await expect(fetchSession()).resolves.toEqual(session())
  })

  it('treats 401 and 403 as signed out rather than as failures', async () => {
    respondWith(401)
    await expect(fetchSession()).resolves.toBeNull()
    respondWith(403)
    await expect(fetchSession()).resolves.toBeNull()
  })

  it('reports an already-lapsed token as signed out', async () => {
    respondWith(200, session({ exp: 1 }))
    await expect(fetchSession()).resolves.toBeNull()
  })

  // A 500 from the proxy must not read as "this person is logged out", or the
  // app would bounce an authenticated reader to login on a transient blip.
  it('throws when the gateway itself is broken', async () => {
    respondWith(500)
    await expect(fetchSession()).rejects.toThrow('session endpoint returned 500')
  })

  it('rejects a payload that is not a session', async () => {
    respondWith(200, { sub: 'nick', exp: 'soon' })
    await expect(fetchSession()).rejects.toThrow('unrecognized payload')
  })

  // `typeof null === 'object'`, so null needs its own guard.
  it('rejects a null or non-object payload', async () => {
    respondWith(200, null)
    await expect(fetchSession()).rejects.toThrow('unrecognized payload')
    respondWith(200, 'not-a-session')
    await expect(fetchSession()).rejects.toThrow('unrecognized payload')
  })
})
