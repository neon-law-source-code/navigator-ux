#!/usr/bin/env node
/*
 * Prints today's UTC YY.M.D when that date is newer than every published
 * GitHub Release; otherwise prints nothing to stdout and a reason on stderr.
 *
 *   node scripts/release-default-tag.mjs
 *   node scripts/release-default-tag.mjs --check-manifest
 *
 * The first form is what /cut-release runs when the operator names no version.
 * --check-manifest compares package.json's version to the published tags and
 * fails if it is not newer (the bump is not a release).
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  compareVersions,
  defaultTag,
  highestRelease,
  parseVersion,
} from './release-semver.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function publishedTags() {
  const remote = process.env.RELEASE_REMOTE ?? 'origin'
  let listing = ''
  try {
    listing = execFileSync('git', ['ls-remote', '--tags', '--refs', remote], {
      cwd: root,
      encoding: 'utf8',
    })
  } catch (error) {
    console.error(`FAIL: could not list tags on ${remote}: ${error.message}`)
    process.exit(2)
  }
  const tags = []
  for (const line of listing.split('\n')) {
    const match = line.match(/refs\/tags\/(\S+)$/)
    if (match) tags.push(match[1])
  }
  return tags
}

function manifestVersion() {
  const raw = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  return parseVersion(raw.version)
}

function checkManifest(tags) {
  const version = manifestVersion()
  if (!version) {
    console.error('FAIL: package.json version is not semver.')
    process.exit(1)
  }
  const highest = highestRelease(tags)
  if (!highest) {
    console.log(`${version.text} is a release (no published tags).`)
    return
  }
  const delta = compareVersions(version, highest)
  if (delta > 0) {
    console.log(`${version.text} is newer than ${highest.text}.`)
    return
  }
  if (delta === 0) {
    console.error(`FAIL: ${version.text} is already published.`)
    process.exit(1)
  }
  console.error(`FAIL: ${version.text} is older than published ${highest.text}.`)
  process.exit(1)
}

function suggestDefault(tags) {
  const candidate = defaultTag(new Date(), tags)
  if (candidate) {
    process.stdout.write(`${candidate.text}\n`)
    return
  }
  const highest = highestRelease(tags)
  const reason = highest
    ? `nothing to cut: ${highest.text} is already at or past today's date.`
    : 'nothing to cut.'
  console.error(reason)
}

const tags = publishedTags()
if (process.argv.includes('--check-manifest')) {
  checkManifest(tags)
} else {
  suggestDefault(tags)
}
