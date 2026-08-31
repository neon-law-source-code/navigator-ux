import type { ReactNode } from 'react'

import {
  AreaChart,
  BarChart,
  ChartLegend,
  GraphView,
  LineChart,
  Panel,
  seriesColor,
  type ChartPoint,
  type GraphEdge,
  type GraphNode,
} from '../src/index'

type SceneName =
  | 'intake'
  | 'questions'
  | 'uploads'
  | 'shield'
  | 'lock'
  | 'journey'
  | 'expunge'

type ChartFigure = {
  kind: 'bar' | 'line' | 'area'
  title: string
  note: string
  data: ChartPoint[]
  series?: number
  format?: (value: number) => string
  legend: string
}

type GraphFigure = {
  kind: 'graph'
  title: string
  note: string
  nodes: GraphNode[]
  edges: GraphEdge[]
}

type SceneFigure = {
  kind: 'scene'
  title: string
  note: string
  scene: SceneName
}

type PageFigure = ChartFigure | GraphFigure | SceneFigure

const pct = (value: number) => `${value}%`
const count = (value: number) => String(value)
const days = (value: number) => `${value}d`
const dollars = (value: number) => `$${value}k`

function bars(
  title: string,
  note: string,
  legend: string,
  data: ChartPoint[],
  series = 0,
  format: (value: number) => string = count,
): ChartFigure {
  return { kind: 'bar', title, note, legend, data, series, format }
}

function trend(
  kind: 'line' | 'area',
  title: string,
  note: string,
  legend: string,
  data: ChartPoint[],
  series = 1,
  format: (value: number) => string = count,
): ChartFigure {
  return { kind, title, note, legend, data, series, format }
}

function web(title: string, note: string, nodes: GraphNode[], edges: GraphEdge[]): GraphFigure {
  return { kind: 'graph', title, note, nodes, edges }
}

function scene(title: string, note: string, name: SceneName): SceneFigure {
  return { kind: 'scene', title, note, scene: name }
}

