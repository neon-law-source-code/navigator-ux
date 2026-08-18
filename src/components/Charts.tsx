import { max as d3Max, min as d3Min } from 'd3-array'
import { scaleBand, scaleLinear } from 'd3-scale'
import { area as d3Area, line as d3Line, curveMonotoneX } from 'd3-shape'
import { useId, useMemo, type ReactNode } from 'react'

import { seriesColor } from '../lib/chart-series'

/*
 * Bar, Line, and Area charts on d3.
 *
 * d3 does the arithmetic and never touches the DOM. `scaleBand`, `scaleLinear`,
 * `line`, and `area` are pure functions from data to numbers and path strings;
 * React renders the SVG. That split is the whole reason d3 and React can share
 * a component without fighting over who owns the element, and it is why none of
 * these needs a ref or an effect.
 *
 * shadcn's Chart wraps Recharts. Recharts is a renderer as well as a chart
 * library, so it brings its own reconciliation and its own opinions about SVG;
 * using d3's math modules directly is a fraction of the weight and leaves the
 * markup — and therefore the accessibility and the token colors — here.
 *
 * Series colors come from `--nav-chart-*` through `var()` in presentation
 * attributes. A hex here would be the one place in the library that does not
 * follow the theme into dark mode, and `check:tokens` fails the build over it.
 */

export interface ChartPoint {
  /** Category or time bucket. Used verbatim as the axis tick. */
  label: string
  value: number
}

export interface ChartProps {
  data: ChartPoint[]
  /** Describes the chart. Required — an unlabelled chart reports nothing. */
  label: string
  /** Drawn height. Width is fluid; the viewBox scales. */
  height?: number
  /** Index into the six series colors. */
  series?: number
  /** Format for the value axis and the accessible summary. */
  format?: (value: number) => string
}

const MARGIN = { top: 12, right: 12, bottom: 28, left: 44 }
const WIDTH = 640

/** The plot area once the axis gutters are taken out. */
function plotSize(height: number) {
  return {
    inner: WIDTH - MARGIN.left - MARGIN.right,
    innerHeight: height - MARGIN.top - MARGIN.bottom,
  }
}

/**
 * A one-sentence summary of the series, for readers who get the `<title>`
 * rather than the picture.
 *
 * A chart whose only accessible name is "Bar chart" has told a screen-reader
 * user nothing at all. Range and direction is the least that is useful.
 */
function summarize(data: ChartPoint[], label: string, format: (value: number) => string): string {
  const first = data[0]
  const last = data[data.length - 1]
  if (!first || !last) return `${label}: no data`
  const values = data.map((point) => point.value)
  const lowest = d3Min(values) ?? 0
  const highest = d3Max(values) ?? 0
  return `${label}. ${data.length} points from ${first.label} to ${last.label}, ranging ${format(lowest)} to ${format(highest)}. Ends at ${format(last.value)}.`
}

function Gridlines({ ticks, scale, inner }: { ticks: number[]; scale: (v: number) => number; inner: number }) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => (
        <line
          key={tick}
          className="nav-chart__grid"
          x1={0}
          x2={inner}
          y1={scale(tick)}
          y2={scale(tick)}
        />
      ))}
    </g>
  )
}

function ValueAxis({
  ticks,
  scale,
  format,
}: {
  ticks: number[]
  scale: (v: number) => number
  format: (value: number) => string
}) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => (
        <text key={tick} className="nav-chart__tick" x={-8} y={scale(tick)} dy="0.32em" textAnchor="end">
          {format(tick)}
        </text>
      ))}
    </g>
  )
}

/**
 * A categorical bar chart.
 *
 * The value axis starts at zero and is not configurable, because a truncated
 * bar axis misstates the ratio between bars — which is the only thing a bar
 * chart is for. Use `LineChart` when the interesting range does not include
 * zero.
 */
