# The shared marketing catalog

The public pages in `gallery/` — home, plans & services, the two subscription pages, and disputes —
publish some of the same sentences Neon Law's own site publishes. That site is rendered by
[Navigator](https://github.com/neon-law-source-code/navigator) in Dioxus, not by this repository, so
until now the same wording was written down in both places and drifted in both places.

Navigator is now the single authoring source for those sentences. This repository consumes them.

## What is shared and what is not

Only the wording **both** renderers publish lives in the catalog: page eyebrows, titles and ledes,
the home page's mission sentences, the two plan prices, the plan inclusions, and the disputes copy.

Everything else stays here, because it is this repository's own: the routes, the React components
and their markup, the service catalogue and its keywords, the category filters, the checkout
specimen, the FAQ, the office and phone details, and every sentence whose wording differs from
Navigator's today. **The catalog removes duplication; it does not decide wording.** Copy that reads
differently in the two renderers is a question for the page-copy review, not for this mechanism.

The two renderers are also not required to produce the same markup. Dioxus and React each lay the
page out their own way; only the words are shared.

## How a page reads it

`gallery/content/marketing-catalog.json` is a generated artifact, committed here. The content files
reference a key instead of repeating the words:

```yaml
# gallery/content/en.yaml
find:
  prompt: "{shared:home.need_prompt}"
```

```markdown
<!-- gallery/content/pages/litigation.md -->
---
title: "{shared:litigation.title}"
---
```

`gallery/content/catalog.ts` resolves `{shared:<key>}` over the raw YAML and Markdown before either
is parsed — the same way Navigator resolves the same token in its own catalogs. A reference
therefore works in any field without `load.ts`'s types knowing the token exists, and every consumer
below (`neon-site.tsx`, `find-need.tsx`, the Cypress tasks) keeps reading plain strings.

A key nobody authored throws rather than rendering an empty element, and a brand with no override
reads the shared default — never a different brand's override.

## The pin

There is **no runtime fetch and no dependency on Navigator's `main`.** The artifact records the
exact 40-character commit it was produced from:

```json
"source": {
  "path": "neon/locales/en/shared.yaml",
  "repository": "neon-law-source-code/navigator",
  "revision": "0123456789abcdef0123456789abcdef01234567"
}
```

Updating the shared copy is therefore a two-step, reviewable change: the words change in Navigator
and merge there, then this repository re-exports at that merged revision and commits the result.

```bash
# from a Navigator checkout, at the revision you intend to pin
cargo run -p cli --example export-marketing-catalog -- \
    --revision "$(git rev-parse HEAD)" \
    --out /path/to/navigator-ux/gallery/content/marketing-catalog.json
```

The exporter refuses a branch name: a branch is not a pin.

## The integrity check

`pnpm check:catalog` recomputes the SHA-256 the exporter recorded, over the **canonical payload** —
compact JSON with every object key sorted. Rust and TypeScript both reproduce those bytes exactly,
so the check proves the committed artifact is the one Navigator exported. An edited artifact, a
truncated one, or one carrying a digest copied from a different export all fail it. The same gate
refuses an unsupported `catalog_version`, a revision that is not an immutable commit, and a
`{shared:…}` reference naming a key the pinned catalog does not define.

Integrity is verified at build time rather than in the browser on purpose: the artifact is
immutable and committed, so hashing it once per build is the useful moment. What the browser still
checks, at module load, is the version and the shape of the pin — a catalog this build cannot read
must fail loudly rather than render a page with a hole in it.

## Coverage

| Where | What it proves |
| --- | --- |
| `scripts/check-catalog.mjs` | The committed artifact matches its digest; every reference resolves |
| `src/test/marketing-catalog.test.ts` | Version and pin refusals, fallback, and that the sentences are no longer written down here |
| `src/test/neon-site-catalog.test.tsx` | The rendered React pages carry the pinned wording |
| `cypress/e2e/neon-site.cy.ts` | The same, in a real browser, across every public page |

Navigator's side of the contract is documented in its own `docs/marketing-copy.md`.
