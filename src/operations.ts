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
  order: Pick<Order, 'divisionId' | 'fromId' | 'targetId' | 'startedWeek' | 'stance'>,
  origin: Territory,
  target: Territory,
  division: Division,
): Order {
  const battleType = inferBattleType(origin, target, division);
  const profile = battleTypeProfiles[battleType];
  return {
    ...order,
    battleType,
    operationProgress: 0,
    operationRequired: profile.requiredProgress,
    elapsedWeeks: 0,
    maxWeeks: profile.maximumWeeks,
    cumulativeMargin: 0,
  };
}

export function normalizeOperationOrder(order: Order, origin: Territory, target: Territory, division: Division): Order {
  if (order.battleType && order.operationRequired !== undefined && order.elapsedWeeks !== undefined) return order;
  return createOperationOrder(order, origin, target, division);
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
    ...order,
    battleType,
    operationProgress,
    operationRequired: required,
    elapsedWeeks,
    maxWeeks: order.maxWeeks ?? profile.maximumWeeks,
    cumulativeMargin: (order.cumulativeMargin ?? 0) + rawReport.margin,
  };
  const report: BattleReport = {
    ...rawReport,
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
