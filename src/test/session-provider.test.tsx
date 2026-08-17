import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider, useSession } from '../session/SessionProvider'

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

/** Renders the session state as text so assertions read plainly. */
function Probe() {
  const { status, session, expiresIn, error } = useSession()
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="sub">{session?.sub ?? 'none'}</span>
      <span data-testid="expires">{expiresIn ?? 'n/a'}</span>
      <span data-testid="error">{error?.message ?? 'none'}</span>
    </div>
  )
}

const NOW = 1_700_000_000_000 // fixed clock; Date.now() is stubbed per test

function sessionExpiringIn(seconds: number) {
  return { sub: 'attorney@example.com', role: 'admin', exp: Math.floor(NOW / 1000) + seconds }
}

// `shouldAdvanceTime` lets the session fetch settle, since a promise resolves on
// a microtask that no amount of timer advancing reaches. It also means the fake
// clock moves on its own between statements, so a test that wants to reach
// expiry advances the timers and lets them carry the clock — `setSystemTime`
// moves `Date.now()` while leaving every scheduled interval at its original due
// time, and the two then disagree about what "now" is. That combination passed
// alone and failed about four runs in five under the load of the coverage pass.
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('SessionProvider', () => {
  it('reports the authenticated subject and remaining time', async () => {
    respondWith(200, sessionExpiringIn(3600))
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.getByTestId('sub')).toHaveTextContent('attorney@example.com')
    expect(screen.getByTestId('expires')).toHaveTextContent('3600')
  })

  it('treats a 401 as signed out, not as an error', async () => {
    respondWith(401)
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
    expect(screen.getByTestId('error')).toHaveTextContent('none')
  })

  // A broken gateway must not read as "logged out", or a transient blip
  // bounces an authenticated reader to login.
  it('surfaces a gateway fault as an error rather than signing the reader out', async () => {
    respondWith(500)
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'))
    expect(screen.getByTestId('error')).toHaveTextContent('session endpoint returned 500')
  })

  it('warns before the session lapses', async () => {
    respondWith(200, sessionExpiringIn(120))
    render(
      <SessionProvider warnBeforeSeconds={300}>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('2:00')
    expect(screen.getByRole('button', { name: 'Stay signed in' })).toBeInTheDocument()
  })

  it('stays quiet while the session is comfortably alive', async () => {
    respondWith(200, sessionExpiringIn(3600))
    render(
      <SessionProvider warnBeforeSeconds={300}>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('counts down as the clock advances and signs out at expiry', async () => {
    respondWith(200, sessionExpiringIn(3))
    render(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    )

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'))
  })

  it('redirects on expiry only when asked to', async () => {
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign, pathname: '/northwind/review-0724/', search: '' },
    })
    respondWith(200, sessionExpiringIn(2))

    render(
      <SessionProvider redirectOnExpiry loginPath="/__login">
        <Probe />
      </SessionProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('/__login?return_to=%2Fnorthwind%2Freview-0724%2F'),
    )
  })

  it('refuses to be used outside its provider', () => {
    // The thrown error is the whole point; silence React's error logging.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/inside a <SessionProvider>/)
  })
})
