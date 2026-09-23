import { describe, expect, it } from 'vitest';
import { approveLandRedeployment, forecastLandRedeployment } from './landRedeployment';
import { createSeaTransportState, launchSeaTransport } from './seaTransport';
import { resolveLandOrdersWeek } from './landOperations';
import type { SeaTransportContext, SeaTransportPlan } from './seaTransport';
import type { JointForcesState } from './jointOperations';
import type { Commander, Territory } from './types';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { createMilitaryAccessState, type MilitaryAccessAgreement } from './militaryAccess';
import { validateOffensiveCommand } from './mapCommand';

const site = (id: string, overrides: Partial<Territory> = {}): Territory => ({
  id, name: id, region: '시험 전구', x: 0, y: 0, controller: 'allies', value: 5,
  supply: 80, terrain: '평야', theater: 'europe', neighbors: [], ...overrides,
});
const plan: SeaTransportPlan = { divisionId: 'division', fromId: 'britain', targetId: 'liverpool' };
function context(): SeaTransportContext {
  return {
    week: 8, nationId: 'britain', playerFaction: 'allies', phase: 'war',
    divisions: [{ id: 'division', name: '이동 사단', type: 'infantry', territoryId: 'britain', status: 'ready', strength: 90, organization: 90, supply: 90, experience: 20, commanderId: 'commander' }],
    territories: [site('britain', { neighbors: ['liverpool', 'channel', 'belfast'] }), site('liverpool', { neighbors: ['britain'] }), site('plymouth'), site('channel', { siteType: 'sea' }), site('belfast', { siteType: 'port', neighbors: ['britain'] })],
    commandableDivisionIds: new Set(['division']), orders: [],
    game: { week: 8, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 },
    jointForces: { theaterControl: { europe: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 }, asia: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 } } } as JointForcesState,
  };
}
const commanders = [{ id: 'commander', name: '시험 지휘관' }] as Commander[];

function accessContext(agreement: Partial<MilitaryAccessAgreement> = {}): SeaTransportContext {
  const input = context();
  input.territories = input.territories.map((territory) => ({ ...territory, ownerId: territory.id === 'liverpool' ? 'germany' : 'britain', controller: territory.id === 'liverpool' ? 'axis' : 'allies' }));
  input.militaryAccess = { state: { ...createMilitaryAccessState(8), agreements: [{ id: 'transit', hostNationId: 'germany', beneficiaryNationId: 'britain', proposerNationId: 'britain', territoryId: 'liverpool', kind: 'transit', durationWeeks: 13,
    status: 'active', proposedWeek: 0, responseDueWeek: 2, activatedWeek: 2, expiresWeek: 15, reason: '시험 통행 협정', ...agreement }] },
    nationId: 'britain', playerFaction: 'allies', week: 8, control: createMapPoliticalLedger(input.territories, 0) };
  return input;
}
function resolveAccessOrder(input: SeaTransportContext, order: NonNullable<ReturnType<typeof approveLandRedeployment>['order']>) {
  return resolveLandOrdersWeek({ week: input.week + 1, orders: [order], divisions: [...input.divisions], territories: [...input.territories], commanders, playerFaction: input.playerFaction,
    stance: 'balanced', doctrine: 'maneuver', enemyPressure: 50, intelNetwork: 50, policyAttackBonus: 0, priorityDivisionId: null, militaryAccess: input.militaryAccess,
    random: () => { throw new Error('Access movement must not attack'); } });
}

