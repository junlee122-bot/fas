import { describe, expect, it } from 'vitest';
import { getStraitCrossing, STRAIT_CROSSINGS } from './straitCrossings';
import { MAP_WATER_CROSSINGS, validateLandRoute } from './mapRoutes';
import { territories } from './data';

describe('Bosphorus strategic crossing metadata', () => {
  it.each(Object.keys(STRAIT_CROSSINGS))('registers %s as water and reverses both access legs', (key) => {
    const [fromId, toId] = key.split('|');
    expect(MAP_WATER_CROSSINGS).toContainEqual([fromId, toId]);
    const forward = getStraitCrossing(fromId, toId)!;
    const reverse = getStraitCrossing(toId, fromId)!;
    expect(reverse.water).toEqual([...forward.water].reverse());
    expect(reverse.fromAccess).toEqual([...forward.toAccess].reverse());
    expect(reverse.toAccess).toEqual([...forward.fromAccess].reverse());
    expect(forward.fromAccess.at(-1)).toEqual(forward.water[0]);
    expect(forward.toAccess[0]).toEqual(forward.water.at(-1));
    const from = territories.find((site) => site.id === fromId)!;
    const to = territories.find((site) => site.id === toId)!;
    expect(validateLandRoute(from, to)).toMatchObject({ allowed: false, code: 'sea-crossing' });
    expect(validateLandRoute(from, to).reason).toContain('내륙 도시에서 바로 승선할 수도 없습니다');
  });
  it('returns owned coordinates and ignores absent/self keys', () => {
    const first = getStraitCrossing('anatolia', 'sofia')!;
    const snapshot = structuredClone(first);
    first.water[0].latitude = 0;
    first.fromAccess.reverse();
    first.toAccess[0].longitude = 0;
    expect(getStraitCrossing('anatolia', 'sofia')).toEqual(snapshot);
    expect(getStraitCrossing('anatolia', 'anatolia')).toBeUndefined();
    expect(getStraitCrossing('constructor', 'toString')).toBeUndefined();
  });
});
