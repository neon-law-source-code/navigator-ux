import deleteYourDataSheet from './brands/delete-your-data.css?inline'
import lawyerShookSheet from './brands/lawyer-shook.css?inline'

/*
 * The compiled brands the gallery can wear. Neon Law is the library default
 * (no extra sheet). Each other entry is a `:root:root` layer plus self-hosted
 * `@font-face` rules — the same shape an app copies.
 *
 * Sheets are inlined rather than loaded as `<link href>` because Vite's
 * `?url` in the gallery dev server points at a JS module, which a stylesheet
 * link cannot apply.
 */

export const DEFAULT_BRAND_ID = 'neon-law'

export const GALLERY_BRANDS = [
  { id: DEFAULT_BRAND_ID, label: 'Neon Law', sheet: null },
  { id: 'delete-your-data', label: 'DeleteYourData.com', sheet: deleteYourDataSheet },
  { id: 'lawyer-shook', label: 'Lawyer Shook', sheet: lawyerShookSheet },
] as const

export type GalleryBrandId = (typeof GALLERY_BRANDS)[number]['id']

const IDS = new Set<string>(GALLERY_BRANDS.map((brand) => brand.id))

export function isGalleryBrandId(value: string | null): value is GalleryBrandId {
  return value !== null && IDS.has(value)
}
