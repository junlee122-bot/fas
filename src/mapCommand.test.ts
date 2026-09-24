import { describe, expect, it } from 'vitest';
import { OFFENSIVE_COMMAND_COST, validateOffensiveCommand, validateOffensiveTarget } from './mapCommand';
import type { OffensiveCommandContext } from './mapCommand';
import type { Division, Territory } from './types';
import { territories as campaignTerritories } from './data';

const origin: Territory = { id: 'origin', name: '출발선', region: '시험', x: 0, y: 0, controller: 'allies', value: 1, supply: 80, terrain: '평야', neighbors: ['enemy'] };
const target: Territory = { ...origin, id: 'enemy', controller: 'axis', neighbors: ['origin'] };
const division: Division = { id: 'division', name: '배속 부대', territoryId: origin.id, commanderId: 'commander', type: 'infantry', status: 'ready', strength: 90, organization: 80, supply: 70, experience: 60 };
const input: OffensiveCommandContext = { origin, target, division, playerFaction: 'allies', phase: 'war', commandableDivisionIds: new Set([division.id]), orders: [], commandPoints: OFFENSIVE_COMMAND_COST };

describe('shared offensive validation', () => {
  it('accepts the same adjacent enemy for highlighting and approval without mutating state', () => {
    const before = JSON.stringify(input);
    expect(validateOffensiveTarget(input).allowed).toBe(true);
    expect(validateOffensiveCommand(input).allowed).toBe(true);
    expect(JSON.stringify(input)).toBe(before);
  });

  it.each([
    [{ target: undefined }, 'missing-territory'],
    [{ origin: undefined }, 'missing-territory'],
    [{ target: { ...target, controller: 'neutral' as const } }, 'neutral-target'],
    [{ target: { ...target, controller: 'allies' as const } }, 'friendly-target'],
    [{ origin: { ...origin, neighbors: [] } }, 'not-adjacent'],
    [{ origin: { ...origin, siteType: 'sea' as const } }, 'sea-origin'],
    [{ target: { ...target, siteType: 'sea' as const } }, 'sea-target'],
  ])('uses identical denial in map and command checks: %s', (overrides, code) => {
    const changed = { ...input, ...overrides };
    expect(validateOffensiveTarget(changed)).toMatchObject({ allowed: false, code });
    expect(validateOffensiveCommand(changed)).toMatchObject({ allowed: false, code });
  });

  it.each([
    ['tunisia', 'sicily'],
    ['scotland', 'narvik'],
    ['liverpool', 'belfast'],
  ])('does not turn the real %s–%s maritime connection into a land assault', (fromId, targetId) => {
    const from = campaignTerritories.find((item) => item.id === fromId)!;
    const to = campaignTerritories.find((item) => item.id === targetId)!;
    expect(from.neighbors).toContain(targetId);
    const changed: OffensiveCommandContext = {
      ...input, origin: from, target: { ...to, controller: 'axis' }, division: { ...division, territoryId: from.id },
    };
    expect(validateOffensiveTarget(changed)).toMatchObject({ allowed: false, code: 'sea-crossing' });
    expect(validateOffensiveCommand(changed)).toMatchObject({ allowed: false, code: 'sea-crossing' });
  });

  it('still permits movement along a continuous coast instead of treating every port as a sea target', () => {
    const from = campaignTerritories.find((item) => item.id === 'normandy')!;
    const to = campaignTerritories.find((item) => item.id === 'calais')!;
    expect(validateOffensiveTarget({ origin: from, target: { ...to, controller: 'axis' }, playerFaction: 'allies' })).toMatchObject({ allowed: true });
  });

  it.each([
    [{ phase: 'nation' as const }, 'not-war'],
    [{ processingWeek: true }, 'processing-week'],
    [{ division: undefined }, 'missing-division'],
    [{ commandableDivisionIds: new Set<string>() }, 'not-authorized'],
    [{ division: { ...division, status: 'combat' as const } }, 'not-ready'],
    [{ division: { ...division, territoryId: 'elsewhere' } }, 'not-at-origin'],
    [{ orders: [{ divisionId: division.id, fromId: origin.id, targetId: target.id, startedWeek: 0 }] }, 'already-ordered'],
    [{ commandPoints: 4 }, 'insufficient-command'],
    [{ commandPoints: Number.NaN }, 'insufficient-command'],
  ])('revalidates command authority, resources and changing force state: %s', (overrides, code) => {
    expect(validateOffensiveCommand({ ...input, ...overrides })).toMatchObject({ allowed: false, code });
  });
});
