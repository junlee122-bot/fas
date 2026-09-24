import { describe, expect, it } from 'vitest';
import { recoverPeacetimeDivisions } from './peacetimeRecovery';
import type { Division, Territory } from './types';

const base: Division = { id: 'unit', name: '복귀 사단', type: 'infantry', territoryId: 'britain', commanderId: 'commander', status: 'recovering', strength: 55, organization: 31, supply: 24, experience: 60, battleHonors: ['기존 훈장'], equipmentPackageId: 'existing-equipment' };
const land: Territory = { id: 'britain', name: '아군 복귀지', region: '서유럽', x: 0, y: 0, controller: 'allies', value: 5, supply: 30, terrain: '도시', neighbors: [] };

describe('national-phase recovery after transport', () => {
  it('restores organization, supply and strength without changing position or other records', () => {
    const before = structuredClone(base);
    const result = recoverPeacetimeDivisions([base], [land], 'allies', new Set());
    expect(result).toEqual([{ ...base, organization: 41, supply: 30, strength: 57 }]);
    expect(base).toEqual(before); expect(land.supply).toBe(30);
  });

  it('unlocks only after every readiness threshold is met, never just organization', () => {
    const divisions: Division[] = [
      { ...base, id: 'ready', organization: 60, supply: 34, strength: 19 },
      { ...base, id: 'weak', organization: 60, supply: 34, strength: 18 },
      { ...base, id: 'unsupplied', organization: 60, supply: 33 },
      { ...base, id: 'disorganized', organization: 59, supply: 34 },
    ];
    const result = recoverPeacetimeDivisions(divisions, [land], 'allies', new Set());
    expect(result.map((division) => division.status)).toEqual(['ready', 'recovering', 'recovering', 'recovering']);
    expect(result[0]).toMatchObject({ organization: 70, supply: 40, strength: 21 });
  });

  it('never recovers locked or nonrecovering units and preserves their object identities', () => {
    const divisions: Division[] = [base, ...(['ready', 'moving', 'combat'] as const).map((status) => ({ ...base, id: status, status }))];
    const result = recoverPeacetimeDivisions(divisions, [land], 'allies', new Set(['unit']));
    result.forEach((division, index) => expect(division).toBe(divisions[index]));
  });

  it('requires a real, supplied friendly land position including legacy sea detection', () => {
    const locations: Territory[] = [
      { ...land, id: 'enemy', controller: 'axis' }, { ...land, id: 'neutral', controller: 'neutral' },
      { ...land, id: 'sea', siteType: 'sea' }, { ...land, id: 'channel' },
      { ...land, id: 'shortage', supply: 29 }, { ...land, id: 'invalid', supply: Number.NaN },
    ];
    const divisions = [...locations.map((location) => ({ ...base, id: location.id, territoryId: location.id })), { ...base, id: 'missing', territoryId: 'missing' }];
    const result = recoverPeacetimeDivisions(divisions, locations, 'allies', new Set());
    result.forEach((division, index) => expect(division).toBe(divisions[index]));
    const axisUnit = { ...base, territoryId: 'enemy' };
    expect(recoverPeacetimeDivisions([axisUnit], locations, 'axis', new Set())[0].organization).toBe(41);
  });

  it('caps living units at100 and never resurrects zero-strength or malformed units', () => {
    const capped = { ...base, strength: 99, organization: 99, supply: 99 };
    const invalid = [
      { ...base, id: 'dead', strength: 0 }, { ...base, id: 'negative', strength: -1 },
      { ...base, id: 'nan', organization: Number.NaN }, { ...base, id: 'infinite', supply: Number.POSITIVE_INFINITY },
    ];
    const result = recoverPeacetimeDivisions([capped, ...invalid], [land], 'allies', new Set());
    expect(result[0]).toMatchObject({ organization: 100, supply: 100, strength: 100, status: 'ready' });
    invalid.forEach((division, index) => expect(result[index + 1]).toBe(division));
  });

  it('lets a depleted transport survivor return to ready after four eligible weeks, then stops', () => {
    let divisions = [base];
    for (let week = 0; week < 4; week += 1) divisions = recoverPeacetimeDivisions(divisions, [land], 'allies', new Set());
    expect(divisions[0]).toMatchObject({ status: 'ready', organization: 71, supply: 48, strength: 63 });
    expect(recoverPeacetimeDivisions(divisions, [land], 'allies', new Set())[0]).toBe(divisions[0]);
  });
});
