/*
 * Addressable views on the GitHub Pages site. Kept out of the frame component
 * file so that file only exports a component — the gallery lint budget is three
 * warnings, and they already live in the library.
 */

export type GalleryView = 'components' | 'home' | 'councils' | 'page' | 'neon'

export function pageHref(view: Exclude<GalleryView, 'components' | 'neon'>, id?: string) {
  if (view === 'page' && id) return `?showcase=page&id=${id}`
  return `?showcase=${view}`
}

/** A public-site specimen: home, services, a door page, or checkout. */
export function neonHref(id: string, sku?: string) {
  const base = `?showcase=neon&id=${id}`
  return sku ? `${base}&sku=${sku}` : base
}

export const COMPONENTS_HREF = './'

/** One component's own page. The first one is the components landing itself. */
export function componentHref(id: string) {
  return id === 'brand-tokens' ? COMPONENTS_HREF : `?component=${id}`
}

export function readComponentId(): string {
  if (typeof window === 'undefined') return 'brand-tokens'
  return new URLSearchParams(window.location.search).get('component') ?? 'brand-tokens'
}

export function readGalleryLocation(): { view: GalleryView; pageId: string | null } {
  if (typeof window === 'undefined') return { view: 'components', pageId: null }
  const params = new URLSearchParams(window.location.search)
  const showcase = params.get('showcase')
  const pageId = params.get('id')
  if (showcase === 'councils') return { view: 'councils', pageId: null }
  if (showcase === 'page') return { view: 'page', pageId }
  if (showcase === 'neon') return { view: 'neon', pageId }
  if (showcase === 'home') return { view: 'home', pageId: null }
  if (showcase) return { view: 'home', pageId: null }
  return { view: 'components', pageId: null }
}
