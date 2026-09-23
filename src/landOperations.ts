import { resolveBattle } from './combat';
import type { BattleForecast } from './combat';
import { advanceOperationWeek, createOperationTerminalReceipt, forecastOperationBattle, normalizeOperationOrder, normalizeOperationOrders } from './operations';
import { validateOffensiveTarget } from './mapCommand';
import { validateLandRoute } from './mapRoutes';
import { getSiteMilitaryAccess, type MilitaryAccessOperationalContext } from './militaryAccess';
import type { OperationStopReceipt, OperationWeekResolution } from './operations';
import type { CompletedCloseAirSupport } from './jointOperations';
import type { BattleStance, Commander, Division, Faction, Order, Territory } from './types';

interface LandWeekInput {
  week: number;
  orders: Order[];
  divisions: Division[];
  commanders: Commander[];
  territories: Territory[];
  playerFaction: Faction;
  stance: BattleStance;
  doctrine: string;
  enemyPressure: number;
  intelNetwork: number;
  policyAttackBonus: number;
  priorityDivisionId: string | null;
  completedAirSupport?: CompletedCloseAirSupport[];
  random?: () => number;
  militaryAccess?: MilitaryAccessOperationalContext;
}

export type LandOrderResolution =
  | { kind: 'invalid'; order: Order; reason: string; receipt: OperationStopReceipt }
  | { kind: 'stopped'; order: Order; division: Division; releasedStatus: 'ready' | 'recovering'; reason: string; receipt: OperationStopReceipt }
  | { kind: 'move'; order: Order; division: Division; target: Territory; receipt: OperationStopReceipt }
  | { kind: 'battle'; order: Order; division: Division; target: Territory; commander: Commander; stance: BattleStance; forecast: BattleForecast; resolution: OperationWeekResolution; airSupport: number };

// Close support belongs to a named operation area, not every land order on Earth.
// Unknown legacy objectives can use their theater, but cannot cross theaters.
const supportAreas: Record<string, { territoryIds: string[]; frontIds: string[] }> = {
  'channel-air-zone': { territoryIds: ['channel', 'france', 'normandy', 'calais', 'cherbourg'], frontIds: ['normandy-bocage', 'channel-coast', 'cotentin-front'] },
  'normandy-landing-sector': { territoryIds: ['normandy', 'cherbourg', 'france'], frontIds: ['normandy-bocage', 'cotentin-front'] },
  'solomons-air-zone': { territoryIds: ['solomons', 'rabaul', 'new_guinea', 'port_moresby', 'milne_bay', 'biak', 'hollandia', 'admiralties'], frontIds: ['new-guinea', 'papua', 'southwest-pacific', 'solomons'] },
  'philippines-landing-sector': { territoryIds: ['philippines', 'leyte', 'mindanao', 'bataan', 'lingayen', 'clark'], frontIds: ['philippines', 'luzon-front', 'philippine-resistance'] },
};

/** The scheduler supplies validated battle orders; retain first-order deduplication here too. */
export function allocateCloseAirSupport(orders: Order[], territories: Territory[], operations: CompletedCloseAirSupport[]): Map<string, number> {
  const allocated = new Map<string, number>();
  const seenOperations = new Set<string>();
  const seenDivisions = new Set<string>();
  const uniqueOrders = orders.filter((order) => {
    if (seenDivisions.has(order.divisionId)) return false;
    seenDivisions.add(order.divisionId);
    return true;
  });
  for (const operation of operations) {
    if (operation.kind !== 'close-support' || seenOperations.has(operation.id)) continue;
    seenOperations.add(operation.id);
    const strength = operation.effectStrength ?? 1;
    const budget = Number.isFinite(strength) ? Math.round(12 * Math.max(0, Math.min(1, strength))) : 0;
    if (budget === 0) continue;
    const area = operation.objectiveId ? supportAreas[operation.objectiveId] : undefined;
    const eligible = [...new Set(uniqueOrders.filter((order) => {
      const target = territories.find((territory) => territory.id === order.targetId);
      return target && (target.theater ?? 'europe') === operation.theater
        && (!area || area.territoryIds.includes(target.id) || area.frontIds.includes(target.frontId ?? ''));
    }).map((order) => order.divisionId))].sort();
    eligible.forEach((divisionId, index) => {
      const points = Math.floor(budget / eligible.length) + (index < budget % eligible.length ? 1 : 0);
      allocated.set(divisionId, (allocated.get(divisionId) ?? 0) + points);
    });
  }
  return allocated;
}

