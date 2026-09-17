import type { JointForcesState, JointOperationEvent, NavalTaskForce } from './jointOperations';
import { classifyMapRoute, isSeaTerritory } from './mapRoutes';
import { advanceFleetNavigationWeek, beginFleetReturn, buildNavalRoute, createFleetNavigation, dispatchFleetTransit, forecastFleetTransit, getNavalRouteDistance, nauticalDistance, resolveNavalTerritoryPoint, syncFleetEscortPosition } from './navalNavigation';
import { findSeaTransportRoute, getSeaTransportEmbarkedDivisionIds, isSeaTransportEndpoint, type SeaTransportState } from './seaTransport';
import type { Division, GameState, NationId, Territory, TheaterId } from './types';

export type EnemyMaritimeKind = 'transport' | 'landing' | 'interdiction';
export type EnemyMaritimeStage = 'preparing' | 'sailing' | 'delivering' | 'landing' | 'interdicting' | 'returning' | 'stranded';
export type EnemyMaritimeOutcome = 'delivered' | 'captured' | 'repelled' | 'interdicted' | 'aborted' | 'lost';
export interface EnemyMaritimeOperation {
  id: string; kind: EnemyMaritimeKind; stage: EnemyMaritimeStage; nationId: NationId; faction: 'allies' | 'axis'; theater: TheaterId;
  fleetId: string; fleetName: string; fromId: string; targetId: string; routeIds: string[]; currentNodeId: string;
  startedWeek: number; stageWeeks: number; elapsedWeeks: number; voyageWeeks: number; landingProgress: number;
  convoysReserved: number; convoysRemaining: number; fuelCommitted: number; cargo: number; troops: number;
  shipsLost: number; detected: boolean; confidence: number; detectedWeek: number | null;
  lastObservedWeek: number | null; lastKnownNodeId: string | null; lastKnownStage: EnemyMaritimeStage | null;
  interdictionNodeIds: string[]; pressure: number; outcome?: EnemyMaritimeOutcome; result: string;
}
export interface EnemyMaritimeRecord {
  id: string; kind: EnemyMaritimeKind; nationId: NationId; theater: TheaterId; startedWeek: number; endedWeek: number;
  fromId: string; targetId: string; outcome: EnemyMaritimeOutcome; result: string; detected: boolean;
  convoysLost: number; shipsLost: number; supplyDelivered: number;
}
export interface EnemyMaritimeState {
  version: 1; nationId: NationId; seed: number; convoys: number; fuel: number; landingReserve: number;
  operations: EnemyMaritimeOperation[]; records: EnemyMaritimeRecord[]; lastProcessedWeek?: number; lastDecisionWeek: number;
}
export interface EnemyMaritimeContext {
  week: number; nationId: NationId; playerFaction: 'allies' | 'axis'; phase: 'war' | 'nation';
  territories: readonly Territory[]; divisions: readonly Division[]; jointForces: JointForcesState; seaTransport: SeaTransportState;
}
export interface EnemyMaritimeResult {
  state: EnemyMaritimeState; opponentFleetUpdates: NavalTaskForce[]; territoryUpdates: Territory[]; divisionUpdates: Division[];
  gameDelta: Partial<GameState>; events: JointOperationEvent[];
}
export interface EnemyMaritimePlan {
  kind: EnemyMaritimeKind; fleetId: string; fromId: string; targetId: string; routeIds: string[];
  voyageWeeks: number; convoys: number; fuel: number; cargo: number; troops: number; priority: number; interdictionKeys?: string[];
}

const kinds = new Set<EnemyMaritimeKind>(['transport', 'landing', 'interdiction']);
const stages = new Set<EnemyMaritimeStage>(['preparing', 'sailing', 'delivering', 'landing', 'interdicting', 'returning', 'stranded']);
const outcomes = new Set<EnemyMaritimeOutcome>(['delivered', 'captured', 'repelled', 'interdicted', 'aborted', 'lost']);
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const number = (n: unknown, fallback = 0, max = 100) => typeof n === 'number' && Number.isFinite(n) ? clamp(n, 0, max) : fallback;
const validText = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length < 240;
const theaterOf = (territory: Territory): TheaterId => territory.theater ?? 'europe';
const opposite = (faction: 'allies' | 'axis'): 'allies' | 'axis' => faction === 'allies' ? 'axis' : 'allies';
function roll(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index++) { hash ^= key.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0) / 4294967295;
}
export const enemyMaritimeKindLabels: Record<EnemyMaritimeKind, string> = { transport: '적 보급 수송', landing: '적 상륙 시도', interdiction: '적 항로 차단' };
export const enemyMaritimeStageLabels: Record<EnemyMaritimeStage, string> = { preparing: '승선·집결', sailing: '접근 항해', delivering: '하역', landing: '교두보 전투', interdicting: '차단 순찰', returning: '귀항', stranded: '귀항로 재탐색' };

/** The economy and weekly timetable are bounded game abstractions, not historical fleet inventory figures. */
export function createEnemyMaritimeState(nationId: NationId, seed = 1942): EnemyMaritimeState {
  return { version: 1, nationId, seed, convoys: 72, fuel: 160, landingReserve: 120, operations: [], records: [], lastDecisionWeek: -4 };
}

