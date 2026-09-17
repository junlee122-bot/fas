import { describe, expect, it } from 'vitest';
import {
  advanceSeaTransportWeek, createSeaTransportState, findSeaTransportRoute, forecastSeaTransport,
  getSeaTransportBusyDivisionIds, getSeaTransportEmbarkedDivisionIds, launchSeaTransport,
  normalizeSeaTransportState, requestSeaTransportReturn, isSeaTransportEndpoint,
  getSeaTransportBusyFleetIds, getSeaTransportEscortOptions, getSeaTransportEscortProtection,
  forecastSeaTransportRescue, launchSeaTransportRescue,
  forecastSeaTransportEscortRelief, dispatchSeaTransportEscortRelief,
  getSeaTransportActiveProtection, getSeaTransportAirSupportOptions, getSeaTransportInterdictionPressure,
} from './seaTransport';
import { territories as campaignTerritories } from './data';
import type { SeaTransportContext, SeaTransportPlan, SeaTransportResult, SeaTransportState } from './seaTransport';
import type { AirGroup, JointForcesState, NavalTaskForce } from './jointOperations';
import { createFleetNavigation } from './navalNavigation';
import type { Territory } from './types';

// Synthetic sites explicitly represent ports; an arbitrary terrain string alone is not coastal evidence.
const site = (id: string, overrides: Partial<Territory> = {}): Territory => ({ id, name: id, region: '시험 전구', x: 0, y: 0, controller: 'allies', value: 5, supply: 35, terrain: '해안', siteType: 'port', neighbors: [], theater: 'europe', ...overrides });
const plan = { divisionId: 'marine', fromId: 'britain', targetId: 'normandy' };
function context(): SeaTransportContext {
  return {
    week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', processingWeek: false,
    divisions: [{ id: 'marine', name: '상륙사단', type: 'marine', territoryId: 'britain', status: 'ready', strength: 95, organization: 95, supply: 95, experience: 60, commanderId: 'general' }],
    territories: [site('britain', { neighbors: ['normandy', 'belfast', 'channel', 'liverpool'] }), site('normandy', { neighbors: ['britain', 'channel', 'belfast'], controller: 'axis' }), site('belfast', { neighbors: ['britain'] }), site('channel', { siteType: 'sea', neighbors: ['britain', 'normandy', 'calais'] }), site('calais', { controller: 'axis', neighbors: ['channel'] }), site('liverpool', { neighbors: ['britain'] })],
    commandableDivisionIds: new Set(['marine']), orders: [],
    game: { week: 0, manpower: 400, politicalPower: 100, fuel: 100, steel: 50, factories: 10, stability: 70, warSupport: 70, commandPoints: 100, treasury: 100, victoryScore: 0, airPower: 80, navalPower: 80, intelNetwork: 60, enemyPressure: 50 },
    stockpile: { infantryEquipment: 100, tanks: 10, aircraft: 10, convoys: 100, artillery: 20, trucks: 10 },
    jointForces: { theaterControl: { europe: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 }, asia: { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: 0 } } } as JointForcesState,
  };
}
function apply(input: SeaTransportContext, result: SeaTransportResult): SeaTransportContext {
  const game = { ...input.game };
  for (const [key, value] of Object.entries(result.gameDelta)) game[key as keyof typeof game] += value;
  return { ...input, game, stockpile: { ...input.stockpile, convoys: input.stockpile.convoys + result.convoyDelta, aircraft: input.stockpile.aircraft + (result.aircraftDelta ?? 0) },
    jointForces: { ...input.jointForces, fleets: (input.jointForces.fleets ?? []).map((fleet) => [...(result.fleetUpdates ?? [])].reverse().find((update) => update.id === fleet.id) ?? fleet),
      airGroups: (input.jointForces.airGroups ?? []).map((group) => [...(result.airGroupUpdates ?? [])].reverse().find((update) => update.id === group.id) ?? group) },
    divisions: input.divisions.map((division) => result.divisionUpdates.find((update) => update.id === division.id) ?? division),
    territories: input.territories.map((territory) => [...result.territoryUpdates].reverse().find((update) => update.id === territory.id) ?? territory) };
}
function launch(input = context(), customPlan: SeaTransportPlan = plan) {
  const result = launchSeaTransport(createSeaTransportState(), customPlan, input);
  expect(result.accepted).toBe(true);
  return { state: result.state, context: apply(input, result), result };
}
function step(run: { state: SeaTransportState; context: SeaTransportContext }, week = run.context.week + 1) {
  const input = { ...run.context, week };
  const result = advanceSeaTransportWeek(run.state, input);
  return { state: result.state, context: apply(input, result), result };
}
function complete(run: ReturnType<typeof launch>, maxWeeks = 20) {
  let current = run;
  for (let index = 0; index < maxWeeks && current.state.operations.length; index += 1) current = step(current);
  return current;
}
function returnFleets(run: ReturnType<typeof launch>, maxWeeks = 30) {
  let current = run;
  for (let index = 0; index < maxWeeks && current.context.jointForces.fleets.some((fleet) => ['returning', 'refueling'].includes(fleet.navigation?.mode ?? '')); index += 1) current = step(current);
  return current;
}

describe('sea transport routes and approval', () => {
  it('excludes actual inland aggregates despite legacy sea adjacency and retains real coastal gateways', () => {
    for (const id of ['france', 'morocco', 'algeria', 'egypt', 'cairo', 'india', 'spain', 'korea', 'clark']) {
      const territory = campaignTerritories.find((item) => item.id === id)!;
      expect(territory, id).toBeDefined(); expect(isSeaTransportEndpoint(territory), id).toBe(false);
    }
    for (const id of ['britain', 'normandy', 'cherbourg', 'belfast', 'portsmouth', 'casablanca', 'alexandria', 'bombay', 'busan']) {
      const territory = campaignTerritories.find((item) => item.id === id)!;
      expect(territory, id).toBeDefined(); expect(isSeaTransportEndpoint(territory), id).toBe(true);
    }
    expect(findSeaTransportRoute('britain', 'france', campaignTerritories)).toBeNull();
    expect(findSeaTransportRoute('britain', 'morocco', campaignTerritories)).toBeNull();
    expect(findSeaTransportRoute('egypt', 'crete', campaignTerritories)).toBeNull();
    expect(findSeaTransportRoute('india', 'ceylon', campaignTerritories)).toBeNull();
    expect(findSeaTransportRoute('britain', 'normandy', campaignTerritories)).not.toBeNull();
    expect(findSeaTransportRoute('britain', 'cherbourg', campaignTerritories)).not.toBeNull();
    expect(findSeaTransportRoute('britain', 'casablanca', campaignTerritories)).not.toBeNull();
  });
  it('does not infer coastal access from generic terrain, a sea neighbor or island landmass alone', () => {
    const unknown = site('unknown', { siteType: 'city', terrain: '해안', neighbors: ['channel'] });
    expect(isSeaTransportEndpoint(unknown)).toBe(false);
    expect(isSeaTransportEndpoint({ ...unknown, siteType: undefined })).toBe(false);
    expect(isSeaTransportEndpoint({ ...unknown, siteType: 'port' })).toBe(true);
    expect(isSeaTransportEndpoint({ ...unknown, siteType: 'island' })).toBe(true);
    expect(findSeaTransportRoute('britain', 'unknown', [...context().territories, unknown])).toBeNull();
  });
  it('safely cancels or returns a legacy inland landing order without capturing its target', () => {
    for (const departed of [false, true]) {
      let run = launch(); if (departed) run = step(run);
      run.context = { ...run.context, territories: [...run.context.territories, site('france', { name: '파리·중부 프랑스', controller: 'axis', siteType: 'capital', neighbors: ['channel'] })] };
      run.state = { ...run.state, operations: run.state.operations.map((operation) => ({ ...operation, targetId: 'france', targetName: '파리·중부 프랑스', routeIds: ['britain', 'channel', 'france'] })) };
      run = step(run);
      if (departed) { expect(run.state.operations[0].stage).toBe('returning'); run = complete(run); }
      expect(run.state.records[0].outcome).toBe('diverted'); expect(run.context.divisions[0].territoryId).toBe('britain');
      expect(run.context.territories.find((territory) => territory.id === 'france')?.controller).toBe('axis');
      expect(run.context.stockpile.convoys).toBe(100);
    }
  });
  it('accepts direct known water crossings and sea-interior graph routes only', () => {
    const input = context();
    expect(findSeaTransportRoute('britain', 'normandy', input.territories)).toEqual(['britain', 'normandy']);
    expect(findSeaTransportRoute('britain', 'calais', input.territories)).toEqual(['britain', 'channel', 'calais']);
    expect(findSeaTransportRoute('britain', 'liverpool', input.territories)).toBeNull();
    expect(findSeaTransportRoute('britain', 'channel', input.territories)).toBeNull();
    expect(findSeaTransportRoute('channel', 'normandy', input.territories)).toBeNull();
  });
  it('does not infer a sea route through inland intermediate nodes or across theaters', () => {
    const input = context();
    expect(findSeaTransportRoute('liverpool', 'normandy', input.territories)).toBeNull();
    expect(findSeaTransportRoute('britain', 'normandy', input.territories.map((territory) => territory.id === 'normandy' ? { ...territory, theater: 'asia' } : territory))).toBeNull();
  });
  it('requires command authority, a ready actual garrison, and no existing land order', () => {
    const input = context(); const state = createSeaTransportState();
    expect(forecastSeaTransport(state, plan, { ...input, commandableDivisionIds: new Set() }).allowed).toBe(false);
    expect(forecastSeaTransport(state, plan, { ...input, divisions: [{ ...input.divisions[0], status: 'recovering' }] }).allowed).toBe(false);
    expect(forecastSeaTransport(state, plan, { ...input, divisions: [{ ...input.divisions[0], territoryId: 'belfast' }] }).allowed).toBe(false);
    expect(forecastSeaTransport(state, plan, { ...input, orders: [{ ...plan, startedWeek: 0 }] }).allowed).toBe(false);
  });
  it('validates readiness, resources, neutral targets and current phase at approval', () => {
    const input = context(); const state = createSeaTransportState();
    for (const inputOverride of [
      { processingWeek: true }, { phase: 'nation' as const }, { divisions: [{ ...input.divisions[0], supply: 20 }] },
      { game: { ...input.game, commandPoints: 0 } }, { game: { ...input.game, fuel: 0 } },
      { stockpile: { ...input.stockpile, convoys: 0 } }, { stockpile: { ...input.stockpile, convoys: Number.NaN } },
      { territories: input.territories.map((territory) => territory.id === 'normandy' ? { ...territory, controller: 'neutral' as const } : territory) },
    ]) {
      const result = launchSeaTransport(state, plan, { ...input, ...inputOverride });
      expect(result.accepted).toBe(false); expect(result.state).toBe(state); expect(result.gameDelta).toEqual({}); expect(result.convoyDelta).toBe(0);
    }
  });
  it('allows peacetime friendly transfers and distinguishes reserved boats from spent costs', () => {
    const input = { ...context(), phase: 'nation' as const }; const result = launchSeaTransport(createSeaTransportState(), { ...plan, targetId: 'belfast' }, input);
    expect(result.accepted).toBe(true); expect(result.convoyDelta).toBe(-16);
    expect(result.gameDelta).toEqual({ commandPoints: -5, fuel: -10 });
    expect(result.divisionUpdates[0]).toMatchObject({ territoryId: 'britain', status: 'moving' });
    expect(result.territoryUpdates).toEqual([]);
  });
  it('reserves once, never mutates the source and rejects a second assignment', () => {
    const input = context(); const original = structuredClone({ divisions: input.divisions, territories: input.territories, game: input.game, stockpile: input.stockpile });
    const result = launchSeaTransport(createSeaTransportState(), plan, input);
    expect({ divisions: input.divisions, territories: input.territories, game: input.game, stockpile: input.stockpile }).toEqual(original);
    expect(launchSeaTransport(result.state, plan, input).accepted).toBe(false);
    expect(getSeaTransportBusyDivisionIds(result.state)).toEqual(new Set(['marine']));
  });
});

