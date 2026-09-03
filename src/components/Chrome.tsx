import { useId, type ReactNode } from 'react'
import { ExternalLink } from './Navigation'

/*
 * Page chrome: the public header and footer, the public shell, the
 * authenticated Navigator shell, and the page header inside them.
 *
 * Nothing here imports a router or a session. Destinations arrive as arrays of
 * `{ label, href }` and the caller marks which one is current. That is what
 * lets the same header render a server-only marketing page with no hydration
 * bundle and an authenticated React portal.
 */

export interface ChromeLink {
  label: ReactNode
  href: string
  /** The reader's current page. */
  current?: boolean
  /** Leaves the site: a new tab, `rel="noopener noreferrer"`, and the outward glyph. */
  external?: boolean
}

function ChromeAnchor({ link, className }: { link: ChromeLink; className?: string }) {
  const current = link.current ? 'page' : undefined
  if (link.external) {
    return (
      <ExternalLink href={link.href} className={className} aria-current={current}>
        {link.label}
      </ExternalLink>
    )
  }
  return (
    <a className={className} href={link.href} aria-current={current}>
      {link.label}
    </a>
  )
}

/**
 * Shared empty default for every optional link array below.
 *
 * A `= []` default constructs a new array on every render, so a memoized child
 * receiving it re-renders every time its parent does. One frozen instance costs
 * nothing and is referentially stable.
 */
const NO_LINKS: readonly ChromeLink[] = Object.freeze([])
const NO_OFFICES: readonly FooterOffice[] = Object.freeze([])

function linkKey(link: ChromeLink, index: number) {
  return typeof link.label === 'string' ? `${link.href}:${link.label}` : `${link.href}:${index}`
}

/* ------------------------------------------------------------- SiteHeader -- */

export interface SiteHeaderProps {
  brand: ReactNode
  brandHref?: string
  /** A logo mark before the wordmark. */
  logo?: ReactNode
  /** Primary destinations. */
  links?: readonly ChromeLink[]
  /** The trailing group: Sign in, or Portal / Staff / Sign out. */
  utility?: readonly ChromeLink[]
  menuLabel?: string
  'aria-label'?: string
}

/**
 * The public marketing header.
 *
 * Below 48rem the two link rows collapse behind a burger, and the disclosure is
 * a hidden checkbox rather than a script — these pages ship no hydration
 * bundle, so there is no JavaScript to open a menu with. The checkbox is
 * positioned off-screen instead of `display: none` so it stays focusable: a
 * menu you cannot tab to is not a menu.
 */
