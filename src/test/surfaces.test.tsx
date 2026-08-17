import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  ActionList,
  DownloadCard,
  DownloadGrid,
  FactCard,
  FactGrid,
  Record,
  StatusStrip,
} from '../components/Cards'
import { ClaimTable } from '../components/ClaimTable'
import { Decision, DecisionGrid } from '../components/Decision'
import { Badge, Button, ButtonRow, Callout, LinkButton, Panel } from '../components/Primitives'
import { ReviewNav } from '../components/ReviewNav'
import { CaseHead, Layout, Shell, Stack } from '../components/Shell'
import { SourceThread } from '../components/SourceThread'

describe('Shell and CaseHead', () => {
  it('renders the matter header without optional parts', () => {
    render(<CaseHead title="Northwind — cross-complaint" />)
    expect(screen.getByRole('heading', { name: 'Northwind — cross-complaint' })).toBeInTheDocument()
    expect(document.querySelector('.docket')).toBeNull()
    expect(document.querySelector('.case-kicker')).toBeNull()
  })

  it('renders kicker, docket, and summary when given', () => {
    render(
      <CaseHead
        kicker="Privileged client-review package"
        title="Northwind"
        docket="CGC-25-626923"
        summary="Expanded client-review draft."
      >
        <p>extra</p>
      </CaseHead>,
    )
    expect(document.querySelector('.case-kicker')).toHaveTextContent('Privileged')
    expect(document.querySelector('.docket')).toHaveTextContent('CGC-25-626923')
    expect(document.querySelector('.case-head__summary')).toHaveTextContent('Expanded')
    expect(screen.getByText('extra')).toBeInTheDocument()
  })

  it('is the page main landmark and merges extra classes', () => {
    render(<Shell className="wide">body</Shell>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('shell', 'wide')
  })

  it('lays out columns', () => {
    render(
      <Layout className="tight">
        <Stack>left</Stack>
      </Layout>,
    )
    expect(document.querySelector('.layout')).toHaveClass('tight')
    expect(document.querySelector('.stack')).toHaveTextContent('left')
  })

  it('uses bare class names when no extra class is given', () => {
    render(
      <Shell>
        <Layout>
          <Stack className="wide">x</Stack>
        </Layout>
      </Shell>,
    )
    expect(screen.getByRole('main')).toHaveAttribute('class', 'shell')
    expect(document.querySelector('.layout')).toHaveAttribute('class', 'layout')
    expect(document.querySelector('.stack')).toHaveClass('stack', 'wide')
  })
})

describe('Panel', () => {
  it('omits the head entirely when there is nothing to put in it', () => {
    render(<Panel>body only</Panel>)
    expect(document.querySelector('.panel__head')).toBeNull()
    expect(document.querySelector('.panel__body')).toHaveTextContent('body only')
  })

  it('renders title, note, and actions', () => {
    render(
      <Panel id="authority" title="Authority" note="Verified against source text" actions={<Badge tone="source">Research</Badge>}>
        body
      </Panel>,
    )
    expect(screen.getByRole('heading', { name: 'Authority' })).toBeInTheDocument()
    expect(screen.getByText('Verified against source text')).toBeInTheDocument()
    expect(screen.getByText('Research')).toHaveClass('badge', 'source')
    expect(document.querySelector('#authority')).toBeInTheDocument()
  })

  it('renders a head with actions but no title, and vice versa', () => {
    const { rerender } = render(<Panel actions={<Badge>only actions</Badge>}>body</Panel>)
    expect(document.querySelector('.panel__head')).toBeInTheDocument()
    expect(document.querySelector('.panel__head h2')).toBeNull()

    rerender(<Panel title="Only title">body</Panel>)
    expect(document.querySelector('.panel__head h2')).toHaveTextContent('Only title')
    expect(document.querySelector('.panel__head .button-row')).toBeNull()
    expect(document.querySelector('.panel__head p')).toBeNull()
  })
})

describe('Badge, Button, Callout', () => {
  it('maps a tone onto the stylesheet class', () => {
    render(
      <>
        <Badge>plain</Badge>
        <Badge tone="blocked">blocked</Badge>
      </>,
    )
    expect(screen.getByText('plain')).toHaveAttribute('class', 'badge')
    expect(screen.getByText('blocked')).toHaveClass('badge', 'blocked')
  })

  it('defaults to type=button so it never submits a form by accident', () => {
    render(<Button>Copy</Button>)
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute('type', 'button')
  })

  it('fires its handler and respects disabled', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <ButtonRow>
        <Button variant="primary" onClick={onClick}>
          Go
        </Button>
        <Button disabled onClick={onClick}>
          Stop
        </Button>
      </ButtonRow>,
    )

    const go = screen.getByRole('button', { name: 'Go' })
    expect(go).toHaveClass('btn', 'btn--primary')
    await user.click(go)
    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(document.querySelector('.button-row')).toBeInTheDocument()
  })

  it('styles an anchor as a button for downloads', () => {
    render(
      <LinkButton variant="primary" href="/assets/brief.pdf">
        Open full PDF
      </LinkButton>,
    )
    const link = screen.getByRole('link', { name: 'Open full PDF' })
    expect(link).toHaveClass('btn', 'btn--primary')
    expect(link).toHaveAttribute('href', '/assets/brief.pdf')
  })

  it('defaults an anchor to the plain variant', () => {
    render(<LinkButton href="/a.pdf">Plain</LinkButton>)
    expect(screen.getByRole('link', { name: 'Plain' })).toHaveAttribute('class', 'btn')
  })

  it('merges a caller class onto a button', () => {
    render(<Button className="copy-btn">Copy</Button>)
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveClass('btn', 'copy-btn')
  })

  it('merges a caller class onto a button row', () => {
    render(<ButtonRow className="dense">x</ButtonRow>)
    expect(document.querySelector('.button-row')).toHaveClass('dense')
  })

  it('tones the callout', () => {
    const { rerender } = render(<Callout>info</Callout>)
    expect(document.querySelector('.callout')).not.toHaveClass('callout--warning')
    rerender(<Callout tone="warning">careful</Callout>)
    expect(document.querySelector('.callout')).toHaveClass('callout--warning')
  })
})

