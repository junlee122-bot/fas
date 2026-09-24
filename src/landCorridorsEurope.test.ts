import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { projectGeographicPoint } from './geographicProjection';
import { getGeographicConnectionPath } from './geographicRoutes';
import { coreLandCorridors, getLandCorridorWaypoints } from './landCorridors';
import { europeanLandCorridors } from './landCorridorsEurope';
import { classifyMapRoute } from './mapRoutes';
import { getTerritoryGeography } from './territoryGeography';

const pairs = Object.keys(europeanLandCorridors).map((key) => key.split('|'));
const pathPoints = (path: string) => [...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)]
  .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));

describe('European mainland display corridors', () => {
  it('owns 31 mainland pairs without rewriting the original 28 corridors or inventing a Hoy land bridge', () => {
    expect(pairs).toHaveLength(31);
    expect(Object.keys(coreLandCorridors)).toHaveLength(28);
    for (const [from, to] of pairs) {
      expect(coreLandCorridors[`${from}|${to}`]).toBeUndefined();
      expect(coreLandCorridors[`${to}|${from}`]).toBeUndefined();
      expect(europeanLandCorridors[`${to}|${from}`]).toBeUndefined();
    }
    expect(getLandCorridorWaypoints('britain', 'scotland')).toEqual([]);
    expect(getLandCorridorWaypoints('liverpool', 'scotland')).toEqual([]);
  });

  it.each(pairs)('renders %s ↔ %s with unchanged city endpoints and symmetric, finite mainland geometry', (fromId, toId) => {
    const from = territories.find((territory) => territory.id === fromId)!;
    const to = territories.find((territory) => territory.id === toId)!;
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    expect(classifyMapRoute(from, to).kind).toBe('land');
    const waypoints = getLandCorridorWaypoints(fromId, toId);
    expect(waypoints.length).toBeGreaterThanOrEqual(2);
    expect(getLandCorridorWaypoints(toId, fromId)).toEqual([...waypoints].reverse());
    for (const point of waypoints) {
      expect(Number.isFinite(point.latitude)).toBe(true);
      expect(Number.isFinite(point.longitude)).toBe(true);
      expect(point.latitude).toBeGreaterThanOrEqual(23);
      expect(point.latitude).toBeLessThanOrEqual(73);
      expect(point.longitude).toBeGreaterThanOrEqual(-30);
      expect(point.longitude).toBeLessThanOrEqual(65);
    }
    const forward = getGeographicConnectionPath('europe', from, to, 'land')!;
    const reverse = getGeographicConnectionPath('europe', to, from, 'land')!;
    const points = pathPoints(forward.path);
    expect(points).toHaveLength(waypoints.length + 2);
    expect(pathPoints(reverse.path)).toEqual([...points].reverse());
    expect(forward.approximate).toBe(true);
    expect(forward.accessPath).toBeUndefined();
    for (const [actual, id] of [[points[0], fromId], [points.at(-1)!, toId]] as const) {
      const projected = projectGeographicPoint('europe', getTerritoryGeography(id)!);
      expect(actual.x).toBeCloseTo(projected.x, 2);
      expect(actual.y).toBeCloseTo(projected.y, 2);
    }
  });

  it('uses Perekop for every Crimea approach, and the inland Bug crossing for Odesa/Kyiv', () => {
    for (const to of ['odessa', 'nikolaev', 'mariupol', 'rostov', 'ukraine', 'kharkov']) {
      expect(getLandCorridorWaypoints('crimea', to)).toContainEqual({ latitude: 46.16, longitude: 33.69 });
    }
    for (const [from, to] of [['crimea', 'odessa'], ['crimea', 'ukraine'], ['nikolaev', 'odessa']]) {
      expect(getLandCorridorWaypoints(from, to)).toContainEqual({ latitude: 47.56, longitude: 31.34 });
    }
    expect(getLandCorridorWaypoints('bucharest', 'odessa')).toContainEqual({ latitude: 46.83, longitude: 29.48 });
  });

  it('reuses the northern Bothnia and Swedish inland corridors instead of fjord/coast/lake chords', () => {
    for (const to of ['narvik', 'norway']) {
      const points = getLandCorridorWaypoints('finland', to);
      expect(points).toContainEqual({ latitude: 65.85, longitude: 24.15 }); // Tornio at the head of Bothnia
      expect(points).toContainEqual({ latitude: 65.56, longitude: 25.78 }); // Oijarvi hinterland
      expect(points).toContainEqual({ latitude: 61.181, longitude: 22.692 }); // west of Finnish lake district
    }
    for (const from of ['finland', 'murmansk', 'norway']) {
      const points = getLandCorridorWaypoints(from, 'narvik');
      expect(points).toContainEqual({ latitude: 68.3, longitude: 18.85 }); // south of the Abisko lakes
      expect(points).toContainEqual({ latitude: 68.3, longitude: 17.55 }); // southern Rombaken hinterland
    }
    expect(getLandCorridorWaypoints('finland', 'murmansk')).toContainEqual({ latitude: 62.7, longitude: 33.4 }); // west of Paleozero
    expect(getLandCorridorWaypoints('archangel', 'murmansk')).toContainEqual({ latitude: 62.8, longitude: 35.8 }); // east of Onega
    expect(getLandCorridorWaypoints('archangel', 'leningrad')).toContainEqual({ latitude: 60.5, longitude: 35.4 }); // south of Svir reservoir
  });

  it('uses named inland approaches around the Channel, Ligurian coast and Alps', () => {
    expect(getLandCorridorWaypoints('marseille', 'spain')).toContainEqual({ latitude: 43.53, longitude: 5.45 }); // Aix
    expect(getLandCorridorWaypoints('brittany', 'cherbourg')).toContainEqual({ latitude: 48.112, longitude: -1.679 }); // Rennes
    expect(getLandCorridorWaypoints('liverpool', 'plymouth')).toContainEqual({ latitude: 53.39, longitude: -2.59 }); // Warrington
    expect(getLandCorridorWaypoints('po_valley', 'vienna')).toContainEqual({ latitude: 47, longitude: 11.5 }); // Brenner
    expect(getLandCorridorWaypoints('alps', 'france')).toContainEqual({ latitude: 47.42, longitude: 9.37 }); // south of Lake Constance
  });

  it('returns independent points even where regional corridors share a common approach', () => {
    const untouched = getLandCorridorWaypoints('crimea', 'rostov');
    const modified = getLandCorridorWaypoints('crimea', 'mariupol');
    modified[0].latitude = 0;
    modified.reverse();
    expect(getLandCorridorWaypoints('crimea', 'rostov')).toEqual(untouched);
    expect(getLandCorridorWaypoints('crimea', 'mariupol')[0]).toEqual({ latitude: 44.95, longitude: 34.1 });
  });
});
