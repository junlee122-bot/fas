import { describe, expect, it } from 'vitest';
import { initialDivisions, territories } from './data';
import { recoverLegacySeaPositions } from './landPositionRecovery';
import type { Division, Order, Territory } from './types';

const formation = (territoryId: string, id = 'legacy-unit'): Division => ({
  ...initialDivisions[0], id, territoryId, status: 'combat', strength: 43,
  organization: 27, supply: 18, experience: 72, battleHonors: ['preserved-honor'], equipmentPackageId: 'legacy-equipment',
});
const order = (fromId: string, startedWeek = 4, divisionId = 'legacy-unit'): Order => ({ divisionId, fromId, targetId: 'channel', startedWeek });

describe('legacy sea-position recovery on save restore', () => {
  it('prefers the recorded friendly land origin and preserves all other formation fields', () => {
    const division = formation('channel');
    const result = recoverLegacySeaPositions({ divisions: [division], territories, orders: [order('britain')], playerFaction: 'allies' });
    expect(result.divisions[0]).toEqual({ ...division, territoryId: 'britain' });
    expect(result.changes).toEqual([{ divisionId: division.id, fromId: 'channel', toId: 'britain', reason: 'recorded-origin' }]);
    expect(result.unresolvedDivisionIds).toEqual([]);
    expect(division.territoryId).toBe('channel');
  });

  it('uses the most recent safe recorded origin deterministically, regardless of order-array ordering', () => {
    const orders = [order('britain', 4), order('plymouth', 9), order('france', 15), order('hawaii', 20)];
    const input = { divisions: [formation('channel')], territories, orders, playerFaction: 'allies' as const };
    const result = recoverLegacySeaPositions(input);
    expect(result.divisions[0].territoryId).toBe('plymouth');
    expect(recoverLegacySeaPositions({ ...input, orders: [...orders].reverse() })).toEqual(result);
  });

  it('does not borrow an unrelated formation’s previous location', () => {
    const result = recoverLegacySeaPositions({ divisions: [formation('channel')], territories, orders: [order('plymouth', 40, 'another-unit')], playerFaction: 'allies' });
    expect(result.divisions[0].territoryId).toBe('portsmouth');
    expect(result.changes[0].reason).toBe('safe-staging');
  });

  it.each([
    ['atlantic', 'liverpool'], ['channel', 'portsmouth'], ['coral_sea', 'port_moresby'],
  ])('repairs %s using explicit current friendly staging at %s', (fromId, toId) => {
    const result = recoverLegacySeaPositions({ divisions: [formation(fromId)], territories, orders: [], playerFaction: 'allies' });
    expect(result.changes).toEqual([{ divisionId: 'legacy-unit', fromId, toId, reason: 'safe-staging' }]);
  });

  it('repairs older saves with missing sea metadata without switching theaters', () => {
    const sparseTerritories = territories.filter((territory) => territory.id !== 'coral_sea');
    const result = recoverLegacySeaPositions({ divisions: [formation('coral_sea')], territories: sparseTerritories, orders: [order('britain')], playerFaction: 'allies' });
    expect(result.divisions[0].territoryId).toBe('port_moresby');
  });

  it('does not capture enemy or neutral staging points to create a destination', () => {
    const changedTerritories: Territory[] = territories.map((territory) => ['portsmouth', 'britain'].includes(territory.id) ? { ...territory, controller: 'neutral' } : territory);
    const division = formation('channel');
    const result = recoverLegacySeaPositions({ divisions: [division], territories: changedTerritories, orders: [order('france'), order('hawaii')], playerFaction: 'allies' });
    expect(result.divisions[0]).toBe(division);
    expect(result.changes).toEqual([]);
    expect(result.unresolvedDivisionIds).toEqual(['legacy-unit']);
    expect(changedTerritories.find((territory) => territory.id === 'france')?.controller).toBe('axis');
  });

  it('uses current faction control rather than historic owner identity for safe staging', () => {
    const result = recoverLegacySeaPositions({ divisions: [formation('channel')], territories, orders: [], playerFaction: 'axis' });
    expect(result.divisions[0].territoryId).toBe('calais');
  });

  it('keeps unknown locations and valid island, port and land positions unchanged', () => {
    const divisions = ['missing-location', 'midway', 'hawaii', 'normandy', 'belfast'].map((id) => formation(id, id));
    const result = recoverLegacySeaPositions({ divisions, territories, orders: [], playerFaction: 'allies' });
    expect(result.divisions).toEqual(divisions);
    result.divisions.forEach((division, index) => expect(division).toBe(divisions[index]));
    expect(result.changes).toEqual([]);
    expect(result.unresolvedDivisionIds).toEqual([]);
  });

  it('reports a custom sea without a recorded safe origin instead of choosing an arbitrary world city', () => {
    const customSea: Territory = { ...territories[0], id: 'custom-ocean', siteType: 'sea', neighbors: ['britain'] };
    const result = recoverLegacySeaPositions({ divisions: [formation(customSea.id)], territories: [...territories, customSea], orders: [], playerFaction: 'allies' });
    expect(result.unresolvedDivisionIds).toEqual(['legacy-unit']);
    expect(result.changes).toEqual([]);
  });

  it('is idempotent and does not alter orders, territory control or resources', () => {
    const orders = [order('britain')];
    const ordersBefore = structuredClone(orders);
    const territoriesBefore = structuredClone(territories);
    const input = { divisions: [formation('channel')], territories, orders, playerFaction: 'allies' as const };
    const recovered = recoverLegacySeaPositions(input);
    const second = recoverLegacySeaPositions({ ...input, divisions: recovered.divisions });
    expect(second.changes).toEqual([]);
    expect(second.divisions).toEqual(recovered.divisions);
    expect(territories).toEqual(territoriesBefore);
    expect(orders).toEqual(ordersBefore);
    expect(Object.keys(recovered).sort()).toEqual(['changes', 'divisions', 'unresolvedDivisionIds']);
  });
});
