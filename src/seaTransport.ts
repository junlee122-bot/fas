import { classifyMapRoute, isSeaTerritory } from './mapRoutes';
import type { AirGroup, JointForcesState, NavalTaskForce } from './jointOperations';
import { advanceFleetNavigationWeek, beginFleetReturn, dispatchFleetTransit, fleetEnduranceProfiles, forecastFleetTransit, getAirPatrolCoverage, hasFleetNavigationReservation, nauticalDistance, resolveNavalTerritoryPoint, syncFleetEscortPosition } from './navalNavigation';
import type { Division, Faction, GameState, NationId, Order, Stockpile, Territory, TheaterId } from './types';

export type SeaTransportStage = 'embarking' | 'sailing' | 'landing' | 'beachhead' | 'disembarking' | 'returning' | 'waiting-return' | 'rescuing';
export type SeaTransportOutcome = 'transferred' | 'landed' | 'recalled' | 'failed-landing' | 'diverted';
export const seaTransportStageLabels: Record<SeaTransportStage, string> = {
  embarking: '승선 준비', sailing: '해상 항해', landing: '상륙 교전', beachhead: '교두보 보급',
  disembarking: '하선·재편', returning: '귀환 항해', 'waiting-return': '구조·귀환항 대기', rescuing: '구조선 접근',
};
export interface SeaTransportPlan { divisionId: string; fromId: string; targetId: string; escortFleetId?: string; escortFleetIds?: string[]; airGroupIds?: string[] }
export interface SeaTransportContext {
  week: number; nationId: NationId; playerFaction: Exclude<Faction, 'neutral'>; phase: 'war' | 'nation';
  divisions: readonly Division[]; territories: readonly Territory[]; orders: readonly Order[];
  commandableDivisionIds: ReadonlySet<string>; game: GameState; stockpile: Stockpile;
  jointForces: JointForcesState; processingWeek?: boolean; canCommandEscort?: boolean;
  enemyInterdiction?: Readonly<Record<string, number>>;
}
export interface SeaTransportPhaseWeeks { embarking: number; sailing: number; landing: number; beachhead: number; disembarking: number }
export interface SeaTransportEscort {
  fleetId: string; name: string; protection: number; commandCost: number; fuelCost: number;
  arrivalWeeks?: number; distanceNm?: number; rangeNm?: number;
}
export interface SeaTransportAirSupport {
  airGroupId: string; name: string; protection: number; commandCost: number; fuelCost: number;
  coverage: number; distanceNm: number; radiusNm: number; baseName: string;
}
export interface SeaTransportAirSupportOption extends SeaTransportAirSupport { group: AirGroup; allowed: boolean; reason: string }
export interface SeaTransportEscortOption {
  fleet: NavalTaskForce; allowed: boolean; reason: string; protection: number; commandCost: number; fuelCost: number;
}
/** Weekly strategic travel abstraction, not a historical fleet sailing timetable. */
export interface SeaTransportEscortRelief {
  fleetId: string; fleetName: string; previousFleetId?: string; previousFleetName?: string;
  dispatchedWeek: number; arrivalWeeks: number; elapsedWeeks: number; commandCost: number; fuelCost: number;
  source: 'reinforcement' | 'rescue';
}
export interface SeaTransportEscortReliefRecord extends SeaTransportEscortRelief {
  status: 'joined' | 'cancelled' | 'lost'; resolvedWeek: number; reason: string;
}
export interface SeaTransportEscortReliefForecast {
  allowed: boolean; reason: string; escort: SeaTransportEscort | null; arrivalWeeks: number; minimumWeeks: number;
  commandCost: number; fuelCost: number; factors: string[];
}
export interface SeaTransportRescue {
  dispatchedWeek: number; baseId: string; baseName: string; routeIds: string[];
  outboundWeeks: number; returnWeeks: number; attempt: number;
  assemblyWeeks?: number;
}
export interface SeaTransportRescueForecast {
  allowed: boolean; reason: string; baseId: string; baseName: string; routeIds: string[];
  commandCost: number; fuelCost: number; convoyCost: number; outboundWeeks: number;
  returnWeeks: number; minimumWeeks: number; factors: string[]; escort: SeaTransportEscort | null;
}
export interface SeaTransportForecast {
  allowed: boolean; reason: string; routeIds: string[]; mode: 'transfer' | 'landing';
  commandCost: number; fuelCost: number; convoyCost: number; phaseWeeks: SeaTransportPhaseWeeks;
  minimumWeeks: number; successChance: number; factors: string[]; escort: SeaTransportEscort | null;
  escorts: SeaTransportEscort[]; airSupport: SeaTransportAirSupport[]; supportProtection: number;
}
export interface SeaTransportOperation extends SeaTransportPlan {
  id: string; nationId: NationId; playerFaction: Exclude<Faction, 'neutral'>; theater: TheaterId;
  divisionName: string; fromName: string; targetName: string; routeIds: string[]; mode: 'transfer' | 'landing';
  stage: SeaTransportStage; startedWeek: number; elapsedWeeks: number; stageWeeks: number;
  phaseWeeks: SeaTransportPhaseWeeks; commandCost: number; fuelCost: number;
  convoysReserved: number; convoysRemaining: number; strengthLoss: number; organizationLoss: number;
  successChance: number; landingCaptured: boolean; lastMessage: string; returnRequestedWeek?: number;
  returnTargetId?: string; returnRouteIds?: string[]; returnWeeks?: number; returnOutcome?: SeaTransportOutcome;
  escortFleetName?: string; escortShipsLost?: number; rescue?: SeaTransportRescue; rescueDispatches?: number;
  pendingEscortRelief?: SeaTransportEscortRelief; escortReliefHistory?: SeaTransportEscortReliefRecord[];
  airGroupNames?: string[]; aircraftLost?: number;
}
export interface SeaTransportRecord {
  id: string; operationId: string; divisionId: string; divisionName: string; fromId: string; targetId: string;
  fromName: string; targetName: string; startedWeek: number; endedWeek: number; elapsedWeeks: number;
  outcome: SeaTransportOutcome; arrivalId: string; convoysReserved: number; convoysReturned: number;
  convoysLost: number; strengthLoss: number; organizationLoss: number; commandCost: number; fuelCost: number; result: string;
  escortFleetId?: string; escortFleetName?: string; escortShipsLost?: number; rescueDispatches?: number;
  escortReliefHistory?: SeaTransportEscortReliefRecord[];
  escortFleetIds?: string[]; airGroupIds?: string[]; airGroupNames?: string[]; aircraftLost?: number;
}
export interface SeaTransportState { version: 1; operations: SeaTransportOperation[]; records: SeaTransportRecord[]; lastProcessedWeek?: number }
export interface SeaTransportEvent { operationId: string; title: string; detail: string; tone: 'good' | 'bad' | 'neutral'; resolved: boolean }
export interface SeaTransportResult {
  state: SeaTransportState; accepted: boolean; reason: string; gameDelta: Partial<GameState>; convoyDelta: number;
  divisionUpdates: Division[]; territoryUpdates: Territory[]; events: SeaTransportEvent[];
  fleetUpdates?: NavalTaskForce[];
  airGroupUpdates?: AirGroup[];
  /** Actual aircraft lost this settlement, not cumulative historical losses. */
  aircraftDelta?: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
const theaterOf = (territory: Territory) => territory.theater ?? 'europe';
const phases = new Set(Object.keys(seaTransportStageLabels));
const outcomes = new Set<SeaTransportOutcome>(['transferred', 'landed', 'recalled', 'failed-landing', 'diverted']);
const escortKinds = new Set<NavalTaskForce['kind']>(['surface', 'escort', 'carrier', 'coastal']);

function normalizedEscortRelief(value: unknown): SeaTransportEscortRelief | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const relief = value as SeaTransportEscortRelief;
  if (!text(relief.fleetId) || !text(relief.fleetName) || !['reinforcement', 'rescue'].includes(relief.source)
    || ![relief.dispatchedWeek, relief.arrivalWeeks, relief.elapsedWeeks, relief.commandCost, relief.fuelCost].every((number) => finite(number) && number >= 0)
    || relief.fleetId === relief.previousFleetId) return undefined;
  return { fleetId: relief.fleetId, fleetName: relief.fleetName,
    previousFleetId: text(relief.previousFleetId) ? relief.previousFleetId : undefined,
    previousFleetName: text(relief.previousFleetName) ? relief.previousFleetName : undefined,
    dispatchedWeek: Math.floor(relief.dispatchedWeek), arrivalWeeks: Math.max(relief.source === 'rescue' ? 2 : 1, Math.floor(relief.arrivalWeeks)),
    elapsedWeeks: Math.floor(relief.elapsedWeeks), commandCost: relief.commandCost, fuelCost: relief.fuelCost, source: relief.source };
}
function normalizedEscortReliefHistory(value: unknown): SeaTransportEscortReliefRecord[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((record) => {
    const relief = normalizedEscortRelief(record);
    return relief && ['joined', 'cancelled', 'lost'].includes(record.status) && finite(record.resolvedWeek) && record.resolvedWeek >= relief.dispatchedWeek
      ? [{ ...relief, status: record.status, resolvedWeek: Math.floor(record.resolvedWeek), reason: typeof record.reason === 'string' ? record.reason : '저장된 호위 교대 기록입니다.' } as SeaTransportEscortReliefRecord] : [];
  });
}
function releasedEscort(fleet: NavalTaskForce, context: SeaTransportContext): NavalTaskForce {
  return beginFleetReturn(fleet, context.week, context.territories, context.playerFaction);
}

function normalizedRescue(value: unknown): SeaTransportRescue | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const rescue = value as SeaTransportRescue;
  if (!text(rescue.baseId) || !text(rescue.baseName) || !Array.isArray(rescue.routeIds) || rescue.routeIds.length < 2
    || !rescue.routeIds.every(text) || rescue.routeIds[0] !== rescue.baseId
    || ![rescue.dispatchedWeek, rescue.outboundWeeks, rescue.returnWeeks, rescue.attempt].every((number) => finite(number) && number >= 0)) return undefined;
  return { ...rescue, routeIds: [...rescue.routeIds], dispatchedWeek: Math.floor(rescue.dispatchedWeek),
    assemblyWeeks: finite(rescue.assemblyWeeks) ? Math.floor(clamp(rescue.assemblyWeeks, 0, Math.max(0, rescue.outboundWeeks - 2))) : 0,
    outboundWeeks: Math.max(2, Math.floor(rescue.outboundWeeks)), returnWeeks: Math.max(2, Math.floor(rescue.returnWeeks)), attempt: Math.max(1, Math.floor(rescue.attempt)) };
}

/**
 * Endpoint exceptions are grounded in strategicMapData.ts's existing place names
 * and descriptions: ports/islands already have explicit siteType, while these
 * coastal capitals, fortress harbors and named landing shores use other types.
 * This is NOT a coastline inference from map adjacency or generic terrain text.
 * In particular Paris/central France, inland Morocco/Algeria, Cairo, Delhi,
 * Seoul/central Korea and Clark airfield remain inland even on an old sea edge.
 */
export const SEA_TRANSPORT_COASTAL_ENDPOINT_IDS: readonly string[] = [
  'britain', 'norway', 'baltic', 'malta', 'burma', 'singapore',
  'japan_home', 'philippines', 'dutch_east_indies', 'new_guinea',
  'calais', 'normandy', 'east_prussia', 'leningrad', 'crimea',
  'salerno', 'anzio', 'tobruk', 'cherbourg', 'odessa', 'messina',
  'arakan', 'hiroshima', 'lingayen', 'bataan', 'milne_bay',
  'taiwan', 'guam', 'saipan', 'truk', 'okinawa', 'kwajalein',
  'tarawa', 'biak', 'wake', 'iwo_jima',
];
const coastalEndpointIds = new Set(SEA_TRANSPORT_COASTAL_ENDPOINT_IDS);
export function isSeaTransportEndpoint(territory: Territory): boolean {
  return !isSeaTerritory(territory)
    && (territory.siteType === 'port' || territory.siteType === 'island' || coastalEndpointIds.has(territory.id));
}