function escortFleet(overrides: Partial<NavalTaskForce> = {}): NavalTaskForce {
  return { id: 'escort-one', name: '서부항로 호위대', kind: 'escort', commander: '호위 지휘관', flagship: '시험 기함', location: '서부항로',
    ships: 12, authorizedShips: 12, readiness: 100, organization: 90, experience: 60, status: 'ready', assignmentId: null, historicalBasis: '엔진 검증용 편제', ...overrides };
}
function contextWithEscort(overrides: Partial<NavalTaskForce> = {}): SeaTransportContext {
  const input = context();
  return { ...input, jointForces: { ...input.jointForces, nationId: input.nationId, fleets: [escortFleet(overrides)], operations: [] } };
}
function stranded(input = contextWithEscort(), withEscort = false): ReturnType<typeof launch> {
  const run = step(launch(input, { ...plan, ...(withEscort ? { escortFleetId: 'escort-one' } : {}) }));
  // Explicit saved-state fixture: all original reserved hulls were lost at sea.
  return { ...run, state: { ...run.state, operations: run.state.operations.map((operation) => ({ ...operation, stage: 'waiting-return' as const, stageWeeks: 0, convoysRemaining: 0 })) } };
}
function rescue(run: ReturnType<typeof launch>) {
  const result = launchSeaTransportRescue(run.state, run.state.operations[0].id, run.context);
  expect(result.accepted).toBe(true);
  return { state: result.state, context: apply(run.context, result), result };
}

describe('named escort commitments and live protection', () => {
  it('prices a named fleet separately, reserves it once and exposes its actual strength', () => {
    const input = contextWithEscort(); const selected = { ...plan, escortFleetId: 'escort-one' };
    const forecast = forecastSeaTransport(createSeaTransportState(), selected, input);
    expect(forecast.escort).toMatchObject({ fleetId: 'escort-one', commandCost: 2 });
    expect(forecast.escort!.fuelCost).toBeGreaterThanOrEqual(6);
    expect(forecast.commandCost).toBe(12); expect(forecast.fuelCost).toBe(18 + forecast.escort!.fuelCost);
    const run = launch(input, selected); const operation = run.state.operations[0];
    expect(operation.escortFleetName).toBe('서부항로 호위대');
    expect(run.context.jointForces.fleets[0]).toMatchObject({ status: 'assigned', assignmentId: operation.id });
    expect(getSeaTransportBusyFleetIds(run.state)).toEqual(new Set(['escort-one']));
    const option = getSeaTransportEscortOptions(run.state, run.context)[0];
    expect(option.allowed).toBe(false); expect(option.protection).toBeGreaterThan(0);
    expect(input.jointForces.fleets[0].assignmentId).toBeNull();
  });
  it.each([
    { kind: 'submarine' as const }, { kind: 'clandestine' as const }, { ships: 0 }, { ships: Number.NaN },
    { readiness: 29 }, { organization: 24 }, { status: 'refit' as const }, { assignmentId: 'another-operation' }, { status: 'assigned' as const },
  ])('rejects an unavailable or inappropriate escort %j', (overrides) => {
    const input = contextWithEscort(overrides);
    const result = launchSeaTransport(createSeaTransportState(), { ...plan, escortFleetId: 'escort-one' }, input);
    expect(result.accepted).toBe(false); expect(result.fleetUpdates).toBeUndefined(); expect(result.convoyDelta).toBe(0);
  });
  it.each(['escort', 'surface', 'carrier', 'coastal'] as const)('accepts a ready %s formation', (kind) => {
    expect(forecastSeaTransport(createSeaTransportState(), { ...plan, escortFleetId: 'escort-one' }, contextWithEscort({ kind, location: '포츠머스' })).allowed).toBe(true);
  });
  it('rejects foreign, missing, unauthorized and secretly joint-reserved fleets', () => {
    const input = contextWithEscort();
    for (const changed of [
      { ...input, canCommandEscort: false },
      { ...input, jointForces: { ...input.jointForces, nationId: 'usa' as const } },
      { ...input, jointForces: { ...input.jointForces, fleets: [] } },
      { ...input, jointForces: { ...input.jointForces, operations: [{ id: 'joint-1', fleetIds: ['escort-one'] }] as JointForcesState['operations'] } },
    ]) expect(launchSeaTransport(createSeaTransportState(), { ...plan, escortFleetId: 'escort-one' }, changed).accepted).toBe(false);
    expect(launchSeaTransport(createSeaTransportState(), plan, { ...input, canCommandEscort: false }).accepted).toBe(true);
  });
  it('guards sea-state reservations even if the caller passes a stale ready fleet snapshot', () => {
    const input = contextWithEscort(); let run = launch(input, { ...plan, escortFleetId: 'escort-one' });
    const secondDivision = { ...input.divisions[0], id: 'second' };
    run.context = { ...input, divisions: [...input.divisions, secondDivision], commandableDivisionIds: new Set(['marine', 'second']) };
    const result = launchSeaTransport(run.state, { ...plan, divisionId: 'second', escortFleetId: 'escort-one' }, run.context);
    expect(result.accepted).toBe(false); expect(result.gameDelta).toEqual({});
  });
  it('uses live fatigue/hulls, never unlimited protection, and releases the actual fleet at arrival', () => {
    const base = escortFleet();
    expect(getSeaTransportEscortProtection({ ...base, ships: 1000 })).toBeLessThanOrEqual(26);
    expect(getSeaTransportEscortProtection({ ...base, ships: 1 })).toBeLessThan(getSeaTransportEscortProtection(base));
    expect(getSeaTransportEscortProtection({ ...base, ships: 0 })).toBe(0);
    expect(getSeaTransportEscortProtection({ ...base, readiness: 10 })).toBeLessThan(getSeaTransportEscortProtection(base));
    let run = launch(contextWithEscort(), { ...plan, targetId: 'belfast', escortFleetId: 'escort-one' });
    run = step(run); expect(run.context.jointForces.fleets[0].readiness).toBe(100);
    run = step(run); expect(run.context.jointForces.fleets[0].readiness).toBe(97);
    run = complete(run);
    expect(run.context.jointForces.fleets[0].navigation?.mode).toBe('returning');
    expect(run.context.jointForces.fleets[0].assignmentId).toBe('nav-return-escort-one');
    run = returnFleets(run);
    expect(run.context.jointForces.fleets[0]).toMatchObject({ status: 'ready', assignmentId: null, ships: 12, readiness: 94 });
    expect(run.state.records[0]).toMatchObject({ escortFleetId: 'escort-one', escortShipsLost: 0, commandCost: 7 });
    expect(run.state.records[0].fuelCost).toBeGreaterThanOrEqual(16);
  });
  it('returns a worn formation to refit and never heals it upon releasing the assignment', () => {
    let run = launch(contextWithEscort({ readiness: 40, organization: 30 }), { ...plan, targetId: 'belfast', escortFleetId: 'escort-one' });
    run = returnFleets(complete(run));
    expect(run.context.jointForces.fleets[0]).toMatchObject({ status: 'refit', readiness: 34, organization: 26, assignmentId: null });
  });
  it('cannot hijack a reassigned fleet and does not mutate a foreign nation after career change', () => {
    let run = step(launch(contextWithEscort(), { ...plan, escortFleetId: 'escort-one' }));
    run.context = { ...run.context, jointForces: { ...run.context.jointForces, fleets: [escortFleet({ status: 'assigned', assignmentId: 'joint-other' })] } };
    const next = step(run); expect(next.result.fleetUpdates).toBeUndefined(); expect(next.state.operations[0].lastMessage).toContain('추가 보호를 적용하지 않습니다');
    const foreign = step({ ...run, context: { ...run.context, nationId: 'usa' } });
    expect(foreign.result.fleetUpdates).toBeUndefined(); expect(foreign.result.convoyDelta).toBe(0);
  });
  it('reduces aggregate convoy loss but still risks ships and escorts across 40 hostile crossings', () => {
    let bareLosses = 0; let escortedLosses = 0; let escortLosses = 0;
    for (let index = 0; index < 40; index += 1) {
      const input = contextWithEscort(); input.divisions = [{ ...input.divisions[0], id: `marine-${index}` }]; input.commandableDivisionIds = new Set([input.divisions[0].id]);
      input.jointForces.theaterControl.europe = { sea: 15, air: 15, intelligence: 30, trend: 0, lastChangedWeek: 0 };
      const testPlan = { ...plan, divisionId: input.divisions[0].id, targetId: 'belfast' };
      const bare = complete(launch(input, testPlan));
      const escorted = complete(launch(input, { ...testPlan, escortFleetId: 'escort-one' }));
      bareLosses += bare.state.records[0].convoysLost; escortedLosses += escorted.state.records[0].convoysLost;
      escortLosses += escorted.state.records[0].escortShipsLost ?? 0;
      expect(escorted.context.jointForces.fleets[0].ships + (escorted.state.records[0].escortShipsLost ?? 0)).toBe(12);
    }
    expect(escortedLosses).toBeLessThan(bareLosses); expect(escortedLosses).toBeGreaterThan(0); expect(escortLosses).toBeGreaterThan(0);
  });
});

