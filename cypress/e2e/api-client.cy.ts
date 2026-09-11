/* Keyed the same way `e2e/fixtures.mjs` seeds the backend. */

import { fakeCaption, fakePerson, fakeSlug } from '../../fixtures/fake.mjs'

const LAWYER = fakePerson('e2e/lawyer')
const CLIENT = fakePerson('e2e/client')
const NEW_CLERK = fakePerson('e2e/new-clerk')
const MATTER = { name: fakeCaption('e2e/matter'), code: fakeSlug('e2e/matter', 3) }

describe('typed client against the fake OpenAPI backend', () => {
  it('refuses a listing without a session cookie', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=load-people]').click()
    cy.get('[data-testid=error]').should('contain', '401')
    cy.get('[data-testid=error]').should('contain', 'unauthenticated')
  })

  it('lists invented people after sign-in', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=load-people]').click()
    cy.get('[data-testid=status]').should('contain', 'people loaded')
    cy.get('[data-testid=people]').should('contain', LAWYER.name)
    cy.get('[data-testid=people]').should('contain', LAWYER.email)
    cy.get('[data-testid=people]').should('contain', CLIENT.name)
  })

  it('lists the seeded matter through GET /app/api/projects', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=load-projects]').click()
    cy.get('[data-testid=projects]').should('contain', MATTER.name)
    cy.get('[data-testid=projects]').should('contain', MATTER.code)
  })

  it('creates a person and shows them in the directory', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=create-person]').click()
    cy.get('[data-testid=status]').should('contain', 'person created')
    cy.get('[data-testid=people]').should('contain', NEW_CLERK.name)
    cy.get('[data-testid=people]').should('contain', NEW_CLERK.email)
  })

  it('lints a clean template and a broken one', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=validate-clean]').click()
    cy.get('[data-testid=lint]').should('contain', 'trust.md is clean')
    cy.get('[data-testid=validate-broken]').click()
    cy.get('[data-testid=lint]').should('contain', 'specimen violation')
  })

  it('posts a conversation message on the seeded matter', () => {
    cy.visit('/api-demo')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=post-message]').click()
    cy.get('[data-testid=status]').should('contain', 'message posted')
    cy.get('[data-testid=error]').should('not.exist')
  })
})
