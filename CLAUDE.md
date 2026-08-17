# neon-law-foundation/navigator-ux

Public, open source, dual-licensed **MIT OR Apache-2.0** — see [LICENSE.md](./LICENSE.md). Anyone may
use, fork, and ship this. Write for that audience: a comment that assumes the reader works here is a
comment that will confuse most of the people who read it.

The trademark is not licensed with the code. The Neon Law and Neon Law Foundation names and logos stay
ours; the components do not.

## Layout

**The repository is the package.** `src/` is at the root, `package.json` at the root *is*
`@neon-law-foundation/navigator-ux`, and there is no workspace and no `packages/` directory.

| Path | What |
| --- | --- |
| `src/` | The library. `src/index.ts` is the published entry and is re-exports only. |
| `gallery/` | The specimen page. A dev server, never published. |
| `scripts/` | The four gates and the font-emit step. Each resolves its root as `scripts/..`. |
| `docs/` | Prose that does not belong in the README. |

This was a pnpm workspace with a single package under `packages/ux` until shortly before the first
public release. The reasoning recorded for that arrangement — that a second *library* package was the
expected way to grow — never paid off, and it charged a real toll for the whole life of the
repository: every command needed
`--filter`, every path in CI and the docs carried the prefix, and the root `package.json` was a
second manifest that had to be kept in step with the one that actually shipped. One package in one
repository should look like one package. If a second library is ever genuinely wanted, it gets its
own repository and its own release cadence, which is what the applications already do.

Applications are **not** built here. They install a released version from npm, which is what keeps a
component change from being live anywhere until a consumer chooses to bump. See
[docs/consuming-the-library.md](./docs/consuming-the-library.md).

## Commands

Everything runs from the repository root, because there is nowhere else.

```bash
pnpm install
pnpm check              # lint + four gates + build + typecheck + bundle gate + coverage
pnpm gallery            # every component on one page at :5174, from src
pnpm dev                # build --watch, for a linked consumer
pnpm lint               # oxlint
pnpm check:tokens       # no literal color outside the token layer (source)
pnpm check:type         # two font weights, and no literal corner radius (source)
pnpm check:contrast     # every palette pairing clears its WCAG floor (source)
pnpm check:bundle       # no off-origin reference in the built bundle (needs dist)
pnpm test               # vitest, once
pnpm test:coverage      # coverage report + threshold gate
```

`check` is what CI runs. Build precedes typecheck. That order is not load-bearing
here — nothing in this repository consumes the built `dist` — but it is kept
because it *is* load-bearing in a consuming app: those resolve the package
through its `dist`, which does not exist on a clean checkout, so typechecking
first fails with "cannot find module".

Adding a dependency: `pnpm add <pkg>`. There is one manifest, so there is no longer a question of
which one it belongs in.

**Vitest's test glob is pinned to `src/`.** The package root is now the repository root, so the
default glob would also match any checkout sitting inside it — a git worktree under `.claude/`, whose
copy of an older suite then runs and fails against today's source. That happened during the flatten.
`test.include` in `vite.config.ts` and an `.claude/**` entry in `.oxlintrc.json` are what stop it.

**Neither Vite config is typechecked, deliberately.** They are Node programs — `node:path`,
`import.meta.dirname` — and putting them in `tsconfig.json`'s `include` would mean adding `node` to
`types`, which puts `process` and `Buffer` in scope for every component and every gallery page.
Browser code reaching for a Node global should fail to compile, so two unchecked config files is the
cheaper trade.

## Stack

Vite 8, React 19, TypeScript strict, Vitest with jsdom and Testing Library. No CRA — it was
deprecated in February 2025 and does not support React 19 cleanly.

## Conventions that are not obvious

**No real content lives here, and now it cannot.** This repository is public. The components in
`src/` render whatever they are handed and hold no content of their own — transcribed
correspondence, authority holdings, pin cites, and case facts belong in a consuming application's
`src/data`, never in a component. That was already the rule for a design reason: a component with
text baked into it ships one customer's content to every other one. Publishing the repository turns
it into a disclosure rule as well. The gallery's specimen data is invented for exactly this reason,
and anything you add to it should be too.

