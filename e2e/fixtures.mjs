/*
 * The store the fake OpenAPI backend boots with.
 *
 * The keys below are the contract with `cypress/e2e/api-client.cy.ts` and
 * `e2e/harness/App.tsx`, which draw the same values from the same keys.
 */

import { fakeCaption, fakeCompany, fakePerson, fakeSlug } from '../fixtures/fake.mjs'

export const NOW = '2026-01-15T00:00:00.000Z'

export const LAWYER = fakePerson('e2e/lawyer')
export const CLIENT = fakePerson('e2e/client')

export const ENTITY_TYPE = {
  id: '0199a1f0-0000-7000-8000-000000000001',
  name: 'Limited Liability Company',
  inserted_at: NOW,
  updated_at: NOW,
}

export const JURISDICTION = {
  id: '0199a1f0-0000-7000-8000-000000000002',
  code: 'NV',
  name: 'Nevada',
  jurisdiction_type: 'state',
  inserted_at: NOW,
  updated_at: NOW,
}

export const ENTITY = {
  id: '0199a1f0-0000-7000-8000-000000000020',
  // The suffix is fixed rather than drawn: it has to agree with ENTITY_TYPE.
  name: fakeCompany('e2e/entity', 'LLC'),
  entity_type_id: ENTITY_TYPE.id,
  jurisdiction_id: JURISDICTION.id,
  inserted_at: NOW,
  updated_at: NOW,
}

export const PROJECT_ID = '0199a1f0-0000-7000-8000-000000000010'

export function person(overrides = {}) {
  return {
    id: '0199a1f0-0000-7000-8000-000000000003',
    name: LAWYER.name,
    email: LAWYER.email,
    role: 'lawyer',
    inserted_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function project(overrides = {}) {
  return {
    id: PROJECT_ID,
    code: fakeSlug('e2e/matter', 3),
    name: fakeCaption('e2e/matter'),
    status: 'open',
    brand: 'neon',
    entity_id: ENTITY.id,
    inserted_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function seed() {
  return {
    people: [
      person(),
      person({
        id: '0199a1f0-0000-7000-8000-000000000004',
        name: CLIENT.name,
        email: CLIENT.email,
        role: 'client',
      }),
    ],
    projects: [project()],
    entities: [ENTITY],
    entityTypes: [ENTITY_TYPE],
    jurisdictions: [JURISDICTION],
    messages: [],
  }
}