describe('military access land integration', () => {
  it('approves and executes foreign transit without capture, supply, resource, or input mutation', () => {
    const input = accessContext(); const before = structuredClone(input);
    const approved = approveLandRedeployment(createSeaTransportState(), plan, input);
    expect(approved.accepted).toBe(true);
    const resolved = resolveAccessOrder(input, approved.order!);
    expect(resolved.entries[0]).toMatchObject({ kind: 'move', target: { id: 'liverpool', ownerId: 'germany', controller: 'axis', supply: 80 } });
    expect(resolved.orders).toEqual([]);
    expect(input).toEqual(before);
  });
  it.each(['notice', 'expired', 'revoked'] as const)('rechecks %s access at execution instead of attacking or moving', (status) => {
    const input = accessContext(); const order = approveLandRedeployment(createSeaTransportState(), plan, input).order!;
    input.militaryAccess!.state.agreements[0] = { ...input.militaryAccess!.state.agreements[0], status, closedWeek: 9, expiresWeek: status === 'expired' ? 9 : 15 };
    const result = resolveAccessOrder(input, order);
    expect(result.entries[0].kind).toBe('invalid');
    expect(input.divisions[0].territoryId).toBe('britain');
  });
  it('does not treat a naval base agreement as land transit', () => {
    expect(forecastLandRedeployment(createSeaTransportState(), plan, accessContext({ kind: 'naval-base' })).accepted).toBe(false);
  });
  it('allows departure during the withdrawal period only toward an accessible adjacent site', () => {
    const input = accessContext({ status: 'notice', closedWeek: 8 });
    input.divisions = input.divisions.map((division) => ({ ...division, territoryId: 'liverpool' }));
    const withdrawal = { ...plan, fromId: 'liverpool', targetId: 'britain' };
    const approved = approveLandRedeployment(createSeaTransportState(), withdrawal, input);
    expect(approved.accepted).toBe(true);
    expect(resolveAccessOrder(input, approved.order!).entries[0].kind).toBe('move');
    input.week = 10;
    expect(forecastLandRedeployment(createSeaTransportState(), withdrawal, input).accepted).toBe(false);
  });
  it('blocks offensive departure at approval and execution despite a friendly foreign origin', () => {
    const input = accessContext({ hostNationId: 'freefrance', territoryId: 'britain' });
    input.territories = input.territories.map((territory) => territory.id === 'britain' ? { ...territory, ownerId: 'freefrance' } : territory);
    input.militaryAccess!.control = createMapPoliticalLedger(input.territories, 0);
    const origin = input.territories[0]; const target = input.territories[1];
    expect(validateOffensiveCommand({ origin, target, division: input.divisions[0], playerFaction: input.playerFaction, phase: 'war', commandableDivisionIds: input.commandableDivisionIds, orders: [], commandPoints: 100, militaryAccess: input.militaryAccess }).code).toBe('origin-access-denied');
    const legacyOrder = approveLandRedeployment(createSeaTransportState(), plan, context()).order!;
    expect(resolveAccessOrder(input, { ...legacyOrder, intent: undefined }).entries[0].kind).toBe('invalid');
  });
});