function rotationContext(): SeaTransportContext {
  const input = contextWithEscort();
  return { ...input, jointForces: { ...input.jointForces, fleets: [...input.jointForces.fleets,
    escortFleet({ id: 'escort-two', name: '증원 호위대', readiness: 85, organization: 80 }),
    escortFleet({ id: 'escort-three', name: '예비 호위대' })] } };
}
function patrol(overrides: Partial<AirGroup> = {}): AirGroup {
  return { id: 'patrol-one', name: '해안초계비행단', kind: 'maritime', commander: '초계 지휘관', principalAircraft: 'Sunderland', base: '북아일랜드',
    aircraft: 90, authorizedAircraft: 90, serviceability: 95, readiness: 95, experience: 50, status: 'ready', assignmentId: null, historicalBasis: '해상 초계 검증 편제', ...overrides };
}
function layeredContext(): SeaTransportContext {
  const input = rotationContext();
  return { ...input, jointForces: { ...input.jointForces, airGroups: [patrol(), patrol({ id: 'patrol-two', name: '전투 엄호단', kind: 'fighter', base: '영국 남부' })] } };
}
describe('physical multi-fleet and air escort', () => {
  const selected: SeaTransportPlan = { ...plan, targetId: 'belfast', escortFleetIds: ['escort-one', 'escort-two'], airGroupIds: ['patrol-one', 'patrol-two'] };
  it('prices every asset exactly once and reserves all five-dimensional support commitments atomically', () => {
    const input = layeredContext(); const quote = forecastSeaTransport(createSeaTransportState(), selected, input);
    expect(quote.allowed, quote.reason).toBe(true); expect(quote.escorts).toHaveLength(2); expect(quote.airSupport).toHaveLength(2);
    expect(quote.commandCost).toBe(13);
    expect(quote.fuelCost).toBe(10 + [...quote.escorts, ...quote.airSupport].reduce((sum, item) => sum + item.fuelCost, 0));
    const run = launch(input, selected); const id = run.state.operations[0].id;
    expect(run.state.operations[0].escortFleetId).toBe('escort-one');
    expect(run.context.jointForces.fleets.slice(0, 2).every((fleet) => fleet.assignmentId === id && fleet.navigation?.mode === 'outbound')).toBe(true);
    expect(run.context.jointForces.airGroups.every((group) => group.assignmentId === id)).toBe(true);
    expect(getSeaTransportBusyFleetIds(run.state)).toEqual(new Set(['escort-one', 'escort-two']));
    expect(quote.supportProtection).toBeLessThanOrEqual(48);
    expect(quote.supportProtection).toBeLessThan([...quote.escorts, ...quote.airSupport].reduce((sum, item) => sum + item.protection, 0));
    expect(input.jointForces.airGroups[0].assignmentId).toBeNull();
  });
  it.each([
    { escortFleetIds: ['escort-one', 'escort-one'] }, { airGroupIds: ['patrol-one', 'patrol-one'] },
    { escortFleetIds: ['escort-one', 'missing'] }, { airGroupIds: ['patrol-one', 'missing'] },
    { escortFleetIds: ['escort-one', 'escort-two', 'escort-three', 'escort-four'] },
    { airGroupIds: ['patrol-one', 'patrol-two', 'patrol-three'] },
  ])('rejects the whole multi-asset order for invalid selection %j', (selection) => {
    const result = launchSeaTransport(createSeaTransportState(), { ...selected, ...selection }, layeredContext());
    expect(result.accepted).toBe(false); expect(result.convoyDelta).toBe(0); expect(result.gameDelta).toEqual({});
    expect(result.fleetUpdates).toBeUndefined(); expect(result.airGroupUpdates).toBeUndefined();
  });
  it('keeps legacy lead selection compatible without charging it twice when also in the roster', () => {
    const input = layeredContext();
    const base = forecastSeaTransport(createSeaTransportState(), selected, input);
    const legacy = forecastSeaTransport(createSeaTransportState(), { ...selected, escortFleetId: 'escort-one' }, input);
    expect(legacy.allowed).toBe(true); expect(legacy.fuelCost).toBe(base.fuelCost); expect(legacy.commandCost).toBe(base.commandCost);
  });
  it('never provides fleet protection at approval; actual coordinates must catch the convoy', () => {
    let run = launch(layeredContext(), { ...selected, airGroupIds: [] });
    expect(getSeaTransportActiveProtection(run.state.operations[0], run.context)).toBe(0);
    run = step(run);
    expect(getSeaTransportActiveProtection(run.state.operations[0], run.context)).toBeGreaterThan(0);
    const remote = run.context.jointForces.fleets.map((fleet) => fleet.navigation ? { ...fleet, navigation: { ...fleet.navigation, position: { ...fleet.navigation.position, latitude: -35, longitude: 150 } } } : fleet);
    expect(getSeaTransportActiveProtection(run.state.operations[0], { ...run.context, jointForces: { ...run.context.jointForces, fleets: remote } })).toBe(0);
  });
  it('checks the entire mission and home reserve, not only ability to reach the departure harbor', () => {
    const input = layeredContext();
    const fleet = { ...input.jointForces.fleets[0], location: '포츠머스', kind: 'coastal' as const };
    fleet.navigation = { ...createFleetNavigation(fleet)!, remainingRangeNm: 400 };
    input.jointForces.fleets[0] = fleet;
    const quote = forecastSeaTransport(createSeaTransportState(), { ...selected, escortFleetIds: [fleet.id], airGroupIds: [] }, input);
    expect(quote.allowed).toBe(false); expect(quote.reason).toContain('항속');
  });
  it('limits air coverage by base/radius and immediately suspends sorties from a captured base', () => {
    const input = layeredContext(); const route = ['britain', 'belfast'];
    expect(getSeaTransportAirSupportOptions(createSeaTransportState(), input, route)[0].allowed).toBe(true);
    const remote = { ...input, jointForces: { ...input.jointForces, airGroups: [patrol({ base: '포트모르즈비' })] } };
    expect(getSeaTransportAirSupportOptions(createSeaTransportState(), remote, route)[0].allowed).toBe(false);
    let run = launch(input, { ...selected, escortFleetIds: [], airGroupIds: ['patrol-one'] });
    expect(getSeaTransportActiveProtection(run.state.operations[0], run.context)).toBeGreaterThan(0);
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'belfast' ? { ...territory, controller: 'axis' } : territory) };
    expect(getSeaTransportActiveProtection(run.state.operations[0], run.context)).toBe(0);
    expect(getSeaTransportAirSupportOptions(createSeaTransportState(), { ...input, territories: run.context.territories }, route)[0].reason).toContain('통제');
  });
  it('fatigues air patrols and releases every formation without recreating lost equipment', () => {
    let run = launch(layeredContext(), selected); run = complete(run);
    expect(run.state.records[0].escortFleetIds).toEqual(['escort-one', 'escort-two']);
    expect(run.state.records[0].airGroupIds).toEqual(['patrol-one', 'patrol-two']);
    expect(run.context.jointForces.airGroups.every((group) => !group.assignmentId && group.readiness < 95 && group.aircraft <= 90)).toBe(true);
    expect(run.context.jointForces.fleets.slice(0, 2).every((fleet) => fleet.navigation?.mode === 'returning')).toBe(true);
    run = returnFleets(run);
    expect(run.context.jointForces.fleets.slice(0, 2).every((fleet) => fleet.navigation?.mode === 'in-port' && !fleet.assignmentId && fleet.ships <= 12)).toBe(true);
  });
  it('deducts only actual weekly patrol losses from the aircraft pool, never cumulative losses or replayed weeks', () => {
    let totalLosses = 0;
    for (let index = 0; index < 40; index += 1) {
      const input = layeredContext(); input.stockpile.aircraft = 1000;
      input.divisions = [{ ...input.divisions[0], id: `air-accounting-${index}` }]; input.commandableDivisionIds = new Set([input.divisions[0].id]);
      input.jointForces.theaterControl.europe = { sea: 70, air: 0, intelligence: 40, trend: 0, lastChangedWeek: 0 };
      let run = launch(input, { ...selected, divisionId: input.divisions[0].id, escortFleetIds: [] });
      expect(run.result.aircraftDelta ?? 0).toBe(0);
      let spent = 0;
      while (run.state.operations.length && run.context.week < 12) {
        const beforeAircraft = run.context.jointForces.airGroups.reduce((sum, group) => sum + group.aircraft, 0);
        run = step(run);
        const actualLoss = beforeAircraft - run.context.jointForces.airGroups.reduce((sum, group) => sum + group.aircraft, 0);
        expect(run.result.aircraftDelta ?? 0).toBe(actualLoss ? -actualLoss : 0);
        spent += actualLoss;
        expect(advanceSeaTransportWeek(run.state, run.context).aircraftDelta ?? 0).toBe(0);
      }
      expect(run.context.stockpile.aircraft).toBe(1000 - spent);
      expect(run.state.records[0].aircraftLost).toBe(spent);
      totalLosses += spent;
    }
    expect(totalLosses).toBeGreaterThan(0);
  });
  it('retains the second escort when the lead is relieved and does not release its assignment', () => {
    let run = step(launch(layeredContext(), { ...selected, targetId: 'normandy' }));
    const id = run.state.operations[0].id;
    run = dispatchRelief(run, 'escort-three'); run = step(run);
    expect(run.state.operations[0].escortFleetIds).toEqual(['escort-three', 'escort-two']);
    expect(run.context.jointForces.fleets[1].assignmentId).toBe(id);
    expect(run.context.jointForces.fleets[0].assignmentId).toBe('nav-return-escort-one');
  });
  it('does not complete relief by calendar counter while the incoming fleet remains physically far away', () => {
    let run = dispatchRelief(step(launch(layeredContext(), { ...selected, targetId: 'normandy' })), 'escort-three');
    run.context.jointForces.fleets = run.context.jointForces.fleets.map((fleet) => fleet.id === 'escort-three' ? { ...fleet, navigation: { ...fleet.navigation!, cruiseKnots: 1 } } : fleet);
    run = step(run);
    expect(run.state.operations[0].pendingEscortRelief?.elapsedWeeks).toBe(1);
    expect(run.state.operations[0].escortFleetId).toBe('escort-one');
    expect(run.context.jointForces.fleets[0].assignmentId).toBe(run.state.operations[0].id);
  });
  it('does not heal or release an air group that another mission has acquired', () => {
    let run = launch(layeredContext(), selected);
    run.context.jointForces.airGroups = run.context.jointForces.airGroups.map((group) => group.id === 'patrol-one' ? { ...group, assignmentId: 'joint-other', readiness: 44 } : group);
    run = complete(run);
    expect(run.context.jointForces.airGroups[0]).toMatchObject({ assignmentId: 'joint-other', readiness: 44 });
    expect(run.context.jointForces.airGroups[1].assignmentId).toBeNull();
  });
  it('covers rescue vessels after assembly but before stranded troops are picked up', () => {
    let run = rescueWithRelief(stranded(layeredContext(), true));
    const strength = run.context.divisions[0].strength;
    const assembly = run.state.operations[0].rescue!.assemblyWeeks!;
    for (let index = 0; index < assembly; index += 1) run = step(run);
    expect(run.state.operations[0].stage).toBe('rescuing');
    expect(run.state.operations[0].escortFleetId).toBe('escort-one');
    expect(run.state.operations[0].pendingEscortRelief?.fleetId).toBe('escort-two');
    expect(getSeaTransportActiveProtection(run.state.operations[0], run.context)).toBeGreaterThan(0);
    expect(run.context.divisions[0].strength).toBe(strength);
    run = step(run); expect(run.state.operations[0].lastMessage).toContain('현장에서 엄호');
  });
  it('normalizes duplicate fleet/air claims across old and new rosters without adding resources', () => {
    const run = launch(layeredContext(), selected); const first = run.state.operations[0];
    const state = normalizeSeaTransportState({ ...run.state, operations: [first, { ...first, id: 'other', divisionId: 'other', escortFleetIds: ['escort-two', 'escort-three'], airGroupIds: ['patrol-one'] }] });
    expect(state.operations[1].escortFleetIds).toEqual(['escort-three']); expect(state.operations[1].airGroupIds).toEqual([]);
    expect(normalizeSeaTransportState(JSON.parse(JSON.stringify(state)))).toEqual(state);
  });
  it('applies enemy interdiction only to matching route segments', () => {
    let matchingLoss = 0; let baselineLoss = 0;
    for (let index = 0; index < 40; index += 1) {
      const input = context(); input.divisions = [{ ...input.divisions[0], id: `interdiction-${index}` }]; input.commandableDivisionIds = new Set([input.divisions[0].id]);
      input.territories = input.territories.map((territory) => territory.id === 'calais' ? { ...territory, controller: 'allies' } : territory);
      input.jointForces.theaterControl.europe = { sea: 60, air: 60, intelligence: 40, trend: 0, lastChangedWeek: 0 };
      const order = { ...plan, divisionId: input.divisions[0].id, targetId: 'calais' };
      const baseline = complete(launch(input, order)); const unrelated = complete(launch({ ...input, enemyInterdiction: { java_sea: 24 } }, order));
      const matching = complete(launch({ ...input, enemyInterdiction: { channel: 24 } }, order));
      expect(unrelated.state.records[0].convoysLost).toBe(baseline.state.records[0].convoysLost);
      baselineLoss += baseline.state.records[0].convoysLost; matchingLoss += matching.state.records[0].convoysLost;
    }
    expect(matchingLoss).toBeGreaterThan(baselineLoss);
  });
  it('supports explicit short-crossing ambush edges without contaminating other harbor traffic', () => {
    const pressure = { 'edge:belfast:britain': 20, channel: 10, invalid: Number.NaN };
    expect(getSeaTransportInterdictionPressure(['britain', 'belfast'], pressure)).toBe(20);
    expect(getSeaTransportInterdictionPressure(['belfast', 'britain'], pressure)).toBe(20);
    expect(getSeaTransportInterdictionPressure(['britain', 'normandy'], pressure)).toBe(0);
    expect(getSeaTransportInterdictionPressure(['britain', 'channel', 'calais'], pressure)).toBe(10);
    expect(getSeaTransportInterdictionPressure(['invalid'], pressure)).toBe(0);
  });
});
function dispatchRelief(run: ReturnType<typeof launch>, fleetId = 'escort-two') {
  const result = dispatchSeaTransportEscortRelief(run.state, run.state.operations[0].id, fleetId, run.context);
  expect(result.accepted, result.reason).toBe(true);
  return { state: result.state, context: apply(run.context, result), result };
}
function rescueWithRelief(run: ReturnType<typeof launch>, fleetId = 'escort-two') {
  const result = launchSeaTransportRescue(run.state, run.state.operations[0].id, run.context, fleetId);
  expect(result.accepted, result.reason).toBe(true);
  return { state: result.state, context: apply(run.context, result), result };
}

