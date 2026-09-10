import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { componentHref } from './routes'
import {
  ALL_COMPONENTS,
  GroupContext,
  RegistryContext,
  type SectionEntry,
} from './sections'

/*
 * One component per page, with a sidenav to the rest. The selected id comes
 * from the path (`/components/<id>`), so every entry is a plain anchor and a bookmark.
 */

/** Names the sidenav heading the sections inside it register under. */
export function SectionGroup({ name, children }: { name: string; children: ReactNode }) {
  return <GroupContext.Provider value={name}>{children}</GroupContext.Provider>
}

export function ComponentPages({ selected, children }: { selected: string; children: ReactNode }) {
  const [entries, setEntries] = useState<SectionEntry[]>([])
  const register = useCallback((entry: SectionEntry) => {
    setEntries((prev) => (prev.some((e) => e.id === entry.id) ? prev : [...prev, entry]))
    return () => setEntries((prev) => prev.filter((e) => e.id !== entry.id))
  }, [])
  const registry = useMemo(() => ({ selected, register }), [selected, register])

  return (
    <div className="gallery__layout">
      <ComponentNav entries={entries} selected={selected} />
      <div className="gallery__content">
        <RegistryContext.Provider value={registry}>{children}</RegistryContext.Provider>
      </div>
    </div>
  )
}

function ComponentNav({ entries, selected }: { entries: SectionEntry[]; selected: string }) {
  const groups = [...new Set(entries.map((entry) => entry.group))]
  return (
    <nav className="gallery-nav" aria-label="Components">
      {groups.map((group) => (
        <div className="gallery-nav__group" key={group}>
          <p className="gallery-nav__heading">{group}</p>
          <ul>
            {entries
              .filter((entry) => entry.group === group)
              .map((entry) => (
                <li key={entry.id}>
                  <NavEntry href={componentHref(entry.id)} current={selected === entry.id}>
                    {entry.title}
                  </NavEntry>
                </li>
              ))}
          </ul>
        </div>
      ))}
      <p className="gallery-nav__heading">Everything</p>
      <NavEntry href={componentHref(ALL_COMPONENTS)} current={selected === ALL_COMPONENTS}>
        All on one page
      </NavEntry>
    </nav>
  )
}

function NavEntry({ href, current, children }: { href: string; current: boolean; children: ReactNode }) {
  return (
    <a
      className={current ? 'gallery-nav__link is-current' : 'gallery-nav__link'}
      href={href}
      aria-current={current ? 'page' : undefined}
    >
      {children}
    </a>
  )
}
