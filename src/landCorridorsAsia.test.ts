import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getGeographicConnectionPath } from './geographicRoutes';
import { projectGeographicPoint } from './geographicProjection';
import { coreLandCorridors, getLandCorridorWaypoints } from './landCorridors';
import { asianLandCorridors } from './landCorridorsAsia';
import { classifyMapRoute } from './mapRoutes';
import { getTerritoryGeography } from './territoryGeography';

const entries = Object.entries(asianLandCorridors);
const svgVertices = (path: string) => [...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)]
  .map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
const roundedProjection = (id: string) => {
  const point = projectGeographicPoint('asia', getTerritoryGeography(id)!);
  return { x: Number(point.x.toFixed(3)), y: Number(point.y.toFixed(3)) };
};

describe('Asian inland display corridors', () => {
  it('adds 38 separate corridors without replacing the original 28', () => {
    expect(entries).toHaveLength(38);
    expect(Object.keys(coreLandCorridors)).toHaveLength(28);
    const coreKeys = new Set(Object.keys(coreLandCorridors).map((key) => key.split('|').sort().join('|')));
    const asianKeys = entries.map(([key]) => key.split('|').sort().join('|'));
    expect(new Set(asianKeys).size).toBe(entries.length);
    for (const key of asianKeys) expect(coreKeys.has(key), key).toBe(false);
  });

  it.each(entries)('%s retains graph endpoints, land classification, and reversible geometry', (key, points) => {
    const [fromId, toId] = key.split('|');
    const from = territories.find((site) => site.id === fromId)!;
    const to = territories.find((site) => site.id === toId)!;
    expect(from).toBeDefined();
    expect(to).toBeDefined();
    expect(from.theater).toBe('asia');
    expect(to.theater).toBe('asia');
    expect(from.neighbors).toContain(toId);
    expect(classifyMapRoute(from, to).kind).toBe('land');
    expect(getLandCorridorWaypoints(fromId, toId)).toEqual(points);
    expect(getLandCorridorWaypoints(toId, fromId)).toEqual([...points].reverse());

    const forward = getGeographicConnectionPath('asia', from, to, 'land')!;
    const backward = getGeographicConnectionPath('asia', to, from, 'land')!;
    expect(forward.approximate).toBe(true);
    expect(forward.description).toContain('실제 도로 경로가 아닙니다');
    expect(forward.description).toContain('이동 시간 계산과의 일치를 보장하지 않습니다');
    const vertices = svgVertices(forward.path);
    expect(vertices.at(0)).toEqual(roundedProjection(fromId));
    expect(vertices.at(-1)).toEqual(roundedProjection(toId));
    expect(svgVertices(backward.path)).toEqual([...vertices].reverse());
    for (const point of points) {
      expect(Number.isFinite(point.latitude)).toBe(true);
      expect(Number.isFinite(point.longitude)).toBe(true);
      expect(Math.abs(point.latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(point.longitude)).toBeLessThanOrEqual(180);
    }
  });

  it('goes around Manila, Tokyo and Mumbai bays through named inland approaches', () => {
    expect(getLandCorridorWaypoints('bataan', 'philippines'))
      .toContainEqual({ latitude: 14.94, longitude: 120.63 }); // Lubao, north of Manila Bay
    for (const from of ['japan_home', 'nagoya']) {
      expect(getLandCorridorWaypoints(from, 'yokosuka'))
        .toContainEqual({ latitude: 35.44, longitude: 139.61 }); // Yokohama's western inland approach
    }
    expect(getLandCorridorWaypoints('bombay', 'karachi'))
      .toContainEqual({ latitude: 23.02, longitude: 72.57 }); // Ahmedabad, north of the Gulf of Khambhat
    expect(getLandCorridorWaypoints('dutch_east_indies', 'surabaya'))
      .toContainEqual({ latitude: -7.8, longitude: 110.37 }); // Yogyakarta, inland Java
  });

  it('reuses the northern Vladivostok peninsula approach without cutting its two bays', () => {
    for (const from of ['manchuria', 'mongolia', 'harbin']) {
      const points = getLandCorridorWaypoints(from, 'soviet_far_east');
      expect(points).toContainEqual({ latitude: 43.353, longitude: 132.186 }); // Artyom
      expect(points.slice(-3)).toEqual([
        { latitude: 43.323, longitude: 132.087 },
        { latitude: 43.25, longitude: 132.05 },
        { latitude: 43.19, longitude: 131.97 },
      ]);
    }
  });

  it('keeps Kowloon on the mainland and approaches Guangzhou from the eastern estuary bank', () => {
    for (const target of ['indochina', 'south_china']) {
      const points = getLandCorridorWaypoints('hong_kong', target);
      expect(points.slice(0, 4)).toEqual([
        { latitude: 22.38, longitude: 114.19 },
        { latitude: 22.49, longitude: 114.14 },
        { latitude: 22.54, longitude: 114.06 },
        { latitude: 23.02, longitude: 113.75 },
      ]);
    }
  });

  it('avoids broad Taihu, Nansi, Poyang and Buir lake shortcuts', () => {
    for (const from of ['nanjing', 'central_china', 'north_china']) {
      expect(getLandCorridorWaypoints(from, 'shanghai'))
        .toContainEqual({ latitude: 31.57, longitude: 120.3 }); // Wuxi, north of Taihu
    }
    for (const [from, to] of [['nanjing', 'shandong'], ['north_china', 'shanghai']]) {
      expect(getLandCorridorWaypoints(from, to))
        .toContainEqual({ latitude: 34.59, longitude: 117.52 }); // Hanzhuang, east of Weishan
    }
    expect(getLandCorridorWaypoints('nanchang', 'nanjing'))
      .toContainEqual({ latitude: 29.31, longitude: 115.76 }); // De'an, west of Poyang
    expect(getLandCorridorWaypoints('mongolia', 'soviet_far_east'))
      .toContainEqual({ latitude: 47.16, longitude: 115.53 }); // Matad, south of Buir
  });

  it('does not let a consumer mutate reusable catalog points', () => {
    const before = structuredClone(asianLandCorridors);
    const points = getLandCorridorWaypoints('hiroshima', 'nagoya');
    points[0].latitude = 0;
    points.pop();
    expect(asianLandCorridors).toEqual(before);
    expect(getLandCorridorWaypoints('nagoya', 'hiroshima'))
      .toEqual([...before['hiroshima|nagoya']].reverse());
  });
});
