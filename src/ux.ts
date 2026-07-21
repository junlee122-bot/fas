import { getAvailableSkillPoints } from './development';
import type { PublicHealthState } from './publicHealth';
import type { CommanderDevelopment, Division, GameTab, Order, ProductionLine, ResearchProject } from './types';

export type UXActionPriority = 'urgent' | 'recommended' | 'info';

export interface UXAction {
  id: string;
  priority: UXActionPriority;
  title: string;
  detail: string;
  reason?: string;
  ifIgnored?: string;
  resolution?: string;
  instruction?: string;
  label: string;
  tab: GameTab;
}

export function isTrackedActionResolved(trackedActionId: string | null, actions: UXAction[]) {
  return trackedActionId !== null && !actions.some((action) => action.id === trackedActionId);
}

export interface CommandReadiness {
  urgentCount: number;
  recommendedCount: number;
  infoCount: number;
  state: 'blocked' | 'review' | 'clear';
  title: string;
  detail: string;
}

export type WeeklyCommandStageId = 'review' | 'briefing' | 'decisions' | 'advance';
export type WeeklyCommandStageState = 'complete' | 'current' | 'optional' | 'waiting' | 'ready';
export type WeeklyCommandDestination = 'journal' | 'weekly' | 'actions' | 'advance';

export interface WeeklyCommandStage {
  id: WeeklyCommandStageId;
  label: string;
  title: string;
  detail: string;
  state: WeeklyCommandStageState;
  destination: WeeklyCommandDestination;
}

export interface WeeklyCommandCycleInput {
  week: number;
  hasCurrentWeekResults: boolean;
  resultsReviewed: boolean;
  weeklyUnread: boolean;
  urgentCount: number;
  recommendedCount: number;
  activeOrders: number;
  activeResearch: number;
}

export interface WeeklyCommandCycle {
  steps: WeeklyCommandStage[];
  currentStage: WeeklyCommandStageId;
  primaryDestination: WeeklyCommandDestination;
  primaryLabel: string;
  readyToAdvance: boolean;
  headline: string;
  detail: string;
}

export interface UXPreferences {
  soundOn: boolean;
  highContrast: boolean;
  readableUI: boolean;
  largeMapLabels: boolean;
  reducedMotion: boolean;
}

export interface ActionCenterInput {
  factories: number;
  production: ProductionLine[];
  research: ResearchProject[];
  selectedPolicies: string[];
  divisions: Division[];
  orders: Order[];
  commanderDevelopment: CommanderDevelopment[];
  publicHealth?: PublicHealthState;
  economyOperatingBalance?: number;
  economyInflation?: number;
  economyDebt?: number;
  formatMoney?: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  detail: string;
  tab: GameTab;
  complete: boolean;
}

export interface OnboardingInput {
  factories: number;
  production: ProductionLine[];
  research: ResearchProject[];
  selectedPolicies: string[];
  orders: Order[];
}

export const defaultUXPreferences: UXPreferences = {
  soundOn: true,
  highContrast: false,
  readableUI: true,
  largeMapLabels: false,
  reducedMotion: false,
};

export function deriveCommandReadiness(actions: readonly UXAction[]): CommandReadiness {
  const urgentCount = actions.filter((action) => action.priority === 'urgent').length;
  const recommendedCount = actions.filter((action) => action.priority === 'recommended').length;
  const infoCount = actions.filter((action) => action.priority === 'info').length;
  if (urgentCount > 0) return {
    urgentCount,
    recommendedCount,
    infoCount,
    state: 'blocked',
    title: `긴급 판단 ${urgentCount}건이 남아 있습니다`,
    detail: '다음 주로 넘어갈 수는 있지만, 미처리 위험이 즉시 악화되거나 기회를 잃을 수 있습니다.',
  };
  if (recommendedCount > 0) return {
    urgentCount,
    recommendedCount,
    infoCount,
    state: 'review',
    title: `권장 조치 ${recommendedCount}건을 검토하십시오`,
    detail: '즉시 위기는 없지만 지금 조정하면 다음 주 손실과 복구 비용을 줄일 수 있습니다.',
  };
  return {
    urgentCount,
    recommendedCount,
    infoCount,
    state: 'clear',
    title: '핵심 결재가 정리되었습니다',
    detail: '현재 확인된 긴급·권장 행동이 없습니다. 다음 주 진행 준비가 완료됐습니다.',
  };
}

