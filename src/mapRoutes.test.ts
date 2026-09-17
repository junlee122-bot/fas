import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { createCampaignDivisions, nations } from './campaign';
import { recoverLegacySeaPositions } from './landPositionRecovery';
import { classifyMapRoute, getMapLandmassId, isSeaTerritory, MAP_LANDMASS_GROUPS, MAP_WATER_CROSSINGS, validateLandRoute } from './mapRoutes';
import type { Territory } from './types';

const territoryById = new Map(territories.map((territory) => [territory.id, territory]));
const site = (id: string): Territory => {
  const territory = territoryById.get(id);
  if (!territory) throw new Error(`Unknown test territory: ${id}`);
  return territory;
};

describe('map route domains', () => {
  it('distinguishes an island from a sea zone regardless of old terrain wording', () => {
    expect(isSeaTerritory(site('channel'))).toBe(true);
    expect(isSeaTerritory({ id: 'channel' })).toBe(true);
    expect(isSeaTerritory({ id: 'scenario-ocean', siteType: 'sea' })).toBe(true);
    ['midway', 'normandy', 'sicily', 'tobruk', 'philippines'].forEach((id) => {
      expect(isSeaTerritory(site(id)), id).toBe(false);
    });
  });

  it.each([
    ['tunisia', 'sicily'], ['scotland', 'narvik'], ['liverpool', 'belfast'],
    ['portsmouth', 'calais'], ['japan_home', 'korea'], ['busan', 'japan_home'],
    ['japan_home', 'midway'], ['philippines', 'leyte'], ['philippines', 'new_guinea'],
    ['darwin', 'port_moresby'], ['surabaya', 'sumatra'], ['guam', 'saipan'],
    ['marseille', 'algiers'], ['spain', 'morocco'], ['ceylon', 'india'],
    ['germany', 'denmark'], ['hamburg', 'denmark'],
    ['britain', 'scotland'], ['liverpool', 'scotland'],
    ['anatolia', 'balkans'], ['anatolia', 'sofia'],
    ['bangkok', 'penang'], ['malaya', 'penang'], ['singapore', 'penang'],
  ])('does not turn %s → %s into a walking connection', (fromId, toId) => {
    const from = site(fromId);
    const to = site(toId);
    expect(from.neighbors).toContain(toId);
    expect(classifyMapRoute(from, to)).toMatchObject({ kind: 'sea-crossing', requiresSeaTransport: true });
    expect(classifyMapRoute(to, from)).toEqual(classifyMapRoute(from, to));
    expect(validateLandRoute(from, to)).toMatchObject({ allowed: false, code: 'sea-crossing' });
    expect(validateLandRoute(to, from)).toMatchObject({ allowed: false, code: 'sea-crossing' });
  });

  it.each([
    ['britain', 'liverpool'], ['sicily', 'messina'], ['philippines', 'clark'],
    ['mindanao', 'davao'], ['dutch_east_indies', 'surabaya'], ['new_guinea', 'port_moresby'],
    ['japan_home', 'yokosuka'], ['el_alamein', 'tobruk'], ['france', 'normandy'],
    ['malaya', 'singapore'], ['darwin', 'brisbane'],
  ])('preserves the land corridor %s → %s even at ports and landing coasts', (fromId, toId) => {
    expect(validateLandRoute(site(fromId), site(toId))).toMatchObject({ allowed: true, code: 'allowed' });
    expect(classifyMapRoute(site(fromId), site(toId)).kind).toBe('land');
  });

  it('rejects land orders to or from sea while retaining the displayed strategic relationship', () => {
    expect(classifyMapRoute(site('britain'), site('channel')).kind).toBe('sea');
    expect(validateLandRoute(site('britain'), site('channel')).code).toBe('sea-target');
    expect(validateLandRoute(site('channel'), site('france')).code).toBe('sea-origin');
    expect(validateLandRoute(site('coral_sea'), site('new_guinea')).code).toBe('sea-origin');
  });

  it('requires directional adjacency and refuses self-orders', () => {
    expect(validateLandRoute(site('britain'), site('germany')).code).toBe('not-adjacent');
    expect(validateLandRoute({ ...site('britain'), neighbors: ['britain'] }, site('britain')).code).toBe('not-adjacent');
    expect(validateLandRoute({ ...site('france'), neighbors: [] }, site('normandy')).code).toBe('not-adjacent');
  });

  it('preserves unregistered scenario corridors rather than guessing from coastal names', () => {
    const scenario = { ...site('france'), id: 'rear', terrain: '요새 해안', siteType: 'port' as const, neighbors: ['philippines'] };
    expect(classifyMapRoute(scenario, site('philippines'))).toMatchObject({ kind: 'land', basis: 'legacy-adjacency' });
    expect(validateLandRoute(scenario, site('philippines')).allowed).toBe(true);
  });

  it('keeps the explicit catalog unique and attached to actual mapped places', () => {
    const ids = Object.values(MAP_LANDMASS_GROUPS).flat();
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(territoryById.has(id), id).toBe(true));
    MAP_WATER_CROSSINGS.forEach(([fromId, toId]) => {
      expect(site(fromId).neighbors, `${fromId}:${toId}`).toContain(toId);
    });
  });

  it('registers both endpoints of all existing island connections, preserving unknown custom nodes only', () => {
    Object.entries(MAP_LANDMASS_GROUPS).filter(([group]) => group !== 'mainland').forEach(([, ids]) => {
      ids.forEach((id) => site(id).neighbors.forEach((neighborId) => {
        expect(isSeaTerritory(site(neighborId)) || Boolean(getMapLandmassId(neighborId)), `${id}:${neighborId}`).toBe(true);
      }));
    });
  });

  it('agrees on route domain and land-order eligibility for every actual adjacency in both directions', () => {
    territories.forEach((from) => from.neighbors.forEach((toId) => {
      const to = site(toId);
      const route = classifyMapRoute(from, to);
      const label = `${from.id}:${to.id}`;
      expect(classifyMapRoute(to, from), label).toEqual(route);
      expect(route.requiresSeaTransport, label).toBe(route.kind !== 'land');
      expect(validateLandRoute(from, to).allowed, label).toBe(route.kind === 'land');
      expect(validateLandRoute(to, from).allowed, label).toBe(route.kind === 'land');
    }));
  });

  it('never applies legacy-position repair to any of the thirteen nations’ valid starting formations', () => {
    nations.forEach((nation) => {
      const divisions = createCampaignDivisions(nation);
      const result = recoverLegacySeaPositions({ divisions, territories, orders: [], playerFaction: nation.alignment });
      expect(result.changes, nation.id).toEqual([]);
      expect(result.unresolvedDivisionIds, nation.id).toEqual([]);
      result.divisions.forEach((division, index) => expect(division, `${nation.id}:${division.id}`).toBe(divisions[index]));
    });
  });
});
