/*
 * Addressable views on the GitHub Pages site. Kept out of the frame component
 * file so that file only exports a component — the gallery lint budget is three
 * warnings, and they already live in the library.
 */

import { DEFAULT_BRAND_ID, isGalleryBrandId, type GalleryBrandId } from './brands'

export type GalleryView = 'components' | 'home' | 'councils' | 'page' | 'neon'

const BRAND_QUERY = 'brand'

function fromLocation() {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function hrefWith(mutate: (params: URLSearchParams) => void) {
  const params = fromLocation()
  mutate(params)
  const query = params.toString()
  return query ? `?${query}` : './'
}

/** Components landing, keeping the current brand layer. */
export function componentsHref() {
  return hrefWith((params) => {
    params.delete('showcase')
    params.delete('id')
    params.delete('sku')
    params.delete('component')
  })
}

export function pageHref(view: Exclude<GalleryView, 'components' | 'neon'>, id?: string) {
  return hrefWith((params) => {
    params.delete('component')
    params.delete('sku')
    if (view === 'page' && id) {
      params.set('showcase', 'page')
      params.set('id', id)
      return
    }
    params.delete('id')
    params.set('showcase', view)
  })
}

/** A public-site specimen: home, services, a door page, or checkout. */
export function neonHref(id: string, sku?: string) {
  return hrefWith((params) => {
    params.delete('component')
    params.set('showcase', 'neon')
    params.set('id', id)
    if (sku) params.set('sku', sku)
    else params.delete('sku')
  })
}

/** One component's own page. The first one is the components landing itself. */
export function componentHref(id: string) {
  return hrefWith((params) => {
    params.delete('showcase')
    params.delete('id')
    params.delete('sku')
    if (id === 'brand-tokens') params.delete('component')
    else params.set('component', id)
  })
}

export function brandHref(id: GalleryBrandId) {
  return hrefWith((params) => {
    if (id === DEFAULT_BRAND_ID) params.delete(BRAND_QUERY)
    else params.set(BRAND_QUERY, id)
  })
}

export function readComponentId(): string {
  return fromLocation().get('component') ?? 'brand-tokens'
}

export function readBrandId(): GalleryBrandId {
  const id = fromLocation().get(BRAND_QUERY)
  return isGalleryBrandId(id) ? id : DEFAULT_BRAND_ID
}

export function readGalleryLocation(): { view: GalleryView; pageId: string | null } {
  const params = fromLocation()
  const showcase = params.get('showcase')
  const pageId = params.get('id')
  if (showcase === 'councils') return { view: 'councils', pageId: null }
  if (showcase === 'page') return { view: 'page', pageId }
  if (showcase === 'neon') return { view: 'neon', pageId }
  if (showcase === 'home') return { view: 'home', pageId: null }
  if (showcase) return { view: 'home', pageId: null }
  return { view: 'components', pageId: null }
}
