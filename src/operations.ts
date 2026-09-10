import type { BattleReport, BattleType, Division, Order, Territory } from './types';

export interface BattleTypeProfile {
  id: BattleType;
  label: string;
  shortLabel: string;
  description: string;
  minimumWeeks: number;
  maximumWeeks: number;
  requiredProgress: number;
  weeklyBaseProgress: number;
  casualtyScale: number;
}

export interface OperationWeekResolution {
  order: Order;
  report: BattleReport;
  outcome: 'ongoing' | 'victory' | 'defeat';
  progressGained: number;
  progressPercent: number;
  profile: BattleTypeProfile;
}

export interface OperationStopReceipt {
  orderId: string;
  week: number;
  divisionId: string;
  targetId: string;
  reason: string;
  elapsedWeeks?: number;
  progressPercent?: number;
}

export function normalizeOperationStopReceipts(value: unknown): OperationStopReceipt[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const receipts: OperationStopReceipt[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<OperationStopReceipt>;
    if (![record.orderId, record.divisionId, record.targetId, record.reason].every((field) => typeof field === 'string' && field.trim().length > 0)
      || !Number.isInteger(record.week) || record.week! < 0) continue;
    const key = JSON.stringify([record.orderId, record.week]);
    if (seen.has(key)) continue;
    seen.add(key);
    receipts.push({ orderId: record.orderId!, week: record.week!, divisionId: record.divisionId!, targetId: record.targetId!, reason: record.reason!,
      ...(Number.isInteger(record.elapsedWeeks) && record.elapsedWeeks! >= 0 ? { elapsedWeeks: record.elapsedWeeks } : {}),
      ...(typeof record.progressPercent === 'number' && Number.isFinite(record.progressPercent) && record.progressPercent >= 0 && record.progressPercent <= 100 ? { progressPercent: record.progressPercent } : {}) });
  }
  return receipts.sort((a, b) => b.week - a.week).slice(0, 120);
}

export interface OperationStopContext {
  week: number;
  phase: 'war' | 'nation';
  commandableDivisionIds: ReadonlySet<string>;
  processingWeek?: boolean;
}