/** Strategic abstraction: coefficients are game balance, not historical transport capacities or timetables. */
export function createSeaTransportState(): SeaTransportState { return { version: 1, operations: [], records: [] }; }

/** Reject malformed/duplicate reservations. Loading never creates resources or performs a landing. */
export function normalizeSeaTransportState(value: unknown): SeaTransportState {
  if (!value || typeof value !== 'object') return createSeaTransportState();
  const candidate = value as Partial<SeaTransportState>;
  if (candidate.version !== 1) return createSeaTransportState();
  const recordIds = new Set<string>();
  const records = (Array.isArray(candidate.records) ? candidate.records : []).filter((record): record is SeaTransportRecord => {
    if (!record || typeof record !== 'object' || !text(record.id) || !text(record.operationId) || recordIds.has(record.operationId)
      || !outcomes.has(record.outcome) || !finite(record.endedWeek) || !finite(record.convoysReturned)
      || !finite(record.convoysReserved) || record.convoysReturned < 0 || record.convoysReturned > record.convoysReserved) return false;
    recordIds.add(record.operationId); return true;
  }).map((record) => ({ ...record,
    escortFleetId: text(record.escortFleetId) ? record.escortFleetId : undefined,
    escortFleetName: text(record.escortFleetName) ? record.escortFleetName : undefined,
    escortShipsLost: finite(record.escortShipsLost) ? Math.max(0, Math.floor(record.escortShipsLost)) : undefined,
    rescueDispatches: finite(record.rescueDispatches) ? Math.max(0, Math.floor(record.rescueDispatches)) : undefined,
    escortReliefHistory: normalizedEscortReliefHistory(record.escortReliefHistory),
    escortFleetIds: Array.isArray(record.escortFleetIds) ? [...new Set(record.escortFleetIds.filter(text))].slice(0, 3) : undefined,
    airGroupIds: Array.isArray(record.airGroupIds) ? [...new Set(record.airGroupIds.filter(text))].slice(0, 2) : undefined,
    aircraftLost: finite(record.aircraftLost) ? Math.max(0, Math.floor(record.aircraftLost)) : undefined,
  }));
  const divisionIds = new Set<string>(); const operationIds = new Set<string>(); const escortIds = new Set<string>(); const aircraftIds = new Set<string>();
  const operations: SeaTransportOperation[] = (Array.isArray(candidate.operations) ? candidate.operations : []).filter((operation): operation is SeaTransportOperation => {
    if (!operation || typeof operation !== 'object' || !text(operation.id) || !text(operation.divisionId)
      || !text(operation.fromId) || !text(operation.targetId) || !text(operation.nationId)
      || !['allies', 'axis'].includes(operation.playerFaction) || !['europe', 'asia'].includes(operation.theater)
      || !['transfer', 'landing'].includes(operation.mode) || !phases.has(operation.stage)
      || operationIds.has(operation.id) || recordIds.has(operation.id) || divisionIds.has(operation.divisionId)
      || !Array.isArray(operation.routeIds) || operation.routeIds.length < 2 || !operation.routeIds.every(text)
      || operation.routeIds[0] !== operation.fromId || operation.routeIds.at(-1) !== operation.targetId
      || !operation.phaseWeeks || !['embarking', 'sailing', 'landing', 'beachhead', 'disembarking'].every((phase) => finite(operation.phaseWeeks[phase as keyof SeaTransportPhaseWeeks]) && operation.phaseWeeks[phase as keyof SeaTransportPhaseWeeks] >= 0)
      || ![operation.startedWeek, operation.elapsedWeeks, operation.stageWeeks, operation.convoysReserved, operation.convoysRemaining, operation.commandCost, operation.fuelCost, operation.strengthLoss, operation.organizationLoss, operation.successChance].every((number) => finite(number) && number >= 0)
      || operation.convoysReserved < 1 || operation.convoysRemaining > operation.convoysReserved) return false;
    operationIds.add(operation.id); divisionIds.add(operation.divisionId); return true;
  }).map((operation) => {
    const escortFleetIds = getSeaTransportAssignedFleetIds({ ...operation, escortFleetIds: Array.isArray(operation.escortFleetIds) ? operation.escortFleetIds : [] }).filter((id) => !escortIds.has(id)).slice(0, 3);
    for (const id of escortFleetIds) escortIds.add(id);
    const escortFleetId = escortFleetIds[0];
    const airGroupIds = Array.isArray(operation.airGroupIds) ? [...new Set(operation.airGroupIds.filter(text))].filter((id) => !aircraftIds.has(id)).slice(0, 2) : [];
    for (const id of airGroupIds) aircraftIds.add(id);
    return ({
    ...operation, routeIds: [...operation.routeIds], phaseWeeks: {
      embarking: Math.max(1, Math.floor(operation.phaseWeeks.embarking)), sailing: Math.max(2, Math.floor(operation.phaseWeeks.sailing)),
      landing: operation.mode === 'landing' ? Math.max(2, Math.floor(operation.phaseWeeks.landing)) : 0,
      beachhead: operation.mode === 'landing' ? Math.max(2, Math.floor(operation.phaseWeeks.beachhead)) : 0,
      disembarking: operation.mode === 'transfer' || operation.stage === 'disembarking' ? Math.max(1, Math.floor(operation.phaseWeeks.disembarking)) : Math.max(0, Math.floor(operation.phaseWeeks.disembarking)),
    },
    divisionName: text(operation.divisionName) ? operation.divisionName : operation.divisionId,
    fromName: text(operation.fromName) ? operation.fromName : operation.fromId,
    targetName: text(operation.targetName) ? operation.targetName : operation.targetId,
    // Persisted durations cannot bypass the minimum sequence through a malformed save.
    elapsedWeeks: Math.floor(operation.elapsedWeeks), stageWeeks: Math.floor(operation.stageWeeks),
    convoysRemaining: Math.floor(operation.convoysRemaining), convoysReserved: Math.floor(operation.convoysReserved),
    returnRequestedWeek: finite(operation.returnRequestedWeek) ? operation.returnRequestedWeek : undefined,
    returnRouteIds: Array.isArray(operation.returnRouteIds) && operation.returnRouteIds.every(text) ? [...operation.returnRouteIds] : undefined,
    returnWeeks: finite(operation.returnWeeks) ? Math.max(2, operation.returnWeeks) : undefined,
    escortFleetId, escortFleetName: escortFleetId && text(operation.escortFleetName) ? operation.escortFleetName : undefined,
    escortFleetIds, airGroupIds, airGroupNames: Array.isArray(operation.airGroupNames) ? operation.airGroupNames.filter(text).slice(0, airGroupIds.length) : [],
    aircraftLost: finite(operation.aircraftLost) ? Math.max(0, Math.floor(operation.aircraftLost)) : 0,
    escortShipsLost: finite(operation.escortShipsLost) ? Math.max(0, Math.floor(operation.escortShipsLost)) : undefined,
    rescue: normalizedRescue(operation.rescue),
    rescueDispatches: finite(operation.rescueDispatches) ? Math.max(0, Math.floor(operation.rescueDispatches)) : undefined,
    pendingEscortRelief: undefined,
    escortReliefHistory: normalizedEscortReliefHistory(operation.escortReliefHistory),
    lastMessage: typeof operation.lastMessage === 'string' ? operation.lastMessage : '저장된 수송 작전입니다.',
  }); });
  // Existing escorts take priority over pending claims in damaged saves, regardless of array order.
  for (const operation of operations) {
    const original = candidate.operations?.find((item) => item?.id === operation.id);
    const pending = normalizedEscortRelief(original?.pendingEscortRelief);
    if (pending && !escortIds.has(pending.fleetId) && pending.dispatchedWeek >= operation.startedWeek
      && (pending.source !== 'rescue' || operation.rescue?.dispatchedWeek === pending.dispatchedWeek)) {
      operation.pendingEscortRelief = pending;
      escortIds.add(pending.fleetId);
    }
  }
  return { version: 1, operations, records, ...(finite(candidate.lastProcessedWeek) ? { lastProcessedWeek: candidate.lastProcessedWeek } : {}) };
}

export function getSeaTransportBusyDivisionIds(state: SeaTransportState): Set<string> {
  return new Set(state.operations.map((operation) => operation.divisionId));
}
export function getSeaTransportBusyFleetIds(state: SeaTransportState): Set<string> {
  return new Set(state.operations.flatMap((operation) => [...getSeaTransportAssignedFleetIds(operation), operation.pendingEscortRelief?.fleetId].filter((id): id is string => text(id))));
}
export function getSeaTransportAssignedFleetIds(operation: SeaTransportPlan): string[] {
  return [...new Set([operation.escortFleetId, ...(Array.isArray(operation.escortFleetIds) ? operation.escortFleetIds : [])].filter((id): id is string => text(id)))];
}
export function getSeaTransportAssignedAirGroupIds(operation: SeaTransportPlan): string[] {
  return [...new Set((Array.isArray(operation.airGroupIds) ? operation.airGroupIds : []).filter(text))];
}
function combinedProtection(fleets: readonly number[], aircraft: readonly number[]): number {
  // Additional formations cover gaps rather than multiplying invulnerability.
  const sea = [...fleets].sort((a, b) => b - a).slice(0, 3).reduce((sum, amount, index) => sum + amount * [1, .5, .25][index], 0);
  const air = [...aircraft].sort((a, b) => b - a).slice(0, 2).reduce((sum, amount, index) => sum + amount * (index ? .5 : 1), 0);
  return Math.round(clamp(sea + air, 0, 48));
}
function fleetAtPosition(fleet: NavalTaskForce, positionId: string, territories: readonly Territory[]): boolean {
  if (!fleet.navigation) return true; // Migrated active orders retain their documented pre-navigation rendezvous.
  const position = resolveNavalTerritoryPoint(positionId, territories);
  return fleet.navigation.mode === 'on-station' && !!position && nauticalDistance(fleet.navigation.position, position) <= 65;
}
function patrolCoverage(group: AirGroup, routeIds: readonly string[], context: SeaTransportContext) {
  const coverage = getAirPatrolCoverage(group, routeIds, context.territories);
  const base = coverage.baseId ? context.territories.find((territory) => territory.id === coverage.baseId) : undefined;
  return base && base.controller !== context.playerFaction ? { ...coverage, allowed: false, coverage: 0, reason: `${group.base} 기지가 우호 통제하에 없어 출격할 수 없습니다.` } : coverage;
}
export function getSeaTransportActiveProtection(operation: SeaTransportOperation, context: SeaTransportContext): number {
  if (operation.nationId !== context.nationId || operation.playerFaction !== context.playerFaction || context.jointForces.nationId !== context.nationId) return 0;
  const ids = operation.stage === 'rescuing' ? operation.pendingEscortRelief?.source === 'rescue' ? [operation.pendingEscortRelief.fleetId] : [] : getSeaTransportAssignedFleetIds(operation);
  const position = getSeaTransportCurrentPositionId(operation);
  const fleetProtection = (context.jointForces.fleets ?? []).filter((fleet) => ids.includes(fleet.id) && fleet.assignmentId === operation.id && fleet.status === 'assigned' && fleetAtPosition(fleet, position, context.territories)).map(getSeaTransportEscortProtection);
  const airProtection = (context.jointForces.airGroups ?? []).filter((group) => getSeaTransportAssignedAirGroupIds(operation).includes(group.id) && group.assignmentId === operation.id && group.status === 'assigned').map((group) => {
    const coverage = patrolCoverage(group, [position], context);
    return coverage.allowed ? Math.round(clamp(Math.min(100, group.aircraft) / 9 * group.readiness / 100 * group.serviceability / 100 * coverage.coverage, 0, 15)) : 0;
  });
  return combinedProtection(fleetProtection, airProtection);
}
export function getSeaTransportAirSupportOptions(state: SeaTransportState, context: SeaTransportContext, routeIds: readonly string[]): SeaTransportAirSupportOption[] {
  const busy = new Set(state.operations.flatMap(getSeaTransportAssignedAirGroupIds));
  return (context.jointForces.airGroups ?? []).map((group) => {
    const coverage = patrolCoverage(group, routeIds, context);
    const protection = Math.round(clamp(Math.min(100, group.aircraft) / 9 * clamp(group.readiness) / 100 * clamp(group.serviceability) / 100 * coverage.coverage, 0, 15));
    const reason = context.canCommandEscort === false ? '항공대 배속을 직접 결재할 권한이 없습니다.'
      : context.jointForces.nationId !== context.nationId ? '현재 국가의 항공대만 배속할 수 있습니다.'
      : !['maritime', 'fighter', 'recon', 'mixed'].includes(group.kind) ? '해상 초계·전투·정찰 항공대가 필요합니다.'
      : ![group.aircraft, group.readiness, group.serviceability].every(finite) || group.aircraft < 6 || group.readiness < 30 || group.serviceability < 30 ? '운용 항공기 6기·준비도와 가동률 30 이상이 필요합니다.'
      : group.status !== 'ready' || group.assignmentId || busy.has(group.id) || (context.jointForces.operations ?? []).some((operation) => operation.airGroupIds.includes(group.id)) ? '다른 임무에 배속·정비 중인 항공대입니다.'
      : !coverage.allowed ? coverage.reason : '';
    return { group, airGroupId: group.id, name: group.name, protection, commandCost: 2, fuelCost: 4 + Math.ceil(group.aircraft / 50),
      coverage: coverage.coverage, distanceNm: coverage.distanceNm, radiusNm: coverage.radiusNm, baseName: coverage.baseName,
      allowed: !reason, reason: reason || `${coverage.baseName} 기지 · 초계 반경 ${coverage.radiusNm}해리 · 항로 ${Math.round(coverage.coverage * 100)}% 엄호` };
  });
}
/** Segment occupied this week, never the intended destination before sailing there. */
export function getSeaTransportCurrentPositionId(operation: SeaTransportOperation): string {
  if (operation.stage === 'embarking') return operation.fromId;
  if (['landing', 'beachhead', 'disembarking'].includes(operation.stage)) return operation.targetId;
  const route = operation.stage === 'rescuing' ? operation.rescue?.routeIds ?? operation.routeIds
    : operation.stage === 'returning' ? operation.returnRouteIds ?? [...operation.routeIds].reverse() : operation.routeIds;
  const assembly = operation.stage === 'rescuing' ? operation.rescue?.assemblyWeeks ?? 0 : 0;
  const duration = operation.stage === 'rescuing' ? Math.max(1, (operation.rescue?.outboundWeeks ?? 2) - assembly) : operation.stage === 'returning' ? operation.returnWeeks ?? 2 : operation.phaseWeeks.sailing;
  const index = operation.stage === 'waiting-return' ? Math.max(0, Math.ceil((route.length - 1) / 2))
    : Math.min(route.length - 1, Math.floor(Math.max(0, operation.stageWeeks - assembly) / Math.max(1, duration) * (route.length - 1)));
  return route[index] ?? operation.fromId;
}

