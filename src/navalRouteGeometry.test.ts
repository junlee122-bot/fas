import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createJointForcesState } from './jointOperations';
import { refineNavalLeg } from './navalCorridors';
import { buildNavalRoute, getNavalRouteDistance, nauticalDistance, resolveNavalTerritoryPoint } from './navalNavigation';
import type { NavalWaypoint } from './navalNavigation';
import type { NationId } from './types';

const nations: NationId[] = ['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'];

// Independent graph-contract fixture. The oracle below uses Floyd–Warshall,
// not the production Dijkstra implementation or its private distance cache.
const expectedCorridors = [
  ['irish', 'westscotland'], ['westscotland', 'northscotland'], ['northscotland', 'norwegian'],
  ['irish', 'biscay'], ['channel', 'biscay'], ['channel', 'doverstrait'], ['doverstrait', 'northsea'],
  ['northsea', 'norwegian'], ['norwegian', 'arctic'], ['northsea', 'baltic'],
  ['biscay', 'atlantic'], ['atlantic', 'westatlantic'], ['biscay', 'gibraltar'], ['gibraltar', 'westmed'],
  ['westatlantic', 'usatlantic'], ['westatlantic', 'windward'], ['usatlantic', 'windward'],
  ['windward', 'caribbean'], ['caribbean', 'panamaatlantic'], ['panamaatlantic', 'panamapacific'],
  ['panamapacific', 'eastpacific'], ['eastpacific', 'hawaii'], ['eastpacific', 'california'],
  ['california', 'hawaii'], ['california', 'northpacific'], ['northpacific', 'aleutian'], ['northpacific', 'hawaii'],
  ['westmed', 'sicily'], ['sicily', 'eastmed'], ['eastmed', 'aegean'], ['aegean', 'bosporus'],
  ['bosporus', 'blacksea'], ['eastmed', 'suez'], ['suez', 'redsea'], ['redsea', 'aden'],
  ['aden', 'arabian'], ['arabian', 'indian'], ['indian', 'bengal'], ['bengal', 'malacca'],
  ['malacca', 'singaporesea'], ['singaporesea', 'southchina'], ['singaporesea', 'java'],
  ['southchina', 'eastchina'], ['eastchina', 'japansea'], ['japansea', 'southjapan'], ['southjapan', 'japanpacific'],
  ['eastchina', 'philippine'], ['southchina', 'sulu'], ['sulu', 'makassar'],
  ['java', 'makassar'], ['makassar', 'banda'], ['banda', 'coral'], ['banda', 'caroline'],
  ['philippine', 'caroline'], ['japanpacific', 'philippine'], ['japanpacific', 'aleutian'],
  ['caroline', 'solomon'], ['coral', 'solomon'], ['solomon', 'centralpacific'],
  ['caroline', 'centralpacific'], ['centralpacific', 'hawaii'], ['aleutian', 'hawaii'],
  ['biscay', 'guinea'], ['guinea', 'southatlantic'], ['southatlantic', 'cape'],
  ['cape', 'southindian'], ['southindian', 'indian'],
] as const;
const hubIds = [...new Set(expectedCorridors.flat())];

function getOceanHub(id: string): NavalWaypoint {
  const point = resolveNavalTerritoryPoint(id);
  if (!point) throw new Error(`Missing ocean endpoint: ${id}`);
  if (!point.territoryId && point.id === point.basin) return point;
  // The public resolver intentionally prefers a port with the same ID. Read
  // that basin's distinct ocean anchor from a real assembled voyage instead.
  const hub = ['liverpool', 'norfolk', 'alexandria', 'truk'].flatMap((otherId) =>
    buildNavalRoute(point, resolveNavalTerritoryPoint(otherId)!))
    .find((candidate) => candidate.id === id && !candidate.territoryId);
  if (!hub) throw new Error(`The ${id} coastal/ocean identity collision removed its ocean anchor`);
  return hub;
}
const hubs = hubIds.map(getOceanHub);
const hubById = new Map(hubs.map((point) => [point.id, point]));
const fleetHomes = nations.flatMap((nation) => createJointForcesState(nation).fleets.map((fleet) => ({ nation, fleetId: fleet.id, home: fleet.navigation?.homePort })));
const mappedTerritories = territories.map((territory) => resolveNavalTerritoryPoint(territory.id, territories))
  .filter((point): point is NavalWaypoint => point !== null);