const PAGE_FIGURES: Record<string, PageFigure> = {
  'new-matter': scene(
    'How a first request moves',
    'A person arrives with a question. The page holds the facts until a lawyer can act on them.',
    'intake',
  ),
  'conflict-check': web(
    'Who must be screened',
    'People, entities, and prior matters in one picture, so a relationship is not left in a note.',
    [
      { id: 'client', label: 'Northwind', kind: 'party', fields: { role: 'Prospective client' } },
      { id: 'adverse', label: 'Vance', kind: 'party', fields: { role: 'Adverse party' } },
      { id: 'affiliate', label: 'Harbor LLC', kind: 'entity', fields: { role: 'Affiliate' } },
      { id: 'prior', label: 'Matter 19-04', kind: 'matter', fields: { role: 'Closed file' } },
      { id: 'counsel', label: 'A. Reyes', kind: 'counsel', fields: { role: 'Screening lawyer' } },
    ],
    [
      { source: 'client', target: 'affiliate', kind: 'owns' },
      { source: 'client', target: 'adverse', kind: 'dispute' },
      { source: 'counsel', target: 'prior', kind: 'worked' },
      { source: 'prior', target: 'affiliate', kind: 'named' },
    ],
  ),
  'case-strategy': bars(
    'Exposure by theory',
    'A specimen of how the theories sit relative to one another — not a valuation.',
    'Exposure',
    [
      { label: 'Contract', value: 42 },
      { label: 'Fraud', value: 18 },
      { label: 'Fiduciary', value: 27 },
      { label: 'Fees', value: 11 },
    ],
    0,
    dollars,
  ),
  'preservation-notice': trend(
    'line',
    'Days the hold has been in force',
    'The line is a dated record of the request, not a conclusion that anything was preserved.',
    'Hold age',
    [
      { label: '12th', value: 1 },
      { label: '13th', value: 2 },
      { label: '14th', value: 3 },
      { label: '15th', value: 4 },
      { label: '18th', value: 7 },
      { label: '21st', value: 10 },
    ],
    2,
    days,
  ),
  'initial-disclosures': bars(
    'What is ready to disclose',
    'Known, missing, and lawyer-reviewed — three states a tracker can show without deciding.',
    'Items',
    [
      { label: 'People', value: 8 },
      { label: 'Documents', value: 14 },
      { label: 'Damages', value: 3 },
      { label: 'Insurance', value: 2 },
    ],
    3,
  ),
  interrogatories: scene(
    'Answer, object, or follow up',
    'Each interrogatory is a thread: the question, the draft answer, and the objection live together.',
    'questions',
  ),
  'motion-outline': web(
    'How the argument is built',
    'Outline units as a graph: a heading points at the record it quotes, not at a paraphrase.',
    [
      { id: 'issue', label: 'Cure notice', kind: 'issue', fields: { unit: 'I' } },
      { id: 'rule', label: '§ 2.4(b)', kind: 'authority', fields: { unit: 'I.A' } },
      { id: 'quote', label: 'thirty days', kind: 'record', fields: { cite: 'R. 42:12–14' } },
      { id: 'counter', label: 'No notice', kind: 'record', fields: { cite: 'Dep. 18:4–9' } },
      { id: 'relief', label: 'Dismissal', kind: 'relief', fields: { unit: 'II' } },
    ],
    [
      { source: 'issue', target: 'rule', kind: 'cites' },
      { source: 'issue', target: 'quote', kind: 'quotes' },
      { source: 'rule', target: 'relief', kind: 'supports' },
      { source: 'counter', target: 'issue', kind: 'limits' },
    ],
  ),
  'requests-production': scene(
    'What still has to be gathered',
    'A collection page is a pile with owners, not a filing. The lawyer still reviews before it leaves.',
    'uploads',
  ),
  'meet-confer': trend(
    'line',
    'Open issues after each conference',
    'The point of the log is the leftover issue, not the meeting that happened.',
    'Open issues',
    [
      { label: '1st', value: 9 },
      { label: '2nd', value: 7 },
      { label: '3rd', value: 6 },
      { label: '4th', value: 3 },
      { label: '5th', value: 2 },
    ],
    4,
  ),
  'subpoena-packet': web(
    'Authority, scope, service, return',
    'A packet is a chain. Skipping a link is how a return comes back empty.',
    [
      { id: 'auth', label: 'Rule 45', kind: 'authority', fields: { status: 'Confirmed' } },
      { id: 'scope', label: 'Dock 4 files', kind: 'scope', fields: { status: 'In review' } },
      { id: 'custodian', label: 'Northwind', kind: 'party', fields: { status: 'Named' } },
      { id: 'service', label: 'Service', kind: 'step', fields: { status: 'Waiting' } },
      { id: 'return', label: 'Return', kind: 'step', fields: { status: 'Not yet' } },
    ],
    [
      { source: 'auth', target: 'scope', kind: 'limits' },
      { source: 'scope', target: 'custodian', kind: 'names' },
      { source: 'custodian', target: 'service', kind: 'next' },
      { source: 'service', target: 'return', kind: 'next' },
    ],
  ),
  'deposition-prep': trend(
    'area',
    'Hours on the chronology',
    'Preparation is a curve of time spent on the story, not a score for the witness.',
    'Prep hours',
    [
      { label: 'W1', value: 2 },
      { label: 'W2', value: 4 },
      { label: 'W3', value: 9 },
      { label: 'W4', value: 11 },
      { label: 'W5', value: 7 },
    ],
    1,
  ),
  'exhibit-list': bars(
    'Exhibits by foundation status',
    'Numbered, sourced, and either ready or still missing a sponsoring witness.',
    'Exhibits',
    [
      { label: 'Ready', value: 18 },
      { label: 'Stipulated', value: 6 },
      { label: 'Objected', value: 4 },
      { label: 'Missing', value: 3 },
    ],
    5,
  ),
  'restraining-order': scene(
    'Urgent facts, then supporting detail',
    'Safety first: the page separates what cannot wait from what can be gathered after.',
    'shield',
  ),
  'serve-warrant': web(
    'Who may serve, and on what authority',
    'An operational page is still a record: source, actor, target, and return.',
    [
      { id: 'order', label: 'Order 24-11', kind: 'authority', fields: { court: 'District' } },
      { id: 'officer', label: 'Server', kind: 'actor', fields: { role: 'Authorized' } },
      { id: 'target', label: 'Premises', kind: 'place', fields: { kind: 'Named address' } },
      { id: 'inventory', label: 'Inventory', kind: 'record', fields: { status: 'Required' } },
      { id: 'return', label: 'Return', kind: 'record', fields: { status: 'Not filed' } },
    ],
    [
      { source: 'order', target: 'officer', kind: 'authorizes' },
      { source: 'officer', target: 'target', kind: 'serves' },
      { source: 'target', target: 'inventory', kind: 'lists' },
      { source: 'inventory', target: 'return', kind: 'attaches' },
    ],
  ),
  'service-return': trend(
    'line',
    'Attempts before a completed return',
    'Each attempt is a dated fact. The return is the last one that worked.',
    'Attempts',
    [
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
      { label: '4', value: 3 },
      { label: 'Done', value: 4 },
    ],
    0,
  ),
  'protective-order': scene(
    'What may be seen, and by whom',
    'Scope, access, and redaction are the three edges of the packet.',
    'lock',
  ),
  'contempt-hearing': bars(
    'Proof on the hearing docket',
    'What is in hand, what is promised, and what is still a gap.',
    'Items',
    [
      { label: 'Order', value: 1 },
      { label: 'Service', value: 1 },
      { label: 'Violations', value: 4 },
      { label: 'Gaps', value: 2 },
    ],
    2,
  ),
  'company-formation': web(
    'The entity being formed',
    'Founders, the company, and the first filings as one graph.',
    [
      { id: 'founder-a', label: 'J. Rivera', kind: 'person', fields: { role: 'Founder' } },
      { id: 'founder-b', label: 'M. Chen', kind: 'person', fields: { role: 'Founder' } },
      { id: 'co', label: 'Harbor LLC', kind: 'entity', fields: { state: 'WA' } },
      { id: 'ein', label: 'EIN packet', kind: 'filing', fields: { status: 'Draft' } },
      { id: 'oa', label: 'Operating agr.', kind: 'instrument', fields: { status: 'Questionnaire' } },
    ],
    [
      { source: 'founder-a', target: 'co', kind: 'forms' },
      { source: 'founder-b', target: 'co', kind: 'forms' },
      { source: 'co', target: 'ein', kind: 'needs' },
      { source: 'co', target: 'oa', kind: 'needs' },
    ],
  ),
  'operating-agreement': bars(
    'Decisions that become terms',
    'Voting, transfer, and dissolution — the questionnaire is a map of the paper.',
    'Weight',
    [
      { label: 'Vote', value: 51 },
      { label: 'Transfer', value: 75 },
      { label: 'Dilution', value: 60 },
      { label: 'Exit', value: 67 },
    ],
    4,
    pct,
  ),
  'equity-plan': trend(
    'area',
    'Vested ownership over four years',
    'A scenario, not a cap table. The numbers stay invented so they cannot be mistaken for advice.',
    'Vested %',
    [
      { label: 'Y0', value: 0 },
      { label: 'Y1', value: 25 },
      { label: 'Y2', value: 50 },
      { label: 'Y3', value: 75 },
      { label: 'Y4', value: 100 },
    ],
    3,
    pct,
  ),
  'commercial-lease': trend(
    'line',
    'Base rent across the term',
    'Rent, renewal, and repair are easier to argue when the curve is visible.',
    'Rent / sq ft',
    [
      { label: 'Y1', value: 28 },
      { label: 'Y2', value: 29 },
      { label: 'Y3', value: 31 },
      { label: 'Y4', value: 32 },
      { label: 'Y5', value: 34 },
    ],
    5,
    (value) => `$${value}`,
  ),
  'vendor-contract': bars(
    'Deal points still open',
    'The intake gathers the business deal before anyone marks the paper.',
    'Open points',
    [
      { label: 'Price', value: 1 },
      { label: 'Term', value: 0 },
      { label: 'IP', value: 3 },
      { label: 'Liability', value: 2 },
    ],
    2,
  ),
  'board-consent': web(
    'Who has to approve',
    'A small packet: the resolution, the people who must sign, and the minute book it will enter.',
    [
      { id: 'resolution', label: 'Resolution', kind: 'instrument', fields: { status: 'Draft' } },
      { id: 'chair', label: 'Chair', kind: 'person', fields: { vote: 'Required' } },
      { id: 'director', label: 'Director', kind: 'person', fields: { vote: 'Required' } },
      { id: 'minutes', label: 'Minute book', kind: 'record', fields: { status: 'Waiting' } },
    ],
    [
      { source: 'resolution', target: 'chair', kind: 'needs' },
      { source: 'resolution', target: 'director', kind: 'needs' },
      { source: 'chair', target: 'minutes', kind: 'records' },
      { source: 'director', target: 'minutes', kind: 'records' },
    ],
  ),
  'trademark-clearance': bars(
    'Live marks near the candidate',
    'Search notes as a count, with the recommendation still owned by counsel.',
    'Hits',
    [
      { label: 'Identical', value: 0 },
      { label: 'Close', value: 3 },
      { label: 'Related', value: 11 },
      { label: 'Unrelated', value: 40 },
    ],
    1,
  ),
  'beneficial-ownership': web(
    'Who owns twenty-five percent or more',
    'A filing intake is a graph of people and percentages, with a review boundary at the end.',
    [
      { id: 'co', label: 'Harbor LLC', kind: 'entity', fields: { filing: 'BOI' } },
      { id: 'a', label: 'J. Rivera', kind: 'person', fields: { stake: '40%' } },
      { id: 'b', label: 'M. Chen', kind: 'person', fields: { stake: '35%' } },
      { id: 'c', label: 'Trust 2024', kind: 'entity', fields: { stake: '25%' } },
      { id: 'review', label: 'Counsel', kind: 'counsel', fields: { role: 'Review' } },
    ],
    [
      { source: 'a', target: 'co', kind: 'owns' },
      { source: 'b', target: 'co', kind: 'owns' },
      { source: 'c', target: 'co', kind: 'owns' },
      { source: 'review', target: 'co', kind: 'reviews' },
    ],
  ),
  'asylum-i589': scene(
    'A packet assembled at a human pace',
    'Answers are collected here. A lawyer reviews them before anything resembles a filing.',
    'journey',
  ),
  'humanitarian-parole': bars(
    'Document readiness',
    'Urgency stays visible without turning the checklist into a countdown clock.',
    'Ready',
    [
      { label: 'Identity', value: 2 },
      { label: 'Medical', value: 1 },
      { label: 'Support', value: 4 },
      { label: 'Travel', value: 0 },
    ],
    3,
  ),
  'naturalization-screening': web(
    'Eligibility questions as a tree',
    'A screening is a set of gates, not an application. Follow-up is the product.',
    [
      { id: 'age', label: 'Age / status', kind: 'gate', fields: { result: 'Pass' } },
      { id: 'residence', label: 'Residence', kind: 'gate', fields: { result: 'Pass' } },
      { id: 'english', label: 'English', kind: 'gate', fields: { result: 'Follow up' } },
      { id: 'civics', label: 'Civics', kind: 'gate', fields: { result: 'Follow up' } },
      { id: 'counsel', label: 'Counsel', kind: 'counsel', fields: { next: 'Interview prep' } },
    ],
    [
      { source: 'age', target: 'residence', kind: 'then' },
      { source: 'residence', target: 'english', kind: 'then' },
      { source: 'english', target: 'civics', kind: 'then' },
      { source: 'civics', target: 'counsel', kind: 'hands off' },
    ],
  ),
  'work-authorization': trend(
    'line',
    'Days until the current card lapses',
    'A deadline-aware page still leaves the filing decision with counsel.',
    'Days left',
    [
      { label: 'Jun', value: 120 },
      { label: 'Jul', value: 90 },
      { label: 'Aug', value: 61 },
      { label: 'Sep', value: 30 },
      { label: 'Oct', value: 12 },
    ],
    0,
    days,
  ),
  'estate-plan': web(
    'People the plan has to name',
    'A thoughtful intake still has a graph: the person, the people they care for, and the instruments.',
    [
      { id: 'person', label: 'Client', kind: 'person', fields: { role: 'Testator' } },
      { id: 'spouse', label: 'Spouse', kind: 'person', fields: { role: 'Primary' } },
      { id: 'child', label: 'Child', kind: 'person', fields: { role: 'Remainder' } },
      { id: 'will', label: 'Will', kind: 'instrument', fields: { status: 'Intake' } },
      { id: 'poa', label: 'POA', kind: 'instrument', fields: { status: 'Intake' } },
    ],
    [
      { source: 'person', target: 'will', kind: 'signs' },
      { source: 'person', target: 'poa', kind: 'signs' },
      { source: 'will', target: 'spouse', kind: 'names' },
      { source: 'will', target: 'child', kind: 'names' },
    ],
  ),
  'record-expungement': scene(
    'A private next step',
    'The illustration is a record being set down, not a promise that any court will clear it.',
    'expunge',
  ),
}