export function normalizeEnemyMaritimeState(value: unknown, nationId: NationId): EnemyMaritimeState {
  const fallback = createEnemyMaritimeState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const input = value as Partial<EnemyMaritimeState>;
  if (input.version !== 1 || input.nationId !== nationId) return fallback;
  const claimed = new Set<string>(); const ids = new Set<string>();
  const operations = (Array.isArray(input.operations) ? input.operations : []).flatMap((op): EnemyMaritimeOperation[] => {
    if (!op || !validText(op.id) || !op.id.startsWith('enemy-sea-') || ids.has(op.id) || !validText(op.fleetId) || claimed.has(op.fleetId)
      || !kinds.has(op.kind) || !stages.has(op.stage) || !validText(op.fromId) || !validText(op.targetId) || !validText(op.currentNodeId)
      || !Array.isArray(op.routeIds) || op.routeIds.length < 2 || op.routeIds.length > 40 || !op.routeIds.every(validText)
      || op.routeIds[0] !== op.fromId || op.routeIds.at(-1) !== op.targetId || !['allies', 'axis'].includes(op.faction)
      || !['europe', 'asia'].includes(op.theater) || !validText(op.nationId)) return [];
    claimed.add(op.fleetId); ids.add(op.id);
    return [{ ...op, fleetName: validText(op.fleetName) ? op.fleetName : '식별 중인 함대',
      startedWeek: number(op.startedWeek, 0, 100000), stageWeeks: number(op.stageWeeks, 0, 100000), elapsedWeeks: number(op.elapsedWeeks, 0, 100000),
      voyageWeeks: Math.max(2, number(op.voyageWeeks, 2, 20)), landingProgress: number(op.landingProgress),
      convoysReserved: number(op.convoysReserved, 0, 96), convoysRemaining: Math.min(number(op.convoysReserved, 0, 96), number(op.convoysRemaining, 0, 96)),
      fuelCommitted: number(op.fuelCommitted, 0, 180), cargo: number(op.cargo, 0, 24), troops: number(op.troops, 0, 40), shipsLost: number(op.shipsLost, 0, 1000),
      detected: op.detected === true, confidence: number(op.confidence), detectedWeek: typeof op.detectedWeek === 'number' ? number(op.detectedWeek, 0, 100000) : null,
      lastObservedWeek: typeof op.lastObservedWeek === 'number' ? number(op.lastObservedWeek, 0, 100000) : null,
      lastKnownNodeId: validText(op.lastKnownNodeId) ? op.lastKnownNodeId : null, lastKnownStage: op.lastKnownStage && stages.has(op.lastKnownStage) ? op.lastKnownStage : null,
      interdictionNodeIds: Array.isArray(op.interdictionNodeIds) ? [...new Set(op.interdictionNodeIds.filter(validText))].slice(0, 30) : [],
      pressure: number(op.pressure, 0, 24), outcome: op.outcome && outcomes.has(op.outcome) ? op.outcome : undefined,
      result: typeof op.result === 'string' ? op.result.slice(0, 1000) : '',
    }];
  }).slice(0, 2);
  const recordIds = new Set<string>();
  const records = (Array.isArray(input.records) ? input.records : []).filter((record) => {
    if (!record || !validText(record.id) || recordIds.has(record.id) || !kinds.has(record.kind) || !outcomes.has(record.outcome)
      || !validText(record.fromId) || !validText(record.targetId) || !Number.isFinite(record.endedWeek)) return false;
    recordIds.add(record.id); return true;
  }).slice(-50).map((record) => ({ ...record, result: typeof record.result === 'string' ? record.result.slice(0, 1000) : '', detected: record.detected === true,
    convoysLost: number(record.convoysLost, 0, 96), shipsLost: number(record.shipsLost, 0, 1000), supplyDelivered: number(record.supplyDelivered, 0, 24) }));
  return { ...fallback, seed: number(input.seed, 1942, 2147483647), convoys: number(input.convoys, 0, 96), fuel: number(input.fuel, 0, 180),
    landingReserve: number(input.landingReserve, 0, 120), operations, records,
    lastProcessedWeek: typeof input.lastProcessedWeek === 'number' ? number(input.lastProcessedWeek, 0, 100000) : undefined,
    lastDecisionWeek: typeof input.lastDecisionWeek === 'number' && Number.isFinite(input.lastDecisionWeek) ? clamp(input.lastDecisionWeek, -4, 100000) : -4 };
}

/** Only the occupied sea node or a specifically targeted coastal water crossing affects a convoy. */
export function getEnemyMaritimeInterdictionByRoute(state: EnemyMaritimeState): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const operation of state.operations) if (operation.stage === 'interdicting' && operation.kind === 'interdiction' && operation.currentNodeId === operation.targetId) {
    for (const id of operation.interdictionNodeIds.filter((key) => key === operation.targetId || (key.startsWith('edge:') && key.split(':').slice(1).includes(operation.targetId)))) result[id] = clamp((result[id] ?? 0) + operation.pressure, 0, 24);
  }
  return result;
}
export function getEnemyMaritimeInterdiction(state: EnemyMaritimeState, routeIds: readonly string[]): number {
  const pressure = getEnemyMaritimeInterdictionByRoute(state);
  return routeIds.reduce((highest, id, index) => Math.max(highest, pressure[id] ?? 0,
    index ? pressure[`edge:${[routeIds[index - 1], id].sort().join(':')}`] ?? 0 : 0), 0);
}