const endpointKey = (point: NavalWaypoint) => `${point.id}|${point.latitude}|${point.longitude}|${point.territoryId ?? ''}`;
const identity = (point: NavalWaypoint) => JSON.stringify([point.id, point.name, point.latitude, point.longitude, point.basin, point.territoryId ?? null]);
const endpoints = [...new Map([...mappedTerritories, ...fleetHomes.flatMap(({ home }) => home ? [home] : []), ...hubs]
  .map((point) => [endpointKey(point), point])).values()];

describe('whole-catalogue physical naval route geometry', () => {
  it('includes every playable naval endpoint and two physical home ports for all 13 nations', () => {
    expect(nations).toHaveLength(13);
    expect(fleetHomes).toHaveLength(26);
    for (const nation of nations) {
      expect(fleetHomes.filter((fleet) => fleet.nation === nation && fleet.home)).toHaveLength(2);
    }
    const missingPlayable = territories.filter((territory) => ['port', 'island', 'sea'].includes(territory.siteType ?? ''))
      .filter((territory) => !resolveNavalTerritoryPoint(territory.id, territories));
    expect(missingPlayable.map((territory) => territory.id)).toEqual([]);
    expect(endpoints.length).toBeGreaterThan(150);
    expect(hubs).toHaveLength(55);
  });

  it('checks all endpoint pairs for finite geometry, preserved identities, distance symmetry and the save cap', () => {
    const faults: string[] = [];
    let routeCount = 0, zeroDistanceAliases = 0, maximumNodes = 0, maximumDistanceNm = 0;
    let maximumNodesRoute = '', maximumDistanceRoute = '', maximumDirectionDifferenceNm = 0;
    const originalEndpoints = endpoints.map(identity);
    const validate = (route: NavalWaypoint[], from: NavalWaypoint, to: NavalWaypoint) => {
      routeCount += 1;
      const name = `${endpointKey(from)} -> ${endpointKey(to)}`;
      if (route.length < 2 || route.length > 512) faults.push(`${name}: invalid node count ${route.length}`);
      if (!route.length) return NaN;
      if (identity(route[0]) !== identity(from) || identity(route[route.length - 1]) !== identity(to)) faults.push(`${name}: changed endpoint identity`);
      if (route.some((point) => !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)
        || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180 || !hubById.has(point.basin))) faults.push(`${name}: invalid coordinate or basin`);
      const distance = getNavalRouteDistance(route);
      if (!Number.isFinite(distance) || distance < 0 || (nauticalDistance(from, to) >= .01 && distance <= 0)) faults.push(`${name}: invalid distance ${distance}`);
      if (distance === 0) zeroDistanceAliases += 1;
      if (route.length > maximumNodes) { maximumNodes = route.length; maximumNodesRoute = name; }
      if (distance > maximumDistanceNm) { maximumDistanceNm = distance; maximumDistanceRoute = name; }
      return distance;
    };
    for (let fromIndex = 0; fromIndex < endpoints.length; fromIndex += 1) {
      for (let toIndex = fromIndex; toIndex < endpoints.length; toIndex += 1) {
        const from = endpoints[fromIndex], to = endpoints[toIndex];
        const outward = validate(buildNavalRoute(from, to), from, to);
        if (fromIndex === toIndex) continue;
        const inward = validate(buildNavalRoute(to, from), to, from);
        const difference = Math.abs(outward - inward);
        maximumDirectionDifferenceNm = Math.max(maximumDirectionDifferenceNm, difference);
        if (difference > .000001) faults.push(`${endpointKey(from)} <-> ${endpointKey(to)}: distance asymmetry ${difference}`);
      }
    }
    console.info('[naval geometry audit]', JSON.stringify({ endpointCount: endpoints.length, mappedTerritoryCount: mappedTerritories.length,
      nationalFleetCount: fleetHomes.length, oceanHubCount: hubs.length, routeCount, zeroDistanceAliases,
      maximumNodes, maximumNodesRoute, maximumDistanceNm, maximumDistanceRoute, maximumDirectionDifferenceNm, faultCount: faults.length }));
    expect(routeCount).toBe(endpoints.length ** 2);
    expect(faults.slice(0, 30), `${faults.length} route faults`).toEqual([]);
    expect(endpoints.map(identity)).toEqual(originalEndpoints);
  }, 30000);

  it('matches independently computed shortest refined-leg distances for every ocean-hub pair', () => {
    const indexOf = new Map(hubs.map((point, index) => [point.id, index]));
    const shortest = hubs.map((_, from) => hubs.map((__, to) => from === to ? 0 : Infinity));
    for (const [fromId, toId] of expectedCorridors) {
      const from = indexOf.get(fromId)!, to = indexOf.get(toId)!;
      const cost = getNavalRouteDistance(refineNavalLeg(hubs[from], hubs[to]));
      shortest[from][to] = cost;
      shortest[to][from] = cost;
    }
    for (let via = 0; via < hubs.length; via += 1) {
      for (let from = 0; from < hubs.length; from += 1) {
        for (let to = 0; to < hubs.length; to += 1) {
          shortest[from][to] = Math.min(shortest[from][to], shortest[from][via] + shortest[via][to]);
        }
      }
    }
    const faults: string[] = [];
    let maximumDifferenceNm = 0;
    for (let from = 0; from < hubs.length; from += 1) {
      for (let to = 0; to < hubs.length; to += 1) {
        const actual = getNavalRouteDistance(buildNavalRoute(hubs[from], hubs[to]));
        const difference = Math.abs(actual - shortest[from][to]);
        maximumDifferenceNm = Math.max(maximumDifferenceNm, difference);
        if (!Number.isFinite(shortest[from][to]) || difference > .000001) faults.push(`${hubs[from].id} -> ${hubs[to].id}: ${actual} vs oracle ${shortest[from][to]}`);
      }
    }
    console.info('[naval shortest-path audit]', JSON.stringify({ checkedRoutes: hubs.length ** 2, maximumDifferenceNm, faultCount: faults.length }));
    expect(faults.slice(0, 30), `${faults.length} shortest-path faults`).toEqual([]);
  }, 30000);

  it('retains both ocean and port nodes sharing the same ID in either direction', () => {
    const collisionIds = ['atlantic', 'gibraltar', 'sicily', 'suez', 'hawaii'];
    for (const id of collisionIds) {
      const port = resolveNavalTerritoryPoint(id)!;
      const ocean = hubById.get(id)!;
      expect(port.territoryId, id).toBeDefined();
      expect(ocean.territoryId, id).toBeUndefined();
      expect(nauticalDistance(port, ocean), id).toBeGreaterThan(.01);
      for (const [from, to] of [[port, ocean], [ocean, port]]) {
        const route = buildNavalRoute(from, to);
        expect(route[0]).toEqual(from);
        expect(route[route.length - 1]).toEqual(to);
        expect(getNavalRouteDistance(route), id).toBeGreaterThan(0);
      }
    }
  });

  it('removes the Italy same-basin shortcut and accounts for the complete western and eastern approaches', () => {
    const hub = hubById.get('sicily')!;
    for (const [fromId, toId] of [['naples', 'taranto'], ['salerno', 'italy'], ['naples', 'messina']]) {
      const from = resolveNavalTerritoryPoint(fromId)!, to = resolveNavalTerritoryPoint(toId)!;
      const route = buildNavalRoute(from, to);
      expect(route.some((point) => identity(point) === identity(hub)), `${fromId} -> ${toId}`).toBe(true);
      expect(route.some((point) => point.longitude < 13)).toBe(true);
      expect(route.some((point) => point.latitude < 36.5)).toBe(true);
      const expected = getNavalRouteDistance(refineNavalLeg(from, hub)) + getNavalRouteDistance(refineNavalLeg(hub, to));
      expect(getNavalRouteDistance(route)).toBeCloseTo(expected, 7);
      expect(getNavalRouteDistance(route)).toBeGreaterThan(nauticalDistance(from, to) * 1.5);
    }
  });
});