export function deriveWeeklyCommandCycle({
  week,
  hasCurrentWeekResults,
  resultsReviewed,
  weeklyUnread,
  urgentCount,
  recommendedCount,
  activeOrders,
  activeResearch,
}: WeeklyCommandCycleInput): WeeklyCommandCycle {
  const resultsPending = week > 0 && hasCurrentWeekResults && !resultsReviewed;
  const decisionsPending = urgentCount > 0;
  const currentStage: WeeklyCommandStageId = resultsPending
    ? 'review'
    : weeklyUnread
      ? 'briefing'
      : decisionsPending
        ? 'decisions'
        : 'advance';
  const readyToAdvance = currentStage === 'advance';
  const primaryDestination: WeeklyCommandDestination = currentStage === 'review'
    ? 'journal'
    : currentStage === 'briefing'
      ? 'weekly'
      : currentStage === 'decisions'
        ? 'actions'
        : 'advance';

  const steps: WeeklyCommandStage[] = [
    {
      id: 'review',
      label: '01 · 결과 확인',
      title: week === 0 || !hasCurrentWeekResults ? '취임 주간 · 이전 결산 없음' : resultsReviewed ? '지난주 결산 확인 완료' : '새 주간 결산 도착',
      detail: week === 0 || !hasCurrentWeekResults ? '첫 지휘 판단을 준비하십시오.' : resultsReviewed ? '선택과 결과의 인과관계를 확인했습니다.' : '무엇이 왜 바뀌었는지 먼저 검토하십시오.',
      state: resultsPending ? 'current' : 'complete',
      destination: 'journal',
    },
    {
      id: 'briefing',
      label: '02 · 세계 파악',
      title: weeklyUnread ? '새 세계 주보 읽기' : '세계 주보 확인 완료',
      detail: weeklyUnread ? '전선·외교·경제의 지난 7일을 확인하십시오.' : '현재 세계선의 변화를 파악했습니다.',
      state: weeklyUnread ? (resultsPending ? 'waiting' : 'current') : 'complete',
      destination: 'weekly',
    },
    {
      id: 'decisions',
      label: '03 · 결재·배치',
      title: decisionsPending ? `긴급 결재 ${urgentCount}건` : recommendedCount > 0 ? `권장 조정 ${recommendedCount}건` : '필수 결재 정리 완료',
      detail: `승인된 작전 ${activeOrders}건 · 진행 연구 ${activeResearch}/2`,
      state: decisionsPending ? (resultsPending || weeklyUnread ? 'waiting' : 'current') : recommendedCount > 0 ? 'optional' : 'complete',
      destination: 'actions',
    },
    {
      id: 'advance',
      label: '04 · 주간 진행',
      title: readyToAdvance ? '다음 주 계산 준비 완료' : '앞선 단계 검토 대기',
      detail: readyToAdvance ? '생산·작전·연구·재정을 한 번에 확정합니다.' : '필수 검토를 마치면 진행할 수 있습니다.',
      state: readyToAdvance ? 'ready' : 'waiting',
      destination: 'advance',
    },
  ];

  if (currentStage === 'review') return {
    steps,
    currentStage,
    primaryDestination,
    primaryLabel: '이번 주 결산 확인',
    readyToAdvance,
    headline: '결과를 읽고 다음 판단을 시작하십시오.',
    detail: '지난 선택의 즉시 효과와 계속 남는 영향을 확인하면 다음 결재의 우선순위가 선명해집니다.',
  };
  if (currentStage === 'briefing') return {
    steps,
    currentStage,
    primaryDestination,
    primaryLabel: '세계 주보 읽기',
    readyToAdvance,
    headline: '새 주간의 세계 상황을 파악하십시오.',
    detail: '지난 7일의 전선·외교·경제 변화가 이번 주 선택의 조건이 됩니다.',
  };
  if (currentStage === 'decisions') return {
    steps,
    currentStage,
    primaryDestination,
    primaryLabel: `긴급 결재 ${urgentCount}건`,
    readyToAdvance,
    headline: '필수 결재를 정리한 뒤 시간을 진행하십시오.',
    detail: '해결하지 않아도 진행할 수 있지만 손실이나 기회비용이 커질 수 있습니다.',
  };
  return {
    steps,
    currentStage,
    primaryDestination,
    primaryLabel: '다음 주 진행',
    readyToAdvance,
    headline: recommendedCount > 0 ? '필수 준비 완료 · 권장 조정은 선택 사항입니다.' : '이번 주 지휘 준비가 완료됐습니다.',
    detail: recommendedCount > 0 ? `권장 조정 ${recommendedCount}건을 더 검토하거나 바로 다음 주로 진행할 수 있습니다.` : '생산·작전·연구·재정 계산을 확정할 수 있습니다.',
  };
}

