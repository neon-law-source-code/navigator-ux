# Releasing Navigator UX

The cadence matches [Neon Law Navigator](https://github.com/neon-law-source-code/navigator): **`YY.M.D`**, the same
year, month, and day spelling, with no leading zeros. August 31, 2026 is `26.8.31`, not `26.08.31`. The
[`cut-release`](../.agents/skills/cut-release/SKILL.md) skill is where the operator procedure lives.

A release is a version bump landed through a PR. There is one decision that publishes it: merging the bump to
`main`. `ci.yml`'s `release-version` job then reads `package.json`'s version and compares it against every tag
already published; when it is newer, `release-tag` creates and pushes `v${version}` and `release` cuts the tarball
behind it, all in the same run. An ordinary merge that carries no bump answers "not a release" in seconds and nothing
downstream runs.

There is deliberately no hand-pushed tag as a second way to publish — keeping one would mean keeping a way for the
tag and the manifest to disagree, which is exactly the failure this design removes by construction rather than by
asserting it in CI.

**`release-version` does have two *triggers*, though, and that is not the same thing as a second way to publish —
both name the identical decision, off the identical commit.** Nearly every merge here lands through
`enable-automerge`'s bot-armed auto-merge, and GitHub does not start a new workflow run for a `push` an Actions
`GITHUB_TOKEN` caused — the anti-recursion rule. A `push`-only trigger silently never fires for a bot-merged PR: `v26.9.1`
sat on `main` unreleased for exactly this reason before the `pull_request: closed` (with `merged == true`) trigger was
added. That event is a PR lifecycle event rather than a token-attributed push, so it fires regardless of who performed
the merge, and it is the trigger that actually does the work in this repository. `push` stays only for the rare
commit that reaches `main` some other way.

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
the bare `26.8.31`. `release-version` reads the manifest and names the tag from it directly, so there is no separate
value to assert against — the two cannot disagree. The tarball filename is `navigator-ux-<tag>.tgz`, so a consumer URL
looks like:

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

A GitHub Release whose version has a prerelease identifier is flagged `--prerelease` so it does not present itself as
the latest download. `ci.yml` reads this off `scripts/release-is-prerelease.mjs` — the same `parseVersion` the ordering
check above uses — so a hotfix bump gets it automatically; nothing about the release commit or PR title decides it.

## Tag provenance

The tag is created by `release-tag` under the `github-actions[bot]` identity, not signed. The manual flow this
replaced used `git tag -s`; CI has no GPG key to sign with; and this repository deliberately holds no secrets to
provision one (see the "Publishing" section of `CLAUDE.md`). What the automation buys instead is a stronger
guarantee than a signature gives: the tag cannot exist without matching the manifest of the commit it names, because
`release-version` derives it from that manifest rather than checking two independently-supplied values against each
other.

## Gate

The documented gate is `pnpm check` — lint, the five source gates, build, typecheck, bundle, coverage. Run
`.agents/skills/cut-release/scripts/preflight.sh` before pushing the bump: clean tree, today's default-tag standing, and
`pnpm check`.

Do not deploy, mutate production, or copy production coordinates into the branch, PR, or release notes.
