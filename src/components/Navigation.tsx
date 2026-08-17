import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon } from './Icon'

/*
 * Navigation and the controls that look like it.
 *
 * Injected links, throughout: every navigable component takes an `href` and
 * renders a plain `<a>`. Nothing here imports a router. A portal that wants
 * client-side navigation intercepts the click at the call site or passes its
 * router's own anchor as a child — which is why these stay usable on a page
 * that ships no hydration bundle at all.
 */

/* ----------------------------------------------------------------- Button -- */

export type ButtonVariant = 'primary' | 'secondary' | 'danger'

function buttonClasses(variant: ButtonVariant | undefined, extra?: string) {
  return ['nav-btn', variant ? `nav-btn--${variant}` : null, extra].filter(Boolean).join(' ')
}

export interface NavButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function NavButton({ variant, className, type = 'button', ...rest }: NavButtonProps) {
  // Default to `type="button"`. An untyped <button> inside a <form> submits it,
  // which turns every incidental control into an accidental save.
  return <button type={type} className={buttonClasses(variant, className)} {...rest} />
}

export interface NavLinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant
}

/** An anchor that looks like a button. Still a link: it navigates. */
export function NavLinkButton({ variant, className, ...rest }: NavLinkButtonProps) {
  return <a className={buttonClasses(variant, className)} {...rest} />
}

/* ------------------------------------------------------------------ Badge -- */

export function NavBadge({ children }: { children: ReactNode }) {
  return <span className="nav-badge">{children}</span>
}

/* ------------------------------------------------------------- Breadcrumb -- */

export interface BreadcrumbItem {
  label: ReactNode
  /** Omit on the trailing item — the page the reader is already on. */
  href?: string
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  'aria-label'?: string
}

/**
 * The muted "back to parent" trail at the top of a detail page.
 *
 * An ordered list inside a `<nav>`, which is what lets a screen reader announce
 * "list, 3 items" and skip it. The current page is text rather than a link to
 * itself, marked `aria-current="page"`.
 */
export function Breadcrumb({ items, 'aria-label': ariaLabel = 'Breadcrumb' }: BreadcrumbProps) {
  return (
    <nav className="nav-breadcrumb" aria-label={ariaLabel}>
      <ol className="nav-breadcrumb__list">
        {items.map((item, index) => (
          <li key={typeof item.label === 'string' ? item.label : index}>
            {item.href ? (
              <a className="nav-breadcrumb__link" href={item.href}>
                {item.label}
              </a>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ----------------------------------------------------------- ExternalLink -- */

export interface ExternalLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'rel'> {
  href: string
  children: ReactNode
  /** Suppress the trailing glyph where the surrounding text already says so. */
  hideGlyph?: boolean
}

/**
 * A link that leaves the site, in a new tab.
 *
 * `rel="noopener noreferrer"` is the OWASP pair and both halves earn their
 * place: `noopener` denies the opened page a handle on `window.opener`, which
 * it could otherwise use to navigate this tab somewhere convincing;
 * `noreferrer` withholds the URL the reader came from, which on an
 * authenticated portal can name a matter in its path.
 *
 * The trailing glyph is not decoration — it is the only warning the reader gets
 * that a click is about to take over a new tab, and it is announced, because a
 * new tab that arrives unannounced is a lost reader.
 */
export function ExternalLink({ href, children, hideGlyph, ...rest }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
      {children}
      {hideGlyph ? null : (
        <>
          {' '}
          <Icon name="box-arrow-up-right" title="opens in a new tab" />
        </>
      )}
    </a>
  )
}
