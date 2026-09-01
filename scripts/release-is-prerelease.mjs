#!/usr/bin/env node
/*
 * Prints "true" or "false": whether package.json's version carries a semver
 * prerelease identifier (a `-hotfix.N` suffix). ci.yml reads this to decide
 * whether the GitHub Release it creates should be flagged `--prerelease` —
 * see docs/releasing.md "Why a hotfix prerelease ranks below its date".
 *
 *   node scripts/release-is-prerelease.mjs
 */

import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseVersion } from './release-semver.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const raw = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const version = parseVersion(raw.version)

console.log(Boolean(version && version.pre))
