import { fakePerson } from '../../fixtures/fake.mjs'
import type { CatalogDocument } from '../../gallery/content/catalog'
import type { EnCopy } from '../../gallery/content/load'

const FILER = fakePerson('e2e/neon-site/filer')

describe('Neon Law public-site journeys', () => {
  /*
   * The shared sentences are authored in Navigator and vendored here as a
   * pinned artifact. This walks the real pages in a real browser and asserts
   * each one publishes the wording that artifact carries — so a re-export that
   * changes a sentence is visible here, and an unresolved reference is not
   * mistaken for copy.
   */
  it('publishes the copy the pinned marketing catalog authors', () => {
    cy.task<CatalogDocument>('neonCatalog').then((catalog) => {
      const shared = (key: string) => {
        const value = catalog.payload.entries[key]
        expect(value, `the pinned catalog must author ${key}`).to.be.a('string')
        return value as string
      }
      expect(catalog.payload.catalog_version).to.eq(1)
      expect(catalog.payload.source.revision).to.match(/^[0-9a-f]{40}$/)

      const pages: [string, string[]][] = [
        ['/', ['home.need_prompt', 'home.mission_heading', 'home.mission_north_star', 'home.mission_promise']],
        ['/neon/services', ['services.eyebrow', 'services.title', 'services.lede']],
        ['/neon/litigation', ['litigation.title', 'litigation.lede', 'litigation.cta', 'litigation.cases_help_others']],
        ['/neon/fractional-gc', ['fractional_gc.title', 'fractional_gc.lede', 'fractional_gc.price']],
        ['/neon/personal-plan', ['personal_plan.title', 'personal_plan.price']],
      ]
      for (const [path, keys] of pages) {
        cy.visit(path)
        for (const key of keys) cy.contains(shared(key))
        cy.get('body').should('not.contain.text', '{shared:')
      }
    })
  })

  it('starts at the legal need, then introduces the mission and practice doors', () => {
    cy.visit('/')
    cy.contains('h1', 'What is your legal need?')
    cy.contains('h2', 'Everyone deserves to be seen.')
    cy.contains('Our north star is improving access to justice.')
    cy.get('main h1').should('have.length', 1)
    cy.get('.neon-site__practices').within(() => {
      cy.contains('h3', 'Business plan')
      cy.contains('h3', 'Personal plan')
    })
    cy.get('input[name=q]').type('contract{enter}')
    cy.location('pathname').should('eq', '/neon/services')
    cy.get('.neon-site__services').contains('Review a confidentiality agreement')
  })

  it('finds subscription and litigation paths with ordinary language', () => {
    cy.visit('/neon/services?q=I%20need%20help%20with%20a%20contract')
    cy.get('.neon-site__services').contains('Review a confidentiality agreement')
    cy.get('.pricing-grid').contains('Business plan')
    cy.get('.pricing-grid img').should('not.exist')
    cy.get('input[name=q]').clear().type('litigation')
    cy.contains('a', 'Request a free consultation').click()
    cy.location('pathname').should('eq', '/neon/litigation')
    cy.contains('a', 'Request a free consultation')
      .should('have.attr', 'href', 'mailto:contact@neonlaw.com?subject=Free%20consultation%20about%20a%20dispute')
  })

  it('lets a visitor inquire about a contract review without a plan wall', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.visit('/neon/checkout?sku=nda')
      cy.contains('h1', 'Review a confidentiality agreement')
      cy.get('form').should('exist')
      cy.get('.neon-site__service-fee').should('contain', '$100').and('contain', 'per contract')
      cy.contains('Add Fractional GC').should('not.exist')
      cy.visit('/neon/checkout?sku=trademark')
      cy.get('.neon-site__service-fee').should('contain', '$100')
        .and('contain', 'government filing fees')
      cy.visit('/neon/fractional-gc?sku=trademark')
      cy.location('search').should('include', 'sku=trademark')
      cy.get('.pricing-card img').should('have.length', 1)
        .and('have.attr', 'alt', en.plans[0].image.alt)
    })
  })

  it('shows the same form price on the service list and detail page', () => {
    cy.visit('/neon/services')
    // Packages list "Start a company" as a member, so match the service heading.
    cy.contains('.neon-site__services > li > div > h3', 'Start a company')
      .closest('li')
      .within(() => {
        cy.get('.neon-site__service-fee').should('contain', '$100')
          .and('contain', 'per form')
        cy.contains('a', 'Get started').click()
      })
    cy.get('.neon-site__service-fee').should('contain', '$100')
      .and('contain', 'A la carte price')
    cy.contains('Government fees cost extra')
    cy.contains('h2', 'Legal notice').should('not.exist')
  })

  it('explains form fees and preserves individual service inquiries without a business upsell', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.visit('/neon/services')
      cy.contains(en.subscriptions.forms)
      cy.visit('/neon/checkout?sku=will')
      cy.contains('Add Fractional GC').should('not.exist')
      cy.get('input[name=plan]').should('not.exist')
      cy.get('input[name=name]').type(FILER.name)
      cy.get('input[name=email]').type(FILER.email)
      cy.get('select[name=jurisdiction]').select('nv')
      cy.contains(en.checkout.consent).should('contain', en.brand).and('not.contain', '{site_name}')
      cy.get('input[name=sms]').check().should('be.checked')
      cy.contains('button', en.checkout.continue).click()
      cy.contains(en.checkout.sent)
      cy.get('kbd').should('not.exist')
    })
  })

  it('recovers from no results and resets a category when the need changes', () => {
    cy.visit('/neon/services')
    cy.contains('button', 'Wills & family plans').click()
    cy.get('.neon-site__services').contains('Make a will')
    cy.get('.neon-site__services').contains('Review a confidentiality agreement').should('not.exist')
    cy.get('input[name=q]').type('NDA')
    cy.get('.neon-site__services').contains('Review a confidentiality agreement')
    cy.get('input[name=q]').clear().type('zzzzzz')
    cy.contains('We could not find a match.')
    cy.get('.nav-empty-state').contains('a', 'Email us')
    cy.contains('button', 'Show all services').click()
    cy.get('input[name=q]').should('have.value', '')
    cy.get('.neon-site__services').contains('Make a will')
  })

  /*
   * The header, the count, and the notices a reader prices against — the parts
   * of the live pages that are this repository's own words rather than the
   * pinned catalog's, and so the parts that drift without a re-export.
   */
  it('publishes the header, the result count, and the footer notices the live site does', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.visit('/neon/services')
      cy.get('.site-header').within(() => {
        for (const label of ['Business', 'Personal', 'Services', 'Disputes']) cy.contains('a', label)
        cy.contains('a', 'Business plan').should('not.exist')
      })
      cy.contains(`Showing all ${en.skus.length} services.`)
      cy.contains('button', 'Wills & family plans').click()
      cy.contains(`Showing all ${en.skus.length} services.`).should('not.exist')
      cy.contains(`of ${en.skus.length} services.`)
      cy.contains('h2', 'How it works')
      cy.contains(en.process.intro)
      cy.get('.site-footer__legal').should('contain', 'U.S. Reg. No. 6,325,650')
        .and('contain', 'Attorney advertisement')
    })
  })

  it('names each service category and its government fees on the list', () => {
    cy.visit('/neon/services')
    cy.contains('.neon-site__services > li > div > h3', 'Start a company')
      .closest('li')
      .within(() => {
        cy.get('.neon-site__eyebrow').should('contain', 'Start a business')
        cy.get('.neon-site__fee-note').should('contain', 'Government fees cost extra')
      })
    cy.contains('.neon-site__services > li > div > h3', 'Review a confidentiality agreement')
      .closest('li')
      .within(() => {
        cy.get('.neon-site__eyebrow').should('contain', 'Contracts & forms')
        cy.get('.neon-site__fee-note').should('not.exist')
      })
  })

  it('preserves branded searches and legacy service links', () => {
    cy.visit('/neon?brand=lawyer-shook')
    cy.get('input[name=q]').type('NDA{enter}')
    cy.location('pathname').should('eq', '/neon/services')
    cy.location('search').should('include', 'q=NDA').and('include', 'brand=lawyer-shook')
    cy.visit('/?showcase=neon&id=services&q=1501')
    cy.get('input[name=q]').should('have.value', '1501')
    cy.get('.neon-site__services').contains('Review a confidentiality agreement')
    cy.get('.neon-site__services').contains('1501').should('not.exist')
  })

  it('keeps the home usable on a phone', () => {
    cy.viewport(390, 844)
    cy.visit('/')
    cy.contains('h1', 'What is your legal need?').should('be.visible')
    cy.contains('a', 'A dispute').click()
    cy.get('.neon-site__litigation').should('be.visible')
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth)
    })
  })
})
