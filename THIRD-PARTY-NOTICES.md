# Third-party notices

Navigator UX is licensed AGPL-3.0-only (see [LICENSE](./LICENSE)). That grant covers the work the Neon
Law Foundation owns. It does not cover the third-party material listed here, which carries its own
terms and its own copyright holders.

There are two kinds of third-party material here, and the difference decides what has to travel.

**Material in this repository** — the sections immediately below. Two are MIT and one is the SIL Open
Font License. All three permit reuse, and all three **require the copyright and permission notice to
travel with the work**. That is what this file is for — a code comment naming the source is courtesy,
not compliance. The font notice travels twice: the build also copies `OFL.txt` into `dist` beside the
woff2 files, because consumers receive `dist` and never see this file.

**Runtime dependencies** — listed under [Runtime dependencies](#runtime-dependencies). None of their
code is in this repository or in `dist`, so none of their notices travel with what we publish. They
are recorded anyway, because the question a reader has is what the package pulls in, and answering
"look at the lockfile" is not an answer.

The two MIT sources present no tension with the AGPL: MIT is permissive, so MIT-derived work can be
distributed as part of an AGPL whole, and the notices below are what that costs. **The typeface is
different.** The OFL requires the font software to be distributed entirely under the OFL and forbids
releasing it under any other license, so the woff2 files under
`src/assets/fonts/source-serif-4/` are **not** AGPL and the project's grant does not reach them. That
is a scoping fact rather than a conflict — the OFL governs the font, the AGPL governs the code, and
neither has anything to say about the other. Do not "simplify" this by declaring the whole tree AGPL.

---

## Bootstrap Icons

Path data for the icons in `src/components/icon-glyphs.tsx` is taken from Bootstrap Icons, with the
sole exception of `libra-scales`, which is original to this library.

- Upstream: <https://github.com/twbs/icons>
- License: MIT

```
Copyright (c) 2019-2024 The Bootstrap Authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## shadcn/ui

The components in the shadcn-derived set — `Accordion`, `Collapsible`, `LinkTabs`, `Tabs`,
`Separator`, `Avatar`, `Skeleton`, `Progress`, `AspectRatio`, `Switch`, `ToggleGroup`, `Combobox`,
`Dialog`, `Sheet`, `Popover`, `DropdownMenu`, `Tooltip`, `Toaster` — take shadcn/ui's component
semantics, ARIA roles, keyboard contracts, and prop shapes. The implementations are written against
platform primitives rather than copied, and no shadcn/ui source is vendored here, but the design owes
it enough to say so.

- Upstream: <https://github.com/shadcn-ui/ui>
- License: MIT

```
Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Source Serif 4

The typeface the library vendors and ships, at 400 and 700, under
`src/assets/fonts/source-serif-4/`. Designed by Frank Grießhammer at Adobe. These are the Google
Fonts latin-subset builds, taken from [`@fontsource/source-serif-4`](https://fontsource.org/fonts/source-serif-4).

The OFL permits bundling and redistribution outright, which is the reason a font can ship in this
package at all: `dist` carries the woff2 files, every consumer redistributes them again, and none of
them needs a licence of their own.

- Upstream: <https://github.com/adobe-fonts/source-serif>
- License: SIL Open Font License 1.1
- Reserved Font Name: **Source** — a modified version of this font may not be distributed under that
  name. The files here are redistributed unmodified.

```
Copyright 2014 The Source Serif 4 Project Authors (https://github.com/adobe-fonts/source-serif)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
https://openfontlicense.org


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded, 
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

---

## Runtime dependencies

Five packages are `dependencies`, and their code is **not** distributed by this project. Every one is
externalized in the library build, so `dist/index.js` carries a bare `from "d3-scale"` and an
`import("pdfjs-dist")` rather than a copy of either. A consumer's installer resolves them and places
each package, with its own `LICENSE` file, in their own tree — which is also the point of
externalizing: an application that already uses d3 gets one copy rather than two.

Nothing below therefore needs a notice inside `dist`. The obligations run with the packages
themselves, to whoever installs them.

| Package | License | Used by |
| --- | --- | --- |
| `d3-array`, `d3-scale`, `d3-shape` | ISC | `BarChart`, `LineChart`, `AreaChart` |
| `d3-force` | ISC | `GraphView` |
| `pdfjs-dist` | Apache-2.0 | `PdfViewer` |

The d3 modules pull in further d3 packages transitively — `internmap`, `d3-dispatch`, `d3-quadtree`,
`d3-timer`, `d3-format`, `d3-interpolate`, `d3-time`, `d3-time-format`, `d3-path` — and every one of
them is ISC as well. Mike Bostock's d3 family is uniformly ISC, which is why this table stays short
and why adding a fourth d3 module is not a licensing decision.

**Both licenses are compatible with the AGPL, and one of them only just.** ISC is permissive and
raises no question. Apache-2.0 is compatible with **GPLv3 and AGPLv3 in one direction only**:
Apache-2.0 code may be included in an AGPLv3 work, and the FSF says so explicitly. It is *not*
compatible with GPLv2, because of the patent-termination and indemnification clauses that GPLv2 has
no room for.

That asymmetry is the thing worth remembering. This project is AGPL-3.0-only, so `pdfjs-dist` is
fine today. If the license is ever moved to anything in the GPLv2 family, `PdfViewer` is the file
that breaks first, and it will break as a legal problem rather than a build failure — nothing in CI
will notice.

## Not covered here

**GORP Serif is not in this repository, and that is deliberate.** It is the recommended typeface for
this library and the one Neon Law uses, but it is a commercial licence from TrashType, LLC and is not
the Foundation's to redistribute. A public npm package puts its binaries in front of everyone who
installs the library, which no commercial webfont licence contemplates — so it is named first in
`--nav-font-family` and shipped by nobody. A consumer who licenses it declares its `@font-face` and it
wins with no component touched. See the typography section of the [README](./README.md).

Nothing in `dist` reaches off-origin for a font or for anything else; `pnpm check:bundle` fails the
build on any reference that does.
