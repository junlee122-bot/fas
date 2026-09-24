import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { getTerritoryGeography, territoryGeography } from './territoryGeography';

describe('play-map geographic anchors', () => {
  it('covers every authored playable ID without adding unrelated geographic nodes', () => {
    expect(territories).toHaveLength(219);
    expect(Object.keys(territoryGeography).sort()).toEqual(territories.map(({ id }) => id).sort());
    territories.forEach(({ id }) => {
      const point = getTerritoryGeography(id)!;
      expect(Number.isFinite(point.latitude), id).toBe(true);
      expect(Number.isFinite(point.longitude), id).toBe(true);
      expect(point.latitude, id).toBeGreaterThanOrEqual(-90);
      expect(point.latitude, id).toBeLessThanOrEqual(90);
      expect(point.longitude, id).toBeGreaterThanOrEqual(-180);
      expect(point.longitude, id).toBeLessThanOrEqual(180);
      expect(point.anchorName.trim().length, id).toBeGreaterThan(0);
      if (point.kind !== 'city') expect(point.note?.trim().length, id).toBeGreaterThan(0);
    });
  });

  it('keeps unknown or inherited object keys from becoming accidental coordinates', () => {
    ['unknown-city', '', '__proto__', 'constructor', 'toString'].forEach((id) => {
      expect(getTerritoryGeography(id)).toBeUndefined();
    });
  });

  it('locates city-labelled regions at their actual cities rather than naval aliases', () => {
    expect(getTerritoryGeography('britain')).toMatchObject({ anchorName: '런던', latitude: 51.502 });
    expect(getTerritoryGeography('norway')).toMatchObject({ anchorName: '오슬로', longitude: 10.748 });
    expect(getTerritoryGeography('china_interior')).toMatchObject({ anchorName: '충칭', longitude: 106.593 });
    expect(getTerritoryGeography('hokkaido')).toMatchObject({ anchorName: '삿포로', latitude: 43.077 });
    expect(getTerritoryGeography('osaka_kure')).toMatchObject({ anchorName: '오사카', longitude: 135.502 });
    expect(getTerritoryGeography('basra')!.latitude).toBeGreaterThan(30.4);
    expect(getTerritoryGeography('tianjin')!.latitude).toBeGreaterThan(39);
  });

  it('does not arbitrarily separate multiple existing IDs representing the same real place', () => {
    [['egypt', 'cairo'], ['levant', 'damascus'], ['mindanao', 'davao'], ['marshalls', 'kwajalein']].forEach(([a, b]) => {
      const first = getTerritoryGeography(a)!;
      const second = getTerritoryGeography(b)!;
      expect([first.latitude, first.longitude]).toEqual([second.latitude, second.longitude]);
    });
  });

  it('distinguishes true sea nodes from islands, harbors and coastal cities', () => {
    expect(Object.entries(territoryGeography).filter(([, point]) => point.kind === 'sea').map(([id]) => id).sort())
      .toEqual(['atlantic', 'channel', 'coral_sea']);
    ['midway', 'sicily', 'bataan', 'messina', 'lingayen', 'scotland'].forEach((id) => {
      expect(getTerritoryGeography(id)!.kind, id).not.toBe('sea');
    });
  });

  it('preserves regional geography and signed coordinates across the Pacific date line', () => {
    const p = (id: string) => getTerritoryGeography(id)!;
    expect(p('pyongyang').latitude).toBeGreaterThan(p('korea').latitude);
    expect(p('korea').latitude).toBeGreaterThan(p('busan').latitude);
    expect(p('xinjing').latitude).toBeGreaterThan(p('manchuria').latitude);
    expect(p('hiroshima').longitude).toBeLessThan(p('osaka_kure').longitude);
    expect(p('osaka_kure').longitude).toBeLessThan(p('japan_home').longitude);
    expect(p('attu').longitude).toBeGreaterThan(170);
    expect(p('kiska').longitude).toBeLessThan(-170);
    expect(p('hawaii').longitude).toBeLessThan(-150);
    expect(p('makin').anchorName).toContain('부타리타리');
    expect(p('makin').latitude).toBeLessThan(3.2);
    expect(p('tarawa').anchorName).toContain('베티오');
  });
});