describe('mid-voyage escort reinforcement and timed relief', () => {
  it('quotes without mutation and immediately reserves/prices the incoming fleet without replacing the old escort', () => {
    const run = step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' }));
    const before = structuredClone(run.state); const forecast = forecastSeaTransportEscortRelief(run.state, run.state.operations[0].id, 'escort-two', run.context);
    expect(forecast).toMatchObject({ allowed: true, arrivalWeeks: 1, minimumWeeks: 1, commandCost: 2 });
    expect(forecast.fuelCost).toBeGreaterThanOrEqual(6);
    expect(run.state).toEqual(before);
    const sent = dispatchRelief(run); const operation = sent.state.operations[0];
    expect(operation).toMatchObject({ escortFleetId: 'escort-one', commandCost: 14, fuelCost: before.operations[0].fuelCost + forecast.fuelCost,
      pendingEscortRelief: { fleetId: 'escort-two', previousFleetId: 'escort-one', dispatchedWeek: 1, elapsedWeeks: 0, arrivalWeeks: 1 } });
    expect(sent.context.jointForces.fleets.slice(0, 2).map((fleet) => fleet.assignmentId)).toEqual([operation.id, operation.id]);
    expect(getSeaTransportBusyFleetIds(sent.state)).toEqual(new Set(['escort-one', 'escort-two']));
    expect(sent.result.convoyDelta).toBe(0); expect(sent.result.divisionUpdates).toEqual([]);
    expect(sent.result.gameDelta).toEqual({ commandPoints: -2, fuel: -forecast.fuelCost });
  });
  it('joins after a full weekly adjudication and releases the old fleet with fatigue preserved', () => {
    const before = step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' }));
    let run = dispatchRelief(before);
    expect(advanceSeaTransportWeek(run.state, run.context).state).toBe(run.state);
    run = step(run);
    expect(run.state.operations[0]).toMatchObject({ escortFleetId: 'escort-two', pendingEscortRelief: undefined,
      escortReliefHistory: [{ status: 'joined', elapsedWeeks: 1, resolvedWeek: 2 }] });
    expect(run.context.jointForces.fleets[0]).toMatchObject({ assignmentId: 'nav-return-escort-one', status: 'assigned', readiness: 97, organization: 88, ships: 12, navigation: { mode: 'returning' } });
    expect(run.context.jointForces.fleets[1]).toMatchObject({ assignmentId: run.state.operations[0].id, readiness: 82, organization: 78, ships: 12 });
    expect(run.state.operations[0].lastMessage).toContain('다음 주부터');
  });
  it('never grants protection retroactively on the arrival week across 40 hostile comparisons', () => {
    for (let index = 0; index < 40; index += 1) {
      const input = rotationContext(); input.divisions = [{ ...input.divisions[0], id: `rotate-${index}` }]; input.commandableDivisionIds = new Set([input.divisions[0].id]);
      input.jointForces.theaterControl.europe = { sea: 25, air: 25, intelligence: 35, trend: 0, lastChangedWeek: 0 };
      const bare = step(launch(input, { ...plan, divisionId: input.divisions[0].id, targetId: 'belfast' }));
      const sent = dispatchRelief(bare); const normalWeek = step(bare); const reliefWeek = step(sent);
      expect(reliefWeek.state.operations[0].convoysRemaining).toBe(normalWeek.state.operations[0].convoysRemaining);
      expect(reliefWeek.context.divisions[0]).toEqual(normalWeek.context.divisions[0]);
      expect(reliefWeek.state.operations[0].escortFleetId).toBe('escort-two');
    }
  });
  it('supports an unescorted voyage and records full costs/history on actual completion', () => {
    let run = step(launch(rotationContext(), { ...plan, targetId: 'belfast' }));
    run = complete(dispatchRelief(run));
    expect(run.state.records[0]).toMatchObject({ escortFleetId: 'escort-two', commandCost: 7,
      escortReliefHistory: [{ source: 'reinforcement', status: 'joined' }] });
    run = returnFleets(run);
    expect(run.context.jointForces.fleets[1]).toMatchObject({ assignmentId: null, readiness: 79, ships: 12 });
    expect(run.context.stockpile.convoys).toBe(100);
  });
  it('allows a subsequent replacement only after the earlier rendezvous completes', () => {
    let run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    expect(dispatchSeaTransportEscortRelief(run.state, run.state.operations[0].id, 'escort-three', run.context).accepted).toBe(false);
    run = step(run); run = dispatchRelief(run, 'escort-three'); run = step(run);
    expect(run.state.operations[0].escortFleetId).toBe('escort-three');
    expect(run.state.operations[0].escortReliefHistory?.map((item) => item.status)).toEqual(['joined', 'joined']);
  });
  it('cancels incoming movement when a pre-embarkation recall ends the transport, without refunding dispatch', () => {
    let run = dispatchRelief(launch(rotationContext(), { ...plan, targetId: 'belfast', escortFleetId: 'escort-one' }));
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, 0); run = step(run);
    expect(run.state.operations).toHaveLength(0);
    expect(run.state.records[0]).toMatchObject({ commandCost: 9, escortReliefHistory: [{ status: 'cancelled' }] });
    expect(run.state.records[0].fuelCost).toBeGreaterThanOrEqual(22);
    expect(run.context.jointForces.fleets.slice(0, 2).every((fleet) => fleet.navigation?.mode === 'returning')).toBe(true);
    expect(run.context.jointForces.fleets[1].readiness).toBe(82);
    expect(run.result.gameDelta).toEqual({}); expect(run.context.stockpile.convoys).toBe(100);
  });
  it('releases incoming ships if the final return ends before a long relief approach', () => {
    let run = step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' }));
    run.state = { ...run.state, operations: run.state.operations.map((operation) => ({ ...operation, stage: 'returning', returnTargetId: 'britain', returnWeeks: 2, stageWeeks: 1 })) };
    run = dispatchRelief(run);
    run.state.operations[0].pendingEscortRelief!.arrivalWeeks = 3;
    run = step(run);
    expect(run.state.records[0].escortReliefHistory?.[0].status).toBe('cancelled');
    expect(run.context.jointForces.fleets[1].assignmentId).toBe('nav-return-escort-two');
  });
  it('does not retroactively count skipped calendar dates as several approach weeks', () => {
    let run = dispatchRelief(step(launch(rotationContext())));
    run.state.operations[0].pendingEscortRelief!.arrivalWeeks = 3;
    run = step(run, 25);
    expect(run.state.operations[0].pendingEscortRelief?.elapsedWeeks).toBe(1);
    expect(run.state.operations[0].escortFleetId).toBeUndefined();
  });
  it.each([
    { canCommandEscort: false }, { processingWeek: true }, { commandableDivisionIds: new Set<string>() }, { nationId: 'usa' as const },
    { week: -1 }, { week: Number.NaN },
  ])('rejects invalid command context %j without spending', (override) => {
    const run = step(launch(rotationContext())); const result = dispatchSeaTransportEscortRelief(run.state, run.state.operations[0].id, 'escort-two', { ...run.context, ...override });
    expect(result.accepted).toBe(false); expect(result.gameDelta).toEqual({}); expect(result.fleetUpdates).toBeUndefined();
  });
  it('rejects depleted resources, current escorts, missing fleets and no-longer-needed disembarkation', () => {
    const run = step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })); const id = run.state.operations[0].id;
    expect(dispatchSeaTransportEscortRelief(run.state, id, 'escort-one', run.context).accepted).toBe(false);
    expect(dispatchSeaTransportEscortRelief(run.state, id, 'missing', run.context).accepted).toBe(false);
    for (const game of [{ ...run.context.game, fuel: 0 }, { ...run.context.game, commandPoints: 0 }]) expect(dispatchSeaTransportEscortRelief(run.state, id, 'escort-two', { ...run.context, game }).accepted).toBe(false);
    run.state.operations[0].stage = 'disembarking'; expect(dispatchSeaTransportEscortRelief(run.state, id, 'escort-two', run.context).accepted).toBe(false);
  });
  it('blocks another voyage even when given a stale ready copy of the pending fleet', () => {
    const run = dispatchRelief(step(launch(rotationContext())));
    const stale = rotationContext(); stale.divisions = [{ ...stale.divisions[0], id: 'second' }]; stale.commandableDivisionIds = new Set(['second']);
    expect(launchSeaTransport(run.state, { ...plan, divisionId: 'second', escortFleetId: 'escort-two' }, stale).accepted).toBe(false);
  });
  it('keeps old protection when incoming ships are gone, and does not manufacture hulls', () => {
    let run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    run.context.jointForces.fleets = run.context.jointForces.fleets.map((fleet) => fleet.id === 'escort-two' ? { ...fleet, ships: 0 } : fleet);
    run = step(run);
    expect(run.state.operations[0]).toMatchObject({ escortFleetId: 'escort-one', pendingEscortRelief: undefined, escortReliefHistory: [{ status: 'lost' }] });
    expect(run.context.jointForces.fleets[1]).toMatchObject({ ships: 0, status: 'refit', assignmentId: null });
  });
  it('still relieves an old escort whose last ship was lost and releases it to refit', () => {
    let run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    run.context.jointForces.fleets = run.context.jointForces.fleets.map((fleet) => fleet.id === 'escort-one' ? { ...fleet, ships: 0 } : fleet);
    run = step(run);
    expect(run.state.operations[0].escortFleetId).toBe('escort-two');
    expect(run.context.jointForces.fleets[0]).toMatchObject({ ships: 0, assignmentId: null, status: 'refit' });
  });
  it('never steals a pending fleet that another assignment actually owns', () => {
    let run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    run.context.jointForces.fleets = run.context.jointForces.fleets.map((fleet) => fleet.id === 'escort-two' ? { ...fleet, assignmentId: 'joint-other' } : fleet);
    run = step(run);
    expect(run.state.operations[0].escortFleetId).toBe('escort-one');
    expect(run.state.operations[0].escortReliefHistory?.[0].status).toBe('cancelled');
    expect(run.context.jointForces.fleets[1]).toMatchObject({ assignmentId: 'joint-other', readiness: 85 });
  });
  it('holds both commitments without charging/healing/moving them after a nationality change', () => {
    const run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    const next = step({ ...run, context: { ...run.context, nationId: 'usa' } });
    expect(next.result.fleetUpdates).toBeUndefined(); expect(next.result.convoyDelta).toBe(0);
    expect(next.state.operations[0].pendingEscortRelief?.elapsedWeeks).toBe(0);
  });
  it('normalizes malformed/duplicate pending claims while preserving valid reservations and history', () => {
    const run = dispatchRelief(step(launch(rotationContext(), { ...plan, escortFleetId: 'escort-one' })));
    const valid = normalizeSeaTransportState(run.state); expect(valid.operations[0].pendingEscortRelief).toEqual(run.state.operations[0].pendingEscortRelief);
    const bad = structuredClone(run.state); bad.operations[0].pendingEscortRelief!.arrivalWeeks = Number.NaN;
    expect(normalizeSeaTransportState(bad).operations[0].pendingEscortRelief).toBeUndefined();
    const duplicate = structuredClone(run.state); duplicate.operations.push({ ...duplicate.operations[0], id: 'second-op', divisionId: 'second', escortFleetId: 'escort-two', pendingEscortRelief: undefined });
    const cleaned = normalizeSeaTransportState(duplicate); expect(cleaned.operations[0].pendingEscortRelief).toBeUndefined(); expect(cleaned.operations[1].escortFleetId).toBe('escort-two');
    const joined = step(run); expect(normalizeSeaTransportState(joined.state).operations[0].escortReliefHistory).toEqual(joined.state.operations[0].escortReliefHistory);
  });
});

