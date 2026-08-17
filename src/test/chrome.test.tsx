import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import {
  NavigatorFooter,
  NavigatorNavbar,
  NavigatorShell,
  PageHeader,
  PublicShell,
  SiteFooter,
  SiteHeader,
} from '../components/Chrome'

describe('SiteHeader', () => {
  const links = [
    { label: 'Services', href: '/services' },
    { label: 'Team', href: '/team', current: true },
  ]

  it('marks the reader’s current page', () => {
    render(<SiteHeader brand="Neon Law" links={links} />)
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Services' })).not.toHaveAttribute('aria-current')
  })

  it('opens the mobile menu with no JavaScript', async () => {
    const user = userEvent.setup()
    render(<SiteHeader brand="Neon Law" links={links} />)

    // The disclosure is a checkbox because these pages ship no hydration
    // bundle: CSS reads `:checked` and there is nothing to hydrate.
    const toggle = screen.getByRole('checkbox', { name: 'Menu' })
    expect(toggle).not.toBeChecked()
    await user.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('keeps the disclosure reachable by keyboard', async () => {
    const user = userEvent.setup()
    render(<SiteHeader brand="Neon Law" links={links} />)

    // Off-screen, not display:none — a menu you cannot tab to is not a menu.
    const toggle = screen.getByRole('checkbox', { name: 'Menu' })
    await user.tab()
    await user.tab()
    expect(toggle).toHaveFocus()
  })

  it('renders the logo, utility group, and custom labels', () => {
    render(
      <SiteHeader
        brand="Neon Law"
        brandHref="/home"
        logo={<svg data-testid="mark" />}
        links={links}
        utility={[{ label: 'Sign in', href: '/login' }]}
        menuLabel="Navigation"
        aria-label="Main"
      />,
    )
    expect(screen.getByTestId('mark')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Neon Law' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Navigation' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('renders neither link row when there are no destinations', () => {
    const { container } = render(<SiteHeader brand="Neon Law" />)
    expect(container.querySelector('.site-header__links')).toBeNull()
    expect(container.querySelector('.site-header__utility')).toBeNull()
  })

  it('marks a current utility link too', () => {
    render(
      <SiteHeader brand="B" utility={[{ label: 'Portal', href: '/portal', current: true }]} />,
    )
    expect(screen.getByRole('link', { name: 'Portal' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('SiteFooter', () => {
  it('renders the contact band, offices, and legal strip', () => {
    const { container } = render(
      <SiteFooter
        cta={{ label: 'Book a call', href: '/book' }}
        phone={{ label: '(702) 555-0100', href: 'tel:+17025550100' }}
        offices={[
          { label: 'Nevada', address: '123 Main St, Las Vegas', note: 'By appointment.' },
          { label: 'California', address: '456 Market St, San Francisco' },
        ]}
        links={[{ label: 'Team', href: '/team' }]}
        legal={<p>Attorney advertising.</p>}
      />,
    )

    expect(screen.getByRole('link', { name: 'Book a call' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '(702) 555-0100' })).toHaveAttribute(
      'href',
      'tel:+17025550100',
    )
    expect(container.querySelectorAll('.site-footer__office')).toHaveLength(2)
    expect(screen.getByText('By appointment.')).toBeInTheDocument()
    expect(screen.getByText('Attorney advertising.')).toBeInTheDocument()
  })

  it('adds the public-disclosure link in the Foundation variant', () => {
    render(<SiteFooter transparency={{ label: 'Form 990', href: '/transparency' }} />)
    expect(screen.getByRole('link', { name: 'Form 990' })).toHaveAttribute(
      'href',
      '/transparency',
    )
  })

  it('drops the contact band entirely when there is nothing to put in it', () => {
    const { container } = render(<SiteFooter legal={<p>© 2026</p>} />)
    expect(container.querySelector('.site-footer__contact')).toBeNull()
    expect(container.querySelector('.site-footer__nav')).toBeNull()
  })

  it('marks a current footer link and takes a label', () => {
    render(
      <SiteFooter
        aria-label="Colophon"
        links={[{ label: 'Blog', href: '/blog', current: true }]}
      />,
    )
    const footer = screen.getByRole('contentinfo', { name: 'Colophon' })
    expect(within(footer).getByRole('link', { name: 'Blog' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

describe('PublicShell', () => {
  it('wraps content in a main landmark', () => {
    render(
      <PublicShell header={<SiteHeader brand="B" />} footer={<SiteFooter legal="x" />}>
        <p>Body</p>
      </PublicShell>,
    )
    expect(screen.getByRole('main')).toHaveTextContent('Body')
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('frames itself as a contained sample on request', () => {
    const { container } = render(<PublicShell showcase>Body</PublicShell>)
    expect(container.querySelector('.public-shell-showcase')).not.toBeNull()
  })

  it('renders unframed by default, with no chrome required', () => {
    const { container } = render(<PublicShell>Body</PublicShell>)
    expect(container.querySelector('.public-shell-showcase')).toBeNull()
    expect(container.querySelector('.public-shell')).toHaveClass('nav-theme')
  })
})

describe('NavigatorNavbar', () => {
  it('renders whatever destinations it is given, and marks the current one', () => {
    render(
      <NavigatorNavbar
        brand="Navigator"
        destinations={[
          { label: 'Matters', href: '/matters', current: true },
          { label: 'People', href: '/people' },
        ]}
      />,
    )
    // The bar never learns what a role is; the caller decides who sees what.
    expect(screen.getByRole('link', { name: 'Matters' })).toHaveClass(
      'navigator-navbar__link--active',
    )
    expect(screen.getByRole('link', { name: 'People' })).not.toHaveClass(
      'navigator-navbar__link--active',
    )
  })

  it('signs out through a form, because it ends a session', () => {
    const { container } = render(
      <NavigatorNavbar
        brand="Navigator"
        signOut={{ action: '/sign-out', hiddenFields: { _csrf: 'tok' } }}
      />,
    )
    const form = container.querySelector('form')
    expect(form).toHaveAttribute('method', 'post')
    expect(form).toHaveAttribute('action', '/sign-out')
    expect(container.querySelector('input[name="_csrf"]')).toHaveValue('tok')
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument()
  })

  it('takes a custom sign-out label and brand href', () => {
    render(
      <NavigatorNavbar
        brand="Navigator"
        brandHref="/app"
        signOut={{ action: '/out', label: 'Log out' }}
        aria-label="App"
      />,
    )
    expect(screen.getByRole('link', { name: 'Navigator' })).toHaveAttribute('href', '/app')
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'App' })).toBeInTheDocument()
  })

  it('renders bare with no destinations and no sign-out', () => {
    const { container } = render(<NavigatorNavbar brand="Navigator" />)
    expect(container.querySelector('.navigator-navbar__destinations')).toBeNull()
    expect(container.querySelector('form')).toBeNull()
  })
})

describe('NavigatorFooter', () => {
  it('renders its three optional parts', () => {
    render(
      <NavigatorFooter
        legal="© 2026 Neon Law LLP"
        links={[{ label: 'Support', href: '/support' }]}
        release="v0.5.0"
      />,
    )
    expect(screen.getByText('© 2026 Neon Law LLP')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Support' })).toBeInTheDocument()
    expect(screen.getByText('v0.5.0')).toBeInTheDocument()
  })

  it('renders empty when given nothing', () => {
    const { container } = render(<NavigatorFooter />)
    expect(container.querySelector('.navigator-footer')?.children).toHaveLength(0)
  })
})

describe('NavigatorShell', () => {
  it('wraps content in a main landmark', () => {
    render(
      <NavigatorShell header={<NavigatorNavbar brand="N" />} footer={<NavigatorFooter />}>
        <p>Body</p>
      </NavigatorShell>,
    )
    expect(screen.getByRole('main')).toHaveTextContent('Body')
  })

  it('frames itself as a contained sample on request', () => {
    const { container } = render(<NavigatorShell showcase>Body</NavigatorShell>)
    expect(container.querySelector('.navigator-chrome-showcase')).not.toBeNull()
  })

  it('renders unframed by default', () => {
    const { container } = render(<NavigatorShell>Body</NavigatorShell>)
    expect(container.querySelector('.navigator-chrome-showcase')).toBeNull()
  })
})

describe('PageHeader', () => {
  it('renders the title with its actions', () => {
    render(
      <PageHeader
        title="Entities"
        summary="Everything the firm has formed."
        actions={<button type="button">New entity</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Entities' })).toBeInTheDocument()
    expect(screen.getByText('Everything the firm has formed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New entity' })).toBeInTheDocument()
  })

  it('renders a bare title', () => {
    const { container } = render(<PageHeader title="Entities" />)
    expect(container.querySelector('.nav-text-muted')).toBeNull()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
