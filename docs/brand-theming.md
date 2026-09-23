# Mapping a resolved brand onto the token layer (ENG-596)

This is the missing half of [the three token layers](../README.md#the-three-token-layers): given a
Navigator `brand` row (`store::brands::Brand`), what does a layer-2 override file — or a `NavigatorNavbar`
/ `NavigatorFooter` prop — actually set? Cross-checked against
[`gallery/brand-example-tokens.css`](../gallery/brand-example-tokens.css), the library's own worked
template.

## Is per-request brand resolution a real need?

**No.** `/app` resolves a brand per request because one running Navigator process serves every house
brand's host at once (`views::brand::BrandKey`, resolved from `Host:`). A Project portal never does
that: it is one repository, built once and deployed once, serving exactly one Project at
`/app/projects/<code>/portal` — see the `portal-chrome` skill and `ONE_REPOSITORY_PER_PROJECT_CODE`.
Its `navigator.yaml` already names a single `host` for that one deployment (the origin the repository's
own allowlist gate checks against), which is the same granularity a brand relationship is decided at:
one portal, one deploy, one brand. There is no case in the current fleet where a single running portal
instance must switch brands mid-process the way `/app` does.

That means the existing build-time mechanism — a layer-2 file, written once and imported after the
library's stylesheet — already covers every current consumer. **Nothing here proposes a runtime
brand-resolution capability.** If a future portal shape genuinely needs to serve more than one brand
from one deployment, that is a materially bigger change (closer to `/app`'s own `SessionProvider`
per-request resolution) and belongs in its own issue, not folded into this one.

## The mapping

| `brand` row field | Layer-2 target | Notes |
| --- | --- | --- |
| `primary_color` (hex) | `--nav-color-primary` | The value itself. |
| — derived | `--nav-color-primary-hover` | A darker step of `primary_color`, the same way `gallery/brand-example-tokens.css` derives its `600` from its `500`. Navigator's own `brand_presentation` derivation, once it ships, is the source of truth for the exact step — this file does not invent a second algorithm. |
| — derived | `--nav-color-primary-active` | A darker step again, mirroring the ramp shape above. |
| — derived | `--nav-color-on-primary`, `--nav-color-on-brand` | Whichever of the two on-primary inks clears 4.5:1 against `primary_color` — the same deterministic choice `store::brands::validate_primary_hex` makes and [`evaluateBrandPrimaryColor`](../src/components/BrandEditor.tsx) recomputes for the editor panel. Never "the higher of the two ratios rounded" — the chosen ink is exact, not approximate. |
| `primary_color` | `--nav-color-link`, `--nav-color-link-hover` | The library's own template reuses the primary ramp for links rather than introducing a second hue; a layer-2 file should do the same unless a brand has an actual reason not to. |
| `primary_color` | `--nav-color-surface-subtle` | A light tint of `primary_color` (the template's `-subtle` step), used for the active-nav-item background in `NavigatorNavbar`. |
| `accent_color` | **No target today.** | The token contract defines one brand hue (`primary`, aliased into `link` and `surface-subtle`), not a second independent one. `accent_color` is not representable in a layer-2 file as things stand — that is a gap for a future issue to close (either by adding a `--nav-color-accent` token to the layer-1 contract, or by deciding `accent_color` has no visual role outside `/app`), not something this table papers over. |
| `typeface` / `font_family` | `--nav-font-family` | A named value (e.g. `'GORP Serif', 'Source Serif 4', Georgia, serif` is the library's own layer-1 default) — set the custom-property, and also add the matching `@font-face` block. |
| `font_object_key` | An `@font-face src: url(...)` in the same layer-2 file | This is CSS the library cannot ship for you: `font_object_key` names an object in the host's own asset store, not a path this package can resolve. `src/styles/fonts.css` is the template for the `@font-face` shape — same `font-display`, same `unicode-range` discipline — pointed at the host's own hosted `.woff2` instead of the library's bundled one. |
| `font_licence` | Not a token at all. | It gates *whether Navigator will let a Firm upload the font in the first place* (`OFL-1.1` / `Apache-2.0` / `UFL-1.0`, [`FONT_LICENCES`](../src/components/BrandEditor.tsx)); once uploaded, the licence itself has no CSS representation. Carry it as a code comment above the `@font-face` block, the way this library documents its own bundled font's OFL terms. |
| `logo_object_key`, `logo_content_type` | **Not a token — a component prop.** | A logo is an asset reference, not a colour or a length; it has no `--nav-*` custom property. The consumer fetches the object from wherever the host serves it and passes the rendered `<img>`/`<svg>` into [`NavigatorNavbar`'s `logo` prop](../src/components/Chrome.tsx) and, for the family row, into each [`NavigatorFooter` `brands[].logo`](../src/components/Chrome.tsx) entry. `brand` (the wordmark text passed to `NavigatorNavbar`) is a separate, independent prop — a portal's title stays "Navigator" even as the mark beside it changes per matter. |
| `name` | `NavigatorFooter`'s `brands[].label`, and the family row's link text generally | Identity, not a token — same distinction as the logo row above. |
| `legal_entity` | `NavigatorFooter`'s `legal` prop | Already data-driven today; unaffected by this table. |
| `is_law_firm`, `firm_id`, `key` | No layer-2 or component target. | Authorization and identity bookkeeping on the Navigator side; nothing in this library reads them. |

## Worked example

Given a `brand` row with `primary_color: "#6d28d9"`, `typeface: "custom"`, `font_family: "Species Sans"`,
and an uploaded logo, a generated layer-2 file looks exactly like
[`gallery/brand-example-tokens.css`](../gallery/brand-example-tokens.css) — that file *is* this mapping,
worked through for one synthetic brand, including the dark-scheme redeclaration
[rule 3](../README.md#the-three-token-layers) requires. The logo is not part of that file at all: it
travels separately, as the value the consuming portal's own root component passes to `NavigatorNavbar`
and `NavigatorFooter`.

## What would generate this file

[`BrandEditorPanel`](../src/components/BrandEditor.tsx) (ENG-594) is the interactive half — a
hex-plus-contrast-gate control, a font upload, and a logo upload, composed as a gallery/dev-tool
specimen. It does not yet emit a layer-2 file from its state; doing so is the natural next step once a
host application wires real persistence behind its handlers, and this table is the target that
generator would write to.
