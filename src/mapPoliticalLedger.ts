import type { Faction, NationId, Territory } from './types';

export interface PoliticalSnapshot {
  controller: Faction;
  gameOwnerId?: NationId;
  verifiedControllerNationId?: NationId;
}
export interface PoliticalSource {
  kind: 'land-combat' | 'sea-transport' | 'enemy-land' | 'enemy-sea' | 'nation-transition' | 'treaty-transfer';
  id: string;
  label: string;
}
export interface PoliticalChange {
  id: string;
  territoryId: string;
  week: number;
  source: PoliticalSource;
  before: PoliticalSnapshot;
  after: PoliticalSnapshot;
}
export interface MapPoliticalLedger {
  version: 1;
  startedWeek: number;
  baselineKind: 'campaign-start' | 'legacy-load';
  current: Record<string, PoliticalSnapshot>;
  changes: PoliticalChange[];
  /** Last state-changing receipt per territory survives the bounded display history. */
  latestByTerritory: Record<string, PoliticalChange>;
  omittedCount: number;
  /** Receipt IDs survive history trimming so repeated result delivery stays idempotent. */
  seenIds: string[];
}
export interface PoliticalUpdate {
  territoryId: string;
  controller: Faction;
  gameOwnerId?: NationId;
  verifiedControllerNationId?: NationId;
  source: PoliticalSource;
  week: number;
}

const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const kinds = new Set(['land-combat', 'sea-transport', 'enemy-land', 'enemy-sea', 'nation-transition', 'treaty-transfer']);
const validWeek = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const validNation = (value: unknown) => value === undefined || typeof value === 'string' && nations.has(value);
const validText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 500;
const validSnapshot = (value: unknown): value is PoliticalSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const item = value as PoliticalSnapshot;
  return ['allies', 'axis', 'neutral'].includes(item.controller) && validNation(item.gameOwnerId) && validNation(item.verifiedControllerNationId);
};
const snapshot = (value: PoliticalSnapshot): PoliticalSnapshot => ({ controller: value.controller, gameOwnerId: value.gameOwnerId, verifiedControllerNationId: value.verifiedControllerNationId });
const same = (a: PoliticalSnapshot, b: PoliticalSnapshot) => a.controller === b.controller && a.gameOwnerId === b.gameOwnerId && a.verifiedControllerNationId === b.verifiedControllerNationId;
const receiptId = (update: Pick<PoliticalUpdate, 'source' | 'week' | 'territoryId'>) => JSON.stringify([update.source.kind, update.source.id, update.week, update.territoryId]);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const validChange = (value: unknown): value is PoliticalChange => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const change = value as PoliticalChange;
  return validText(change.territoryId) && validWeek(change.week)
    && validSnapshot(change.before) && validSnapshot(change.after) && !same(change.before, change.after)
    && !!change.source && typeof change.source === 'object' && !Array.isArray(change.source)
    && kinds.has(change.source.kind) && validText(change.source.id) && validText(change.source.label)
    && change.id === receiptId(change);
};
const cloneChange = (change: PoliticalChange): PoliticalChange => ({
  id: change.id, territoryId: change.territoryId, week: change.week,
  source: { kind: change.source.kind, id: change.source.id, label: change.source.label },
  before: snapshot(change.before), after: snapshot(change.after),
});
const sameChange = (a: PoliticalChange, b: PoliticalChange) => a.id === b.id && a.territoryId === b.territoryId && a.week === b.week
  && a.source.kind === b.source.kind && a.source.id === b.source.id && a.source.label === b.source.label
  && same(a.before, b.before) && same(a.after, b.after);

export function createMapPoliticalLedger(territories: readonly Territory[], week: number, baselineKind: MapPoliticalLedger['baselineKind'] = 'campaign-start'): MapPoliticalLedger {
  return {
    version: 1, startedWeek: validWeek(week) ? week : 0, baselineKind,
    current: Object.fromEntries(territories.map((territory) => [territory.id, { controller: territory.controller, gameOwnerId: territory.ownerId }])),
    changes: [], latestByTerritory: {}, omittedCount: 0, seenIds: [],
  };
}

/** Append only at confirmed result hooks, not during rendering or from newspaper text.
 * This read model never changes territory, resources, permissions, or approval state.
 */
export function recordPoliticalUpdates(ledger: MapPoliticalLedger, updates: readonly PoliticalUpdate[]): MapPoliticalLedger {
  let result = ledger;
  const seen = new Set(ledger.seenIds);
  for (const update of updates) {
    const before = result.current[update.territoryId];
    const after = snapshot(update);
    if (!before || !validSnapshot(after) || !validWeek(update.week) || update.week < (result.changes.at(-1)?.week ?? ledger.startedWeek)
      || !kinds.has(update.source.kind) || !validText(update.source.id) || !validText(update.source.label)) continue;
    const id = receiptId(update);
    if (seen.has(id)) continue;
    seen.add(id);
    const changed = !same(before, after);
    const change: PoliticalChange = { id, territoryId: update.territoryId, week: update.week, source: { ...update.source }, before: snapshot(before), after };
    const changes = changed ? [...result.changes, change] : result.changes;
    const excess = Math.max(0, changes.length - 512);
    result = {
      ...result,
      current: changed ? { ...result.current, [update.territoryId]: after } : result.current,
      changes: excess ? changes.slice(excess) : changes,
      latestByTerritory: changed ? { ...result.latestByTerritory, [update.territoryId]: cloneChange(change) } : result.latestByTerritory,
      omittedCount: result.omittedCount + excess,
      seenIds: [...result.seenIds, id],
    };
  }
  return result;
}