describe('optional rescue convoy escort selection', () => {
  it('includes selected escort costs and locks it immediately but waits for the actual rescue rendezvous', () => {
    const original = stranded(rotationContext(), true); const id = original.state.operations[0].id;
    const quote = forecastSeaTransportRescue(original.state, id, original.context, 'escort-two');
    expect(quote).toMatchObject({ allowed: true, commandCost: 6, escort: { fleetId: 'escort-two' } });
    expect(quote.fuelCost).toBeGreaterThanOrEqual(14);
    let run = rescueWithRelief(original);
    expect(run.state.operations[0]).toMatchObject({ escortFleetId: 'escort-one', pendingEscortRelief: { arrivalWeeks: quote.outboundWeeks, source: 'rescue' } });
    run = step(run); expect(run.state.operations[0]).toMatchObject({ stage: 'rescuing', escortFleetId: 'escort-one', pendingEscortRelief: { elapsedWeeks: 1 } });
    for (let index = 1; index < quote.outboundWeeks; index += 1) run = step(run);
    expect(run.state.operations[0]).toMatchObject({ stage: 'returning', escortFleetId: 'escort-two', pendingEscortRelief: undefined });
    expect(run.context.jointForces.fleets[0].assignmentId).toBe('nav-return-escort-one');
    run = complete(run); expect(run.state.records[0]).toMatchObject({ rescueDispatches: 1, commandCost: 18, fuelCost: original.state.operations[0].fuelCost + quote.fuelCost, escortReliefHistory: [{ source: 'rescue', status: 'joined', elapsedWeeks: quote.outboundWeeks }] });
  });
  it('preserves undefined escort choice and denies current, unavailable, or unauthorized choices', () => {
    const run = stranded(rotationContext(), true); const id = run.state.operations[0].id;
    expect(forecastSeaTransportRescue(run.state, id, run.context).escort).toBeNull();
    expect(rescue(run).state.operations[0].escortFleetId).toBe('escort-one');
    for (const fleetId of ['escort-one', 'missing']) expect(launchSeaTransportRescue(run.state, id, run.context, fleetId).accepted).toBe(false);
    expect(launchSeaTransportRescue(run.state, id, { ...run.context, canCommandEscort: false }, 'escort-two').accepted).toBe(false);
    expect(launchSeaTransportRescue(run.state, id, { ...run.context, canCommandEscort: false }).accepted).toBe(true);
  });
  it('does not duplicate a pending relief; rescue without an additional choice preserves it', () => {
    const run = dispatchRelief(stranded(rotationContext(), true)); const id = run.state.operations[0].id;
    expect(launchSeaTransportRescue(run.state, id, run.context, 'escort-three').accepted).toBe(false);
    const keep = rescue(run); expect(keep.state.operations[0].pendingEscortRelief?.fleetId).toBe('escort-two');
  });
  it('cancels the accompanying relief when all rescue ships are lost before pickup', () => {
    let run = rescueWithRelief(stranded(rotationContext(), true));
    run.context.jointForces.theaterControl.europe = { sea: 0, air: 0, intelligence: 0, trend: 0, lastChangedWeek: 0 };
    run.state.operations[0].convoysRemaining = 0;
    const strength = run.context.divisions[0].strength; run = step(run);
    expect(run.state.operations[0]).toMatchObject({ stage: 'waiting-return', escortFleetId: 'escort-one', pendingEscortRelief: undefined, escortReliefHistory: [{ status: 'cancelled' }] });
    expect(run.context.jointForces.fleets[1].assignmentId).toBe('nav-return-escort-two'); expect(run.context.divisions[0].strength).toBe(strength);
  });
  it('does not activate rescue relief when every connected friendly destination is lost', () => {
    let run = rescueWithRelief(stranded(rotationContext(), true)); run = step(run);
    run.context.territories = run.context.territories.map((territory) => ({ ...territory, controller: 'axis' }));
    for (let index = 0; index < 5 && run.state.operations[0].stage === 'rescuing'; index += 1) run = step(run);
    expect(run.state.operations[0]).toMatchObject({ stage: 'waiting-return', escortFleetId: 'escort-one', pendingEscortRelief: undefined, escortReliefHistory: [{ status: 'cancelled' }] });
    expect(run.result.convoyDelta).toBe(0); expect(run.context.jointForces.fleets[1].assignmentId).toBe('nav-return-escort-two');
  });
  it('keeps rescue/escort movement frozen when rescue metadata is corrupted', () => {
    let run = rescueWithRelief(stranded(rotationContext(), true));
    run.state.operations[0].rescue!.routeIds = []; run = step(run);
    expect(run.result.fleetUpdates).toBeUndefined(); expect(run.result.convoyDelta).toBe(0);
    expect(run.state.operations[0].escortFleetId).toBe('escort-one'); expect(run.state.operations[0].pendingEscortRelief?.elapsedWeeks).toBe(0);
  });
});