/** Risk reduction in percentage points; real remaining hulls and fatigue limit the effect. */
export function getSeaTransportEscortProtection(fleet: NavalTaskForce): number {
  if (!escortKinds.has(fleet.kind) || ![fleet.ships, fleet.readiness, fleet.organization].every(finite) || fleet.ships <= 0) return 0;
  const hulls = Math.min(16, Math.floor(fleet.ships));
  return Math.round(clamp((hulls * 1.1 + (fleet.kind === 'escort' ? 9 : fleet.kind === 'carrier' ? 7 : 4))
    * clamp(fleet.readiness) / 100 * (.4 + clamp(fleet.organization) / 100 * .6), 0, 26));
}
export function getSeaTransportEscortOptions(state: SeaTransportState, context: SeaTransportContext): SeaTransportEscortOption[] {
  const busy = getSeaTransportBusyFleetIds(state);
  return (context.jointForces.fleets ?? []).map((fleet) => {
    const commandCost = 2; const fuelCost = 4 + Math.ceil(Math.max(0, finite(fleet.ships) ? fleet.ships : 0) / 8);
    const reason = context.canCommandEscort === false ? '함대 배속을 직접 결재할 권한이 없습니다.'
      : context.jointForces.nationId !== context.nationId ? '현재 국가에 소속된 함대만 배속할 수 있습니다.'
      : !escortKinds.has(fleet.kind) ? '잠수함·비밀 수송대는 수상 호위함대로 배속할 수 없습니다.'
      : ![fleet.ships, fleet.readiness, fleet.organization].every(finite) || fleet.ships < 1 || fleet.readiness < 30 || fleet.organization < 25 ? '실제 함정 1척·준비도 30·조직력 25 이상이 필요합니다.'
      : fleet.status !== 'ready' || fleet.assignmentId || hasFleetNavigationReservation(fleet) || busy.has(fleet.id) || (context.jointForces.operations ?? []).some((operation) => operation.fleetIds.includes(fleet.id)) ? '이미 배속·항해·귀항·급유·정비 중인 함대는 다른 수송에 중복 배정할 수 없습니다.'
      : '';
    return { fleet, allowed: !reason, reason: reason || '이 수송 작전이 종료될 때까지 전속 배속합니다.', protection: getSeaTransportEscortProtection(fleet), commandCost, fuelCost };
  });
}
/** Troops awaiting embarkation and landed bridgeheads defend their real land position. */
export function getSeaTransportEmbarkedDivisionIds(state: SeaTransportState): Set<string> {
  return new Set(state.operations.filter((operation) => operation.stage !== 'beachhead' && operation.stage !== 'embarking').map((operation) => operation.divisionId));
}

/** Only sea interiors or one explicitly classified water crossing; never inland intermediate nodes. */
export function findSeaTransportRoute(fromId: string, targetId: string, territories: readonly Territory[]): string[] | null {
  const byId = new Map(territories.map((territory) => [territory.id, territory]));
  const origin = byId.get(fromId); const target = byId.get(targetId);
  if (!origin || !target || fromId === targetId || !isSeaTransportEndpoint(origin) || !isSeaTransportEndpoint(target) || theaterOf(origin) !== theaterOf(target)) return null;
  if (origin.neighbors.includes(target.id) && classifyMapRoute(origin, target).kind === 'sea-crossing') return [fromId, targetId];
  const queue: string[][] = [[origin.id]]; const visited = new Set([origin.id]);
  while (queue.length) {
    const route = queue.shift()!; const current = byId.get(route.at(-1)!)!;
    for (const id of current.neighbors) {
      const next = byId.get(id);
      if (!next || visited.has(id) || theaterOf(next) !== theaterOf(origin)) continue;
      if (id === targetId && route.length > 1) return [...route, id];
      if (!isSeaTerritory(next)) continue;
      visited.add(id); queue.push([...route, id]);
    }
  }
  return null;
}

function controls(context: SeaTransportContext, theater: TheaterId) {
  const control = context.jointForces.theaterControl[theater];
  return { sea: clamp(control?.sea ?? 35), air: clamp(control?.air ?? 35), intelligence: clamp(control?.intelligence ?? 35) };
}
export function getSeaTransportInterdictionPressure(routeIds: readonly string[], pressure: SeaTransportContext['enemyInterdiction']): number {
  const keys = [...routeIds, ...routeIds.slice(1).map((id, index) => `edge:${[routeIds[index], id].sort().join(':')}`)];
  return Math.max(0, ...keys.map((key) => finite(pressure?.[key]) ? clamp(pressure![key], 0, 24) : 0));
}
function landingChance(division: Division, target: Territory, context: SeaTransportContext, theater: TheaterId, protection = 0) {
  const control = controls(context, theater);
  const terrainPenalty = /요새|fortress|산악|mountain/iu.test(target.terrain) ? 12 : 0;
  return Math.round(clamp(12 + control.sea * .28 + control.air * .18 + control.intelligence * .06
    + division.organization * .15 + division.supply * .08 + division.strength * .12
    + (division.type === 'marine' ? 12 : 0) + protection * .25 - target.supply * .1 - terrainPenalty, 8, 96));
}

