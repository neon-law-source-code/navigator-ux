import { fakePerson } from '../../fixtures/fake.mjs'
import type { EnCopy } from '../../gallery/content/load'

const FILER = fakePerson('e2e/neon-site/filer')

describe('Neon Law public-site journeys', () => {
  it('starts at the legal need, then introduces the mission and subscriptions', () => {
    cy.visit('/')
    cy.contains('h1', 'What is your legal need?')
    cy.contains('h2', 'Everyone deserves to be seen.')
    cy.contains('Our north star is improving access to justice.')
    cy.get('main h1').should('have.length', 1)
    cy.get('#plans').within(() => {
      cy.contains('h3', 'Business plan')
      cy.contains('h3', 'Personal plan')
      cy.get('img').should('not.exist')
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

  it('requires a plan for custom contract reviews and trademarks, including direct links', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      const subscriberServices = ['nda', 'consulting', 'employment', 'msa', 'trademark']
      for (const id of subscriberServices) {
        const sku = en.skus.find((item) => item.id === id)!
        cy.visit(`/neon/checkout?sku=${sku.id}`)
        cy.contains('h1', sku.name)
        cy.contains(en.subscriptions.member_title)
        cy.get('form').should('not.exist')
        cy.get('.pricing-grid img').should('not.exist')
        cy.get('a[href^="mailto:"]').filter('[href*="Subscriber%20request"]')
          .should('have.attr', 'href').and('include', encodeURIComponent(sku.name))
        if (id === 'trademark') {
          cy.get('.neon-site__service-fee').should('contain', '$50')
            .and('contain', 'government filing fee')
        }
        cy.get('a[href*="/neon/fractional-gc"]').filter(`[href*="sku=${sku.id}"]`).click()
        cy.location('search').should('include', `sku=${sku.id}`)
        cy.get('.pricing-card img').should('have.length', 1)
          .and('have.attr', 'alt', en.plans[0].image.alt)
        cy.contains('a', en.subscriptions.join).should('have.attr', 'href')
          .and('include', encodeURIComponent(sku.name))
      }
    })
  })

  it('shows the same form price on the service list and detail page', () => {
    cy.visit('/neon/services')
    cy.get('.neon-site__services > li').filter(':contains("Start a company")').within(() => {
      cy.get('.neon-site__service-fee').should('contain', '$50')
        .and('contain', 'per form').and('contain', 'Free with a plan. Legal work costs extra.')
      cy.contains('a', 'Get started').click()
    })
    cy.get('.neon-site__service-fee').should('contain', '$50')
      .and('contain', 'Form fee').and('contain', 'Legal work costs extra.')
    cy.contains('Government fees cost extra')
    cy.contains('h2', 'Legal notice').should('not.exist')
  })

  it('explains form fees and preserves individual service inquiries without a business upsell', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.visit('/neon/checkout?sku=will')
      cy.contains(en.subscriptions.forms)
      cy.contains('Add Fractional GC').should('not.exist')
      cy.get('input[name=plan]').should('not.exist')
      cy.get('input[name=name]').type(FILER.name)
      cy.get('input[name=email]').type(FILER.email)
      cy.get('select[name=jurisdiction]').select('nv')
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
    cy.contains("We couldn't find a match.")
    cy.get('.nav-empty-state').contains('a', 'Email us')
    cy.contains('button', 'Show all services').click()
    cy.get('input[name=q]').should('have.value', '')
    cy.get('.neon-site__services').contains('Make a will')
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
