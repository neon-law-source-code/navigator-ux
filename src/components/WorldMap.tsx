import { max as d3Max, min as d3Min } from 'd3-array'
import { geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo'
import { useId, useMemo } from 'react'
import { feature } from 'topojson-client'
import type { GeometryCollection, Topology } from 'topojson-specification'

import countriesTopology from '../assets/geo/countries-110m.json'
import { seriesColor } from '../lib/chart-series'
import { numericCountryId } from '../lib/iso-3166'

/*
 * A choropleth of the world on d3-geo.
 *
 * Same split as the other charts: d3 computes the projection and the path
 * strings, React owns the SVG. The geometry is Natural Earth 110m, vendored
 * as TopoJSON so the library does not fetch an atlas at runtime — a remote
 * outline would fail `check:bundle` and would be a supply-chain dependency
 * nobody reviewed.
 *
 * Fills are `--nav-chart-*` tokens at varying opacity, never a generated hex.
 * A sequential interpolator that emitted `#…` would be the one chart that
 * did not follow the brand layer into dark mode.
 */

export interface MapValue {
  /**
   * ISO 3166-1 numeric (`840`), alpha-3 (`USA`), or the Natural Earth name
   * (`United States of America`).
   */
  id: string
  value: number
  /** Overrides the Natural Earth name in the accessible summary and tooltip. */
  label?: string
}

export interface WorldMapProps {
  data: MapValue[]
  /** Describes the map. Required — an unlabelled map reports nothing. */
  label: string
  height?: number
  /** Index into the six series colors, used for every valued country. */
  series?: number
  format?: (value: number) => string
  onSelect?: (region: { id: string; name: string; value?: number }) => void
}

const WIDTH = 640
const DEFAULT_HEIGHT = 340

interface CountryFeature {
  id: string
  name: string
  geometry: GeoPermissibleObjects
}

interface WorldObjects extends Topology {
  objects: {
    countries: GeometryCollection
    land: GeometryCollection
  }
}

function countryFeatures(): CountryFeature[] {
  const topology = countriesTopology as unknown as WorldObjects
  const collection = feature(topology, topology.objects.countries)
  return collection.features.flatMap((entry) => {
    const id = entry.id === undefined || entry.id === null ? '' : String(entry.id).padStart(3, '0')
    const name =
      entry.properties && typeof entry.properties === 'object' && 'name' in entry.properties
        ? String(entry.properties.name)
        : id
    if (!id) return []
    return [{ id, name, geometry: entry as GeoPermissibleObjects }]
  })
}

function lookupValue(data: MapValue[], country: CountryFeature): MapValue | undefined {
  const name = country.name.toLowerCase()
  return data.find((row) => {
    const numeric = numericCountryId(row.id)
    if (numeric && numeric === country.id) return true
    return row.id.trim().toLowerCase() === name
  })
}

function summarize(
  data: MapValue[],
  countries: CountryFeature[],
  label: string,
  format: (value: number) => string,
): string {
  if (data.length === 0) return `${label}: no data`
  const valued = data
    .map((row) => {
      const country = countries.find((entry) => lookupValue([row], entry))
      return { row, name: row.label ?? country?.name ?? row.id }
    })
    .filter((entry) => Number.isFinite(entry.row.value))
  const top = valued.reduce<typeof valued[0] | null>(
    (best, entry) => (!best || entry.row.value > best.row.value ? entry : best),
    null,
  )
  if (!top) return `${label}: no data`
  return `${label}. ${valued.length} regions. Highest is ${top.name} at ${format(top.row.value)}.`
}

/**
 * A world choropleth. Unvalued countries stay at the surface token; valued
 * ones take the series color at an opacity scaled to the data, so a single
 * series still reads as a magnitude rather than a category.
 */
export function WorldMap({
  data,
  label,
  height = DEFAULT_HEIGHT,
  series = 0,
  format = String,
  onSelect,
}: WorldMapProps) {
  const titleId = useId()
  const countries = useMemo(countryFeatures, [])

  const { path, sphere, opacityOf, ticks } = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [8, 8],
        [WIDTH - 8, height - 8],
      ],
      { type: 'Sphere' },
    )
    const makePath = geoPath(projection)
    const values = data.map((row) => row.value).filter((value) => Number.isFinite(value))
    const lowest = d3Min(values) ?? 0
    const highest = d3Max(values) ?? 1
    const span = highest === lowest ? 1 : highest - lowest
    return {
      path: makePath,
      sphere: makePath({ type: 'Sphere' }) ?? '',
      opacityOf: (value: number) => 0.22 + ((value - lowest) / span) * 0.78,
      ticks: { lowest, highest },
    }
  }, [data, height])

  return (
    <figure className="nav-chart nav-chart--map">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={titleId}>
        <title id={titleId}>{summarize(data, countries, label, format)}</title>
        <path className="nav-chart__sphere" d={sphere} />
        {countries.map((country) => {
          const outline = path(country.geometry)
          if (!outline) return null
          const match = lookupValue(data, country)
          const name = match?.label ?? country.name
          const selectable = Boolean(onSelect)
          return (
            <path
              key={country.id}
              className={[
                'nav-chart__land',
                match ? 'nav-chart__land--valued' : '',
                selectable ? 'nav-chart__land--selectable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              d={outline}
              fill={match ? seriesColor(series) : undefined}
              fillOpacity={match ? opacityOf(match.value) : undefined}
              data-country={country.id}
              onClick={
                selectable
                  ? () => onSelect?.({ id: country.id, name, value: match?.value })
                  : undefined
              }
            >
              <title>
                {match ? `${name}: ${format(match.value)}` : name}
              </title>
            </path>
          )
        })}
      </svg>
      {data.length > 0 ? (
        <p className="nav-chart__map-range" aria-hidden="true">
          {format(ticks.lowest)} – {format(ticks.highest)}
        </p>
      ) : null}
    </figure>
  )
}