export function getInitialNavigationCollapsed(savedValue: string | null, viewportWidth: number) {
  return viewportWidth <= 900 || savedValue === 'true';
}

export function normalizeUXPreferences(value: Partial<UXPreferences> | null | undefined): UXPreferences {
  return {
    soundOn: value?.soundOn ?? defaultUXPreferences.soundOn,
    highContrast: value?.highContrast ?? defaultUXPreferences.highContrast,
    readableUI: value?.readableUI ?? defaultUXPreferences.readableUI,
    largeMapLabels: value?.largeMapLabels ?? defaultUXPreferences.largeMapLabels,
    reducedMotion: value?.reducedMotion ?? defaultUXPreferences.reducedMotion,
  };
}

export function deriveOnboardingSteps({
  factories,
  production,
  research,
  selectedPolicies,
  orders,
}: OnboardingInput): OnboardingStep[] {
  const usedFactories = production.reduce((total, line) => total + line.assigned, 0);
  const activeResearch = research.filter((project) => project.active && !project.complete).length;

  return [
    { id: 'path', title: '첫 역사 압력 만들기', detail: '국가 원칙 하나를 채택하면 그 행동부터 미래 사건의 조건이 달라집니다.', tab: 'organization', complete: selectedPolicies.length > 0 },
    { id: 'research', title: '연구 슬롯 2개 배정', detail: '비어 있는 연구 슬롯은 매주 기술 성장 기회를 잃습니다.', tab: 'research', complete: activeResearch >= 2 },
    { id: 'factories', title: '군수 공장 전부 배정', detail: '모든 공장을 장비 생산선에 투입해 주간 산출량을 확보합니다.', tab: 'industry', complete: usedFactories >= factories },
    { id: 'policies', title: '국가 원칙 4개 확정', detail: '경제·교리·사회·외교 영역의 운영 원칙을 하나씩 선택합니다.', tab: 'organization', complete: selectedPolicies.length >= 4 },
    { id: 'order', title: '첫 작전 명령 수립', detail: '준비된 사단에 공세 명령을 내려 전선의 주도권을 시험합니다.', tab: 'army', complete: orders.length > 0 },
  ];
}

