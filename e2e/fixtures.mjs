/*
 * Invented directory for the fake OpenAPI backend. Names and addresses are
 * the same fictional set the gallery already uses — IANA example.com, no
 * client matter.
 */

export const NOW = '2026-01-15T00:00:00.000Z'

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
  name: 'Northwind Holdings LLC',
  entity_type_id: ENTITY_TYPE.id,
  jurisdiction_id: JURISDICTION.id,
  inserted_at: NOW,
  updated_at: NOW,
}

export function person(overrides = {}) {
  return {
    id: '0199a1f0-0000-7000-8000-000000000003',
    name: 'Dana Whitfield',
    email: 'dana@example.com',
    role: 'lawyer',
    inserted_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function project(overrides = {}) {
  return {
    id: '0199a1f0-0000-7000-8000-000000000010',
    code: 'northwind-review-0724',
    name: 'Vance v. Northwind',
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
        name: 'Amara Osei',
        email: 'amara@example.com',
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
