# Consuming `@neon-law-foundation/navigator-ux`

What an application has to agree with to use this library. If you only want to render a component,
the [README](../README.md) is enough — this is the integration detail behind it.

## The dependency is always a released range

```json
"dependencies": {
  "@neon-law-foundation/navigator-ux": "^0.1.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0"
}
```

A caret range on a released version. Never `workspace:*`, and never `link:` in a commit.

`0.1.0` is the first public release, and the first release of any kind from this repository. The
library had a longer private life under other names and other registries; none of it is reachable
here and none of it shares this version line, so no range should point below `0.1.0`.

The package is public on npmjs.com. **No token, no `.npmrc`, no registry configuration** — for CI or
for a laptop.

## One stylesheet, imported explicitly

The library emits its CSS as a separate file; Vite library mode does not inject it. Import it before
your own stylesheet so local rules win on equal specificity:

```ts
import '@neon-law-foundation/navigator-ux/styles.css'
import './styles/app.css'
```

That export maps to `dist/navigator-ux.css`. The filename is pinned in the library's `vite.config.ts`
rather than derived, because Vite names a library stylesheet after the package and a rename would
otherwise leave the `exports` map pointing at a file that no longer exists — a silent 404 in your
app rather than a build failure in ours. The library asserts the two agree at build time.

## Branding it

The library ships the Neon Law teal. To wear your own color, write one stylesheet and import it
**after** the library's:

```ts
import '@neon-law-foundation/navigator-ux/styles.css'
import './styles/brand.css'
```

`brand.css` redeclares the semantic aliases at `:root:root` — see *The three token layers* in the
README, and `gallery/brand-example-tokens.css` for a complete commented template.
The doubled selector matters: a brand layer wins on specificity, not source order, so it survives
anything injected after it.

Redeclare inside `@media (prefers-color-scheme: dark)` too. A ramp that reads on white will not read
on a near-black ground, and skipping the dark block is how a brand ends up invisible in exactly one
scheme.

## `pnpm check` order is load-bearing in a consumer

```
lint → build → typecheck → test:coverage
```

An app resolves the library through its `dist`, which does not exist on a clean checkout, so
typechecking ahead of the build fails with "cannot find module". This repository keeps the same order
even though nothing here consumes the built `dist`, so `pnpm check` means one thing everywhere.

## Working on a component and its consumer at once

The committed dependency is always the released range. To iterate against a real app, point it at a
sibling checkout for as long as it takes:

```bash
pnpm --dir ../navigator-ux build
pnpm add "@neon-law-foundation/navigator-ux@link:../navigator-ux"
# ... work, with `pnpm --dir ../navigator-ux dev` running ...
git checkout package.json pnpm-lock.yaml && pnpm install
```

**`resolve.dedupe: ['react', 'react-dom']` in your Vite config is what makes this work at all.** A
linked copy resolves React out of the library checkout's `node_modules`, so without the dedupe the
components render against a second React instance and every hook reads `null` — `Cannot read
properties of null (reading 'useState')`. It is inert under a normal install, where React is a peer
dependency satisfied by your app, which is exactly why it is easy to leave out and only fails once
somebody reaches for the override.

Reject a commit that leaves a `link:` in `package.json`. It resolves off a sibling checkout that
exists on one laptop and nowhere else, and a lockfile written against it installs cleanly in CI, so
nothing else will catch it.

## Why the app does not live here

An earlier arrangement had this repository be a pnpm workspace with the consuming apps inside it,
each taking the library as `workspace:*`, which made
a component change testable against a real page before it shipped rather than round-tripping through a
publish. That ergonomic argument was real and it still is.

What outweighs it is coupling. One workspace has one CI identity and one release cadence, and it ties
every consumer to every other one — an app that ends should be able to stop building without touching
a repository other apps share. Splitting them means a component change reaches an app only when that
app asks for it, which is the property worth paying for.

The fast loop survives as the local `link:` override above: a deliberate, temporary act rather than
the permanent state of the dependency graph.

## What never enters a consumer

Binary files — PDFs, exhibits, workbooks. They belong behind an authorization check, not in git,
which keeps them forever.

Content belongs in your `src/data`, attributed and verbatim, never in a component here. Assert on
exact wording in a test so a well-meaning edit fails loudly. A component with text baked into it
ships one customer's content to every other one.
