import type { ReactNode } from 'react'

export interface ShellProps {
  children: ReactNode
  className?: string
}

/** The centered content column shared by every matter page. */
export function Shell({ children, className }: ShellProps) {
  return <main className={className ? `shell ${className}` : 'shell'}>{children}</main>
}

export interface CaseHeadProps {
  /** Small uppercase line above the title — privilege and status notices. */
  kicker?: ReactNode
  title: ReactNode
  /** Case caption and court, rendered in the monospace docket style. */
  docket?: ReactNode
  /** Lead paragraph describing the current posture. */
  summary?: ReactNode
  children?: ReactNode
}

/** The matter header block: kicker, title, docket line, and summary. */
export function CaseHead({ kicker, title, docket, summary, children }: CaseHeadProps) {
  return (
    <header className="case-head">
      {kicker ? <div className="case-kicker">{kicker}</div> : null}
      <h1>{title}</h1>
      {docket ? <p className="docket">{docket}</p> : null}
      {summary ? <p className="case-head__summary">{summary}</p> : null}
      {children}
    </header>
  )
}

export interface LayoutProps {
  children: ReactNode
  className?: string
}

/** Two-column main/sidebar grid that collapses on narrow screens. */
export function Layout({ children, className }: LayoutProps) {
  return <div className={className ? `layout ${className}` : 'layout'}>{children}</div>
}

/** Vertical stack with the standard gap; the column inside `Layout`. */
export function Stack({ children, className }: LayoutProps) {
  return <div className={className ? `stack ${className}` : 'stack'}>{children}</div>
}
