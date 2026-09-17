import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { projectGeographicPoint } from './geographicProjection';
import { getGeographicConnectionPath } from './geographicRoutes';
import { coreLandCorridors, getLandCorridorWaypoints } from './landCorridors';
import { mediterraneanLandCorridors } from './landCorridorsMediterranean';
import { deriveMapConnections } from './mapPresentation';
import { classifyMapRoute } from './mapRoutes';
import { getTerritoryGeography } from './territoryGeography';

const pairs = [
  ['beirut', 'suez'], ['anatolia', 'beirut'], ['libya', 'tobruk'], ['egypt', 'libya'],
  ['anatolia', 'levant'], ['balkans', 'italy'], ['egypt', 'levant'], ['cairo', 'levant'],
  ['el_agheila', 'tripoli'], ['casablanca', 'oran'], ['levant', 'suez'], ['messina', 'sicily'],
  ['libya', 'tripoli'], ['balkans', 'greece'], ['caucasus', 'tehran'], ['belgrade', 'greece'],
  ['greece', 'sofia'], ['alexandria', 'el_alamein'], ['el_alamein', 'tobruk'], ['egypt', 'tobruk'],
  ['el_agheila', 'libya'], ['caucasus', 'ukraine'], ['cairo', 'jerusalem'], ['italy', 'naples'],
  ['algiers', 'oran'], ['el_agheila', 'tobruk'], ['greece', 'sarajevo'], ['baghdad', 'basra'],
] as const;
const site = (id: string) => {
  const territory = territories.find((item) => item.id === id);
  if (!territory) throw new Error(`Missing territory ${id}`);
  return territory;
};
const pathPoints = (path: string) => [...path.matchAll(/([ML])(-?[\d.]+),(-?[\d.]+)/g)]
  .map((match) => ({ x: Number(match[2]), y: Number(match[3]) }));

