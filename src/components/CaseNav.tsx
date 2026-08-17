import type { ReactNode } from 'react'
import { NavLinkButton } from './Navigation'

export interface CaseNavLink {
  label: string
  href: string
  /** Marks the reader's current page with `aria-current`. */
  current?: boolean
  /** Renders the link as the filled call-to-action variant. */
  emphasis?: boolean
}

export interface CaseNavProps {
  /** Short all-caps identifier, e.g. "MERIDIAN LAW · NORTHWIND". */
  brand: string
  /** One-line matter caption; truncates rather than wrapping. */
  caption?: ReactNode
  links?: CaseNavLink[]
  'aria-label'?: string
}

/**
 * The sticky matter navigation bar carried by every case surface.
 *
 * Replaces the hand-copied `<nav class="case-nav">` block that appeared in 27
 * static pages. Its `data-theme-toggle` button is gone: the scheme follows the
 * operating system, so there is nothing for a reader to press.
 *
 * The links are `NavLinkButton`s rather than bare `<a>`s the stylesheet dresses
 * up. They were the latter, and the two drifted: this component's own rule set
 * the corner radius to a literal `3px` and the face to `--nav-font-mono` while
 * every button in the library had moved to `--nav-radius-sm` and the brand
 * typeface. Composing the button means the nav cannot hold a second opinion about
 * what a button is — `.case-nav__links` now sets the bar's compact scale and
 * nothing else. `emphasis` is the button's own `primary` variant, which is what
 * the flag always meant.
 */
/** Stable empty default: a fresh [] each render would break memo equality. */
const NO_LINKS: CaseNavLink[] = []

export function CaseNav({
  brand,
  caption,
  links = NO_LINKS,
  'aria-label': ariaLabel = 'Matter navigation',
}: CaseNavProps) {
  return (
    <nav className="case-nav" aria-label={ariaLabel}>
      <div className="case-nav__top">
        <span className="case-nav__brand">{brand}</span>
        {caption ? <span className="case-nav__caption">{caption}</span> : null}
      </div>
      {links.length > 0 ? (
        <div className="case-nav__links">
          {links.map((link) => (
            <NavLinkButton
              key={link.href}
              href={link.href}
              variant={link.emphasis ? 'primary' : undefined}
              aria-current={link.current ? 'page' : undefined}
            >
              {link.label}
            </NavLinkButton>
          ))}
        </div>
      ) : null}
    </nav>
  )
}
