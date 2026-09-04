describe('typed client against the fake OpenAPI backend', () => {
  it('refuses a listing without a session cookie', () => {
    cy.visit('/')
    cy.get('[data-testid=load-people]').click()
    cy.get('[data-testid=error]').should('contain', '401')
    cy.get('[data-testid=error]').should('contain', 'unauthenticated')
  })

  it('lists invented people after sign-in', () => {
    cy.visit('/')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=load-people]').click()
    cy.get('[data-testid=status]').should('contain', 'people loaded')
    cy.get('[data-testid=people]').should('contain', 'Dana Whitfield')
    cy.get('[data-testid=people]').should('contain', 'dana@example.com')
    cy.get('[data-testid=people]').should('contain', 'Amara Osei')
  })

  it('lists the Northwind matter through GET /app/api/projects', () => {
    cy.visit('/')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=load-projects]').click()
    cy.get('[data-testid=projects]').should('contain', 'Vance v. Northwind')
    cy.get('[data-testid=projects]').should('contain', 'northwind-review-0724')
  })

  it('creates a person and shows them in the directory', () => {
    cy.visit('/')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=create-person]').click()
    cy.get('[data-testid=status]').should('contain', 'person created')
    cy.get('[data-testid=people]').should('contain', 'Tobias Lindqvist')
    cy.get('[data-testid=people]').should('contain', 'tobias@example.com')
  })

  it('lints a clean template and a broken one', () => {
    cy.visit('/')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=validate-clean]').click()
    cy.get('[data-testid=lint]').should('contain', 'trust.md is clean')
    cy.get('[data-testid=validate-broken]').click()
    cy.get('[data-testid=lint]').should('contain', 'specimen violation')
  })

  it('posts a conversation message on the seeded matter', () => {
    cy.visit('/')
    cy.get('[data-testid=sign-in]').click()
    cy.get('[data-testid=post-message]').click()
    cy.get('[data-testid=status]').should('contain', 'message posted')
    cy.get('[data-testid=error]').should('not.exist')
  })
})
