import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { fakeFirstName, fakeInitials, fakeLastName, fakePerson } from '../../fixtures/fake.mjs'
import { Accordion, Collapsible } from '../components/Disclosure'
import { AspectRatio, Avatar, Progress, Separator, Skeleton } from '../components/Display'
import { Combobox, Switch, ToggleGroup } from '../components/Controls'
import { LinkTabs, Tabs } from '../components/Tabs'
import { Dialog, DropdownMenu, Popover, Sheet, Tooltip } from '../components/Overlay'
import { Toaster } from '../components/Toaster'
import { useToasts } from '../lib/use-toasts'
import { initialsFor } from '../lib/initials'

/* ------------------------------------------------------------- Disclosure -- */

describe('Accordion', () => {
  const items = [
    { id: 'scope', trigger: 'Scope', children: <p>What we will do.</p> },
    { id: 'fees', trigger: 'Fees', children: <p>What it costs.</p>, defaultOpen: true },
  ]

  it('renders each section as a native disclosure', () => {
    const { container } = render(<Accordion items={items} />)
    // <details> brings the state, the ARIA, the keyboard, and in-page find.
    expect(container.querySelectorAll('details')).toHaveLength(2)
    expect(screen.getByText('Scope').tagName).toBe('SUMMARY')
  })

  it('opens the sections marked open', () => {
    const { container } = render(<Accordion items={items} />)
    const [scope, fees] = [...container.querySelectorAll('details')]
    expect(scope?.open).toBe(false)
    expect(fees?.open).toBe(true)
  })

  it('shares a name only when exclusive', () => {
    const { container, unmount } = render(<Accordion items={items} exclusive />)
    // The platform's own one-at-a-time accordion — no state, no effect.
    expect(
      [...container.querySelectorAll('details')].every(
        (d) => d.getAttribute('name') === 'nav-accordion',
      ),
    ).toBe(true)
    unmount()

    const independent = render(<Accordion items={items} />)
    expect(
      [...independent.container.querySelectorAll('details')].every(
        (d) => !d.hasAttribute('name'),
      ),
    ).toBe(true)
  })

  it('takes a custom exclusive group name', () => {
    const { container } = render(<Accordion items={items} exclusive name="engagement" />)
    expect(container.querySelector('details')).toHaveAttribute('name', 'engagement')
  })

  it('opens on click', async () => {
    const user = userEvent.setup()
    const { container } = render(<Accordion items={items} />)
    await user.click(screen.getByText('Scope'))
    expect(container.querySelector('details')?.open).toBe(true)
  })

  it('renders a single collapsible', () => {
    const { container } = render(
      <Collapsible trigger="More" defaultOpen>
        <p>Detail.</p>
      </Collapsible>,
    )
    expect(container.querySelector('details')?.open).toBe(true)
    expect(screen.getByText('Detail.')).toBeInTheDocument()
  })

  it('renders a collapsible closed by default', () => {
    const { container } = render(<Collapsible trigger="More">Detail.</Collapsible>)
    expect(container.querySelector('details')?.open).toBe(false)
  })
})

/* ---------------------------------------------------------------- Display -- */

const TWO_PART = fakePerson('shadcn-set/avatar')
const SECOND = fakePerson('shadcn-set/second')
const THREE_PART = [
  fakeFirstName('shadcn-set/given'),
  fakeFirstName('shadcn-set/middle'),
  fakeLastName('shadcn-set/family'),
].join(' ')
const MONONYM = fakeFirstName('shadcn-set/mononym')

