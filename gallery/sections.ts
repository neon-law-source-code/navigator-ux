import { createContext, useContext, useEffect } from 'react'

/*
 * The section registry behind the components sidenav. Sections register
 * themselves as they mount — hidden ones included, since a hidden section
 * renders nothing but still runs its effect — so the nav is built from what is
 * actually on the page and cannot drift from it.
 */

export interface SectionEntry {
  id: string
  title: string
  group: string
}

interface Registry {
  selected: string
  register: (entry: SectionEntry) => () => void
}

export const RegistryContext = createContext<Registry | null>(null)
export const GroupContext = createContext('Reference surface')

export const ALL_COMPONENTS = 'all'
export const FIRST_COMPONENT = 'brand-tokens'

export function sectionId(title: string) {
  return title.toLowerCase().replace(/\W+/g, '-')
}

/** Registers a section and says whether it is the one on show. */
export function useSection(title: string): { id: string; shown: boolean } {
  const registry = useContext(RegistryContext)
  const group = useContext(GroupContext)
  const id = sectionId(title)
  const register = registry?.register
  useEffect(() => register?.({ id, title, group }), [register, id, title, group])
  const selected = registry?.selected ?? ALL_COMPONENTS
  return { id, shown: selected === ALL_COMPONENTS || selected === id }
}