describe('Mediterranean, North African and Middle Eastern mainland display corridors', () => {
  it('adds exactly the audited 28 strategic relationships without overwriting the core catalog', () => {
    expect(Object.keys(mediterraneanLandCorridors)).toHaveLength(pairs.length);
    const connections = deriveMapConnections(territories);
    for (const [from, to] of pairs) {
      expect(mediterraneanLandCorridors[`${from}|${to}`]).toBeDefined();
      expect(mediterraneanLandCorridors[`${to}|${from}`]).toBeUndefined();
      expect(coreLandCorridors[`${from}|${to}`]).toBeUndefined();
      expect(coreLandCorridors[`${to}|${from}`]).toBeUndefined();
      expect(connections.some((edge) => edge.from.id === from && edge.to.id === to && edge.routeKind === 'land')).toBe(true);
    }
  });

  it.each(pairs)('renders %s ↔ %s symmetrically, retaining both original city anchors and its land domain', (fromId, toId) => {
    const from = site(fromId), to = site(toId);
    const sourceBefore = structuredClone(from), targetBefore = structuredClone(to);
    const classification = classifyMapRoute(from, to);
    const forward = getGeographicConnectionPath('europe', from, to, 'land')!;
    const reverse = getGeographicConnectionPath('europe', to, from, 'land')!;
    const points = pathPoints(forward.path);
    const expected = [getTerritoryGeography(fromId)!, ...getLandCorridorWaypoints(fromId, toId), getTerritoryGeography(toId)!]
      .map((point) => projectGeographicPoint('europe', point));
    expect(points).toEqual(pathPoints(reverse.path).reverse());
    expect(points).toHaveLength(expected.length);
    points.forEach((point, index) => {
      expect(point.x).toBeCloseTo(expected[index].x, 2);
      expect(point.y).toBeCloseTo(expected[index].y, 2);
    });
    expect(forward.approximate).toBe(true);
    expect(forward.description).toContain('실제 도로 경로가 아닙니다');
    expect(forward.accessPath).toBeUndefined();
    expect(classifyMapRoute(from, to)).toEqual(classification);
    expect(from).toEqual(sourceBefore);
    expect(to).toEqual(targetBefore);
  });

  it('takes the Gulf of Sidra and the Gulf of Sollum on their inland side, reusing consistent approaches', () => {
    const sirteApproach = getLandCorridorWaypoints('el_agheila', 'libya');
    expect(sirteApproach).toContainEqual({ latitude: 30.4, longitude: 17.5 });
    for (const [from, to] of [['libya', 'tobruk'], ['egypt', 'libya'], ['el_agheila', 'tobruk']]) {
      expect(getLandCorridorWaypoints(from, to)).toContainEqual({ latitude: 30.35, longitude: 20.03 });
    }
    for (const [from, to] of [['el_alamein', 'tobruk'], ['egypt', 'tobruk'], ['egypt', 'libya']]) {
      expect(getLandCorridorWaypoints(from, to)).toContainEqual({ latitude: 31.28, longitude: 25.4 });
    }
  });

  it('does not turn the Messina-to-Palermo island route into a crossing of the Strait of Messina', () => {
    const points = getLandCorridorWaypoints('messina', 'sicily');
    expect(points.every((point) => point.longitude < 15.55 && point.longitude > 13.3)).toBe(true);
    expect(points).toContainEqual({ latitude: 37.933, longitude: 14.086 }); // Castelbuono
    expect(points).toContainEqual({ latitude: 37.93, longitude: 13.66 }); // Caccamo, not Termini Bay
  });

  it('goes around the Adriatic and Greek gulfs instead of using open-water chords', () => {
    expect(getLandCorridorWaypoints('balkans', 'italy')).toContainEqual({ latitude: 46.05, longitude: 14.5 });
    for (const from of ['balkans', 'belgrade', 'sofia', 'sarajevo']) {
      const path = getLandCorridorWaypoints(from, 'greece');
      expect(path).toContainEqual({ latitude: 40.52, longitude: 22.2 }); // Veria
      expect(path).toContainEqual({ latitude: 38.92, longitude: 22.44 }); // Lamia
    }
  });

  it('uses inland Sinai, western Bitter Lakes and southern Hammar marsh approaches without moving Suez or Basra', () => {
    for (const from of ['beirut', 'levant']) {
      const points = getLandCorridorWaypoints('suez', from);
      expect(points).toContainEqual({ latitude: 30.33, longitude: 32.1 });
      expect(points).toContainEqual({ latitude: 30.85, longitude: 32.3 });
      expect(points).toContainEqual({ latitude: 31.25, longitude: 34.79 });
    }
    expect(getLandCorridorWaypoints('baghdad', 'basra')).toContainEqual({ latitude: 30.45, longitude: 47 });
    expect(getTerritoryGeography('suez')).toMatchObject({ latitude: 29.974, longitude: 32.549 });
    expect(getTerritoryGeography('basra')).toMatchObject({ latitude: 30.515, longitude: 47.812 });
  });

  it('keeps the Cairo and Egypt aliases geometrically equal and leaves Bosphorus domain decisions out of this catalog', () => {
    expect(getLandCorridorWaypoints('cairo', 'levant')).toEqual(getLandCorridorWaypoints('egypt', 'levant'));
    expect(mediterraneanLandCorridors['anatolia|balkans']).toBeUndefined();
    expect(mediterraneanLandCorridors['anatolia|sofia']).toBeUndefined();
    for (const points of Object.values(mediterraneanLandCorridors)) {
      expect(points.length).toBeGreaterThan(1);
      for (const point of points) {
        expect(Number.isFinite(point.latitude) && Number.isFinite(point.longitude)).toBe(true);
        expect(point.latitude).toBeGreaterThan(29);
        expect(point.latitude).toBeLessThan(51);
        expect(point.longitude).toBeGreaterThan(-8);
        expect(point.longitude).toBeLessThan(52);
      }
    }
  });
});
