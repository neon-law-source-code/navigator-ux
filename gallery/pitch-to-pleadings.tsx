import { useState } from 'react'
// Vite's explicit `?url` import, not `PdfViewer`'s own `import.meta.url` default: that
// default resolves the worker relative to `PdfViewer.tsx`'s own module, which is correct
// under Rollup's build analysis but not under Vite's dev server for a bare package
// specifier. `?url` asks Vite to resolve and emit the file itself, correctly in both.
// oxlint's import plugin does not know Vite's `?url` suffix turns this into a
// virtual module with a string default export, and reports one that does not exist.
// oxlint-disable-next-line import/default
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

import {
  Badge,
  ChoiceGroup,
  ClaimTable,
  Callout,
  DraftCard,
  Hero,
  NavigatorFooter,
  NavigatorNavbar,
  NavigatorShell,
  PageHeader,
  Panel,
  PdfViewer,
  Record as DocketRecord,
  Stage,
  Stepper,
  type ClaimTableColumn,
  type Step,
} from '../src/index'

/*
 * The pitch-to-pleadings journey — ENG-456.
 *
 * The authenticated portal pages, everything inside `NavigatorShell` and
 * `NavigatorNavbar`, read as one dense reference surface regardless of what
 * point in the matter a reader is looking at. This is the counter-example: the
 * same matter, `Vance v. Northwind` (the fictional breach already used by
 * `gallery/outline-specimen.tsx`), carried through a `Stepper` from the first
 * inquiry to a filed complaint. The first two steps are the focus set — a
 * `Stage` no wider than the one question it asks — because a prospective
 * client answering them has seen the page once. The last step drops back into
 * the dense `NavigatorShell` chrome a lawyer reads forty times a day, with a
 * real, same-origin PDF in `PdfViewer` rather than a placeholder.
 */

interface ClaimRow {
  claim: string
  basis: string
  status: string
}

const CLAIM_COLUMNS: ClaimTableColumn<ClaimRow>[] = [
  { key: 'claim', header: 'Claim', cell: (row) => row.claim },
  { key: 'basis', header: 'Basis', cell: (row) => row.basis },
  { key: 'status', header: 'Status', cell: (row) => <Badge tone="ready">{row.status}</Badge> },
]

const CLAIM_ROWS: ClaimRow[] = [
  { claim: 'Breach of contract', basis: 'Supply Agreement § 8.2 (cure)', status: 'Filed' },
]

const COMPLAINT_PDF_SRC = `${import.meta.env.BASE_URL}specimens/vance-v-northwind-complaint.pdf`

function PitchStep() {
  return (
    <Stage width="md" fill={false}>
      <Hero
        eyebrow="New inquiry"
        title="Tell us what happened"
        lede="A supply agreement that did not get performed. Answer one question and we will match you with the right engagement."
        level={2}
      />
      <ChoiceGroup
        legend="What best describes your situation?"
        name="matter-kind"
        defaultValue="breach"
        choices={[
          {
            value: 'breach',
            label: 'A contract was not honored',
            description: 'A vendor or counterparty did not do what a written agreement promised.',
          },
          {
            value: 'dispute',
            label: 'A dispute I need resolved',
            description: 'Two sides disagree about what an agreement requires.',
          },
          {
            value: 'review',
            label: 'A contract I need reviewed',
            description: 'Nothing has gone wrong yet, and it should stay that way.',
          },
        ]}
      />
    </Stage>
  )
}

function EngagementStep() {
  return (
    <Stage width="md" fill={false}>
      <Hero
        eyebrow="Adaeze Vance · Northwind Holdings, Inc."
        title="This reads as a breach-of-contract matter"
        lede="Section 8.2 of the supply agreement promised a thirty-day cure window. The record does not show one running before the delivery date passed."
        level={2}
      />
      <ChoiceGroup
        legend="How would you like to engage counsel?"
        name="engagement-type"
        defaultValue="contingency"
        choices={[
          { value: 'hourly', label: 'Hourly', description: 'Billed as the matter proceeds.' },
          {
            value: 'contingency',
            label: 'Contingency',
            description: 'No fee unless the matter recovers.',
          },
          { value: 'flat', label: 'Flat fee', description: 'One price through the complaint.' },
        ]}
      />
      <Callout tone="info">
        Choosing an engagement does not send anything. A signed engagement letter, not this page, is
        what opens the matter.
      </Callout>
    </Stage>
  )
}

function PleadingsStep() {
  return (
    <div className="gallery__frame">
      <NavigatorShell
        header={
          <NavigatorNavbar
            brand="Navigator"
            destinations={[
              { label: 'Matters', href: '#matters', current: true },
              { label: 'People', href: '#people' },
              { label: 'Entities', href: '#entities' },
            ]}
            signOut={{ action: '#sign-out' }}
          />
        }
        footer={<NavigatorFooter legal="© 2026 Shook Law PLLC" release="v0.5.0" />}
      >
        <PageHeader
          title="Vance v. Northwind"
          summary="Case No. CV-26-041782"
          actions={<Badge tone="ready">Complaint filed</Badge>}
        />
        <div className="showcase__document-grid">
          <Panel title="Claims" note="What the complaint alleges, and where it stands.">
            <ClaimTable
              caption="Claims in the filed complaint"
              columns={CLAIM_COLUMNS}
              rows={CLAIM_ROWS}
              rowKey={(row) => row.claim}
            />
            <DocketRecord when="3 Mar 2026" title="Inquiry received">
              Adaeze Vance described a missed delivery under the March 2023 supply agreement.
            </DocketRecord>
            <DocketRecord when="6 Mar 2026" title="Engagement signed">
              Contingency engagement letter executed; the matter opened.
            </DocketRecord>
            <DocketRecord when="21 Mar 2026" title="Complaint filed">
              Breach of contract, Case No. CV-26-041782, Clark County District Court.
            </DocketRecord>
          </Panel>
          <Panel
            title="Complaint"
            note="A same-origin PDF generated from source at dev and build time — see scripts/generate-specimen-pdf.mjs. No binary is committed."
          >
            <PdfViewer
              src={COMPLAINT_PDF_SRC}
              label="Complaint, Vance v. Northwind"
              workerSrc={pdfWorkerSrc}
            />
          </Panel>
        </div>
        <DraftCard
          title="Internal note"
          note="Counsel · not client-facing"
          text="Complaint filed on the cure-clause theory. Next: serve Northwind and calendar the answer deadline."
          copyable={false}
        />
      </NavigatorShell>
    </div>
  )
}

const STEPS: Step[] = [
  { id: 'pitch', title: 'Pitch', children: <PitchStep /> },
  { id: 'engagement', title: 'Engagement', children: <EngagementStep /> },
  { id: 'pleadings', title: 'Pleadings filed', children: <PleadingsStep /> },
]

export function PitchToPleadingsJourney() {
  const [current, setCurrent] = useState(0)
  return (
    <Stepper
      steps={STEPS}
      label="Pitch to pleadings progress"
      current={current}
      onCurrentChange={setCurrent}
      onComplete={() => setCurrent(0)}
      labels={{ finish: 'Start over' }}
    />
  )
}