describe('Decision', () => {
  it('color-keys each card by readiness', () => {
    render(
      <DecisionGrid>
        <Decision title="Ready" tone="ready" kicker={<Badge tone="ready">Client review</Badge>}>
          done
        </Decision>
        <Decision title="Waiting" tone="wait" />
      </DecisionGrid>,
    )
    const cards = document.querySelectorAll('.decision')
    expect(cards).toHaveLength(2)
    expect(cards[0]).toHaveClass('ready')
    expect(cards[1]).toHaveClass('wait')
    // A card with no body renders no paragraph rather than an empty one.
    expect(within(cards[1] as HTMLElement).queryByText(/./, { selector: 'p' })).toBeNull()
  })

  it('uses the bare class when no tone is given', () => {
    render(<Decision title="Neutral" />)
    expect(document.querySelector('.decision')).toHaveAttribute('class', 'decision')
    expect(document.querySelector('.case-kicker')).toBeNull()
  })
})

describe('ReviewNav', () => {
  it('links each section by anchor', () => {
    render(<ReviewNav items={[{ id: 'ken', label: 'Ken drafts' }, { id: 'authority', label: 'Authority' }]} />)
    expect(screen.getByRole('link', { name: 'Ken drafts' })).toHaveAttribute('href', '#ken')
    expect(screen.getByRole('navigation', { name: 'In-page review navigation' })).toBeInTheDocument()
  })
})

