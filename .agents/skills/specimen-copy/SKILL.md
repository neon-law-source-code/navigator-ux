---
name: specimen-copy
description: >
  Keep gallery, test, and public-site copy anonymous: generate names through
  fixtures/fake.mjs, never hand-write an identity, and never name another
  vendor. Use after writing specimen copy, fixtures, Cypress, gallery notes, or
  comments that a public reader will see — and before opening the PR.
---

# Specimen copy

This repository is public. Copy that ships — gallery pages, YAML, Markdown,
Cypress, comments on gallery files, README rows, PR titles — is read by
everyone. A name you typed is a name that can belong to a real person. A vendor
you named is a comparison the firm did not ask to publish.

## Names and facts

Draw people, companies, addresses, and emails from [`fixtures/fake.mjs`](../../../fixtures/fake.mjs)
with a **key** (`fakePerson('neon-site/filer')`). Assert against the generator
(`FILER.name`), never against the string it happened to draw. Force mail onto
`example.com`. The why is in `CLAUDE.md`; do not restate it here.

Quotes, matter facts, and docket numbers are invented. They are not taken from a
live file, a news story, or another firm's site.

A role label is not an identity: "First-time founder" is fine. "Jordan Rivera"
is not.

## Other vendors

Do not name another company's product, catalog, or filing site in anything that
lands in the tree. Layouts we borrow stay in the conversation. The page describes
what the reader is looking at (a question, a search field, an item table), not
who else does it that way.

That includes "style" comments (`// X-style find strip`), gallery notes, YAML
blurbs, compare-table headers, and PR titles. "Typical mill" and "parts house"
are the same leak with the serial numbers filed off — say "automated form" or
"item table" if you need a contrast.

Our own provenance (`neonlaw.com`, Neon Law, Shook Law PLLC) is not a vendor
comparison. Keep it.

## The pass

1. `git diff main` and list every new string a stranger will read.
2. For each person or company, confirm it comes from `fake.mjs` and a key.
3. For each proper noun that is not ours, delete it.
4. Cypress and Vitest type generated values, not literals.
5. `pnpm check`, then `pnpm test:e2e` if you touched the public-site specimen.