/** Restore only this subsystem's legitimate opponent locks. Never steal an existing joint operation. */
export function reconcileEnemyMaritimeAssignments(joint: JointForcesState, state: EnemyMaritimeState): JointForcesState {
  if (state.nationId !== joint.nationId) return joint;
  const claims = new Map(state.operations.filter((operation) => operation.nationId === joint.opponent.nationId).map((operation) => [operation.fleetId, operation]));
  return { ...joint, opponent: { ...joint.opponent, fleets: joint.opponent.fleets.map((fleet) => {
    const claim = claims.get(fleet.id);
    const jointClaim = joint.opponent.operations.some((operation) => operation.fleetIds.includes(fleet.id));
    if (claim && !jointClaim && (!fleet.assignmentId || fleet.assignmentId === claim.id)) return { ...fleet, assignmentId: claim.id, status: 'assigned' as const };
    if (!claim && fleet.assignmentId?.startsWith('enemy-sea-') && !jointClaim) return { ...fleet, assignmentId: null, status: 'refit' as const };
    return fleet;
  }) } };
}

export function applyEnemyMaritimeFleetUpdates(joint: JointForcesState, updates: readonly NavalTaskForce[]): JointForcesState {
  if (!updates.length) return joint;
  const patches = new Map(updates.map((fleet) => [fleet.id, fleet]));
  return { ...joint, opponent: { ...joint.opponent, fleets: joint.opponent.fleets.map((fleet) => patches.get(fleet.id) ?? fleet) } };
}

/** Patrols must use surviving, really reserved formations in the same theater. Old records cannot defend forever. */
export function getEnemyMaritimeCounterPressure(context: EnemyMaritimeContext, theater: TheaterId): number {
  let pressure = 0;
  for (const operation of context.jointForces.operations) {
    if (operation.theater !== theater || !['convoy-escort', 'submarine-raiding', 'carrier-strike', 'reconnaissance', 'amphibious-cover'].includes(operation.kind)) continue;
    const fleets = context.jointForces.fleets.filter((fleet) => operation.fleetIds.includes(fleet.id) && fleet.assignmentId === operation.id && fleet.status === 'assigned' && fleet.ships > 0);
    const air = context.jointForces.airGroups.filter((group) => operation.airGroupIds.includes(group.id) && group.assignmentId === operation.id && group.status === 'assigned' && group.aircraft > 0);
    pressure += fleets.reduce((sum, fleet) => sum + Math.min(12, fleet.ships * .7) * (fleet.readiness + fleet.organization) / 200, 0);
    pressure += air.reduce((sum, group) => sum + Math.min(14, group.aircraft / 18) * (group.readiness + group.serviceability) / 200, 0);
  }
  return clamp(pressure, 0, 48);
}

function findSeaRouteToNode(from: Territory, target: Territory, territories: readonly Territory[]): string[] | null {
  if (!isSeaTerritory(target)) return findSeaTransportRoute(from.id, target.id, territories);
  const byId = new Map(territories.map((territory) => [territory.id, territory]));
  const queue: string[][] = [[from.id]]; const visited = new Set([from.id]);
  for (let index = 0; index < queue.length; index++) {
    const route = queue[index]; const current = byId.get(route.at(-1)!)!;
    for (const id of current.neighbors) {
      const next = byId.get(id);
      if (!next || visited.has(id) || !isSeaTerritory(next) || theaterOf(next) !== theaterOf(from)) continue;
      if (id === target.id) return [...route, id];
      visited.add(id); queue.push([...route, id]);
    }
  }
  return null;
}

