import type { ReactNode } from 'react'
import { Badge, type BadgeTone } from './Primitives'

/**
 * Avatar accent, named for the token family it draws from.
 *
 * Not for a color: a component that offers `'blue'` has pinned one brand's
 * palette into its API, and the name goes on lying the first time a brand layer
 * re-tones. These six stay accurate under every brand.
 */
export type FeedAccent = 'brand' | 'link' | 'danger' | 'success' | 'warning' | 'neutral'

export interface FeedSource {
  label: string
  href: string
}

export interface FeedPost {
  id: string
  /** ISO date (YYYY-MM-DD). Drives the `<time>` element and year markers. */
  date: string
  /** Human-readable date shown on the card. */
  dateLabel: string
  actor: string
  /** Secondary line under the actor — firm, side, department. */
  role?: string
  /** One to three characters rendered in the avatar disc. */
  initials: string
  accent?: FeedAccent
  /** Event category rendered as a badge beside the title. */
  kind?: string
  /** Tone for the kind badge. */
  tone?: BadgeTone
  title: ReactNode
  body: ReactNode
  /** Links to the underlying record — a filing, an order, a folder. */
  sources?: FeedSource[]
}

export interface FeedProps {
  /** Posts in display order; year markers appear where the year changes. */
  posts: FeedPost[]
  'aria-label'?: string
}

function postYear(post: FeedPost): string {
  return post.date.slice(0, 4)
}

function FeedCard({ post }: { post: FeedPost }) {
  return (
    <article className="feed-post" data-post={post.id}>
      <header className="feed-post__head">
        <span className="feed-avatar" data-accent={post.accent ?? 'link'} aria-hidden="true">
          {post.initials}
        </span>
        <div>
          <div className="feed-actor">{post.actor}</div>
          {post.role ? <div className="feed-role">{post.role}</div> : null}
        </div>
        <time className="feed-date" dateTime={post.date}>
          {post.dateLabel}
        </time>
      </header>
      <h3 className="feed-title">
        {post.title}
        {post.kind ? (
          <span className="feed-kind">
            <Badge tone={post.tone}>{post.kind}</Badge>
          </span>
        ) : null}
      </h3>
      <div className="feed-body">{post.body}</div>
      {post.sources?.length ? (
        <footer className="feed-sources">
          {post.sources.map((source) => (
            <a
              key={source.href}
              className="feed-source-link"
              href={source.href}
              target="_blank"
              rel="noreferrer"
            >
              {source.label} ↗
            </a>
          ))}
        </footer>
      ) : null}
    </article>
  )
}

/**
 * A vertical event feed on a timeline rail — one card per event, a year
 * marker where the year changes.
 *
 * Presentation only: the posts carry the matter's record, so they live in the
 * consuming application's `src/data`, never here.
 */
export function Feed({ posts, 'aria-label': ariaLabel }: FeedProps) {
  return (
    <ol className="feed" aria-label={ariaLabel}>
      {posts.map((post, index) => {
        const previous = posts[index - 1]
        const showYear = previous === undefined || postYear(previous) !== postYear(post)
        return (
          <li key={post.id}>
            {showYear ? <div className="feed-year">{postYear(post)}</div> : null}
            <FeedCard post={post} />
          </li>
        )
      })}
    </ol>
  )
}
