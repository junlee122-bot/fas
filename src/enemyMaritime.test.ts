import { describe, expect, it } from 'vitest';
import { advanceEnemyMaritimeWeek, applyEnemyMaritimeFleetUpdates, createEnemyMaritimeState, getEnemyMaritimeCounterPressure, getEnemyMaritimeInterdiction, getEnemyMaritimeInterdictionByRoute, getEnemyMaritimePlans, normalizeEnemyMaritimeState, reconcileEnemyMaritimeAssignments, type EnemyMaritimeContext, type EnemyMaritimeState } from './enemyMaritime';
import { createJointForcesState, type ActiveJointOperation } from './jointOperations';
import { createFleetNavigation } from './navalNavigation';
import { createSeaTransportState, type SeaTransportOperation } from './seaTransport';
import type { Territory } from './types';
import { territories as campaignTerritories } from './data';

const port = (id: string, patch: Partial<Territory> = {}): Territory => ({ id, name: id, region: '시험 해역', theater: 'europe', controller: 'axis', ownerId: 'germany', siteType: 'port', x: 0, y: 0, supply: 80, value: 5, terrain: '해안', neighbors: ['northsea'], ...patch });
export function enemyContext(kind: 'transport' | 'landing' | 'interdiction' = 'transport'): EnemyMaritimeContext {
  const jointForces = createJointForcesState('britain');
  const fleet = { ...jointForces.opponent.fleets[0], kind: 'surface' as const, location: 'hamburg', ships: 24, readiness: 90, organization: 90, status: 'ready' as const, assignmentId: null };
  fleet.navigation = createFleetNavigation(fleet);
  jointForces.opponent.fleets = [fleet];
  jointForces.theaterControl.europe = { air: 20, sea: 20, intelligence: 20, trend: 0, lastChangedWeek: 0 };
  const seaTransport = createSeaTransportState();
  if (kind === 'interdiction') seaTransport.operations = [{ id: 'sea-player', divisionId: 'moving', stage: 'sailing', routeIds: ['hamburg', 'northsea'] } as SeaTransportOperation];
  const territories = [port('hamburg'), port('northsea', { siteType: 'sea', controller: 'neutral', ownerId: undefined, neighbors: ['hamburg', 'norway', 'britain'] }),
    ...(kind === 'transport' ? [port('norway', { supply: 20 })] : kind === 'landing' ? [port('britain', { controller: 'allies', ownerId: 'britain', supply: 10, value: 20 })] : [])];
  return { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war', territories, divisions: [], jointForces, seaTransport };
}
function step(state: EnemyMaritimeState, context: EnemyMaritimeContext) {
  const result = advanceEnemyMaritimeWeek(state, context);
  const territories = new Map(result.territoryUpdates.map((site) => [site.id, site]));
  const divisions = new Map(result.divisionUpdates.map((division) => [division.id, division]));
  return { state: result.state, result, context: { ...context, week: context.week + 1, territories: context.territories.map((site) => territories.get(site.id) ?? site),
    divisions: context.divisions.map((division) => divisions.get(division.id) ?? division), jointForces: applyEnemyMaritimeFleetUpdates(context.jointForces, result.opponentFleetUpdates) } };
}
function run(context: EnemyMaritimeContext, state = createEnemyMaritimeState('britain'), weeks = 35) {
  let tick = step(state, context);
  for (let index = 1; index < weeks && !tick.state.records.length; index++) tick = step(tick.state, tick.context);
  return tick;
}

describe('enemy maritime real campaigns', () => {
  it('plans a constrained supply route, spends stocks and cannot deliver immediately', () => {
    const context = enemyContext(); const state = createEnemyMaritimeState('britain');
    const plan = getEnemyMaritimePlans(state, context)[0]; expect(plan.kind).toBe('transport'); expect(plan.routeIds).toEqual(['hamburg', 'northsea', 'norway']);
    const next = step(state, context);
    expect(next.state.operations[0].stage).toBe('preparing'); expect(next.state.convoys).toBeLessThan(state.convoys); expect(next.state.fuel).toBeLessThan(state.fuel);
    expect(next.result.territoryUpdates.find((site) => site.id === 'hamburg')?.supply).toBe(64);
    expect(next.result.territoryUpdates.some((site) => site.id === 'norway')).toBe(false);
    expect(next.context.jointForces.opponent.fleets[0].assignmentId).toMatch(/^enemy-sea-/);
  });
  it('delivers actual surviving cargo and keeps reservation until physical return and refueling', () => {
    const complete = run(enemyContext());
    expect(complete.state.records[0]?.outcome).toBe('delivered');
    expect(complete.context.territories.find((site) => site.id === 'norway')!.supply).toBeGreaterThan(20);
    expect(complete.state.records[0].endedWeek - complete.state.records[0].startedWeek).toBeGreaterThanOrEqual(6);
    expect(complete.context.jointForces.opponent.fleets[0].navigation?.mode).toBe('in-port');
    expect(complete.context.jointForces.opponent.fleets[0].navigation?.remainingRangeNm).toBe(8000);
  });
  it('can land on an undefended enemy coastal node only after voyage and multiple battle weeks', () => {
    let tick = step(createEnemyMaritimeState('britain'), enemyContext('landing')); let landWeeks = 0; let captureWeek = -1;
    for (let index = 0; index < 35 && !tick.state.records.length; index++) {
      if (tick.state.operations.some((operation) => operation.stage === 'landing')) landWeeks++;
      if (tick.context.territories.find((site) => site.id === 'britain')!.controller === 'axis' && captureWeek < 0) captureWeek = tick.context.week;
      tick = step(tick.state, tick.context);
    }
    expect(tick.state.records[0]?.outcome).toBe('captured'); expect(landWeeks).toBeGreaterThanOrEqual(2); expect(captureWeek).toBeGreaterThan(4);
    expect(tick.context.territories.find((site) => site.id === 'britain')!.ownerId).toBe('germany');
  });
  it('real garrisons repel landings and are not teleported or erased', () => {
    const context = enemyContext('landing'); context.divisions = [{ id: 'guard', name: '항구 수비대', type: 'infantry', strength: 95, organization: 95, supply: 80, territoryId: 'britain', commanderId: '', experience: 50, status: 'ready' }];
    const complete = run(context);
    expect(complete.state.records[0]?.outcome).toBe('repelled'); expect(complete.context.territories.find((site) => site.id === 'britain')!.controller).toBe('allies');
    expect(complete.context.divisions[0].territoryId).toBe('britain'); expect(complete.context.divisions[0].strength).toBeGreaterThan(70);
  });
  it('interdicts only a shared real sea node, not every convoy in the theater', () => {
    let tick = step(createEnemyMaritimeState('britain'), enemyContext('interdiction'));
    for (let index = 0; index < 15 && !getEnemyMaritimeInterdiction(tick.state, ['northsea']); index++) tick = step(tick.state, tick.context);
    expect(tick.state.operations[0]?.kind).toBe('interdiction'); expect(getEnemyMaritimeInterdiction(tick.state, ['northsea'])).toBeGreaterThan(0);
    expect(getEnemyMaritimeInterdiction(tick.state, ['hamburg'])).toBe(0); expect(getEnemyMaritimeInterdiction(tick.state, ['coral_sea'])).toBe(0);
    expect(getEnemyMaritimeInterdictionByRoute(tick.state).northsea).toBeLessThanOrEqual(24);
  });
  it('can ambush a short water crossing without applying pressure to every route through the same port', () => {
    const context = enemyContext('landing');
    context.territories = [...context.territories.map((site) => site.id === 'britain' ? { ...site, value: 0, neighbors: [...site.neighbors, 'belfast'] } : site),
      port('belfast', { controller: 'allies', ownerId: 'britain', value: 0, neighbors: ['britain'] })];
    context.seaTransport.operations = [{ id: 'sea-short', divisionId: 'moving', stage: 'sailing', routeIds: ['britain', 'belfast'] } as SeaTransportOperation];
    const plan = getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)[0];
    expect(plan.kind).toBe('interdiction'); expect(plan.interdictionKeys).toEqual(['edge:belfast:britain']);
    let tick = step(createEnemyMaritimeState('britain'), context);
    for (let index = 0; index < 15 && !getEnemyMaritimeInterdiction(tick.state, ['britain', 'belfast']); index++) tick = step(tick.state, tick.context);
    expect(getEnemyMaritimeInterdiction(tick.state, ['britain', 'belfast'])).toBeGreaterThan(0);
    expect(getEnemyMaritimeInterdiction(tick.state, ['britain', 'liverpool'])).toBe(0);
    expect(getEnemyMaritimeInterdiction(tick.state, ['britain'])).toBe(0);
  });
  it('does not generate neutral/inland landings or routes through inland intermediates', () => {
    const context = enemyContext('landing'); context.territories = context.territories.map((site) => site.id === 'britain' ? { ...site, controller: 'neutral' } : site);
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)).toEqual([]);
    context.territories = [port('hamburg', { neighbors: ['inland'] }), port('inland', { siteType: 'city', neighbors: ['britain'] }), port('britain', { controller: 'allies', supply: 10 })];
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)).toEqual([]);
  });
  it('refuses unknown coordinates and sorties beyond round-trip fleet endurance', () => {
    const context = enemyContext(); context.jointForces.opponent.fleets[0].navigation!.remainingRangeNm = 100;
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)).toEqual([]);
    context.jointForces.opponent.fleets[0] = { ...context.jointForces.opponent.fleets[0], location: 'unmapped harbor', navigation: undefined };
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)).toEqual([]);
  });
  it('does not borrow ships from existing joint AI missions', () => {
    const context = enemyContext(); context.jointForces.opponent.fleets[0].assignmentId = 'enemy-joint-existing';
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain'), context)).toEqual([]);
    const tick = step(createEnemyMaritimeState('britain'), context);
    expect(tick.context.jointForces.opponent.fleets[0].assignmentId).toBe('enemy-joint-existing'); expect(tick.state.operations).toEqual([]);
  });
  it('a stale voyage cannot release or tick a fleet that was reassigned to a valid joint operation', () => {
    const started = step(createEnemyMaritimeState('britain'), enemyContext());
    const fleet = { ...started.context.jointForces.opponent.fleets[0], assignmentId: 'enemy-joint-other' };
    started.context.jointForces.opponent.fleets = [fleet];
    started.context.jointForces.opponent.operations = [{ id: 'enemy-joint-other', fleetIds: [fleet.id], airGroupIds: [] } as never];
    const tick = step(started.state, started.context);
    expect(tick.context.jointForces.opponent.fleets[0]).toEqual(fleet);
    expect(tick.result.opponentFleetUpdates).toHaveLength(0);
    expect(tick.state.operations).toHaveLength(0);
  });
  it('peace aborts attacks and removes route pressure without seizing targets', () => {
    let tick = step(createEnemyMaritimeState('britain'), enemyContext('landing'));
    tick.context.phase = 'nation';
    for (let index = 0; index < 25; index++) tick = step(tick.state, tick.context);
    expect(tick.state.operations).toHaveLength(0); expect(tick.state.records[0].outcome).toBe('aborted'); expect(tick.context.territories.find((site) => site.id === 'britain')!.controller).toBe('allies');
    expect(getEnemyMaritimeInterdictionByRoute(tick.state)).toEqual({});
  });
  it('checks target ownership again on arrival', () => {
    let tick = step(createEnemyMaritimeState('britain'), enemyContext('landing'));
    tick.context.territories = tick.context.territories.map((site) => site.id === 'britain' ? { ...site, controller: 'neutral' } : site);
    for (let index = 0; index < 30 && !tick.state.records.length; index++) tick = step(tick.state, tick.context);
    expect(tick.state.records[0]?.outcome).toBe('aborted'); expect(tick.context.territories.find((site) => site.id === 'britain')!.controller).toBe('neutral');
  });
});

