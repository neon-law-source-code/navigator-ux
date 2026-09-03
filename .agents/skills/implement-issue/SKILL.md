---
name: implement-issue
description: >
  Ground and implement one Linear issue in its own navigator-ux worktree. Use when the user asks to implement, pick
  up, start, or build ENG-NN against this repository, whether or not it has already been triaged. Refresh from
  origin/main, read the full issue, verify it against the shipped gallery, components, docs, and tests, adjudicate
  it, then make the smallest change that satisfies the ask. Do not use for a plan-only request or for opening the
  pull request in isolation from the implementation.
---

# `/implement-issue` — ground and implement one issue

Turn one Linear issue identifier into one grounded, minimal, proven change in this repository, in one session. This
skill owns grounding, implementation, verification, and opening the PR — navigator-ux has no separate `create-pr`
skill, so the handoff step below is the whole of that flow here.

## Start current

Confirm `pwd -P` is a non-primary worktree entry (`git worktree list --porcelain`) before editing — CLAUDE.md
requires every change to start in its own worktree, since the repository is a single flattened package with no
`--filter` boundary to isolate work otherwise. Preserve unrelated changes already in the tree. Fetch and rebase on
the shipped baseline:

```bash
git fetch origin main
git rebase origin/main
```

Do not implement from a stale local `main`, and do not merge `origin/main`. If the worktree is dirty in a way that
is not this task's own work, or the rebase cannot complete safely, stop and report the condition rather than
combining unrelated changes into one PR.

## Ground the issue

Read [`CLAUDE.md`](../../../CLAUDE.md) end to end before touching anything — it is the single source of truth for
this repository's conventions, and it is short enough that skimming it costs more than reading it. Read
[`README.md`](../../../README.md) for the public-facing contract each component keeps, and the narrowest file under
[`docs/`](../../../docs) the issue touches.

Fetch the Linear issue by its `ENG-NNN` identifier through whatever Linear-connected tool this session has —
a Notion connector's search reaching into a linked Linear source is the common case, and returns only a bounded
excerpt of a long description; issue a few different queries against distinctive phrases from what you have already
read to pull further fragments of the same issue rather than assuming the first excerpt is the whole body. Read from
the opening description through the last comment. Treat a prior triage note as evidence, not authority: refresh
every claim against `origin/main` before editing, since the issue may have been filed before, during, or after other
work landed.

Check whether the issue already shipped before assuming it has not: search merged PR titles and bodies on `origin`
for the identifier (`gh pr list --state merged --search "ENG-NNN"`), and search the source, the gallery, and the
test suite for the capability the issue describes. A PR search proves an issue was linked to merged work; it does
not prove the requested capability is absent, and the inverse also holds — grep the actual `src/` and `gallery/`
trees before calling anything missing or present. Inspect other active worktrees (`git worktree list`) and open PRs
for files this issue is also likely to touch.

Reproduce the current behavior where practical — run `pnpm gallery` and look at the page the issue describes before
deciding what "still reads as the dense reference surface" (or whatever the issue's own language is) actually means
in the rendered page, not just in the source.

## Adjudicate before editing

Reach exactly one verdict from the evidence:

- **Still valid:** name the smallest behavior or page, the exact blast-radius files, and any collision with active
  work, then continue.
- **Already shipped:** cite the merged PR and the source or gallery evidence, then stop without editing.
- **Duplicate or superseded:** name the surviving issue and the evidence, then stop without editing.
- **Blocked on a decision:** name the blocker and the smallest next action, then stop without editing.

Do not post a separate triage comment before implementing — the grounding above is the first phase of this same
session, and its result directly controls whether implementation begins. Do not infer a missing design or licensing
decision CLAUDE.md does not already settle; ask instead.

## Implement

Make the smallest change that satisfies the issue, using this repository's own seams rather than inventing new
ones:

- A new specimen or sample page is a gallery-only addition (`gallery/`), never a change to what `src/index.ts`
  publishes, unless the issue is asking for a new component.
- Reuse the established specimen identity (`Vance v. Northwind`, the fictional supply-agreement breach) rather than
  inventing new fictional parties — see CLAUDE.md's note on invented specimen data and `gallery/outline-specimen.tsx`.
- A binary asset (a PDF, an image) is never committed. If the change needs one, generate it from source with a
  script under `scripts/`, write it to a gitignored path, and wire the script as a `pre<script>` hook in
  `package.json` so `pnpm gallery` and the relevant `build:*` script regenerate it — see the pattern of
  `scripts/emit-font-layer.mjs`, and keep the same-origin `pdf.js` worker contract `PdfViewer` already documents:
  no CDN `workerSrc`, and nothing that would appear as an off-origin reference if `check:bundle` ever scanned it.
- `src/` changes need a covering test under `src/test/` — the coverage gate is scoped to `src/**/*.{ts,tsx}` and is
  a hard 90% floor. Gallery-only changes are not measured by that gate and need no test file, matching every
  existing `gallery/*.tsx` page.

Document the present system only: describe current behavior and contracts, not what changed or why in retrospect.
Run [[once]] before considering the change finished — it removes the duplicate explanation agentic tooling tends to
leave across a component comment, a CSS comment, the README, and a gallery note.

## Verify and hand off

Run `pnpm check` — it is exactly what CI runs: lint, the three source gates, build, typecheck, the bundle gate, and
coverage. For any user-visible change, start the gallery (`pnpm gallery`, port 5174) and look at the actual page:
verify both color schemes (the OS-driven scheme, not a toggle — emulate `prefers-color-scheme` rather than looking
for a switch that does not exist) and capture a screenshot or short walkthrough of the real interaction.

Before handoff, rebase again (`git fetch origin main && git rebase origin/main`) and rerun `pnpm check` if anything
moved. Group the diff into Conventional Commits by blast radius — a tooling commit (a new script, a new
devDependency) separate from the feature commit it enables, separate again from a docs-only fact update. Push,
`gh pr create --base main`, and put `Closes ENG-NNN` in the PR body and nowhere else — never in the branch name or
PR title, and never a `linear.app` URL, since the roadmap stays private even though this repository is public. Name
the branch `<initials>/eng-nnn-<short-neutral-topic>` yourself. Report the PR URL and stop; this repository has no
auto-merge convention to defer to.