**Binary files never enter this repository.** No PDFs, no exhibits, no vendored images. Git keeps
binaries forever — the document directory in the static site this library replaced was 49 MB against
a 1.93 GB packed history — and a public repository makes that permanent for everyone. The two
vendored woff2 files are the deliberate exception, because a self-hosted font is the whole reason
`check:bundle` can forbid off-origin references.

**Components do not authenticate.** They read an already-verified session and render. A gateway
verifies the JWT; the browser never sees a signing key. A component that validated its own token
would be trusting a value the reader controls — which is why `SessionProvider` reads a
server-rendered endpoint rather than parsing anything itself.

**Design tokens are designed here, and every ratio is enforced.** `src/styles/tokens.css`
used to be a byte-for-byte transcription of a client's stylesheet, kept frozen because changing a
value moved live client pages. That constraint is gone. What replaced it is arithmetic: every pairing
carries its measured contrast ratio, and `pnpm check:contrast` recomputes all 88 of them from the file
and fails the build if one drops under its floor.

That gate is not decoration. The first time it ran it found two status colors that had never cleared
WCAG AA in any release — `#dc3545` at 4.29:1 and `#198754` at 4.30:1 on the raised surface a form
message actually sits on. Both had a hand-written comment beside them claiming they were fine. Nobody
can look at two hex values and see 4.29, which is exactly why the numbers had drifted and exactly why
they are now computed.

Changing a token is still a visual regression rather than a refactor. Run the gallery and look at it
in both schemes.

**The three-layer token split is load-bearing.** `tokens.css` (the `--nav-*` contract at `:root`,
plus the Neon Law teal), a brand layer (an app's override at `:root:root`), and `theme.css` (every
component rule, reading `var(--nav-*)` and never a literal color). Collapsing them into one file is
the single refactor that would quietly destroy the reason the system exists: swapping the middle
layer is what restyles everything without touching a component. A brand layer wins on
**specificity**, not source order — a layer that depends on arriving last silently loses the day
something else is injected after it.

**No brand layer ships, and that is deliberate.** The library has one identity. Layer two is a
stylesheet a consumer writes, and `gallery/brand-example-tokens.css` is the commented template plus
the demo the gallery switch attaches. It lives in `gallery/` rather than `src/` precisely so it
cannot be mistaken for something published. The library used to ship a client's orange as a second
brand; shipping one adopter's color in an open-source package is how a design system acquires
identities nobody maintains.

**The neutrals are tinted, and that is the whole look.** Surfaces, borders, and text carry a trace of
the same teal, so a card, its border, and the button on it read as designed together. A pure-grey
ground with a teal button is what this deliberately is not. If you neutralise them you have not
simplified the palette, you have removed the design.

**The scheme follows the OS, and only the OS.** No toggle, no stored choice, no `data-theme`, and
therefore no pre-paint script and no flash to design around. `ThemeProvider` sets no styling; it
reports `prefers-color-scheme` so a component can branch where CSS cannot. Anything expressible in
CSS is a token, not a call to `useTheme()`.

**CSS ships as one file, and its name is pinned.** The library emits `dist/navigator-ux.css` — fonts,
tokens, components — which consumers import as
`@neon-law-foundation/navigator-ux/styles.css`. Vite library mode does not inject it.

In library mode Vite derives the stylesheet's filename from the **package name**, so renaming the
package silently renames the file while the `exports` map goes on pointing at the old one. Nothing
fails: the build succeeds, the package publishes, and every consumer's stylesheet import resolves to
nothing. That happened during the rename to `navigator-ux`. The name is now pinned in
`vite.config.ts` (`STYLESHEET`) and `scripts/emit-font-layer.mjs` asserts post-build that the file
`exports["./styles.css"]` promises is a file the build actually produced.

**The font is emitted, not inlined, and that takes a build step.** Vite's library mode inlines every
asset a stylesheet references as a data: URI and ignores `assetsInlineLimit` doing it, which turned
88 KB of woff2 into ~120 KB of base64 in a render-blocking stylesheet (it went 42 KB → 163 KB).
`scripts/emit-font-layer.mjs` therefore keeps `fonts.css` out of the Vite graph, copies it and the
two woff2 files into `dist`, and prepends the `@import` to the emitted stylesheet. Consumers still import one
stylesheet.

