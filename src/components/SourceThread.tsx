import type { ReactNode } from 'react'

export interface SourceMessage {
  id: string
  /** Metadata rows — From, Sent, Subject, and so on. */
  meta: { label: string; value: ReactNode }[]
  /** Message body. Whitespace is preserved as received. */
  body: string
  attachments?: ReactNode
}

export interface SourceThreadProps {
  messages: SourceMessage[]
}

/**
 * Verbatim correspondence backing a matter's allegations.
 *
 * Bodies render in a `<pre>` because these are quoted source documents; any
 * reflow would misrepresent the record.
 */
export function SourceThread({ messages }: SourceThreadProps) {
  return (
    <div className="source-thread">
      {messages.map((message) => (
        <article className="source-message" key={message.id}>
          <dl className="source-message__meta">
            {message.meta.map((row) => (
              <div key={row.label} style={{ display: 'contents' }}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
          <pre>{message.body}</pre>
          {message.attachments ? (
            <div className="source-message__attachments">{message.attachments}</div>
          ) : null}
        </article>
      ))}
    </div>
  )
}
