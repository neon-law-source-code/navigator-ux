import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Primitives'

export interface DraftCardProps {
  title: ReactNode
  /** Recipient, channel, or status line under the title. */
  note?: ReactNode
  /** The draft body. Whitespace is preserved exactly as authored. */
  text: string
  /** Extra controls beside the copy button. */
  actions?: ReactNode
  /** Hide the copy control on read-only surfaces. */
  copyable?: boolean
}

/**
 * A reviewable draft with one-click copy.
 *
 * Copying is the whole point of these cards on the static pages — counsel
 * lifts the text into an email — so the control reports success inline
 * rather than silently succeeding.
 */
export function DraftCard({ title, note, text, actions, copyable = true }: DraftCardProps) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setState('copied')
    } catch {
      // Clipboard access is refused in some embedded and insecure contexts.
      setState('failed')
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState('idle'), 2000)
  }, [text])

  return (
    <article className="draft-card">
      <div className="draft-meta">
        <div>
          <h3>{title}</h3>
          {note ? <p>{note}</p> : null}
        </div>
        <div className="button-row">
          {actions}
          {copyable ? (
            <Button className="copy-btn" onClick={copy} aria-live="polite">
              {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}
            </Button>
          ) : null}
        </div>
      </div>
      <pre className="draft-text">{text}</pre>
    </article>
  )
}
