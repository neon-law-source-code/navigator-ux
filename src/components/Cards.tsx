import type { ReactNode } from 'react'

/* -------------------------------------------------------------- fact grid -- */

export interface FactCardProps {
  title: ReactNode
  children: ReactNode
}

/** A compact supporting-fact tile. */
export function FactCard({ title, children }: FactCardProps) {
  return (
    <article className="fact-card">
      <h3>{title}</h3>
      <p>{children}</p>
    </article>
  )
}

export function FactGrid({ children }: { children: ReactNode }) {
  return <div className="fact-grid">{children}</div>
}

/* --------------------------------------------------------------- downloads -- */

export interface DownloadCardProps {
  title: ReactNode
  /** Status badge shown above the title. */
  badge?: ReactNode
  description?: ReactNode
  /** Button row, typically `LinkButton`s to the artefacts. */
  actions: ReactNode
}

/** A deliverable with its download links pinned to the bottom of the card. */
export function DownloadCard({ title, badge, description, actions }: DownloadCardProps) {
  return (
    <article className="download-card">
      {badge}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      <div className="button-row">{actions}</div>
    </article>
  )
}

export function DownloadGrid({ children }: { children: ReactNode }) {
  return <div className="download-grid">{children}</div>
}

/* ------------------------------------------------------------- action list -- */

export interface ActionItem {
  id: string
  title: ReactNode
  detail?: ReactNode
}

/** Auto-numbered list of next steps. */
export function ActionList({ items }: { items: ActionItem[] }) {
  return (
    <ol className="action-list">
      {items.map((item) => (
        <li key={item.id}>
          <strong>{item.title}</strong>
          {item.detail ? <span>{item.detail}</span> : null}
        </li>
      ))}
    </ol>
  )
}

/* ----------------------------------------------------------------- records -- */

export interface RecordProps {
  /** Machine-readable date for the <time> element. */
  dateTime?: string
  when: ReactNode
  title: ReactNode
  children?: ReactNode
}

/** A dated entry in a chronology or docket feed. */
export function Record({ dateTime, when, title, children }: RecordProps) {
  return (
    <article className="record">
      <time dateTime={dateTime}>{when}</time>
      <h3>{title}</h3>
      {children ? <p>{children}</p> : null}
    </article>
  )
}

/* ------------------------------------------------------------ status strip -- */

export type StatusTone = 'default' | 'term-agreed' | 'term-continuation' | 'term-upside' | 'term-equity'

export interface StatusCellProps {
  label: ReactNode
  value: ReactNode
  tone?: StatusTone
}

export function StatusStrip({ cells }: { cells: StatusCellProps[] }) {
  return (
    <div className="status-strip">
      {cells.map((cell, index) => (
        <div
          className={cell.tone && cell.tone !== 'default' ? `status-cell ${cell.tone}` : 'status-cell'}
          key={`${String(cell.label)}-${index}`}
        >
          <span className="status-label">{cell.label}</span>
          <span className="status-value">{cell.value}</span>
        </div>
      ))}
    </div>
  )
}