describe('initialsFor', () => {
  /*
   * The expected value for a drawn name comes from `fakeInitials`, which is a
   * separate implementation of the same rule in `fixtures/fake.mjs` — so this
   * is a differential test, not a tautology. The mononym and whitespace rows
   * stay literal: they are shapes, not names.
   */
  it.each([
    [TWO_PART.name, fakeInitials(TWO_PART.name)],
    [SECOND.name, fakeInitials(SECOND.name)],
    [THREE_PART, fakeInitials(THREE_PART)],
    [MONONYM, MONONYM.slice(0, 1).toUpperCase()],
    ['', ''],
    ['   ', ''],
  ])('turns %o into %o', (name, expected) => {
    expect(initialsFor(name)).toBe(expected)
  })

  it('takes the first and last part, not the first two', () => {
    // A middle name should not displace the family name.
    const first = THREE_PART.split(' ')[0] ?? ''
    const last = THREE_PART.split(' ').at(-1) ?? ''
    expect(initialsFor(THREE_PART)).toBe(
      `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase(),
    )
  })
})

describe('Separator', () => {
  it('is a separator by default', () => {
    render(<Separator />)
    expect(screen.getByRole('separator')).toHaveClass('nav-separator--horizontal')
  })

  it('reports its orientation only when vertical', () => {
    const { rerender } = render(<Separator orientation="vertical" />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')

    rerender(<Separator orientation="horizontal" />)
    // Horizontal is the ARIA default; restating it is noise.
    expect(screen.getByRole('separator')).not.toHaveAttribute('aria-orientation')
  })

  it('disappears from the tree when decorative', () => {
    render(<Separator decorative className="extra" />)
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })
})

describe('Avatar', () => {
  it('uses the portrait, named', () => {
    render(<Avatar src="/portrait.jpg" name={TWO_PART.name} />)
    expect(screen.getByRole('img', { name: TWO_PART.name })).toHaveAttribute(
      'src',
      '/portrait.jpg',
    )
  })

  it('falls back to initials, announced once', () => {
    render(<Avatar name={TWO_PART.name} />)
    const avatar = screen.getByRole('img', { name: TWO_PART.name })
    expect(avatar).toHaveTextContent(TWO_PART.initials)
    // The visible initials are hidden so the name is not read twice.
    expect(within(avatar).getByText(TWO_PART.initials)).toHaveAttribute('aria-hidden', 'true')
  })

  it('takes an initials override and a size', () => {
    render(<Avatar name={TWO_PART.name} initials="DQ" size="lg" />)
    const avatar = screen.getByRole('img', { name: TWO_PART.name })
    expect(avatar).toHaveTextContent('DQ')
    expect(avatar).toHaveClass('nav-avatar--lg')
  })
})

describe('Skeleton', () => {
  it('is silent by default', () => {
    const { container } = render(<Skeleton width="12rem" height="1rem" />)
    const bone = container.querySelector<HTMLElement>('.nav-skeleton')
    // Six grey boxes announced one by one is worse than silence.
    expect(bone).toHaveAttribute('aria-hidden', 'true')
    // The inline style rather than `toHaveStyle`, which resolves through
    // getComputedStyle: jsdom 30 converts `rem` to `px` there, so the matcher
    // compares `12rem` against `192px` and fails on a component that did
    // nothing wrong. What this component promises is pass-through — the value
    // it was handed is the value it sets — and that is what is asserted.
    expect(bone?.style.width).toBe('12rem')
    expect(bone?.style.height).toBe('1rem')
  })

  it('announces itself when given a label', () => {
    render(<Skeleton label="Loading matters" circle />)
    const bone = screen.getByRole('status', { name: 'Loading matters' })
    expect(bone).toHaveClass('nav-skeleton--circle')
    expect(bone).not.toHaveAttribute('aria-hidden')
  })
})

describe('Progress', () => {
  it('reports its value', () => {
    render(<Progress value={40} label="Upload" showValue />)
    const bar = screen.getByRole('progressbar', { name: 'Upload' })
    expect(bar).toHaveAttribute('aria-valuenow', '40')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('clamps out-of-range values', () => {
    const { rerender } = render(<Progress value={140} label="Upload" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')

    rerender(<Progress value={-20} label="Upload" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('omits the value entirely when indeterminate', () => {
    const { container } = render(<Progress label="Working" />)
    const bar = screen.getByRole('progressbar', { name: 'Working' })
    // An indeterminate bar must not claim a position.
    expect(bar).not.toHaveAttribute('aria-valuenow')
    expect(container.querySelector('.nav-progress__track--indeterminate')).not.toBeNull()
    expect(container.querySelector('.nav-progress__value')).toBeNull()
  })

  it('hides the readout unless asked', () => {
    const { container } = render(<Progress value={40} label="Upload" />)
    expect(container.querySelector('.nav-progress__value')).toBeNull()
  })
})

describe('AspectRatio', () => {
  it('holds the ratio it is given', () => {
    const { container } = render(
      <AspectRatio ratio={4 / 3}>
        <img src="/x.jpg" alt="" />
      </AspectRatio>,
    )
    expect(container.querySelector('.nav-aspect')).toHaveStyle({ aspectRatio: String(4 / 3) })
  })

  it('defaults to 16:9', () => {
    const { container } = render(<AspectRatio>x</AspectRatio>)
    expect(container.querySelector('.nav-aspect')).toHaveStyle({ aspectRatio: String(16 / 9) })
  })
})

/* --------------------------------------------------------------- Controls -- */

describe('Switch', () => {
  it('is a checkbox that announces as a switch', () => {
    render(<Switch label="Email me" />)
    // Still a checkbox: it posts, it toggles on Space, it needs no JavaScript.
    const control = screen.getByRole('switch', { name: 'Email me' })
    expect(control).toHaveAttribute('type', 'checkbox')
  })

  it('toggles', async () => {
    const user = userEvent.setup()
    render(<Switch label="Email me" />)
    const control = screen.getByRole('switch')
    await user.click(control)
    expect(control).toBeChecked()
  })

  it('wires its description', () => {
    render(<Switch label="Email me" description="Sent when a filing lands." />)
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('Sent when a filing lands.')
  })

  it('passes through disabled and defaultChecked', () => {
    render(<Switch label="Email me" defaultChecked disabled />)
    const control = screen.getByRole('switch')
    expect(control).toBeChecked()
    expect(control).toBeDisabled()
  })
})

describe('ToggleGroup', () => {
  const options = [
    { value: 'all', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed', disabled: true },
  ]

  it('marks the pressed option', () => {
    render(<ToggleGroup label="Filter" options={options} value="open" onValueChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('group', { name: 'Filter' })).toBeInTheDocument()
  })

  it('reports a change', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(<ToggleGroup label="Filter" options={options} value="all" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(onValueChange).toHaveBeenCalledWith('open')
  })

  it('genuinely disables an option', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    render(<ToggleGroup label="Filter" options={options} value="all" onValueChange={onValueChange} />)
    const closed = screen.getByRole('button', { name: 'Closed' })
    expect(closed).toBeDisabled()
    await user.click(closed)
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('Combobox', () => {
  const options = ['Nevada', 'California', 'New York']

  it('ties the input to a datalist', () => {
    const { container } = render(<Combobox label="State" name="state" options={options} />)
    const input = screen.getByLabelText('State')
    const list = container.querySelector('datalist')
    expect(list).not.toBeNull()
    expect(input).toHaveAttribute('list', list?.id)
    expect(container.querySelectorAll('option')).toHaveLength(3)
  })

  it('still accepts a value that is not on the list', async () => {
    const user = userEvent.setup()
    render(<Combobox label="State" name="state" options={options} />)
    const input = screen.getByLabelText('State')
    // Suggestions, not a closed set — that is what separates it from a select.
    await user.type(input, 'Guam')
    expect(input).toHaveValue('Guam')
  })

  it('wires help, errors, and required', () => {
    render(
      <Combobox
        label="State"
        name="state"
        options={options}
        required
        help="Where the entity is formed."
        error="Pick a state."
      />,
    )
    const input = screen.getByLabelText(/State/)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Pick a state. Where the entity is formed.')
    expect(input).toBeRequired()
    expect(screen.getByRole('alert')).toHaveTextContent('Pick a state.')
  })

  it('renders bare with no help or error', () => {
    const { container } = render(
      <Combobox label="State" name="state" options={options} defaultValue="Nevada" placeholder="Type…" />,
    )
    expect(container.querySelector('.nav-field__help')).toBeNull()
    expect(screen.getByLabelText('State')).toHaveValue('Nevada')
  })
})

/* ------------------------------------------------------------------- Tabs -- */

describe('LinkTabs', () => {
  it('is navigation, not a tablist', () => {
    render(
      <LinkTabs
        aria-label="Views"
        tabs={[
          { label: 'Open', href: '?view=open', current: true },
          { label: 'Closed', href: '?view=closed' },
        ]}
      />,
    )
    // These navigate. Calling them tabs would promise arrow keys that do
    // nothing and a panel switch that is really a page load.
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Views' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('Tabs', () => {
  const items = [
    { value: 'summary', label: 'Summary', children: <p>The summary.</p> },
    { value: 'filings', label: 'Filings', children: <p>The filings.</p> },
    { value: 'archive', label: 'Archive', children: <p>The archive.</p>, disabled: true },
  ]

  const renderTabs = (props = {}) =>
    render(<Tabs items={items} aria-label="Matter sections" {...props} />)

  it('renders a tablist with one panel', () => {
    renderTabs()
    expect(screen.getByRole('tablist', { name: 'Matter sections' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(3)
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByRole('tabpanel')).toHaveTextContent('The summary.')
  })

  it('opens the first enabled tab by default', () => {
    renderTabs()
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true')
  })

  it('honors defaultValue', () => {
    renderTabs({ defaultValue: 'filings' })
    expect(screen.getByRole('tabpanel')).toHaveTextContent('The filings.')
  })

  it('gives the tablist a single tab stop', () => {
    renderTabs()
    // Roving tabindex: Tab reaches the tablist once, then the panel.
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Filings' })).toHaveAttribute('tabindex', '-1')
  })

  it('ties each panel to its tab', () => {
    renderTabs()
    const tab = screen.getByRole('tab', { name: 'Summary' })
    const panel = screen.getByRole('tabpanel')
    expect(tab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', tab.id)
  })

  it('switches on click and reports it', async () => {
    const onValueChange = vi.fn()
    const user = userEvent.setup()
    renderTabs({ onValueChange })
    await user.click(screen.getByRole('tab', { name: 'Filings' }))
    expect(screen.getByRole('tabpanel')).toHaveTextContent('The filings.')
    expect(onValueChange).toHaveBeenCalledWith('filings')
  })

  it('moves with the arrow keys, wrapping past the disabled tab', async () => {
    const user = userEvent.setup()
    renderTabs()
    screen.getByRole('tab', { name: 'Summary' }).focus()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Filings' })).toHaveAttribute('aria-selected', 'true')

    // Archive is disabled, so right from the last enabled tab wraps to the first.
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tab', { name: 'Filings' })).toHaveAttribute('aria-selected', 'true')
  })

  it('jumps to the ends with Home and End', async () => {
    const user = userEvent.setup()
    renderTabs()
    screen.getByRole('tab', { name: 'Summary' }).focus()

    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Filings' })).toHaveAttribute('aria-selected', 'true')

    await user.keyboard('{Home}')
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true')
  })

  it('ignores keys it does not own', async () => {
    const user = userEvent.setup()
    renderTabs()
    screen.getByRole('tab', { name: 'Summary' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('tab', { name: 'Summary' })).toHaveAttribute('aria-selected', 'true')
  })

  it('moves focus with selection', async () => {
    const user = userEvent.setup()
    renderTabs()
    screen.getByRole('tab', { name: 'Summary' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: 'Filings' })).toHaveFocus()
  })
})

/* ---------------------------------------------------------------- Overlay -- */

describe('Dialog', () => {
  const base = { title: 'Assign the matter', children: <p>Body.</p> }

  it('opens as a modal, named and described', () => {
    const { container } = render(
      <Dialog {...base} open description="Choose who leads." onClose={vi.fn()} />,
    )
    const dialog = screen.getByRole('dialog', { name: 'Assign the matter' })
    expect(dialog).toHaveAccessibleDescription('Choose who leads.')
    expect(container.querySelector('dialog')?.open).toBe(true)
  })

  it('stays closed until asked', () => {
    const { container } = render(<Dialog {...base} open={false} onClose={vi.fn()} />)
    expect(container.querySelector('dialog')?.open).toBe(false)
  })

  it('closes from the corner control', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<Dialog {...base} open onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('can withhold the corner control', () => {
    render(<Dialog {...base} open hideClose onClose={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('renders a footer action row', () => {
    render(
      <Dialog {...base} open onClose={vi.fn()} footer={<button type="button">Save</button>} />,
    )
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('reports an Esc dismissal without closing behind React', () => {
    const onClose = vi.fn()
    const { container } = render(<Dialog {...base} open onClose={onClose} />)
    const dialog = container.querySelector('dialog')
    const event = new Event('cancel', { cancelable: true })
    dialog?.dispatchEvent(event)
    expect(onClose).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
  })

  it('reports a close driven from the DOM', () => {
    const onClose = vi.fn()
    const { container } = render(<Dialog {...base} open onClose={onClose} />)
    container.querySelector('dialog')?.dispatchEvent(new Event('close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('falls back to the open attribute without showModal', () => {
    const proto = window.HTMLDialogElement?.prototype
    if (!proto) return
    const showModal = proto.showModal
    const close = proto.close
    // @ts-expect-error removing the modal methods for this test
    proto.showModal = undefined
    // @ts-expect-error removing the modal methods for this test
    proto.close = undefined
    try {
      const { container, rerender } = render(<Dialog {...base} open onClose={vi.fn()} />)
      expect(container.querySelector('dialog')).toHaveAttribute('open')
      rerender(<Dialog {...base} open={false} onClose={vi.fn()} />)
      expect(container.querySelector('dialog')).not.toHaveAttribute('open')
    } finally {
      proto.showModal = showModal
      proto.close = close
    }
  })
})

describe('Sheet', () => {
  const base = { title: 'Filters', children: <p>Body.</p> }

  it('opens against the trailing edge by default', () => {
    const { container } = render(<Sheet {...base} open onClose={vi.fn()} />)
    expect(container.querySelector('dialog')).toHaveClass('nav-sheet--right')
    expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
  })

  it('can arrive from the left, with a description and a footer', () => {
    const { container } = render(
      <Sheet
        {...base}
        open
        side="left"
        description="Narrow the list."
        footer={<button type="button">Apply</button>}
        onClose={vi.fn()}
      />,
    )
    expect(container.querySelector('dialog')).toHaveClass('nav-sheet--left')
    expect(screen.getByRole('dialog')).toHaveAccessibleDescription('Narrow the list.')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  })

  it('closes from the corner control and from Esc', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    const { container } = render(<Sheet {...base} open onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    const event = new Event('cancel', { cancelable: true })
    container.querySelector('dialog')?.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('can withhold the corner control and stays closed until asked', () => {
    const { container } = render(<Sheet {...base} open={false} hideClose onClose={vi.fn()} />)
    expect(container.querySelector('dialog')?.open).toBe(false)
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('falls back to the open attribute without showModal', () => {
    const proto = window.HTMLDialogElement?.prototype
    if (!proto) return
    const showModal = proto.showModal
    const close = proto.close
    // @ts-expect-error removing the modal methods for this test
    proto.showModal = undefined
    // @ts-expect-error removing the modal methods for this test
    proto.close = undefined
    try {
      const { container, rerender } = render(<Sheet {...base} open onClose={vi.fn()} />)
      expect(container.querySelector('dialog')).toHaveAttribute('open')
      rerender(<Sheet {...base} open={false} onClose={vi.fn()} />)
      expect(container.querySelector('dialog')).not.toHaveAttribute('open')
    } finally {
      proto.showModal = showModal
      proto.close = close
    }
  })
})

describe('Popover', () => {
  const renderPopover = () =>
    render(
      <>
        <Popover trigger="Details" label="Matter details">
          <p>Filed 12 August.</p>
        </Popover>
        <button type="button">Outside</button>
      </>,
    )

  it('reports its own state on the trigger', async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole('button', { name: 'Details' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('dialog', { name: 'Matter details' })).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole('button', { name: 'Details' })
    await user.click(trigger)

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on an outside click', async () => {
    const user = userEvent.setup()
    renderPopover()
    await user.click(screen.getByRole('button', { name: 'Details' }))
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('stays open when its own content is clicked', async () => {
    const user = userEvent.setup()
    renderPopover()
    await user.click(screen.getByRole('button', { name: 'Details' }))
    await user.click(screen.getByText('Filed 12 August.'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('toggles shut on a second trigger click', async () => {
    const user = userEvent.setup()
    renderPopover()
    const trigger = screen.getByRole('button', { name: 'Details' })
    await user.click(trigger)
    await user.click(trigger)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('can align to the trailing edge', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Popover trigger="Details" label="Details" align="end">
        <p>x</p>
      </Popover>,
    )
    await user.click(screen.getByRole('button', { name: 'Details' }))
    expect(container.querySelector('.nav-popover__content--end')).not.toBeNull()
  })
})

describe('DropdownMenu', () => {
  const onSelect = vi.fn()
  const items = [
    { label: 'Open', href: '#matters-1' },
    { label: 'Assign', onSelect },
    { label: 'Archive', onSelect, disabled: true },
    { label: 'Delete', onSelect, destructive: true },
  ]

  const renderMenu = () =>
    render(<DropdownMenu trigger="Actions" items={items} label="Matter actions" />)

  afterEach(() => onSelect.mockClear())

  it('declares that it opens a menu', () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: 'Actions' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders link and action items with the right roles', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))

    const menu = screen.getByRole('menu', { name: 'Matter actions' })
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(4)
    expect(within(menu).getByRole('menuitem', { name: 'Open' })).toHaveAttribute(
      'href',
      '#matters-1',
    )
  })

  it('runs an action and closes', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Assign' }))

    expect(onSelect).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Actions' })).toHaveFocus()
  })

  it('does not run a disabled item', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('marks the destructive item', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('nav-menu__item--danger')
  })

  it('opens on ArrowDown with focus on the first item', async () => {
    const user = userEvent.setup()
    renderMenu()
    screen.getByRole('button', { name: 'Actions' }).focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menu')).toBeInTheDocument()
    await vi.waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus(),
    )
  })

  it('moves through the enabled items with the arrow keys', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await vi.waitFor(() => expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus())

    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Assign' })).toHaveFocus()

    // Archive is disabled and is skipped entirely.
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Assign' })).toHaveFocus()

    await user.keyboard('{End}')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus()

    await user.keyboard('{Home}')
    expect(screen.getByRole('menuitem', { name: 'Open' })).toHaveFocus()
  })

  it('closes on Escape', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes when a link item is followed', async () => {
    const user = userEvent.setup()
    renderMenu()
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    await user.click(screen.getByRole('menuitem', { name: 'Open' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('can align to the trailing edge', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <DropdownMenu trigger="Actions" items={items} label="Actions" align="end" />,
    )
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expect(container.querySelector('.nav-menu__content--end')).not.toBeNull()
  })
})

describe('Tooltip', () => {
  it('appears on hover and describes the control', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Removes the matter from the list">
        <button type="button">Archive</button>
      </Tooltip>,
    )

    await user.hover(screen.getByRole('button', { name: 'Archive' }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Removes the matter from the list')
    // Describes, never names — the control keeps its own accessible name.
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
  })

  it('appears on focus too', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Hint">
        <button type="button">Archive</button>
      </Tooltip>,
    )
    // A hover-only tooltip is invisible to a keyboard.
    await user.tab()
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('goes away again', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Hint">
        <button type="button">Archive</button>
      </Tooltip>,
    )
    const button = screen.getByRole('button', { name: 'Archive' })
    await user.hover(button)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    await user.unhover(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('closes on Escape without stealing focus', async () => {
    const user = userEvent.setup()
    render(
      <Tooltip content="Hint">
        <button type="button">Archive</button>
      </Tooltip>,
    )
    await user.hover(screen.getByRole('button', { name: 'Archive' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

/* ---------------------------------------------------------------- Toaster -- */

function ToastHarness() {
  const { toasts, toast, dismiss } = useToasts()
  const [count, setCount] = useState(0)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          toast(`Saved ${count}`, { tone: 'success' })
          setCount((c) => c + 1)
        }}
      >
        Raise
      </button>
      <button type="button" onClick={() => toast('Sticky', { duration: 0 })}>
        Raise sticky
      </button>
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </>
  )
}

describe('Toaster', () => {
  it('mounts its live region before anything is in it', () => {
    render(<Toaster toasts={[]} onDismiss={vi.fn()} />)
    // The region has to exist before a message is inserted for the insertion to
    // be announced at all.
    const region = screen.getByRole('region', { name: 'Notifications' })
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toBeEmptyDOMElement()
  })

  it('takes a custom label', () => {
    render(<Toaster toasts={[]} onDismiss={vi.fn()} label="Alerts" />)
    expect(screen.getByRole('region', { name: 'Alerts' })).toBeInTheDocument()
  })

  it('shows a raised message', async () => {
    const user = userEvent.setup()
    render(<ToastHarness />)
    await user.click(screen.getByRole('button', { name: 'Raise' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Saved 0')
  })

  it('stacks several', async () => {
    const user = userEvent.setup()
    render(<ToastHarness />)
    await user.click(screen.getByRole('button', { name: 'Raise' }))
    await user.click(screen.getByRole('button', { name: 'Raise' }))
    expect(screen.getAllByRole('alert')).toHaveLength(2)
  })

  it('dismisses on request', async () => {
    const user = userEvent.setup()
    render(<ToastHarness />)
    await user.click(screen.getByRole('button', { name: 'Raise' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('expires after its duration', () => {
    vi.useFakeTimers()
    try {
      render(<ToastHarness />)
      fireEvent.click(screen.getByRole('button', { name: 'Raise' }))
      expect(screen.getByRole('alert')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(6000)
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('keeps a zero-duration message until it is dismissed', () => {
    vi.useFakeTimers()
    try {
      render(<ToastHarness />)
      fireEvent.click(screen.getByRole('button', { name: 'Raise sticky' }))

      act(() => {
        vi.advanceTimersByTime(60_000)
      })
      // A message worth interrupting for is worth keeping until it is read.
      expect(screen.getByRole('alert')).toHaveTextContent('Sticky')
    } finally {
      vi.useRealTimers()
    }
  })

  it('cancels the timer when dismissed early', () => {
    vi.useFakeTimers()
    try {
      render(<ToastHarness />)
      fireEvent.click(screen.getByRole('button', { name: 'Raise' }))
      fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }))

      // The timer must not fire against an id that is already gone.
      act(() => {
        vi.advanceTimersByTime(10_000)
      })
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
