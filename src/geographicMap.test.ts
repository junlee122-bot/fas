import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { formatTerritoryCoordinates, getGeographicMapPlacement } from './geographicMap';
import { getHistoricalMapPlacement } from './historicalMaps';
import { projectGeographicPoint, unprojectGeographicPoint } from './geographicProjection';
import { getTerritoryGeography } from './territoryGeography';

describe('geographic play-map placement', () => {
  it('fails closed for unmapped and inherited keys even when legacy screen positions exist', () => {
    ['unknown-port', '__proto__', 'constructor', 'toString', ''].forEach((id) => {
      const legacy = { id, x: 50, y: 50 };
      expect(getGeographicMapPlacement('europe', legacy)).toBeNull();
      expect(getGeographicMapPlacement('asia', legacy)).toBeNull();
      expect(formatTerritoryCoordinates(id)).toBe('위치 자료 미등록');
    });
  });

  it('places all 219 nodes through the same geographic projection as physical geometry', () => {
    expect(territories).toHaveLength(219);
    territories.forEach((territory) => {
      const theater = territory.theater ?? 'europe';
      const coordinate = getTerritoryGeography(territory.id)!;
      const point = getGeographicMapPlacement(theater, territory)!;
      expect(point, territory.id).toEqual({ ...projectGeographicPoint(theater, coordinate), frame: 'main' });
      const recovered = unprojectGeographicPoint(theater, point);
      expect(recovered.latitude, territory.id).toBeCloseTo(coordinate.latitude, 8);
      expect(recovered.longitude, territory.id).toBeCloseTo(coordinate.longitude, 8);
      expect(point.x, territory.id).toBeGreaterThanOrEqual(0);
      expect(point.x, territory.id).toBeLessThanOrEqual(1200);
      expect(point.y, territory.id).toBeGreaterThanOrEqual(0);
      expect(point.y, territory.id).toBeLessThanOrEqual(760);
    });
  });

  it('ignores obsolete screen coordinates and leaves archive placements independent', () => {
    ['britain', 'korea', 'japan_home', 'midway', 'hawaii'].forEach((id) => {
      const territory = territories.find((candidate) => candidate.id === id)!;
      const theater = territory.theater ?? 'europe';
      const playPoint = getGeographicMapPlacement(theater, territory)!;
      const changedLegacyPixels = { ...territory, x: -99999, y: Number.NaN };
      expect(getGeographicMapPlacement(theater, changedLegacyPixels)).toEqual(playPoint);
      const archivePoint = getHistoricalMapPlacement(theater, territory);
      expect(Math.hypot(playPoint.x - archivePoint.x, playPoint.y - archivePoint.y), id).toBeGreaterThan(1);
      expect(playPoint.frame, id).toBe('main');
    });
    const hawaii = territories.find(({ id }) => id === 'hawaii')!;
    expect(getHistoricalMapPlacement('asia', hawaii).frame).toBe('pacific-inset');
    expect(getGeographicMapPlacement('asia', hawaii)!.frame).toBe('main');
  });

  it('keeps Pacific islands ordered on one map across signed longitudes', () => {
    const point = (id: string) => getGeographicMapPlacement('asia', { id })!;
    expect(point('attu').x).toBeLessThan(point('kiska').x);
    expect(point('kiska').x).toBeLessThan(point('dutch_harbor').x);
    expect(point('guam').x).toBeLessThan(point('wake').x);
    expect(point('wake').x).toBeLessThan(point('hawaii').x);
    expect(point('attu').y).toBeLessThan(point('midway').y);
    expect(point('midway').y).toBeLessThan(point('tarawa').y);
  });

  it('shows geographic coordinates with hemisphere labels, not projected or archive units', () => {
    expect(formatTerritoryCoordinates('korea')).toBe('37.57°N · 127.00°E');
    expect(formatTerritoryCoordinates('britain')).toBe('51.50°N · 0.12°W');
    expect(formatTerritoryCoordinates('hawaii')).toBe('21.36°N · 157.96°W');
    expect(formatTerritoryCoordinates('brisbane')).toBe('27.45°S · 153.03°E');
  });
});
