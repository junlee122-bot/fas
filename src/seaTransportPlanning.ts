import { findSeaTransportRoute } from './seaTransport';
import type { Territory } from './types';

// A territory snapshot is immutable in the campaign. Weak keys let old weeks be
// collected and prevent a draft/selection change from re-running every route BFS.
const destinationsBySnapshot = new WeakMap<readonly Territory[], Map<string, readonly Territory[]>>();
export function getSeaTransportDestinations(fromId: string, territories: readonly Territory[]): readonly Territory[] {
  let origins = destinationsBySnapshot.get(territories);
  if (!origins) { origins = new Map(); destinationsBySnapshot.set(territories, origins); }
  let result = origins.get(fromId);
  if (!result) {
    result = Object.freeze(territories.filter((territory) => findSeaTransportRoute(fromId, territory.id, territories)));
    origins.set(fromId, result);
  }
  return result;
}
