import { projectGeographicPoint } from './geographicProjection';
import { getTerritoryGeography } from './territoryGeography';
import type { Territory, TheaterId } from './types';

/** Play-map points never fall back to archive pixels or an invented location. */
export function getGeographicMapPlacement(theater: TheaterId, territory: Pick<Territory, 'id'>) {
  const coordinate = getTerritoryGeography(territory.id);
  return coordinate ? { ...projectGeographicPoint(theater, coordinate), frame: 'main' as const } : null;
}

export function formatTerritoryCoordinates(id: string): string {
  const point = getTerritoryGeography(id);
  if (!point) return '위치 자료 미등록';
  const latitude = `${Math.abs(point.latitude).toFixed(2)}°${point.latitude >= 0 ? 'N' : 'S'}`;
  const longitude = `${Math.abs(point.longitude).toFixed(2)}°${point.longitude >= 0 ? 'E' : 'W'}`;
  return `${latitude} · ${longitude}`;
}
