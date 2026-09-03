---
name: once
description: De-duplication pass after creating or changing components, styles, docs, or gallery copy — every fact stated once, in the one place it belongs.
---

# Once

Run this after you have built something and before you open the PR. It removes what agentic tooling
adds: the same explanation in the component comment, the CSS comment, the README, `CLAUDE.md`, and
the gallery note.

## Where each kind of fact lives

| Fact | Its one home | Everywhere else |
| --- | --- | --- |
| Why a component is shaped the way it is | The doc comment in `src/components/*.tsx` | A pointer to the file, or nothing |
| What the CSS does that the markup cannot show | The rule's comment in `theme.css` | Nothing |
| That a component exists, and what it is for | One row, and at most one sentence, in the README | Nothing |
| How it looks | The gallery, with a one-sentence note | Nothing |
| A decision the code cannot show, or a trap | `CLAUDE.md` | A pointer to it |
| A license or notice fact | `LICENSE`, `NOTICE`, or `THIRD-PARTY-NOTICES.md` | A link |

## The pass

1. `git diff main --stat`, then list every prose block the branch added: doc comments, CSS comments,
   README paragraphs, `CLAUDE.md` paragraphs, gallery notes, test comments.
2. For each fact in those blocks, name its home from the table. Delete every other copy; leave at
   most a pointer.
3. Read each surviving block once more and cut it to what a stranger needs in order to act. A
   sentence that explains what the next line of code already shows goes.
4. Props: one JSDoc line each, and none for a prop whose name and type already say it.
5. Gallery notes: one sentence about what is on the page, never about how it is built.
6. `pnpm check`, then show the diff of what you removed.

The test is not word count. It is that no fact appears twice in the tree.
