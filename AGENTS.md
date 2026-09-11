# AGENTS.md

For repository conventions, architecture, and the reasoning behind them, read [CLAUDE.md](./CLAUDE.md)
and [README.md](./README.md) — they are the source of truth. This file only records Cursor Cloud
specific operating notes.

## Cursor Cloud specific instructions

This repo *is* the package (`@neon-law-source-code/navigator-ux`): `src/` and `package.json` are at
the root, there is no workspace and no `packages/` directory, so every command runs from the repo
root. Package manager is pnpm (pinned via `packageManager` in `package.json`); Node 22 and pnpm are
already on the VM.

- Dependencies are refreshed automatically on VM startup by the environment update script, so you do
  not normally need to run `pnpm install` yourself.
- The "application" is the component **gallery** — a dev server, not a shippable app. Run it with
  `pnpm gallery` (serves <http://localhost:5174>, `strictPort` so it fails rather than moving ports).
  It imports components from `src`, so edits show up without a build. Run it as a persistent
  background/tmux process (it is a long-running foreground server).
- `pnpm check` runs the exact verify suite: `lint` + five source gates (`check:tokens`, `check:type`,
  `check:contrast`, `check:api`) + `build` + `typecheck` + `check:bundle` + `test:coverage`. It takes
  well under a minute here. `pnpm test:e2e` is a separate CI job (Cypress + the fake OpenAPI
  backend). Standard scripts are in `package.json`; the gates are explained in `README.md` and
  `CLAUDE.md`.
- Coverage is a hard gate at 90% (statements/lines/functions/branches) — see `vite.config.ts`.
- `check:bundle` reads the built `dist/`, so it only passes after `build` has run in the same
  invocation (as `pnpm check` does). Running it standalone on a clean checkout will fail because
  `dist/` is gitignored and absent.
- Non-obvious lint expectation: exactly **three** oxlint warnings are intentional (see `CLAUDE.md`).
  Warnings do not fail CI; errors do.
- Agent skills live under `.agents/skills/` (councils, `/cut-release`, `/once`, `/specimen-copy`).
  `.claude/skills` and `.codex/skills` are per-skill symlinks to those directories. Releases use
  Navigator's `YY.M.D` cadence; see [docs/releasing.md](./docs/releasing.md).