const hasId = (value: string | undefined): value is string => typeof value === 'string' && value.trim().length > 0;
const finiteNonnegative = (value: number | undefined, fallback: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

/** Pure legacy identity: independent of progress, current week and array ordering. */
export function getOperationOrderId(order: Order): string {
  if (hasId(order.id)) return order.id;
  if (hasId(order.commandId)) return `land:${encodeURIComponent(order.commandId)}`;
  return `legacy-land:${[order.divisionId, order.fromId, order.targetId, order.startedWeek].map((value) => encodeURIComponent(String(value))).join(':')}`;
}

function normalizeOrderIdentity(order: Order): Order {
  const id = getOperationOrderId(order);
  const stopRequestedWeek = typeof order.stopRequestedWeek === 'number' && Number.isInteger(order.stopRequestedWeek)
    && order.stopRequestedWeek >= order.startedWeek ? order.stopRequestedWeek : undefined;
  return { ...order, id, commandId: hasId(order.commandId) ? order.commandId : id,
    ...(order.commandCost !== undefined ? { commandCost: finiteNonnegative(order.commandCost, 0) } : {}), stopRequestedWeek };
}

/** Save migration does not reset progress or invent missing divisions/territories. */
export function normalizeOperationOrders(orders: readonly Order[], territories: readonly Territory[], divisions: readonly Division[]): Order[] {
  const ids = new Set<string>();
  return orders.map((order, index) => {
    const origin = territories.find((item) => item.id === order.fromId);
    const target = territories.find((item) => item.id === order.targetId);
    const division = divisions.find((item) => item.id === order.divisionId);
    let normalized = origin && target && division ? normalizeOperationOrder(order, origin, target, division) : normalizeOrderIdentity(order);
    const originalId = getOperationOrderId(normalized);
    let id = originalId;
    let suffix = index;
    while (ids.has(id)) id = `${originalId}:duplicate-${suffix++}`;
    if (id !== originalId) normalized = { ...normalized, id };
    ids.add(id);
    return normalized;
  });
}

export function requestLandOperationStop(orders: readonly Order[], orderId: string, context: OperationStopContext): { orders: Order[]; applied: boolean; reason: string; order?: Order } {
  const unchanged = (reason: string, order?: Order) => ({ orders: [...orders], applied: false, reason, order });
  if (!Number.isInteger(context.week) || context.week < 0) return unchanged('현재 주차를 확인할 수 없습니다.');
  if (context.phase !== 'war') return unchanged('국정 단계에서는 전시 공세 중단 명령을 내릴 수 없습니다.');
  if (context.processingWeek) return unchanged('주간 결산 중입니다. 결산을 마친 뒤 중단을 요청하십시오.');
  const matches = orders.filter((order) => getOperationOrderId(order) === orderId);
  if (matches.length !== 1) return unchanged(matches.length ? '중복 작전 식별자를 먼저 정리해야 합니다.' : '이미 종료되었거나 찾을 수 없는 작전입니다.');
  const order = matches[0];
  if (!context.commandableDivisionIds.has(order.divisionId)) return unchanged('현재 보직의 지휘 범위 밖 작전입니다.');
  if (order.startedWeek > context.week) return unchanged('아직 승인 주차가 되지 않은 명령입니다.');
  if (order.stopRequestedWeek !== undefined && order.stopRequestedWeek <= context.week) return unchanged('이미 중단을 요청했습니다. 다음 주 교전 전에 처리합니다.', order);
  const stopped = { ...normalizeOrderIdentity(order), stopRequestedWeek: context.week };
  return { orders: orders.map((item) => item === order ? stopped : item), applied: true, order: stopped,
    reason: '다음 주 교전 전에 공세를 중단합니다. 기존 손실·위치·승인 비용은 되돌리지 않습니다.' };
}

/** Never guess a repeat assault's identity from its division or target name. */
export function getOperationReports(reports: readonly BattleReport[], orderId: string, week: number, identity?: Pick<Order, 'divisionId' | 'targetId'>): BattleReport[] {
  return reports.filter((report) => report.orderId === orderId && Number.isInteger(report.week) && report.week >= 0 && report.week <= week
    && (!identity || report.divisionId === identity.divisionId && report.targetId === identity.targetId))
    .sort((a, b) => b.week - a.week || b.id.localeCompare(a.id));
}

export const battleTypeProfiles: Record<BattleType, BattleTypeProfile> = {
  maneuver: {
    id: 'maneuver',
    label: '기동 돌파전',
    shortLabel: '기동전',
    description: '개활지에서 측면 돌파와 추격으로 빠르게 결판을 노립니다.',
    minimumWeeks: 1,
    maximumWeeks: 3,
    requiredProgress: 68,
    weeklyBaseProgress: 27,
    casualtyScale: .72,
  },
  siege: {
    id: 'siege',
    label: '요새 공방전',
    shortLabel: '공방전',
    description: '방어진지와 보급망을 단계적으로 무너뜨려야 하므로 장기간 이어집니다.',
    minimumWeeks: 4,
    maximumWeeks: 9,
    requiredProgress: 170,
    weeklyBaseProgress: 17,
    casualtyScale: .48,
  },
  amphibious: {
    id: 'amphibious',
    label: '상륙·도서전',
    shortLabel: '상륙전',
    description: '제해권 확보, 상륙, 교두보 확대가 순차적으로 필요합니다.',
    minimumWeeks: 3,
    maximumWeeks: 7,
    requiredProgress: 132,
    weeklyBaseProgress: 19,
    casualtyScale: .52,
  },
  mountain: {
    id: 'mountain',
    label: '산악·정글전',
    shortLabel: '산악전',
    description: '험지와 제한된 보급로 때문에 작은 고지를 두고 전선이 반복 이동합니다.',
    minimumWeeks: 3,
    maximumWeeks: 7,
    requiredProgress: 132,
    weeklyBaseProgress: 19,
    casualtyScale: .5,
  },
  urban: {
    id: 'urban',
    label: '도시 시가전',
    shortLabel: '시가전',
    description: '도시 구획과 교량·철도 거점을 차례로 확보해야 합니다.',
    minimumWeeks: 3,
    maximumWeeks: 7,
    requiredProgress: 138,
    weeklyBaseProgress: 20,
    casualtyScale: .57,
  },
  attrition: {
    id: 'attrition',
    label: '광역 소모전',
    shortLabel: '소모전',
    description: '넓은 전선에서 예비대와 보급 능력을 소진시키며 주도권을 쌓습니다.',
    minimumWeeks: 4,
    maximumWeeks: 8,
    requiredProgress: 152,
    weeklyBaseProgress: 18,
    casualtyScale: .54,
  },
};

const includesAny = (value: string, candidates: string[]) => candidates.some((candidate) => value.includes(candidate));

export function inferBattleType(origin: Territory, target: Territory, division: Division): BattleType {
  const terrain = target.terrain.toLowerCase();
  if (target.siteType === 'island' || target.siteType === 'sea' || includesAny(terrain, ['도서', '해안']) && origin.siteType !== 'island') return 'amphibious';
  if (target.siteType === 'fortress' || includesAny(terrain, ['요새', '방벽'])) return 'siege';
  if (includesAny(terrain, ['산악', '정글', '고원', '구릉'])) return 'mountain';
  if (target.siteType === 'capital' || target.siteType === 'city' || includesAny(terrain, ['도시', '시가지', '공업'])) return 'urban';
  if (division.type === 'armor' && includesAny(terrain, ['평야', '사막', '초원'])) return 'maneuver';
  return 'attrition';
}

export function createOperationOrder(
  order: Pick<Order, 'divisionId' | 'fromId' | 'targetId' | 'startedWeek' | 'stance'> & Partial<Pick<Order, 'id' | 'commandId' | 'commandCost'>>,
  origin: Territory,
  target: Territory,
  division: Division,
): Order {
  const battleType = inferBattleType(origin, target, division);
  const profile = battleTypeProfiles[battleType];
  const commandId = hasId(order.commandId) ? order.commandId : hasId(order.id) ? order.id : crypto.randomUUID();
  return {
    ...order,
    id: hasId(order.id) ? order.id : `land:${encodeURIComponent(commandId)}`,
    commandId,
    battleType,
    operationProgress: 0,
    operationRequired: profile.requiredProgress,
    elapsedWeeks: 0,
    maxWeeks: profile.maximumWeeks,
    cumulativeMargin: 0,
  };
}

export function normalizeOperationOrder(order: Order, origin: Territory, target: Territory, division: Division): Order {
  const battleType = order.battleType && Object.hasOwn(battleTypeProfiles, order.battleType) ? order.battleType : inferBattleType(origin, target, division);
  const profile = battleTypeProfiles[battleType];
  return {
    ...normalizeOrderIdentity(order), battleType,
    operationProgress: finiteNonnegative(order.operationProgress, 0),
    operationRequired: typeof order.operationRequired === 'number' && Number.isFinite(order.operationRequired) && order.operationRequired > 0 ? order.operationRequired : profile.requiredProgress,
    elapsedWeeks: Math.floor(finiteNonnegative(order.elapsedWeeks, 0)),
    maxWeeks: typeof order.maxWeeks === 'number' && Number.isFinite(order.maxWeeks) && order.maxWeeks > 0 ? Math.max(1, Math.floor(order.maxWeeks)) : profile.maximumWeeks,
    cumulativeMargin: typeof order.cumulativeMargin === 'number' && Number.isFinite(order.cumulativeMargin) ? order.cumulativeMargin : 0,
  };
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function advanceOperationWeek(order: Order, rawReport: BattleReport, force?: Pick<Division, 'strength' | 'organization'>): OperationWeekResolution {
  const battleType = order.battleType ?? 'attrition';
  const profile = battleTypeProfiles[battleType];
  const required = order.operationRequired ?? profile.requiredProgress;
  const elapsedWeeks = (order.elapsedWeeks ?? 0) + 1;
  const previousProgress = order.operationProgress ?? 0;
  const exploitationDelta = rawReport.phases.find((phase) => phase.id === 'exploitation')?.delta ?? 0;
  const progressGained = Math.round(clamp(profile.weeklyBaseProgress + rawReport.margin * .72 + exploitationDelta * .18, -12, 52));
  const operationProgress = clamp(previousProgress + progressGained, 0, required + 24);
  const scaledStrengthLoss = Math.max(1, Math.round(rawReport.attackerStrengthLoss * profile.casualtyScale));
  const scaledOrganizationLoss = Math.max(3, Math.round(rawReport.organizationLoss * profile.casualtyScale));
  const projectedStrength = (force?.strength ?? 100) - scaledStrengthLoss;
  const projectedOrganization = (force?.organization ?? 100) - scaledOrganizationLoss;
  const decisiveCollapse = elapsedWeeks >= 2 && rawReport.margin <= -25 && rawReport.phases[2].delta <= -20 && operationProgress < required * .22;
  const victory = elapsedWeeks >= profile.minimumWeeks && operationProgress >= required;
  const defeat = !victory && (decisiveCollapse || elapsedWeeks >= (order.maxWeeks ?? profile.maximumWeeks) || projectedStrength <= 24 || projectedOrganization <= 12);
  const outcome = victory ? 'victory' : defeat ? 'defeat' : 'ongoing';
  const scaledDefenderLoss = Math.max(1, Math.round(rawReport.defenderStrengthLoss * profile.casualtyScale));
  const scaledSupplySpent = Math.max(3, Math.round(rawReport.supplySpent * (.55 + profile.casualtyScale * .25)));
  const progressPercent = Math.round(clamp(operationProgress / required * 100, 0, 100));
  const weeklySummary = outcome === 'victory'
    ? `${profile.label}의 핵심 목표를 모두 달성해 적 방어체계가 붕괴했습니다.`
    : outcome === 'defeat'
      ? `${profile.label}이 한계에 도달해 공세를 중단하고 출발선으로 철수합니다.`
      : `${profile.label} ${elapsedWeeks}주차가 종료됐습니다. 작전 진척도는 ${progressPercent}%이며 다음 주에도 교전이 계속됩니다.`;

  const updatedOrder: Order = {
    ...normalizeOrderIdentity(order),
    battleType,
    operationProgress,
    operationRequired: required,
    elapsedWeeks,
    maxWeeks: order.maxWeeks ?? profile.maximumWeeks,
    cumulativeMargin: (order.cumulativeMargin ?? 0) + rawReport.margin,
  };
  const report: BattleReport = {
    ...rawReport,
    orderId: getOperationOrderId(order),
    orderCommandCost: order.commandCost,
    id: `${rawReport.id}-phase-${elapsedWeeks}`,
    attackerStrengthLoss: scaledStrengthLoss,
    defenderStrengthLoss: scaledDefenderLoss,
    organizationLoss: scaledOrganizationLoss,
    supplySpent: scaledSupplySpent,
    battleType,
    operationWeek: elapsedWeeks,
    operationProgress,
    operationRequired: required,
    operationOutcome: outcome,
    summary: `${weeklySummary} ${rawReport.summary}`,
  };

  return { order: updatedOrder, report, outcome, progressGained, progressPercent, profile };
}

export function getOperationProgress(order: Order): number {
  const profile = battleTypeProfiles[order.battleType ?? 'attrition'];
  return Math.round(clamp((order.operationProgress ?? 0) / (order.operationRequired ?? profile.requiredProgress) * 100, 0, 100));
}
