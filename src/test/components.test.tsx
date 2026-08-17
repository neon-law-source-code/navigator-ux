import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthorityList, type Authority } from '../components/AuthorityDialog'
import { DraftCard } from '../components/DraftCard'
import { CaseNav } from '../components/CaseNav'
import { ThemeProvider } from '../theme/ThemeProvider'

const authorities: Authority[] = [
  {
    key: 'gt',
    title: 'GT, Inc. v. Superior Court',
    sourceType: 'Westlaw source',
    citation: '151 Cal. App. 3d 748 (1984)',
    pin: '754-56',
    holding: 'Good cause applies when information goes to the heart of a claim.',
    support: 'The AEO challenge.',
    pdf: '/assets/gt.pdf',
  },
  {
    key: 'profil',
    title: 'Profil Institut v. Prosciento',
    sourceType: 'Primary docket PDF',
    citation: 'ECF No. 73',
    pin: '7-8',
    holding: 'Allegedly misappropriated data should not be OCEO.',
    support: 'The strongest analogy.',
    pdf: '/assets/profil.pdf',
  },
]

beforeEach(() => window.localStorage.clear())

describe('AuthorityList', () => {
  it('opens the source viewer at the authority pin cite', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={authorities} storageKey="test-key" />)

    await user.click(screen.getByRole('button', { name: /GT, Inc/ }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('151 Cal. App. 3d 748 (1984)')).toBeInTheDocument()
    expect(screen.getByTitle(/GT, Inc.*source/)).toHaveAttribute('src', '/assets/gt.pdf')
  })

  it('records a verified authority and advances to the next one', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={authorities} storageKey="test-key" />)

    await user.click(screen.getByRole('button', { name: /GT, Inc/ }))
    await user.click(screen.getByRole('button', { name: 'Verify & next' }))

    // The dialog has moved on to the second authority...
    expect(screen.getByRole('dialog')).toHaveTextContent('Profil Institut')
    // ...and the first is remembered as checked.
    expect(JSON.parse(window.localStorage.getItem('test-key') ?? '{}')).toEqual({ gt: true })
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={authorities} storageKey="test-key" />)

    await user.click(screen.getByRole('button', { name: /GT, Inc/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('wraps around the stack when navigating past the last authority', async () => {
    const user = userEvent.setup()
    render(<AuthorityList authorities={authorities} storageKey="test-key" />)

    await user.click(screen.getByRole('button', { name: /Profil/ }))
    await user.click(screen.getByRole('button', { name: 'Next authority' }))

    expect(screen.getByRole('dialog')).toHaveTextContent('GT, Inc.')
  })
})

describe('DraftCard', () => {
  it('copies the draft text and reports it', async () => {
    const writeText = vi.fn(async () => {})
    // setup() installs its own clipboard stub, so ours has to land after it.
    // navigator.clipboard is getter-only, hence defineProperty.
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    render(<DraftCard title="Reply to Ken" text="Ken — confirming the schedule." />)
    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('Ken — confirming the schedule.')
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })
})

describe('CaseNav', () => {
  it('carries the brand and offers no scheme control', () => {
    render(
      <ThemeProvider>
        <CaseNav brand="MERIDIAN LAW · NORTHWIND" />
      </ThemeProvider>,
    )

    expect(screen.getByText('MERIDIAN LAW · NORTHWIND')).toBeInTheDocument()
    // The scheme follows the OS, so the bar has nothing to press.
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('marks the reader’s current page', () => {
    render(
      <ThemeProvider>
        <CaseNav
          brand="MERIDIAN LAW · NORTHWIND"
          links={[
            { label: 'Status', href: '/northwind/discovery/' },
            { label: 'July 26 review', href: '/northwind/review-0724/', current: true },
          ]}
        />
      </ThemeProvider>,
    )

    expect(screen.getByRole('link', { name: 'July 26 review' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})
