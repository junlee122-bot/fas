import type { TheaterId } from './types';

export interface GeographicPoint {
  latitude: number;
  longitude: number;
}

export interface GeographicBounds {
  west: number;
  east: number;
  north: number;
  south: number;
}

export interface GeographicMapPoint {
  x: number;
  y: number;
}

export const GEOGRAPHIC_MAP_WIDTH = 1200;
export const GEOGRAPHIC_MAP_HEIGHT = 760;
export const GEOGRAPHIC_MAP_PADDING = 24;

/** Physical geography only: these extents do not assert any country's borders. */
export const geographicBounds: Readonly<Record<TheaterId, GeographicBounds>> = {
  europe: { west: -30, east: 65, north: 73, south: 23 },
  asia: { west: 60, east: 210, north: 65, south: -30 },
};

/** Keep the Pacific continuous rather than making the date line a map seam. */
export function unwrapGeographicLongitude(theater: TheaterId, longitude: number): number {
  if (!Number.isFinite(longitude)) throw new RangeError('Longitude must be finite.');
  const bounds = geographicBounds[theater];
  const center = (bounds.west + bounds.east) / 2;
  return longitude + 360 * Math.round((center - longitude) / 360);
}

function projectionMetrics(theater: TheaterId) {
  const bounds = geographicBounds[theater];
  const longitudeScale = Math.cos(((bounds.north + bounds.south) / 2) * Math.PI / 180);
  const spanX = (bounds.east - bounds.west) * longitudeScale;
  const spanY = bounds.north - bounds.south;
  const scale = Math.min(
    (GEOGRAPHIC_MAP_WIDTH - GEOGRAPHIC_MAP_PADDING * 2) / spanX,
    (GEOGRAPHIC_MAP_HEIGHT - GEOGRAPHIC_MAP_PADDING * 2) / spanY,
  );
  return {
    bounds,
    longitudeScale,
    scale,
    x: (GEOGRAPHIC_MAP_WIDTH - spanX * scale) / 2,
    y: (GEOGRAPHIC_MAP_HEIGHT - spanY * scale) / 2,
    width: spanX * scale,
    height: spanY * scale,
  };
}

export function getGeographicPlotBounds(theater: TheaterId) {
  const { x, y, width, height } = projectionMetrics(theater);
  return { x, y, width, height };
}

/**
 * Equidistant cylindrical projection with a theater-specific standard parallel.
 * Coastlines, cities and route vertices all use this one projection. It is not
 * an affine fit to the historic scans, which have their own insets/projections.
 * Values outside the theater are intentionally not clamped to its coastline.
 */
export function projectGeographicPoint(theater: TheaterId, point: GeographicPoint): GeographicMapPoint {
  if (!Number.isFinite(point.latitude)) throw new RangeError('Latitude must be finite.');
  const { bounds, longitudeScale, scale, x, y } = projectionMetrics(theater);
  const longitude = unwrapGeographicLongitude(theater, point.longitude);
  return {
    x: x + (longitude - bounds.west) * longitudeScale * scale,
    y: y + (bounds.north - point.latitude) * scale,
  };
}

export function unprojectGeographicPoint(theater: TheaterId, point: GeographicMapPoint): GeographicPoint {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) throw new RangeError('Map coordinates must be finite.');
  const { bounds, longitudeScale, scale, x, y } = projectionMetrics(theater);
  const longitude = bounds.west + (point.x - x) / (longitudeScale * scale);
  return {
    latitude: bounds.north - (point.y - y) / scale,
    longitude: ((longitude + 180) % 360 + 360) % 360 - 180,
  };
}

export function isGeographicPointInBounds(theater: TheaterId, point: GeographicPoint): boolean {
  if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) return false;
  const bounds = geographicBounds[theater];
  const longitude = unwrapGeographicLongitude(theater, point.longitude);
  return longitude >= bounds.west && longitude <= bounds.east
    && point.latitude >= bounds.south && point.latitude <= bounds.north;
}
