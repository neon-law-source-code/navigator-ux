import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL ?? 'http://127.0.0.1:5175',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 8000,
  },
})