/** Resolve every front against the same opening-week snapshot. No global queue. */
export function resolveLandOrdersWeek(input: LandWeekInput): { entries: LandOrderResolution[]; orders: Order[] } {
  const entries: LandOrderResolution[] = [];
  const nextOrders: Order[] = [];
  const usedDivisions = new Set<string>();
  const random = input.random ?? Math.random;
  type PreparedOrder = Exclude<LandOrderResolution, { kind: 'battle' }>
    | { kind: 'pending'; order: Order }
    | { kind: 'battle'; order: Order; division: Division; target: Territory; origin: Territory; commander: Commander };
  const prepared: PreparedOrder[] = [];
  const invalid = (order: Order, reason: string): Extract<LandOrderResolution, { kind: 'invalid' }> => ({ kind: 'invalid', order, reason, receipt: createOperationTerminalReceipt(order, input.week, 'invalidated', reason) });
  for (const order of normalizeOperationOrders(input.orders, input.territories, input.divisions)) {
    if (usedDivisions.has(order.divisionId)) {
      prepared.push(invalid(order, '같은 부대의 중복 명령을 정리했습니다. 먼저 승인된 명령만 집행합니다.'));
      continue;
    }
    usedDivisions.add(order.divisionId);
    if (order.startedWeek >= input.week) {
      prepared.push({ kind: 'pending', order });
      continue;
    }
    const division = input.divisions.find((item) => item.id === order.divisionId);
    if (division && order.stopRequestedWeek !== undefined && order.stopRequestedWeek < input.week) {
      const reason = '요청한 공세 중단을 교전 전에 집행했습니다. 위치·누적 손실·승인 비용을 유지하며 목표를 점령하지 않았습니다.';
      prepared.push({ kind: 'stopped', order, division,
        releasedStatus: division.organization >= 70 && division.strength > 0 ? 'ready' : 'recovering', reason,
        receipt: createOperationTerminalReceipt(order, input.week, 'stopped', reason) });
      continue;
    }
    const target = input.territories.find((item) => item.id === order.targetId);
    const origin = input.territories.find((item) => item.id === order.fromId);
    const commander = input.commanders.find((item) => item.id === division?.commanderId);
    if (!division || !target || !origin || !commander) {
      prepared.push(invalid(order, '부대·지휘관·출발지·목표 중 하나가 없어 집행할 수 없는 명령을 해제했습니다.'));
      continue;
    }
    if (division.territoryId !== origin.id) {
      prepared.push(invalid(order, '부대가 승인된 출발선에 없어 공세 명령을 해제했습니다.'));
      continue;
    }
    // A captured destination is not permission to march across a sea route.
    // Recheck saved orders before both combat and the friendly-reinforcement path.
    const routeValidation = validateLandRoute(origin, target);
    if (!routeValidation.allowed) {
      prepared.push(invalid(order, routeValidation.reason));
      continue;
    }
    const access = input.militaryAccess ? { ...input.militaryAccess, week: input.week } : undefined;
    if (access) {
      const departure = getSiteMilitaryAccess(origin, order.intent === 'redeployment' ? 'land-departure' : 'offensive', access);
      if (!departure.allowed) {
        prepared.push(invalid(order, departure.reason));
        continue;
      }
    }
    const canMove = access ? getSiteMilitaryAccess(target, 'transit', access).allowed : target.controller === input.playerFaction;
    if (order.intent === 'redeployment' && !canMove) {
      prepared.push(invalid(order, '재배치 목적지의 통제·통행권이 유효하지 않습니다. 이동을 취소하고 원래 위치를 유지합니다. 재배치 명령을 공세로 바꾸지 않습니다.'));
      continue;
    }
    if (order.intent === 'redeployment' || (target.controller === input.playerFaction && canMove)) {
      prepared.push({ kind: 'move', order, division, target, receipt: createOperationTerminalReceipt(order, input.week, 'reinforced', order.intent === 'redeployment'
        ? '허가된 인접 거점으로 교전 없이 이동했습니다. 외국 거점의 소유권·통제권·보급과 최초 승인 비용은 바뀌지 않습니다.'
        : '목표가 이미 아군 통제여서 새 교전 없이 집결했습니다. 공세는 종결되며 이동 소모와 최초 승인 비용은 유지됩니다.') });
      continue;
    }
    const validation = validateOffensiveTarget({ origin, target, playerFaction: input.playerFaction, militaryAccess: access });
    if (!validation.allowed) {
      prepared.push(invalid(order, validation.reason));
      continue;
    }
    prepared.push({ kind: 'battle', order, division, target, origin, commander });
  }
  const airSupport = allocateCloseAirSupport(prepared.filter((entry) => entry.kind === 'battle').map((entry) => entry.order), input.territories, input.completedAirSupport ?? []);
  for (const entry of prepared) {
    if (entry.kind === 'pending') {
      nextOrders.push(entry.order);
      continue;
    }
    if (entry.kind !== 'battle') {
      entries.push(entry);
      continue;
    }
    const { order, division, target, origin, commander } = entry;
    const stance = order.stance ?? input.stance;
    const battleInput = {
      week: input.week, division, commander, target, stance,
      enemyPressure: input.enemyPressure, intelNetwork: input.intelNetwork,
      doctrineBonus: input.doctrine === 'maneuver' && division.type === 'armor' ? 14 : input.doctrine === 'methodical' ? 7 : 4,
      policyAttackBonus: input.policyAttackBonus,
      priorityBonus: division.id === input.priorityDivisionId ? 5 : 0,
    };
    const normalized = normalizeOperationOrder(order, origin, target, division);
    const forecast = forecastOperationBattle(battleInput, normalized.battleType!);
    const report = { ...resolveBattle({ ...battleInput, randomRolls: [random(), random(), random(), random()] }), commanderId: division.commanderId };
    const allocatedPoints = airSupport.get(division.id) ?? 0;
    const previousProgress = normalized.operationProgress ?? 0;
    const points = Math.min(allocatedPoints, Math.max(0, (normalized.operationRequired ?? 152) - previousProgress));
    const supported = points > 0 ? { ...normalized, operationProgress: previousProgress + points } : normalized;
    const resolution = advanceOperationWeek(supported, report, division);
    resolution.report.appliedAirSupport = points;
    if (points > 0) {
      resolution.progressGained += points;
      resolution.report.summary = `지정 작전구역 근접항공지원 진척 +${points}. ${resolution.report.summary}`;
    }
    entries.push({ kind: 'battle', order, division, target, commander, stance, forecast, resolution, airSupport: points });
    if (resolution.outcome === 'ongoing') nextOrders.push(resolution.order);
  }
  return { entries, orders: nextOrders };
}
