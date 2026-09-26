import { geoMercator, geoPath, type GeoGeometryObjects } from 'd3-geo'
import { useId, useMemo } from 'react'

export interface LocationMapFeature {
  /** Stable source identifier (for example, an OSM element id). */
  id: string
  /** A feature kind used to choose a map style. */
  kind: 'road' | 'water' | 'vegetation' | 'building' | 'other'
  /** OSM-derived GeoJSON geometry supplied by the calling application. */
  geometry: GeoGeometryObjects
}

export interface LocationMapProps {
  /** Geographic features already available to the application. */
  features: LocationMapFeature[]
  /** The location to mark; coordinates are rendered locally. */
  center: { latitude: number; longitude: number }
  /** Accessible map description. */
  label: string
  height?: number
}

const WIDTH = 640
const DEFAULT_HEIGHT = 320
const OSM_ORIGIN = 'https://www.openstreetmap.org'

function isValidCenter(center: LocationMapProps['center']): boolean {
  return (
    Number.isFinite(center.latitude) &&
    center.latitude >= -90 &&
    center.latitude <= 90 &&
    Number.isFinite(center.longitude) &&
    center.longitude >= -180 &&
    center.longitude <= 180
  )
}

/**
 * A static OpenStreetMap-derived map rendered from application-supplied
 * geometry. It makes no network requests: the location and features remain in
 * the page and are never sent to a tile server. The only external navigation
 * is the explicit “Open in OpenStreetMap” link.
 */
export function LocationMap({ features, center, label, height = DEFAULT_HEIGHT }: LocationMapProps) {
  const titleId = useId()
  const map = useMemo(() => {
    if (!isValidCenter(center)) return null

    const centerPoint: GeoGeometryObjects = {
      type: 'Point',
      coordinates: [center.longitude, center.latitude],
    }
    const geometries = features.map((feature) => feature.geometry)
    const fitObjects = geometries.length
      ? [...geometries, centerPoint]
      : [
          {
            type: 'MultiPoint' as const,
            coordinates: [
              [center.longitude - 0.002, center.latitude - 0.002],
              [center.longitude + 0.002, center.latitude + 0.002],
              [center.longitude, center.latitude],
            ],
          },
        ]
    const projection = geoMercator().fitExtent(
      [
        [12, 12],
        [WIDTH - 12, height - 12],
      ],
      { type: 'GeometryCollection', geometries: fitObjects },
    )
    const path = geoPath(projection)
    const marker = projection([center.longitude, center.latitude])

    return {
      featurePaths: features.map((feature) => path(feature.geometry) ?? ''),
      marker,
    }
  }, [center, features, height])

  const openMapUrl = new URL('/', OSM_ORIGIN)
  if (isValidCenter(center)) {
    openMapUrl.searchParams.set('mlat', String(center.latitude))
    openMapUrl.searchParams.set('mlon', String(center.longitude))
    openMapUrl.hash = `map=16/${center.latitude}/${center.longitude}`
  }

  return (
    <figure className="nav-location-map">
      {map ? (
        <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-labelledby={titleId}>
          <title id={titleId}>{label}</title>
          <rect className="nav-location-map__background" width={WIDTH} height={height} />
          {features.map((feature, index) => (
            <path
              key={feature.id}
              className={`nav-location-map__feature nav-location-map__feature--${feature.kind}`}
              d={map.featurePaths[index]}
              data-feature-kind={feature.kind}
            />
          ))}
          {map.marker ? (
            <circle
              className="nav-location-map__marker"
              cx={map.marker[0]}
              cy={map.marker[1]}
              r="7"
              data-location-marker
            >
              <title>{label}</title>
            </circle>
          ) : null}
        </svg>
      ) : (
        <p className="nav-location-map__invalid" role="status">
          Map location is unavailable.
        </p>
      )}
      <figcaption className="nav-location-map__attribution">
        <span>
          ©{' '}
          <a href={new URL('/copyright', OSM_ORIGIN).href} target="_blank" rel="noreferrer noopener">
            OpenStreetMap contributors
          </a>
        </span>
        <a href={openMapUrl.href} target="_blank" rel="noreferrer noopener">
          Open this area in OpenStreetMap
        </a>
      </figcaption>
    </figure>
  )
}
