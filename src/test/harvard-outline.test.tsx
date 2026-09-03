import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CiteTheRecord,
  RecordCite,
  type RecordCitation,
} from '../components/CiteTheRecord'
import { HarvardOutlineViewer, type HarvardOutlineSection } from '../components/HarvardOutline'
import { locateQuote } from '../lib/locate-quote'

const SECTIONS: HarvardOutlineSection[] = [
  {
    id: 'intro',
    marker: 'I',
    title: 'Introduction',
    children: <p>Opening paragraph.</p>,
  },
  {
    id: 'facts',
    marker: 'II',
    title: 'Statement of facts',
    sections: [
      {
        id: 'agreement',
        marker: 'A',
        title: 'The supply agreement',
        children: <p>The cure clause.</p>,
      },
    ],
  },
]

const CITATIONS: RecordCitation[] = [
  {
    id: 'cure',
    quote: 'thirty days to cure',
    cite: 'R. 14:6',
    source: 'Supply Agreement',
    speaker: '§ 8.2',
    excerpt: 'Northwind shall have thirty days to cure any alleged default.',
  },
  {
    id: 'dep',
    quote: 'we did not send a cure notice until August',
    cite: 'Dep. 18:4',
    source: 'Deposition of K. Osei',
    excerpt: 'A. we did not send a cure notice until August, after the window closed.',
  },
]

describe('locateQuote', () => {
  it('matches across a line break in the record, and only whitespace is forgiven', () => {
    const excerpt = 'Q. And the notice?\nA. We gave them thirty\n   days to cure, in writing.'
    const wrapped = locateQuote(excerpt, 'thirty days to cure')
    expect(wrapped.found).toBe(true)
    expect(wrapped.match).toBe('thirty\n   days to cure')
    expect(wrapped.before + wrapped.match + wrapped.after).toBe(excerpt)
    expect(locateQuote(excerpt, 'thirty days to cure.').found).toBe(false)
    expect(locateQuote('a (b) c', '(b) c').found).toBe(true)
    expect(locateQuote('body', '   ').found).toBe(false)
  })

  it('splits an excerpt around a contiguous quote', () => {
    expect(locateQuote('alpha thirty days to cure omega', 'thirty days to cure')).toEqual({
      before: 'alpha ',
      match: 'thirty days to cure',
      after: ' omega',
      found: true,
    })
  })

  it('reports a miss rather than inventing a span', () => {
    expect(locateQuote('the warehouse closed at 16:00', 'never received the goods')).toEqual({
      before: 'the warehouse closed at 16:00',
      match: '',
      after: '',
      found: false,
    })
  })

  it('does not mark an empty quote', () => {
    expect(locateQuote('body', '')).toEqual({
      before: 'body',
      match: '',
      after: '',
      found: false,
    })
  })
})

