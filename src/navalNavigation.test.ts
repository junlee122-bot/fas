import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createJointForcesState, advanceJointOperationsWeek, normalizeJointForcesState, recoverPeacetimeJointForces, forecastJointOperation } from './jointOperations';
import type { NavalTaskForce } from './jointOperations';
import type { NationId } from './types';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { advanceMilitaryAccessWeek, createMilitaryAccessState, executeMilitaryAccessAction, getSiteMilitaryAccess } from './militaryAccess';
import type { MilitaryAccessContext, MilitaryAccessKind } from './militaryAccess';
import { advanceFleetNavigationWeek, beginFleetReturn, buildNavalRoute, createFleetNavigation, dispatchFleetTransit,
  forecastFleetTransit, getAirBaseAccess, getAirBaseTerritory, getAirPatrolCoverage, getFleetBaseAccess, getFleetBaseTerritory, getFleetNavigationSummary, getMaritimeRouteDistanceNm, getNavalRouteDistance,
  hasFleetNavigationReservation, nauticalDistance, normalizeFleetNavigation, rebaseFleet, resolveNavalTerritoryPoint, syncFleetEscortPosition } from './navalNavigation';

const britainFleet = () => createJointForcesState('britain').fleets[1];
const jointContext = { week: 3, theater: 'europe' as const, game: { airPower: 50, navalPower: 50, intelNetwork: 50, enemyPressure: 50 } };

function accessFixture(kind: MilitaryAccessKind = 'naval-base', territoryId = 'belfast') {
  const sites = territories.map((site) => site.id === territoryId ? { ...site, ownerId: 'usa' as const, controller: 'allies' as const } : { ...site });
  let context: MilitaryAccessContext = { state: createMilitaryAccessState(), control: createMapPoliticalLedger(sites, 0), nationId: 'britain', week: 0,
    playerFaction: 'allies', territories: sites, relations: [{ id: 'usa', name: '미국', code: 'US', value: 100, status: '우호', color: '#fff' }],
    politicalPower: 100, treasury: 100, stability: 100, canNegotiate: true, canRatify: true, approvalSupport: 100, approvalLabel: '국내 승인' };
  const proposal = executeMilitaryAccessAction(context.state, { kind: 'propose', partnerNationId: 'usa', territoryId, accessKind: kind, direction: 'request', durationWeeks: 13 }, context);
  expect(proposal.accepted, proposal.reason).toBe(true);
  context = { ...context, state: proposal.state };
  for (const week of [1, 2]) {
    context = { ...context, week };
    context = { ...context, state: advanceMilitaryAccessWeek(context.state, context).state };
  }
  const activated = executeMilitaryAccessAction(context.state, { kind: 'activate', agreementId: context.state.agreements[0].id }, context);
  expect(activated.accepted).toBe(true);
  context = { ...context, state: activated.state };
  return { sites, context, target: sites.find((site) => site.id === territoryId)! };
}

function revoked(context: MilitaryAccessContext, week: number): MilitaryAccessContext {
  const current = { ...context, week };
  const result = executeMilitaryAccessAction(current.state, { kind: 'revoke', agreementId: current.state.agreements[0].id }, current);
  expect(result.accepted).toBe(true);
  return { ...current, state: result.state };
}

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

