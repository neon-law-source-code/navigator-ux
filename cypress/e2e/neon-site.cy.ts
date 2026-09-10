/*
 * Renders the Neon Law public-site specimen in the gallery and checks it
 * against gallery/content/en.yaml and gallery/content/pages/*.md — the same
 * files the page loads. Change the copy there, this spec follows.
 */

interface PageDoc {
  matter: { title: string; lede: string }
  body: string
}

interface EnCopy {
  brand: string
  doors: { title: string }[]
  packages: { name: string; amount: string }[]
  skus: { id: string; item: string; name: string; amount: string }[]
  checkout: { sent: string; continue: string }
  fallback_sku: string
  categories: { value: string; label: string }[]
  catalog: { title: string; add: string; related_header: string }
  find: { prompt: string; examples: { label: string; query: string }[] }
}

const gallery = (path: string) => `/?showcase=neon&${path}`

describe('Neon Law public-site specimen', () => {
  it('renders home copy from the Markdown notation', () => {
    cy.task<PageDoc>('neonPage', 'home').then((page) => {
      cy.visit(gallery('id=home'))
      cy.contains('a', 'Neon Law')
      cy.contains('h1', page.matter.title)
      cy.contains(page.matter.lede.trim().slice(0, 40))
      cy.contains('h2', 'You have a place here.')
      cy.task<EnCopy>('neonEn').then((en) => {
        cy.contains('h2', en.find.prompt)
        for (const door of en.doors) cy.contains(door.title)
      })
    })
  })

  it('renders the services storefront from en.yaml', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.visit(gallery('id=services'))
      cy.contains('h1', en.find.prompt)
      cy.get('input[name=q]')
      cy.contains(en.catalog.title)
      cy.contains('Start a company')
      cy.contains(en.skus[0]?.item ?? '')
      for (const plan of en.packages) {
        cy.contains(plan.name)
        cy.contains(plan.amount)
      }
      const nda = en.skus.find((sku) => sku.id === 'nda')
      if (!nda) throw new Error('en.yaml is missing the nda SKU')
      cy.contains('button', 'Item 1501').click()
      cy.contains(nda.name)
      cy.contains(nda.item)
      cy.contains(nda.amount)
      cy.contains('button', 'All filings').click()
      cy.get('input[name=q]').clear()
      cy.contains(en.skus[0]?.item ?? '')
    })
  })

  it('checks out the fallback SKU without charging', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      const sku = en.skus.find((item) => item.id === en.fallback_sku)
      if (!sku) throw new Error('en.yaml is missing the fallback SKU')
      cy.visit(gallery(`id=checkout&sku=${sku.id}`))
      cy.contains('h1', sku.name)
      cy.contains(sku.item)
      cy.contains(sku.amount)
      cy.contains(en.catalog.related_header)
      cy.contains('Nevada business address')
      cy.get('input[name=name]').type('Jordan Rivera')
      cy.get('input[name=email]').type('jordan@example.com')
      cy.get('select[name=jurisdiction]').select('nv')
      cy.contains('button', en.checkout.continue).click()
      cy.contains(en.checkout.sent)
    })
  })

  it('submits the find form to the catalog path and preserves the brand', () => {
    cy.visit('/neon?brand=lawyer-shook')
    cy.get('input[name=q]').type('1501{enter}')
    cy.location('pathname').should('eq', '/neon/services')
    cy.location('search').should('include', 'q=1501').and('include', 'brand=lawyer-shook')
    cy.get('input[name=q]').should('have.value', '1501')
    cy.get('input[name=q]').clear().type('LLC{enter}')
    cy.location('pathname').should('eq', '/neon/services')
    cy.get('input[name=q]').should('have.value', 'LLC')
  })

  it('opens the catalog from a find example link', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      const example = en.find.examples[0]
      if (!example) throw new Error('en.yaml is missing find examples')
      cy.visit('/neon')
      cy.contains('a', example.label).click()
      cy.location('pathname').should('eq', '/neon/services')
      cy.get('input[name=q]').should('have.value', example.query)
    })
  })

  it('opens the catalog from a find query string', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      const nda = en.skus.find((sku) => sku.id === 'nda')
      if (!nda) throw new Error('en.yaml is missing the nda SKU')
      cy.visit(gallery(`id=services&q=${nda.item}`))
      cy.contains('h1', en.find.prompt)
      cy.get('input[name=q]').should('have.value', nda.item)
      cy.contains(nda.name)
    })
  })
})
