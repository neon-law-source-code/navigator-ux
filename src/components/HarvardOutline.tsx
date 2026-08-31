import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

export interface HarvardOutlineSection {
  /** Stable id used as the document fragment and the nav target. */
  id: string
  /** Displayed marker: "I", "A", "1", "a". */
  marker: string
  title: string
  /** Body of this unit. Nested sections render after it. */
  children?: ReactNode
  sections?: HarvardOutlineSection[]
}

export interface HarvardOutlineViewerProps {
  sections: HarvardOutlineSection[]
  /** Names the outline landmark. */
  'aria-label'?: string
  /**
   * When set, the highlighted unit is controlled by the caller. Pair with
   * `onActiveIdChange` so scroll and keyboard still report.
   */
  activeId?: string
  onActiveIdChange?: (id: string) => void
}

interface FlatUnit {
  id: string
  marker: string
  title: string
  path: string
  depth: number
  children?: ReactNode
}

function flatten(
  sections: HarvardOutlineSection[],
  depth = 1,
  parentPath = '',
): FlatUnit[] {
  return sections.flatMap((section) => {
    const path = parentPath ? `${parentPath}.${section.marker}` : section.marker
    return [
      {
        id: section.id,
        marker: section.marker,
        title: section.title,
        path,
        depth,
        children: section.children,
      },
      ...flatten(section.sections ?? [], depth + 1, path),
    ]
  })
}

/**
 * A Harvard-outline document with a live navigator.
 *
 * The rail is the outline a lawyer already knows — Roman, then letter, then
 * Arabic — and it tracks the unit currently in view as the reader moves down
 * the document. Clicking a marker jumps there; j/k and the arrow keys step
 * when the navigator has focus. The document is handed in; this component
 * holds none of its own.
 */
export function HarvardOutlineViewer({
  sections,
  'aria-label': ariaLabel = 'Harvard outline',
  activeId,
  onActiveIdChange,
}: HarvardOutlineViewerProps) {
  const units = useMemo(() => flatten(sections), [sections])
  const navId = useId()
  const paneRef = useRef<HTMLDivElement>(null)
  const [internalId, setInternalId] = useState(units[0]?.id ?? '')
  const currentId = activeId ?? internalId

  const setCurrent = useCallback(
    (id: string) => {
      onActiveIdChange?.(id)
      if (activeId === undefined) setInternalId(id)
    },
    [activeId, onActiveIdChange],
  )

  useEffect(() => {
    if (activeId !== undefined) return
    if (units.some((unit) => unit.id === internalId)) return
    setInternalId(units[0]?.id ?? '')
  }, [activeId, internalId, units])

  useEffect(() => {
    const root = paneRef.current
    if (!root || units.length === 0 || typeof IntersectionObserver === 'undefined') {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const next = visible[0]?.target.getAttribute('data-harvard-id')
        if (next) setCurrent(next)
      },
      { root, rootMargin: '0px 0px -55% 0px', threshold: 0 },
    )

    for (const node of root.querySelectorAll('[data-harvard-id]')) {
      observer.observe(node)
    }
    return () => observer.disconnect()
  }, [setCurrent, units])

  const jumpTo = useCallback(
    (id: string) => {
      setCurrent(id)
      const pane = paneRef.current
      const target = pane
        ? Array.from(pane.querySelectorAll('[data-harvard-id]')).find(
            (node) => node.getAttribute('data-harvard-id') === id,
          )
        : undefined
      if (!(target instanceof HTMLElement)) return
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      target.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' })
    },
    [setCurrent],
  )

  const step = useCallback(
    (delta: number) => {
      const index = units.findIndex((unit) => unit.id === currentId)
      const next = units[index + delta] ?? units[delta > 0 ? units.length - 1 : 0]
      if (next) jumpTo(next.id)
    },
    [currentId, jumpTo, units],
  )

  const onNavKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'ArrowDown' || event.key === 'j' || event.key === ' ') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault()
        step(-1)
      }
    },
    [step],
  )

  if (units.length === 0) {
    return (
      <div className="harvard-outline">
        <p className="harvard-outline__empty">This outline has no sections yet.</p>
      </div>
    )
  }

  return (
    <div className="harvard-outline">
      <nav
        className="harvard-outline__nav"
        aria-label={ariaLabel}
        aria-controls={navId}
        tabIndex={0}
        onKeyDown={onNavKeyDown}
      >
        {units.map((unit) => {
          const current = unit.id === currentId
          return (
            <button
              key={unit.id}
              type="button"
              className={
                current
                  ? 'harvard-outline__item harvard-outline__item--current'
                  : 'harvard-outline__item'
              }
              data-depth={Math.min(unit.depth, 6)}
              aria-current={current ? 'location' : undefined}
              onClick={() => jumpTo(unit.id)}
            >
              <span className="harvard-outline__marker">{unit.marker}.</span>
              <span className="harvard-outline__label">{unit.title}</span>
              <span className="harvard-outline__path">{unit.path}</span>
            </button>
          )
        })}
      </nav>
      <div className="harvard-outline__doc" id={navId} ref={paneRef} tabIndex={-1}>
        {units.map((unit) => {
          const current = unit.id === currentId
          return (
            <article
              key={unit.id}
              className={
                current
                  ? 'harvard-outline__unit harvard-outline__unit--current'
                  : 'harvard-outline__unit'
              }
              data-harvard-id={unit.id}
              data-harvard-path={unit.path}
              aria-current={current ? 'location' : undefined}
            >
              <h3 className="harvard-outline__heading">
                <span className="harvard-outline__marker">{unit.marker}.</span> {unit.title}
              </h3>
              {unit.children}
            </article>
          )
        })}
      </div>
    </div>
  )
}