/** Enumerating bounded real routes replaces choosing an abstract theater-wide naval bonus. */
export function getEnemyMaritimePlans(state: EnemyMaritimeState, context: EnemyMaritimeContext): EnemyMaritimePlan[] {
  if (context.phase !== 'war' || state.nationId !== context.nationId || state.operations.length >= 2) return [];
  const enemyFaction = opposite(context.playerFaction); const opponent = context.jointForces.opponent;
  const fleets = opponent.fleets.filter((fleet) => fleet.status === 'ready' && !fleet.assignmentId && fleet.ships > 0 && fleet.readiness >= 45 && fleet.organization >= 40
    && fleet.kind !== 'clandestine' && !opponent.operations.some((operation) => operation.fleetIds.includes(fleet.id))
    && !state.operations.some((operation) => operation.fleetId === fleet.id));
  // Wartime coalition ports are shared staging facilities. Select near each actual fleet,
  // not the globally richest ports (which would strand Pacific AI behind European candidates).
  const friendlyPorts = context.territories.filter((territory) => territory.controller === enemyFaction && isSeaTransportEndpoint(territory)
    && territory.supply >= 20 && resolveNavalTerritoryPoint(territory.id, context.territories));
  const originIds = new Set(fleets.flatMap((fleet) => {
    const nav = fleet.navigation ?? createFleetNavigation(fleet); if (!nav) return [];
    return [...friendlyPorts].sort((a, b) => nauticalDistance(nav.position, resolveNavalTerritoryPoint(a.id, context.territories)!)
      - nauticalDistance(nav.position, resolveNavalTerritoryPoint(b.id, context.territories)!)).slice(0, 4).map((port) => port.id);
  }));
  const origins = friendlyPorts.filter((port) => originIds.has(port.id));
  const occupiedTargets = new Set(state.operations.map((operation) => `${operation.kind}:${operation.targetId}`));
  const playerRouteNodes = new Set(context.seaTransport.operations.flatMap((operation) => operation.routeIds));
  const targets: Array<{ target: Territory; kind: EnemyMaritimeKind; interdictionKeys?: string[] }> = context.territories.filter((territory) => (isSeaTransportEndpoint(territory) && territory.controller !== 'neutral')
    || (isSeaTerritory(territory) && playerRouteNodes.has(territory.id))).map((target) => ({ target,
      kind: isSeaTerritory(target) ? 'interdiction' : target.controller === enemyFaction ? 'transport' : 'landing',
      interdictionKeys: isSeaTerritory(target) ? [target.id] : undefined }));
  const sites = new Map(context.territories.map((site) => [site.id, site])); const coveredEdges = new Set<string>();
  for (const operation of context.seaTransport.operations) for (let index = 1; index < operation.routeIds.length; index++) {
    const from = sites.get(operation.routeIds[index - 1]); const to = sites.get(operation.routeIds[index]);
    if (!from || !to || from.controller === 'neutral' || to.controller === 'neutral' || !isSeaTransportEndpoint(from) || !isSeaTransportEndpoint(to)
      || !from.neighbors.includes(to.id) || classifyMapRoute(from, to).kind !== 'sea-crossing') continue;
    const key = `edge:${[from.id, to.id].sort().join(':')}`; if (coveredEdges.has(key)) continue; coveredEdges.add(key);
    targets.push({ target: from, kind: 'interdiction', interdictionKeys: [key] }, { target: to, kind: 'interdiction', interdictionKeys: [key] });
  }
  const candidates: EnemyMaritimePlan[] = [];
  for (const origin of origins) for (const { target, kind, interdictionKeys } of targets) {
    if (target.id === origin.id || theaterOf(origin) !== theaterOf(target)) continue;
    if (occupiedTargets.has(`${kind}:${target.id}`) || (kind === 'transport' && (target.supply >= 85 || origin.supply < target.supply + 8))) continue;
    const routeIds = findSeaRouteToNode(origin, target, context.territories);
    if (!routeIds || routeIds.length > 12) continue;
    const voyageWeeks = Math.max(2, Math.ceil((routeIds.length - 1) / 2));
    const convoys = kind === 'landing' ? 20 : kind === 'transport' ? 12 : 0;
    const fuel = 8 + voyageWeeks * 4 + (kind === 'landing' ? 8 : 0);
    const cargo = kind === 'transport' ? Math.min(16, Math.floor(origin.supply / 3)) : 0;
    const troops = kind === 'landing' ? 24 : 0;
    if (state.convoys < convoys || state.fuel < fuel || state.landingReserve < troops) continue;
    for (const fleet of fleets) {
      if (kind !== 'interdiction' && fleet.kind === 'submarine') continue;
      const dispatch = forecastFleetTransit(fleet, origin.id, context.territories, context.week, routeIds, enemyFaction);
      const nav = fleet.navigation ?? createFleetNavigation(fleet);
      const originPoint = resolveNavalTerritoryPoint(origin.id, context.territories);
      const routePoints = routeIds.map((id) => resolveNavalTerritoryPoint(id, context.territories));
      if (!dispatch.allowed || !nav || !originPoint || routePoints.some((point) => !point)) continue;
      const missionDistance = routePoints.reduce((sum, point, index) => index ? sum + getNavalRouteDistance(buildNavalRoute(routePoints[index - 1]!, point!)) : sum, 0);
      const returnDistance = getNavalRouteDistance(buildNavalRoute(routePoints.at(-1)!, nav.homePort));
      if (dispatch.distanceNm + missionDistance + returnDistance + Math.max(120, nav.rangeNm * .08) > nav.remainingRangeNm) continue;
      const fullFuel = fuel + dispatch.fuelCost + Math.ceil(missionDistance / 600);
      if (state.fuel < fullFuel) continue;
      const patrol = getEnemyMaritimeCounterPressure(context, theaterOf(origin));
      const defense = context.divisions.filter((division) => division.territoryId === target.id).reduce((sum, division) => sum + division.strength * division.organization / 100, 0);
      const mission = kind === 'interdiction' ? 58 + (fleet.kind === 'submarine' ? 14 : 0) : kind === 'transport' ? 95 - target.supply : 36 + target.value * 2 - defense * .4 - patrol * .4;
      const variety = roll(`${state.seed}:${context.week}:${kind}:${origin.id}:${target.id}:${fleet.id}`) * 28;
      const fatigue = (200 - fleet.readiness - fleet.organization) * .1;
      candidates.push({ kind, fleetId: fleet.id, fromId: origin.id, targetId: target.id, routeIds, voyageWeeks, convoys, fuel: fullFuel, cargo, troops, interdictionKeys,
        priority: mission + variety - voyageWeeks * 3 - fatigue - dispatch.arrivalWeeks * 2 });
    }
  }
  return candidates.sort((a, b) => b.priority - a.priority || a.fleetId.localeCompare(b.fleetId));
}