describe('confirmed multiweek rescue dispatch and conservation', () => {
  it('previews without spending and takes two outbound plus two return weeks before refund', () => {
    const original = stranded(); const id = original.state.operations[0].id;
    const forecast = forecastSeaTransportRescue(original.state, id, original.context);
    expect(forecast).toMatchObject({ allowed: true, baseId: 'britain', convoyCost: 16, commandCost: 4, fuelCost: 8, minimumWeeks: 4 });
    const before = structuredClone(original.state); let run = rescue(original);
    expect(original.state).toEqual(before); expect(run.state.operations[0]).toMatchObject({ stage: 'rescuing', convoysReserved: 40, convoysRemaining: 16, commandCost: 14, fuelCost: 26, rescueDispatches: 1 });
    expect(run.context.stockpile.convoys).toBe(60); expect(run.result.divisionUpdates).toEqual([]);
    const sameWeek = advanceSeaTransportWeek(run.state, run.context); expect(sameWeek.convoyDelta).toBe(0); expect(sameWeek.state).toBe(run.state);
    run = step(run); expect(run.state.operations[0]).toMatchObject({ stage: 'rescuing', stageWeeks: 1 });
    run = step(run); expect(run.state.operations[0]).toMatchObject({ stage: 'returning', stageWeeks: 0 });
    expect(run.context.stockpile.convoys).toBe(60); expect(run.state.records).toHaveLength(0);
    run = step(run); expect(run.state.records).toHaveLength(0);
    run = step(run); expect(run.state.records[0]).toMatchObject({ outcome: 'recalled', convoysReserved: 40, convoysLost: 24, convoysReturned: 16, rescueDispatches: 1 });
    expect(run.context.stockpile.convoys).toBe(76); expect(run.context.game.commandPoints).toBe(86); expect(run.context.game.fuel).toBe(74);
  });
  it('rejects duplicate dispatch, non-stranded or surviving-convoy orders without any new spend', () => {
    const original = stranded(); const active = rescue(original); const id = original.state.operations[0].id;
    for (const state of [active.state, { ...original.state, operations: original.state.operations.map((operation) => ({ ...operation, convoysRemaining: 1 })) }, launch().state]) {
      const result = launchSeaTransportRescue(state, id, original.context);
      expect(result.accepted).toBe(false); expect(result.state).toBe(state); expect(result.convoyDelta).toBe(0); expect(result.gameDelta).toEqual({});
    }
  });
  it('requires current command authority, same allegiance, valid week, resources and connected coastal base', () => {
    const run = stranded(); const id = run.state.operations[0].id;
    for (const override of [
      { commandableDivisionIds: new Set<string>() }, { nationId: 'usa' as const }, { playerFaction: 'axis' as const },
      { processingWeek: true }, { week: 0 }, { week: Number.NaN }, { week: 1.5 }, { divisions: [] },
      { game: { ...run.context.game, commandPoints: 0 } }, { game: { ...run.context.game, fuel: 0 } },
      { stockpile: { ...run.context.stockpile, convoys: 15 } },
      { territories: run.context.territories.map((territory) => ({ ...territory, controller: 'axis' as const })) },
      { territories: run.context.territories.map((territory) => ({ ...territory, neighbors: [] })) },
    ]) {
      const result = launchSeaTransportRescue(run.state, id, { ...run.context, ...override });
      expect(result.accepted, JSON.stringify(override)).toBe(false); expect(result.convoyDelta).toBe(0);
    }
  });
  it('permits a humanitarian return after war ends without resuming the hostile landing', () => {
    let run = stranded(); run.context = { ...run.context, phase: 'nation' };
    run = complete(rescue(run));
    expect(run.state.records).toHaveLength(1); expect(run.context.divisions[0].territoryId).toBe('britain');
    expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('axis');
  });
  it('handles the loss of all safe ports after dispatch by retaining real reservations until one returns', () => {
    let run = rescue(stranded());
    run.context = { ...run.context, territories: run.context.territories.map((territory) => ({ ...territory, controller: 'axis' })) };
    run = step(step(run)); expect(run.state.operations[0].stage).toBe('waiting-return'); expect(run.context.stockpile.convoys).toBe(60);
    run = step(run); expect(run.state.records).toHaveLength(0); expect(run.result.convoyDelta).toBe(0);
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'belfast' ? { ...territory, controller: 'allies' } : territory) };
    run = complete(run); expect(run.state.records[0].arrivalId).toBe('belfast'); expect(run.context.stockpile.convoys).toBe(76);
  });
  it('does not wound the stranded troops before pickup and permits a later rescue attempt after fresh ship losses', () => {
    let run = rescue(stranded());
    run.context = { ...run.context, jointForces: { ...run.context.jointForces, theaterControl: { ...run.context.jointForces.theaterControl, europe: { sea: 0, air: 0, intelligence: 0, trend: 0, lastChangedWeek: 1 } } } };
    run.state = { ...run.state, operations: run.state.operations.map((operation) => ({ ...operation, convoysRemaining: 1 })) };
    const strength = run.context.divisions[0].strength; const supply = run.context.divisions[0].supply;
    run = step(run); expect(run.state.operations[0].stage).toBe('waiting-return');
    expect(run.context.divisions[0].strength).toBe(strength); expect(run.context.divisions[0].supply).toBe(supply);
    run = rescue(run); expect(run.state.operations[0]).toMatchObject({ convoysReserved: 56, convoysRemaining: 16, rescueDispatches: 2 });
    run.context.jointForces.theaterControl.europe = { sea: 100, air: 100, intelligence: 100, trend: 0, lastChangedWeek: run.context.week };
    run = complete(run); expect(run.state.records[0]).toMatchObject({ convoysReserved: 56, convoysReturned: 16, convoysLost: 40, rescueDispatches: 2 });
    expect(run.context.stockpile.convoys).toBe(60); expect(run.context.game.commandPoints).toBe(82);
  });
  it('keeps a rescue-bound escort exclusively assigned through pickup and actual safe return', () => {
    let run = rescue(stranded(contextWithEscort(), true));
    const id = run.state.operations[0].id;
    for (let index = 0; index < 3; index += 1) {
      run = step(run); expect(run.context.jointForces.fleets[0].assignmentId).toBe(id);
      run.state = normalizeSeaTransportState(JSON.parse(JSON.stringify(run.state)));
    }
    run = step(run); expect(run.context.jointForces.fleets[0].assignmentId).toBe('nav-return-escort-one');
    run = returnFleets(run); expect(run.context.jointForces.fleets[0].assignmentId).toBeNull();
    expect(run.state.records[0]).toMatchObject({ escortFleetId: 'escort-one', rescueDispatches: 1 });
  });
  it('preserves new saves and removes duplicate escorts/malformed optional rescue data without manufacturing resources', () => {
    const run = rescue(stranded(contextWithEscort(), true));
    expect(normalizeSeaTransportState(JSON.parse(JSON.stringify(run.state)))).toEqual(run.state);
    const operation = run.state.operations[0];
    const restored = normalizeSeaTransportState({ ...run.state, operations: [operation, { ...operation, id: 'second', divisionId: 'second', rescue: { dispatchedWeek: 'yesterday' } }] });
    expect(restored.operations).toHaveLength(2); expect(restored.operations[1].escortFleetId).toBeUndefined(); expect(restored.operations[1].rescue).toBeUndefined();
    const blocked = step({ ...run, state: { ...restored, operations: [{ ...restored.operations[0], rescue: undefined }] } });
    expect(blocked.state.operations[0].stage).toBe('rescuing'); expect(blocked.result.convoyDelta).toBe(0); expect(blocked.state.records).toHaveLength(0);
    expect(blocked.result.fleetUpdates).toBeUndefined(); expect(blocked.result.divisionUpdates).toEqual([]);
  });
});

