import { useCallback, useRef, useState, type MouseEvent, type ReactNode } from 'react'

import { useDismissible } from '../lib/use-dismissible'

/*
 * HoverCard, ContextMenu, and Menubar.
 *
 * The three shadcn surfaces with no platform primitive underneath them. There
 * is no element that opens on hover-with-intent, no styleable right-click menu,
 * and no menubar — so unlike `Accordion` or `Switch`, these are genuinely built
 * rather than adopted. They share `useDismissible` for the Esc / outside-click
 * / focus-return behavior, which is the part hand-rolled versions get wrong.
 *
 * `ContextMenu` is the one to think twice about. Overriding the browser's own
 * context menu takes away Copy, Inspect, and Open in New Tab, so it is only
 * correct where the row genuinely has actions a reader cannot reach otherwise —
 * and it must never be the *only* route to them.
 */

/* -------------------------------------------------------------- HoverCard -- */

export interface HoverCardProps {
  /** The anchor. Must be focusable, or the card is pointer-only. */
  trigger: ReactNode
  children: ReactNode
  /** Delay before opening, in ms. Guards against a pointer passing through. */
  openDelay?: number
}

/**
 * A preview that opens on hover or focus.
 *
 * Distinct from `Tooltip`: a tooltip labels the thing under the pointer and is
 * announced as its description, while a hover card is a preview of something
 * else — a person, an authority, a linked document — and may contain links.
 *
 * It opens on focus as well as hover, which is what keeps it reachable by
 * keyboard, and it stays open while the pointer is over the card itself so its
 * content can be clicked. A card that closes when you move toward it is a card
 * whose links do not exist.
 */
export function HoverCard({ trigger, children, openDelay = 250 }: HoverCardProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  const cancel = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = undefined
  }, [])

  const scheduleOpen = useCallback(() => {
    cancel()
    timer.current = window.setTimeout(() => setOpen(true), openDelay)
  }, [cancel, openDelay])

  const close = useCallback(() => {
    cancel()
    setOpen(false)
  }, [cancel])

  useDismissible({ open, onClose: close, triggerRef, contentRef, restoreFocus: false })

  return (
    <span
      className="nav-hovercard"
      onMouseEnter={scheduleOpen}
      onMouseLeave={close}
      onFocus={() => setOpen(true)}
      onBlur={close}
    >
      <span className="nav-hovercard__trigger" ref={triggerRef} tabIndex={0}>
        {trigger}
      </span>
      {open ? (
        <div className="nav-hovercard__content" ref={contentRef} role="dialog">
          {children}
        </div>
      ) : null}
    </span>
  )
}

/* ------------------------------------------------------------ ContextMenu -- */

export interface ContextMenuItem {
  label: ReactNode
  onSelect: () => void
  disabled?: boolean
  /** Renders in the danger tone. Destructive actions only. */
  danger?: boolean
}

export interface ContextMenuProps {
  children: ReactNode
  items: ContextMenuItem[]
  label?: string
}

/**
 * A right-click menu over a region.
 *
 * Opens at the pointer, which is the one thing a reader expects of a context
 * menu and the reason this cannot reuse `DropdownMenu`'s anchored positioning.
 * The coordinates are stored relative to the wrapper rather than the viewport,
 * so the menu travels with the row when the page scrolls.
 *
 * Every action here must also exist somewhere clickable. A right-click is not
 * discoverable, is awkward on a trackpad, and does not exist on a touchscreen.
 */
export function ContextMenu({ children, items, label = 'Actions' }: ContextMenuProps) {
  const [at, setAt] = useState<{ x: number; y: number } | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setAt(null), [])
  useDismissible({ open: at !== null, onClose: close, triggerRef: wrapperRef, contentRef })

  const onContextMenu = useCallback((event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const box = event.currentTarget.getBoundingClientRect()
    setAt({ x: event.clientX - box.left, y: event.clientY - box.top })
  }, [])

  return (
    <div className="nav-context-menu" ref={wrapperRef} onContextMenu={onContextMenu}>
      {children}
      {at ? (
        <div
          className="nav-context-menu__content"
          ref={contentRef}
          role="menu"
          aria-label={label}
          style={{ insetInlineStart: at.x, insetBlockStart: at.y }}
        >
          {items.map((item, index) => (
            <button
              /* eslint-disable-next-line react/no-array-index-key */
              key={index}
              type="button"
              role="menuitem"
              className={item.danger ? 'nav-menu__item nav-menu__item--danger' : 'nav-menu__item'}
              disabled={item.disabled}
              onClick={() => {
                item.onSelect()
                close()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- Menubar -- */

export interface MenubarMenu {
  label: ReactNode
  items: ContextMenuItem[]
}

export interface MenubarProps {
  menus: MenubarMenu[]
  label?: string
}

/**
 * An application menu bar.
 *
 * Arrow keys move between menus, which is what `role="menubar"` promises a
 * screen reader — and the promise is the reason to implement it rather than
 * ship a row of dropdowns wearing the role. Once a menu is open, moving left or
 * right opens the neighbour directly, the way a desktop menu bar behaves.
 */
export function Menubar({ menus, label = 'Main' }: MenubarProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  useDismissible({ open: openIndex !== null, onClose: close, triggerRef: barRef, contentRef })

  const step = useCallback(
    (from: number, direction: 1 | -1) => (from + direction + menus.length) % menus.length,
    [menus.length],
  )

  return (
    <div className="nav-menubar" ref={barRef} role="menubar" aria-label={label}>
      {menus.map((menu, index) => {
        const open = openIndex === index
        return (
          /* eslint-disable-next-line react/no-array-index-key */
          <div className="nav-menubar__menu" key={index}>
            <button
              type="button"
              role="menuitem"
              aria-haspopup="true"
              aria-expanded={open}
              className={open ? 'nav-menubar__trigger nav-menubar__trigger--open' : 'nav-menubar__trigger'}
              onClick={() => setOpenIndex(open ? null : index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault()
                  setOpenIndex(step(index, 1))
                }
                if (event.key === 'ArrowLeft') {
                  event.preventDefault()
                  setOpenIndex(step(index, -1))
                }
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setOpenIndex(index)
                }
              }}
            >
              {menu.label}
            </button>
            {open ? (
              <div className="nav-menubar__content" ref={contentRef} role="menu">
                {menu.items.map((item, itemIndex) => (
                  <button
                    /* eslint-disable-next-line react/no-array-index-key */
                    key={itemIndex}
                    type="button"
                    role="menuitem"
                    className={item.danger ? 'nav-menu__item nav-menu__item--danger' : 'nav-menu__item'}
                    disabled={item.disabled}
                    onClick={() => {
                      item.onSelect()
                      close()
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