describe('enemy maritime intelligence, persistence and counterplay', () => {
  it('same week is idempotent and loading does not refund reservations', () => {
    const context = enemyContext(); const tick = step(createEnemyMaritimeState('britain'), context);
    expect(advanceEnemyMaritimeWeek(tick.state, context).state).toBe(tick.state);
    const normalized = normalizeEnemyMaritimeState(JSON.parse(JSON.stringify(tick.state)), 'britain'); expect(normalized).toEqual(tick.state);
    expect(reconcileEnemyMaritimeAssignments(context.jointForces, normalized).opponent.fleets[0].assignmentId).toBe(normalized.operations[0].id);
    expect(normalized.convoys).toBe(tick.state.convoys);
  });
  it('rejects duplicate malformed reservations and never steals an externally assigned fleet on restore', () => {
    const context = enemyContext(); const tick = step(createEnemyMaritimeState('britain'), context);
    const bad = { ...tick.state, convoys: -4, fuel: Infinity, operations: [...tick.state.operations, { ...tick.state.operations[0], id: 'enemy-sea-duplicate' }] };
    const normalized = normalizeEnemyMaritimeState(bad, 'britain'); expect(normalized.operations).toHaveLength(1); expect(normalized.convoys).toBe(0); expect(normalized.fuel).toBe(0);
    context.jointForces.opponent.fleets[0].assignmentId = 'another-owner';
    expect(reconcileEnemyMaritimeAssignments(context.jointForces, normalized).opponent.fleets[0].assignmentId).toBe('another-owner');
  });
  it('only surviving correctly assigned same-theater formations provide counterpressure', () => {
    const context = enemyContext(); const player = context.jointForces;
    const operation: ActiveJointOperation = { id: 'patrol', templateId: 'atlantic-lifeline', kind: 'convoy-escort', name: '시험 순찰', theater: 'europe', startedWeek: 0, elapsedWeeks: 0, minimumWeeks: 3, maximumWeeks: 6, progress: 0, successChance: 80, fleetIds: player.fleets.map((fleet) => fleet.id), airGroupIds: player.airGroups.map((air) => air.id), status: 'active' };
    player.operations = [operation]; expect(getEnemyMaritimeCounterPressure(context, 'europe')).toBe(0);
    player.fleets = player.fleets.map((fleet) => ({ ...fleet, status: 'assigned', assignmentId: 'patrol' })); player.airGroups = player.airGroups.map((air) => ({ ...air, status: 'assigned', assignmentId: 'patrol' }));
    expect(getEnemyMaritimeCounterPressure(context, 'europe')).toBeGreaterThan(25); expect(getEnemyMaritimeCounterPressure(context, 'asia')).toBe(0);
    player.fleets = player.fleets.map((fleet) => ({ ...fleet, ships: 0 })); player.airGroups = player.airGroups.map((air) => ({ ...air, aircraft: 0 }));
    expect(getEnemyMaritimeCounterPressure(context, 'europe')).toBe(0);
  });
  it('patrols weaken and force early withdrawal of matched interdiction', () => {
    let tick = step(createEnemyMaritimeState('britain'), enemyContext('interdiction'));
    for (let index = 0; index < 12 && tick.state.operations[0]?.stage !== 'interdicting'; index++) tick = step(tick.state, tick.context);
    const unopposed = step(tick.state, tick.context);
    const player = structuredClone(tick.context.jointForces); const id = 'patrol';
    player.operations = [{ id, kind: 'convoy-escort', theater: 'europe', fleetIds: player.fleets.map((fleet) => fleet.id), airGroupIds: player.airGroups.map((air) => air.id) } as ActiveJointOperation];
    player.fleets = player.fleets.map((fleet) => ({ ...fleet, status: 'assigned', assignmentId: id, readiness: 100, organization: 100 }));
    player.airGroups = player.airGroups.map((air) => ({ ...air, status: 'assigned', assignmentId: id, readiness: 100, serviceability: 100 }));
    const opposed = step(tick.state, { ...tick.context, jointForces: player });
    expect(getEnemyMaritimeInterdiction(opposed.state, ['northsea'])).toBeLessThan(getEnemyMaritimeInterdiction(unopposed.state, ['northsea']));
    expect(opposed.state.operations[0].stage).toBe('returning');
  });
  it('bounded stocks never become negative across an extended campaign', () => {
    let tick = step(createEnemyMaritimeState('britain', 52), enemyContext('landing'));
    for (let index = 0; index < 120; index++) {
      tick = step(tick.state, tick.context);
      expect(tick.state.convoys).toBeGreaterThanOrEqual(0); expect(tick.state.convoys).toBeLessThanOrEqual(96); expect(tick.state.fuel).toBeGreaterThanOrEqual(0); expect(tick.state.fuel).toBeLessThanOrEqual(180); expect(tick.state.landingReserve).toBeGreaterThanOrEqual(0);
    }
  });
  it('different persisted seeds select varied valid futures reproducibly', () => {
    const context = enemyContext('landing'); context.territories = [...context.territories, port('belfast', { controller: 'allies', ownerId: 'britain', supply: 10, value: 20 }), port('liverpool', { controller: 'allies', ownerId: 'britain', supply: 10, value: 20 })];
    context.territories = context.territories.map((site) => site.id === 'northsea' ? { ...site, neighbors: [...site.neighbors, 'belfast', 'liverpool'] } : site);
    const outcomes = new Set(Array.from({ length: 30 }, (_, seed) => getEnemyMaritimePlans(createEnemyMaritimeState('britain', seed), context)[0].targetId));
    expect(outcomes.size).toBeGreaterThan(1);
    expect(getEnemyMaritimePlans(createEnemyMaritimeState('britain', 19), context)).toEqual(getEnemyMaritimePlans(createEnemyMaritimeState('britain', 19), context));
  });
  it('can plan against all 13 playable countries using the real 1942 map without inventing ships or ports', () => {
    const nationIds = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'] as const;
    for (const nationId of nationIds) {
      const context: EnemyMaritimeContext = { ...enemyContext(), nationId, playerFaction: ['germany', 'japan', 'italy'].includes(nationId) ? 'axis' : 'allies', territories: campaignTerritories, jointForces: createJointForcesState(nationId) };
      const plans = getEnemyMaritimePlans(createEnemyMaritimeState(nationId), context);
      expect(plans.length, `${nationId} opponent ${context.jointForces.opponent.nationId}`).toBeGreaterThan(0);
      for (const plan of plans) {
        expect(context.jointForces.opponent.fleets.some((fleet) => fleet.id === plan.fleetId)).toBe(true);
        expect(plan.routeIds.every((id) => campaignTerritories.some((territory) => territory.id === id))).toBe(true);
      }
    }
  });
});