function output(state: EnemyMaritimeState): EnemyMaritimeResult {
  return { state, opponentFleetUpdates: [], territoryUpdates: [], divisionUpdates: [], gameDelta: {}, events: [] };
}

export function advanceEnemyMaritimeWeek(state: EnemyMaritimeState, context: EnemyMaritimeContext): EnemyMaritimeResult {
  if (state.nationId !== context.nationId || (state.lastProcessedWeek ?? -1) >= context.week) return output(state);
  const next: EnemyMaritimeState = { ...state, operations: [], records: [...state.records], lastProcessedWeek: context.week };
  const result = output(next);
  const territoryMap = new Map(context.territories.map((territory) => [territory.id, territory]));
  const ownedOperationIds = new Set(state.operations.map((operation) => operation.id));
  const jointFleetClaims = new Set(context.jointForces.opponent.operations.flatMap((operation) => operation.fleetIds));
  const fleetMap = new Map(context.jointForces.opponent.fleets.map((fleet) => {
    const owned = !jointFleetClaims.has(fleet.id) && fleet.assignmentId && (ownedOperationIds.has(fleet.assignmentId) || fleet.assignmentId === `nav-return-${fleet.id}`);
    return [fleet.id, owned ? advanceFleetNavigationWeek(fleet, context.week) : fleet];
  }));
  const divisionMap = new Map(context.divisions.map((division) => [division.id, division]));
  const returnedFleetIds = new Set<string>();
  const embarked = getSeaTransportEmbarkedDivisionIds(context.seaTransport);
  const enemyFaction = opposite(context.playerFaction);
  const event = (op: EnemyMaritimeOperation, title: string, detail: string, resolved = false, tone: JointOperationEvent['tone'] = 'neutral') => {
    if (op.detected) result.events.push({ title, detail: op.confidence >= 70 ? detail : '적 함대의 움직임 변화가 관측되었습니다. 위치와 임무는 불확실하므로 해상 정보판의 마지막 관측 시점과 신뢰도를 확인하세요.', operationId: op.id, resolved, tone, side: 'enemy' });
  };
  const updateTerritory = (territory: Territory) => { territoryMap.set(territory.id, territory); };
  const finish = (op: EnemyMaritimeOperation, fleet: NavalTaskForce | undefined, outcome: EnemyMaritimeOutcome, detail: string) => {
    returnedFleetIds.add(op.fleetId);
    next.convoys = Math.min(96, next.convoys + op.convoysRemaining);
    if (outcome !== 'captured' && outcome !== 'lost') next.landingReserve = Math.min(120, next.landingReserve + Math.floor(op.troops * .75));
    if (fleet && !jointFleetClaims.has(fleet.id) && (fleet.assignmentId === op.id || fleet.assignmentId === `nav-return-${fleet.id}` || (!fleet.assignmentId && fleet.navigation?.mode === 'in-port'))) {
      const returned = fleet.navigation?.mode === 'in-port' || fleet.ships <= 0;
      fleetMap.set(fleet.id, returned ? { ...fleet, assignmentId: null, status: fleet.ships > 0 && fleet.readiness >= 55 && fleet.organization >= 40 ? 'ready' : 'refit' }
        : beginFleetReturn(fleet, context.week, context.territories, op.faction));
    }
    next.records.push({ id: `record-${op.id}`, kind: op.kind, nationId: op.nationId, theater: op.theater, startedWeek: op.startedWeek, endedWeek: context.week,
      fromId: op.fromId, targetId: op.targetId, outcome, result: detail, detected: op.detected && op.confidence >= 70 && context.week - (op.lastObservedWeek ?? -100) <= 2, convoysLost: op.convoysReserved - op.convoysRemaining,
      shipsLost: op.shipsLost, supplyDelivered: outcome === 'delivered' ? op.cargo : 0 });
    event(op, `${enemyMaritimeKindLabels[op.kind]} 종료`, detail, true, outcome === 'captured' || outcome === 'delivered' ? 'bad' : 'neutral');
  };
  for (const original of state.operations) {
    let op = { ...original, routeIds: [...original.routeIds], interdictionNodeIds: [...original.interdictionNodeIds], elapsedWeeks: original.elapsedWeeks + 1, stageWeeks: original.stageWeeks + 1 };
    let fleet = fleetMap.get(op.fleetId);
    const target = territoryMap.get(op.targetId); const origin = territoryMap.get(op.fromId);
    const current = territoryMap.get(op.currentNodeId);
    if (op.nationId !== context.jointForces.opponent.nationId || op.faction !== enemyFaction) {
      // A career/faction switch cannot confiscate another country's fleets or refund its stocks.
      continue;
    }
    const returningReservation = ['returning', 'stranded'].includes(op.stage) && (fleet?.assignmentId === `nav-return-${op.fleetId}` || fleet?.navigation?.mode === 'in-port');
    if (!fleet || (!returningReservation && fleet.assignmentId !== op.id) || fleet.ships <= 0) { finish({ ...op, convoysRemaining: fleet?.ships === 0 ? 0 : op.convoysRemaining }, fleet, 'lost', '담당 함대의 지휘권 또는 가동 전력을 상실해 작전이 중단되었습니다.'); continue; }
    if (context.jointForces.opponent.operations.some((mission) => mission.fleetIds.includes(fleet!.id))) {
      finish(op, undefined, 'aborted', '기존 합동작전과 배속이 충돌하여 추가 명령을 취소했습니다.'); continue;
    }
    const patrol = context.phase === 'war' ? getEnemyMaritimeCounterPressure(context, op.theater) : 0;
    const control = context.jointForces.theaterControl[op.theater];
    const detection = clamp((control?.intelligence ?? 35) * .48 + patrol * 1.35 + (op.stage === 'landing' ? 55 : 0), 6, 98);
    const observed = context.phase === 'war' && roll(`observe:${state.seed}:${op.id}:${context.week}`) * 100 < detection;
    if (observed) {
      const first = !op.detected;
      op = { ...op, detected: true, confidence: clamp(40 + detection * .45 + (op.stage === 'landing' ? 20 : 0)), detectedWeek: op.detectedWeek ?? context.week,
        lastObservedWeek: context.week, lastKnownNodeId: op.currentNodeId, lastKnownStage: op.stage };
      if (first) event(op, `${enemyMaritimeKindLabels[op.kind]} 징후 포착`, `${current?.name ?? '미확인 해역'}에서 적 함대의 움직임이 포착되었습니다. 정찰·호송·함대 차단으로 대응할 수 있습니다.`);
    } else if (op.detected) op.confidence = clamp(op.confidence - 7, 10, 100);
    const returnNow = (outcome: EnemyMaritimeOutcome, detail: string) => {
      op = { ...op, stage: 'returning', stageWeeks: 0, pressure: 0, outcome, result: detail };
      fleet = beginFleetReturn(fleet!, context.week, context.territories, op.faction);
      event(op, '적 함대 귀항 징후', detail);
    };
    if (context.phase !== 'war' && !['returning', 'stranded'].includes(op.stage)) returnNow('aborted', '전시 작전이 중지되어 적 함대가 철수합니다. 평시에는 상륙 점령이나 항로 공격이 발생하지 않습니다.');
    const validRoute = op.routeIds.every((id, index) => {
      const site = territoryMap.get(id); if (!site) return false;
      if (index > 0 && !territoryMap.get(op.routeIds[index - 1])?.neighbors.includes(id)) return false;
      return index === 0 || index === op.routeIds.length - 1 || isSeaTerritory(site);
    });
    if (!origin || !target || !current || !validRoute) {
      op = { ...op, stage: 'stranded', stageWeeks: 0, pressure: 0, outcome: 'aborted', result: '작전 경로의 거점 자료가 없어 안전한 귀항 경로를 재탐색합니다.' };
    }
    if (context.phase === 'war' && !['in-port', 'refueling'].includes(fleet.navigation?.mode ?? '') && ['sailing', 'delivering', 'landing', 'interdicting', 'returning'].includes(op.stage)) {
      const attrition = clamp(patrol * .9 + (control?.sea ?? 35) * .18 - fleet.readiness * .12, 0, 68);
      const suffers = roll(`loss:${state.seed}:${op.id}:${context.week}`) * 100 < attrition;
      const convoyLoss = suffers ? Math.min(op.convoysRemaining, 1 + Math.floor(patrol / 18)) : 0;
      const shipLoss = suffers && patrol > 12 && roll(`hull:${op.id}:${context.week}`) < .3 ? Math.min(1, fleet.ships) : 0;
      fleet = { ...fleet, ships: Math.max(0, fleet.ships - shipLoss), readiness: clamp(fleet.readiness - 3), organization: clamp(fleet.organization - 2) };
      op = { ...op, convoysRemaining: op.convoysRemaining - convoyLoss, shipsLost: op.shipsLost + shipLoss };
      if (convoyLoss || shipLoss) event(op, '적 해상 수송망 요격', `같은 전구의 실제 배속 전력이 적 수송선 ${convoyLoss}척·군함 ${shipLoss}척을 격파했습니다.`, false, 'good');
      if (fleet.ships <= 0) { finish({ ...op, convoysRemaining: 0 }, fleet, 'lost', '작전 함대를 상실했습니다.'); continue; }
      if (op.kind !== 'interdiction' && op.convoysRemaining <= 0 && !['returning', 'stranded'].includes(op.stage)) returnNow('repelled', '수송선을 모두 잃어 임무를 포기했습니다.');
    }
    if (op.stage === 'preparing' && fleet.navigation?.mode !== 'on-station') {
      op.stageWeeks = 0;
      if (fleet.navigation?.mode === 'stranded') returnNow('aborted', '출발항까지의 항해가 중단되어 출격할 수 없습니다.');
    } else if (op.stage === 'preparing' && op.stageWeeks >= (op.kind === 'landing' ? 2 : 1)) {
      if (!origin || origin.controller !== enemyFaction || !isSeaTransportEndpoint(origin)) returnNow('aborted', '출발항을 상실해 출격을 취소했습니다.');
      else op = { ...op, stage: 'sailing', stageWeeks: 0, result: '함대가 실제 항로를 따라 출항했습니다.' };
    } else if (op.stage === 'sailing') {
      const index = Math.min(op.routeIds.length - 1, Math.floor(op.stageWeeks / op.voyageWeeks * (op.routeIds.length - 1)));
      const destinationId = op.routeIds[index];
      fleet = syncFleetEscortPosition(fleet, destinationId, context.territories, context.week);
      const point = resolveNavalTerritoryPoint(destinationId, context.territories);
      const arrived = point && fleet.navigation && nauticalDistance(point, fleet.navigation.position) < 2;
      if (arrived) op.currentNodeId = destinationId;
      if (fleet.navigation?.mode === 'returning' || fleet.navigation?.mode === 'stranded') returnNow('aborted', '귀항 예비 항속이 부족해 접근을 중단했습니다.');
      else if (op.stageWeeks >= op.voyageWeeks && arrived) op = { ...op, stage: op.kind === 'transport' ? 'delivering' : op.kind === 'landing' ? 'landing' : 'interdicting', stageWeeks: 0 };
    } else if (op.stage === 'delivering' && target) {
      if (target.controller !== enemyFaction || !isSeaTransportEndpoint(target)) returnNow('aborted', '목표 항구의 통제권이 바뀌어 보급을 전달하지 못했습니다.');
      else if (op.stageWeeks >= 1) {
        const delivered = Math.min(100 - target.supply, Math.floor(op.cargo * op.convoysRemaining / Math.max(1, op.convoysReserved)));
        updateTerritory({ ...target, supply: clamp(target.supply + delivered) });
        op.cargo = delivered;
        result.gameDelta.enemyPressure = (result.gameDelta.enemyPressure ?? 0) + (delivered >= 8 ? 1 : 0);
        returnNow('delivered', `${target.name}에 보급 ${delivered}를 실제 하역했습니다. 해안의 적 보급력이 증가했습니다.`);
      }
    } else if (op.stage === 'landing' && target) {
      op.detected = true; op.confidence = 100; op.detectedWeek ??= context.week; op.lastObservedWeek = context.week; op.lastKnownNodeId = target.id; op.lastKnownStage = 'landing';
      if (target.controller !== context.playerFaction || !isSeaTransportEndpoint(target)) returnNow('aborted', '해안의 통제권·전쟁 당사자가 바뀌어 상륙 공격을 취소했습니다.');
      else {
        const defenders = [...divisionMap.values()].filter((division) => division.territoryId === target.id && !embarked.has(division.id));
        const defense = defenders.reduce((sum, division) => sum + division.strength * division.organization / 100, 0);
        const attacking = op.troops * op.convoysRemaining / Math.max(1, op.convoysReserved) + Math.min(16, fleet.ships) + fleet.readiness * .25;
        const resistance = defense * .6 + target.supply * .22 + patrol * .8 + (control?.sea ?? 35) * .15 + (/요새|산악|fortress|mountain/iu.test(target.terrain) ? 16 : 0);
        const advance = clamp(26 + (attacking - resistance) * .55 + roll(`assault:${state.seed}:${op.id}:${context.week}`) * 12, 0, 45);
        op.landingProgress = clamp(op.landingProgress + advance);
        const defenderLoss = Math.max(0, Math.min(5, Math.round(attacking / 22 - patrol / 16)));
        // Existing land orders own division status; a naval defense must not leave a permanent combat lock.
        for (const defender of defenders) divisionMap.set(defender.id, { ...defender, strength: Math.max(1, defender.strength - defenderLoss), organization: clamp(defender.organization - Math.max(1, defenderLoss)) });
        if (op.stageWeeks === 1) event(op, `${target.name} 상륙 경보`, `적이 실제 해안에 도착했습니다. 주둔 병력과 같은 전구의 해공군 작전이 방어에 반영됩니다. 교두보 진행 ${Math.round(op.landingProgress)}%.`, false, 'bad');
        const capableDefenders = [...divisionMap.values()].some((division) => division.territoryId === target.id && !embarked.has(division.id) && division.strength >= 25 && division.organization >= 15);
        if (op.landingProgress >= 100 && !capableDefenders) {
          // Never teleport garrisons. A surviving weak force retreats only over a real friendly land edge.
          const retreat = target.neighbors.map((id) => territoryMap.get(id)).find((site) => site && site.controller === context.playerFaction && !isSeaTerritory(site) && classifyMapRoute(target, site).kind === 'land');
          if (defenders.length > 0 && !retreat) returnNow('repelled', `${target.name} 주둔군이 해안을 끝까지 유지했습니다. 고립 부대를 임의로 이동시키지 않습니다.`);
          else {
            for (const defender of defenders) if (retreat) divisionMap.set(defender.id, { ...divisionMap.get(defender.id)!, territoryId: retreat.id, status: 'recovering' });
            updateTerritory({ ...target, controller: enemyFaction, ownerId: op.nationId, supply: Math.max(10, Math.round(target.supply * .55)) });
            result.gameDelta.enemyPressure = (result.gameDelta.enemyPressure ?? 0) + 4;
            returnNow('captured', `${target.name}의 교두보가 확보되어 통제권이 변경되었습니다. 상륙은 ${op.stageWeeks}주간 진행됐습니다.`);
          }
        } else if (op.stageWeeks >= 4 || (op.stageWeeks >= 2 && advance < 10)) returnNow('repelled', `${target.name} 상륙 시도가 주둔군·보급·해공 차단에 저지되었습니다.`);
      }
    } else if (op.stage === 'interdicting') {
      op.pressure = clamp(8 + Math.min(12, fleet.ships) * .5 + fleet.readiness * .12 - patrol * .55, 0, 24);
      if (op.stageWeeks >= 3 || fleet.readiness < 30 || (patrol >= 26 && op.stageWeeks >= 1)) returnNow('interdicted', patrol >= 26 ? '우리 해공군 순찰에 밀려 적 차단 함대가 조기 철수했습니다.' : '적 차단 함대가 순찰 주기를 마치고 귀항합니다.');
    } else if (op.stage === 'returning' || op.stage === 'stranded') {
      if (fleet.navigation?.mode === 'in-port') { finish(op, fleet, op.outcome ?? 'aborted', op.result || '함대가 모항에 복귀하고 급유를 마쳤습니다.'); continue; }
      if (fleet.navigation?.mode === 'stranded') op = { ...op, stage: 'stranded', pressure: 0, result: '귀항로·항속을 확보하지 못해 함대를 재사용할 수 없습니다.' };
      else if (fleet.navigation?.mode !== 'returning' && fleet.navigation?.mode !== 'refueling') fleet = beginFleetReturn(fleet, context.week, context.territories, op.faction);
    }
    fleetMap.set(fleet.id, { ...fleet, status: 'assigned', assignmentId: fleet.assignmentId?.startsWith('nav-return-') ? fleet.assignmentId : op.id });
    next.operations.push(op);
  }
  // Finite capped production requires a still-controlled working enemy harbor; destruction is persistent.
  const productivePorts = [...territoryMap.values()].filter((territory) => territory.controller === enemyFaction && isSeaTransportEndpoint(territory)
    && territory.ownerId === context.jointForces.opponent.nationId && territory.supply >= 40).length;
  if (context.phase === 'war' && productivePorts > 0) {
    next.fuel = Math.min(180, next.fuel + Math.min(4, productivePorts));
    if (context.week % 4 === 0) next.convoys = Math.min(96 - next.operations.reduce((sum, operation) => sum + operation.convoysRemaining, 0), next.convoys + Math.min(2, productivePorts));
  }
  if (context.phase === 'war' && next.operations.length < 2 && context.week - state.lastDecisionWeek >= 3) {
    next.lastDecisionWeek = context.week;
    const planningContext = { ...context, territories: [...territoryMap.values()], divisions: [...divisionMap.values()], jointForces: { ...context.jointForces, opponent: { ...context.jointForces.opponent, fleets: [...fleetMap.values()].filter((fleet) => !returnedFleetIds.has(fleet.id)) } } };
    const plan = getEnemyMaritimePlans(next, planningContext)[0];
    if (plan) {
      const fleet = fleetMap.get(plan.fleetId)!; const origin = territoryMap.get(plan.fromId)!;
      const id = `enemy-sea-${context.jointForces.opponent.nationId}-${context.week}-${plan.kind}-${plan.targetId}`;
      const op: EnemyMaritimeOperation = { id, kind: plan.kind, stage: 'preparing', nationId: context.jointForces.opponent.nationId, faction: enemyFaction,
        theater: theaterOf(origin), fleetId: fleet.id, fleetName: fleet.name, fromId: plan.fromId, targetId: plan.targetId, routeIds: plan.routeIds,
        currentNodeId: plan.fromId, startedWeek: context.week, stageWeeks: 0, elapsedWeeks: 0, voyageWeeks: plan.voyageWeeks, landingProgress: 0,
        convoysReserved: plan.convoys, convoysRemaining: plan.convoys, fuelCommitted: plan.fuel, cargo: plan.cargo, troops: plan.troops, shipsLost: 0,
        detected: false, confidence: 0, detectedWeek: null, lastObservedWeek: null, lastKnownNodeId: null, lastKnownStage: null,
        interdictionNodeIds: plan.kind === 'interdiction' ? plan.interdictionKeys ?? [plan.targetId] : [], pressure: 0,
        result: '출발항에서 승선과 집결을 준비합니다.' };
      next.operations.push(op); next.convoys -= plan.convoys; next.fuel -= plan.fuel; next.landingReserve -= plan.troops;
      if (plan.cargo) updateTerritory({ ...origin, supply: Math.max(0, origin.supply - plan.cargo) });
      fleetMap.set(fleet.id, dispatchFleetTransit(fleet, origin.id, context.territories, context.week, id, enemyFaction));
    }
  }
  next.records = next.records.slice(-50);
  result.opponentFleetUpdates = [...fleetMap.values()].filter((fleet) => fleet !== context.jointForces.opponent.fleets.find((original) => original.id === fleet.id));
  result.territoryUpdates = [...territoryMap.values()].filter((territory) => territory !== context.territories.find((original) => original.id === territory.id));
  result.divisionUpdates = [...divisionMap.values()].filter((division) => division !== context.divisions.find((original) => original.id === division.id));
  return result;
}
