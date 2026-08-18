import type { ReactNode } from 'react'

/*
 * Spinner, Kbd, and Empty — shadcn's small state-and-affordance set.
 *
 * All three are markup and CSS with no behavior, which is why they live
 * together. Each exists because the alternative is every consuming app writing
 * the same twelve lines slightly differently, and then a portal showing three
 * spellings of "nothing here yet" on three pages.
 */

/* ---------------------------------------------------------------- Spinner -- */

export interface SpinnerProps {
  /** What is being waited on. Read aloud, so name the work, not the widget. */
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * A busy indicator.
 *
 * `role="status"` rather than `role="progressbar"`: a spinner reports that work
 * is happening, not how much is left. Use `Progress` when a fraction is
 * genuinely known — a spinner pretending to be a progress bar is the pattern
 * that produces a bar sitting at 90% forever.
 *
 * The animation is CSS and stops under `prefers-reduced-motion`, where the ring
 * stays as a static mark so the status is still visible.
 */
export function Spinner({ label = 'Loading', size = 'md' }: SpinnerProps) {
  return (
    <span className={`nav-spinner nav-spinner--${size}`} role="status">
      <span className="nav-spinner__ring" aria-hidden="true" />
      <span className="nav-visually-hidden">{label}</span>
    </span>
  )
}

/* -------------------------------------------------------------------- Kbd -- */

export interface KbdProps {
  children: ReactNode
}

/**
 * One key or chord, rendered as a key.
 *
 * A `<kbd>` element, which is what the platform already has for this. Pass the
 * chord as written — `Cmd K`, not a props object — because the separator
 * between keys is typographic and differs by convention, and a component that
 * guesses it gets it wrong on someone's platform.
 */
export function Kbd({ children }: KbdProps) {
  return <kbd className="nav-kbd">{children}</kbd>
}

/* ------------------------------------------------------------------ Empty -- */

export interface EmptyProps {
  title: ReactNode
  /** Why it is empty, and what would fill it. */
  description?: ReactNode
  /** The action that resolves the emptiness, if there is one. */
  action?: ReactNode
  /** A glyph above the title. Decorative — the title carries the meaning. */
  icon?: ReactNode
}

/**
 * The state a list is in before it has anything in it.
 *
 * Distinct from an error and from a filtered-to-nothing result, and worth
 * saying which: "No documents yet" and "No documents match this filter" send a
 * reader to completely different next actions, and a shared "No results" tells
 * them neither.
 */
export function Empty({ title, description, action, icon }: EmptyProps) {
  return (
    <div className="nav-empty-state">
      {icon ? (
        <span className="nav-empty-state__icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <p className="nav-empty-state__title">{title}</p>
      {description ? <p className="nav-empty-state__description">{description}</p> : null}
      {action ? <div className="nav-empty-state__action">{action}</div> : null}
    </div>
  )
}
