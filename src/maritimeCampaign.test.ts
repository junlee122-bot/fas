import { describe, expect, it } from 'vitest';
import { createCampaignDivisions, getNation, nations } from './campaign';
import { territories as initialTerritories } from './data';
import { advanceEnemyMaritimeWeek, applyEnemyMaritimeFleetUpdates, createEnemyMaritimeState, getEnemyMaritimeInterdictionByRoute,
  normalizeEnemyMaritimeState, reconcileEnemyMaritimeAssignments, type EnemyMaritimeOperation, type EnemyMaritimeState } from './enemyMaritime';
import { advanceJointOperationsWeek, createJointForcesState, getAvailableJointOperationTemplates, launchJointOperation,
  normalizeJointForcesState, recoverPeacetimeJointForces, standDownJointOperationsForPeace, type JointForcesState } from './jointOperations';
import { advanceSeaTransportWeek, createSeaTransportState, findSeaTransportRoute, forecastSeaTransport,
  getSeaTransportAssignedAirGroupIds, getSeaTransportAssignedFleetIds, getSeaTransportBusyDivisionIds, launchSeaTransport,
  normalizeSeaTransportState, type SeaTransportContext, type SeaTransportResult, type SeaTransportState } from './seaTransport';
import { applySeaTransportAirGroupUpdates, applySeaTransportFleetUpdates, reconcileSeaTransportEscortAssignments } from './seaTransportIntegration';
import { advanceFleetNavigationWeek, beginFleetReturn, dispatchFleetTransit, nauticalDistance, resolveNavalTerritoryPoint } from './navalNavigation';
import type { Division, GameState, NationId, Stockpile, Territory } from './types';

// This is the maritime slice in App's settlement order, not a replacement for
// the complete economy/land/career engine and not a claim of 780 human playtests.
interface Slice { nationId: NationId; game: GameState; stockpile: Stockpile; divisions: Division[]; territories: Territory[];
  joint: JointForcesState; sea: SeaTransportState; enemy: EnemyMaritimeState; phase: 'war' | 'nation' }
const initialGame: GameState = { week: 0, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
  stability: 78, warSupport: 84, commandPoints: 52, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 };