**The shadcn-derived set has no runtime dependencies, and that is the point.** `Accordion`,
`Dialog`, `Sheet`, `Switch`, `Combobox`, `AspectRatio`, and the rest take shadcn/ui's semantics and
rebuild them on the platform primitive that already carries them — `<details>`, `<dialog>`, a
checkbox with `role="switch"`, `<input list>`, CSS `aspect-ratio`. This library loads on every page
of every portal, so five Radix packages is a cost imposed on all of them, and each platform
primitive brings something Radix cannot: `<details>` participates in in-page find, `<dialog>` gets
the top layer and inertness from the browser, a checkbox posts without JavaScript. `Popover`,
`DropdownMenu`, and `Tooltip` are the exception — no platform primitive covers them, so they share
one `useDismissible` hook rather than three hand-rolled copies. Reach for Radix only when you can
name what the platform is missing.

**The shipped font is OFL, and the recommended one is not shipped at all.** `fonts.css` vendors
Source Serif 4 at 400 and 700 — the Google Fonts latin subset, from `@fontsource/source-serif-4`,
under SIL OFL 1.1. The OFL is the whole reason a font can be in a public package: it permits bundling
and redistribution outright, so `dist` carries the woff2 files and every consumer redistributes them
again without a licence of their own. `emit-font-layer.mjs` copies `OFL.txt` into `dist` beside them,
because the licence requires the notice to travel with the font and consumers receive `dist` and
nothing else.

This was GORP Serif until the last change before the first public release. Those files carried
`Copyright: TrashType, LLC`, `Trademark: TrashType, LLC`, designer Mark Johnson, terms at
<https://trashtype.com/legal> — readable out of the
binaries with `fontTools`, and stated nowhere in the repository, which is how it survived this long.
Two problems, both live the moment the repository went public: `files: ["dist"]` plus the `@font-face`
rules meant **the build shipped them and every consumer redistributed them too**, and `LICENSE.md`
granted everyone MIT-or-Apache rights over "this software" while `LICENSE-MIT` reads `Copyright (c)
2026 Neon Law Foundation`, purporting to license files the Foundation does not own. Commercial
webfont licences are typically domain- or pageview-limited and forbid redistribution outright; a
public repository plus a public package is redistribution twice over.

The swap was made rather than the licence read, because publication was not going to wait on it, and
the binaries were removed from the commit rather than deleted in a later one — git keeps binaries
forever, so deleting them going forward would have left them public anyway.

**GORP is still the recommended face, and recommending is all we do.** It is named *first* in
`--nav-font-family`, ahead of Source Serif: a consumer who buys a licence from TrashType declares its
`@font-face` and it wins, with no component touched and no fork. That fallback chain is the whole
mechanism, and the README documents it. Do not ship the files to make it more convenient, and do not
serve them from a CDN either — the transport is not what makes it redistribution, and a remote font
fails `check:bundle` for a separate and equally good reason.

Two consequences worth knowing, and both were measured rather than assumed.

`check:type`'s two-weight ceiling is a *design* decision and never was a limitation. GORP ships at
least six weights, 200 through 700 — the desktop family is sitting in `~/Library/Fonts` on the
machines here — and only two were ever vendored. Source Serif has eight and two are vendored. Adding
a third is a design argument, not a bug fix.

**Figures are the one thing the swap changed under the hood, and it changed them for the better.**
The two faces default *opposite* ways: GORP's figures are proportional, Source Serif 4's are tabular.
`theme.css` therefore declares `proportional-nums` on `html` and `matter.css` takes it back with
`tabular-nums` in columns, so the rule holds whichever face is active instead of riding on a default.
Without that, the swap would have put tabular figures into every sentence in the library and nothing
would have failed.

The sharper finding: **GORP carries no `tnum` at all**, in any of its six weights. The
`font-variant-numeric` block at the top of `matter.css` was therefore inert for its entire life — the
docket never aligned, and the comment above it claimed the opposite for a year. `tabular-nums` fails
silently in a face without the feature, which is exactly how it went unnoticed. Source Serif 4 is the
first face here it has actually worked under. Two things follow: check `tnum` with `fontTools` before
vendoring any face, and expect the ragged column back for a consumer who licenses GORP, because that
is the typeface's property and not something to paper over here.

