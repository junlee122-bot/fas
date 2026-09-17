import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createJointForcesState, normalizeJointForcesState } from './jointOperations';
import type { NavalTaskForce } from './jointOperations';
import { advanceFleetNavigationWeek, beginFleetReturn, buildNavalRoute, dispatchFleetTransit,
  getFleetNavigationSummary, getNavalRouteDistance, nauticalDistance, normalizeFleetNavigation,
  resolveNavalTerritoryPoint, syncFleetEscortPosition } from './navalNavigation';

const preparedFleet = (): NavalTaskForce => {
  const fleet = createJointForcesState('britain').fleets[1];
  return { ...fleet, navigation: { ...fleet.navigation!, rangeNm: 30000, remainingRangeNm: 30000, cruiseKnots: 3 } };
};
const underwayFleet = () => advanceFleetNavigationWeek(dispatchFleetTransit(preparedFleet(), 'alexandria', territories, 0, 'sea-continuity'), 1);

describe('physical naval route continuity', () => {
  it('keeps partial convoy following on one recorded route across weeks and repeated same-week calls', () => {
    const starting = preparedFleet();
    const station = { ...starting, status: 'assigned' as const, assignmentId: 'sea-follow', navigation: { ...starting.navigation!, mode: 'on-station' as const } };
    const first = syncFleetEscortPosition(station, 'alexandria', territories, 1);
    expect(first.navigation!.traveledNm).toBeGreaterThan(0);
    expect(first.navigation!.traveledNm).toBeLessThan(first.navigation!.distanceNm);
    expect(first.navigation!.route.length).toBeGreaterThan(2);
    expect(getFleetNavigationSummary(first)).toMatchObject({ label: '선단 추적' });
    const repeated = syncFleetEscortPosition(first, 'alexandria', territories, 1);
    expect(repeated.navigation!.position).toEqual(first.navigation!.position);
    expect(repeated.navigation!.remainingRangeNm).toBe(first.navigation!.remainingRangeNm);
    expect(repeated.navigation!.distanceThisWeekNm).toBe(first.navigation!.distanceThisWeekNm);
    const followingWeek = advanceFleetNavigationWeek(repeated, 2);
    const second = syncFleetEscortPosition(followingWeek, 'alexandria', territories, 2);
    expect(second.navigation!.route).toEqual(first.navigation!.route);
    expect(second.navigation!.traveledNm).toBeGreaterThan(first.navigation!.traveledNm);
    expect(first.navigation!.remainingRangeNm - second.navigation!.remainingRangeNm)
      .toBeCloseTo(second.navigation!.traveledNm - first.navigation!.traveledNm, 7);
  });

  it('starts a mid-voyage return from the current position and follows a recorded leg before rebuilding', () => {
    const fleet = underwayFleet();
    expect(fleet.navigation!.mode).toBe('outbound');
    const before = fleet.navigation!;
    const result = beginFleetReturn(fleet, 1, territories);
    const nav = result.navigation!;
    expect(nav.mode).toBe('returning');
    expect(nav.position).toEqual(before.position);
    expect(nav.route[0]).toEqual(before.position);
    expect(nav.remainingRangeNm).toBe(before.remainingRangeNm);
    expect(nav.distanceThisWeekNm).toBe(before.distanceThisWeekNm);
    expect(nav.traveledNm).toBe(0);
    const firstTurn = nav.route.find((point) => nauticalDistance(point, before.position) > 2)!;
    expect(before.route.some((point) => nauticalDistance(point, firstTurn) < .01)).toBe(true);
    expect(advanceFleetNavigationWeek(result, 1)).toBe(result);
  });

  it('changes a convoy destination from the actual position with no duplicate movement budget', () => {
    const fleet = underwayFleet();
    const following = { ...fleet, navigation: { ...fleet.navigation!, mode: 'on-station' as const } };
    const changed = syncFleetEscortPosition(following, 'malta', territories, 1);
    expect(changed.navigation!.destination?.id).toBe('malta');
    expect(changed.navigation!.position.latitude).toBeCloseTo(following.navigation!.position.latitude, 8);
    expect(changed.navigation!.position.longitude).toBeCloseTo(following.navigation!.position.longitude, 8);
    expect(changed.navigation!.remainingRangeNm).toBe(following.navigation!.remainingRangeNm);
    expect(changed.navigation!.route[0]).toEqual(following.navigation!.position);
  });

  it('reconnects legacy midcourse saves only to new geometry while preserving position, fuel and week budgets', () => {
    const fleet = underwayFleet();
    const saved = { ...fleet.navigation!, routeGeometryVersion: undefined,
      route: [fleet.navigation!.homePort, fleet.navigation!.destination!] };
    const before = JSON.parse(JSON.stringify(saved));
    const normalized = normalizeFleetNavigation(saved, fleet)!;
    expect(normalized.mode).toBe('outbound');
    expect(normalized.routeGeometryVersion).toBe(3);
    expect(normalized.position).toEqual(saved.position);
    expect(normalized.route[0]).toEqual(saved.position);
    expect(normalized.remainingRangeNm).toBe(saved.remainingRangeNm);
    expect(normalized.distanceThisWeekNm).toBe(saved.distanceThisWeekNm);
    expect(normalized.lastProcessedWeek).toBe(saved.lastProcessedWeek);
    expect(normalized.departedWeek).toBe(saved.departedWeek);
    expect(normalized.traveledNm).toBe(0);
    expect(normalized.distanceNm).toBeCloseTo(getNavalRouteDistance(normalized.route), 7);
    expect(normalizeFleetNavigation(normalized, fleet)).toEqual(normalized);
    expect(JSON.parse(JSON.stringify(saved))).toEqual(before);
  });

  it('halts a legacy point on an obsolete overland chord without teleportation or free refueling', () => {
    const fleet = underwayFleet();
    const position = { ...fleet.navigation!.position, id: 'transit-old-overland', latitude: 45, longitude: 10, basin: 'westmed' };
    const saved = { ...fleet.navigation!, routeGeometryVersion: undefined, position, remainingRangeNm: 77,
      route: [fleet.navigation!.homePort, fleet.navigation!.destination!] };
    const normalized = normalizeFleetNavigation(saved, fleet)!;
    expect(normalized).toMatchObject({ mode: 'stranded', position, remainingRangeNm: 77, lastProcessedWeek: saved.lastProcessedWeek });
    expect(normalized.lastMessage).toContain('항로 재검토');
    expect(normalized.route).toEqual([]);
    const returned = beginFleetReturn({ ...fleet, navigation: normalized }, 2, territories);
    expect(returned.navigation!.mode).toBe('stranded');
    expect(returned.navigation!.position).toEqual(position);
    expect(returned.navigation!.remainingRangeNm).toBe(77);
  });

  it('preserves a valid v2 voyage already in the Indian Ocean when Panama becomes the new shortest route', () => {
    const fleet = preparedFleet();
    const from = resolveNavalTerritoryPoint('norfolk')!;
    const via = resolveNavalTerritoryPoint('arabian')!;
    const to = resolveNavalTerritoryPoint('hawaii')!;
    const route = [...buildNavalRoute(from, via), ...buildNavalRoute(via, to).slice(1)]
      .map((point) => ({ ...point, id: point.id.replace('corridor-v3:', 'corridor-v2:') }));
    const index = route.findIndex((point) => point.id === 'arabian');
    const position = { ...via, id: 'transit-v2-indian-ocean', latitude: 10, longitude: 70.5 };
    const saved = { ...fleet.navigation!, routeGeometryVersion: 2, mode: 'outbound' as const,
      homePort: from, destination: to, route, position, distanceNm: getNavalRouteDistance(route),
      traveledNm: getNavalRouteDistance(route.slice(0, index + 1)) + nauticalDistance(via, position),
      remainingRangeNm: 20000, departedWeek: 2, lastProcessedWeek: 7, distanceThisWeekNm: 321 };
    const restored = normalizeFleetNavigation(saved, fleet)!;
    expect(restored).toEqual({ ...saved, routeGeometryVersion: 3 });
    expect(restored.route).not.toBe(saved.route);
    expect(restored.route.some((point) => point.id === 'panamaatlantic')).toBe(false);
    expect(buildNavalRoute(from, to).some((point) => point.id === 'panamaatlantic')).toBe(true);
    const returning = beginFleetReturn({ ...fleet, navigation: restored, status: 'assigned' }, 7, territories);
    expect(returning.navigation!.mode).toBe('returning');
    expect(returning.navigation!.route[0]).toEqual(position);
    expect(returning.navigation!.remainingRangeNm).toBe(20000);
    expect(returning.navigation!.distanceThisWeekNm).toBe(321);
  });

  it.each([
    ['norfolk', 36.9, -76.3, 'westatlantic'], ['hawaii', 21.4, -157.9, 'hawaii'],
  ] as const)('recognizes the exact old %s port anchor without relocating a restored ship', (id, latitude, longitude, basin) => {
    const fleet = preparedFleet();
    const point = { ...resolveNavalTerritoryPoint(id)!, latitude, longitude, basin };
    const nav = { ...fleet.navigation!, routeGeometryVersion: 2, mode: 'on-station' as const,
      position: point, destination: point, remainingRangeNm: 20000, route: [], distanceNm: 0, traveledNm: 0 };
    const restored = normalizeFleetNavigation(nav, fleet)!;
    expect(restored.position).toEqual(point);
    const returning = beginFleetReturn({ ...fleet, navigation: restored, status: 'assigned' }, 1, territories);
    expect(returning.navigation!.mode).toBe('returning');
    expect(returning.navigation!.route[0]).toEqual(point);
    expect(returning.navigation!.position).toEqual(point);
    expect(returning.navigation!.remainingRangeNm).toBe(20000);
  });

  it.each(['zero-length', 'completed-long', 'updated-metadata'] as const)(
    'replans %s v2 escort records when the same harbor ID resolves to a new coordinate', (recordKind) => {
      const fleet = preparedFleet();
      const destination = resolveNavalTerritoryPoint('hawaii', territories)!;
      const old = { ...destination, latitude: 21.4, longitude: -157.9 };
      const route = recordKind === 'completed-long'
        ? [...buildNavalRoute(resolveNavalTerritoryPoint('norfolk')!, destination).slice(0, -1), old]
        : [old, { ...old }];
      const completedDistance = getNavalRouteDistance(route);
      const saved: NavalTaskForce = { ...fleet, status: 'assigned', assignmentId: 'sea-v2-coordinate-change',
        navigation: { ...fleet.navigation!, routeGeometryVersion: 2, mode: 'on-station', position: old,
          destination: recordKind === 'updated-metadata' ? destination : old, route,
          distanceNm: completedDistance, traveledNm: completedDistance, lastProcessedWeek: 0, distanceThisWeekNm: 0 } };
      const snapshot = JSON.stringify(saved);
      expect(nauticalDistance(old, destination)).toBeGreaterThan(8);
      const result = syncFleetEscortPosition(saved, 'hawaii', territories, 1);
      const nav = result.navigation!;
      expect(nav.routeGeometryVersion).toBe(3);
      expect(nav.route[0]).toEqual(old);
      expect(nav.route.at(-1)).toMatchObject({ id: destination.id, latitude: destination.latitude, longitude: destination.longitude });
      expect(nav.destination).toEqual(destination);
      expect(nav.distanceNm).toBeGreaterThan(8);
      expect(nav.traveledNm).toBeGreaterThan(0);
      expect(saved.navigation!.remainingRangeNm - nav.remainingRangeNm).toBeCloseTo(nav.traveledNm, 7);
      expect(nav.distanceThisWeekNm).toBeCloseTo(nav.traveledNm, 7);
      expect(nauticalDistance(nav.position, old)).toBeGreaterThan(0);
      if (nauticalDistance(nav.position, destination) > .01) expect(nav.lastMessage).not.toContain('선단 엄호 중');
      const repeated = syncFleetEscortPosition(result, 'hawaii', territories, 1);
      expect(repeated.navigation!.position).toEqual(nav.position);
      expect(repeated.navigation!.route).toEqual(nav.route);
      expect(repeated.navigation!.remainingRangeNm).toBe(nav.remainingRangeNm);
      expect(repeated.navigation!.distanceThisWeekNm).toBe(nav.distanceThisWeekNm);
      expect(JSON.stringify(saved)).toBe(snapshot);
    });

  it('replans an old harbor coordinate without teleportation when this week has no movement budget left', () => {
    const fleet = preparedFleet();
    const destination = resolveNavalTerritoryPoint('hawaii', territories)!;
    const old = { ...destination, latitude: 21.4, longitude: -157.9 };
    const used = fleet.navigation!.cruiseKnots * 24 * 7 * .7;
    const saved: NavalTaskForce = { ...fleet, status: 'assigned', assignmentId: 'sea-v2-budget',
      navigation: { ...fleet.navigation!, routeGeometryVersion: 2, mode: 'on-station', position: old,
        destination: old, route: [old, { ...old }], distanceNm: 0, traveledNm: 0,
        lastProcessedWeek: 1, distanceThisWeekNm: used } };
    const result = syncFleetEscortPosition(saved, 'hawaii', territories, 1).navigation!;
    expect(result.route[0]).toEqual(old);
    expect(result.route.at(-1)).toMatchObject({ id: destination.id, latitude: destination.latitude, longitude: destination.longitude });
    expect(result.distanceNm).toBeGreaterThan(8);
    expect(result.traveledNm).toBe(0);
    expect(nauticalDistance(result.position, old)).toBeLessThan(.0001);
    expect(result.remainingRangeNm).toBe(saved.navigation!.remainingRangeNm);
    expect(result.distanceThisWeekNm).toBe(used);
    expect(result.lastMessage).toContain('선단을 추적 중');
  });

  it('includes a short legacy rejoining leg instead of snapping the physical position onto the new route', () => {
    const fleet = underwayFleet();
    const position = { ...fleet.navigation!.position, latitude: fleet.navigation!.position.latitude + .01 };
    const saved = { ...fleet.navigation!, routeGeometryVersion: undefined, position,
      route: [fleet.navigation!.homePort, fleet.navigation!.destination!] };
    const normalized = normalizeFleetNavigation(saved, fleet)!;
    expect(normalized.mode).toBe('outbound');
    expect(normalized.position).toEqual(position);
    expect(normalized.route[0]).toEqual(position);
    expect(normalized.remainingRangeNm).toBe(saved.remainingRangeNm);
    expect(normalized.distanceThisWeekNm).toBe(saved.distanceThisWeekNm);
    expect(nauticalDistance(normalized.route[0], normalized.route[1])).toBeGreaterThan(0);
    expect(nauticalDistance(normalized.route[0], normalized.route[1])).toBeLessThanOrEqual(2);
    expect(normalized.distanceNm).toBeCloseTo(getNavalRouteDistance(normalized.route), 7);
  });

  it('fails closed for an unrecorded mid-sea point even if its basin is valid', () => {
    const fleet = underwayFleet();
    const invalid = { ...fleet, navigation: { ...fleet.navigation!, route: [], position: {
      ...fleet.navigation!.position, id: 'transit-unrecorded', latitude: 45, longitude: 10, basin: 'westmed' } } };
    const returned = beginFleetReturn(invalid, 2, territories);
    expect(returned.navigation!.mode).toBe('stranded');
    expect(returned.navigation!.position).toEqual(invalid.navigation!.position);
    expect(returned.navigation!.remainingRangeNm).toBe(invalid.navigation!.remainingRangeNm);
  });

  it('preserves player and opponent reservations through save normalization', () => {
    const joint = createJointForcesState('britain');
    const fleet = underwayFleet();
    joint.fleets[1] = fleet;
    joint.opponent.fleets[0] = { ...joint.opponent.fleets[0], navigation: { ...fleet.navigation! }, assignmentId: 'enemy-sea-route-test', status: 'assigned' };
    const restored = normalizeJointForcesState(JSON.parse(JSON.stringify(joint)), 'britain');
    expect(restored.fleets[1].navigation).toEqual(fleet.navigation);
    expect(restored.fleets[1].assignmentId).toBe(fleet.assignmentId);
    expect(restored.opponent.fleets[0].navigation).toEqual(fleet.navigation);
    expect(restored.opponent.fleets[0].assignmentId).toBe('enemy-sea-route-test');
  });

  it('keeps legitimate long refined routes within the saved route cap', () => {
    const route = buildNavalRoute(resolveNavalTerritoryPoint('liverpool')!, resolveNavalTerritoryPoint('hawaii')!);
    expect(route.length).toBeGreaterThan(10);
    expect(route.length).toBeLessThanOrEqual(512);
    const fleet = preparedFleet();
    const nav = { ...fleet.navigation!, mode: 'outbound' as const, route, destination: route.at(-1),
      distanceNm: getNavalRouteDistance(route), lastProcessedWeek: 0 };
    expect(normalizeFleetNavigation(nav, fleet)?.mode).toBe('outbound');
  });
});