describe('multiweek troop transport and landing', () => {
  it('takes four weeks for embarkation, sailing and actual friendly disembarkation', () => {
    let run = launch(context(), { ...plan, targetId: 'belfast' });
    const totalResources = run.context.stockpile.convoys + run.state.operations[0].convoysRemaining;
    for (let week = 1; week <= 3; week += 1) {
      run = step(run); expect(run.context.divisions[0].territoryId).toBe('britain'); expect(run.state.records).toHaveLength(0);
      expect(run.context.stockpile.convoys + run.state.operations[0].convoysRemaining).toBe(totalResources);
    }
    run = step(run); expect(run.context.divisions[0]).toMatchObject({ territoryId: 'belfast', status: 'ready' });
    expect(run.state.operations).toHaveLength(0); expect(run.state.records[0]).toMatchObject({ elapsedWeeks: 4, outcome: 'transferred', convoysReturned: 16 });
    expect(run.context.stockpile.convoys).toBe(100); expect(run.context.game.fuel).toBe(90);
  });
  it('needs seven weeks and changes control only after the second landing week', () => {
    let run = launch();
    for (let week = 1; week <= 4; week += 1) {
      run = step(run); expect(run.context.divisions[0].territoryId).toBe('britain');
      expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('axis');
    }
    run = step(run);
    expect(run.state.operations[0].stage).toBe('beachhead'); expect(run.context.divisions[0].territoryId).toBe('normandy');
    expect(getSeaTransportBusyDivisionIds(run.state).has('marine')).toBe(true);
    expect(getSeaTransportEmbarkedDivisionIds(run.state).has('marine')).toBe(false);
    expect(run.context.stockpile.convoys).toBe(76); expect(run.result.territoryUpdates[0]).toMatchObject({ controller: 'allies', ownerId: 'britain' });
    run = step(run); expect(run.state.operations[0].stage).toBe('beachhead');
    run = step(run); expect(run.state.operations).toHaveLength(0); expect(run.state.records[0]).toMatchObject({ outcome: 'landed', elapsedWeeks: 7 });
    expect(run.context.stockpile.convoys).toBe(100); expect(run.context.game.victoryScore).toBe(0);
  });
  it('repeated or backwards weeks cannot progress, refund or duplicate records', () => {
    let run = launch(context(), { ...plan, targetId: 'belfast' }); run = complete(run);
    const repeated = advanceSeaTransportWeek(run.state, run.context);
    expect(repeated.state).toBe(run.state); expect(repeated.convoyDelta).toBe(0); expect(repeated.divisionUpdates).toEqual([]);
    const backwards = advanceSeaTransportWeek(run.state, { ...run.context, week: 1 }); expect(backwards.state).toBe(run.state);
  });
  it('does not progress in its launch week or replay a large skipped week interval', () => {
    const run = launch(); expect(advanceSeaTransportWeek(run.state, run.context).state.operations[0].elapsedWeeks).toBe(0);
    const skipped = step(run, 50); expect(skipped.state.operations[0]).toMatchObject({ elapsedWeeks: 1, stage: 'sailing', stageWeeks: 0 });
    expect(skipped.state.records).toHaveLength(0);
  });
  it('independent convoys share no reservation and only one can newly capture the same beachhead', () => {
    const input = context(); input.divisions = [...input.divisions, { ...input.divisions[0], id: 'marine-two', name: '제2상륙사단' }];
    input.commandableDivisionIds = new Set(['marine', 'marine-two']);
    let run = launch(input); const second = launchSeaTransport(run.state, { ...plan, divisionId: 'marine-two' }, run.context);
    expect(second.accepted).toBe(true); run = { state: second.state, context: apply(run.context, second), result: second };
    expect(run.context.stockpile.convoys).toBe(52);
    let captures = 0;
    while (run.state.operations.length && run.context.week < 12) {
      run = step(run); captures += run.result.events.filter((event) => event.detail.includes('통제권을 확보했습니다')).length;
    }
    expect(captures).toBe(1); expect(run.state.records).toHaveLength(2); expect(run.context.stockpile.convoys).toBe(100);
    expect(run.state.records.map((record) => record.outcome).sort()).toEqual(['landed', 'transferred']);
  });
  it('weekly transitions do not mutate the previous operation, troops, territories or resource pool', () => {
    const run = launch(); const before = structuredClone({ state: run.state, divisions: run.context.divisions, territories: run.context.territories, stockpile: run.context.stockpile });
    step(run);
    expect({ state: run.state, divisions: run.context.divisions, territories: run.context.territories, stockpile: run.context.stockpile }).toEqual(before);
  });
  it('a friendly port lost in transit triggers a return, not an unapproved invasion', () => {
    let run = step(launch(context(), { ...plan, targetId: 'belfast' }));
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'belfast' ? { ...territory, controller: 'axis' } : territory) };
    run = step(run); expect(run.state.operations[0].stage).toBe('returning'); expect(run.result.territoryUpdates).toEqual([]);
    run = complete(run); expect(run.state.records[0].outcome).toBe('diverted'); expect(run.context.divisions[0].territoryId).toBe('britain');
  });
  it('a newly friendly landing target switches to disembarkation without duplicate conquest', () => {
    let run = launch(); for (let index = 0; index < 3; index += 1) run = step(run);
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'normandy' ? { ...territory, controller: 'allies', ownerId: 'usa' } : territory) };
    run = step(run); expect(run.state.operations[0].stage).toBe('disembarking'); expect(run.result.territoryUpdates).toEqual([]);
    run = step(run); expect(run.state.records[0].outcome).toBe('transferred');
    expect(run.context.territories.find((territory) => territory.id === 'normandy')?.ownerId).toBe('usa');
  });
  it('rechecks a newly friendly landing port again immediately before disembarking', () => {
    let run = launch(); for (let index = 0; index < 3; index += 1) run = step(run);
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'normandy' ? { ...territory, controller: 'allies' } : territory) };
    run = step(run); expect(run.state.operations[0].stage).toBe('disembarking');
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'normandy' ? { ...territory, controller: 'axis' } : territory) };
    run = step(run); expect(run.state.operations[0].stage).toBe('returning');
    expect(run.context.divisions[0].territoryId).toBe('britain'); expect(run.state.records).toHaveLength(0);
  });
  it('peace or neutralization during transit prevents conquest and retains real return travel', () => {
    for (const neutral of [false, true]) {
      let run = step(launch());
      run.context = { ...run.context, phase: neutral ? 'war' : 'nation', territories: run.context.territories.map((territory) => neutral && territory.id === 'normandy' ? { ...territory, controller: 'neutral' } : territory) };
      run = step(run); expect(run.state.operations[0].stage).toBe('returning'); expect(run.state.records).toHaveLength(0);
      expect(run.result.territoryUpdates).toEqual([]);
    }
  });
  it('failed landing returns surviving ships only and never captures the target', () => {
    const input = context(); input.jointForces.theaterControl.europe = { sea: 0, air: 0, intelligence: 0, trend: -1, lastChangedWeek: 0 };
    input.divisions = [{ ...input.divisions[0], strength: 60, organization: 60, supply: 60 }];
    input.territories = input.territories.map((territory) => territory.id === 'normandy' ? { ...territory, terrain: '요새', supply: 100 } : territory);
    const run = complete(launch(input));
    expect(run.state.records[0].outcome).toBe('failed-landing'); expect(run.state.records[0].convoysLost).toBeGreaterThan(0);
    expect(run.context.stockpile.convoys).toBe(100 - run.state.records[0].convoysLost);
    expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('axis');
    expect(run.context.divisions[0].territoryId).toBe('britain');
  });
});

