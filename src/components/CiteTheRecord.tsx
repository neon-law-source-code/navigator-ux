import { useCallback, useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'

import { locateQuote } from '../lib/locate-quote'
import { Dialog } from './Overlay'

export interface RecordCitation {
  id: string
  /** The quoted words as they appear in the brief. */
  quote: string
  /** Pin cite, e.g. "R. 42:12–14" or "Dep. 18:4–9". */
  cite: string
  /** Source document title. */
  source: string
  /** Verbatim excerpt from the record, wide enough to show the quote in place. */
  excerpt: string
  /** Optional speaker or author line. */
  speaker?: string
}

export interface CiteTheRecordProps {
  citations: RecordCitation[]
  'aria-label'?: string
  activeId?: string
  onActiveIdChange?: (id: string) => void
}

function Excerpt({ excerpt, quote }: { excerpt: string; quote: string }) {
  const located = useMemo(() => locateQuote(excerpt, quote), [excerpt, quote])
  if (!located.found) {
    return (
      <pre className="cite-the-record__excerpt">
        {excerpt}
        <span className="cite-the-record__miss">The quoted words do not appear in this excerpt.</span>
      </pre>
    )
  }
  return (
    <pre className="cite-the-record__excerpt">
      {located.before}
      <mark>{located.match}</mark>
      {located.after}
    </pre>
  )
}

/**
 * A locator for quoted passages in the record.
 *
 * The left rail is every direct quote the brief already committed to. Selecting
 * one opens that span in the record, with the matching words marked so counsel
 * can see the surrounding lines rather than a citation in isolation.
 */
export function CiteTheRecord({
  citations,
  'aria-label': ariaLabel = 'Cite the record',
  activeId,
  onActiveIdChange,
}: CiteTheRecordProps) {
  const paneId = useId()
  const [internalId, setInternalId] = useState(citations[0]?.id ?? '')
  const currentId = activeId ?? internalId
  const active = citations.find((item) => item.id === currentId) ?? citations[0] ?? null

  const setCurrent = useCallback(
    (id: string) => {
      onActiveIdChange?.(id)
      if (activeId === undefined) setInternalId(id)
    },
    [activeId, onActiveIdChange],
  )

  const step = useCallback(
    (delta: number) => {
      const index = citations.findIndex((item) => item.id === currentId)
      const next = citations[index + delta] ?? citations[delta > 0 ? citations.length - 1 : 0]
      if (next) setCurrent(next.id)
    },
    [citations, currentId, setCurrent],
  )

  const onNavKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault()
        step(-1)
      }
    },
    [step],
  )

  if (citations.length === 0) {
    return (
      <div className="cite-the-record">
        <p className="cite-the-record__empty">No quoted passages are cited to the record.</p>
      </div>
    )
  }

  return (
    <div className="cite-the-record">
      <nav
        className="cite-the-record__nav"
        aria-label={ariaLabel}
        aria-controls={paneId}
        tabIndex={0}
        onKeyDown={onNavKeyDown}
      >
        {citations.map((item) => {
          const current = item.id === currentId
          return (
            <button
              key={item.id}
              type="button"
              className={
                current
                  ? 'cite-the-record__item cite-the-record__item--current'
                  : 'cite-the-record__item'
              }
              aria-current={current ? 'location' : undefined}
              onClick={() => setCurrent(item.id)}
            >
              <span className="cite-the-record__cite">{item.cite}</span>
              <span className="cite-the-record__preview">{item.quote}</span>
            </button>
          )
        })}
      </nav>
      <article className="cite-the-record__pane" id={paneId} aria-live="polite">
        {active ? (
          <>
            <header className="cite-the-record__head">
              <p className="cite-the-record__source">{active.source}</p>
              <p className="cite-the-record__pin">{active.cite}</p>
              {active.speaker ? <p className="cite-the-record__speaker">{active.speaker}</p> : null}
            </header>
            <Excerpt excerpt={active.excerpt} quote={active.quote} />
          </>
        ) : null}
      </article>
    </div>
  )
}

export interface RecordCiteProps {
  citation: RecordCitation
  children?: ReactNode
}

/**
 * An in-brief quote that opens the matching span in the record.
 *
 * Use this inside a Harvard outline unit (or any prose) where a sentence
 * already quotes the record. The dialog is the same view as `CiteTheRecord`'s
 * pane — source, pin cite, and the excerpt with the quoted words marked.
 */
export function RecordCite({ citation, children }: RecordCiteProps) {
  const [open, setOpen] = useState(false)
  const title = `${citation.source} · ${citation.cite}`

  return (
    <figure className="record-cite">
      <blockquote className="record-cite__quote">{children ?? citation.quote}</blockquote>
      <figcaption>
        <button type="button" className="record-cite__open" onClick={() => setOpen(true)}>
          Cite the record · {citation.cite}
        </button>
      </figcaption>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description={citation.speaker}
      >
        <Excerpt excerpt={citation.excerpt} quote={citation.quote} />
      </Dialog>
    </figure>
  )
}
