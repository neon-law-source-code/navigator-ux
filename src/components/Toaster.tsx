import { Toast } from './Feedback'
import type { ToastRecord } from '../lib/use-toasts'

/*
 * The toast stack — shadcn's Toaster, and the `sonner` it now recommends.
 *
 * `Toast` renders one message. This renders the region they live in. The queue
 * itself is `useToasts` in `lib/use-toasts.ts`: a portal that only ever shows a
 * server-rendered flash banner should not have to mount a timer loop to do it.
 */

export interface ToasterProps {
  toasts: ToastRecord[]
  onDismiss: (id: number) => void
  /** Names the region. */
  label?: string
}

/**
 * The region the stack renders into.
 *
 * The region itself is `aria-live="polite"` and each `Toast` inside is
 * `role="alert"`. That looks redundant and is not: the region has to exist in
 * the DOM *before* a message is inserted for the insertion to be announced at
 * all, and a `role="alert"` element that appears from nothing is missed by
 * several screen readers. The empty region is the part that makes it work.
 */
export function Toaster({ toasts, onDismiss, label = 'Notifications' }: ToasterProps) {
  return (
    <div className="nav-toaster" role="region" aria-live="polite" aria-label={label}>
      {toasts.map((entry) => (
        <Toast
          key={entry.id}
          tone={entry.tone}
          action={
            <button
              type="button"
              className="nav-toast__dismiss"
              aria-label="Dismiss"
              onClick={() => onDismiss(entry.id)}
            >
              <span aria-hidden="true">×</span>
            </button>
          }
        >
          {entry.message}
        </Toast>
      ))}
    </div>
  )
}
