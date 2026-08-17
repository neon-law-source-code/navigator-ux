import { useId, useRef, useState, type ReactNode } from 'react'

/*
 * Tabs, in the two forms this library actually needs.
 *
 * `LinkTabs` is the one the portals should reach for first: each tab is an
 * anchor and the selected tab lives in the URL, so the view is bookmarkable,
 * survives a refresh, works in a new tab, and renders on a page with no client
 * bundle. shadcn has no equivalent — Radix Tabs is client state only.
 *
 * `Tabs` is the client-side one, for a panel switch that genuinely has no
 * business in the URL. It is the shadcn/Radix shape, including the keyboard
 * contract that hand-rolled tabs almost always miss.
 */

/* --------------------------------------------------------------- LinkTabs -- */

export interface LinkTab {
  label: ReactNode
  href: string
  current?: boolean
}

export interface LinkTabsProps {
  tabs: LinkTab[]
  'aria-label': string
}

/**
 * Tabs as links.
 *
 * Deliberately *not* `role="tablist"`. These navigate — announcing them as tabs
 * would promise the reader that arrow keys switch panels and that nothing
 * navigates away, and neither is true. A row of links marked with
 * `aria-current` is what this is.
 */
export function LinkTabs({ tabs, 'aria-label': ariaLabel }: LinkTabsProps) {
  return (
    <nav className="nav-tabs" aria-label={ariaLabel}>
      {/* Keyed by position, not by `href`. An href looks like an id and is not
          one: two tabs may point at the same place — a "Open" and an "All" that
          both resolve to the same route, or a set of in-page anchors — and
          React then warns about duplicate keys from inside library code, where
          the consumer cannot do anything about it. A link tab has no stable
          identifier of its own, and the row is positional, so the index is the
          honest key. */}
      {tabs.map((tab, index) => (
        <a
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className={tab.current ? 'nav-tab is-active' : 'nav-tab'}
          href={tab.href}
          aria-current={tab.current ? 'page' : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  )
}

/* ------------------------------------------------------------------- Tabs -- */

export interface TabItem {
  /** Stable identifier, and the value reported by `onValueChange`. */
  value: string
  label: ReactNode
  children: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: TabItem[]
  /** Tab open on first render. Defaults to the first enabled tab. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  'aria-label': string
}

export function Tabs({ items, defaultValue, onValueChange, 'aria-label': ariaLabel }: TabsProps) {
  const baseId = useId()
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? items[0]?.value ?? ''
  const [active, setActive] = useState(defaultValue ?? firstEnabled)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())

  const enabled = items.filter((item) => !item.disabled)

  const select = (value: string) => {
    setActive(value)
    onValueChange?.(value)
    // Move focus with selection. In an automatic tablist the two travel
    // together — a reader arrowing through tabs is reading the panels, and
    // leaving focus behind would strand them.
    tabRefs.current.get(value)?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = enabled.findIndex((item) => item.value === active)
    if (index === -1) return

    // The APG tablist contract. Arrows wrap; Home and End jump the ends.
    const next = {
      ArrowRight: (index + 1) % enabled.length,
      ArrowLeft: (index - 1 + enabled.length) % enabled.length,
      Home: 0,
      End: enabled.length - 1,
    }[event.key]

    if (next === undefined) return
    event.preventDefault()
    const target = enabled[next]
    if (target) select(target.value)
  }

  return (
    <div className="nav-tabs-root">
      <div className="nav-tabs" role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
        {items.map((item) => {
          const selected = item.value === active
          return (
            <button
              key={item.value}
              type="button"
              className={selected ? 'nav-tab is-active' : 'nav-tab'}
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              // Roving tabindex: one stop for the whole tablist, so Tab moves
              // past the tabs to the panel rather than through every tab.
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              ref={(node) => {
                if (node) tabRefs.current.set(item.value, node)
                else tabRefs.current.delete(item.value)
              }}
              onClick={() => select(item.value)}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {items.map((item) =>
        item.value === active ? (
          <div
            key={item.value}
            className="nav-tabs__panel"
            role="tabpanel"
            id={`${baseId}-panel-${item.value}`}
            aria-labelledby={`${baseId}-tab-${item.value}`}
            // Focusable so a keyboard reader can reach panel content that has
            // no focusable child of its own.
            tabIndex={0}
          >
            {item.children}
          </div>
        ) : null,
      )}
    </div>
  )
}