export function forecastSeaTransport(state: SeaTransportState, plan: SeaTransportPlan, context: SeaTransportContext): SeaTransportForecast {
  const origin = context.territories.find((territory) => territory.id === plan.fromId);
  const target = context.territories.find((territory) => territory.id === plan.targetId);
  const division = context.divisions.find((unit) => unit.id === plan.divisionId);
  const routeIds = findSeaTransportRoute(plan.fromId, plan.targetId, context.territories) ?? [];
  const mode = target?.controller === context.playerFaction ? 'transfer' : 'landing';
  const sailing = Math.max(2, Math.ceil(Math.max(1, routeIds.length - 2) / 2) + 1);
  const phaseWeeks = { embarking: 1, sailing, landing: mode === 'landing' ? 2 : 0, beachhead: mode === 'landing' ? 2 : 0, disembarking: mode === 'transfer' ? 1 : 0 };
  const fleetIds = getSeaTransportAssignedFleetIds(plan); const airIds = getSeaTransportAssignedAirGroupIds(plan);
  const options = getSeaTransportEscortOptions(state, context);
  const escortOptions = fleetIds.map((id) => options.find((option) => option.fleet.id === id));
  const transits = escortOptions.map((option) => option ? forecastFleetTransit(option.fleet, plan.fromId, context.territories, context.week, routeIds, context.playerFaction) : undefined);
  const escorts: SeaTransportEscort[] = escortOptions.flatMap((option, index) => option ? [{ fleetId: option.fleet.id, name: option.fleet.name,
    protection: option.protection, commandCost: option.commandCost, fuelCost: option.fuelCost + (transits[index]?.fuelCost ?? 0),
    arrivalWeeks: transits[index]?.arrivalWeeks ?? 0, distanceNm: transits[index]?.distanceNm ?? 0, rangeNm: option.fleet.navigation?.remainingRangeNm ?? fleetEnduranceProfiles[option.fleet.kind].rangeNm }] : []);
  const airOptions = getSeaTransportAirSupportOptions(state, context, routeIds);
  const selectedAir = airIds.map((id) => airOptions.find((option) => option.airGroupId === id));
  const airSupport: SeaTransportAirSupport[] = selectedAir.flatMap((option) => option ? [{ airGroupId: option.airGroupId, name: option.name, protection: option.protection,
    commandCost: option.commandCost, fuelCost: option.fuelCost, coverage: option.coverage, distanceNm: option.distanceNm, radiusNm: option.radiusNm, baseName: option.baseName }] : []);
  const escort = escorts[0] ?? null;
  const supportProtection = combinedProtection(escorts.map((item) => item.protection), airSupport.map((item) => item.protection));
  const commandCost = (mode === 'landing' ? 10 : 5) + [...escorts, ...airSupport].reduce((sum, item) => sum + item.commandCost, 0);
  const fuelCost = (mode === 'landing' ? 18 : 10) + (sailing - 2) * 4 + [...escorts, ...airSupport].reduce((sum, item) => sum + item.fuelCost, 0);
  const convoyCost = (division?.type === 'armor' ? 24 : 16) + (mode === 'landing' ? 8 : 0);
  const control = controls(context, origin ? theaterOf(origin) : 'europe');
  const forecast: SeaTransportForecast = {
    allowed: false, reason: '', routeIds, mode, commandCost, fuelCost, convoyCost, phaseWeeks, escort, escorts, airSupport, supportProtection,
    minimumWeeks: Object.values(phaseWeeks).reduce((sum, weeks) => sum + weeks, 0),
    successChance: division && target ? mode === 'transfer' ? 100 : landingChance(division, target, context, theaterOf(target), supportProtection) : 0,
    factors: [`전구 제해권 ${control.sea} · 제공권 ${control.air} · 정보 ${control.intelligence}`,
      escorts.length ? `${escorts.length}개 함대 합류 후 최대 보호 ${supportProtection}%p. 모항 출발·합류까지 ${escorts.map((item) => `${item.name} ${item.arrivalWeeks}주`).join(', ')}. 합류 전 보호하지 않습니다.` : '전속 호위함대 미배속. 전구 제해권·제공권만으로 수송합니다.',
      ...airSupport.map((item) => `${item.name}: ${item.baseName}에서 반경 ${item.radiusNm}해리, 항로 ${Math.round(item.coverage * 100)}% 초계. 기지 상실·피로·손실 시 보호가 줄어듭니다.`),
      '호위는 무적 보장이 아닙니다. 실제 잔존 함정·준비도·조직력이 보호 효과를 결정하며 항해 중 피로와 함정 손실이 발생할 수 있습니다.',
      `승인 즉시 수송선 ${convoyCost}척을 예약하고 종료 시 살아남은 선박만 돌려줍니다.`,
      '지휘력·연료는 왕복·기본 보급 예약 비용이며 취소해도 반환하지 않습니다.',
      '전구 우세·부대 상태·해안 통제 변화에 따라 피해와 상륙 성공 전망이 바뀝니다.'],
  };
  const fail = (reason: string) => ({ ...forecast, reason });
  if (context.processingWeek) return fail('주간 결산 중에는 수송을 승인할 수 없습니다.');
  if (!Number.isInteger(context.week) || context.week < 0 || (state.lastProcessedWeek !== undefined && context.week < state.lastProcessedWeek)) return fail('올바른 주간 진행 시점에서만 수송을 승인할 수 있습니다.');
  if (!division || !origin || !target) return fail('부대·출발지·목적지를 모두 선택하세요.');
  if (!context.commandableDivisionIds.has(division.id)) return fail('직접 지휘할 권한이 없는 부대입니다.');
  if (division.territoryId !== origin.id || origin.controller !== context.playerFaction) return fail('부대가 실제 주둔한 아군 육지 거점에서만 승선할 수 있습니다.');
  if (division.status !== 'ready' || state.operations.some((operation) => operation.divisionId === division.id) || context.orders.some((order) => order.divisionId === division.id)) return fail('다른 작전·회복·수송 중인 부대는 중복 배정할 수 없습니다.');
  if (![division.strength, division.organization, division.supply].every(finite) || division.strength < 30 || division.organization < 35 || division.supply < 30) return fail('병력 30·조직력 35·보급 30 이상으로 회복한 뒤 수송하세요.');
  if (!isSeaTransportEndpoint(origin) || !isSeaTransportEndpoint(target)) return fail('승선·하선은 확인된 항구·섬·상륙 해안에서만 가능합니다. 내륙 거점은 먼저 육상 이동으로 항구에 연결하세요.');
  if (!routeIds.length) return fail('같은 전구의 해상 연결 또는 해역을 통과하는 육지 목적지만 선택할 수 있습니다.');
  if (target.controller === 'neutral') return fail('중립 지역으로의 침공·주둔은 이 수송 명령으로 승인할 수 없습니다.');
  if (mode === 'landing' && context.phase !== 'war') return fail('평시에는 아군 항구·거점 사이의 수송만 가능합니다.');
  if ((plan.escortFleetIds && (!Array.isArray(plan.escortFleetIds) || plan.escortFleetIds.some((id) => !text(id)) || new Set(plan.escortFleetIds).size !== plan.escortFleetIds.length))
    || (plan.airGroupIds && (!Array.isArray(plan.airGroupIds) || plan.airGroupIds.some((id) => !text(id)) || new Set(plan.airGroupIds).size !== plan.airGroupIds.length))) return fail('호위 편제에 중복되거나 잘못된 식별자가 있습니다.');
  if (fleetIds.length > 3 || airIds.length > 2) return fail('수송 1건에는 함대 최대 3개·항공대 최대 2개를 배속할 수 있습니다.');
  if (escortOptions.some((option) => !option)) return fail('선택한 호위함대를 현재 국가 편제에서 찾을 수 없습니다.');
  const failedEscort = escortOptions.find((option) => option && !option.allowed); if (failedEscort) return fail(failedEscort.reason);
  const failedTransit = transits.find((transit) => transit && !transit.allowed); if (failedTransit) return fail(failedTransit.reason);
  if (selectedAir.some((option) => !option)) return fail('선택한 항공대를 현재 국가 편제에서 찾을 수 없습니다.');
  const failedAir = selectedAir.find((option) => option && !option.allowed); if (failedAir) return fail(failedAir.reason);
  if (!finite(context.game.commandPoints) || context.game.commandPoints < commandCost) return fail(`지휘력 ${commandCost}이 필요합니다.`);
  if (!finite(context.game.fuel) || context.game.fuel < fuelCost) return fail(`연료 ${fuelCost}가 필요합니다.`);
  if (!finite(context.stockpile.convoys) || context.stockpile.convoys < convoyCost) return fail(`예약 가능한 수송선 ${convoyCost}척이 필요합니다.`);
  return { ...forecast, allowed: true, reason: mode === 'landing' ? '수송·상륙·교두보 보급을 순서대로 진행합니다. 성공 전에는 점령하지 않습니다.' : '승선·항해·하선 후에만 실제 부대 위치가 바뀝니다.' };
}

function emptyResult(state: SeaTransportState, accepted = true, reason = ''): SeaTransportResult {
  return { state, accepted, reason, gameDelta: {}, convoyDelta: 0, divisionUpdates: [], territoryUpdates: [], events: [] };
}
export function launchSeaTransport(state: SeaTransportState, plan: SeaTransportPlan, context: SeaTransportContext): SeaTransportResult {
  const forecast = forecastSeaTransport(state, plan, context);
  if (!forecast.allowed) return emptyResult(state, false, forecast.reason);
  const division = context.divisions.find((unit) => unit.id === plan.divisionId)!;
  const origin = context.territories.find((territory) => territory.id === plan.fromId)!;
  const target = context.territories.find((territory) => territory.id === plan.targetId)!;
  const serial = state.operations.length + state.records.length;
  let id = `sea-${context.nationId}-${context.week}-${division.id}-${serial}`;
  while (state.operations.some((operation) => operation.id === id) || state.records.some((record) => record.operationId === id)) id += '-n';
  const operation: SeaTransportOperation = {
    ...plan, escortFleetId: forecast.escort?.fleetId, escortFleetIds: forecast.escorts.map((item) => item.fleetId), airGroupIds: forecast.airSupport.map((item) => item.airGroupId),
    airGroupNames: forecast.airSupport.map((item) => item.name), aircraftLost: 0,
    id, nationId: context.nationId, playerFaction: context.playerFaction, theater: theaterOf(origin),
    divisionName: division.name, fromName: origin.name, targetName: target.name, routeIds: forecast.routeIds, mode: forecast.mode,
    stage: 'embarking', startedWeek: context.week, elapsedWeeks: 0, stageWeeks: 0, phaseWeeks: forecast.phaseWeeks,
    commandCost: forecast.commandCost, fuelCost: forecast.fuelCost, convoysReserved: forecast.convoyCost,
    convoysRemaining: forecast.convoyCost, strengthLoss: 0, organizationLoss: 0, successChance: forecast.successChance,
    landingCaptured: false, lastMessage: '승인 완료. 다음 주부터 승선을 진행하며 아직 출항하지 않았습니다.',
    ...(forecast.escort ? { escortFleetName: forecast.escort.name, escortShipsLost: 0 } : {}),
  };
  return { ...emptyResult({ ...state, operations: [...state.operations, operation] }), reason: forecast.reason,
    gameDelta: { commandPoints: -forecast.commandCost, fuel: -forecast.fuelCost }, convoyDelta: -forecast.convoyCost,
    divisionUpdates: [{ ...division, status: 'moving' }],
    fleetUpdates: (context.jointForces.fleets ?? []).filter((fleet) => operation.escortFleetIds!.includes(fleet.id)).map((fleet) => dispatchFleetTransit(fleet, origin.id, context.territories, context.week, id, context.playerFaction)),
    airGroupUpdates: (context.jointForces.airGroups ?? []).filter((group) => operation.airGroupIds!.includes(group.id)).map((group) => ({ ...group, status: 'assigned', assignmentId: id })),
    events: [{ operationId: id, title: `${division.name} 해상 수송 승인`, detail: `${origin.name} → ${target.name}. 지휘력 ${forecast.commandCost}·연료 ${forecast.fuelCost} 소비, 수송선 ${forecast.convoyCost}척 예약. 최소 ${forecast.minimumWeeks}주이며 항해 중에는 육상 전투·주둔에 참여하지 않습니다.`, tone: 'neutral', resolved: false }],
  };
}

export function requestSeaTransportReturn(state: SeaTransportState, operationId: string, week: number): SeaTransportState {
  const operation = state.operations.find((item) => item.id === operationId);
  if (!operation || !Number.isFinite(week) || week < operation.startedWeek || operation.returnRequestedWeek !== undefined || ['returning', 'waiting-return', 'rescuing'].includes(operation.stage)) return state;
  return { ...state, operations: state.operations.map((item) => item.id === operationId ? { ...item, returnRequestedWeek: week, lastMessage: '철회 요청 접수. 다음 주 안전한 귀환 경로를 확인합니다. 즉시 이동하거나 자원을 환급하지 않습니다.' } : item) };
}

