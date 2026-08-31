/*
 * Semver compare for the YY.M.D release cadence Navigator uses.
 *
 * npm and Cargo both parse the same three-component shape. A prerelease ranks
 * below its matching core (semver §11.3), which is why 26.8.22-hotfix.1 cannot
 * follow 26.8.22. See docs/releasing.md.
 */

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/

export function stripTagPrefix(tag) {
  return tag.startsWith('v') ? tag.slice(1) : tag
}

export function parseVersion(text) {
  const match = VERSION.exec(text)
  if (!match) return null
  const major = parseNumeric(match[1])
  const minor = parseNumeric(match[2])
  const patch = parseNumeric(match[3])
  if (major === null || minor === null || patch === null) return null
  const pre = match[4] ? match[4].split('.') : null
  if (pre) {
    for (const ident of pre) {
      if (/^\d+$/.test(ident) && parseNumeric(ident) === null) return null
    }
  }
  return { major, minor, patch, pre, text }
}

function parseNumeric(part) {
  if (!/^(0|[1-9]\d*)$/.test(part)) return null
  return Number(part)
}

function cmpIdent(left, right) {
  const leftNumeric = /^\d+$/.test(left)
  const rightNumeric = /^\d+$/.test(right)
  if (leftNumeric && rightNumeric) {
    const delta = Number(left) - Number(right)
    return delta !== 0 ? delta : 0
  }
  if (leftNumeric) return -1
  if (rightNumeric) return 1
  if (left < right) return -1
  if (left > right) return 1
  return 0
}

export function compareVersions(left, right) {
  if (left.major !== right.major) return left.major - right.major
  if (left.minor !== right.minor) return left.minor - right.minor
  if (left.patch !== right.patch) return left.patch - right.patch
  if (!left.pre && !right.pre) return 0
  if (!left.pre) return 1
  if (!right.pre) return -1
  const n = Math.max(left.pre.length, right.pre.length)
  for (let i = 0; i < n; i += 1) {
    if (left.pre[i] === undefined) return -1
    if (right.pre[i] === undefined) return 1
    const delta = cmpIdent(left.pre[i], right.pre[i])
    if (delta !== 0) return delta
  }
  return 0
}

export function todayTag(now = new Date()) {
  const year = now.getUTCFullYear() % 100
  const month = now.getUTCMonth() + 1
  const day = now.getUTCDate()
  return `${year}.${month}.${day}`
}

export function highestRelease(tags) {
  let highest = null
  for (const tag of tags) {
    const parsed = parseVersion(stripTagPrefix(tag))
    if (!parsed) continue
    if (!highest || compareVersions(parsed, highest) > 0) highest = parsed
  }
  return highest
}

export function defaultTag(now, tags) {
  const candidate = parseVersion(todayTag(now))
  if (!candidate) return null
  const highest = highestRelease(tags)
  if (!highest) return candidate
  return compareVersions(candidate, highest) > 0 ? candidate : null
}