/** Old/malformed/mismatched saves start an explicit observation baseline. Never invent a past.
 * Older v1 saves may recover proof from retained changes. If verified control has no
 * surviving receipt, the whole ledger becomes an unverified legacy-load baseline.
 * This validates internal provenance, not the authenticity of unsigned save files.
 */
export function normalizeMapPoliticalLedger(value: unknown, territories: readonly Territory[], week: number): MapPoliticalLedger {
  const fallback = () => createMapPoliticalLedger(territories, week, 'legacy-load');
  if (!validWeek(week) || !value || typeof value !== 'object') return fallback();
  const raw = value as MapPoliticalLedger;
  if (raw.version !== 1 || !validWeek(raw.startedWeek) || raw.startedWeek > week
    || !['campaign-start', 'legacy-load'].includes(raw.baselineKind)
    || !raw.current || typeof raw.current !== 'object' || Array.isArray(raw.current) || !Array.isArray(raw.changes) || raw.changes.length > 512
    || raw.latestByTerritory !== undefined && (!raw.latestByTerritory || typeof raw.latestByTerritory !== 'object' || Array.isArray(raw.latestByTerritory))
    || !Array.isArray(raw.seenIds) || !raw.seenIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 1600) || !validWeek(raw.omittedCount)) return fallback();
  const current: Record<string, PoliticalSnapshot> = {};
  for (const territory of territories) {
    const saved = raw.current[territory.id];
    // Newly added geography has no earlier receipt; only its present attribution is known.
    if (saved === undefined) { current[territory.id] = { controller: territory.controller, gameOwnerId: territory.ownerId }; continue; }
    if (!validSnapshot(saved) || saved.controller !== territory.controller || saved.gameOwnerId !== territory.ownerId) return fallback();
    current[territory.id] = snapshot(saved);
  }
  const ids = new Set<string>();
  const seen = new Set(raw.seenIds);
  const seenIndex = new Map([...seen].map((id, index) => [id, index]));
  const last = new Map<string, PoliticalChange>();
  const changes: PoliticalChange[] = [];
  let lastWeek = raw.startedWeek;
  let lastSeenIndex = -1;
  for (const change of raw.changes) {
    if (!validChange(change) || !own(current, change.territoryId)
      || change.week < lastWeek || change.week > week
      || ids.has(change.id) || !seen.has(change.id) || seenIndex.get(change.id)! <= lastSeenIndex) return fallback();
    const previous = last.get(change.territoryId);
    if (previous && !same(previous.after, change.before)) return fallback();
    lastWeek = change.week;
    lastSeenIndex = seenIndex.get(change.id)!;
    ids.add(change.id);
    last.set(change.territoryId, change);
    changes.push(cloneChange(change));
  }
  const latestByTerritory: Record<string, PoliticalChange> = {};
  // Absence, unlike a present-but-incomplete map, is a compatible older v1 save.
  const latest = raw.latestByTerritory ?? Object.fromEntries(last);
  let trimmedProofCount = 0;
  for (const [id, change] of Object.entries(latest)) {
    if (!validChange(change) || id !== change.territoryId || !own(current, id)
      || change.week < raw.startedWeek || change.week > week || !seen.has(change.id)
      || !same(change.after, current[id])) return fallback();
    const retained = last.get(id);
    if (retained) {
      if (!sameChange(change, retained)) return fallback();
    } else {
      // A receipt absent from displayed history must precede its first retained
      // entry, including same-week events, and be accounted for by actual trimming.
      const first = changes[0];
      if (!first || changes.length !== 512 || raw.omittedCount === 0
        || change.week > first.week || seenIndex.get(change.id)! >= seenIndex.get(first.id)!) return fallback();
      trimmedProofCount += 1;
    }
    latestByTerritory[id] = cloneChange(change);
  }
  if (trimmedProofCount > raw.omittedCount) return fallback();
  for (const id of last.keys()) if (!own(latestByTerritory, id)) return fallback();
  for (const [id, state] of Object.entries(current)) {
    if (state.verifiedControllerNationId !== undefined && !own(latestByTerritory, id)) return fallback();
  }
  return { version: 1, startedWeek: raw.startedWeek, baselineKind: raw.baselineKind, current, changes, latestByTerritory, omittedCount: raw.omittedCount, seenIds: [...seen] };
}