**Verifying type on a Neon Law machine needs care, because GORP is installed locally.** It is named
first in `--nav-font-family`, so the gallery on a firm laptop renders GORP and a public consumer sees
Source Serif 4 — the same page, two different typefaces, and the local one is the one nobody else
gets. Drop GORP from the stack before you judge how a release looks:

```js
document.documentElement.style.setProperty('--nav-font-family', '"Source Serif 4", Georgia, serif')
```

`LICENSE.md` carries a **Third-party material** section scoping the grant to what the Foundation owns
and pointing at `THIRD-PARTY-NOTICES.md` for everything else. Keep the two in step: a notice added to
one and not the other is how a licence file starts describing a package that no longer exists. The
section names the categories — the OFL typeface, the two MIT sources — rather than enumerating files,
so adding a third MIT dependency means editing the notices file and nothing else.

**Specimen data is invented, and that now includes the tests.** The gallery already had this rule.
The test suite did not, and carried a real client name, a real matter path, and a real case caption
naming a real adverse party. They are `Northwind`, `/northwind/review-0724/`, `Vance v. Northwind`,
and `attorney@example.com` now — all fictional, `example.com` being IANA-reserved for exactly this.
A fixture is read by everyone who clones the repository; it is not a scratch pad.

**The provenance is neonlaw.com, and that is settled.** `theme.css`, `matter.css`, and
`icon-glyphs.tsx` used to cite a client's domain as the source of the ported stylesheet and the icon
markup. Those comments were held back through the IP pass rather than genericised, because a
provenance note is the trail that answers who owns the code and rewriting one to remove a name is not
a confidentiality fix. The question went to the Foundation and was answered: the source is Neon Law's
own, the comments now say `neonlaw.com`, and the legacy per-matter paths are described by what they
were rather than by matter name.

Two things follow. Cite `neonlaw.com` and nothing else if you add a provenance note. And if a future
comment needs to name a specific matter or client to make sense, that is a sign the comment belongs
in the application repository, not here.

**American spelling, including in comments.** `color`, not `colour`. The one deliberate exception is
`LICENSE.md`, which is an operative legal instrument rather than prose about the code and keeps the
firm's spelling and phrasing.

It is edited only at the Foundation's direction, and it has been edited once: the **Third-party
material** section was added before the first public release. Treat that as the pattern rather than as
permission — tightening a sentence in it because it reads oddly is not a refactor anyone here gets to
make on their own.

**The gallery imports `src`, not `dist`.** `gallery/` is the specimen page, served by
`pnpm gallery` on :5174. Importing source is what stops it drifting from the library — a specimen page
built against `dist` is a page that silently shows you last build's components. It has its own
`vite.gallery.config.ts` because `vite.config.ts` is a library build (`build.lib`, externalized React,
`vite-plugin-dts`); one config doing both would emit the gallery into `dist` and publish it. Its
brand-layer switch is **not** a theme toggle — it attaches and detaches
`gallery/brand-example-tokens.css`, which is the only way to see the middle layer swap.

**Four gates run in CI, and all of them are cheap to break.** `pnpm check:tokens` fails on any
literal color outside the token layer — including a *named* color, which is why `FeedAccent` is
`'brand' | 'link' | 'danger' | …` and not `'blue' | 'red' | …`. `pnpm check:type` fails on a font
weight that is not 400 or 700, and on a corner radius that is neither a `--nav-radius-*` token nor
geometry (`999px`, `50%`, `0`). `pnpm check:contrast` recomputes every pairing in `tokens.css` and
fails any that drops under its WCAG floor. `pnpm check:bundle` fails on any off-origin reference in
`dist`; it runs after the build because that is where a remote URL would appear.

The first three are source-level and dependency-free, so they run in the `lint` job and report in
seconds rather than behind a full build.

**The type contract had to be enforced because documenting it did not work.** `fonts.css` has said
"two weights, 400 and 700" since the font was vendored, and `theme.css` still asked for 600 in
twenty-three rules while `matter.css` asked for 800 in eighteen — every one of them a synthesized
face. It was undetectable by eye for as long as `matter.css` was monospace, because a system mono
has every weight, and it became obvious the moment those rules took the brand typeface. A rule that
wants "a bit bolder than body" does not have that option and changes size or color instead.

