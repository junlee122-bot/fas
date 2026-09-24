import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { projectGeographicPoint } from './geographicProjection';
import { getGeographicConnectionPath } from './geographicRoutes';
import { classifyMapRoute, type MapRouteKind } from './mapRoutes';
import { buildNavalRoute, resolveNavalTerritoryPoint } from './navalNavigation';
import { getTerritoryGeography } from './territoryGeography';
import { getLandCorridorWaypoints } from './landCorridors';
import { deriveMapConnections } from './mapPresentation';
import type { Territory, TheaterId } from './types';

const site = (id: string): Territory => {
  const result = territories.find((territory) => territory.id === id);
  if (!result) throw new Error(`Missing test territory: ${id}`);
  return result;
};
const commands = (path: string) => [...path.matchAll(/([ML])(-?[\d.]+),(-?[\d.]+)/g)]
  .map((match) => ({ command: match[1], x: Number(match[2]), y: Number(match[3]) }));
const expectPoint = (actual: { x: number; y: number }, expected: { x: number; y: number }) => {
  expect(actual.x).toBeCloseTo(expected.x, 2);
  expect(actual.y).toBeCloseTo(expected.y, 2);
};
const projected = (theater: TheaterId, latitude: number, longitude: number) => projectGeographicPoint(theater, { latitude, longitude });
const expectWaypoint = (path: string, theater: TheaterId, latitude: number, longitude: number) => {
  const expected = projected(theater, latitude, longitude);
  expect(commands(path).some((point) => Math.abs(point.x - expected.x) < .001 && Math.abs(point.y - expected.y) < .001)).toBe(true);
};

