# Releasing Navigator UX

The cadence matches [Neon Law Navigator](https://github.com/neon-law-source-code/navigator): **`YY.M.D`**, the same
year, month, and day spelling, with no leading zeros. August 31, 2026 is `26.8.31`, not `26.08.31`. The
[`cut-release`](../.agents/skills/cut-release/SKILL.md) skill is where the operator procedure lives.

A release is a version bump landed through a PR. Merging `main` does **not** publish. CI cuts the tarball on a `v*`
tag, and nothing else: bump `package.json`, merge, then tag `v${version}` so the tag and the manifest agree.

**`YY.M.D` is a convention, not a rule.** npm parses `package.json`'s `version` as semver, so a name that departs from
the calendar publishes just as well, provided it is newer than every version already published. What the date buys is
uniqueness; comparing against the GitHub Release tags buys that directly.

## Default tag

When `/cut-release` names no version, run `pnpm release:default-tag` (`scripts/release-default-tag.mjs`) before doing
anything else. It prints today's UTC `YY.M.D` on stdout when that date is releasable, and prints nothing to stdout — only
a reason on stderr — when a version at or past today's date is already published. An empty stdout means there is nothing
to cut: say so and stop.

The script lists GitHub Release tags (stripping a leading `v`) and compares them with semver's own ordering. Three
answers:

| Answer | What happens |
| --- | --- |
| newer than every released version | print the candidate |
| equal to the newest | already released — empty stdout |
| older than the newest | a regression — empty stdout |

The first published line here was `0.1.0`. `26.8.31` is newer than `0.8.0`; that jump is the intended switch onto the
Navigator calendar, not a mistake.

## Shape

Three facts still hold, because they are semver's:

- **No leading zeros.** August is `8`; `26.08.22` is not a version at all, and neither is `-hotfix.08`.
- **Three components exactly.** npm refuses a fourth component (`26.8.22.13`).
- **No build metadata.** `+` is refused rather than depending on whose comparator ignores it.

The GitHub tag keeps the `v` prefix this repository already uses (`v26.8.31`). `package.json` does not: its version is
the bare `26.8.31`. The release job strips the `v` and asserts the remainder equals the manifest. The tarball filename
is `navigator-ux-<tag>.tgz`, so a consumer URL looks like:

```text
https://github.com/neon-law-source-code/navigator-ux/releases/download/v26.8.31/navigator-ux-v26.8.31.tgz
```

## Why a hotfix prerelease ranks below its date

The hyphen starts a **prerelease** identifier. `26.8.22-hotfix.1` is not "26.8.22 plus a fix"; it is an earlier, unstable
form of `26.8.22`, the same construct as `1.0.0-rc.1`. Semver §11.3 gives a prerelease lower precedence than the matching
normal version:

```text
26.8.21  <  26.8.22-hotfix.3  <  26.8.22-hotfix.21  <  26.8.22
26.8.22-hotfix.1  <  26.8.22  <  26.8.23-hotfix.1  <  26.8.23
```

After `26.8.22` is published, the next hotfix is `26.8.23-hotfix.1`, not `26.8.22-hotfix.1`. `N` in `-hotfix.N` is an
unpadded nonnegative integer and it is the operator's to choose: a uniqueness-and-ordering discriminator, never an hour.

A GitHub Release whose version has a prerelease identifier should be flagged `--prerelease` so it does not present
itself as the latest download.

## Gate

The documented gate is `pnpm check` — lint, the four source gates, build, typecheck, bundle, coverage. Run
`.agents/skills/cut-release/scripts/preflight.sh` before pushing the bump: clean tree, today's default-tag standing, and
`pnpm check`.

Do not deploy, mutate production, or copy production coordinates into the branch, PR, or release notes.