**Figures in columns take `tabular-nums`, not a monospace.** The serif's default figures are
proportional, so a column of currency stops aligning the moment a table is not monospace. The
`font-variant-numeric` block at the top of `matter.css` is scoped to where digits are read against
each other — the docket, table bodies, record and feed dates, the status strip, and the transcribed
record. Prose keeps proportional figures, which is correct in a sentence. `--nav-font-mono` has
exactly one consumer, `.nav-code`, where a reader goes character by character.

## Coverage

**90% is a gate, not a target.** Statements, lines, functions, and branches all
have to clear it or the run fails. Thresholds live in `vite.config.ts`;
`pnpm test:coverage` writes an HTML report to `coverage/index.html` and CI
keeps it as an artifact for 14 days.

One file is excluded, because counting it would be noise rather than signal:
`src/index.ts` is re-exports only. Do not add exclusions to
make a number go up — write the test, or say plainly that the code is untested.

## Linting

oxlint, configured once at the root. Errors fail CI; warnings do not.

`react/react-in-jsx-scope` is off because the whole repo uses the modern JSX
transform, and `import/no-unassigned-import` is off because side-effect imports
are load-bearing here — the library imports its own stylesheet and the test
setup installs environment shims.

Three warnings are expected and intentional: `only-export-components` on the two
providers (a provider and its hook belong in one file) and `no-array-index-key`
in `StatusStrip`, which lives in `src/components/Cards.tsx` (status cells have
no stable id). If you add a fourth, either
fix it or record it here with the reason — the count is the point.

`no-console` is off under `scripts/**`: a build script reports what it
emitted through stdout, which is its interface rather than a stray debug line.

## Testing notes

**Node 26 ships its own `localStorage` global** that shadows jsdom's and is inert without
`--localstorage-file`. The test setup shims it. If a storage-backed test fails with "Cannot read
properties of undefined", that is the cause.

**That shim means local and CI do not run the same storage implementation.** CI is on Node 22, where
jsdom's real `Storage` is present and the shim stays inert; a modern local Node gets the shim. A
method spy on `window.localStorage` takes on the shim and not on jsdom's `Storage`, so a test doing
that passes locally and fails in CI. Replace the whole `window.localStorage` property instead — it
behaves identically in both.

**`userEvent.setup()` installs its own clipboard stub.** Override `navigator.clipboard` *after*
calling it, and with `defineProperty` — the property is getter-only in jsdom.

**Use `vitest/config`, not `vite`**, for `defineConfig` in any config carrying a `test` block. Vite's
own type does not know the field, so it goes silently untyped.

## Publishing

The package is public on npmjs.com under the `@neon-law-foundation` scope. Consumers need no token,
no registry configuration, and no `.npmrc` — `pnpm add @neon-law-foundation/navigator-ux` is the
whole of it.

CI publishes on a `v*` tag and on nothing else, so a merge to `main` ships nothing on its own. Bump
`package.json`, merge, then tag.

Two things the publish job needs, both already wired in `.github/workflows/ci.yml`:

- **`NPM_TOKEN`**, a repository secret with publish rights on the scope. This is the only credential
  in the repository.
- **`id-token: write`**, so npm can attach build provenance linking the tarball to the commit that
  produced it. It signs with a short-lived OIDC token minted for the run; it is not an auth path.

Provenance also requires the **repository to be public** — npm refuses to generate an attestation
that points at a commit nobody can fetch. If this repository is ever made private again, the publish
fails on the `--provenance` flag rather than on anything to do with the token.

`--access public` is passed explicitly rather than left to `publishConfig`. The first publish of a
*scoped* package defaults to restricted, and a restricted package on the public registry fails every
consumer's install with a `404` that reads like a typo rather than a permissions problem.

This package publishes from one place: <https://github.com/neon-law-foundation/navigator-ux>, to
`registry.npmjs.org`, on a `v*` tag. There is no second registry and no scope mapping — a consumer
needs no `.npmrc` and no token, and neither does CI.

## Before you commit

Run `pnpm check`. It is exactly what CI runs.

This repository is public. Nothing in a commit, a comment, or a test fixture may be a client's name,
a matter's facts, or anything else that is not ours to publish — the specimen data in the gallery is
invented for that reason. See the note above about the quoted record.
