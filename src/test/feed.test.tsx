import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Feed, type FeedPost } from '../components/Feed'

const posts: FeedPost[] = [
  {
    id: 'order-2026',
    date: '2026-02-09',
    dateLabel: 'Feb 9, 2026',
    actor: 'Judge Christine Van Aken',
    role: 'Dept. 301',
    initials: 'CT',
    accent: 'brand',
    kind: 'Order',
    tone: 'ready',
    title: 'Protective order granted',
    body: 'The court enters the order.',
    sources: [
      { label: 'Order PDF', href: '/assets/order.pdf' },
      { label: 'Docket', href: '/assets/docket.pdf' },
    ],
  },
  {
    id: 'motion-2025',
    date: '2025-12-23',
    dateLabel: 'Dec 23, 2025',
    actor: 'Michael Burshteyn',
    initials: 'MB',
    title: 'Motion for protective order drafted',
    body: 'Drafting begins.',
  },
  {
    id: 'complaint-2025',
    date: '2025-07-03',
    dateLabel: 'Jul 3, 2025',
    actor: 'Vance Holdings, Inc.',
    role: 'Plaintiff',
    initials: 'CH',
    accent: 'danger',
    kind: 'Filing',
    title: 'Complaint filed',
    body: 'The case begins.',
    sources: [{ label: 'Complaint PDF', href: '/assets/complaint.pdf' }],
  },
]

describe('Feed', () => {
  it('renders one card per post with actor, role, and machine-readable date', () => {
    render(<Feed posts={posts} aria-label="Case timeline" />)

    expect(screen.getByRole('list', { name: 'Case timeline' })).toBeInTheDocument()
    expect(document.querySelectorAll('.feed-post')).toHaveLength(posts.length)
    expect(screen.getByText('Judge Christine Van Aken')).toBeInTheDocument()
    expect(screen.getByText('Dept. 301')).toBeInTheDocument()

    const time = document.querySelector('[data-post="order-2026"] time')
    expect(time).toHaveAttribute('datetime', '2026-02-09')
    expect(time).toHaveTextContent('Feb 9, 2026')
  })

  it('marks each year once, where the year changes', () => {
    render(<Feed posts={posts} />)

    const years = [...document.querySelectorAll('.feed-year')].map((el) => el.textContent)
    // 2026 opens the feed; 2025 appears once even though two posts share it.
    expect(years).toEqual(['2026', '2025'])
  })

  it('keys the avatar to the accent, defaulting to the link tone', () => {
    render(<Feed posts={posts} />)

    expect(document.querySelector('[data-post="order-2026"] .feed-avatar')).toHaveAttribute(
      'data-accent',
      'brand',
    )
    // No accent given — the default must still map to a token pair.
    expect(document.querySelector('[data-post="motion-2025"] .feed-avatar')).toHaveAttribute(
      'data-accent',
      'link',
    )
  })

  it('shows the kind badge only when a kind is given', () => {
    render(<Feed posts={posts} />)

    expect(screen.getByText('Order')).toBeInTheDocument()
    expect(screen.getByText('Filing')).toBeInTheDocument()
    expect(document.querySelector('[data-post="motion-2025"] .feed-kind')).toBeNull()
  })

  it('links every source and omits the footer when there are none', () => {
    render(<Feed posts={posts} />)

    expect(screen.getByRole('link', { name: /Order PDF/ })).toHaveAttribute(
      'href',
      '/assets/order.pdf',
    )
    expect(document.querySelectorAll('.feed-source-link')).toHaveLength(3)
    expect(document.querySelector('[data-post="motion-2025"] .feed-sources')).toBeNull()
  })
})