function sparkPoints(data: ChartPoint[]): string {
  const width = 240
  const height = 72
  const max = Math.max(...data.map((point) => point.value), 1)
  return data
    .map((point, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * (width - 16) + 8
      const y = height - 10 - (point.value / max) * (height - 20)
      return `${x},${y}`
    })
    .join(' ')
}

function Spark({ data, series = 0, bars: asBars }: { data: ChartPoint[]; series?: number; bars?: boolean }) {
  const width = 240
  const height = 72
  const max = Math.max(...data.map((point) => point.value), 1)
  const color = seriesColor(series)
  if (asBars) {
    const band = (width - 20) / data.length
    return (
      <svg className="showcase-card-art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {data.map((point, index) => {
          const barHeight = (point.value / max) * (height - 18)
          if (barHeight <= 0) return null
          return (
            <rect
              key={point.label}
              x={10 + index * band + band * 0.18}
              y={height - 8 - barHeight}
              width={band * 0.64}
              height={barHeight}
              rx="0"
              fill={color}
              opacity={0.85}
            />
          )
        })}
      </svg>
    )
  }
  const points = sparkPoints(data)
  return (
    <svg className="showcase-card-art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} />
      {data.map((point, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * (width - 16) + 8
        const y = height - 10 - (point.value / max) * (height - 20)
        return <circle key={point.label} cx={x} cy={y} r="2.5" fill={color} />
      })}
    </svg>
  )
}

