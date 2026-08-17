import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'

/* ------------------------------------------------------------------ Panel -- */

export interface PanelProps {
  /** Panel heading; omit for an unheaded body-only panel. */
  title?: ReactNode
  /** Secondary line under the heading. */
  note?: ReactNode
  /** Right-aligned slot in the head, typically badges or a button row. */
  actions?: ReactNode
  children: ReactNode
  className?: string
  id?: string
}

/** Bordered content panel with an optional head — the workhorse container. */
export function Panel({ title, note, actions, children, className, id }: PanelProps) {
  return (
    <section className={className ? `panel ${className}` : 'panel'} id={id}>
      {title || actions ? (
        <div className="panel__head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {note ? <p>{note}</p> : null}
          </div>
          {actions ? <div className="button-row">{actions}</div> : null}
        </div>
      ) : null}
      <div className="panel__body">{children}</div>
    </section>
  )
}

/* ------------------------------------------------------------------ Badge -- */

export type BadgeTone = 'default' | 'active' | 'ready' | 'next' | 'review' | 'blocked' | 'source'

export interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
}

/** Small pill used for status and provenance labels. */
export function Badge({ children, tone = 'default' }: BadgeProps) {
  return <span className={tone === 'default' ? 'badge' : `badge ${tone}`}>{children}</span>
}

/* ----------------------------------------------------------------- Button -- */

type ButtonVariant = 'default' | 'primary'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** React 19 passes `ref` as an ordinary prop to function components. */
  ref?: Ref<HTMLButtonElement>
}

export function Button({ variant = 'default', className, type = 'button', ...rest }: ButtonProps) {
  const classes = ['btn', variant === 'primary' ? 'btn--primary' : null, className]
    .filter(Boolean)
    .join(' ')
  return <button type={type} className={classes} {...rest} />
}

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant
}

/** An anchor styled as a button — used for downloads and external authority. */
export function LinkButton({ variant = 'default', className, ...rest }: LinkButtonProps) {
  const classes = ['btn', variant === 'primary' ? 'btn--primary' : null, className]
    .filter(Boolean)
    .join(' ')
  return <a className={classes} {...rest} />
}

export function ButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `button-row ${className}` : 'button-row'}>{children}</div>
}

/* ---------------------------------------------------------------- Callout -- */

export type CalloutTone = 'info' | 'warning' | 'danger' | 'success'

export interface CalloutProps {
  tone?: CalloutTone
  children: ReactNode
}

/** Bordered aside for warnings, caveats, and good news. */
export function Callout({ tone = 'info', children }: CalloutProps) {
  const suffix = tone === 'info' ? '' : ` callout--${tone}`
  return <div className={`callout${suffix}`}>{children}</div>
}
