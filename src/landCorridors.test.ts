import { describe, expect, it } from 'vitest';
import { coreLandCorridors, getLandCorridorWaypoints, landCorridors } from './landCorridors';
import { getTerritoryGeography } from './territoryGeography';
import { europeanLandCorridors } from './landCorridorsEurope';
import { asianLandCorridors } from './landCorridorsAsia';
import { mediterraneanLandCorridors } from './landCorridorsMediterranean';
import { territories } from './data';
import { classifyMapRoute } from './mapRoutes';

const targetedMainlandPairs = [
  ['calcutta', 'madras'], ['saigon', 'south_china'], ['libya', 'tunisia'], ['bangkok', 'malaya'],
  ['burma', 'india'], ['darwin', 'townsville'], ['indochina', 'malaya'], ['malaya', 'saigon'],
  ['busan', 'dalian'], ['burma', 'malaya'], ['tripoli', 'tunis'], ['baku', 'tehran'],
  ['manchuria', 'shandong'], ['anatolia', 'caucasus'], ['baku', 'stalingrad'], ['el_agheila', 'kasserine'],
  ['balkans', 'crimea'], ['arakan', 'calcutta'], ['bucharest', 'crimea'], ['haiphong', 'saigon'],
  ['dalian', 'pyongyang'],
] as const;

describe('audited approximate mainland display corridors', () => {
  it('merges regional catalogs without silently replacing existing routes', () => {
    const keys = [coreLandCorridors, europeanLandCorridors, asianLandCorridors, mediterraneanLandCorridors]
      .flatMap((catalog) => Object.keys(catalog));
    const undirected = keys.map((key) => key.split('|').sort().join('|'));
    expect(new Set(undirected).size).toBe(keys.length);
    expect(Object.keys(landCorridors)).toHaveLength(keys.length);
    for (const key of keys) {
      const [fromId, toId] = key.split('|');
      const from = territories.find((site) => site.id === fromId)!;
      const to = territories.find((site) => site.id === toId)!;
      expect(from, key).toBeDefined();
      expect(to, key).toBeDefined();
      // Core also retains reusable Korea display approaches for non-adjacent
      // inspection pairs; the new catalogs must cover actual graph edges.
      if (!Object.hasOwn(coreLandCorridors, key)) expect(from.neighbors, key).toContain(toId);
      expect(classifyMapRoute(from, to).kind, key).toBe('land');
    }
  });
  it.each(targetedMainlandPairs)('supplies reversible control points for %s ↔ %s', (from, to) => {
    const forward = getLandCorridorWaypoints(from, to);
    const reverse = getLandCorridorWaypoints(to, from);
    expect(forward.length).toBeGreaterThan(2);
    expect(reverse).toEqual([...forward].reverse());
    expect(getTerritoryGeography(from)).toBeDefined();
    expect(getTerritoryGeography(to)).toBeDefined();
  });

  it('keeps every catalog point finite and within valid WGS84 bounds', () => {
    expect(Object.keys(coreLandCorridors)).toHaveLength(28);
    for (const [key, points] of Object.entries(landCorridors)) {
      const [from, to] = key.split('|');
      expect(landCorridors[`${to}|${from}`], `duplicate orientation ${key}`).toBeUndefined();
      for (const point of points) {
        expect(Number.isFinite(point.latitude), key).toBe(true);
        expect(Number.isFinite(point.longitude), key).toBe(true);
        expect(Math.abs(point.latitude), key).toBeLessThanOrEqual(90);
        expect(Math.abs(point.longitude), key).toBeLessThanOrEqual(180);
      }
    }
  });

  it('preserves the original Korean north approach and reuses it for Busan/Dalian/Pyongyang', () => {
    const north = getLandCorridorWaypoints('korea', 'manchuria');
    expect(north).toEqual([
      { latitude: 39.021, longitude: 125.753 }, { latitude: 39.62, longitude: 125.66 },
      { latitude: 40.086, longitude: 124.421 }, { latitude: 40.13, longitude: 124.4 },
      { latitude: 40.45, longitude: 124.07 },
    ]);
    const koreaDalian = getLandCorridorWaypoints('korea', 'dalian');
    expect(getLandCorridorWaypoints('busan', 'dalian').slice(3)).toEqual(koreaDalian);
    expect(getLandCorridorWaypoints('pyongyang', 'dalian')).toEqual(koreaDalian.slice(1));
    expect(getLandCorridorWaypoints('korea', 'pyongyang')).toEqual([{ latitude: 37.97, longitude: 126.56 }]);
  });

  it('uses the same Thai peninsula detour for four mainland approaches', () => {
    const peninsula = getLandCorridorWaypoints('bangkok', 'malaya');
    for (const from of ['indochina', 'saigon', 'burma']) {
      expect(getLandCorridorWaypoints(from, 'malaya').slice(-peninsula.length)).toEqual(peninsula);
    }
    expect(peninsula).toContainEqual({ latitude: 9.5, longitude: 98.8 }); // west of Bandon Bay
    expect(peninsula).toContainEqual({ latitude: 7.6, longitude: 99.85 }); // west of Songkhla lagoon
  });

  it('goes north of Bohai and through Perekop rather than crossing those seas', () => {
    expect(getLandCorridorWaypoints('manchuria', 'shandong')).toContainEqual({ latitude: 40.03, longitude: 119.75 });
    for (const from of ['balkans', 'bucharest']) {
      expect(getLandCorridorWaypoints(from, 'crimea')).toContainEqual({ latitude: 46.16, longitude: 33.69 });
    }
  });

  it('returns independent copies and does not invent hints for unsupported/self/island routes', () => {
    const points = getLandCorridorWaypoints('bangkok', 'malaya');
    const snapshot = structuredClone(points);
    points[0].latitude = 0; points.reverse(); points.pop();
    expect(getLandCorridorWaypoints('bangkok', 'malaya')).toEqual(snapshot);
    expect(getLandCorridorWaypoints('missing', 'malaya')).toEqual([]);
    expect(getLandCorridorWaypoints('korea', 'korea')).toEqual([]);
    expect(getLandCorridorWaypoints('bangkok', 'penang')).toEqual([]);
    expect(getLandCorridorWaypoints('germany', 'denmark')).toEqual([]);
  });
});