function GraphSketch({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const width = 240
  const height = 72
  const placed = nodes.map((node, index) => {
    const t = nodes.length === 1 ? 0.5 : index / (nodes.length - 1)
    return {
      ...node,
      x: 18 + t * (width - 36),
      y: height / 2 + Math.sin(index * 1.7) * 16,
    }
  })
  const byId = Object.fromEntries(placed.map((node) => [node.id, node]))
  const kinds = [...new Set(nodes.map((node) => node.kind))]
  return (
    <svg className="showcase-card-art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      {edges.map((edge) => {
        const from = byId[edge.source]
        const to = byId[edge.target]
        if (!from || !to) return null
        return (
          <line
            key={`${edge.source}-${edge.target}-${edge.kind}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            className="showcase-scene__edge"
          />
        )
      })}
      {placed.map((node) => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="7"
          fill={seriesColor(kinds.indexOf(node.kind))}
        />
      ))}
    </svg>
  )
}

function SceneArt({ name, compact, title }: { name: SceneName; compact?: boolean; title?: string }) {
  const width = compact ? 240 : 640
  const height = compact ? 72 : 180
  return (
    <svg
      className={compact ? 'showcase-card-art' : 'showcase-scene'}
      viewBox={`0 0 ${width} ${height}`}
      role={compact ? undefined : 'img'}
      aria-hidden={compact ? true : undefined}
      aria-label={compact ? undefined : title}
    >
      {name === 'intake' ? <IntakeScene width={width} height={height} /> : null}
      {name === 'questions' ? <QuestionsScene width={width} height={height} /> : null}
      {name === 'uploads' ? <UploadsScene width={width} height={height} /> : null}
      {name === 'shield' ? <ShieldScene width={width} height={height} /> : null}
      {name === 'lock' ? <LockScene width={width} height={height} /> : null}
      {name === 'journey' ? <JourneyScene width={width} height={height} /> : null}
      {name === 'expunge' ? <ExpungeScene width={width} height={height} /> : null}
    </svg>
  )
}

function IntakeScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <path
        className="showcase-scene__path"
        d={`M ${width * 0.08} ${height * 0.55} C ${width * 0.28} ${height * 0.1}, ${width * 0.55} ${height * 0.95}, ${width * 0.92} ${height * 0.4}`}
        fill="none"
      />
      <circle cx={width * 0.12} cy={height * 0.52} r={Math.min(10, height * 0.12)} fill={seriesColor(0)} />
      <circle cx={width * 0.5} cy={height * 0.58} r={Math.min(8, height * 0.1)} fill={seriesColor(1)} />
      <circle cx={width * 0.88} cy={height * 0.4} r={Math.min(12, height * 0.14)} fill={seriesColor(3)} />
    </g>
  )
}

function QuestionsScene({ width, height }: { width: number; height: number }) {
  const rows = 3
  return (
    <g>
      {Array.from({ length: rows }, (_, index) => {
        const y = height * (0.22 + index * 0.28)
        return (
          <g key={index}>
            <rect
              x={width * 0.08}
              y={y - height * 0.08}
              width={width * 0.12}
              height={height * 0.16}
              rx="0"
              fill={seriesColor(index)}
            />
            <rect
              className="showcase-scene__block"
              x={width * 0.26}
              y={y - height * 0.05}
              width={width * 0.62}
              height={height * 0.04}
              rx="0"
            />
            <rect
              className="showcase-scene__block"
              x={width * 0.26}
              y={y + height * 0.02}
              width={width * 0.44}
              height={height * 0.04}
              rx="0"
            />
          </g>
        )
      })}
    </g>
  )
}

function UploadsScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((index) => (
        <rect
          key={index}
          className="showcase-scene__paper"
          x={width * (0.12 + index * 0.2)}
          y={height * (0.22 + (index % 2) * 0.08)}
          width={width * 0.16}
          height={height * 0.52}
          rx="0"
        />
      ))}
    </g>
  )
}

function ShieldScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  const top = height * 0.12
  return (
    <g>
      <path
        fill={seriesColor(0)}
        opacity="0.9"
        d={`M ${cx} ${top} L ${width * 0.72} ${height * 0.28} L ${width * 0.66} ${height * 0.78} L ${cx} ${height * 0.92} L ${width * 0.34} ${height * 0.78} L ${width * 0.28} ${height * 0.28} Z`}
      />
      <path
        className="showcase-scene__path-on-accent"
        d={`M ${width * 0.42} ${height * 0.5} L ${width * 0.48} ${height * 0.62} L ${width * 0.6} ${height * 0.38}`}
        fill="none"
      />
    </g>
  )
}

function LockScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  return (
    <g>
      <rect
        x={cx - width * 0.12}
        y={height * 0.42}
        width={width * 0.24}
        height={height * 0.4}
        rx="0"
        fill={seriesColor(4)}
      />
      <path
        className="showcase-scene__path"
        d={`M ${cx - width * 0.08} ${height * 0.42} Q ${cx - width * 0.08} ${height * 0.12}, ${cx} ${height * 0.12} Q ${cx + width * 0.08} ${height * 0.12}, ${cx + width * 0.08} ${height * 0.42}`}
        fill="none"
      />
      <circle cx={cx} cy={height * 0.6} r={Math.min(6, height * 0.08)} fill={seriesColor(0)} />
    </g>
  )
}

function JourneyScene({ width, height }: { width: number; height: number }) {
  const steps = 5
  return (
    <g>
      <path
        className="showcase-scene__path"
        d={`M ${width * 0.08} ${height * 0.7} L ${width * 0.92} ${height * 0.7}`}
        fill="none"
      />
      {Array.from({ length: steps }, (_, index) => {
        const x = width * (0.12 + index * 0.19)
        const y = height * (index % 2 === 0 ? 0.38 : 0.28)
        return (
          <g key={index}>
            <line x1={x} y1={height * 0.7} x2={x} y2={y + 10} className="showcase-scene__edge" />
            <circle cx={x} cy={y} r={Math.min(11, height * 0.12)} fill={seriesColor(index)} />
          </g>
        )
      })}
    </g>
  )
}

function ExpungeScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <rect
        className="showcase-scene__paper"
        x={width * 0.22}
        y={height * 0.18}
        width={width * 0.36}
        height={height * 0.64}
        rx="0"
      />
      <path
        className="showcase-scene__path"
        d={`M ${width * 0.52} ${height * 0.28} C ${width * 0.7} ${height * 0.1}, ${width * 0.82} ${height * 0.7}, ${width * 0.9} ${height * 0.55}`}
        fill="none"
      />
      <rect x={width * 0.28} y={height * 0.32} width={width * 0.22} height={height * 0.06} rx="0" fill={seriesColor(0)} />
      <rect x={width * 0.28} y={height * 0.46} width={width * 0.16} height={height * 0.06} rx="0" fill={seriesColor(2)} />
    </g>
  )
}

/** Compact art for a catalog card. Decorative — the card already has its title. */
export function PageCardArt({ pageId }: { pageId: string }) {
  const figure = PAGE_FIGURES[pageId]
  if (!figure) return null
  if (figure.kind === 'bar') return <Spark data={figure.data} series={figure.series} bars />
  if (figure.kind === 'line' || figure.kind === 'area') {
    return <Spark data={figure.data} series={figure.series} />
  }
  if (figure.kind === 'graph') return <GraphSketch nodes={figure.nodes} edges={figure.edges} />
  if (figure.kind !== 'scene') return null
  return <SceneArt name={figure.scene} compact />
}

/** Full illustration on a sample page. */
export function PageFigurePanel({ pageId }: { pageId: string }) {
  const figure = PAGE_FIGURES[pageId]
  if (!figure) return null

  let body: ReactNode = null
  if (figure.kind === 'bar') {
    body = (
      <>
        <BarChart data={figure.data} label={figure.title} format={figure.format} series={figure.series} height={220} />
        <ChartLegend entries={[{ label: figure.legend, series: figure.series ?? 0 }]} />
      </>
    )
  } else if (figure.kind === 'line') {
    body = (
      <>
        <LineChart data={figure.data} label={figure.title} format={figure.format} series={figure.series} height={220} />
        <ChartLegend entries={[{ label: figure.legend, series: figure.series ?? 1 }]} />
      </>
    )
  } else if (figure.kind === 'area') {
    body = (
      <>
        <AreaChart data={figure.data} label={figure.title} format={figure.format} series={figure.series} height={220} />
        <ChartLegend entries={[{ label: figure.legend, series: figure.series ?? 1 }]} />
      </>
    )
  } else if (figure.kind === 'graph') {
    body = <GraphView nodes={figure.nodes} edges={figure.edges} label={figure.title} height={340} />
  } else if (figure.kind === 'scene') {
    body = <SceneArt name={figure.scene} title={figure.title} />
  }

  return (
    <Panel title={figure.title} note={figure.note}>
      {body}
    </Panel>
  )
}