describe('naval basing access and physical relocation', () => {
  it('resolves seeded air bases without inventing a map territory for the unmodeled Sardinia base', () => {
    const nations: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];
    const missing = nations.flatMap((nation) => createJointForcesState(nation).airGroups)
      .filter((group) => !getAirBaseTerritory(group, territories)).map((group) => ({ id: group.id, base: group.base }));
    expect(missing).toEqual([{ id: 'italy-air-2', base: '사르데냐' }]);
    expect(getAirBaseTerritory(createJointForcesState('korea').airGroups[0], territories)?.id).toBe('china_interior');
  });

  it('keeps only the original Italian Sardinia air base operational without granting a new deployment right', () => {
    const group = createJointForcesState('italy').airGroups[1];
    const access = { state: createMilitaryAccessState(), control: createMapPoliticalLedger(territories, 0), nationId: 'italy' as const, playerFaction: 'axis' as const, week: 0 };
    const before = JSON.stringify({ group, access, territories });
    expect(getAirBaseAccess(group, territories, access)).toMatchObject({ allowed: true, reason: expect.stringContaining('미모델링 기존 기지') });
    expect(getAirBaseAccess({ ...group, id: 'italy-air-copy' }, territories, access).allowed).toBe(false);
    expect(getAirBaseAccess({ ...group, base: 'sardinia' }, territories, access).allowed).toBe(false);
    expect(getAirBaseAccess({ ...group, base: '새 사르데냐 기지' }, territories, access).allowed).toBe(false);
    expect(getAirBaseAccess(group, territories, { ...access, nationId: 'britain' }).allowed).toBe(false);
    expect(getAirBaseAccess({ ...group, base: '북아일랜드' }, territories, access).allowed).toBe(false);
    expect(JSON.stringify({ group, access, territories })).toBe(before);
  });

  it('does not derive air operations from a foreign naval-base agreement', () => {
    const { sites, context } = accessFixture();
    const group = { ...createJointForcesState('britain').airGroups[1], base: '북아일랜드' };
    expect(getAirBaseAccess(group, sites, context).allowed).toBe(false);
    expect(getAirBaseAccess({ ...group, base: '욱스브리지' }, sites, context).allowed).toBe(true);
  });

  it.each([['usa', 0], ['usa', 1], ['freefrance', 1]] as const)('preserves only the exact existing off-map base for %s fleet %s', (nationId, index) => {
    const fleet = createJointForcesState(nationId).fleets[index];
    const access = { state: createMilitaryAccessState(), control: createMapPoliticalLedger(territories, 0), nationId, playerFaction: 'allies' as const, week: 0 };
    const before = JSON.stringify({ fleet, access, territories });
    expect(getFleetBaseTerritory(fleet, territories)).toBeUndefined();
    for (const purpose of ['naval-base', 'naval-departure', 'offensive'] as const) {
      expect(getFleetBaseAccess(fleet, territories, access, purpose)).toMatchObject({ allowed: true, reason: expect.stringContaining('미모델링 기존 모항') });
    }
    const target = nationId === 'freefrance' ? 'guinea' : index === 0 ? 'brisbane' : 'portsmouth';
    expect(forecastFleetTransit(fleet, target, territories, 0, [], undefined, access).allowed).toBe(true);
    expect(rebaseFleet(fleet, fleet.navigation!.homePort.id, territories, 0, access).allowed).toBe(false);
    expect(getFleetBaseAccess({ ...fleet, id: `${fleet.id}-copy` }, territories, access).allowed).toBe(false);
    expect(getFleetBaseAccess(fleet, territories, { ...access, nationId: 'britain' }).allowed).toBe(false);
    for (const point of [
      { ...fleet.navigation!.homePort, latitude: fleet.navigation!.homePort.latitude + .01 },
      { ...fleet.navigation!.homePort, id: 'forged-port' },
      { ...fleet.navigation!.homePort, territoryId: 'forged-control' },
      { ...fleet.navigation!.homePort, basin: 'atlantic' },
    ]) {
      expect(getFleetBaseAccess({ ...fleet, navigation: { ...fleet.navigation!, homePort: point } }, territories, access).allowed).toBe(false);
    }
    expect(JSON.stringify({ fleet, access, territories })).toBe(before);
  });

  it('does not extend an original off-map base exception to a subsequently chosen foreign base', () => {
    const fleet = createJointForcesState('usa').fleets[1];
    const point = resolveNavalTerritoryPoint('belfast', territories)!;
    const access = { state: createMilitaryAccessState(), control: createMapPoliticalLedger(territories, 0), nationId: 'usa' as const, playerFaction: 'axis' as const, week: 0 };
    const relocated = { ...fleet, navigation: { ...fleet.navigation!, homePort: point, position: point } };
    expect(getFleetBaseAccess(relocated, territories, access).allowed).toBe(false);
    expect(rebaseFleet(fleet, 'noumea', territories, 0, access).allowed).toBe(false);
  });

  it('resolves controlling sites through harbor and air-base aliases without changing the map', () => {
    const before = JSON.stringify(territories);
    const forces = createJointForcesState('britain');
    expect(getFleetBaseTerritory(forces.fleets[0], territories)?.id).toBe('scotland');
    expect(getFleetBaseTerritory({ ...forces.fleets[0], navigation: undefined }, territories)?.id).toBe('scotland');
    expect(getFleetBaseTerritory({ ...forces.fleets[0], navigation: undefined, location: 'unmapped' }, territories)).toBeUndefined();
    expect(getAirBaseTerritory(forces.airGroups[0], territories)?.id).toBe('britain');
    expect(getAirBaseTerritory(forces.airGroups[1], territories)?.id).toBe('belfast');
    expect(getAirBaseTerritory({ ...forces.airGroups[0], base: 'unmapped' }, territories)).toBeUndefined();
    expect(JSON.stringify(territories)).toBe(before);
  });

  it('moves to an agreed foreign base before refueling, reserving the fleet and preserving ownership', () => {
    const { sites, context, target } = accessFixture();
    const original = britainFleet();
    const fleet = { ...original, navigation: { ...original.navigation!, remainingRangeNm: 2000 } };
    const before = JSON.stringify({ fleet, sites, context });
    const result = rebaseFleet(fleet, target.id, sites, 2, context);
    expect(result.allowed).toBe(true);
    const departing = result.fleet!;
    expect(departing.navigation).toMatchObject({ mode: 'returning', position: fleet.navigation.position, remainingRangeNm: 2000, traveledNm: 0 });
    expect(departing.navigation?.destination?.id).toBe(target.id);
    expect(departing.status).toBe('assigned');
    expect(hasFleetNavigationReservation(departing)).toBe(true);
    expect(rebaseFleet(departing, 'liverpool', sites, 2, context).allowed).toBe(false);
    expect(advanceFleetNavigationWeek(departing, 2, sites, context)).toBe(departing);
    const arrived = advanceFleetNavigationWeek(departing, 3, sites, context);
    expect(arrived.navigation?.mode).toBe('refueling');
    expect(arrived.navigation?.position.id).toBe(target.id);
    expect(arrived.navigation!.remainingRangeNm).toBeLessThan(2000);
    expect(arrived.assignmentId).not.toBeNull();
    const ready = advanceFleetNavigationWeek(arrived, 4, sites, context);
    expect(ready.navigation?.mode).toBe('in-port');
    expect(ready.navigation?.remainingRangeNm).toBe(ready.navigation?.rangeNm);
    expect(ready.assignmentId).toBeNull();
    expect(ready.ships).toBe(fleet.ships);
    expect(getSiteMilitaryAccess(target, 'offensive', { ...context, week: 4 }).allowed).toBe(false);
    expect(JSON.stringify({ fleet, sites, context })).toBe(before);
  });

  it('does not treat a land-transit agreement as naval entry or refueling rights', () => {
    const { sites, context, target } = accessFixture('transit');
    expect(getSiteMilitaryAccess(target, 'transit', context).allowed).toBe(true);
    expect(rebaseFleet(britainFleet(), target.id, sites, 2, context).allowed).toBe(false);
  });

  it('rejects expired, revoked and unmapped destination bases', () => {
    const { sites, context, target } = accessFixture();
    const notice = revoked(context, 2);
    expect(rebaseFleet(britainFleet(), target.id, sites, 2, notice).allowed).toBe(false);
    expect(rebaseFleet(britainFleet(), target.id, sites, 15, context).allowed).toBe(false);
    expect(rebaseFleet(britainFleet(), 'unmapped-port', sites, 2, context).allowed).toBe(false);
    expect(rebaseFleet(britainFleet(), 'atlantic', sites, 2, context).allowed).toBe(false);
  });

  it('requires an idle seaworthy fleet and enough existing fuel without spending or replenishing it', () => {
    const { sites, context, target } = accessFixture();
    const original = britainFleet();
    const cases: NavalTaskForce[] = [
      { ...original, status: 'refit' }, { ...original, assignmentId: 'joint-other' }, { ...original, ships: 0 },
      { ...original, readiness: 20 }, { ...original, organization: 20 },
      { ...original, navigation: { ...original.navigation!, mode: 'refueling' } },
      { ...original, navigation: { ...original.navigation!, remainingRangeNm: 1 } },
      { ...original, navigation: undefined, location: 'unmapped' },
    ];
    for (const fleet of cases) {
      const before = JSON.stringify(fleet);
      expect(rebaseFleet(fleet, target.id, sites, 2, context).allowed).toBe(false);
      expect(JSON.stringify(fleet)).toBe(before);
    }
    expect(rebaseFleet(original, target.id, sites, -1, context).allowed).toBe(false);
    expect(rebaseFleet(original, 'liverpool', sites, 2, context).allowed).toBe(false);
  });

  it('allows only the withdrawal window to leave a revoked foreign base and does not refuel on departure', () => {
    const { sites, context, target } = accessFixture();
    const fleet = britainFleet();
    const point = resolveNavalTerritoryPoint(target.id, sites)!;
    const visiting = { ...fleet, navigation: { ...fleet.navigation!, homePort: point, position: point, remainingRangeNm: 1500 } };
    const notice = revoked(context, 3);
    const result = rebaseFleet(visiting, 'liverpool', sites, 3, notice);
    expect(result.allowed).toBe(true);
    expect(result.fleet?.navigation?.position).toEqual(point);
    expect(result.fleet?.navigation?.remainingRangeNm).toBe(1500);
    expect(forecastFleetTransit(visiting, 'liverpool', sites, 3, [], undefined, notice).allowed).toBe(false);
    expect(dispatchFleetTransit(visiting, 'liverpool', sites, 3, 'sea-not-withdrawal', undefined, notice)).toBe(visiting);
    expect(rebaseFleet(visiting, 'liverpool', sites, 5, notice).allowed).toBe(false);
    expect(forecastFleetTransit(visiting, 'liverpool', sites, 5, [], undefined, notice).allowed).toBe(false);
    expect(dispatchFleetTransit(visiting, 'liverpool', sites, 5, 'sea-denied', undefined, notice)).toBe(visiting);
    expect(forecastFleetTransit(visiting, 'liverpool', sites, 5).allowed).toBe(true);
  });

  it('rechecks an in-flight grant and reroutes from the real current position with no free movement or fuel', () => {
    const { sites, context, target } = accessFixture('naval-base', 'alexandria');
    const original = britainFleet();
    const fleet = { ...original, navigation: { ...original.navigation!, cruiseKnots: 3 } };
    const departed = rebaseFleet(fleet, target.id, sites, 2, context).fleet!;
    const underway = advanceFleetNavigationWeek(departed, 3, sites, context);
    expect(underway.navigation?.mode).toBe('returning');
    expect(underway.navigation!.traveledNm).toBeGreaterThan(0);
    const notice = revoked(context, 4);
    const rerouted = advanceFleetNavigationWeek(underway, 4, sites, notice);
    expect(rerouted.navigation?.mode).toBe('returning');
    expect(rerouted.navigation?.homePort.id).not.toBe(target.id);
    expect(rerouted.navigation?.route[0]).toEqual(underway.navigation?.position);
    expect(rerouted.navigation?.position).toEqual(underway.navigation?.position);
    expect(rerouted.navigation?.remainingRangeNm).toBe(underway.navigation?.remainingRangeNm);
    expect(advanceFleetNavigationWeek(rerouted, 4, sites, notice)).toBe(rerouted);
    const moved = advanceFleetNavigationWeek(rerouted, 5, sites, notice);
    expect(moved.navigation!.remainingRangeNm).toBeLessThan(rerouted.navigation!.remainingRangeNm);
  });

  it('rechecks permission between arrival and refueling and returns physically to another harbor', () => {
    const { sites, context, target } = accessFixture();
    const departing = rebaseFleet(britainFleet(), target.id, sites, 2, context).fleet!;
    const arrived = advanceFleetNavigationWeek(departing, 3, sites, context);
    expect(arrived.navigation?.mode).toBe('refueling');
    const notice = revoked(context, 4);
    const diverted = advanceFleetNavigationWeek(arrived, 4, sites, notice);
    expect(diverted.navigation?.mode).toBe('returning');
    expect(diverted.navigation?.position).toEqual(arrived.navigation?.position);
    expect(diverted.navigation?.remainingRangeNm).toBe(arrived.navigation?.remainingRangeNm);
    expect(diverted.navigation?.homePort.id).not.toBe(target.id);
    expect(diverted.assignmentId).not.toBeNull();
    const returned = advanceFleetNavigationWeek(diverted, 5, sites, notice);
    expect(returned.navigation?.mode).toBe('refueling');
    expect(returned.navigation!.remainingRangeNm).toBeLessThan(arrived.navigation!.remainingRangeNm);
    expect(advanceFleetNavigationWeek(returned, 6, sites, notice).navigation?.mode).toBe('in-port');
  });

  it('strands safely if no authorized return base exists, preserving the physical route for later recovery', () => {
    const { sites, context, target } = accessFixture('naval-base', 'alexandria');
    const original = britainFleet();
    const fleet = { ...original, navigation: { ...original.navigation!, cruiseKnots: 3 } };
    const underway = advanceFleetNavigationWeek(rebaseFleet(fleet, target.id, sites, 2, context).fleet!, 3, sites, context);
    const notice = revoked(context, 4);
    const stranded = advanceFleetNavigationWeek(underway, 4, [target], notice);
    expect(stranded.navigation?.mode).toBe('stranded');
    expect(stranded.navigation?.position).toEqual(underway.navigation?.position);
    expect(stranded.navigation?.remainingRangeNm).toBe(underway.navigation?.remainingRangeNm);
    expect(stranded.navigation?.route).toEqual(underway.navigation?.route);
    const rescued = beginFleetReturn(stranded, 5, sites, undefined, notice);
    expect(rescued.navigation?.mode).toBe('returning');
    expect(rescued.navigation?.route[0]).toEqual(stranded.navigation?.position);
    expect(rescued.navigation?.remainingRangeNm).toBe(stranded.navigation?.remainingRangeNm);
  });
});
