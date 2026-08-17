export interface ReviewNavItem {
  /** Target section id, without the leading '#'. */
  id: string
  label: string
}

export interface ReviewNavProps {
  items: ReviewNavItem[]
  'aria-label'?: string
}

/**
 * Sticky in-page anchor bar for long review documents.
 *
 * Pairs with `section[id] { scroll-margin-top }` in the stylesheet so a jump
 * clears both this bar and the case nav above it.
 */
export function ReviewNav({
  items,
  'aria-label': ariaLabel = 'In-page review navigation',
}: ReviewNavProps) {
  return (
    <nav className="review-nav" aria-label={ariaLabel}>
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`}>
          {item.label}
        </a>
      ))}
    </nav>
  )
}