describe('HarvardOutlineViewer', () => {
  let ioCallback: IntersectionObserverCallback | undefined

  beforeEach(() => {
    ioCallback = undefined
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        constructor(callback: IntersectionObserverCallback) {
          ioCallback = callback
        }
      },
    )
    HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renders Harvard markers and highlights the first unit', () => {
    render(<HarvardOutlineViewer sections={SECTIONS} />)

    expect(screen.getByRole('navigation', { name: 'Harvard outline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Introduction/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(document.querySelector('[data-harvard-path="II.A"]')).toHaveTextContent(
      'The supply agreement',
    )
  })

  it('jumps to a nested section from the navigator', async () => {
    const user = userEvent.setup()
    render(<HarvardOutlineViewer sections={SECTIONS} />)

    await user.click(screen.getByRole('button', { name: /The supply agreement/ }))

    expect(screen.getByRole('button', { name: /The supply agreement/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled()
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'agreement',
    )
  })

  it('steps with j and k when the navigator has focus', async () => {
    const user = userEvent.setup()
    render(<HarvardOutlineViewer sections={SECTIONS} />)

    screen.getByRole('navigation', { name: 'Harvard outline' }).focus()
    await user.keyboard('j')
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'facts',
    )

    await user.keyboard(' ')
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'agreement',
    )

    await user.keyboard('k')
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'facts',
    )
  })

  it('tracks the unit that scrolled into view', () => {
    render(<HarvardOutlineViewer sections={SECTIONS} />)
    const facts = document.querySelector('[data-harvard-id="facts"]')
    expect(facts).not.toBeNull()
    expect(ioCallback).toBeTypeOf('function')

    act(() => {
      ioCallback?.(
        [
          {
            isIntersecting: true,
            boundingClientRect: { top: 24 },
            target: facts as Element,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
    })

    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'facts',
    )
  })

  it('ignores intersection entries that are not a unit', () => {
    render(<HarvardOutlineViewer sections={SECTIONS} />)
    act(() => {
      ioCallback?.(
        [
          {
            isIntersecting: false,
            boundingClientRect: { top: 0 },
            target: document.createElement('div'),
          } as unknown as IntersectionObserverEntry,
          {
            isIntersecting: true,
            boundingClientRect: { top: 8 },
            target: document.createElement('div'),
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      )
    })
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'intro',
    )
  })

  it('resets the highlight when the outline is replaced', () => {
    const { rerender } = render(<HarvardOutlineViewer sections={SECTIONS} />)
    rerender(<HarvardOutlineViewer sections={[{ id: 'only', marker: 'I', title: 'Only' }]} />)
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'only',
    )
  })

  it('reports the active unit when controlled', async () => {
    const user = userEvent.setup()
    const onActiveIdChange = vi.fn()
    render(
      <HarvardOutlineViewer
        sections={SECTIONS}
        activeId="intro"
        onActiveIdChange={onActiveIdChange}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Statement of facts/ }))
    expect(onActiveIdChange).toHaveBeenCalledWith('facts')
    expect(screen.getByRole('button', { name: /Introduction/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  it('renders an empty state when there are no sections', () => {
    render(<HarvardOutlineViewer sections={[]} />)
    expect(screen.getByText('This outline has no sections yet.')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('stays on the last unit when stepping past the end', async () => {
    const user = userEvent.setup()
    render(<HarvardOutlineViewer sections={SECTIONS} />)
    screen.getByRole('navigation').focus()
    await user.keyboard('j')
    await user.keyboard('j')
    await user.keyboard('j')
    await user.keyboard('{ArrowDown}')
    expect(document.querySelector('.harvard-outline__unit--current')).toHaveAttribute(
      'data-harvard-id',
      'agreement',
    )
  })

  it('scrolls instantly when the reader prefers reduced motion', async () => {
    const user = userEvent.setup()
    window.matchMedia = ((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia

    render(<HarvardOutlineViewer sections={SECTIONS} />)
    await user.click(screen.getByRole('button', { name: /Statement of facts/ }))
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: 'start',
      behavior: 'auto',
    })
  })
})

describe('CiteTheRecord', () => {
  it('opens the first cited passage in the record pane', () => {
    render(<CiteTheRecord citations={CITATIONS} />)

    expect(screen.getByRole('navigation', { name: 'Cite the record' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /R\. 14:6/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
    expect(document.querySelector('mark')).toHaveTextContent('thirty days to cure')
    expect(screen.getByText('§ 8.2')).toBeInTheDocument()
  })

  it('moves to the next quote from the rail', async () => {
    const user = userEvent.setup()
    render(<CiteTheRecord citations={CITATIONS} />)

    await user.click(screen.getByRole('button', { name: /Dep\. 18:4/ }))
    expect(document.querySelector('mark')).toHaveTextContent(
      'we did not send a cure notice until August',
    )
    expect(screen.getByText('Deposition of K. Osei')).toBeInTheDocument()
  })

  it('says so when the quoted words are not in the excerpt', () => {
    render(
      <CiteTheRecord
        citations={[
          {
            id: 'miss',
            quote: 'the warehouse never received the goods',
            cite: 'R. 22:1',
            source: 'Warehouse log',
            excerpt: 'Dock 4 closed at 16:00.',
          },
        ]}
      />,
    )

    expect(screen.getByText('The quoted words do not appear in this excerpt.')).toBeInTheDocument()
    expect(document.querySelector('mark')).toBeNull()
  })

  it('steps quotes with the arrow keys', async () => {
    const user = userEvent.setup()
    render(<CiteTheRecord citations={CITATIONS} />)
    screen.getByRole('navigation', { name: 'Cite the record' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('button', { name: /Dep\. 18:4/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
    await user.keyboard('k')
    expect(screen.getByRole('button', { name: /R\. 14:6/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('button', { name: /R\. 14:6/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  it('omits the speaker line when the citation has none', () => {
    render(
      <CiteTheRecord
        citations={[
          {
            id: 'log',
            quote: 'Dock 4 closed',
            cite: 'R. 22:1',
            source: 'Warehouse log',
            excerpt: 'Dock 4 closed at 16:00.',
          },
        ]}
      />,
    )
    expect(document.querySelector('.cite-the-record__speaker')).toBeNull()
    expect(document.querySelector('mark')).toHaveTextContent('Dock 4 closed')
  })

  it('reports the active citation when controlled', async () => {
    const user = userEvent.setup()
    const onActiveIdChange = vi.fn()
    render(
      <CiteTheRecord citations={CITATIONS} activeId="cure" onActiveIdChange={onActiveIdChange} />,
    )
    await user.click(screen.getByRole('button', { name: /Dep\. 18:4/ }))
    expect(onActiveIdChange).toHaveBeenCalledWith('dep')
    expect(screen.getByRole('button', { name: /R\. 14:6/ })).toHaveAttribute(
      'aria-current',
      'location',
    )
  })

  it('renders an empty state when nothing is cited', () => {
    render(<CiteTheRecord citations={[]} />)
    expect(screen.getByText('No quoted passages are cited to the record.')).toBeInTheDocument()
  })
})

describe('RecordCite', () => {
  it('pulls the matching record span into a dialog', async () => {
    const user = userEvent.setup()
    render(<RecordCite citation={CITATIONS[0]!} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cite the record · R. 14:6' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Supply Agreement · R. 14:6')
    expect(dialog.querySelector('mark')).toHaveTextContent('thirty days to cure')
  })

  it('renders a custom quote body when given children', () => {
    render(
      <RecordCite citation={CITATIONS[0]!}>
        Counsel quotes the cure window in full.
      </RecordCite>,
    )
    expect(screen.getByText('Counsel quotes the cure window in full.')).toBeInTheDocument()
  })

  it('closes the locator from the dialog control', async () => {
    const user = userEvent.setup()
    render(<RecordCite citation={CITATIONS[0]!} />)
    await user.click(screen.getByRole('button', { name: /Cite the record/ }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
