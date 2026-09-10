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
  skus: { id: string; name: string; amount: string }[]
  checkout: { sent: string; continue: string }
  fallback_sku: string
  categories: { value: string; label: string }[]
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
        for (const door of en.doors) cy.contains(door.title)
      })
    })
  })

  it('renders the services storefront from en.yaml', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      cy.task<PageDoc>('neonPage', 'services').then((page) => {
        cy.visit(gallery('id=services'))
        cy.contains('h1', page.matter.title)
        for (const plan of en.packages) {
          cy.contains(plan.name)
          cy.contains(plan.amount)
        }
        const nda = en.skus.find((sku) => sku.id === 'nda')
        if (!nda) throw new Error('en.yaml is missing the nda SKU')
        cy.contains('button', 'Contracts').click()
        cy.contains(nda.name)
        cy.contains(nda.amount)
        cy.contains('button', 'All filings').click()
        cy.contains(en.skus[0]?.name ?? '')
      })
    })
  })

  it('checks out the fallback SKU without charging', () => {
    cy.task<EnCopy>('neonEn').then((en) => {
      const sku = en.skus.find((item) => item.id === en.fallback_sku)
      if (!sku) throw new Error('en.yaml is missing the fallback SKU')
      cy.visit(gallery(`id=checkout&sku=${sku.id}`))
      cy.contains('h1', sku.name)
      cy.contains(sku.amount)
      cy.get('input[name=name]').type('Jordan Rivera')
      cy.get('input[name=email]').type('jordan@example.com')
      cy.get('select[name=jurisdiction]').select('nv')
      cy.contains('button', en.checkout.continue).click()
      cy.contains(en.checkout.sent)
    })
  })
})