export function deriveUXActions({
  factories,
  production,
  research,
  selectedPolicies,
  divisions,
  orders,
  commanderDevelopment,
  publicHealth,
  economyOperatingBalance,
  economyInflation,
  economyDebt,
  formatMoney = (value) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(1)} 재정가치`,
}: ActionCenterInput): UXAction[] {
  const actions: UXAction[] = [];
  const availableSkills = commanderDevelopment.reduce((total, record) => total + getAvailableSkillPoints(record), 0);
  const activeResearch = research.filter((project) => project.active && !project.complete).length;
  const usedFactories = production.reduce((total, line) => total + line.assigned, 0);
  const idleFactories = Math.max(0, factories - usedFactories);
  const readyDivisions = divisions.filter((division) => division.status === 'ready').length;
  const recoveringDivisions = divisions.filter((division) => division.status === 'recovering').length;

  if (publicHealth?.activeOutbreak) {
    const outbreak = publicHealth.activeOutbreak;
    actions.push({
      id: 'public-health-crisis',
      priority: outbreak.phase === 'pandemic' || outbreak.hospitalLoad >= 100 ? 'urgent' : 'recommended',
      title: `${outbreak.codeName} 보건 위기 대응`,
      detail: `주간 추정 ${Math.round(outbreak.weeklyCases).toLocaleString('ko-KR')}건 · R ${outbreak.rEffective.toFixed(2)} · 병상 부하 ${Math.round(outbreak.hospitalLoad)}%. 대응 태세를 검토하십시오.`,
      reason: `유행 단계 ${outbreak.phase} · 병상 부하 ${Math.round(outbreak.hospitalLoad)}%`,
      ifIgnored: '감염·사망·병상 압력이 누적되어 전선과 국가 생산성까지 낮아질 수 있습니다.',
      resolution: '대응 태세 즉시 적용 · 다음 주 보건 결산에서 검증',
      instruction: '태세별 다음 주 전망을 비교한 뒤 병상 부하를 감당할 대응 태세와 의료 투자를 선택하십시오.',
      label: '위기 지휘실',
      tab: 'health',
    });
  } else if (publicHealth && publicHealth.weeklyRisk >= 0.018) {
    actions.push({
      id: 'public-health-readiness',
      priority: 'recommended',
      title: `감염병 주간 위험 ${(publicHealth.weeklyRisk * 100).toFixed(1)}%`,
      detail: '전선 압력과 보급 상황이 발병 위험을 높이고 있습니다. 감시 실험실·의료 역량을 선제 확충할 수 있습니다.',
      reason: '전선 압력·보급 저하·감시 공백이 선제 대응 기준을 넘었습니다.',
      ifIgnored: '발병 시 초기 탐지가 늦어지고 첫 주 감염 규모가 커질 수 있습니다.',
      resolution: '대비 투자 즉시 반영 · 다음 주 발병 위험 재계산',
      instruction: '감시 실험실과 의료 역량 투자부터 확충하고, 주간 발병 위험이 낮아지는지 비교하십시오.',
      label: '대비 태세',
      tab: 'health',
    });
  }

  if (economyOperatingBalance !== undefined && economyOperatingBalance < -20) {
    actions.push({
      id: 'economy-operating-deficit',
      priority: economyOperatingBalance < -60 ? 'urgent' : 'recommended',
      title: `주간 경상적자 ${formatMoney(Math.abs(economyOperatingBalance))}`,
      detail: `국채 조달을 제외한 세입보다 지출이 큽니다. 현재 부채 ${formatMoney(economyDebt ?? 0)}의 이자와 조세·지출 구성을 검토하십시오.`,
      reason: `경상수지 ${formatMoney(economyOperatingBalance, { signed: true })} · 금융조달 제외`,
      ifIgnored: '차환 의존과 이자비용이 늘어 다음 정책의 가용 국고가 줄어듭니다.',
      resolution: '세입·지출·국채 조정 즉시 · 다음 주 재정 결산에서 확인',
      instruction: '주간 현금흐름에서 적자 원인을 확인하고 조세·지출을 조정한 뒤 부족분만 국채로 조달하십시오.',
      label: '재정 결산',
      tab: 'economy',
    });
  }

  if (economyInflation !== undefined && economyInflation >= 10) {
    actions.push({
      id: 'economy-inflation',
      priority: economyInflation >= 18 ? 'urgent' : 'recommended',
      title: `전시 인플레이션 ${economyInflation.toFixed(1)}%`,
      detail: '중앙은행 신용, 물자 부족과 가격통제 수준을 함께 점검하십시오. 조달액이 커도 실질 구매력은 줄어들 수 있습니다.',
      reason: `물가 ${economyInflation.toFixed(1)}% · 전시 공급과 통화량의 불균형`,
      ifIgnored: '군수 조달비와 생활비가 함께 올라 안정도·실질 세입이 악화됩니다.',
      resolution: '통화·공급 정책 적용 · 다음 주 물가와 구매력에 반영',
      instruction: '중앙은행 정책과 민생·산업 공급을 함께 조정해 물가 억제가 생산을 과도하게 훼손하지 않게 하십시오.',
      label: '물가 대책',
      tab: 'economy',
    });
  }

  if (availableSkills > 0) {
    actions.push({
      id: 'commander-skill',
      priority: 'urgent',
      title: `지휘관 특기 ${availableSkills}개 대기`,
      detail: '실전 경험으로 얻은 특기 점수를 투자하면 다음 전투부터 능력치가 반영됩니다.',
      reason: `전투 경험으로 사용 가능한 특기 점수 ${availableSkills}개가 쌓였습니다.`,
      ifIgnored: '점수는 보존되지만 다음 전투에서 받을 수 있는 지휘 보정을 놓칩니다.',
      resolution: '선택 즉시 지휘관 능력 반영 · 다음 전투부터 적용',
      instruction: '선택된 지휘관의 특기 트리에서 현재 교리와 주력 전구에 맞는 특기 한 개를 확정하십시오.',
      label: '특기 선택',
      tab: 'army',
    });
  }

  if (activeResearch < 2) {
    actions.push({
      id: 'research-slot',
      priority: activeResearch === 0 ? 'urgent' : 'recommended',
      title: activeResearch === 0 ? '연구가 중단됨' : '연구 슬롯 1개 비어 있음',
      detail: '동시에 두 개 과제를 진행할 수 있습니다. 비어 있는 슬롯은 매주 손실되는 연구 기회입니다.',
      reason: `활성 연구 ${activeResearch}/2 · 주간 연구역량 일부 미사용`,
      ifIgnored: '비어 있는 슬롯의 이번 주 연구 진척은 이후에 복구할 수 없습니다.',
      resolution: '과제 배정 즉시 · 다음 주 연구 진척에 반영',
      instruction: '비어 있는 연구 슬롯을 선택하고, 현재 장비 병목이나 장기 교리에 맞는 과제를 배정하십시오.',
      label: '연구 배정',
      tab: 'research',
    });
  }

  if (idleFactories > 0) {
    actions.push({
      id: 'idle-factories',
      priority: idleFactories >= 5 ? 'urgent' : 'recommended',
      title: `미배정 군수 공장 ${idleFactories}개`,
      detail: '생산 라인에 공장을 배정하면 장비 비축량과 생산 효율이 매주 증가합니다.',
      reason: `가용 ${factories}개 중 ${idleFactories}개 공장이 생산 명령을 받지 않았습니다.`,
      ifIgnored: '이번 주 생산량과 라인 효율 상승분을 영구적으로 잃습니다.',
      resolution: '공장 배정 즉시 · 다음 주 장비 생산량에 반영',
      instruction: '생산 라인의 증감 제어로 미배정 공장을 0개로 만들고, 보급 부족 장비를 우선하십시오.',
      label: '생산 조정',
      tab: 'industry',
    });
  }

  if (selectedPolicies.length < 4) {
    actions.push({
      id: 'national-policy',
      priority: 'recommended',
      title: `국가 원칙 ${selectedPolicies.length}/4 선택`,
      detail: '경제·교리·사회·외교 원칙을 하나씩 정해 국가 운영 방향을 완성하십시오.',
      reason: `운영 원칙 ${4 - selectedPolicies.length}개 영역이 아직 비어 있습니다.`,
      ifIgnored: '국가 보정과 대체역사 분기 조건이 활성화되지 않습니다.',
      resolution: '채택 즉시 국가 보정 적용 · 이후 사건 조건에 지속 반영',
      instruction: '경제·교리·사회·외교 영역에서 원칙을 하나씩 선택해 4개 운영 축을 완성하십시오.',
      label: '원칙 결정',
      tab: 'organization',
    });
  }

  if (orders.length === 0 && readyDivisions > 0) {
    actions.push({
      id: 'idle-formations',
      priority: 'recommended',
      title: `명령 대기 중인 준비 사단 ${readyDivisions}개`,
      detail: '인접 적 지역에 공세를 계획하거나 야전 훈련으로 다음 작전을 준비할 수 있습니다.',
      reason: `준비 완료 사단 ${readyDivisions}개 · 활성 작전 명령 0건`,
      ifIgnored: '전선 주도권과 경험 획득 기회를 넘기지만 병력·보급은 보존됩니다.',
      resolution: '명령 승인 즉시 · 다음 주 전투 또는 훈련 결과로 계산',
      instruction: '준비 사단을 선택하고 인접 목표와 공세 태세를 비교한 뒤, 승인하거나 야전 훈련을 선택하십시오.',
      label: '부대 지휘',
      tab: 'army',
    });
  }

  if (recoveringDivisions > 0) {
    actions.push({
      id: 'recovering-formations',
      priority: 'info',
      title: `재편 중인 사단 ${recoveringDivisions}개`,
      detail: '보급 정책과 최우선 편제를 조정하면 조직력·전력 회복 속도를 높일 수 있습니다.',
      reason: `조직력 또는 전력이 기준 아래인 사단 ${recoveringDivisions}개`,
      ifIgnored: '현재 속도로 회복하지만 해당 사단의 작전 복귀가 늦어질 수 있습니다.',
      resolution: '보급·편제 우선순위 변경 · 다음 주 회복량에 반영',
      instruction: '재편 사단의 보급 우선순위와 담당 참모·편제를 점검해 회복 병목을 제거하십시오.',
      label: '회복 상태 보기',
      tab: 'organization',
    });
  }

  const priorityOrder: Record<UXActionPriority, number> = { urgent: 0, recommended: 1, info: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
