import { isSeaTerritory } from './mapRoutes';
import type { Division, Faction, Order, Territory, TheaterId } from './types';

export interface LandPositionRecoveryChange {
  divisionId: string;
  fromId: string;
  toId: string;
  reason: 'recorded-origin' | 'safe-staging';
}

export interface LandPositionRecoveryResult {
  divisions: Division[];
  changes: LandPositionRecoveryChange[];
  unresolvedDivisionIds: string[];
}

export interface LandPositionRecoveryInput {
  divisions: readonly Division[];
  territories: readonly Territory[];
  orders: readonly Order[];
  playerFaction: Exclude<Faction, 'neutral'>;
}

/** Save repair only: these staging priorities are not in-game transport routes. */
export const LEGACY_SEA_STAGING: Readonly<Record<string, { theater: TheaterId; candidates: readonly string[] }>> = {
  atlantic: { theater: 'europe', candidates: ['liverpool', 'belfast', 'britain', 'plymouth', 'brittany', 'bordeaux', 'morocco'] },
  channel: { theater: 'europe', candidates: ['portsmouth', 'britain', 'calais', 'normandy', 'cherbourg', 'france'] },
  coral_sea: { theater: 'asia', candidates: ['port_moresby', 'milne_bay', 'townsville', 'brisbane', 'new_guinea', 'solomons'] },
};

/**
 * Older builds could place land formations on ocean nodes. Repair only those
 * invalid positions while loading a save. Never capture territory, replenish
 * troops, refund command points or alter orders here. If the original land
 * position and explicit friendly staging options are all unavailable, retain
 * the unresolved formation for the caller to explain instead of teleporting
 * it to an arbitrary city or another theater.
 */
export function recoverLegacySeaPositions({ divisions, territories, orders, playerFaction }: LandPositionRecoveryInput): LandPositionRecoveryResult {
  const byId = new Map(territories.map((territory) => [territory.id, territory]));
  const changes: LandPositionRecoveryChange[] = [];
  const unresolvedDivisionIds: string[] = [];
  const recoveredDivisions = divisions.map((division) => {
    const current = byId.get(division.territoryId);
    if (!isSeaTerritory(current ?? { id: division.territoryId })) return division;
    const staging = LEGACY_SEA_STAGING[division.territoryId];
    const sourceTheater = current?.theater ?? staging?.theater ?? 'europe';
    const isSafeLand = (id: string): boolean => {
      const candidate = byId.get(id);
      return candidate !== undefined
        && !isSeaTerritory(candidate)
        && candidate.controller === playerFaction
        && (candidate.theater ?? 'europe') === sourceTheater;
    };
    const recordedOrigin = [...orders]
      .filter((order) => order.divisionId === division.id && isSafeLand(order.fromId))
      .sort((a, b) => b.startedWeek - a.startedWeek || a.fromId.localeCompare(b.fromId) || (a.id ?? '').localeCompare(b.id ?? ''))[0]?.fromId;
    const destinationId = recordedOrigin ?? staging?.candidates.find(isSafeLand);
    if (!destinationId) {
      unresolvedDivisionIds.push(division.id);
      return division;
    }
    changes.push({ divisionId: division.id, fromId: division.territoryId, toId: destinationId, reason: recordedOrigin ? 'recorded-origin' : 'safe-staging' });
    return { ...division, territoryId: destinationId };
  });
  return { divisions: recoveredDivisions, changes, unresolvedDivisionIds };
}
