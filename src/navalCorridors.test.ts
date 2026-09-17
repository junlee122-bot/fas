import { describe, expect, it } from 'vitest';
import { NAVAL_ROUTE_GEOMETRY_VERSION, refineNavalLeg } from './navalCorridors';
import type { NavalWaypoint } from './navalNavigation';

const hub = (id: string, latitude: number, longitude: number): NavalWaypoint => ({ id, name: id, latitude, longitude, basin: id });
const port = (id: string, latitude: number, longitude: number, basin: string): NavalWaypoint => ({ id, name: id, latitude, longitude, basin, territoryId: id });
const hasPoint = (route: NavalWaypoint[], latitude: number, longitude: number) => route.some((point) => point.latitude === latitude && point.longitude === longitude);

describe('shared physical naval leg corridors', () => {
  it('declares a geometry version for route-cache/save migration', () => {
    expect(NAVAL_ROUTE_GEOMETRY_VERSION).toBe(3);
  });

  it('retains original endpoint objects and creates neutral stable intermediate waypoints', () => {
    const from = port('naples', 40.8, 14.3, 'sicily');
    const to = hub('sicily', 35, 14);
    const before = JSON.stringify([from, to]);
    const route = refineNavalLeg(from, to);
    expect(route[0]).toBe(from);
    expect(route.at(-1)).toBe(to);
    expect(route.length).toBeGreaterThan(2);
    route.slice(1, -1).forEach((point) => {
      expect(point.id).toMatch(/^corridor-v3:/);
      expect(point.territoryId).toBeUndefined();
      expect(point.basin).toBe('sicily');
    });
    expect(new Set(route.map((point) => point.id)).size).toBe(route.length);
    expect(JSON.stringify([from, to])).toBe(before);
    expect(refineNavalLeg(from, to)).toEqual(route);
    route[1].name = 'caller mutation';
    expect(refineNavalLeg(from, to)[1].name).not.toBe('caller mutation');
  });

  it('disambiguates coastal ports and ocean hubs using territoryId, accepting legacy port prefixes', () => {
    const ocean = hub('sicily', 35, 14);
    const actualPort = port('italy', 40.4, 17.2, 'sicily');
    const legacyPort = { ...actualPort, id: 'port:italy', territoryId: undefined };
    expect(refineNavalLeg(actualPort, ocean).slice(1, -1)).toEqual(refineNavalLeg(legacyPort, ocean).slice(1, -1));
    expect(refineNavalLeg({ ...actualPort, territoryId: undefined }, ocean)).toHaveLength(2);
  });

  it.each([
    [hub('northsea', 57, 2), hub('baltic', 56, 17), 55.6, 12.75],
    [hub('malacca', 3, 100), hub('singaporesea', 1.4, 104.6), 1.1, 103.6],
    [hub('japansea', 34, 130), hub('southjapan', 30, 131), 30.88, 130.82],
    [port('italy', 40.4, 17.2, 'sicily'), hub('sicily', 35, 14), 37.3, 16.8],
    [port('soviet_far_east', 43.1, 131.9, 'japansea'), hub('japansea', 34, 130), 43.06, 132.02],
    [hub('eastmed', 34, 28), hub('suez', 30.5, 32.4), 31.26, 32.31],
    [hub('suez', 30.5, 32.4), hub('redsea', 20, 38), 28.2, 33.4],
    [port('basra', 29.9, 48.5, 'arabian'), hub('arabian', 15, 63), 26.55, 56.6],
    [hub('aegean', 37, 25), hub('bosporus', 41.2, 29.1), 40.21, 26.395],
    [hub('bosporus', 41.2, 29.1), hub('blacksea', 43, 34), 41.25, 29.15],
    [port('messina', 38.2, 15.6, 'sicily'), hub('sicily', 35, 14), 38.1, 15.61],
    [port('tunis', 36.8, 10.3, 'sicily'), hub('sicily', 35, 14), 37.1, 12.6],
    [port('leningrad', 60, 29.7, 'baltic'), hub('baltic', 56, 17), 60.08, 29.2],
    [hub('panamaatlantic', 9.5, -79.95), hub('panamapacific', 8.8, -79.5), 9.27, -79.922],
    [hub('panamapacific', 8.8, -79.5), hub('eastpacific', 8, -88), 6.5, -80.2],
    [hub('eastpacific', 8, -88), hub('california', 32, -120), 22, -112],
    [hub('usatlantic', 35, -74), hub('windward', 20, -74), 21, -72.7],
  ] as const)('preserves a physical passage and exactly reverses %s → %s', (from, to, latitude, longitude) => {
    const route = refineNavalLeg(from, to);
    expect(hasPoint(route, latitude, longitude)).toBe(true);
    expect(refineNavalLeg(to, from)).toEqual([...route].reverse());
    const rebuilt = route.slice(1).flatMap((point, index) => refineNavalLeg(route[index], point).slice(index ? 1 : 0));
    expect(rebuilt).toEqual(route);
  });

  it('keeps basin transitions physical and independent of travel direction', () => {
    const route = refineNavalLeg(hub('japansea', 34, 130), hub('southjapan', 30, 131));
    expect(route.find((point) => point.latitude === 32.4)?.basin).toBe('eastchina');
    expect(route.find((point) => point.latitude === 30.88)?.basin).toBe('southjapan');
    const denmark = refineNavalLeg(hub('northsea', 57, 2), hub('baltic', 56, 17));
    expect(denmark.find((point) => point.latitude === 58)?.basin).toBe('northsea');
    expect(denmark.find((point) => point.latitude === 55.6)?.basin).toBe('baltic');
  });

  it('retains the island and cape avoidance vertices instead of collapsing them to chords', () => {
    const baltic = refineNavalLeg(hub('northsea', 57, 2), hub('baltic', 56, 17));
    expect(hasPoint(baltic, 57, 11.8)).toBe(true);
    expect(hasPoint(baltic, 55.7, 12.69)).toBe(true);
    expect(hasPoint(baltic, 54.8, 15.1)).toBe(true);
    const sicily = refineNavalLeg(hub('westmed', 38, 4), hub('sicily', 35, 14));
    expect(hasPoint(sicily, 37.1, 12.6)).toBe(true);
    expect(hasPoint(refineNavalLeg(port('taranto', 40.4, 17.2, 'sicily'), hub('sicily', 35, 14)), 38.8, 17.6)).toBe(true);
    const singapore = refineNavalLeg(hub('malacca', 3, 100), hub('singaporesea', 1.4, 104.6));
    expect(hasPoint(singapore, 1.16, 103.85)).toBe(true);
    expect(hasPoint(singapore, 1.3, 104.35)).toBe(true);
  });

  it('preserves both Turkish strait bends and the intervening Marmara passage', () => {
    const route = refineNavalLeg(hub('aegean', 37, 25), hub('bosporus', 41.2, 29.1));
    expect(hasPoint(route, 40.65, 27.25)).toBe(true);
    expect(hasPoint(route, 41.03, 28.999)).toBe(true);
    expect(hasPoint(route, 41.13, 29.08)).toBe(true);
    expect(hasPoint(route, 41.16, 29.059)).toBe(true);
    expect(route.find((point) => point.latitude === 40.02)?.basin).toBe('bosporus');
  });

  it('uses the original Panama lock alignment rather than a land-spanning chord or modern third locks', () => {
    const route = refineNavalLeg(hub('panamaatlantic', 9.5, -79.95), hub('panamapacific', 8.8, -79.5));
    for (const [latitude, longitude] of [[9.27, -79.922], [9.12, -79.68], [9.015, -79.613], [8.997, -79.592]]) {
      expect(hasPoint(route, latitude, longitude)).toBe(true);
    }
    expect(route.find((point) => point.latitude === 9.27)?.basin).toBe('panamaatlantic');
    expect(route.find((point) => point.latitude === 9.015)?.basin).toBe('panamapacific');
  });

  it('preserves unregistered graph legs but fails closed for invalid coordinates', () => {
    const from = hub('new-ocean-a', 0, 179);
    const to = hub('new-ocean-b', 0, -179);
    expect(refineNavalLeg(from, to)).toEqual([from, to]);
    expect(refineNavalLeg({ ...from, latitude: NaN }, to)).toEqual([]);
    expect(refineNavalLeg(from, { ...to, longitude: Infinity })).toEqual([]);
  });
});
