import { describe, expect, it } from 'vitest'
import { canonicalizeGalleryHref, formatGalleryHref, parseGalleryLocation } from '../../gallery/routes'

const ROOT = '/'
const PAGES = '/navigator-ux/'

describe('parseGalleryLocation', () => {
  it('reads the view from the path and filters from the query', () => {
    expect(parseGalleryLocation('/components/buttons-and-badges', '?brand=delete-your-data', ROOT)).toEqual({
      view: 'components',
      componentId: 'buttons-and-badges',
      pageId: null,
      sku: null,
      brand: 'delete-your-data',
    })
    expect(parseGalleryLocation('/neon/checkout', '?sku=llc-launch&brand=lawyer-shook', ROOT)).toEqual({
      view: 'neon',
      componentId: 'brand-tokens',
      pageId: 'checkout',
      sku: 'llc-launch',
      brand: 'lawyer-shook',
    })
  })

  it('still understands the query-only bookmarks', () => {
    expect(parseGalleryLocation('/', '?showcase=home', ROOT).view).toBe('home')
    expect(parseGalleryLocation('/', '?showcase=neon&id=services', ROOT)).toMatchObject({
      view: 'neon',
      pageId: 'services',
    })
    expect(parseGalleryLocation('/', '?showcase=page&id=verify-the-record', ROOT).pageId).toBe(
      'verify-the-record',
    )
    expect(parseGalleryLocation('/', '?component=buttons-and-badges', ROOT).componentId).toBe(
      'buttons-and-badges',
    )
  })

  it('lets the path win when a leftover query names a different view', () => {
    expect(parseGalleryLocation('/councils', '?showcase=home&component=icons', ROOT).view).toBe('councils')
  })

  it('strips the GitHub Pages base', () => {
    expect(parseGalleryLocation('/navigator-ux/pages', '', PAGES).view).toBe('home')
    expect(parseGalleryLocation('/navigator-ux/neon', '', PAGES).pageId).toBe('home')
  })
})

describe('formatGalleryHref', () => {
  it('puts the view on the path and brand/sku on the query', () => {
    expect(
      formatGalleryHref(
        {
          view: 'components',
          componentId: 'buttons-and-badges',
          pageId: null,
          sku: null,
          brand: 'delete-your-data',
        },
        ROOT,
      ),
    ).toBe('/components/buttons-and-badges?brand=delete-your-data')
    expect(
      formatGalleryHref(
        {
          view: 'neon',
          componentId: 'brand-tokens',
          pageId: 'checkout',
          sku: 'llc-launch',
          brand: 'neon-law',
        },
        PAGES,
      ),
    ).toBe('/navigator-ux/neon/checkout?sku=llc-launch')
  })
})

describe('canonicalizeGalleryHref', () => {
  it('rewrites a query-only bookmark to path + query', () => {
    expect(
      canonicalizeGalleryHref('/', '?showcase=neon&id=checkout&sku=llc-file&brand=delete-your-data', ROOT),
    ).toBe('/neon/checkout?brand=delete-your-data&sku=llc-file')
  })
})