export function forecastSeaTransportEscortRelief(state: SeaTransportState, operationId: string, fleetId: string, context: SeaTransportContext): SeaTransportEscortReliefForecast {
  const operation = state.operations.find((item) => item.id === operationId);
  const option = getSeaTransportEscortOptions(state, context).find((item) => item.fleet.id === fleetId);
  const escort: SeaTransportEscort | null = option ? { fleetId: option.fleet.id, name: option.fleet.name,
    protection: option.protection, commandCost: option.commandCost, fuelCost: option.fuelCost } : null;
  const transit = operation && option ? forecastFleetTransit(option.fleet, getSeaTransportCurrentPositionId(operation), context.territories, context.week,
    operation.stage === 'returning' ? operation.returnRouteIds ?? [...operation.routeIds].reverse() : operation.routeIds, context.playerFaction) : undefined;
  const arrivalWeeks = Math.max(1, transit?.arrivalWeeks ?? 1);
  const commandCost = escort?.commandCost ?? 2; const fuelCost = (escort?.fuelCost ?? 4) + (transit?.fuelCost ?? 0);
  const forecast: SeaTransportEscortReliefForecast = { allowed: false, reason: '', escort, arrivalWeeks, minimumWeeks: arrivalWeeks, commandCost, fuelCost,
    factors: [`함대는 즉시 전속 예약되지만 합류에는 최소 ${arrivalWeeks}주가 필요합니다. 이는 실제 항해 일정을 재현한 값이 아닌 주간 전략 추상화입니다.`,
      '합류 주의 전투·손실 판정은 기존 호위가 담당합니다. 새 함대의 보호 효과는 합류 다음 주부터 적용됩니다.',
      '기존 호위는 교대가 완료될 때까지 남습니다. 새 함대도 접근 중 피로와 함정 손실을 겪을 수 있습니다.',
      `지휘력 ${commandCost}·연료 ${fuelCost}를 즉시 소비합니다. 수송이 먼저 끝나도 출동 비용은 돌려주지 않습니다.`] };
  const fail = (reason: string) => ({ ...forecast, reason });
  if (context.processingWeek) return fail('주간 결산 중에는 호위함대를 파견할 수 없습니다.');
  if (!operation || !context.divisions.some((division) => division.id === operation.divisionId)) return fail('호위할 수송 작전과 부대를 찾을 수 없습니다.');
  if (!Number.isInteger(context.week) || context.week < operation.startedWeek || (state.lastProcessedWeek !== undefined && context.week < state.lastProcessedWeek)) return fail('현재 진행 주차에서만 호위함대를 파견할 수 있습니다.');
  if (operation.nationId !== context.nationId || operation.playerFaction !== context.playerFaction) return fail('현재 국가·진영 소속의 수송에만 호위를 파견합니다.');
  if (!context.commandableDivisionIds.has(operation.divisionId) || context.canCommandEscort === false) return fail('이 부대와 호위함대의 배속을 직접 결재할 권한이 없습니다.');
  if (operation.pendingEscortRelief) return fail('이미 접근 중인 호위함대가 있습니다. 합류 결과를 먼저 확인하세요.');
  if (operation.stage === 'disembarking') return fail('이미 하선·재편 중인 수송에는 새 호위함대를 파견하지 않습니다.');
  if (!option) return fail('선택한 호위함대를 현재 국가 편제에서 찾을 수 없습니다.');
  if (!option.allowed) return fail(option.reason);
  if (transit && !transit.allowed) return fail(transit.reason);
  if (!finite(context.game.commandPoints) || context.game.commandPoints < commandCost) return fail(`호위 출동 지휘력 ${commandCost}이 필요합니다.`);
  if (!finite(context.game.fuel) || context.game.fuel < fuelCost) return fail(`호위 출동 연료 ${fuelCost}가 필요합니다.`);
  return { ...forecast, allowed: true, reason: `${escort!.name} 출동 후 최소 ${arrivalWeeks}주 뒤 수송대에 합류합니다. 기존 호위와 출동 중인 호위는 중복 사용되지 않습니다.` };
}
function createEscortRelief(operation: SeaTransportOperation, escort: SeaTransportEscort, week: number, arrivalWeeks: number,
  source: SeaTransportEscortRelief['source'], commandCost = escort.commandCost, fuelCost = escort.fuelCost): SeaTransportEscortRelief {
  return { fleetId: escort.fleetId, fleetName: escort.name, previousFleetId: operation.escortFleetId, previousFleetName: operation.escortFleetName,
    dispatchedWeek: week, arrivalWeeks, elapsedWeeks: 0, commandCost, fuelCost, source };
}
export function dispatchSeaTransportEscortRelief(state: SeaTransportState, operationId: string, fleetId: string, context: SeaTransportContext): SeaTransportResult {
  const forecast = forecastSeaTransportEscortRelief(state, operationId, fleetId, context);
  if (!forecast.allowed || !forecast.escort) return emptyResult(state, false, forecast.reason);
  const previous = state.operations.find((operation) => operation.id === operationId)!;
  const operation: SeaTransportOperation = { ...previous,
    pendingEscortRelief: createEscortRelief(previous, forecast.escort, context.week, forecast.arrivalWeeks, 'reinforcement', forecast.commandCost, forecast.fuelCost),
    commandCost: previous.commandCost + forecast.commandCost, fuelCost: previous.fuelCost + forecast.fuelCost,
    lastMessage: `${forecast.escort.name} 호위 출동 승인. 최소 ${forecast.arrivalWeeks}주 동안 접근하며, 아직 새 함대의 보호 효과는 적용되지 않습니다.` };
  return { ...emptyResult({ ...state, operations: state.operations.map((item) => item.id === operationId ? operation : item) }), reason: forecast.reason,
    gameDelta: { commandPoints: -forecast.commandCost, fuel: -forecast.fuelCost },
    fleetUpdates: context.jointForces.fleets.filter((fleet) => fleet.id === fleetId).map((fleet) => dispatchFleetTransit(fleet, getSeaTransportCurrentPositionId(previous), context.territories, context.week, operationId, context.playerFaction)),
    events: [{ operationId, title: `${operation.divisionName} 호위 출동`, detail: operation.lastMessage, tone: 'neutral', resolved: false }] };
}

function stableRoll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) hash = Math.imul(hash ^ key.charCodeAt(index), 16777619);
  return (hash >>> 0) / 4294967295;
}

function findReturnDestination(operation: SeaTransportOperation, territories: readonly Territory[]) {
  const friendly = territories.filter((territory) => territory.controller === operation.playerFaction && isSeaTransportEndpoint(territory) && theaterOf(territory) === operation.theater);
  // At sea, the stored route is the known navigation corridor. We may retreat along it,
  // or take a sea-only branch, but never jump to an unrelated inland friendly region.
  const corridor = operation.returnRouteIds ?? operation.routeIds;
  const anchors = [operation.targetId, ...corridor.slice().reverse(), operation.fromId];
  const ordered = [...friendly].sort((a, b) => Number(b.id === operation.fromId) - Number(a.id === operation.fromId));
  for (const destination of ordered) {
    const corridorIndex = corridor.indexOf(destination.id);
    if (corridorIndex === 0) return { territory: destination, route: [...corridor].reverse() };
    if (corridorIndex > 0) return { territory: destination, route: corridor.slice(0, corridorIndex + 1) };
    for (const anchorId of anchors) {
      const anchor = territories.find((territory) => territory.id === anchorId);
      if (!anchor) continue;
      if (isSeaTerritory(anchor)) {
        // A sea anchor can reach a safe land endpoint without using land as transit.
        const queue: string[][] = [[anchor.id]]; const seen = new Set([anchor.id]);
        while (queue.length) {
          const route = queue.shift()!; const current = territories.find((territory) => territory.id === route.at(-1))!;
          for (const id of current.neighbors) {
            const next = territories.find((territory) => territory.id === id);
            if (!next || seen.has(id) || theaterOf(next) !== operation.theater) continue;
            if (id === destination.id) return { territory: destination, route: [...route, id] };
            if (isSeaTerritory(next)) { seen.add(id); queue.push([...route, id]); }
          }
        }
      } else {
        const route = findSeaTransportRoute(anchorId, destination.id, territories);
        if (route) return { territory: destination, route };
      }
    }
  }
  return null;
}

/** A rescue travels from a safe coastal base to the known sea corridor before troops can return. */
export function forecastSeaTransportRescue(state: SeaTransportState, operationId: string, context: SeaTransportContext, escortFleetId?: string): SeaTransportRescueForecast {
  const operation = state.operations.find((item) => item.id === operationId);
  const division = context.divisions.find((unit) => unit.id === operation?.divisionId);
  const destination = operation ? findReturnDestination(operation, context.territories) : null;
  const routeIds = destination ? [...destination.route].reverse() : [];
  const sailingWeeks = Math.max(2, Math.ceil(Math.max(1, routeIds.length - 2) / 2) + 1);
  const returnWeeks = sailingWeeks;
  const escortOption = escortFleetId ? getSeaTransportEscortOptions(state, context).find((option) => option.fleet.id === escortFleetId) : undefined;
  const transit = escortOption && destination ? forecastFleetTransit(escortOption.fleet, destination.territory.id, context.territories, context.week, [...routeIds, ...routeIds.slice(0, -1).reverse()], context.playerFaction) : undefined;
  const escort: SeaTransportEscort | null = escortOption ? { fleetId: escortOption.fleet.id, name: escortOption.fleet.name, protection: escortOption.protection,
    commandCost: escortOption.commandCost, fuelCost: escortOption.fuelCost + (transit?.fuelCost ?? 0), arrivalWeeks: transit?.arrivalWeeks ?? 0, distanceNm: transit?.distanceNm ?? 0 } : null;
  const outboundWeeks = sailingWeeks + (escort?.arrivalWeeks ?? 0);
  const commandCost = 4 + (escort?.commandCost ?? 0); const fuelCost = 8 + (sailingWeeks - 2) * 4 + (escort?.fuelCost ?? 0);
  const convoyCost = division?.type === 'armor' ? 24 : 16;
  const forecast: SeaTransportRescueForecast = {
    allowed: false, reason: '', baseId: destination?.territory.id ?? '', baseName: destination?.territory.name ?? '', routeIds,
    commandCost, fuelCost, convoyCost, outboundWeeks, returnWeeks, minimumWeeks: outboundWeeks + returnWeeks, escort,
    factors: [`구조선 접근 최소 ${outboundWeeks}주 + 승선 후 귀환 최소 ${returnWeeks}주. 승인만으로 병력이 이동하지 않습니다.`,
      `지휘력 ${commandCost}·연료 ${fuelCost} 소비, 새 수송선 ${convoyCost}척 예약. 이전 선박 손실을 복구하거나 환급하지 않습니다.`,
      '구조선도 현재 전구 우세와 전속 호위 전력에 따라 손실됩니다. 전멸하면 다음 주 새 구조 명령을 승인해야 합니다.',
      escort ? `${escort.name}가 구조기지에 집결하는 ${escort.arrivalWeeks}주를 포함합니다. 집결 후 구조선의 바깥 항해부터 엄호하고 부대 승선 뒤 귀환까지 동행합니다. 표류 부대 곁의 기존 호위는 떨어진 구조선을 원격 보호하지 않습니다.` : '새 호위를 지정하지 않으면 기존 호위와 이미 승인한 증원 명령을 유지합니다. 표류 부대 곁의 호위는 떨어진 구조선을 원격 보호하지 않습니다.',
      '구조기지가 함락되면 연결된 다른 아군 해안 거점을 찾으며, 안전한 귀환항이 없으면 선박·부대 예약을 유지합니다.'],
  };
  const fail = (reason: string) => ({ ...forecast, reason });
  if (context.processingWeek) return fail('주간 결산 중에는 구조선을 파견할 수 없습니다.');
  if (!operation || !division) return fail('구조할 수송 작전과 부대 자료를 찾을 수 없습니다.');
  if (!Number.isInteger(context.week) || context.week < operation.startedWeek || (state.lastProcessedWeek !== undefined && context.week < state.lastProcessedWeek)) return fail('현재 진행 주차에서만 구조선을 파견할 수 있습니다.');
  if (operation.nationId !== context.nationId || operation.playerFaction !== context.playerFaction) return fail('이전 국가·진영의 수송을 새 국가 자원으로 구조할 수 없습니다.');
  if (!context.commandableDivisionIds.has(division.id)) return fail('이 부대의 구조를 직접 결재할 권한이 없습니다.');
  if (operation.stage !== 'waiting-return' || operation.convoysRemaining !== 0) return fail('잔존 수송선이 0척인 구조 대기 작전에만 구조선을 추가 파견합니다.');
  if (operation.rescue?.dispatchedWeek === context.week) return fail('이번 주 이미 구조선을 파견했습니다. 다음 주 접근 결과를 확인하세요.');
  if (escortFleetId && operation.pendingEscortRelief) return fail('이미 접근 중인 호위함대가 있어 구조 명령에 새 함대를 중복 파견할 수 없습니다.');
  if (escortFleetId && !escortOption) return fail('선택한 구조 호위함대를 현재 국가 편제에서 찾을 수 없습니다.');
  if (escortOption && !escortOption.allowed) return fail(escortOption.reason);
  if (transit && !transit.allowed) return fail(transit.reason);
  if (!destination || routeIds[0] !== destination.territory.id || routeIds.length < 2) return fail('구조선이 출항할 연결된 아군 항구·해안 거점이 없습니다. 먼저 해안 통제와 연결을 회복하세요.');
  const sites = routeIds.map((id) => context.territories.find((territory) => territory.id === id));
  if (sites.some((site) => !site || theaterOf(site) !== operation.theater)
    || sites.slice(1, -1).some((site) => !isSeaTerritory(site!))
    || sites.slice(1).some((site, index) => !site!.neighbors.includes(sites[index]!.id) && !sites[index]!.neighbors.includes(site!.id))
    || (sites.length === 2 && !isSeaTerritory(sites[1]!) && classifyMapRoute(sites[0]!, sites[1]!).kind !== 'sea-crossing')) return fail('저장된 구조 접근로가 현재 해상 연결과 일치하지 않습니다. 연결된 아군 해안 거점을 확보하세요.');
  if (!finite(context.game.commandPoints) || context.game.commandPoints < commandCost) return fail(`구조 지휘력 ${commandCost}이 필요합니다.`);
  if (!finite(context.game.fuel) || context.game.fuel < fuelCost) return fail(`구조 연료 ${fuelCost}가 필요합니다.`);
  if (!finite(context.stockpile.convoys) || context.stockpile.convoys < convoyCost) return fail(`새로 예약할 구조 수송선 ${convoyCost}척이 필요합니다.`);
  return { ...forecast, allowed: true, reason: `${destination.territory.name}에서 구조선을 출항시킵니다. 접근·승선 후 안전한 항구에 실제 도착해야 예약을 해제합니다.` };
}

