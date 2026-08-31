import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  compareVersions,
  defaultTag,
  parseVersion,
  stripTagPrefix,
  todayTag,
} from './release-semver.mjs'

function v(text) {
  const parsed = parseVersion(text)
  assert.ok(parsed, text)
  return parsed
}

function utc(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

describe('release semver', () => {
  it('strips the v prefix this repository uses on tags', () => {
    assert.equal(stripTagPrefix('v26.8.31'), '26.8.31')
    assert.equal(stripTagPrefix('26.8.31'), '26.8.31')
  })

  it('accepts the convention and ordinary semver', () => {
    for (const text of [
      '26.8.22',
      '26.8.22-hotfix.22',
      '26.12.31',
      '0.7.0',
      '0.8.0',
      '26.8.22-rc.1',
    ]) {
      assert.ok(parseVersion(text), text)
    }
  })

  it('refuses leading zeros, a fourth component, and build metadata', () => {
        for (const text of ['26.08.22', '26.8.22.13', '26.8.22+hotfix.1', '26.8.22-hotfix.08']) {
      assert.equal(parseVersion(text), null, text)
    }
  })

  it('orders a hotfix below its date', () => {
    const order = [
      '26.8.21',
      '26.8.22-hotfix.3',
      '26.8.22-hotfix.21',
      '26.8.22',
      '26.8.23-hotfix.1',
    ]
    for (let i = 0; i < order.length - 1; i += 1) {
      assert.ok(compareVersions(v(order[i]), v(order[i + 1])) < 0, `${order[i]} < ${order[i + 1]}`)
    }
  })

  it('formats today without padding', () => {
    assert.equal(todayTag(utc(2026, 8, 31)), '26.8.31')
    assert.equal(todayTag(utc(2026, 1, 5)), '26.1.5')
  })

  it('suggests today when it is newer than every release', () => {
    const suggested = defaultTag(utc(2026, 8, 31), ['v0.8.0', 'v0.7.0'])
    assert.equal(suggested?.text, '26.8.31')
  })

  it('prints nothing when today is already published', () => {
    assert.equal(defaultTag(utc(2026, 8, 22), ['26.8.22']), null)
    assert.equal(defaultTag(utc(2026, 8, 21), ['26.8.22']), null)
  })
})