describe('adjacent friendly land redeployment approval', () => {
  it.each(['axis', 'neutral'] as const)('does not turn a redeployment into an attack after destination changes to %s', (controller) => {
    const input = context(); const order = approveLandRedeployment(createSeaTransportState(), plan, input).order!;
    const result = resolveLandOrdersWeek({ week: input.week + 1, orders: [order], divisions: [...input.divisions], territories: input.territories.map((territory) => territory.id === plan.targetId ? { ...territory, controller } : territory), commanders, playerFaction: 'allies', stance: 'balanced', doctrine: 'maneuver', enemyPressure: 50, intelNetwork: 50, policyAttackBonus: 0, priorityDivisionId: null, random: () => { throw new Error('Redeployment must never attack'); } });
    expect(result.entries[0].kind).toBe('invalid');
    expect(result.orders).toHaveLength(0);
    expect(input.divisions[0].territoryId).toBe(plan.fromId);
  });
  it.each(['war', 'nation'] as const)('approves %s movement with explicit intent and fixed costs', (phase) => {
    const input = { ...context(), phase };
    const result = approveLandRedeployment(createSeaTransportState(), plan, input);
    expect(result).toMatchObject({ accepted: true, commandCost: 3, fuelCost: 1 });
    expect(result.order).toMatchObject({ ...plan, intent: 'redeployment', startedWeek: 8, commandCost: 3, elapsedWeeks: 0 });
    expect(result.order?.commandId).toBe('redeploy:britain:8:division:britain:liverpool');
  });

  it('is pure and preserves unit position, resources, queued orders and the sea ledger', () => {
    const input = context(); const state = createSeaTransportState();
    const before = structuredClone({ input, state });
    const forecast = forecastLandRedeployment(state, plan, input);
    const first = approveLandRedeployment(state, plan, input);
    expect(forecast.order).toBeUndefined();
    expect(approveLandRedeployment(state, plan, input)).toEqual(first);
    expect({ input, state }).toEqual(before);
  });

  it('refuses missing entities, lost authority and stale actual origin', () => {
    const input = context(); const state = createSeaTransportState();
    for (const missing of [{ divisionId: 'missing' }, { fromId: 'missing' }, { targetId: 'missing' }]) {
      expect(approveLandRedeployment(state, { ...plan, ...missing }, input).accepted).toBe(false);
    }
    expect(approveLandRedeployment(state, plan, { ...input, commandableDivisionIds: new Set() }).accepted).toBe(false);
    expect(approveLandRedeployment(state, plan, { ...input, divisions: [{ ...input.divisions[0], territoryId: 'plymouth' }] }).accepted).toBe(false);
  });

  it('requires both endpoints to remain friendly', () => {
    const input = context();
    for (const id of ['britain', 'liverpool']) for (const controller of ['neutral', 'axis'] as const) {
      expect(approveLandRedeployment(createSeaTransportState(), plan, { ...input,
        territories: input.territories.map((territory) => territory.id === id ? { ...territory, controller } : territory),
      }).accepted).toBe(false);
    }
  });

  it('rejects same-location, nonadjacent, sea and cross-water moves', () => {
    const input = context(); const state = createSeaTransportState();
    for (const targetId of ['britain', 'plymouth', 'channel', 'belfast']) {
      expect(approveLandRedeployment(state, { ...plan, targetId }, input).accepted).toBe(false);
    }
    expect(approveLandRedeployment(state, { ...plan, fromId: 'channel' }, { ...input,
      divisions: [{ ...input.divisions[0], territoryId: 'channel' }],
      territories: input.territories.map((territory) => territory.id === 'channel' ? { ...territory, neighbors: ['liverpool'] } : territory),
    }).accepted).toBe(false);
    expect(approveLandRedeployment(state, plan, { ...input,
      territories: input.territories.map((territory) => territory.id === 'liverpool' ? { ...territory, theater: 'asia' } : territory),
    }).accepted).toBe(false);
  });

  it('blocks every non-ready state and already queued land orders', () => {
    const input = context(); const state = createSeaTransportState();
    for (const status of ['moving', 'combat', 'recovering'] as const) {
      expect(approveLandRedeployment(state, plan, { ...input, divisions: [{ ...input.divisions[0], status }] }).accepted).toBe(false);
    }
    const existing = approveLandRedeployment(state, plan, input).order!;
    expect(approveLandRedeployment(state, plan, { ...input, orders: [existing] }).accepted).toBe(false);
  });

  it.each([['hamburg', 'denmark'], ['malaya', 'penang'], ['britain', 'scotland'], ['liverpool', 'scotland'],
    ['anatolia', 'balkans'], ['anatolia', 'sofia']])('rejects both new and previously saved walking orders across %s → %s', (fromId, targetId) => {
    const input = context();
    input.divisions = [{ ...input.divisions[0], territoryId: fromId }];
    input.territories = [site(fromId, { neighbors: [targetId] }), site(targetId, { neighbors: [fromId] })];
    const crossing = { divisionId: 'division', fromId, targetId };
    expect(approveLandRedeployment(createSeaTransportState(), crossing, input).accepted).toBe(false);
    const savedOrder = { ...approveLandRedeployment(createSeaTransportState(), plan, context()).order!, ...crossing };
    const result = resolveLandOrdersWeek({ week: input.week + 1, orders: [savedOrder], divisions: [...input.divisions], territories: [...input.territories], commanders,
      playerFaction: 'allies', stance: 'balanced', doctrine: 'maneuver', enemyPressure: 50, intelNetwork: 50, policyAttackBonus: 0, priorityDivisionId: null,
      random: () => { throw new Error('Invalid water crossing must not resolve a battle'); },
    });
    expect(result.orders).toHaveLength(0);
    expect(result.entries[0].kind).toBe('invalid');
    expect(input.divisions[0].territoryId).toBe(fromId);
  });

  it('blocks an actual sea reservation even when a stale unit snapshot says ready', () => {
    const input = context();
    const sea = launchSeaTransport(createSeaTransportState(), { ...plan, targetId: 'belfast' }, input);
    expect(sea.accepted).toBe(true);
    expect(approveLandRedeployment(sea.state, plan, input).accepted).toBe(false);
  });

  it('rejects insufficient or nonfinite resources but accepts exact costs', () => {
    const input = context(); const state = createSeaTransportState();
    for (const commandPoints of [2, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(approveLandRedeployment(state, plan, { ...input, game: { ...input.game, commandPoints } }).accepted).toBe(false);
    }
    for (const fuel of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(approveLandRedeployment(state, plan, { ...input, game: { ...input.game, fuel } }).accepted).toBe(false);
    }
    expect(approveLandRedeployment(state, plan, { ...input, game: { ...input.game, commandPoints: 3, fuel: 1 } }).accepted).toBe(true);
  });

  it('rejects processing state and invalid campaign weeks without creating orders', () => {
    const input = context(); const state = createSeaTransportState();
    for (const overrides of [{ processingWeek: true }, { week: Number.NaN }, { week: -1 }, { week: 2.5 }]) {
      const result = approveLandRedeployment(state, plan, { ...input, ...overrides });
      expect(result.accepted).toBe(false); expect(result.order).toBeUndefined();
    }
  });

  it('existing scheduler waits until next week then resolves as a noncombat friendly move', () => {
    const input = context(); const order = approveLandRedeployment(createSeaTransportState(), plan, input).order!;
    const scheduler = { week: input.week, orders: [order], divisions: [...input.divisions], territories: [...input.territories], commanders,
      playerFaction: input.playerFaction, stance: 'balanced' as const, doctrine: 'methodical', enemyPressure: 80, intelNetwork: 60,
      policyAttackBonus: 0, priorityDivisionId: null,
      random: () => { throw new Error('Friendly redeployment must not roll a battle.'); },
    };
    expect(resolveLandOrdersWeek(scheduler)).toMatchObject({ entries: [], orders: [order] });
    const result = resolveLandOrdersWeek({ ...scheduler, week: input.week + 1 });
    expect(result.orders).toEqual([]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ kind: 'move', target: { id: 'liverpool' } });
  });
});
