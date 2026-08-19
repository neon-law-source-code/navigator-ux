import { describe, expect, it } from 'vitest'
import { parseJsonApiSort, serializeJsonApiSort, toggleJsonApiSort } from '../lib/json-api-sort'

describe('parseJsonApiSort', () => {
  it('reads a bare field as ascending', () => {
    expect(parseJsonApiSort('name')).toEqual([{ key: 'name', direction: 'asc' }])
  })

  it('reads a leading dash as descending', () => {
    expect(parseJsonApiSort('-created')).toEqual([{ key: 'created', direction: 'desc' }])
  })

  it('reads a comma list as ordered tiebreakers', () => {
    expect(parseJsonApiSort('-created,name')).toEqual([
      { key: 'created', direction: 'desc' },
      { key: 'name', direction: 'asc' },
    ])
  })

  it('treats missing or empty input as no sort at all', () => {
    expect(parseJsonApiSort(null)).toEqual([])
    expect(parseJsonApiSort(undefined)).toEqual([])
    expect(parseJsonApiSort('')).toEqual([])
  })
})

describe('serializeJsonApiSort', () => {
  it('is the inverse of parseJsonApiSort', () => {
    const value = '-created,name'
    expect(serializeJsonApiSort(parseJsonApiSort(value))).toBe(value)
  })

  it('serializes no descriptors as an empty string', () => {
    expect(serializeJsonApiSort([])).toBe('')
  })
})

describe('toggleJsonApiSort', () => {
  it('starts an untouched column ascending', () => {
    expect(toggleJsonApiSort([], 'name')).toEqual([{ key: 'name', direction: 'asc' }])
  })

  it('reverses the primary column in place', () => {
    const ascending = [{ key: 'name', direction: 'asc' as const }]
    expect(toggleJsonApiSort(ascending, 'name')).toEqual([{ key: 'name', direction: 'desc' }])
  })

  it('replaces the whole list by default, single-sort mode', () => {
    const current = [
      { key: 'created', direction: 'desc' as const },
      { key: 'name', direction: 'asc' as const },
    ]
    expect(toggleJsonApiSort(current, 'email')).toEqual([{ key: 'email', direction: 'asc' }])
  })

  it('keeps the other columns as tiebreakers in multi mode', () => {
    const current = [
      { key: 'created', direction: 'desc' as const },
      { key: 'name', direction: 'asc' as const },
    ]
    expect(toggleJsonApiSort(current, 'email', { multi: true })).toEqual([
      { key: 'created', direction: 'desc' },
      { key: 'name', direction: 'asc' },
      { key: 'email', direction: 'asc' },
    ])
  })

  it('promotes and reverses an existing tiebreaker in multi mode, rather than duplicating it', () => {
    const current = [
      { key: 'created', direction: 'desc' as const },
      { key: 'name', direction: 'asc' as const },
    ]
    expect(toggleJsonApiSort(current, 'name', { multi: true })).toEqual([
      { key: 'name', direction: 'desc' },
      { key: 'created', direction: 'desc' },
    ])
  })
})
