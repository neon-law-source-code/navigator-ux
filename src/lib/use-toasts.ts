import { useCallback, useRef, useState, type ReactNode } from 'react'
import type { ToastTone } from '../components/Feedback'

/*
 * The toast queue.
 *
 * Split from `Toaster` because it is state, not markup — and because a hook
 * exported beside a component is a fast-refresh boundary the linter is right to
 * flag.
 */

export interface ToastRecord {
  id: number
  tone: ToastTone
  message: ReactNode
  /** Milliseconds before it dismisses itself. 0 keeps it until dismissed. */
  duration: number
}

export interface ToastOptions {
  tone?: ToastTone
  /**
   * Milliseconds on screen. Defaults to 6000, which is the low end of what a
   * reader can actually finish. A message worth interrupting for is worth
   * `duration: 0` and a dismiss button.
   */
  duration?: number
}

export interface UseToasts {
  toasts: ToastRecord[]
  /** Show a message. Returns its id so it can be dismissed early. */
  toast: (message: ReactNode, options?: ToastOptions) => number
  dismiss: (id: number) => void
}

/**
 * Owns the toast list.
 *
 * A hook rather than a module-level singleton with an imperative `toast()`
 * export, which is how sonner does it. A singleton is convenient right up to
 * the point where two portals, or a test and the component it is testing, share
 * one queue — and the leak is invisible until a test starts failing because of
 * a toast another test raised.
 */
export function useToasts(): UseToasts {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((entry) => entry.id !== id))
  }, [])

  const toast = useCallback(
    (message: ReactNode, options?: ToastOptions) => {
      const id = nextId.current++
      const duration = options?.duration ?? 6000
      setToasts((current) => [...current, { id, tone: options?.tone ?? 'primary', message, duration }])

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            timers.current.delete(id)
            setToasts((current) => current.filter((entry) => entry.id !== id))
          }, duration),
        )
      }
      return id
    },
    [],
  )

  return { toasts, toast, dismiss }
}