export function launchSeaTransportRescue(state: SeaTransportState, operationId: string, context: SeaTransportContext, escortFleetId?: string): SeaTransportResult {
  const forecast = forecastSeaTransportRescue(state, operationId, context, escortFleetId);
  if (!forecast.allowed) return emptyResult(state, false, forecast.reason);
  const previous = state.operations.find((operation) => operation.id === operationId)!;
  const attempt = (previous.rescueDispatches ?? previous.rescue?.attempt ?? 0) + 1;
  const operation: SeaTransportOperation = { ...previous, stage: 'rescuing', stageWeeks: 0,
    commandCost: previous.commandCost + forecast.commandCost, fuelCost: previous.fuelCost + forecast.fuelCost,
    convoysReserved: previous.convoysReserved + forecast.convoyCost, convoysRemaining: forecast.convoyCost,
    rescueDispatches: attempt, rescue: { dispatchedWeek: context.week, baseId: forecast.baseId, baseName: forecast.baseName,
      routeIds: forecast.routeIds, outboundWeeks: forecast.outboundWeeks, returnWeeks: forecast.returnWeeks, assemblyWeeks: forecast.escort?.arrivalWeeks ?? 0, attempt },
    ...(forecast.escort ? { pendingEscortRelief: createEscortRelief(previous, forecast.escort, context.week, forecast.outboundWeeks, 'rescue') } : {}),
    lastMessage: `${forecast.baseName}에서 제${attempt}차 구조선 ${forecast.convoyCost}척을 파견했습니다. 아직 표류 부대와 합류하지 않았습니다.`,
  };
  return { ...emptyResult({ ...state, operations: state.operations.map((item) => item.id === operationId ? operation : item) }),
    reason: forecast.reason, gameDelta: { commandPoints: -forecast.commandCost, fuel: -forecast.fuelCost }, convoyDelta: -forecast.convoyCost,
    ...(forecast.escort ? { fleetUpdates: context.jointForces.fleets.filter((fleet) => fleet.id === forecast.escort!.fleetId).map((fleet) => dispatchFleetTransit(fleet, forecast.baseId, context.territories, context.week, operationId, context.playerFaction)) } : {}),
    events: [{ operationId, title: `${operation.divisionName} 구조선 파견`, detail: operation.lastMessage, tone: 'neutral', resolved: false }],
  };
}

