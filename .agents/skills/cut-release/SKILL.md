---
name: cut-release
description: Prepare a named Navigator UX version bump for review and release through `main`.
---

# Cut a release

Read [`docs/releasing.md`](../../../docs/releasing.md). A release is a version bump landed through a PR. Merging the
bump to `main` is what publishes: CI reads `package.json`'s version, and when it is newer than every tag already
published, tags and cuts the tarball itself — there is no tag to push by hand.

The cadence is the same as Neon Law Navigator: **`YY.M.D`** (year, month, day in UTC, no leading zeros). August 31,
2026 is `26.8.31`.

- **No version given: ask the script for today's, before doing anything else.** Run `pnpm release:default-tag` in the
  checkout. It prints the bare `YY.M.D` version for today's UTC date on stdout when that date is releasable, and prints
  nothing to stdout — only a reason on stderr — when a version at or past today's date is already published. An empty
  stdout means there is nothing to cut: say so and stop, without touching the manifest, committing, or opening a PR.
- Verify the requested (or defaulted) version and the current manifest before changing it. A `-hotfix.N` suffix is a
  semver prerelease of that core, so it ranks *below* the matching ordinary release. After `26.8.22` is published, the
  next hotfix is `26.8.23-hotfix.1`, not `26.8.22-hotfix.1`. See
  [`docs/releasing.md`](../../../docs/releasing.md#why-a-hotfix-prerelease-ranks-below-its-date).
- Write the version into `package.json` (`version` is the bare `YY.M.D`, no `v`). Make the smallest version-only
  commit, run `.agents/skills/cut-release/scripts/preflight.sh`, and open the PR against `main`.
- Stop when that PR merges. Report its URL. The merge itself is what publishes: CI tags `v${version}`
  (`v26.8.31` for `26.8.31`) and cuts the release automatically. Do not watch the release workflow unless asked.
- Do not deploy, mutate production, or copy production coordinates into the branch, PR, or release notes.