const initialStockpile: Stockpile = { infantryEquipment: 48200, tanks: 1284, aircraft: 2106, convoys: 624, artillery: 3840, trucks: 12600 };
const percent = new Set(['stability', 'warSupport', 'commandPoints', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure']);
function delta(game: GameState, changes: Partial<GameState>) {
  const next = { ...game };
  for (const [key, amount] of Object.entries(changes)) {
    expect(Number.isFinite(amount), `${key} delta`).toBe(true);
    const field = key as keyof GameState;
    next[field] = Math.max(0, Math.min(percent.has(key) ? 100 : Infinity, next[field] + amount));
  }
  return next;
}
const patches = <T extends { id: string }>(items: readonly T[], changes: readonly T[]): T[] => {
  const byId = new Map(changes.map((item) => [item.id, item]));
  return items.map((item) => byId.get(item.id) ?? item);
};
function initial(nationId: NationId): Slice {
  const nation = getNation(nationId);
  return { nationId, game: { ...initialGame, ...nation.modifiers }, stockpile: { ...initialStockpile },
    divisions: createCampaignDivisions(nation), territories: structuredClone(initialTerritories),
    joint: createJointForcesState(nationId), sea: createSeaTransportState(), enemy: createEnemyMaritimeState(nationId), phase: 'war' };
}
function context(run: Slice, week = run.game.week): SeaTransportContext {
  return { week, nationId: run.nationId, playerFaction: getNation(run.nationId).alignment, phase: run.phase,
    game: run.game, stockpile: run.stockpile, divisions: run.divisions, territories: run.territories, orders: [],
    commandableDivisionIds: new Set(run.divisions.map((unit) => unit.id)), canCommandEscort: true, jointForces: run.joint,
    enemyInterdiction: getEnemyMaritimeInterdictionByRoute(run.enemy) };
}
function applySea(run: Slice, result: SeaTransportResult): Slice {
  return { ...run, sea: result.state, game: delta(run.game, result.gameDelta),
    stockpile: { ...run.stockpile, convoys: Math.max(0, run.stockpile.convoys + result.convoyDelta) },
    territories: patches(run.territories, result.territoryUpdates), divisions: patches(run.divisions, result.divisionUpdates),
    joint: applySeaTransportAirGroupUpdates(applySeaTransportFleetUpdates(run.joint, result.fleetUpdates), result.airGroupUpdates) };
}
function step(run: Slice): Slice {
  const week = run.game.week + 1;
  const sea = advanceSeaTransportWeek(run.sea, context(run, week));
  // The enemy must see this week's actual arrivals/landing losses, not the old
  // division array together with the new sea state (which would create ghosts).
  const enemy = advanceEnemyMaritimeWeek(run.enemy, { ...context(run, week),
    territories: patches(run.territories, sea.territoryUpdates), divisions: patches(run.divisions, sea.divisionUpdates),
    seaTransport: sea.state });
  const movedJoint = applyEnemyMaritimeFleetUpdates(run.joint, enemy.opponentFleetUpdates);
  const jointResult = run.phase === 'war' ? advanceJointOperationsWeek(movedJoint, { week, theater: getNation(run.nationId).defaultTheater, game: run.game }) : undefined;
  const settledJoint = jointResult?.state ?? standDownJointOperationsForPeace(recoverPeacetimeJointForces(movedJoint), week).state;
  let next = applySea({ ...run, joint: settledJoint }, sea);
  next = { ...next, game: { ...delta(delta(next.game, enemy.gameDelta), jointResult?.gameDelta ?? {}), week }, enemy: enemy.state,
    territories: patches(next.territories, enemy.territoryUpdates), divisions: patches(next.divisions, enemy.divisionUpdates),
    stockpile: { ...next.stockpile, aircraft: Math.max(0, next.stockpile.aircraft + (jointResult?.aircraftDelta ?? 0)),
      convoys: Math.max(0, next.stockpile.convoys + (jointResult?.convoyDelta ?? 0)) } };
  return next;
}
function restore(run: Slice): Slice {
  const saved = JSON.parse(JSON.stringify(run)) as Slice;
  const sea = normalizeSeaTransportState(saved.sea);
  const enemy = normalizeEnemyMaritimeState(saved.enemy, run.nationId);
  const joint = reconcileEnemyMaritimeAssignments(reconcileSeaTransportEscortAssignments(normalizeJointForcesState(saved.joint, run.nationId), sea), enemy);
  return { ...saved, sea, enemy, joint };
}
function submitAvailableOrders(run: Slice): Slice {
  const input = context(run);
  const busy = getSeaTransportBusyDivisionIds(run.sea);
  for (const division of run.divisions) {
    if (busy.has(division.id)) continue;
    const targets = run.territories.filter((target) => findSeaTransportRoute(division.territoryId, target.id, run.territories))
      .sort((a, b) => Number(b.controller === input.playerFaction) - Number(a.controller === input.playerFaction));
    let launched = false;
    for (const target of targets) {
      const fleets = run.joint.fleets.filter((fleet) => fleet.status === 'ready' && !fleet.assignmentId && ['surface', 'escort', 'carrier', 'coastal'].includes(fleet.kind)).map((fleet) => fleet.id);
      const plan = { divisionId: division.id, fromId: division.territoryId, targetId: target.id, escortFleetIds: fleets };
      const withEscort = forecastSeaTransport(run.sea, plan, input);
      const chosen = withEscort.allowed ? plan : { divisionId: division.id, fromId: division.territoryId, targetId: target.id };
      if (!forecastSeaTransport(run.sea, chosen, input).allowed) continue;
      run = applySea(run, launchSeaTransport(run.sea, chosen, input)); launched = true; break;
    }
    if (launched) break;
  }
  if (run.phase === 'nation') return run;
  for (const template of getAvailableJointOperationTemplates(getNation(run.nationId).defaultTheater)) {
    const fleets = template.requiredFleetKinds.length ? run.joint.fleets.filter((fleet) => template.requiredFleetKinds.includes(fleet.kind) && fleet.status === 'ready' && !fleet.assignmentId).slice(0, 1).map((fleet) => fleet.id) : [];
    const air = template.requiredAirKinds.length ? run.joint.airGroups.filter((group) => template.requiredAirKinds.includes(group.kind) && group.status === 'ready' && !group.assignmentId).slice(0, 1).map((group) => group.id) : [];
    if (run.game.commandPoints < template.commandCost || run.game.fuel < template.fuelCost || run.stockpile.convoys < template.convoyCost) continue;
    const launched = launchJointOperation(run.joint, template.id, fleets, air, { week: run.game.week, theater: getNation(run.nationId).defaultTheater, game: run.game });
    if (!launched) continue;
    return { ...run, joint: launched.state, game: delta(run.game, { commandPoints: -template.commandCost, fuel: -template.fuelCost }),
      stockpile: { ...run.stockpile, convoys: run.stockpile.convoys - template.convoyCost } };
  }
  return run;
}
function assertInvariants(run: Slice, previous?: Slice) {
  for (const [key, value] of Object.entries({ ...run.game, ...run.stockpile })) {
    expect(Number.isFinite(value), `${run.nationId} week${run.game.week} ${key}`).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
  for (const value of [run.enemy.convoys, run.enemy.fuel, run.enemy.landingReserve]) { expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); }
  for (const enemySide of [false, true]) {
    const fleets = enemySide ? run.joint.opponent.fleets : run.joint.fleets;
    const previousFleets = enemySide ? previous?.joint.opponent.fleets : previous?.joint.fleets;
    const operations = enemySide ? run.joint.opponent.operations : run.joint.operations;
    for (const fleet of fleets) {
      const assignments = operations.filter((operation) => operation.fleetIds.includes(fleet.id)).map((operation) => operation.id);
      const seaAssignments = enemySide ? run.enemy.operations.filter((operation) => operation.fleetId === fleet.id).map((operation) => operation.id)
        : run.sea.operations.filter((operation) => [...getSeaTransportAssignedFleetIds(operation), operation.pendingEscortRelief?.fleetId].includes(fleet.id)).map((operation) => operation.id);
      expect(new Set([...assignments, ...seaAssignments]).size, `${run.nationId}:${fleet.id} duplicate roster`).toBeLessThanOrEqual(1);
      if (fleet.status === 'ready') { expect(fleet.assignmentId).toBeNull(); expect(fleet.navigation?.mode ?? 'in-port').toBe('in-port'); }
      const nav = fleet.navigation;
      if (!nav) continue;
      expect(nav.remainingRangeNm).toBeGreaterThanOrEqual(0); expect(nav.remainingRangeNm).toBeLessThanOrEqual(nav.rangeNm);
      const old = previousFleets?.find((item) => item.id === fleet.id);
      if (old?.navigation) {
        expect(fleet.ships).toBeLessThanOrEqual(old.ships);
        const displacement = nauticalDistance(old.navigation.position, nav.position);
        expect(displacement, `${fleet.id} physical weekly displacement`).toBeLessThanOrEqual(nav.cruiseKnots * 24 * 7 * .7 * 1.05 + 1);
      }
    }
  }
  for (const group of run.joint.airGroups) {
    const owners = [...run.joint.operations.filter((op) => op.airGroupIds.includes(group.id)).map((op) => op.id),
      ...run.sea.operations.filter((op) => getSeaTransportAssignedAirGroupIds(op).includes(group.id)).map((op) => op.id)];
    expect(new Set(owners).size).toBeLessThanOrEqual(1);
  }
}

describe('maritime campaign cross-engine ordering', () => {
  it('counts an actual same-week transport arrival as the harbor garrison before enemy landing resolution', () => {
    let run = initial('britain');
    const unit = run.divisions.find((division) => division.territoryId === 'britain')!;
    expect(unit).toBeDefined();
    const launched = launchSeaTransport(run.sea, { divisionId: unit.id, fromId: 'britain', targetId: 'belfast' }, context(run));
    expect(launched.accepted).toBe(true); run = applySea(run, launched);
    let arrival: SeaTransportResult | undefined;
    for (let week = 1; week <= 20; week += 1) {
      const result = advanceSeaTransportWeek(run.sea, context(run, week));
      if (result.divisionUpdates.some((division) => division.id === unit.id && division.territoryId === 'belfast') && !result.state.operations.length) {
        arrival = result; run.game.week = week; break;
      }
      run = { ...applySea(run, result), game: { ...run.game, week } };
    }
    expect(arrival).toBeDefined();
    // Boundary fixture: an already-arrived hostile landing on the same coast.
    // The arrival itself above was produced by the actual transport engine.
    const landing: EnemyMaritimeOperation = {
      id: 'enemy-sea-arrival-boundary', kind: 'landing', stage: 'landing', nationId: 'germany', faction: 'axis', theater: 'europe',
      fleetId: run.joint.opponent.fleets[1].id, fleetName: '상륙 함대', fromId: 'brittany', targetId: 'belfast',
      routeIds: ['brittany', 'atlantic', 'belfast'], currentNodeId: 'belfast', startedWeek: 0, stageWeeks: 0, elapsedWeeks: 4,
      voyageWeeks: 2, landingProgress: 99, convoysReserved: 12, convoysRemaining: 12, fuelCommitted: 20, cargo: 0, troops: 28,
      shipsLost: 0, detected: true, confidence: 100, detectedWeek: 1, lastObservedWeek: run.game.week,
      lastKnownNodeId: 'belfast', lastKnownStage: 'landing', interdictionNodeIds: [], pressure: 0, result: '',
    };
    const fleet = run.joint.opponent.fleets[1];
    const atCoast = { ...fleet, status: 'assigned' as const, assignmentId: landing.id,
      navigation: { ...fleet.navigation!, mode: 'on-station' as const, position: resolveNavalTerritoryPoint('belfast', run.territories)!, lastProcessedWeek: run.game.week - 1 } };
    const jointForces = { ...run.joint, opponent: { ...run.joint.opponent, fleets: [run.joint.opponent.fleets[0], atCoast] } };
    const enemy = { ...run.enemy, operations: [landing], lastDecisionWeek: run.game.week };
    const shared = { ...context(run), jointForces, seaTransport: arrival!.state,
      territories: patches(run.territories, arrival!.territoryUpdates).map((territory) => territory.id === 'belfast' ? { ...territory, supply: 0 } : territory) };
    const stale = advanceEnemyMaritimeWeek(enemy, { ...shared, divisions: run.divisions });
    const correct = advanceEnemyMaritimeWeek(enemy, { ...shared, divisions: patches(run.divisions, arrival!.divisionUpdates) });
    expect(stale.territoryUpdates.some((territory) => territory.id === 'belfast' && territory.controller === 'axis')).toBe(true);
    expect(correct.territoryUpdates.some((territory) => territory.id === 'belfast' && territory.controller === 'axis')).toBe(false);
    expect(correct.divisionUpdates.find((division) => division.id === unit.id)?.territoryId).toBe('belfast');
    expect(correct.divisionUpdates.find((division) => division.id === unit.id)?.strength).toBeLessThan(arrival!.divisionUpdates.find((division) => division.id === unit.id)!.strength);
  });
  it.each(nations.map((nation) => [nation.id] as const))('%s: 60 real-start weekly maritime settlements stay finite and exclusive across save/restore/peace', (nationId) => {
    let run = initial(nationId);
    for (let week = 0; week < 60; week += 1) {
      if ([0, 15, 30].includes(week)) run = submitAvailableOrders(run);
      if (week === 45) run = { ...run, phase: 'nation' };
      const previous = run;
      run = step(run);
      assertInvariants(run, previous);
      if ([19, 39, 59].includes(week)) {
        const loaded = restore(run);
        expect(loaded.game).toEqual(run.game); expect(loaded.stockpile).toEqual(run.stockpile);
        expect(loaded.joint.fleets.map((fleet) => fleet.navigation)).toEqual(run.joint.fleets.map((fleet) => fleet.navigation));
        expect(loaded.joint.opponent.fleets.map((fleet) => fleet.assignmentId)).toEqual(run.joint.opponent.fleets.map((fleet) => fleet.assignmentId));
        expect(loaded.sea.operations.map((operation) => [operation.id, operation.stage])).toEqual(run.sea.operations.map((operation) => [operation.id, operation.stage]));
        expect(loaded.enemy.operations.map((operation) => [operation.id, operation.stage])).toEqual(run.enemy.operations.map((operation) => [operation.id, operation.stage]));
        assertInvariants(loaded); run = loaded;
      }
      if (week >= 45) {
        expect(getEnemyMaritimeInterdictionByRoute(run.enemy)).toEqual({});
        expect(run.enemy.operations.every((operation) => ['returning', 'stranded'].includes(operation.stage))).toBe(true);
      }
    }
    expect(run.game.week).toBe(60);
  }, 30000);

  it('continues a returning escort after its transport record was removed without teleporting or joint reuse', () => {
    let run = initial('britain');
    const departed = dispatchFleetTransit(run.joint.fleets[1], 'belfast', run.territories, 0, 'sea-complete');
    const arrived = advanceFleetNavigationWeek(departed, 1);
    const returning = beginFleetReturn(arrived, 1, run.territories);
    run = { ...run, game: { ...run.game, week: 1 }, joint: { ...run.joint, fleets: [run.joint.fleets[0], returning] }, sea: { ...run.sea, lastProcessedWeek: 1 } };
    const position = returning.navigation!.position;
    const loaded = restore(run);
    expect(loaded.joint.fleets[1].navigation?.position).toEqual(position);
    run = step(loaded);
    expect(run.joint.fleets[1].navigation?.mode).toBe('refueling');
    expect(run.joint.fleets[1].assignmentId).toMatch(/^nav-return-/);
    const ready = step(run);
    expect(ready.joint.fleets[1].navigation?.mode).toBe('in-port');
    expect(ready.joint.fleets[1].navigation?.position.id).toBe('liverpool');
    expect(ready.joint.fleets[1].assignmentId).toBeNull();
    assertInvariants(ready, run);
  });
});