export function SiteHeader({
  brand,
  brandHref = '/',
  logo,
  links = NO_LINKS,
  utility = NO_LINKS,
  menuLabel = 'Menu',
  'aria-label': ariaLabel = 'Primary',
}: SiteHeaderProps) {
  const toggleId = useId()

  return (
    <header className="site-header">
      <nav className="site-header__nav" aria-label={ariaLabel}>
        <a className="site-header__brand" href={brandHref}>
          {logo ? <span className="site-header__logo">{logo}</span> : null}
          {brand}
        </a>

        <input
          className="site-header__toggle"
          type="checkbox"
          id={toggleId}
          // The input carries the semantics; the <label> below is what the
          // reader sees and clicks.
          aria-label={menuLabel}
        />
        <label className="site-header__burger" htmlFor={toggleId}>
          <span className="site-header__burger-bar" />
          <span className="site-header__burger-bar" />
          <span className="site-header__burger-bar" />
        </label>

        {links.length > 0 ? (
          <ul className="site-header__links">
            {links.map((link, index) => (
              <li key={linkKey(link, index)}>
                <ChromeAnchor
                  link={link}
                  className={
                    link.current ? 'site-header__link site-header__link--active' : 'site-header__link'
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}

        {utility.length > 0 ? (
          <ul className="site-header__utility">
            {utility.map((link, index) => (
              <li key={linkKey(link, index)}>
                <ChromeAnchor
                  link={link}
                  className={
                    link.current ? 'site-header__link site-header__link--active' : 'site-header__link'
                  }
                />
              </li>
            ))}
          </ul>
        ) : null}
      </nav>
    </header>
  )
}

/* ------------------------------------------------------------- SiteFooter -- */

export interface FooterOffice {
  /** The heading above the address — usually the state. */
  label: ReactNode
  address: ReactNode
  /** A qualification: an admission that has not come through yet. */
  note?: ReactNode
}

export interface SiteFooterProps {
  /** The contact band's call to action. */
  cta?: { label: string; href: string }
  phone?: { label: ReactNode; href: string }
  offices?: readonly FooterOffice[]
  /** Secondary destinations — Team, Blog, Contact. */
  links?: readonly ChromeLink[]
  /** The fine print: regulated entity, admissions, disclaimer, copyright. */
  legal?: ReactNode
  /**
   * The Foundation variant adds the §6104(d) public-disclosure link to the
   * reach column.
   */
  transparency?: { label: string; href: string }
  'aria-label'?: string
}

export function SiteFooter({
  cta,
  phone,
  offices = NO_OFFICES,
  links = NO_LINKS,
  legal,
  transparency,
  'aria-label': ariaLabel = 'Site footer',
}: SiteFooterProps) {
  const hasContact = Boolean(cta || phone || transparency || offices.length)

  return (
    <footer className="site-footer" aria-label={ariaLabel}>
      <div className="site-footer__inner">
        {links.length > 0 ? (
          <nav className="site-footer__nav" aria-label="Footer">
            {links.map((link, index) => (
              <ChromeAnchor key={linkKey(link, index)} link={link} className="site-footer__nav-link" />
            ))}
          </nav>
        ) : null}

        {hasContact ? (
          <div className="site-footer__contact">
            <div className="site-footer__reach">
              {cta ? (
                <a className="nav-btn nav-btn--primary" href={cta.href}>
                  {cta.label}
                </a>
              ) : null}
              {phone ? (
                <a className="site-footer__phone" href={phone.href}>
                  {phone.label}
                </a>
              ) : null}
              {transparency ? (
                <a className="site-footer__transparency" href={transparency.href}>
                  {transparency.label}
                </a>
              ) : null}
            </div>

            {offices.length > 0 ? (
              <div className="site-footer__offices">
                {offices.map((office, index) => (
                  <div
                    key={typeof office.label === 'string' ? office.label : index}
                    className="site-footer__office"
                  >
                    <p className="site-footer__office-label">{office.label}</p>
                    {/* <address> defaults to italic; these are postal
                        addresses, not asides. The stylesheet undoes it. */}
                    <address className="site-footer__office-address">{office.address}</address>
                    {office.note ? <p className="site-footer__office-note">{office.note}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {legal ? <div className="site-footer__legal">{legal}</div> : null}
      </div>
    </footer>
  )
}

/* ------------------------------------------------------------ PublicShell -- */

export interface ShellFrameProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  /** Frame it as a contained sample — the `/design` preview treatment. */
  showcase?: boolean
}

/**
 * The skeleton a public page wraps its content in: header, a centered content
 * column, and the footer strip.
 */
export function PublicShell({ header, footer, children, showcase }: ShellFrameProps) {
  const shell = (
    <div className="public-shell nav-theme">
      {header}
      <main className="public-shell__main">{children}</main>
      {footer}
    </div>
  )

  return showcase ? <div className="public-shell-showcase">{shell}</div> : shell
}

/* --------------------------------------------------------- NavigatorShell -- */

export interface NavigatorNavbarProps {
  brand: ReactNode
  brandHref?: string
  /** Role-appropriate destinations — client, staff, or admin. */
  destinations?: readonly ChromeLink[]
  /** The sign-out control. A form, because it ends a session. */
  signOut?: { label?: string; action: string; hiddenFields?: Record<string, string> }
  'aria-label'?: string
}

/**
 * The authenticated application bar.
 *
 * It takes its destinations rather than deriving them, so the same bar renders
 * the client, staff, and admin forms and this component never learns what a
 * role is. Deciding who sees what is an authorization question, and a component
 * that answered it would be answering it in the browser.
 */
export function NavigatorNavbar({
  brand,
  brandHref = '/',
  destinations = NO_LINKS,
  signOut,
  'aria-label': ariaLabel = 'Primary',
}: NavigatorNavbarProps) {
  return (
    <div className="navigator-chrome__header">
      <nav className="navigator-navbar" aria-label={ariaLabel}>
        <a className="navigator-navbar__brand" href={brandHref}>
          {brand}
        </a>
        {destinations.length > 0 ? (
          <ul className="navigator-navbar__destinations">
            {destinations.map((link, index) => (
              <li key={linkKey(link, index)}>
                <a
                  className={
                    link.current
                      ? 'navigator-navbar__link navigator-navbar__link--active'
                      : 'navigator-navbar__link'
                  }
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {signOut ? (
          <form method="post" action={signOut.action} className="navigator-navbar__sign-out-form">
            {Object.entries(signOut.hiddenFields ?? {}).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button type="submit" className="navigator-navbar__sign-out nav-btn">
              {signOut.label ?? 'Sign out'}
            </button>
          </form>
        ) : null}
      </nav>
    </div>
  )
}

export interface NavigatorFooterProps {
  legal?: ReactNode
  links?: readonly ChromeLink[]
  /** The running deploy — a release tag or commit. */
  release?: ReactNode
}

export function NavigatorFooter({ legal, links = NO_LINKS, release }: NavigatorFooterProps) {
  return (
    <footer className="navigator-footer">
      {legal ? <p className="navigator-footer__legal">{legal}</p> : null}
      {links.length > 0 ? (
        <nav className="navigator-footer__links" aria-label="Footer">
          {links.map((link, index) => (
            <ChromeAnchor key={linkKey(link, index)} link={link} />
          ))}
        </nav>
      ) : null}
      {release ? <p className="navigator-footer__release">{release}</p> : null}
    </footer>
  )
}

/** The authenticated frame: navbar, content column, footer. */
export function NavigatorShell({ header, footer, children, showcase }: ShellFrameProps) {
  const shell = (
    <div className="navigator-shell nav-theme">
      {header}
      <main className="navigator-shell__main">{children}</main>
      {footer}
    </div>
  )

  return showcase ? <div className="navigator-chrome-showcase">{shell}</div> : shell
}

/* ------------------------------------------------------------- PageHeader -- */

export interface PageHeaderProps {
  title: ReactNode
  /** A line under the title. */
  summary?: ReactNode
  /** Right-aligned controls — the "New entity" button, say. */
  actions?: ReactNode
}

/** An `<h1>` with its actions to the right. Wraps on narrow viewports. */
export function PageHeader({ title, summary, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {summary ? <p className="nav-text-muted">{summary}</p> : null}
      </div>
      {actions}
    </div>
  )
}
