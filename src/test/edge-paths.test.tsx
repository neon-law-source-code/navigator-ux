import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthorityList, type Authority } from '../components/AuthorityDialog'
import { CaseNav } from '../components/CaseNav'
import { DraftCard } from '../components/DraftCard'
import { ThemeProvider } from '../theme/ThemeProvider'

beforeEach(() => window.localStorage.clear())

describe('DraftCard edge paths', () => {
  it('reports a refused clipboard instead of pretending it copied', async () => {
    // Clipboard access is refused in insecure and embedded contexts; counsel
    // needs to know the text is not on the clipboard.
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn(async () => {
          throw new Error('denied')
        }),
      },
    })

    render(<DraftCard title="Reply" text="body" />)
    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument()
  })

  it('hides the copy control on read-only surfaces', () => {
    render(<DraftCard title="Reply" text="body" copyable={false} actions={<span>extra</span>} />)
    expect(screen.queryByRole('button', { name: 'Copy' })).not.toBeInTheDocument()
    expect(screen.getByText('extra')).toBeInTheDocument()
  })

  it('omits the note line when there is none', () => {
    render(<DraftCard title="Reply" text="body" />)
    expect(document.querySelector('.draft-meta p')).toBeNull()
  })

  it('restarts the reset timer when copied twice in a row', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })

    render(<DraftCard title="Reply" text="body" />)
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    // The second click clears the pending timeout before setting a new one.
    await user.click(await screen.findByRole('button', { name: 'Copied' }))

    expect(writeText).toHaveBeenCalledTimes(2)
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})

describe('CaseNav edge paths', () => {
  it('renders no link row when there are no links', () => {
    render(
      <ThemeProvider>
        <CaseNav brand="NEON LAW" />
      </ThemeProvider>,
    )
    expect(document.querySelector('.case-nav__links')).toBeNull()
    expect(document.querySelector('.case-nav__caption')).toBeNull()
  })

  it('marks an emphasis link', () => {
    render(
      <ThemeProvider>
        <CaseNav
          brand="NEON LAW"
          caption="Vance v. Northwind"
          links={[{ label: 'Counterclaims', href: '/c/', emphasis: true }]}
        />
      </ThemeProvider>,
    )
    // `emphasis` is the button's own primary variant now, not a `nav-emphasis`
    // class the nav's stylesheet knew how to fill in by itself. The nav used to
    // dress bare anchors up as buttons, and its copy of "what a button is" drifted
    // — a literal 3px radius and a monospace face against the library's token and
    // typeface. Asserting the shared class is asserting there is one definition.
    const link = screen.getByRole('link', { name: 'Counterclaims' })
    expect(link).toHaveClass('nav-btn')
    expect(link).toHaveClass('nav-btn--primary')
    expect(document.querySelector('.case-nav__caption')).toHaveTextContent('Vance v. Northwind')
  })

  it('renders an ordinary link as the unadorned button', () => {
    render(
      <ThemeProvider>
        <CaseNav brand="NEON LAW" links={[{ label: 'Timeline', href: '/t/', current: true }]} />
      </ThemeProvider>,
    )
    const link = screen.getByRole('link', { name: 'Timeline' })
    expect(link).toHaveClass('nav-btn')
    expect(link).not.toHaveClass('nav-btn--primary')
    // The bar's resting and current states are `.case-nav__links`'s business;
    // `aria-current` is what it selects on, so it has to survive the change.
    expect(link).toHaveAttribute('aria-current', 'page')
  })
})

describe('AuthorityDialog edge paths', () => {
  const minimal: Authority = {
    key: 'bare',
    title: 'Bare authority',
    sourceType: 'Primary docket PDF',
    citation: 'ECF No. 1',
    pin: '1',
    holding: 'A holding.',
    support: 'Supports the point.',
    pdf: '/assets/bare.pdf',
  }

  it('omits every optional block when the authority carries none', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={[minimal]} storageKey="edge" />)
    await user.click(screen.getByRole('button', { name: 'Bare authority' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).queryByText(/Limits \/ adverse point/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Outcome:/)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/Verification:/)).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('link', { name: 'Westlaw DOCX' })).not.toBeInTheDocument()
    expect(dialog.querySelector('blockquote')).toBeNull()
    // With no default page the viewer opens the file itself, unfragmented.
    expect(within(dialog).getByTitle(/Bare authority/)).toHaveAttribute('src', '/assets/bare.pdf')
  })

  it('renders no badge row when an authority has no badges', () => {
    render(<AuthorityList authorities={[minimal]} storageKey="edge" />)
    expect(document.querySelector('.authority__badges')).toBeNull()
  })

  it('jumps the viewer to a pin-cited page', async () => {
    const user = userEvent.setup()
    render(
      <AuthorityList
        storageKey="edge"
        authorities={[
          { ...minimal, page: 4, jumps: [{ label: 'Balancing', page: 10 }] },
        ]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Bare authority' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByTitle(/Bare authority/)).toHaveAttribute(
      'src',
      '/assets/bare.pdf#page=4',
    )

    await user.click(within(dialog).getByRole('button', { name: 'Balancing' }))
    expect(within(dialog).getByTitle(/Bare authority/)).toHaveAttribute(
      'src',
      '/assets/bare.pdf#page=10',
    )
  })

  it('closes when the backdrop is clicked but not the panel', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={[minimal]} storageKey="edge" />)
    await user.click(screen.getByRole('button', { name: 'Bare authority' }))

    await user.click(screen.getByRole('dialog'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    const backdrop = document.querySelector('.authority-dialog') as HTMLElement
    await user.click(backdrop)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('steps backwards through the stack, wrapping at the start', async () => {
    const user = userEvent.setup()
    render(
      <AuthorityList
        storageKey="edge"
        authorities={[minimal, { ...minimal, key: 'second', title: 'Second authority' }]}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Bare authority' }))
    await user.click(screen.getByRole('button', { name: 'Previous authority' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('Second authority')
  })

  it('renders extra children alongside the list', () => {
    render(
      <AuthorityList authorities={[minimal]} storageKey="edge">
        <p>footnote</p>
      </AuthorityList>,
    )
    expect(screen.getByText('footnote')).toBeInTheDocument()
  })
})
