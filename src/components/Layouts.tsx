import { useCallback, useId, useRef, type ReactNode } from 'react'

/*
 * ScrollArea, ButtonGroup, and Carousel — shadcn's container set.
 *
 * shadcn's ScrollArea and Carousel are both wrappers around a third-party
 * engine (Radix and Embla). Both are CSS here: `overflow` and `scroll-snap` are
 * platform features now, and the JavaScript version's one advantage —
 * consistent scrollbar styling across browsers — is not worth an engine on
 * every page, especially now that `scrollbar-width` and `scrollbar-color` are
 * supported everywhere this library runs.
 */

/* ------------------------------------------------------------- ScrollArea -- */

export interface ScrollAreaProps {
  children: ReactNode
  /** Cap the height; content past it scrolls. Any CSS length. */
  maxHeight?: string
  /** Scroll sideways instead of down. */
  horizontal?: boolean
  /** Names the region, which is what makes it reachable as a landmark. */
  label?: string
}

/**
 * A bounded scrolling region.
 *
 * `tabIndex={0}` is the part that is easy to miss and required: a scrollable
 * box that cannot be focused cannot be scrolled by keyboard at all, which
 * strands any content past the fold for anyone not using a pointer. The
 * browsers that do this automatically do not all agree on when.
 */
export function ScrollArea({ children, maxHeight, horizontal, label }: ScrollAreaProps) {
  return (
    <div
      className={horizontal ? 'nav-scroll-area nav-scroll-area--x' : 'nav-scroll-area'}
      style={maxHeight ? { maxHeight } : undefined}
      tabIndex={0}
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------ ButtonGroup -- */

export interface ButtonGroupProps {
  children: ReactNode
  /** Names the group for assistive technology. */
  label: string
  vertical?: boolean
}

/**
 * Related buttons, joined into one control.
 *
 * Presentational only — unlike `ToggleGroup`, nothing here is selected. Use it
 * for a row of actions that belong together (Copy, Download, Share); use
 * `ToggleGroup` when one of the options is the current state.
 *
 * The seam between buttons is a border on the child rather than a gap, and the
 * group clips to its own radius, so the row reads as one object.
 */
export function ButtonGroup({ children, label, vertical }: ButtonGroupProps) {
  return (
    <div
      className={vertical ? 'nav-button-group nav-button-group--vertical' : 'nav-button-group'}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  )
}

/* --------------------------------------------------------------- Carousel -- */

export interface CarouselProps {
  children: ReactNode
  label: string
  /** Hide the arrows on a carousel meant to be swiped. */
  hideControls?: boolean
}

/**
 * A horizontally paged strip.
 *
 * CSS `scroll-snap` does the paging; the arrows call `scrollBy` and nothing
 * else. That means it works with no JavaScript, respects the reader's own
 * scroll gestures and momentum, and cannot desynchronize its idea of the
 * current slide from where the strip actually is — which is the failure mode of
 * a carousel that tracks an index in state.
 *
 * There is no autoplay and no dot pagination, deliberately. Autoplay moves
 * content out from under a reader, and it is the single most common
 * accessibility complaint about carousels.
 */
export function Carousel({ children, label, hideControls }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const page = useCallback((direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    // Page by what is visible rather than by a slide width the component would
    // have to measure — the strip may hold slides of different widths.
    track.scrollBy({ left: track.clientWidth * direction, behavior: 'smooth' })
  }, [])

  return (
    <div className="nav-carousel" role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="nav-carousel__track" ref={trackRef} tabIndex={0}>
        {children}
      </div>
      {hideControls ? null : (
        <div className="nav-carousel__controls">
          <button
            type="button"
            className="nav-carousel__control"
            onClick={() => page(-1)}
            aria-label="Previous"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <button
            type="button"
            className="nav-carousel__control"
            onClick={() => page(1)}
            aria-label="Next"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>
      )}
    </div>
  )
}

export function CarouselItem({ children }: { children: ReactNode }) {
  return <div className="nav-carousel__item">{children}</div>
}

/* ------------------------------------------------------------------ Field -- */

export interface FieldProps {
  label: ReactNode
  children: (id: string, describedBy: string | undefined) => ReactNode
  help?: ReactNode
  error?: ReactNode
  required?: boolean
}

/**
 * The label / control / help / error stack, as a render prop.
 *
 * Every field component in this library repeats that stack, and every repeat is
 * a chance to forget the `aria-describedby` wiring — which fails silently,
 * because a missing description reads as no description rather than as a bug.
 * The render prop hands the control its id and the joined describedby, so the
 * wiring is done once.
 */
export function Field({ label, children, help, error, required }: FieldProps) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [error ? errorId : null, help ? helpId : null].filter(Boolean).join(' ')

  return (
    <div className={error ? 'nav-field nav-field--invalid' : 'nav-field'}>
      <label className="nav-label" htmlFor={id}>
        {label}
        {required ? (
          <span className="nav-required" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>
      {children(id, describedBy || undefined)}
      {help ? (
        <p className="nav-field__help" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <p className="nav-field__error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/* --------------------------------------------------------------- Item row -- */

export interface ItemProps {
  /** Leading glyph or avatar. */
  media?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Trailing controls or metadata. */
  trailing?: ReactNode
}

/**
 * One row in a list of things.
 *
 * shadcn's newer `Item`. Three slots and a title, which is the shape almost
 * every list row in a portal already has — a document row, a person row, a
 * filing row — written slightly differently each time.
 */
export function Item({ media, title, description, trailing }: ItemProps) {
  return (
    <div className="nav-item">
      {media ? <div className="nav-item__media">{media}</div> : null}
      <div className="nav-item__text">
        <p className="nav-item__title">{title}</p>
        {description ? <p className="nav-item__description">{description}</p> : null}
      </div>
      {trailing ? <div className="nav-item__trailing">{trailing}</div> : null}
    </div>
  )
}
