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
  | 'outline'
  | 'verify'
  | 'packet'
  | 'warrant'
  | 'company'
  | 'board'
  | 'ownership'
  | 'gates'
  | 'estate'

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
  'motion-outline': scene(
    'The brief as stacked units',
    'Harvard numbering is a pile of polygons: issue, rule, quote, relief. The record is cited, not paraphrased.',
    'outline',
  ),
  'verify-the-record': scene(
    'Brief against the record',
    'Two pages of the same matter, drawn as polygons: the motion on the left, the excerpt it quotes on the right.',
    'verify',
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
  'subpoena-packet': scene(
    'Authority, scope, service, return',
    'A packet is four polygons in a row. Skipping a facet is how a return comes back empty.',
    'packet',
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
  'serve-warrant': scene(
    'Who may serve, and on what authority',
    'The order is a badge of polygons: source, actor, premises, return.',
    'warrant',
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
  'company-formation': scene(
    'The entity being formed',
    'Founders and the company as a small skyline of polygons — not a cap table.',
    'company',
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
  'board-consent': scene(
    'Who has to approve',
    'The resolution is a table of polygons: the paper, the seats that must sign, the minute book it will enter.',
    'board',
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
  'beneficial-ownership': scene(
    'Who owns twenty-five percent or more',
    'Ownership as wedges, not a filing. Counsel still owns the review boundary.',
    'ownership',
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
  'naturalization-screening': scene(
    'Eligibility as a sequence of gates',
    'A screening is a set of polygonal gates, not an application. Follow-up is the product.',
    'gates',
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
  'estate-plan': scene(
    'People the plan has to name',
    'A house of polygons: the person, the people they care for, and the instruments they will sign.',
    'estate',
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
      {name === 'outline' ? <OutlineScene width={width} height={height} /> : null}
      {name === 'verify' ? <VerifyScene width={width} height={height} /> : null}
      {name === 'packet' ? <PacketScene width={width} height={height} /> : null}
      {name === 'warrant' ? <WarrantScene width={width} height={height} /> : null}
      {name === 'company' ? <CompanyScene width={width} height={height} /> : null}
      {name === 'board' ? <BoardScene width={width} height={height} /> : null}
      {name === 'ownership' ? <OwnershipScene width={width} height={height} /> : null}
      {name === 'gates' ? <GatesScene width={width} height={height} /> : null}
      {name === 'estate' ? <EstateScene width={width} height={height} /> : null}
    </svg>
  )
}

function Fill({ points, series, opacity = 0.92 }: { points: string; series: number; opacity?: number }) {
  return <polygon points={points} fill={seriesColor(series)} opacity={opacity} />
}

function IntakeScene({ width, height }: { width: number; height: number }) {
  const diamond = (cx: number, cy: number, r: number) =>
    `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`
  return (
    <g>
      <Fill
        series={2}
        opacity={0.35}
        points={`${width * 0.08},${height * 0.58} ${width * 0.38},${height * 0.18} ${width * 0.7},${height * 0.72} ${width * 0.92},${height * 0.32} ${width * 0.78},${height * 0.88} ${width * 0.2},${height * 0.9}`}
      />
      <Fill series={0} points={diamond(width * 0.18, height * 0.48, Math.min(14, height * 0.16))} />
      <Fill series={1} points={diamond(width * 0.5, height * 0.55, Math.min(11, height * 0.12))} />
      <Fill series={3} points={diamond(width * 0.82, height * 0.38, Math.min(16, height * 0.18))} />
    </g>
  )
}

function QuestionsScene({ width, height }: { width: number; height: number }) {
  const rows = 3
  return (
    <g>
      {Array.from({ length: rows }, (_, index) => {
        const y = height * (0.22 + index * 0.28)
        const inset = index * width * 0.04
        return (
          <g key={index}>
            <Fill
              series={index}
              points={`${width * 0.08},${y - height * 0.08} ${width * 0.2},${y - height * 0.08} ${width * 0.24},${y + height * 0.08} ${width * 0.08},${y + height * 0.08}`}
            />
            <Fill
              series={index}
              opacity={0.35}
              points={`${width * 0.28 + inset},${y - height * 0.05} ${width * 0.9},${y - height * 0.05} ${width * 0.86},${y + height * 0.05} ${width * 0.28 + inset},${y + height * 0.05}`}
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
      {[0, 1, 2, 3].map((index) => {
        const x = width * (0.1 + index * 0.21)
        const skew = index % 2 === 0 ? height * 0.06 : 0
        return (
          <Fill
            key={index}
            series={index}
            points={`${x},${height * 0.2 + skew} ${x + width * 0.16},${height * 0.16 + skew} ${x + width * 0.16},${height * 0.78 + skew} ${x},${height * 0.84 + skew}`}
          />
        )
      })}
    </g>
  )
}

function ShieldScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  const top = height * 0.1
  return (
    <g>
      <Fill
        series={0}
        points={`${cx},${top} ${width * 0.74},${height * 0.28} ${width * 0.68},${height * 0.8} ${cx},${height * 0.94} ${width * 0.32},${height * 0.8} ${width * 0.26},${height * 0.28}`}
      />
      <Fill
        series={3}
        opacity={0.55}
        points={`${width * 0.42},${height * 0.48} ${width * 0.48},${height * 0.64} ${width * 0.62},${height * 0.34} ${width * 0.56},${height * 0.32} ${width * 0.48},${height * 0.52} ${width * 0.44},${height * 0.46}`}
      />
    </g>
  )
}

function LockScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  const shackle = Math.min(width, height) * 0.12
  return (
    <g>
      <Fill
        series={4}
        points={`${cx - width * 0.14},${height * 0.42} ${cx + width * 0.14},${height * 0.42} ${cx + width * 0.16},${height * 0.84} ${cx - width * 0.16},${height * 0.84}`}
      />
      <Fill
        series={0}
        opacity={0.4}
        points={`${cx - shackle},${height * 0.42} ${cx - shackle},${height * 0.2} ${cx},${height * 0.1} ${cx + shackle},${height * 0.2} ${cx + shackle},${height * 0.42} ${cx + shackle * 0.55},${height * 0.42} ${cx + shackle * 0.55},${height * 0.24} ${cx},${height * 0.16} ${cx - shackle * 0.55},${height * 0.24} ${cx - shackle * 0.55},${height * 0.42}`}
      />
      <Fill series={0} points={`${cx},${height * 0.54} ${cx + 8},${height * 0.62} ${cx},${height * 0.7} ${cx - 8},${height * 0.62}`} />
    </g>
  )
}

function JourneyScene({ width, height }: { width: number; height: number }) {
  const steps = 5
  return (
    <g>
      <Fill
        series={5}
        opacity={0.3}
        points={`${width * 0.06},${height * 0.78} ${width * 0.94},${height * 0.78} ${width * 0.94},${height * 0.88} ${width * 0.06},${height * 0.88}`}
      />
      {Array.from({ length: steps }, (_, index) => {
        const x = width * (0.12 + index * 0.19)
        const y = height * (index % 2 === 0 ? 0.38 : 0.26)
        const r = Math.min(14, height * 0.14)
        return (
          <Fill
            key={index}
            series={index}
            points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`}
          />
        )
      })}
    </g>
  )
}

function ExpungeScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <Fill
        series={5}
        opacity={0.35}
        points={`${width * 0.2},${height * 0.18} ${width * 0.56},${height * 0.14} ${width * 0.6},${height * 0.82} ${width * 0.18},${height * 0.84}`}
      />
      <Fill
        series={0}
        points={`${width * 0.28},${height * 0.3} ${width * 0.52},${height * 0.3} ${width * 0.5},${height * 0.4} ${width * 0.28},${height * 0.4}`}
      />
      <Fill
        series={2}
        points={`${width * 0.28},${height * 0.48} ${width * 0.46},${height * 0.48} ${width * 0.44},${height * 0.56} ${width * 0.28},${height * 0.56}`}
      />
      <Fill
        series={3}
        points={`${width * 0.58},${height * 0.22} ${width * 0.9},${height * 0.4} ${width * 0.72},${height * 0.78} ${width * 0.52},${height * 0.5}`}
      />
    </g>
  )
}

function OutlineScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((index) => {
        const y = height * (0.12 + index * 0.2)
        const indent = index * width * 0.06
        return (
          <Fill
            key={index}
            series={index}
            points={`${width * 0.1 + indent},${y} ${width * 0.88},${y} ${width * 0.84},${y + height * 0.14} ${width * 0.1 + indent},${y + height * 0.14}`}
          />
        )
      })}
    </g>
  )
}

function VerifyScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <Fill
        series={0}
        points={`${width * 0.08},${height * 0.14} ${width * 0.44},${height * 0.1} ${width * 0.44},${height * 0.86} ${width * 0.08},${height * 0.86}`}
      />
      <Fill
        series={3}
        points={`${width * 0.56},${height * 0.1} ${width * 0.92},${height * 0.18} ${width * 0.92},${height * 0.88} ${width * 0.56},${height * 0.82}`}
      />
      <Fill
        series={1}
        opacity={0.55}
        points={`${width * 0.14},${height * 0.28} ${width * 0.38},${height * 0.28} ${width * 0.38},${height * 0.38} ${width * 0.14},${height * 0.38}`}
      />
      <Fill
        series={2}
        opacity={0.55}
        points={`${width * 0.62},${height * 0.34} ${width * 0.86},${height * 0.36} ${width * 0.86},${height * 0.5} ${width * 0.56},${height * 0.48}`}
      />
    </g>
  )
}

function PacketScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((index) => {
        const x = width * (0.08 + index * 0.23)
        return (
          <Fill
            key={index}
            series={index}
            points={`${x + width * 0.1},${height * 0.16} ${x + width * 0.2},${height * 0.5} ${x + width * 0.1},${height * 0.84} ${x},${height * 0.5}`}
          />
        )
      })}
    </g>
  )
}

function WarrantScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  return (
    <g>
      <Fill
        series={0}
        points={`${cx},${height * 0.08} ${width * 0.78},${height * 0.32} ${width * 0.7},${height * 0.88} ${cx},${height * 0.72} ${width * 0.3},${height * 0.88} ${width * 0.22},${height * 0.32}`}
      />
      <Fill
        series={4}
        points={`${cx},${height * 0.28} ${width * 0.62},${height * 0.4} ${width * 0.58},${height * 0.68} ${cx},${height * 0.58} ${width * 0.42},${height * 0.68} ${width * 0.38},${height * 0.4}`}
      />
    </g>
  )
}

function CompanyScene({ width, height }: { width: number; height: number }) {
  const roofs = [
    { x: 0.08, w: 0.18, h: 0.55, series: 0 },
    { x: 0.28, w: 0.22, h: 0.7, series: 1 },
    { x: 0.52, w: 0.16, h: 0.45, series: 2 },
    { x: 0.7, w: 0.22, h: 0.62, series: 3 },
  ]
  return (
    <g>
      {roofs.map((building) => {
        const x = width * building.x
        const top = height * (1 - building.h)
        const w = width * building.w
        return (
          <g key={building.x}>
            <Fill
              series={building.series}
              points={`${x + w * 0.5},${top} ${x + w},${top + height * 0.12} ${x + w},${height * 0.88} ${x},${height * 0.88} ${x},${top + height * 0.12}`}
            />
          </g>
        )
      })}
    </g>
  )
}

function BoardScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      <Fill
        series={2}
        points={`${width * 0.12},${height * 0.55} ${width * 0.88},${height * 0.5} ${width * 0.82},${height * 0.78} ${width * 0.18},${height * 0.82}`}
      />
      {[0, 1, 2, 3].map((index) => {
        const x = width * (0.18 + index * 0.18)
        return (
          <Fill
            key={index}
            series={index}
            points={`${x},${height * 0.22} ${x + width * 0.1},${height * 0.22} ${x + width * 0.12},${height * 0.48} ${x - width * 0.02},${height * 0.48}`}
          />
        )
      })}
    </g>
  )
}

function OwnershipScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  const cy = height / 2
  const r = Math.min(width, height) * 0.38
  const wedges = [
    { start: 0, end: 0.4, series: 0 },
    { start: 0.4, end: 0.75, series: 1 },
    { start: 0.75, end: 1, series: 3 },
  ]
  return (
    <g>
      {wedges.map((wedge) => {
        const a0 = wedge.start * Math.PI * 2 - Math.PI / 2
        const a1 = wedge.end * Math.PI * 2 - Math.PI / 2
        const x0 = cx + Math.cos(a0) * r
        const y0 = cy + Math.sin(a0) * r
        const x1 = cx + Math.cos(a1) * r
        const y1 = cy + Math.sin(a1) * r
        const mid = (a0 + a1) / 2
        const xm = cx + Math.cos(mid) * r
        const ym = cy + Math.sin(mid) * r
        return <Fill key={wedge.series} series={wedge.series} points={`${cx},${cy} ${x0},${y0} ${xm},${ym} ${x1},${y1}`} />
      })}
    </g>
  )
}

function GatesScene({ width, height }: { width: number; height: number }) {
  return (
    <g>
      {[0, 1, 2, 3].map((index) => {
        const x = width * (0.06 + index * 0.24)
        const open = index < 2
        return (
          <Fill
            key={index}
            series={open ? 3 : 4}
            points={`${x},${height * 0.2} ${x + width * 0.18},${height * 0.12} ${x + width * 0.18},${height * 0.88} ${x},${height * 0.8}`}
          />
        )
      })}
    </g>
  )
}

function EstateScene({ width, height }: { width: number; height: number }) {
  const cx = width / 2
  return (
    <g>
      <Fill
        series={1}
        points={`${cx},${height * 0.1} ${width * 0.82},${height * 0.42} ${width * 0.18},${height * 0.42}`}
      />
      <Fill
        series={0}
        points={`${width * 0.26},${height * 0.42} ${width * 0.74},${height * 0.42} ${width * 0.74},${height * 0.88} ${width * 0.26},${height * 0.88}`}
      />
      <Fill
        series={3}
        points={`${width * 0.42},${height * 0.58} ${width * 0.58},${height * 0.58} ${width * 0.58},${height * 0.88} ${width * 0.42},${height * 0.88}`}
      />
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