/** One call is one actual game week; skips never replay missed weeks and repeated weeks do nothing. */
export function advanceSeaTransportWeek(state: SeaTransportState, context: SeaTransportContext): SeaTransportResult {
  if (!Number.isFinite(context.week) || (state.lastProcessedWeek !== undefined && context.week <= state.lastProcessedWeek)) return emptyResult(state);
  const result = emptyResult(state); const active: SeaTransportOperation[] = []; const records = [...state.records];
  const territories = context.territories.map((territory) => ({ ...territory }));
  const openingFleets = new Map((context.jointForces.fleets ?? []).map((fleet) => [fleet.id, fleet]));
  const validSeaAssignments = new Set(state.operations.filter((operation) => operation.nationId === context.nationId && operation.playerFaction === context.playerFaction
    && operation.startedWeek < context.week && context.divisions.some((division) => division.id === operation.divisionId)
    && (operation.stage !== 'rescuing' || normalizedRescue(operation.rescue))).map((operation) => operation.id));
  const fleets = new Map((context.jointForces.fleets ?? []).map((fleet) => [fleet.id, context.jointForces.nationId === context.nationId
    && (fleet.assignmentId?.startsWith('nav-return-') || (!!fleet.assignmentId && validSeaAssignments.has(fleet.assignmentId))) ? advanceFleetNavigationWeek(fleet, context.week) : fleet]));
  const navigationUpdates = [...fleets.values()].filter((fleet) => fleet !== openingFleets.get(fleet.id));
  if (navigationUpdates.length) result.fleetUpdates = navigationUpdates;
  const emit = (operation: SeaTransportOperation, message: string, tone: SeaTransportEvent['tone'] = 'neutral', resolved = false) => {
    operation.lastMessage = message;
    result.events.push({ operationId: operation.id, title: `${operation.divisionName} · ${seaTransportStageLabels[operation.stage]}`, detail: message, tone, resolved });
  };
  for (const saved of state.operations) {
    if (saved.startedWeek >= context.week || (saved.stage === 'rescuing' && saved.rescue && saved.rescue.dispatchedWeek >= context.week)) { active.push(saved); continue; }
    const operation: SeaTransportOperation = { ...saved, phaseWeeks: { ...saved.phaseWeeks }, routeIds: [...saved.routeIds], elapsedWeeks: saved.elapsedWeeks + 1, stageWeeks: saved.stageWeeks + 1 };
    const existing = context.divisions.find((division) => division.id === operation.divisionId);
    if (!existing) { operation.lastMessage = '부대 자료가 없어 자동 이동·환급하지 않습니다. 저장 자료를 점검하세요.'; active.push(operation); continue; }
    let division = { ...existing };
    const target = territories.find((territory) => territory.id === operation.targetId);
    const origin = territories.find((territory) => territory.id === operation.fromId);
    const control = controls(context, operation.theater);
    const assignedEscort = context.jointForces.nationId === context.nationId
      ? [...fleets.values()].find((fleet) => fleet.id === operation.escortFleetId && fleet.assignmentId === operation.id && fleet.status === 'assigned') : undefined;
    let escort = assignedEscort ? { ...assignedEscort } : undefined;
    let additionalEscorts = context.jointForces.nationId === context.nationId ? getSeaTransportAssignedFleetIds(operation)
      .filter((id) => id !== operation.escortFleetId).flatMap((id) => { const fleet = fleets.get(id); return fleet?.assignmentId === operation.id && fleet.status === 'assigned' ? [{ ...fleet }] : []; }) : [];
    let airSupport = context.jointForces.nationId === context.nationId ? (context.jointForces.airGroups ?? []).filter((group) => getSeaTransportAssignedAirGroupIds(operation).includes(group.id) && group.assignmentId === operation.id && group.status === 'assigned').map((group) => ({ ...group })) : [];
    const isOnStation = (fleet: NavalTaskForce) => fleet.ships > 0 && (!fleet.navigation || fleet.navigation.mode === 'on-station');
    const readyAtOpening = (fleet: NavalTaskForce) => { const opening = openingFleets.get(fleet.id); return !!opening && isOnStation(opening) && isOnStation(fleet) && fleetAtPosition(opening, getSeaTransportCurrentPositionId(saved), territories); };
    const escortProtection = () => {
      const protecting = operation.stage === 'rescuing' ? pending?.source === 'rescue' && pendingFleet && readyAtOpening(pendingFleet) ? [pendingFleet] : []
        : [escort, ...additionalEscorts].filter((fleet): fleet is NavalTaskForce => !!fleet && readyAtOpening(fleet));
      const position = getSeaTransportCurrentPositionId(saved);
      const air = airSupport.map((group) => {
        const coverage = patrolCoverage(group, [position], context);
        return coverage.allowed ? Math.round(clamp(Math.min(100, group.aircraft) / 9 * group.readiness / 100 * group.serviceability / 100 * coverage.coverage, 0, 15)) : 0;
      });
      return combinedProtection(protecting.map(getSeaTransportEscortProtection), air);
    };
    let pending = normalizedEscortRelief(operation.pendingEscortRelief);
    // Never let malformed or duplicate metadata seize/release the current escort.
    if ((pending && getSeaTransportAssignedFleetIds(operation).includes(pending.fleetId)) || (pending?.source === 'rescue' && pending.dispatchedWeek !== operation.rescue?.dispatchedWeek)) pending = undefined;
    operation.pendingEscortRelief = pending;
    const assignedPending = pending && context.jointForces.nationId === context.nationId
      ? [...fleets.values()].find((fleet) => fleet.id === pending!.fleetId && fleet.assignmentId === operation.id && fleet.status === 'assigned') : undefined;
    let pendingFleet = assignedPending ? { ...assignedPending } : undefined;
    let rescueRendezvous = false; let rescueFailed = false; let reliefNotice = '';
    const resolvePending = (status: SeaTransportEscortReliefRecord['status'], reason: string) => {
      if (!pending) return;
      operation.escortReliefHistory = [...(operation.escortReliefHistory ?? []), { ...pending, status, resolvedWeek: context.week, reason }];
      if (status !== 'joined') {
        reliefNotice = `${pending.fleetName}: ${reason}`;
        result.events.push({ operationId: operation.id, title: `${operation.divisionName} · 호위 ${status === 'lost' ? '접근 실패' : '출동 종료'}`,
          detail: reliefNotice, tone: status === 'lost' ? 'bad' : 'neutral', resolved: true });
      }
      if (pendingFleet && status !== 'joined') (result.fleetUpdates ??= []).push(releasedEscort(pendingFleet, context));
      operation.pendingEscortRelief = undefined; pending = undefined; pendingFleet = undefined;
    };
    let terminal = false;
    const finish = (destination: Territory, outcome: SeaTransportOutcome, message: string) => {
      terminal = true;
      resolvePending('cancelled', '호위 합류 전에 수송이 종료되어 출동 함대를 복귀 처리합니다. 이미 소비한 출동 비용은 반환하지 않습니다.');
      division = { ...division, territoryId: destination.id, status: division.strength >= 30 && division.organization >= 40 && division.supply >= 30 ? 'ready' : 'recovering' };
      result.convoyDelta += operation.convoysRemaining;
      const losses = operation.convoysReserved - operation.convoysRemaining;
      const detail = `${message} 수송선 ${operation.convoysRemaining}척 반환 / ${losses}척 손실, 병력 ${operation.strengthLoss}·조직력 ${operation.organizationLoss} 누적 손실. 지휘력 ${operation.commandCost}·연료 ${operation.fuelCost}는 반환하지 않습니다.${operation.escortFleetId ? ` 호위 ${operation.escortFleetName ?? operation.escortFleetId}: 함정 ${operation.escortShipsLost ?? 0}척 누적 손실.` : ''}${operation.rescueDispatches ? ` 구조선 ${operation.rescueDispatches}회 파견 비용과 선박이 합계에 포함됩니다.` : ''}`;
      records.unshift({ id: `record-${operation.id}`, operationId: operation.id, divisionId: division.id, divisionName: operation.divisionName,
        fromId: operation.fromId, targetId: operation.targetId, fromName: operation.fromName, targetName: operation.targetName,
        startedWeek: operation.startedWeek, endedWeek: context.week, elapsedWeeks: operation.elapsedWeeks, outcome, arrivalId: destination.id,
        convoysReserved: operation.convoysReserved, convoysReturned: operation.convoysRemaining, convoysLost: losses,
        strengthLoss: operation.strengthLoss, organizationLoss: operation.organizationLoss, commandCost: operation.commandCost, fuelCost: operation.fuelCost, result: detail,
        ...(operation.escortFleetId ? { escortFleetId: operation.escortFleetId, escortFleetName: operation.escortFleetName, escortShipsLost: operation.escortShipsLost ?? 0 } : {}),
        ...(!operation.escortFleetId && operation.escortReliefHistory?.length ? { escortShipsLost: operation.escortShipsLost ?? 0 } : {}),
        ...(operation.escortReliefHistory?.length ? { escortReliefHistory: operation.escortReliefHistory } : {}),
        ...(operation.rescueDispatches ? { rescueDispatches: operation.rescueDispatches } : {}) });
      const record = records[0]; record.escortFleetIds = getSeaTransportAssignedFleetIds(operation); record.airGroupIds = getSeaTransportAssignedAirGroupIds(operation);
      record.airGroupNames = operation.airGroupNames; record.aircraftLost = operation.aircraftLost ?? 0;
      if (escort) escort = releasedEscort(escort, context);
      additionalEscorts = additionalEscorts.map((fleet) => releasedEscort(fleet, context));
      airSupport = airSupport.map((group) => ({ ...group, assignmentId: null, status: group.aircraft < 6 || group.readiness < 55 || group.serviceability < 40 ? 'refit' : 'ready' }));
      emit(operation, detail, outcome === 'landed' || outcome === 'transferred' ? 'good' : 'neutral', true);
    };
    const transition = (stage: SeaTransportStage) => {
      operation.stage = stage; operation.stageWeeks = 0;
      if (stage === 'disembarking') operation.phaseWeeks.disembarking = Math.max(1, operation.phaseWeeks.disembarking);
    };
    const returnToSafety = (reason: string, outcome: SeaTransportOutcome) => {
      operation.returnOutcome = outcome;
      if (operation.convoysRemaining === 0) {
        transition('waiting-return');
        emit(operation, `${reason} 잔존 수송선이 없어 구조선을 기다립니다. 연결된 아군 해안 기지와 자원을 확인한 뒤 구조선 파견을 승인하세요. 자동 귀환·환급하지 않습니다.`, 'bad');
        return false;
      }
      const destination = findReturnDestination(operation, territories);
      if (!destination) {
        transition('waiting-return'); operation.returnTargetId = undefined; operation.returnRouteIds = undefined;
        emit(operation, `${reason} 연결된 아군 육지 귀환항이 없습니다. 수송선과 부대를 계속 예약한 채 대기하며 임의의 영토로 이동하지 않습니다.`, 'bad');
        return false;
      } else {
        transition('returning'); operation.returnTargetId = destination.territory.id; operation.returnRouteIds = destination.route;
        operation.returnWeeks = Math.max(2, Math.ceil(Math.max(1, destination.route.length - 2) / 2) + 1);
        emit(operation, `${reason} ${destination.territory.name}(으)로 귀환 항해를 시작합니다. 최소 ${operation.returnWeeks}주가 더 필요합니다.`, 'neutral');
        return true;
      }
    };
    const attrition = (combat = false, troopsAboard = true) => {
      const route = operation.stage === 'rescuing' ? operation.rescue?.routeIds ?? operation.routeIds
        : operation.stage === 'returning' ? operation.returnRouteIds ?? operation.routeIds : operation.routeIds;
      const pressure = getSeaTransportInterdictionPressure(route, context.enemyInterdiction);
      const risk = clamp(100 - control.sea * .65 - control.air * .35 - escortProtection() + pressure);
      const roll = stableRoll(`${operation.id}:${context.week}:${operation.stage}`);
      const convoyLoss = roll < risk / 100 ? Math.min(operation.convoysRemaining, risk > 65 ? 2 : 1) : 0;
      operation.convoysRemaining -= convoyLoss;
      // Until pickup, rescue ships cannot carry or lose the stranded division's troops.
      if (!troopsAboard) return;
      const strengthLoss = Math.min(Math.max(0, division.strength - 1), (combat ? 2 : 0) + convoyLoss * 2);
      const organizationLoss = Math.min(division.organization, combat ? 4 : 2);
      division = { ...division, strength: clamp(division.strength - strengthLoss), organization: clamp(division.organization - organizationLoss), supply: clamp(division.supply - (combat ? 7 : 3)) };
      operation.strengthLoss += strengthLoss; operation.organizationLoss += organizationLoss;
    };

    if (operation.nationId !== context.nationId || operation.playerFaction !== context.playerFaction) {
      // Career/faction change cannot spend the new country's pool or grant its territory.
      operation.lastMessage = '소속 변경으로 이전 소속 수송을 보류합니다. 새 국가의 수송선으로 환급하거나 새 진영 영토로 옮기지 않습니다.';
      active.push(operation); continue;
    }
    if (operation.stage === 'rescuing' && !normalizedRescue(operation.rescue)) {
      emit(operation, '구조 접근 정보가 손상되어 이동·환급·호위함대 결산을 보류합니다. 저장 자료를 점검하세요.', 'bad');
      active.push(operation); continue;
    }
    if (pending && context.week > pending.dispatchedWeek) {
      if (!pendingFleet) {
        const opening = openingFleets.get(pending.fleetId);
        const lost = opening?.assignmentId === operation.id && opening.ships <= 0;
        resolvePending(lost ? 'lost' : 'cancelled', lost ? '합류 전에 출동 함대가 모든 함정을 잃었습니다. 기존 호위는 유지합니다.' : '출동 함대의 실제 배속을 확인할 수 없어 교대를 취소했습니다. 다른 작전의 배속을 가로채지 않습니다.');
      }
      else {
        pending = { ...pending, elapsedWeeks: pending.elapsedWeeks + 1 };
        operation.pendingEscortRelief = pending;
        const threat = clamp(100 - control.sea * .65 - control.air * .35);
        const shipLoss = pendingFleet.ships > 0 && stableRoll(`${operation.id}:${context.week}:relief:${pending.fleetId}`) < threat / 500 ? 1 : 0;
        pendingFleet = { ...pendingFleet, ships: Math.max(0, pendingFleet.ships - shipLoss), readiness: clamp(pendingFleet.readiness - 3), organization: clamp(pendingFleet.organization - 2) };
        operation.escortShipsLost = (operation.escortShipsLost ?? 0) + shipLoss;
        if (pendingFleet.ships < 1) resolvePending('lost', '합류 전에 출동 함대가 모든 함정을 잃었습니다. 기존 호위는 유지하며 함정을 새로 만들지 않습니다.');
      }
    }
    if (escort && ['sailing', 'landing', 'beachhead', 'returning', 'rescuing'].includes(operation.stage)) {
      const threat = clamp(100 - control.sea * .65 - control.air * .35);
      const shipLoss = escort.ships > 0 && stableRoll(`${operation.id}:${context.week}:escort`) < threat / 500 ? 1 : 0;
      escort = { ...escort, ships: Math.max(0, escort.ships - shipLoss), readiness: clamp(escort.readiness - 3), organization: clamp(escort.organization - 2) };
      operation.escortShipsLost = (operation.escortShipsLost ?? 0) + shipLoss;
    }
    if (['sailing', 'landing', 'beachhead', 'returning', 'rescuing'].includes(operation.stage)) {
      additionalEscorts = additionalEscorts.map((fleet) => {
        const threat = clamp(100 - control.sea * .65 - control.air * .35);
        const loss = fleet.ships > 0 && stableRoll(`${operation.id}:${context.week}:escort:${fleet.id}`) < threat / 500 ? 1 : 0;
        operation.escortShipsLost = (operation.escortShipsLost ?? 0) + loss;
        return { ...fleet, ships: Math.max(0, fleet.ships - loss), readiness: clamp(fleet.readiness - 3), organization: clamp(fleet.organization - 2) };
      });
      airSupport = airSupport.map((group) => {
        const coverage = patrolCoverage(group, [getSeaTransportCurrentPositionId(saved)], context);
        if (!coverage.allowed) return group;
        const loss = group.aircraft > 0 && stableRoll(`${operation.id}:${context.week}:patrol:${group.id}`) < (100 - control.air) / 400 ? 1 : 0;
        operation.aircraftLost = (operation.aircraftLost ?? 0) + loss;
        if (loss) result.aircraftDelta = (result.aircraftDelta ?? 0) - loss;
        return { ...group, aircraft: Math.max(0, group.aircraft - loss), readiness: clamp(group.readiness - 3), serviceability: clamp(group.serviceability - 2) };
      });
    }
    if (operation.stage === 'rescuing') {
      const rescue = normalizedRescue(operation.rescue);
      if (!rescue) emit(operation, '구조 접근 정보가 손상되어 이동·환급을 보류합니다. 저장 자료를 점검하세요.', 'bad');
      else {
        const assembling = operation.stageWeeks <= (rescue.assemblyWeeks ?? 0);
        if (!assembling) attrition(false, false);
        if (operation.convoysRemaining === 0) {
          rescueFailed = true;
          transition('waiting-return');
          emit(operation, `제${rescue.attempt}차 구조선을 모두 잃어 접근에 실패했습니다. 다음 주 새 구조선을 파견할 수 있습니다. 표류 부대의 위치는 바뀌지 않습니다.`, 'bad');
        } else if (operation.stageWeeks >= rescue.outboundWeeks) {
          operation.returnRouteIds = [...rescue.routeIds].reverse();
          rescueRendezvous = returnToSafety(`제${rescue.attempt}차 구조선이 부대와 합류하여 생존 병력을 승선시켰습니다.`, operation.returnOutcome ?? 'recalled');
        } else emit(operation, assembling ? `${rescue.baseName} 구조선·호위 집결 ${operation.stageWeeks}/${rescue.assemblyWeeks}주. 선박은 기지에서 기다리며 함대 합류 후 출항합니다.` : `${rescue.baseName} 출발 구조선 접근 ${operation.stageWeeks}/${rescue.outboundWeeks}주 · 잔존 ${operation.convoysRemaining}척. 아직 부대와 합류하지 않았습니다.`);
      }
    } else if (operation.returnRequestedWeek !== undefined && operation.returnRequestedWeek < context.week && !['returning', 'waiting-return'].includes(operation.stage)) {
      if (operation.stage === 'embarking') {
        const actualPosition = territories.find((territory) => territory.id === division.territoryId);
        if (actualPosition?.controller === operation.playerFaction && !isSeaTerritory(actualPosition)) finish(actualPosition, 'recalled', '출항 전 철회했습니다. 부대는 실제 육상 위치에 남습니다.');
        else emit(operation, '아직 출항하지 않았고 현재 육상 거점도 안전하지 않아 철회 후 재편을 보류합니다. 다른 항구로 이동시키지 않습니다.', 'bad');
      } else returnToSafety('지휘관의 철회 요청을 반영했습니다.', 'recalled');
    } else if (['returning', 'waiting-return'].includes(operation.stage)) {
      if (operation.stage === 'waiting-return') returnToSafety('귀환항 통제를 다시 확인했습니다.', operation.returnOutcome ?? 'diverted');
      else {
        const returnTarget = territories.find((territory) => territory.id === operation.returnTargetId);
        if (!returnTarget || returnTarget.controller !== operation.playerFaction || !isSeaTransportEndpoint(returnTarget)) returnToSafety('귀환항이 안전한 해안 출입 거점이 아니어서 경로를 재검토합니다.', operation.returnOutcome ?? 'diverted');
        else {
          attrition();
          if (operation.convoysRemaining === 0) { transition('waiting-return'); emit(operation, '예약 선박을 모두 잃었습니다. 구조·대체 수송 없이는 하선하거나 선박을 환급하지 않습니다.', 'bad'); }
          else if (operation.stageWeeks >= (operation.returnWeeks ?? 2)) finish(returnTarget, operation.returnOutcome ?? 'recalled', `${returnTarget.name}에 귀환·재편했습니다.`);
          else emit(operation, `${returnTarget.name} 귀환 항해 ${operation.stageWeeks}/${operation.returnWeeks ?? 2}주. 잔존 수송선 ${operation.convoysRemaining}척.`);
        }
      }
    } else if ((origin && !isSeaTransportEndpoint(origin)) || (target && !isSeaTransportEndpoint(target))) {
      const actualPosition = territories.find((territory) => territory.id === division.territoryId);
      if (['embarking', 'beachhead'].includes(operation.stage) && actualPosition?.controller === operation.playerFaction && !isSeaTerritory(actualPosition)) finish(actualPosition, 'diverted', '이전 명령의 출발지·목적지에 내륙 거점이 포함되어 수송을 취소합니다. 이미 육지에 있는 부대의 실제 위치와 통제권은 유지합니다.');
      else returnToSafety('이전 명령의 내륙 목적지로는 직접 하선할 수 없어 확인된 귀환항을 찾습니다.', 'diverted');
    } else if (!target || target.controller === 'neutral' || (target.controller !== operation.playerFaction && context.phase !== 'war')) {
      if (operation.stage === 'embarking' && origin?.controller === operation.playerFaction && division.territoryId === origin.id) finish(origin, 'diverted', '출항 전 목적지가 중립화·소실되었거나 전쟁이 종료되어 승선을 취소합니다. 부대는 출발지에 남습니다.');
      else returnToSafety('목적지가 중립화·소실되었거나 전쟁이 종료되어 적대 상륙을 중단합니다.', 'diverted');
    } else if (operation.mode === 'transfer' && target.controller !== operation.playerFaction) {
      returnToSafety('아군 수송 목적지가 적에게 넘어갔습니다. 승인하지 않은 상륙전으로 바꾸지 않습니다.', 'diverted');
    } else if (operation.stage === 'embarking') {
      if (division.territoryId !== operation.fromId) {
        const actualPosition = territories.find((territory) => territory.id === division.territoryId);
        if (actualPosition?.controller === operation.playerFaction && !isSeaTerritory(actualPosition)) finish(actualPosition, 'diverted', '승선 전 육상 전투·이동으로 출발지를 이탈해 수송을 취소했습니다. 현재 육상 위치를 유지합니다.');
        else emit(operation, '승선 전 부대 위치가 변경되어 수송을 보류합니다. 안전한 실제 육상 위치 확인 전에는 이동·환급하지 않습니다.', 'bad');
      } else if (origin?.controller !== operation.playerFaction) emit(operation, '출발지 통제를 잃어 승선을 보류합니다. 실제 출항하지 않은 부대를 다른 항구로 옮기지 않으며, 아군 통제 회복을 기다립니다.', 'bad');
      else if (operation.stageWeeks >= Math.max(1, operation.phaseWeeks.embarking)) { transition('sailing'); emit(operation, `승선을 마치고 출항했습니다. 항해 최소 ${operation.phaseWeeks.sailing}주 동안 육상 주둔·전투에서 제외됩니다.`); }
    } else if (operation.stage === 'sailing') {
      attrition();
      if (operation.convoysRemaining === 0) { transition('waiting-return'); emit(operation, '예약 수송선을 모두 잃어 항해를 중단합니다. 병력 위치·통제권을 임의 변경하지 않습니다.', 'bad'); }
      else if (operation.stageWeeks >= Math.max(2, operation.phaseWeeks.sailing)) {
        if (target.controller === operation.playerFaction) { transition('disembarking'); emit(operation, '아군 목적지에 접근했습니다. 다음 주 하선·재편을 마친 뒤 위치를 갱신합니다.'); }
        else { transition('landing'); operation.successChance = landingChance(division, target, context, operation.theater, escortProtection()); emit(operation, `적 해안에 접근했습니다. 상륙 교전을 최소 2주 진행합니다. 현재 성공 전망 ${operation.successChance}%. 아직 점령하지 않았습니다.`); }
      } else emit(operation, `항해 ${operation.stageWeeks}/${operation.phaseWeeks.sailing}주 · 잔존 수송선 ${operation.convoysRemaining}척. 제해권 ${control.sea}·제공권 ${control.air}를 반영했습니다.`);
    } else if (operation.stage === 'disembarking') {
      if (target.controller !== operation.playerFaction) returnToSafety('하선 직전 목적지 통제가 다시 바뀌었습니다. 안전하지 않은 육지로 부대를 이동하지 않습니다.', 'diverted');
      else if (operation.stageWeeks >= 1) finish(target, 'transferred', `${target.name} 하선·재편 완료. 이제 이 거점의 육상 주둔과 명령에 참여합니다.`);
    } else if (operation.stage === 'landing') {
      if (target.controller === operation.playerFaction) { transition('disembarking'); emit(operation, '목적지가 이미 아군 통제로 전환되어 강습 대신 하선·재편을 진행합니다.'); }
      else {
        attrition(true); division.status = 'combat'; operation.successChance = landingChance(division, target, context, operation.theater, escortProtection());
        if (operation.convoysRemaining === 0 || division.strength < 20 || division.organization < 15 || division.supply < 15) returnToSafety('상륙 지속에 필요한 선박·부대 상태를 유지하지 못했습니다.', 'failed-landing');
        else if (operation.stageWeeks >= Math.max(2, operation.phaseWeeks.landing)) {
          if (stableRoll(`${operation.id}:landing`) * 100 < operation.successChance) {
            target.controller = operation.playerFaction; target.ownerId = operation.nationId; target.supply = Math.min(target.supply, 35);
            result.territoryUpdates.push({ ...target }); division = { ...division, territoryId: target.id, supply: Math.min(division.supply, 40), status: 'combat' };
            operation.landingCaptured = true; transition('beachhead');
            emit(operation, `${target.name} 상륙 교전에서 성공해 통제권을 확보했습니다. 최소 2주간 교두보 보급을 유지해야 부대를 해제합니다. 수송선은 계속 예약됩니다.`, 'good');
          } else returnToSafety(`상륙 교전 실패(최종 성공 전망 ${operation.successChance}%). 목적지 통제권을 바꾸지 않습니다.`, 'failed-landing');
        } else emit(operation, `상륙 교전 ${operation.stageWeeks}/${operation.phaseWeeks.landing}주 · 성공 전망 ${operation.successChance}%. 결과가 확정되기 전에는 부대 위치·통제권을 옮기지 않습니다.`);
      }
    } else if (operation.stage === 'beachhead') {
      const actualPosition = territories.find((territory) => territory.id === division.territoryId);
      if (division.territoryId !== operation.targetId && actualPosition?.controller === operation.playerFaction && !isSeaTerritory(actualPosition)) finish(actualPosition, 'failed-landing', '교두보 전투에서 부대가 이미 아군 육지로 철수했습니다. 실제 철수 위치에서 수송을 종료하며 다른 항구로 옮기지 않습니다.');
      else if (target.controller !== operation.playerFaction) returnToSafety('교두보 통제권을 상실해 철수를 시작합니다.', 'failed-landing');
      else {
        const throughput = Math.round(control.sea * .45 + control.air * .2 + (operation.convoysRemaining / operation.convoysReserved) * 25 + escortProtection() * .35);
        const provision = throughput < 35 ? -5 : Math.max(2, Math.floor(throughput / 7));
        division = { ...division, supply: clamp(division.supply + provision), organization: clamp(division.organization + (throughput < 35 ? -3 : 3)), status: 'combat' };
        if (throughput < 35) {
          const loss = Math.min(2, Math.max(0, division.strength - 1)); division.strength -= loss; operation.strengthLoss += loss;
          operation.organizationLoss += Math.min(3, existing.organization);
        }
        target.supply = clamp(target.supply + (throughput < 35 ? -2 : Math.max(1, Math.floor(provision / 2)))); result.territoryUpdates.push({ ...target });
        if (operation.stageWeeks >= Math.max(2, operation.phaseWeeks.beachhead) && throughput >= 35 && division.supply >= 35) finish(target, 'landed', `${target.name} 교두보 보급과 육상 지휘권 인계를 완료했습니다.`);
        else if (operation.stageWeeks >= 6) returnToSafety('6주간 교두보 보급 기준을 충족하지 못해 부대를 철수합니다. 기존 아군 통제권은 임의로 되돌리지 않습니다.', 'failed-landing');
        else emit(operation, `교두보 보급 ${operation.stageWeeks}주 · 수송 처리 ${throughput}/100 · 부대 보급 ${division.supply}. 최소 2주·처리 35·부대 보급 35를 모두 충족해야 종료합니다.`);
      }
    }
    // End-of-week rendezvous: incoming ships cannot retroactively protect this week's convoy.
    if (!terminal && pending && context.week > pending.dispatchedWeek) {
      if (pendingFleet && isOnStation(pendingFleet)) pendingFleet = syncFleetEscortPosition(pendingFleet, getSeaTransportCurrentPositionId(operation), territories, context.week);
      if (pending.source === 'rescue' && (rescueFailed || (!rescueRendezvous && operation.stage !== 'rescuing'))) {
        resolvePending('cancelled', '구조선이 부대와 합류하지 못해 동반 출동 호위를 복귀 처리합니다. 기존 호위와 이미 발생한 비용·손실은 유지합니다.');
      } else if (pendingFleet && fleetAtPosition(pendingFleet, getSeaTransportCurrentPositionId(operation), territories) && pending.elapsedWeeks >= pending.arrivalWeeks && (pending.source !== 'rescue' || rescueRendezvous)) {
        if (escort) (result.fleetUpdates ??= []).push(releasedEscort(escort, context));
        const oldLead = operation.escortFleetId;
        escort = pendingFleet;
        operation.escortFleetId = escort.id; operation.escortFleetName = escort.name;
        operation.escortFleetIds = [escort.id, ...getSeaTransportAssignedFleetIds(operation).filter((id) => id !== oldLead && id !== escort!.id)].slice(0, 3);
        const reason = `${escort.name} 합류 완료. 기존 호위는 모항 귀항·재급유 후 재배속할 수 있으며 다음 주부터 새 함대의 실제 잔존 전력으로 보호합니다.`;
        resolvePending('joined', reason);
        emit(operation, `${operation.lastMessage} ${reason}`, 'good');
      }
    }
    if (pendingFleet) {
      if (pending?.source === 'rescue' && isOnStation(pendingFleet) && !terminal) pendingFleet = syncFleetEscortPosition(pendingFleet, getSeaTransportCurrentPositionId(operation), territories, context.week);
      (result.fleetUpdates ??= []).push(pendingFleet);
    }
    if (reliefNotice && !terminal) operation.lastMessage += ` ${reliefNotice}`;
    if (pending && !terminal) {
      const detail = ` ${pending.fleetName} 호위 접근 ${pending.elapsedWeeks}/${pending.arrivalWeeks}주.${pending.source === 'rescue' && pendingFleet && readyAtOpening(pendingFleet) ? ' 구조선 항해를 현장에서 엄호합니다.' : ' 아직 수송 부대 보호 효과를 합산하지 않습니다.'}`;
      operation.lastMessage += detail;
      const event = result.events.at(-1); if (event?.operationId === operation.id) event.detail += detail;
    }
    if (escort) {
      if (!terminal && isOnStation(escort) && operation.stage !== 'rescuing') escort = syncFleetEscortPosition(escort, getSeaTransportCurrentPositionId(operation), territories, context.week);
      (result.fleetUpdates ??= []).push(escort);
      if (!terminal) {
        const escortDetail = ` 호위 ${escort.name}: 잔존 ${escort.ships}척 · 준비도 ${Math.round(escort.readiness)} · 현재 보호 ${escortProtection()}%p · 누적 함정 손실 ${operation.escortShipsLost ?? 0}척.`;
        operation.lastMessage += escortDetail;
        const event = result.events.at(-1);
        if (event?.operationId === operation.id) event.detail += escortDetail;
      }
    } else if (operation.escortFleetId && !terminal) {
      const warning = ' 전속 호위 배속이 유효하지 않아 추가 보호를 적용하지 않습니다. 기존 다른 함대 작전을 가로채지 않습니다.';
      operation.lastMessage += warning;
      const event = result.events.at(-1);
      if (event?.operationId === operation.id) event.detail += warning;
    }
    for (let fleet of additionalEscorts) {
      if (!terminal && isOnStation(fleet) && operation.stage !== 'rescuing') fleet = syncFleetEscortPosition(fleet, getSeaTransportCurrentPositionId(operation), territories, context.week);
      (result.fleetUpdates ??= []).push(fleet);
    }
    if (airSupport.length) (result.airGroupUpdates ??= []).push(...airSupport);
    if (!terminal && (additionalEscorts.length || airSupport.length)) {
      const detail = ` 입체 호위: 함대 ${Number(!!escort) + additionalEscorts.length}개 · 항공대 ${airSupport.length}개 · 현재 구간 보호 ${escortProtection()}%p · 항공기 누적 손실 ${operation.aircraftLost ?? 0}기.`;
      operation.lastMessage += detail;
      const event = result.events.at(-1); if (event?.operationId === operation.id) event.detail += detail;
    }
    result.divisionUpdates.push(division);
    if (!terminal) active.push(operation);
  }
  result.state = { version: 1, operations: active, records, lastProcessedWeek: context.week };
  return result;
}