describe('geographic route rendering adapter', () => {
  it.each(['balkans', 'sofia'])('separates the Bosphorus crossing from the inland access to %s', (target) => {
    const from = site('anatolia'), to = site(target);
    expect(classifyMapRoute(from, to).kind).toBe('sea-crossing');
    const forward = getGeographicConnectionPath('europe', from, to, 'sea-crossing')!;
    const reverse = getGeographicConnectionPath('europe', to, from, 'sea-crossing')!;
    const points = commands(forward.path);
    expect(points).toHaveLength(2);
    expect(forward.accessPath).toBeTruthy();
    expect(forward.description).toContain('내륙 도시에 엔진 항구를 생성하지 않습니다');
    expectPoint(points[0], projected('europe', 41.026, 29.015));
    expectPoint(points[1], projected('europe', 41.041, 29.003));
    expect(points.map(({ x, y }) => ({ x, y }))).toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
    const access = commands(forward.accessPath!);
    expect(access.filter((point) => point.command === 'M')).toHaveLength(2);
    expectPoint(access[0], projectGeographicPoint('europe', getTerritoryGeography(from.id)!));
    expectPoint(access.at(-1)!, projectGeographicPoint('europe', getTerritoryGeography(to.id)!));
    expect(resolveNavalTerritoryPoint(from.id)).toBeNull();
    expect(resolveNavalTerritoryPoint(to.id)).toBeNull();
  });
  it('covers every existing connection except genuinely coincident city anchors', () => {
    const connections = deriveMapConnections(territories);
    expect(connections.length).toBeGreaterThan(500);
    connections.forEach(({ from, to, routeKind }) => {
      const geometry = getGeographicConnectionPath(from.theater ?? 'europe', from, to, routeKind);
      if (geometry) expect(geometry.path).not.toMatch(/NaN|Infinity/);
      else expect(getTerritoryGeography(from.id), `${from.id} → ${to.id}`).toMatchObject({
        latitude: getTerritoryGeography(to.id)!.latitude,
        longitude: getTerritoryGeography(to.id)!.longitude,
      });
    });
  });

  it.each([['channel', 'france', '르아브르'], ['morocco', 'spain', '알헤시라스']])('keeps %s → %s visible using an explicit regional coastal approach', (from, to, name) => {
    const result = getGeographicConnectionPath('europe', site(from), site(to), 'sea-crossing')!;
    expect(result.description).toContain(name);
    expect(result.accessPath).toBeTruthy();
    expect(resolveNavalTerritoryPoint(to)).toBeNull(); // no engine harbor invented
  });
  it('uses catalog geography rather than legacy pixels for both land endpoints', () => {
    const from = { ...site('france'), x: -9999, y: -9999 };
    const to = { ...site('germany'), x: 9999, y: 9999 };
    const result = getGeographicConnectionPath('europe', from, to, 'land')!;
    const points = commands(result.path);
    expect(points).toHaveLength(2);
    expectPoint(points[0], projectGeographicPoint('europe', getTerritoryGeography(from.id)!));
    expectPoint(points[1], projectGeographicPoint('europe', getTerritoryGeography(to.id)!));
    expect(result).toMatchObject({ approximate: true });
    expect(result.description).toContain('실제 도로 경로가 아닙니다');
    expect(result.accessPath).toBeUndefined();
  });

  it('fails closed for absent geography, missing naval anchors, invalid kinds, and self-links', () => {
    const unknown = { ...site('britain'), id: 'unregistered-coordinate', x: 20, y: 30 };
    expect(getGeographicConnectionPath('europe', unknown, site('calais'), 'sea')).toBeNull();
    expect(getGeographicConnectionPath('europe', site('calais'), unknown, 'land')).toBeNull();
    expect(resolveNavalTerritoryPoint('moscow')).toBeNull();
    expect(getGeographicConnectionPath('europe', site('france'), site('moscow'), 'sea')).toBeNull();
    expect(getGeographicConnectionPath('europe', site('britain'), site('calais'), 'teleport' as MapRouteKind)).toBeNull();
    expect(getGeographicConnectionPath('europe', site('britain'), site('britain'), 'land')).toBeNull();
  });

  it('keeps city-to-harbor access out of the maritime stroke and names the distinction', () => {
    const from = site('britain');
    const to = site('italy');
    const result = getGeographicConnectionPath('europe', from, to, 'sea-crossing')!;
    const points = commands(result.path);
    const sourcePort = resolveNavalTerritoryPoint(from.id)!;
    const targetPort = resolveNavalTerritoryPoint(to.id)!;
    expectPoint(points[0], projectGeographicPoint('europe', sourcePort));
    expectPoint(points.at(-1)!, projectGeographicPoint('europe', targetPort));
    expect(result.accessPath).toBeTruthy();
    const access = commands(result.accessPath!);
    expectPoint(access[0], projectGeographicPoint('europe', getTerritoryGeography(from.id)!));
    expectPoint(access.at(-1)!, projectGeographicPoint('europe', getTerritoryGeography(to.id)!));
    expect(result.description).toContain('근사 해상 전략 회랑');
    expect(result.description).toContain('실제 해상 이동 구간이 아닙니다');
    expect(result.description).toContain('완전한 육지 충돌 회피를 보장하지 않습니다');
  });

  it.each([
    ['europe', 'germany', 'denmark', '함부르크'],
    ['asia', 'bangkok', 'penang', '차오프라야'],
  ] as const)('keeps %s %s → %s visible through display-only coastal access', (theater, from, to, name) => {
    const forward = getGeographicConnectionPath(theater, site(from), site(to), 'sea-crossing')!;
    const reverse = getGeographicConnectionPath(theater, site(to), site(from), 'sea-crossing')!;
    expect(forward.description).toContain(name);
    expect(forward.accessPath).toBeTruthy();
    expect(resolveNavalTerritoryPoint(from)).toBeNull();
    expect(commands(forward.path).map(({ x, y }) => ({ x, y })))
      .toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
  });

  it.each([
    ['asia', 'calcutta', 'madras'], ['asia', 'bangkok', 'malaya'], ['asia', 'burma', 'india'],
    ['asia', 'busan', 'dalian'], ['asia', 'dalian', 'pyongyang'], ['asia', 'darwin', 'townsville'],
    ['europe', 'libya', 'tunisia'], ['europe', 'baku', 'tehran'], ['europe', 'bucharest', 'crimea'],
  ] as const)('renders the authored %s mainland corridor %s → %s without changing its endpoints or route domain', (theater, from, to) => {
    const classification = classifyMapRoute(site(from), site(to));
    const forward = getGeographicConnectionPath(theater, site(from), site(to), 'land')!;
    const reverse = getGeographicConnectionPath(theater, site(to), site(from), 'land')!;
    const points = commands(forward.path);
    expectPoint(points[0], projectGeographicPoint(theater, getTerritoryGeography(from)!));
    expectPoint(points.at(-1)!, projectGeographicPoint(theater, getTerritoryGeography(to)!));
    for (const hint of getLandCorridorWaypoints(from, to)) expectWaypoint(forward.path, theater, hint.latitude, hint.longitude);
    expect(points.map(({ x, y }) => ({ x, y }))).toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
    expect(forward.description).toContain('실제 도로 경로가 아닙니다');
    expect(forward.description).toContain('육상 이동 시간 계산과의 일치를 보장하지 않습니다');
    expect(classifyMapRoute(site(from), site(to))).toEqual(classification);
  });

  it('keeps Pacific routes continuous across the date line without a world-spanning chord', () => {
    const result = getGeographicConnectionPath('asia', site('japan_home'), site('hawaii'), 'sea-crossing')!;
    const points = commands(result.path);
    expect(points.length).toBeGreaterThan(4);
    expect(points.filter((point) => point.command === 'M')).toHaveLength(1);
    const source = projectGeographicPoint('asia', resolveNavalTerritoryPoint('japan_home')!);
    const target = projectGeographicPoint('asia', resolveNavalTerritoryPoint('hawaii')!);
    expectPoint(points[0], source);
    expectPoint(points.at(-1)!, target);
    expect(target.x).toBeGreaterThan(source.x);
    const degreeWidth = Math.abs(projected('asia', 0, 1).x - projected('asia', 0, 0).x);
    points.slice(1).forEach((point, index) => expect(Math.abs(point.x - points[index].x)).toBeLessThan(degreeWidth * 90));
  });

  it('splits at a projection wrap rather than connecting opposite map edges', () => {
    const result = getGeographicConnectionPath('europe', site('japan_home'), site('hawaii'), 'sea-crossing')!;
    const points = commands(result.path);
    expect(points.filter((point) => point.command === 'M')).toHaveLength(2);
    const halfWorldWidth = Math.abs(projected('europe', 0, 1).x - projected('europe', 0, 0).x) * 180;
    points.slice(1).forEach((point, index) => {
      if (point.command === 'L') expect(Math.abs(point.x - points[index].x)).toBeLessThanOrEqual(halfWorldWidth + .001);
    });
  });

  it('retains named ocean waypoints instead of drawing one inter-basin chord', () => {
    const result = getGeographicConnectionPath('europe', site('liverpool'), site('algiers'), 'sea')!;
    const points = commands(result.path);
    for (const [latitude, longitude] of [[46, -9], [35.9, -5.7], [38, 4]]) {
      const expected = projected('europe', latitude, longitude);
      expect(points.some((point) => Math.abs(point.x - expected.x) < .001 && Math.abs(point.y - expected.y) < .001)).toBe(true);
    }
  });

  it('draws the exact same refined waypoints used by the engine around Italy', () => {
    const from = site('naples');
    const to = site('taranto');
    const engineRoute = buildNavalRoute(resolveNavalTerritoryPoint(from.id)!, resolveNavalTerritoryPoint(to.id)!);
    expect(engineRoute.length).toBeGreaterThan(6);
    const snapshot = JSON.stringify(engineRoute);
    const forward = getGeographicConnectionPath('europe', from, to, 'sea-crossing')!;
    const reverse = getGeographicConnectionPath('europe', to, from, 'sea-crossing')!;
    const points = commands(forward.path);
    expect(points).toHaveLength(engineRoute.length);
    points.forEach((point, index) => expectPoint(point, projectGeographicPoint('europe', engineRoute[index])));
    expect(points.length).toBeGreaterThan(6);
    expect(points.map(({ x, y }) => ({ x, y }))).toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
    const southSicily = projected('europe', 35, 14);
    expect(points.some((point) => Math.abs(point.x - southSicily.x) < .001 && Math.abs(point.y - southSicily.y) < .001)).toBe(true);
    expect(JSON.stringify(buildNavalRoute(resolveNavalTerritoryPoint(from.id)!, resolveNavalTerritoryPoint(to.id)!))).toBe(snapshot);
  });

  it('uses the shared sea hub for same-basin endpoints', () => {
    const result = getGeographicConnectionPath('europe', site('netherlands'), site('hamburg'), 'sea')!;
    const points = commands(result.path);
    expect(points).toHaveLength(3);
    expectPoint(points[1], projected('europe', 57, 2));
  });

  it.each(['north_china', 'tianjin', 'dalian'])('takes the mainland approach from Korea to %s in both directions', (target) => {
    const from = site('korea');
    const to = site(target);
    const classification = classifyMapRoute(from, to);
    const forward = getGeographicConnectionPath('asia', from, to, 'land')!;
    const reverse = getGeographicConnectionPath('asia', to, from, 'land')!;
    const points = commands(forward.path);
    expectWaypoint(forward.path, 'asia', 40.13, 124.4); // Dandong
    expectWaypoint(forward.path, 'asia', 41.805, 123.432); // Shenyang
    if (target !== 'dalian') expectWaypoint(forward.path, 'asia', 40.03, 119.75); // Shanhaiguan
    else {
      expectWaypoint(forward.path, 'asia', 39.35, 122.15); // inland of Pulandian Bay
      expectWaypoint(forward.path, 'asia', 38.9, 121.55); // south of Dalian Bay
    }
    expectPoint(points[0], projectGeographicPoint('asia', getTerritoryGeography(from.id)!));
    expectPoint(points.at(-1)!, projectGeographicPoint('asia', getTerritoryGeography(to.id)!));
    expect(points.map(({ x, y }) => ({ x, y }))).toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
    expect(forward.approximate).toBe(true);
    expect(forward.description).toContain('근사 회랑');
    expect(classifyMapRoute(from, to)).toEqual(classification);
  });

  it('covers every current selected-Korea connection without changing its route domain', () => {
    const origin = site('korea');
    expect(origin.neighbors).toEqual(['busan', 'harbin', 'japan_home', 'manchuria', 'north_china', 'pyongyang', 'sinuiju']);
    origin.neighbors.forEach((id) => {
      const target = site(id);
      const classification = classifyMapRoute(origin, target);
      const route = getGeographicConnectionPath('asia', origin, target, classification.kind);
      expect(route, id).not.toBeNull();
      expect(route!.description, id).toContain(classification.kind === 'land' ? '육상 연결' : '해상 전략 회랑');
    });
    ['manchuria', 'harbin', 'sinuiju'].forEach((id) => {
      const route = getGeographicConnectionPath('asia', origin, site(id), 'land')!;
      expectWaypoint(route.path, 'asia', 39.62, 125.66); // inland of Korea Bay
    });
  });

  it('takes the western Kyushu and Osumi passages in both directions without changing engine routing', () => {
    const from = site('korea');
    const to = site('japan_home');
    const engineBefore = JSON.stringify(buildNavalRoute(resolveNavalTerritoryPoint(from.id)!, resolveNavalTerritoryPoint(to.id)!));
    const forward = getGeographicConnectionPath('asia', from, to, 'sea-crossing')!;
    const reverse = getGeographicConnectionPath('asia', to, from, 'sea-crossing')!;
    for (const [latitude, longitude] of [[33.7, 128.5], [32.4, 128.2], [30.88, 130.82], [30.3, 131.4]]) {
      expectWaypoint(forward.path, 'asia', latitude, longitude);
    }
    expect(commands(forward.path).map(({ x, y }) => ({ x, y })))
      .toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
    expect(JSON.stringify(buildNavalRoute(resolveNavalTerritoryPoint(from.id)!, resolveNavalTerritoryPoint(to.id)!))).toBe(engineBefore);
  });

  it('keeps the Vladivostok approach offshore from the Korean peninsula', () => {
    const result = getGeographicConnectionPath('asia', site('soviet_far_east'), site('korea'), 'sea')!;
    expectWaypoint(result.path, 'asia', 43.09, 131.89);
    expectWaypoint(result.path, 'asia', 43.06, 132.02);
    expectWaypoint(result.path, 'asia', 42.6, 132.4);
    expectWaypoint(result.path, 'asia', 38.5, 131.5);
    expectWaypoint(result.path, 'asia', 36, 130.5);
    const reverse = getGeographicConnectionPath('asia', site('korea'), site('soviet_far_east'), 'sea')!;
    expect(commands(result.path).map(({ x, y }) => ({ x, y })))
      .toEqual(commands(reverse.path).map(({ x, y }) => ({ x, y })).reverse());
  });

  it.each([
    ['europe', 'hamburg', 'east_prussia', 55.6, 12.75],
    ['europe', 'denmark', 'east_prussia', 55.6, 12.75],
    ['asia', 'penang', 'singapore', 1.1, 103.6],
  ] as const)('adds the authored passage hint for %s %s → %s', (theater, from, to, latitude, longitude) => {
    const result = getGeographicConnectionPath(theater, site(from), site(to), 'sea')!;
    const expected = projected(theater, latitude, longitude);
    expect(commands(result.path).some((point) => Math.abs(point.x - expected.x) < .001 && Math.abs(point.y - expected.y) < .001)).toBe(true);
  });
});
