import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createJointForcesState, advanceJointOperationsWeek, normalizeJointForcesState, recoverPeacetimeJointForces, forecastJointOperation } from './jointOperations';
import type { NavalTaskForce } from './jointOperations';
import type { NationId } from './types';
import { advanceFleetNavigationWeek, beginFleetReturn, buildNavalRoute, createFleetNavigation, dispatchFleetTransit,
  forecastFleetTransit, getAirPatrolCoverage, getFleetNavigationSummary, getMaritimeRouteDistanceNm, getNavalRouteDistance,
  hasFleetNavigationReservation, nauticalDistance, normalizeFleetNavigation, resolveNavalTerritoryPoint, syncFleetEscortPosition } from './navalNavigation';

const britainFleet = () => createJointForcesState('britain').fleets[1];
const jointContext = { week: 3, theater: 'europe' as const, game: { airPower: 50, navalPower: 50, intelNetwork: 50, enemyPressure: 50 } };

describe('physical fleet navigation', () => {
  it('maps every live explicit harbor and island rather than leaving silent zero-distance gaps', () => {
    const missing = territories.filter((territory) => ['port', 'island', 'sea'].includes(territory.siteType ?? ''))
      .filter((territory) => !resolveNavalTerritoryPoint(territory.id, territories));
    expect(missing.map((territory) => territory.id)).toEqual([]);
  });
  it('seeds all 26 national formations with actual mapped coastal home anchors', () => {
    const nations: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];
    nations.forEach((nation) => createJointForcesState(nation).fleets.forEach((fleet) => {
      expect(fleet.navigation, fleet.location).toBeDefined();
      expect(fleet.navigation?.mode).toBe('in-port');
      expect(fleet.navigation?.remainingRangeNm).toBeGreaterThan(0);
    }));
  });
  it('measures nautical miles across the date line without a globe-spanning error', () => {
    expect(nauticalDistance({ latitude: 0, longitude: 179 }, { latitude: 0, longitude: -179 })).toBeCloseTo(120.08, 0);
  });
  it('routes Europe to Asia through named ocean passages rather than through Eurasia', () => {
    const route = buildNavalRoute(resolveNavalTerritoryPoint('liverpool')!, resolveNavalTerritoryPoint('truk')!);
    expect(route.map((point) => point.id)).toEqual(expect.arrayContaining(['gibraltar', 'suez', 'redsea', 'malacca']));
    expect(getNavalRouteDistance(route)).toBeGreaterThan(8000);
  });
  it('connects Norfolk to Hawaii through the Caribbean and Panama instead of a 17,500 nm Eurasian detour', () => {
    const from = resolveNavalTerritoryPoint('norfolk')!;
    const to = resolveNavalTerritoryPoint('hawaii')!;
    const route = buildNavalRoute(from, to);
    expect(route.map((point) => point.id)).toEqual(expect.arrayContaining(['usatlantic', 'windward', 'caribbean', 'panamaatlantic', 'panamapacific', 'eastpacific']));
    expect(route.some((point) => ['gibraltar', 'suez', 'malacca'].includes(point.id))).toBe(false);
    expect(getNavalRouteDistance(route)).toBeGreaterThan(5000);
    expect(getNavalRouteDistance(route)).toBeLessThan(7500);
    expect(getNavalRouteDistance(buildNavalRoute(to, from))).toBeCloseTo(getNavalRouteDistance(route), 7);
    console.info('[Panama route audit]', JSON.stringify({ route: 'norfolk-hawaii', nodes: route.length, distanceNm: getNavalRouteDistance(route) }));
  });
  it('connects the California offshore corridor without inventing new playable cities or cutting Baja California', () => {
    const california = resolveNavalTerritoryPoint('california')!;
    expect(california.territoryId).toBeUndefined();
    expect(territories.some((territory) => territory.id === 'california')).toBe(false);
    const route = buildNavalRoute(resolveNavalTerritoryPoint('norfolk')!, california);
    expect(route.some((point) => point.id === 'panamaatlantic')).toBe(true);
    expect(route.some((point) => point.latitude === 22 && point.longitude === -112)).toBe(true);
    expect(buildNavalRoute(california, resolveNavalTerritoryPoint('hawaii')!).some((point) => point.id === 'panamaatlantic')).toBe(false);
    const north = buildNavalRoute(california, resolveNavalTerritoryPoint('aleutian')!);
    expect(north.some((point) => point.id === 'northpacific')).toBe(true);
    console.info('[California route audit]', JSON.stringify({ route: 'norfolk-california', nodes: route.length, distanceNm: getNavalRouteDistance(route) }));
  });
  it('rejects unmapped geography rather than assigning zero distance or a random fallback port', () => {
    expect(forecastFleetTransit(britainFleet(), 'made-up-city', territories, 0).allowed).toBe(false);
    expect(forecastFleetTransit({ ...britainFleet(), location: '알 수 없는 항구', navigation: undefined }, 'belfast', territories, 0).allowed).toBe(false);
    expect(getMaritimeRouteDistanceNm(['britain', 'made-up-city'], territories)).toBeNull();
  });
  it('requires the whole escort voyage plus the return reserve to fit endurance', () => {
    const fleet = britainFleet();
    expect(forecastFleetTransit(fleet, 'belfast', territories, 0).allowed).toBe(true);
    expect(forecastFleetTransit(fleet, 'belfast', territories, 0, ['belfast', 'hawaii']).allowed).toBe(false);
    expect(forecastFleetTransit({ ...fleet, navigation: { ...fleet.navigation!, remainingRangeNm: 120 } }, 'belfast', territories, 0).allowed).toBe(false);
  });
  it('starts at the home port and does not immediately arrive or allow a second assignment', () => {
    const fleet = britainFleet();
    const next = dispatchFleetTransit(fleet, 'belfast', territories, 0, 'sea-test');
    expect(next.navigation?.mode).toBe('outbound');
    expect(next.navigation?.position.id).toBe('liverpool');
    expect(next.assignmentId).toBe('sea-test');
    expect(advanceFleetNavigationWeek(next, 0)).toBe(next);
    expect(dispatchFleetTransit(next, 'britain', territories, 0, 'sea-stolen')).toBe(next);
    expect(forecastFleetTransit(next, 'britain', territories, 0).allowed).toBe(false);
  });
  it('consumes physical endurance on arrival and never processes a week twice', () => {
    const departed = dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test');
    const arrived = advanceFleetNavigationWeek(departed, 1);
    expect(arrived.navigation?.mode).toBe('on-station');
    expect(arrived.navigation?.position.id).toBe('belfast');
    expect(arrived.navigation!.remainingRangeNm).toBeLessThan(departed.navigation!.remainingRangeNm);
    expect(advanceFleetNavigationWeek(arrived, 1)).toBe(arrived);
  });
  it('keeps a relieved fleet unavailable until return arrival and a subsequent refueling week', () => {
    const departed = dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test');
    const arrived = advanceFleetNavigationWeek(departed, 1);
    const returning = beginFleetReturn(arrived, 1, territories);
    expect(returning.navigation?.mode).toBe('returning');
    expect(returning.assignmentId).toBe('nav-return-britain-fleet-2');
    expect(returning.status).toBe('assigned');
    const refueling = advanceFleetNavigationWeek(returning, 2);
    expect(refueling.navigation?.mode).toBe('refueling');
    expect(refueling.assignmentId).not.toBeNull();
    expect(advanceFleetNavigationWeek(refueling, 2)).toBe(refueling);
    const ready = advanceFleetNavigationWeek(refueling, 3);
    expect(ready.navigation?.mode).toBe('in-port');
    expect(ready.assignmentId).toBeNull();
    expect(ready.navigation?.remainingRangeNm).toBe(ready.navigation?.rangeNm);
    expect(ready.ships).toBe(britainFleet().ships);
  });
  it('preserves readiness losses after refueling rather than healing or recreating ships', () => {
    const fleet = advanceFleetNavigationWeek(dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test'), 1);
    const returned = advanceFleetNavigationWeek(beginFleetReturn({ ...fleet, readiness: 20, organization: 10, ships: 2 }, 1, territories), 2);
    const ready = advanceFleetNavigationWeek(returned, 3);
    expect(ready.status).toBe('refit'); expect(ready.ships).toBe(2); expect(ready.readiness).toBe(20);
  });
  it('uses an alternate friendly harbor if the home port was captured', () => {
    const fleet = advanceFleetNavigationWeek(dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test'), 1);
    const changed = territories.map((item) => item.id === 'liverpool' ? { ...item, controller: 'axis' as const } : item);
    const returning = beginFleetReturn(fleet, 1, changed);
    expect(returning.navigation?.homePort.id).not.toBe('liverpool');
    expect(returning.navigation?.homePort.id).toBe('belfast');
  });
  it('does not teleport an escort to a distant moving convoy, even when synchronized repeatedly', () => {
    const initial = advanceFleetNavigationWeek(dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test'), 1);
    const nav = { ...initial.navigation!, remainingRangeNm: 30000, rangeNm: 30000 };
    const first = syncFleetEscortPosition({ ...initial, navigation: nav }, 'alexandria', territories, 2);
    const second = syncFleetEscortPosition(first, 'alexandria', territories, 2);
    expect(first.navigation?.position.id).not.toBe('alexandria');
    expect(second.navigation?.remainingRangeNm).toBe(first.navigation?.remainingRangeNm);
    expect(second.navigation?.distanceThisWeekNm).toBe(first.navigation?.distanceThisWeekNm);
  });
  it('returns before spending its emergency/return fuel while following a convoy', () => {
    const arrived = advanceFleetNavigationWeek(dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test'), 1);
    const short = { ...arrived, navigation: { ...arrived.navigation!, remainingRangeNm: 400 } };
    expect(syncFleetEscortPosition(short, 'alexandria', territories, 2).navigation?.mode).toBe('returning');
  });
  it('migrates legacy known escorts through return/refuel and releases unmapped legacy escorts to refit only', () => {
    const legacy = { ...britainFleet(), navigation: undefined, status: 'assigned' as const, assignmentId: 'sea-legacy' };
    expect(beginFleetReturn(legacy, 2).navigation?.mode).toBe('returning');
    expect(beginFleetReturn({ ...legacy, location: '미확인' }, 2)).toMatchObject({ status: 'refit', assignmentId: null });
  });
  it('normalizes valid persisted navigation and rejects NaN, oversized routes, invalid progress and bad coordinates', () => {
    const fleet = dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test');
    const restored = normalizeJointForcesState(JSON.parse(JSON.stringify({ ...createJointForcesState('britain'), fleets: [fleet] })), 'britain');
    expect(restored.fleets[0].navigation).toEqual(fleet.navigation);
    for (const bad of [ { remainingRangeNm: NaN }, { traveledNm: 99999 }, { route: new Array(513).fill(fleet.navigation!.homePort) }, { position: { ...fleet.navigation!.position, latitude: 1000 } } ]) {
      expect(normalizeFleetNavigation({ ...fleet.navigation, ...bad }, britainFleet())?.mode).toBe('in-port');
    }
  });
  it('rejects illegal repeated or negative time advancement', () => {
    const fleet = dispatchFleetTransit(britainFleet(), 'belfast', territories, 2, 'sea-test');
    expect(advanceFleetNavigationWeek(fleet, -1)).toBe(fleet);
    expect(advanceFleetNavigationWeek(fleet, 1)).toBe(fleet);
    expect(advanceFleetNavigationWeek(fleet, 2.2)).toBe(fleet);
  });
  it('does not seize a fleet reassigned to an incompatible joint mission', () => {
    const fleet = { ...britainFleet(), status: 'assigned' as const, assignmentId: 'joint-live-mission' };
    expect(beginFleetReturn(fleet, 4, territories)).toBe(fleet);
    expect(dispatchFleetTransit(fleet, 'belfast', territories, 4, 'sea-stolen')).toBe(fleet);
  });
  it('uses current alternate alliance rather than the historical country bloc for harbor access', () => {
    const reversed = territories.map((territory) => ({ ...territory, controller: 'axis' as const }));
    expect(forecastFleetTransit(britainFleet(), 'belfast', reversed, 0).allowed).toBe(false);
    expect(forecastFleetTransit(britainFleet(), 'belfast', reversed, 0, [], 'axis').allowed).toBe(true);
    const fleet = dispatchFleetTransit(britainFleet(), 'belfast', reversed, 0, 'sea-alt', 'axis');
    expect(fleet.navigation?.faction).toBe('axis');
    expect(beginFleetReturn(advanceFleetNavigationWeek(fleet, 1), 1, reversed).navigation?.homePort.id).toBe('liverpool');
  });
  it('shows the actual current position, destination, home port and remaining range', () => {
    const fleet = dispatchFleetTransit(britainFleet(), 'belfast', territories, 0, 'sea-test');
    expect(getFleetNavigationSummary(fleet)).toMatchObject({ label: '합류점 이동', homePort: '리버풀', position: '리버풀', arrivalWeeks: 1, rangeNm: 8000 });
  });
});

describe('navigation ownership and air support', () => {
  it('excludes a returning fleet from joint launch and peacetime recovery even if its assignment was lost', () => {
    const state = createJointForcesState('britain');
    state.fleets[1] = { ...state.fleets[1], status: 'ready', assignmentId: null, navigation: { ...state.fleets[1].navigation!, mode: 'returning' } };
    expect(hasFleetNavigationReservation(state.fleets[1])).toBe(true);
    expect(forecastJointOperation(state, 'atlantic-lifeline', [state.fleets[1].id], [state.airGroups[1].id], jointContext)?.warning).toBeTruthy();
    expect(recoverPeacetimeJointForces(state).fleets[1]).toBe(state.fleets[1]);
  });
  it('joint enemy AI neither steals nor heals a fleet or air group reserved by maritime AI', () => {
    const state = createJointForcesState('britain');
    state.opponent.fleets = state.opponent.fleets.map((fleet) => ({ ...fleet, status: 'assigned', assignmentId: 'enemy-sea-test', readiness: 20 }));
    state.opponent.airGroups = state.opponent.airGroups.map((group) => ({ ...group, status: 'assigned', assignmentId: 'enemy-sea-test', readiness: 20 }));
    const next = advanceJointOperationsWeek(state, jointContext).state;
    expect(next.opponent.fleets).toEqual(state.opponent.fleets);
    expect(next.opponent.airGroups).toEqual(state.opponent.airGroups);
  });
  it('retains external return reservations through joint normalization', () => {
    const state = createJointForcesState('britain');
    const outbound = dispatchFleetTransit(state.fleets[1], 'belfast', territories, 0, 'sea-test');
    state.fleets[1] = beginFleetReturn(advanceFleetNavigationWeek(outbound, 1), 1, territories);
    const restored = normalizeJointForcesState(JSON.parse(JSON.stringify(state)), 'britain');
    expect(restored.fleets[1].assignmentId).toBe(state.fleets[1].assignmentId);
    expect(restored.fleets[1].navigation).toEqual(state.fleets[1].navigation);
  });
  it('models partial maritime patrol coverage and cannot promise remote global fighter cover', () => {
    const groups = createJointForcesState('britain').airGroups;
    expect(getAirPatrolCoverage(groups[1], ['liverpool', 'belfast'], territories)).toMatchObject({ allowed: true, coverage: 1, baseId: 'belfast' });
    expect(getAirPatrolCoverage(groups[0], ['truk', 'hawaii'], territories)).toMatchObject({ allowed: false, coverage: 0 });
    expect(getAirPatrolCoverage(groups[1], ['liverpool', 'hawaii'], territories).coverage).toBe(.5);
    expect(getAirPatrolCoverage({ ...groups[1], base: '미확인' }, ['liverpool'], territories).allowed).toBe(false);
  });
});