describe('withdrawal, recovery and resource conservation', () => {
  it('keeps a predeparture garrison vulnerable and does not move it when its port falls', () => {
    let run = launch(); expect(getSeaTransportEmbarkedDivisionIds(run.state).has('marine')).toBe(false);
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'britain' ? { ...territory, controller: 'axis' } : territory) };
    run = step(run); expect(run.state.operations[0].stage).toBe('embarking'); expect(run.result.convoyDelta).toBe(0);
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, 1);
    run = step(run); expect(run.state.operations[0].stage).toBe('embarking'); expect(run.context.divisions[0].territoryId).toBe('britain');
  });
  it('cancels before departure at the real friendly retreat position rather than teleporting back', () => {
    let run = launch();
    run.context = { ...run.context, divisions: [{ ...run.context.divisions[0], territoryId: 'liverpool', status: 'recovering' }] };
    run = step(run); expect(run.state.records[0]).toMatchObject({ outcome: 'diverted', arrivalId: 'liverpool' });
    expect(run.context.divisions[0].territoryId).toBe('liverpool'); expect(run.result.convoyDelta).toBe(24);
  });
  it('withdrawal requests do not immediately mutate troops or refund spent resources', () => {
    const run = launch(); const state = requestSeaTransportReturn(run.state, run.state.operations[0].id, 0);
    expect(state.operations[0].returnRequestedWeek).toBe(0); expect(state.records).toHaveLength(0);
    const next = step({ ...run, state });
    expect(next.context.divisions[0].territoryId).toBe('britain'); expect(next.context.stockpile.convoys).toBe(100);
    expect(next.context.game.commandPoints).toBe(90); expect(next.context.game.fuel).toBe(82);
    expect(next.state.records[0].outcome).toBe('recalled');
  });
  it('recall at sea needs at least two return sailing weeks', () => {
    let run = step(launch()); run = step(run);
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, run.context.week);
    run = step(run); expect(run.state.operations[0].stage).toBe('returning'); expect(run.context.stockpile.convoys).toBe(76);
    run = step(run); expect(run.state.operations).toHaveLength(1);
    run = step(run); expect(run.state.records[0].outcome).toBe('recalled'); expect(run.context.stockpile.convoys).toBe(100);
  });
  it('finds another reachable friendly land endpoint if the departure port is lost', () => {
    let run = step(launch());
    run.context = { ...run.context, territories: run.context.territories.map((territory) => territory.id === 'britain' ? { ...territory, controller: 'axis' } : territory) };
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, 1);
    run = complete(run); expect(run.state.records[0].arrivalId).toBe('belfast'); expect(run.context.divisions[0].territoryId).toBe('belfast');
  });
  it('waits with reservations intact if no reachable friendly land remains', () => {
    let run = step(launch());
    run.context = { ...run.context, territories: run.context.territories.map((territory) => ({ ...territory, controller: 'axis' })) };
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, 1);
    run = step(run); expect(run.state.operations[0].stage).toBe('waiting-return'); expect(run.result.convoyDelta).toBe(0);
    run = step(run); expect(run.state.records).toHaveLength(0); expect(run.context.divisions[0].territoryId).toBe('britain');
    expect(getSeaTransportBusyDivisionIds(run.state).has('marine')).toBe(true);
  });
  it('withdrawing a landed unit does not arbitrarily give its beachhead back to the enemy', () => {
    let run = launch(); for (let index = 0; index < 5; index += 1) run = step(run);
    run.state = requestSeaTransportReturn(run.state, run.state.operations[0].id, run.context.week);
    run = complete(run);
    expect(run.state.records[0].outcome).toBe('recalled'); expect(run.context.divisions[0].territoryId).toBe('britain');
    expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('allies');
  });
  it('poor postlanding sea control reduces beachhead supply and eventually forces a real return', () => {
    let run = launch(); for (let index = 0; index < 5; index += 1) run = step(run);
    const landedSupply = run.context.divisions[0].supply;
    run.context = { ...run.context, jointForces: { ...run.context.jointForces, theaterControl: { ...run.context.jointForces.theaterControl, europe: { sea: 0, air: 0, intelligence: 0, trend: -1, lastChangedWeek: 5 } } } };
    run = step(run); expect(run.context.divisions[0].supply).toBeLessThan(landedSupply);
    run = complete(run); expect(run.state.records[0].outcome).toBe('failed-landing');
    expect(run.context.divisions[0].territoryId).toBe('britain');
    expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('allies');
  });
  it('respects a land-engine retreat from a contested beachhead instead of moving it again by sea', () => {
    let run = launch(); for (let index = 0; index < 5; index += 1) run = step(run);
    run.context = { ...run.context, divisions: [{ ...run.context.divisions[0], territoryId: 'liverpool', status: 'recovering' }] };
    run = step(run); expect(run.state.records[0]).toMatchObject({ outcome: 'failed-landing', arrivalId: 'liverpool' });
    expect(run.context.divisions[0].territoryId).toBe('liverpool'); expect(run.state.operations).toHaveLength(0);
  });
  it('does not refund missing troops or old-nationality reservations into a new nation', () => {
    const run = launch();
    for (const override of [{ divisions: [] }, { nationId: 'usa' as const }]) {
      const next = step({ ...run, context: { ...run.context, ...override } });
      expect(next.result.convoyDelta).toBe(0); expect(next.result.territoryUpdates).toEqual([]); expect(next.state.records).toHaveLength(0);
    }
  });
  it('normalization accepts genuine roundtrips and rejects duplicate or malformed reservations', () => {
    const run = launch(); const operation = run.state.operations[0];
    expect(normalizeSeaTransportState(JSON.parse(JSON.stringify(run.state)))).toEqual(run.state);
    expect(normalizeSeaTransportState({ version: 1, operations: [operation, operation], records: [] }).operations).toHaveLength(1);
    expect(normalizeSeaTransportState({ version: 1, operations: [{ ...operation, convoysRemaining: 1000 }], records: [] }).operations).toHaveLength(0);
    expect(normalizeSeaTransportState({ version: 1, operations: [{ ...operation, stage: 'instant-capture' }], records: [] }).operations).toHaveLength(0);
    expect(normalizeSeaTransportState(null)).toEqual(createSeaTransportState());
    const finished = complete(run);
    expect(normalizeSeaTransportState({ ...finished.state, operations: [operation] }).operations).toHaveLength(0);
  });
});

// These are focused pure-engine scenarios, not full campaigns or human playtests.
// They deliberately exclude the separate economy/recovery/land AI engines.
const controlCases = [0, 25, 60, 100].flatMap((sea) => [0, 25, 60, 100].flatMap((air) =>
  (['transfer', 'landing'] as const).flatMap((mode) => [0, 10].map((startedWeek) => ({ sea, air, mode, startedWeek })))));
describe('64 deterministic sea/air-control scenarios with JSON save/resume', () => {
  it.each(controlCases)('$mode with sea=$sea air=$air start=$startedWeek conserves reservations and never captures early', ({ sea, air, mode, startedWeek }) => {
    const input = context(); input.week = startedWeek; input.game.week = startedWeek;
    input.phase = mode === 'transfer' ? 'nation' : 'war';
    input.jointForces.theaterControl.europe = { sea, air, intelligence: 60, trend: 0, lastChangedWeek: startedWeek };
    let run = launch(input, { ...plan, targetId: mode === 'transfer' ? 'belfast' : 'normandy' });
    const initialConvoys = input.stockpile.convoys;
    for (let iteration = 0; iteration < 20 && run.state.operations.length; iteration += 1) {
      if (iteration % 2 === 0) {
        const operationIds = run.state.operations.map((operation) => operation.id);
        run.state = normalizeSeaTransportState(JSON.parse(JSON.stringify(run.state)));
        expect(run.state.operations.map((operation) => operation.id)).toEqual(operationIds);
      }
      run = step(run);
      const activeRemaining = run.state.operations.reduce((sum, operation) => sum + operation.convoysRemaining, 0);
      const activeLost = run.state.operations.reduce((sum, operation) => sum + operation.convoysReserved - operation.convoysRemaining, 0);
      const resolvedLost = run.state.records.reduce((sum, record) => sum + record.convoysLost, 0);
      expect(run.context.stockpile.convoys + activeRemaining + activeLost + resolvedLost).toBe(initialConvoys);
      expect(run.context.stockpile.convoys).toBeGreaterThanOrEqual(0);
      for (const operation of run.state.operations) {
        expect(operation.convoysRemaining).toBeGreaterThanOrEqual(0);
        expect(operation.convoysRemaining).toBeLessThanOrEqual(operation.convoysReserved);
      }
      for (const record of run.state.records) expect(record.convoysReturned + record.convoysLost).toBe(record.convoysReserved);
      if (mode === 'landing' && run.context.week - startedWeek < 5) {
        expect(run.context.territories.find((territory) => territory.id === 'normandy')?.controller).toBe('axis');
        expect(run.context.divisions[0].territoryId).toBe('britain');
      }
      if (mode === 'transfer' && run.context.week - startedWeek < 4) expect(run.context.divisions[0].territoryId).toBe('britain');
      const repeated = advanceSeaTransportWeek(run.state, run.context);
      expect(repeated.state).toBe(run.state); expect(repeated.convoyDelta).toBe(0); expect(repeated.events).toEqual([]);
    }
    expect(run.state.records.length + run.state.operations.length).toBe(1);
    expect(run.context.game.commandPoints).toBe(input.game.commandPoints - (mode === 'landing' ? 10 : 5));
    expect(run.context.game.fuel).toBe(input.game.fuel - (mode === 'landing' ? 18 : 10));
    expect(new Set(run.state.records.map((record) => record.operationId)).size).toBe(run.state.records.length);
  });
});