export function BarChart({
  data,
  label,
  height = 260,
  series = 0,
  format = String,
}: ChartProps) {
  const titleId = useId()
  const { inner, innerHeight } = plotSize(height)

  const { x, y, ticks } = useMemo(() => {
    const xScale = scaleBand<string>()
      .domain(data.map((point) => point.label))
      .range([0, inner])
      .padding(0.24)
    const yScale = scaleLinear()
      .domain([0, d3Max(data, (point) => point.value) ?? 1])
      .nice()
      .range([innerHeight, 0])
    return { x: xScale, y: yScale, ticks: yScale.ticks(4) }
  }, [data, inner, innerHeight])

  return (
    <figure className="nav-chart">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{summarize(data, label, format)}</title>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <Gridlines ticks={ticks} scale={y} inner={inner} />
          <ValueAxis ticks={ticks} scale={y} format={format} />
          {data.map((point) => (
            <rect
              key={point.label}
              className="nav-chart__bar"
              x={x(point.label)}
              y={y(point.value)}
              width={x.bandwidth()}
              height={Math.max(0, innerHeight - y(point.value))}
              fill={seriesColor(series)}
            />
          ))}
          {data.map((point) => (
            <text
              key={point.label}
              className="nav-chart__tick"
              x={(x(point.label) ?? 0) + x.bandwidth() / 2}
              y={innerHeight + 18}
              textAnchor="middle"
              aria-hidden="true"
            >
              {point.label}
            </text>
          ))}
        </g>
      </svg>
    </figure>
  )
}

/** Line and area share everything but the fill, so they share an implementation. */
function Trend({
  data,
  label,
  height = 260,
  series = 0,
  format = String,
  filled,
}: ChartProps & { filled: boolean }) {
  const titleId = useId()
  const { inner, innerHeight } = plotSize(height)

  const { linePath, areaPath, ticks, y, x } = useMemo(() => {
    const xScale = scaleLinear()
      .domain([0, Math.max(1, data.length - 1)])
      .range([0, inner])
    const lowest = d3Min(data, (point) => point.value) ?? 0
    const highest = d3Max(data, (point) => point.value) ?? 1
    // A flat series would otherwise get a zero-height domain and divide by zero.
    const yScale = scaleLinear()
      .domain(lowest === highest ? [lowest - 1, highest + 1] : [lowest, highest])
      .nice()
      .range([innerHeight, 0])

    const makeLine = d3Line<ChartPoint>()
      .x((_, index) => xScale(index))
      .y((point) => yScale(point.value))
      .curve(curveMonotoneX)
    const makeArea = d3Area<ChartPoint>()
      .x((_, index) => xScale(index))
      .y0(innerHeight)
      .y1((point) => yScale(point.value))
      .curve(curveMonotoneX)

    return {
      linePath: makeLine(data) ?? '',
      areaPath: makeArea(data) ?? '',
      ticks: yScale.ticks(4),
      y: yScale,
      x: xScale,
    }
  }, [data, inner, innerHeight])

  const gradientId = useId()
  const last = data[data.length - 1]

  return (
    <figure className="nav-chart">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{summarize(data, label, format)}</title>
        {filled ? (
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={seriesColor(series)} stopOpacity="0.28" />
              <stop offset="100%" stopColor={seriesColor(series)} stopOpacity="0.02" />
            </linearGradient>
          </defs>
        ) : null}
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          <Gridlines ticks={ticks} scale={y} inner={inner} />
          <ValueAxis ticks={ticks} scale={y} format={format} />
          {filled ? <path className="nav-chart__area" d={areaPath} fill={`url(#${gradientId})`} /> : null}
          <path className="nav-chart__line" d={linePath} stroke={seriesColor(series)} fill="none" />
          {/* The endpoint is emphasized because it is the value a reader
              actually wants from a trend: where it is now. */}
          {last ? (
            <circle
              className="nav-chart__endpoint"
              cx={x(data.length - 1)}
              cy={y(last.value)}
              r={4}
              fill={seriesColor(series)}
            />
          ) : null}
          {data.map((point, index) => (
            <text
              key={point.label}
              className="nav-chart__tick"
              x={x(index)}
              y={innerHeight + 18}
              textAnchor="middle"
              aria-hidden="true"
            >
              {point.label}
            </text>
          ))}
        </g>
      </svg>
    </figure>
  )
}

/** A trend line. Use where the interesting range does not include zero. */
export function LineChart(props: ChartProps) {
  return <Trend {...props} filled={false} />
}

/** A trend line with the area under it filled. */
export function AreaChart(props: ChartProps) {
  return <Trend {...props} filled />
}

/* ----------------------------------------------------------------- legend -- */

export interface ChartLegendProps {
  entries: { label: ReactNode; series: number }[]
}

export function ChartLegend({ entries }: ChartLegendProps) {
  return (
    <ul className="nav-chart-legend">
      {entries.map((entry, index) => (
        /* eslint-disable-next-line react/no-array-index-key */
        <li className="nav-chart-legend__entry" key={index}>
          <span
            className="nav-chart-legend__swatch"
            style={{ background: seriesColor(entry.series) }}
            aria-hidden="true"
          />
          {entry.label}
        </li>
      ))}
    </ul>
  )
}
