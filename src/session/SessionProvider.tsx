import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchSession,
  isExpired,
  nowUnix,
  redirectToLogin,
  secondsRemaining,
  type Session,
} from './session'

type Status = 'loading' | 'authenticated' | 'anonymous' | 'error'

interface SessionContextValue {
  status: Status
  session: Session | null
  error: Error | null
  /** Seconds until the JWT lapses; null when there is no session. */
  expiresIn: number | null
  /** Re-read `/__session`, e.g. after Navigator renews the cookie. */
  refresh: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export interface SessionProviderProps {
  children: ReactNode
  /** Override the gateway session endpoint. */
  endpoint?: string
  /** Override where an expired reader is sent. */
  loginPath?: string
  /**
   * Send the reader to Navigator as soon as there is no valid session.
   * Off by default so a page can render its own signed-out state.
   */
  redirectOnExpiry?: boolean
  /** How long before expiry to start warning, in seconds. Default 5 minutes. */
  warnBeforeSeconds?: number
}

/**
 * Tracks the gateway-verified Navigator session and counts it down.
 *
 * The 8-hour `DEFAULT_SESSION_TTL_SECS` means a reader can leave a matter page
 * open across the lapse; without a countdown the next action fails silently at
 * the proxy. This provider makes the expiry visible and, optionally, acts on it.
 */
export function SessionProvider({
  children,
  endpoint,
  loginPath,
  redirectOnExpiry = false,
  warnBeforeSeconds = 300,
}: SessionProviderProps) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<Error | null>(null)
  const [now, setNow] = useState(() => nowUnix())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSession(endpoint)
      if (!mounted.current) return
      setSession(next)
      setStatus(next ? 'authenticated' : 'anonymous')
      setError(null)
    } catch (cause) {
      if (!mounted.current) return
      setSession(null)
      setStatus('error')
      setError(cause instanceof Error ? cause : new Error(String(cause)))
    }
  }, [endpoint])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // One shared tick drives both the countdown and the expiry check.
  useEffect(() => {
    if (status !== 'authenticated') return undefined
    const id = window.setInterval(() => setNow(nowUnix()), 1000)
    return () => window.clearInterval(id)
  }, [status])

  useEffect(() => {
    if (!session) return
    if (!isExpired(session, now)) return
    setSession(null)
    setStatus('anonymous')
    if (redirectOnExpiry) redirectToLogin(loginPath)
  }, [session, now, redirectOnExpiry, loginPath])

  const expiresIn = session ? Math.max(0, secondsRemaining(session, now)) : null

  const value = useMemo(
    () => ({ status, session, error, expiresIn, refresh }),
    [status, session, error, expiresIn, refresh],
  )

  return (
    <SessionContext.Provider value={value}>
      {children}
      {session && expiresIn !== null && expiresIn <= warnBeforeSeconds ? (
        <SessionExpiryNotice seconds={expiresIn} loginPath={loginPath} />
      ) : null}
    </SessionContext.Provider>
  )
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function SessionExpiryNotice({
  seconds,
  loginPath,
}: {
  seconds: number
  loginPath?: string
}) {
  return (
    <aside className="session-notice" role="status" aria-live="polite">
      <p>
        <strong>Session expiring</strong>
        Your Neon Law session ends in {formatCountdown(seconds)}. Unsaved comments will not be
        submitted after that.
      </p>
      <button type="button" className="btn btn--primary" onClick={() => redirectToLogin(loginPath)}>
        Stay signed in
      </button>
    </aside>
  )
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used inside a <SessionProvider>')
  }
  return context
}