describe('ClaimTable', () => {
  const rows = [
    { claim: 'Trade secret', posture: 'Pleaded' },
    { claim: 'UCL', posture: 'Draft' },
  ]

  it('renders a sticky header and one row per record', () => {
    render(
      <ClaimTable
        caption="Claims"
        rows={rows}
        rowKey={(row) => row.claim}
        columns={[
          { key: 'claim', header: 'Claim', cell: (row) => row.claim },
          { key: 'posture', header: 'Posture', cell: (row) => row.posture },
        ]}
      />,
    )
    expect(screen.getAllByRole('columnheader')).toHaveLength(2)
    expect(screen.getAllByRole('row')).toHaveLength(3) // header + 2
    expect(screen.getByText('Trade secret')).toBeInTheDocument()
  })

  it('renders an empty body rather than failing on no rows', () => {
    render(
      <ClaimTable
        rows={[]}
        rowKey={(_row, index) => String(index)}
        columns={[{ key: 'claim', header: 'Claim', cell: () => null }]}
      />,
    )
    expect(screen.getAllByRole('row')).toHaveLength(1)
  })
})

describe('SourceThread', () => {
  it('preserves message bodies verbatim', () => {
    const body = 'Counsel,\n\n  Indented line kept as received.'
    render(
      <SourceThread
        messages={[
          {
            id: 'one',
            meta: [{ label: 'From', value: 'ken@example.com' }],
            body,
            attachments: <span>letter.pdf</span>,
          },
        ]}
      />,
    )
    // textContent, not normalized text — the whitespace is part of the record.
    expect(document.querySelector('.source-message pre')?.textContent).toBe(body)
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('letter.pdf')).toBeInTheDocument()
  })

  it('omits the attachments row when there are none', () => {
    render(<SourceThread messages={[{ id: 'one', meta: [], body: 'text' }]} />)
    expect(document.querySelector('.source-message__attachments')).toBeNull()
  })
})

describe('Cards', () => {
  it('renders facts and downloads', () => {
    render(
      <>
        <FactGrid>
          <FactCard title="Fee award">$1,641,216.78</FactCard>
        </FactGrid>
        <DownloadGrid>
          <DownloadCard
            title="Kimi review"
            badge={<Badge tone="ready">Completed</Badge>}
            description="Adversarial review"
            actions={<LinkButton href="/a.md">Open</LinkButton>}
          />
        </DownloadGrid>
      </>,
    )
    expect(screen.getByRole('heading', { name: 'Fee award' })).toBeInTheDocument()
    expect(screen.getByText('$1,641,216.78')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open' })).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })

  it('omits a download description when absent', () => {
    render(<DownloadCard title="Bare" actions={null} />)
    expect(document.querySelector('.download-card p')).toBeNull()
  })

  it('numbers actions and dates records', () => {
    render(
      <>
        <ActionList
          items={[
            { id: '1', title: 'Confirm schedule', detail: 'due Friday' },
            { id: '2', title: 'File cross-complaint' },
          ]}
        />
        <Record dateTime="2026-07-30" when="July 30" title="Scheduling reply sent">
          Sent to Ken.
        </Record>
      </>,
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('due Friday')).toBeInTheDocument()
    expect(document.querySelector('time')).toHaveAttribute('datetime', '2026-07-30')
    expect(screen.getByText('Sent to Ken.')).toBeInTheDocument()
  })

  it('renders a bare record with no body and no machine date', () => {
    render(<Record when="Undated" title="Placeholder" />)
    expect(document.querySelector('.record p')).toBeNull()
    expect(document.querySelector('time')).not.toHaveAttribute('datetime')
  })

  it('tones status cells and leaves plain ones alone', () => {
    render(
      <StatusStrip
        cells={[
          { label: 'Stage', value: 'Discovery' },
          { label: 'Terms', value: 'Agreed', tone: 'term-agreed' },
        ]}
      />,
    )
    const cells = document.querySelectorAll('.status-cell')
    expect(cells[0]).toHaveAttribute('class', 'status-cell')
    expect(cells[1]).toHaveClass('term-agreed')
  })
})
