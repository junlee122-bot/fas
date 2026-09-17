import { isSeaTerritory } from './mapRoutes';
import type { Division, Faction, Territory } from './types';

/** One national week of recovery at a supplied friendly land garrison. */
export function recoverPeacetimeDivisions(
  divisions: readonly Division[],
  territories: readonly Territory[],
  playerFaction: Exclude<Faction, 'neutral'>,
  lockedDivisionIds: ReadonlySet<string>,
): Division[] {
  const byId = new Map(territories.map((territory) => [territory.id, territory]));
  return divisions.map((division) => {
    if (division.status !== 'recovering' || lockedDivisionIds.has(division.id)
      || !Number.isFinite(division.strength) || division.strength <= 0
      || !Number.isFinite(division.organization) || !Number.isFinite(division.supply)) return division;
    const location = byId.get(division.territoryId);
    if (!location || location.controller !== playerFaction || isSeaTerritory(location)
      || !Number.isFinite(location.supply) || location.supply < 30) return division;
    const organization = Math.min(100, Math.max(0, division.organization) + 10);
    const supply = Math.min(100, Math.max(0, division.supply) + 6);
    const strength = Math.min(100, division.strength + 2);
    return {
      ...division, organization, supply, strength,
      status: organization >= 70 && supply >= 40 && strength > 20 ? 'ready' : 'recovering',
    };
  });
}
