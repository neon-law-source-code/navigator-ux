#!/usr/bin/env bash
# Every release check that can fail on this machine, run before the bump is
# pushed.
#
#   preflight.sh [remote]
#
# IT TAKES NO VERSION. The version is whatever package.json says: cut-release
# wrote it, this script checks it, and ci.yml checks the tag against it again
# when the `v*` tag is pushed. One value, read in those places, named in one.
#
# Read-only and safely repeatable. It writes nothing, so a failed run costs a
# rerun.
set -euo pipefail

remote="${1:-origin}"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "${root}"

echo "==> fetching ${remote}"
git fetch "${remote}" --tags --prune

echo "==> the working tree must be clean"
if [ -n "$(git status --porcelain)" ]; then
    echo "FAIL: uncommitted changes; a release names a commit, not a desk." >&2
    git status --short >&2
    exit 1
fi
echo "    ok"

echo "==> is package.json's version a release?"
node scripts/release-default-tag.mjs --check-manifest

echo "==> YY.M.D ordering"
node --test scripts/release-semver.test.mjs

echo "==> the workspace gate"
pnpm check

echo
echo "preflight passed."
echo
echo "Merging main does not publish. After the bump merges, tag v\$(node -p 'require(\"./package.json\").version') and push it."
