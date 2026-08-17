import type { ReactNode } from 'react'

export type DecisionTone = 'default' | 'ready' | 'wait' | 'risk'

export interface DecisionProps {
  title: ReactNode
  /** Small uppercase label above the title. */
  kicker?: ReactNode
  tone?: DecisionTone
  children?: ReactNode
}

/** A single call-to-action card, color-keyed by readiness. */
export function Decision({ title, kicker, tone = 'default', children }: DecisionProps) {
  return (
    <article className={tone === 'default' ? 'decision' : `decision ${tone}`}>
      {kicker ? <div className="case-kicker">{kicker}</div> : null}
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </article>
  )
}

/** Three-across grid of `Decision` cards; collapses on narrow screens. */
export function DecisionGrid({ children }: { children: ReactNode }) {
  return <div className="decision-grid">{children}</div>
}
