import { getAvailableSkillPoints } from './development';
import type { PublicHealthState } from './publicHealth';
import type { CareerRole, CommanderDevelopment, Division, GameTab, Order, ProductionLine, ResearchProject } from './types';

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
  signalValue?: number;
  lifecycleStatus?: UXActionLifecycleStatus;
}

export type UXActionLifecycleStatus = 'detected' | 'acknowledged' | 'in-progress' | 'verifying' | 'resolved';

export interface UXActionLifecycleRecord {
  actionId: string;
  status: UXActionLifecycleStatus;
  firstDetectedWeek: number;
  lastChangedWeek: number;
  acknowledgedWeek: number | null;
  actionWeek: number | null;
  verificationWeek: number | null;
  resolvedWeek: number | null;
  recurrenceCount: number;
  lastPriority: UXActionPriority;
  lastSignalValue: number | null;
  snapshot: UXAction;
}

const prioritySeverity: Record<UXActionPriority, number> = { info: 0, recommended: 1, urgent: 2 };

function createLifecycleRecord(action: UXAction, week: number, recurrenceCount = 0): UXActionLifecycleRecord {
  return {
    actionId: action.id,
    status: 'detected',
    firstDetectedWeek: week,
    lastChangedWeek: week,
    acknowledgedWeek: null,
    actionWeek: null,
    verificationWeek: null,
    resolvedWeek: null,
    recurrenceCount,
    lastPriority: action.priority,
    lastSignalValue: action.signalValue ?? null,
    snapshot: { ...action, lifecycleStatus: 'detected' },
  };
}

function hasSignalWorsened(record: UXActionLifecycleRecord, action: UXAction) {
  if (prioritySeverity[action.priority] > prioritySeverity[record.lastPriority]) return true;
  if (action.signalValue === undefined || record.lastSignalValue === null) return false;
  const threshold = Math.max(1, Math.abs(record.lastSignalValue) * 0.05);
  return action.signalValue > record.lastSignalValue + threshold;
}

export function reconcileUXActionLifecycle(records: UXActionLifecycleRecord[], actions: UXAction[], week: number) {
  const currentById = new Map(records.map((record) => [record.actionId, record]));
  const activeIds = new Set(actions.map((action) => action.id));
  const next = actions.map((action) => {
    const existing = currentById.get(action.id);
    if (!existing) return createLifecycleRecord(action, week);
    if (existing.status === 'resolved') return createLifecycleRecord(action, week, existing.recurrenceCount + 1);
    if (existing.status === 'verifying' && hasSignalWorsened(existing, action)) {
      return {
        ...createLifecycleRecord(action, week, existing.recurrenceCount + 1),
        firstDetectedWeek: existing.firstDetectedWeek,
      };
    }
    return {
      ...existing,
      lastPriority: action.priority,
      lastSignalValue: action.signalValue ?? existing.lastSignalValue,
      snapshot: { ...action, lifecycleStatus: existing.status },
    };
  });
  records.forEach((record) => {
    if (activeIds.has(record.actionId)) return;
    if (record.status === 'resolved') {
      if (week - (record.resolvedWeek ?? week) <= 8) next.push(record);
      return;
    }
    next.push({
      ...record,
      status: 'resolved',
      lastChangedWeek: week,
      resolvedWeek: week,
      snapshot: { ...record.snapshot, lifecycleStatus: 'resolved' },
    });
  });
  return next.sort((left, right) => right.lastChangedWeek - left.lastChangedWeek || left.actionId.localeCompare(right.actionId));
}

export function acknowledgeUXActions(records: UXActionLifecycleRecord[], actionIds: readonly string[], week: number) {
  const ids = new Set(actionIds);
  return records.map((record) => record.status === 'detected' && ids.has(record.actionId) ? {
    ...record,
    status: 'acknowledged' as const,
    acknowledgedWeek: week,
    lastChangedWeek: week,
    snapshot: { ...record.snapshot, lifecycleStatus: 'acknowledged' as const },
  } : record);
}

export function startUXAction(records: UXActionLifecycleRecord[], actionId: string, week: number) {
  return records.map((record) => record.actionId === actionId && record.status !== 'resolved' ? {
    ...record,
    status: 'in-progress' as const,
    actionWeek: week,
    lastChangedWeek: week,
    snapshot: { ...record.snapshot, lifecycleStatus: 'in-progress' as const },
  } : record);
}

export function markUXActionsForVerification(records: UXActionLifecycleRecord[], week: number) {
  return records.map((record) => record.status === 'in-progress' ? {
    ...record,
    status: 'verifying' as const,
    verificationWeek: week + 1,
    lastChangedWeek: week,
    snapshot: { ...record.snapshot, lifecycleStatus: 'verifying' as const },
  } : record);
}

export function decorateUXActions(actions: UXAction[], records: UXActionLifecycleRecord[]) {
  const lifecycleById = new Map(records.map((record) => [record.actionId, record]));
  return actions.map((action) => {
    const record = lifecycleById.get(action.id);
    if (!record) return { ...action, lifecycleStatus: 'detected' as const };
    if (record.status === 'verifying') return {
      ...action,
      priority: 'info' as const,
      lifecycleStatus: record.status,
      detail: `조치를 적용했습니다. ${action.detail}`,
      resolution: `제 ${(record.verificationWeek ?? record.lastChangedWeek + 1) + 1}주 결산에서 지표 개선·해결·재발을 검증합니다.`,
      label: '검증 현황',
    };
    return { ...action, lifecycleStatus: record.status };
  });
}

export function normalizeUXActionLifecycle(value: unknown): UXActionLifecycleRecord[] {
  if (!Array.isArray(value)) return [];
  const statuses = new Set<UXActionLifecycleStatus>(['detected', 'acknowledged', 'in-progress', 'verifying', 'resolved']);
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Partial<UXActionLifecycleRecord>;
    if (typeof record.actionId !== 'string' || !record.snapshot || typeof record.snapshot.id !== 'string' || !record.status || !statuses.has(record.status)) return [];
    return [{
      actionId: record.actionId,
      status: record.status,
      firstDetectedWeek: Number(record.firstDetectedWeek) || 0,
      lastChangedWeek: Number(record.lastChangedWeek) || 0,
      acknowledgedWeek: typeof record.acknowledgedWeek === 'number' ? record.acknowledgedWeek : null,
      actionWeek: typeof record.actionWeek === 'number' ? record.actionWeek : null,
      verificationWeek: typeof record.verificationWeek === 'number' ? record.verificationWeek : null,
      resolvedWeek: typeof record.resolvedWeek === 'number' ? record.resolvedWeek : null,
      recurrenceCount: Number(record.recurrenceCount) || 0,
      lastPriority: (record.lastPriority === 'urgent' || record.lastPriority === 'info' ? record.lastPriority : 'recommended') as UXActionPriority,
      lastSignalValue: typeof record.lastSignalValue === 'number' ? record.lastSignalValue : null,
      snapshot: { ...record.snapshot, lifecycleStatus: record.status },
    }];
  }).slice(0, 48);
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
export type WeeklyCommandDestination = 'briefing' | 'journal' | 'weekly' | 'actions' | 'advance';

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
  category?: 'common' | 'role';
}

export interface OnboardingInput {
  role: Pick<CareerRole, 'branch' | 'tier' | 'scope'>;
  week: number;
  briefingRead: boolean;
  visitedTabs: readonly GameTab[];
  milestones: readonly string[];
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
    ? 'briefing'
    : currentStage === 'briefing'
      ? 'briefing'
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
      destination: 'briefing',
    },
    {
      id: 'briefing',
      label: '02 · 세계 파악',
      title: weeklyUnread ? '새 세계 주보 읽기' : '세계 주보 확인 완료',
      detail: weeklyUnread ? '전선·외교·경제의 지난 7일을 확인하십시오.' : '현재 세계선의 변화를 파악했습니다.',
      state: weeklyUnread ? (resultsPending ? 'waiting' : 'current') : 'complete',
      destination: 'briefing',
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

  if (currentStage === 'review' || currentStage === 'briefing') return {
    steps,
    currentStage,
    primaryDestination,
    primaryLabel: '주간 브리핑 확인',
    readyToAdvance,
    headline: '결산·세계 변화·긴급 결재를 한 번에 파악하십시오.',
    detail: '지난 선택의 결과와 세계의 지난 7일, 지금 처리할 위험을 한 브리핑에서 이어서 검토합니다.',
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
  role,
  week,
  briefingRead,
  visitedTabs,
  milestones,
  factories,
  production,
  research,
  selectedPolicies,
  orders,
}: OnboardingInput): OnboardingStep[] {
  const usedFactories = production.reduce((total, line) => total + line.assigned, 0);
  const activeResearch = research.filter((project) => project.active && !project.complete).length;
  const visited = new Set(visitedTabs);
  const completed = new Set(milestones);
  const junior = role.tier >= 4;
  const shared: OnboardingStep[] = [
    { id: 'briefing', title: '취임 브리핑 읽기', detail: '현재 세계선의 지난 7일과 가장 위험한 변화를 먼저 확인합니다.', tab: 'command', complete: briefingRead, category: 'common' },
    { id: 'authority', title: `TIER ${role.tier} 권한 범위 확인`, detail: `${role.scope}. 잠긴 결정은 직접 집행하지 않고 상신·설득·위임 요청으로 처리합니다.`, tab: 'organization', complete: visited.has('organization'), category: 'common' },
    { id: 'advance', title: '첫 주 지휘 결산 확인', detail: '첫 결정을 반영한 뒤 한 주를 진행해 결과와 원인의 연결을 확인합니다.', tab: 'command', complete: week > 0, category: 'common' },
  ];
  if (role.branch === 'military') return [...shared,
    { id: 'military-review', title: '지휘 가능 부대 확인', detail: '전력·조직력·보급과 현재 명령을 확인해 실제로 움직일 수 있는 편제를 찾습니다.', tab: 'army', complete: visited.has('army'), category: 'role' },
    { id: 'military-action', title: junior ? '작전안 상신 또는 훈련 요청' : '첫 작전·훈련 명령 승인', detail: junior ? '직접 통솔 범위의 부대를 준비하고 상급 지휘부에 목표와 위험을 상신합니다.' : '준비된 사단에 공세 또는 훈련 의도를 부여합니다.', tab: 'army', complete: completed.has('military-action') || orders.length > 0, category: 'role' },
    { id: 'military-support', title: '보급·연구 지원선 확인', detail: '공장과 연구는 직접 의무가 아니라 작전 요구서와 참모 위임으로 연결됩니다.', tab: activeResearch < 2 ? 'research' : usedFactories < factories ? 'industry' : 'organization', complete: visited.has('research') || visited.has('industry'), category: 'role' },
  ];
  if (role.branch === 'politics') return [...shared,
    { id: 'political-review', title: '내각·이해집단 구도 확인', detail: '정책을 집행할 조직, 반대 파벌과 현재 정치적 자원을 먼저 파악합니다.', tab: 'organization', complete: visited.has('organization') || visited.has('governance'), category: 'role' },
    { id: 'political-action', title: junior ? '정책 건의안 상신' : '첫 국가 원칙 결재', detail: junior ? '권한 범위의 정책 근거를 만들고 상급 의사결정자에게 채택을 요청합니다.' : '경제·사회·외교·교리 가운데 첫 운영 원칙을 채택합니다.', tab: 'organization', complete: completed.has('political-action') || selectedPolicies.length > 0, category: 'role' },
    { id: 'political-economy', title: '재정 파급효과 확인', detail: '정책 비용과 경상수지·물가·국민 신뢰의 다음 주 변화를 비교합니다.', tab: 'economy', complete: visited.has('economy') || visited.has('governance'), category: 'role' },
  ];
  return [...shared,
    { id: 'intelligence-review', title: '정보망·노출 위험 확인', detail: '정보 신뢰도, 작전망과 적 방첩 압력을 확인한 뒤 첫 표적을 정합니다.', tab: 'intelligence', complete: visited.has('intelligence'), category: 'role' },
    { id: 'intelligence-action', title: junior ? '정보 수집·공작안 상신' : '첫 정보작전·인재 조사 승인', detail: junior ? '접촉선과 신뢰도를 확보해 상급기관에 실행 가능한 공작안을 제출합니다.' : '요원 또는 후보 한 명의 조사·접촉을 시작합니다.', tab: 'intelligence', complete: completed.has('intelligence-action'), category: 'role' },
    { id: 'intelligence-people', title: '요원·포섭 후보 비교', detail: '능력뿐 아니라 충성도·이중공작 위험·소속 조직과의 마찰을 함께 검토합니다.', tab: 'organization', complete: visited.has('organization'), category: 'role' },
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
  const assignableResearch = research.filter((project) => !project.active && !project.complete).length;
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
      signalValue: Math.max(outbreak.hospitalLoad, outbreak.rEffective * 50),
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
      signalValue: publicHealth.weeklyRisk * 100,
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
      signalValue: Math.abs(economyOperatingBalance),
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
      signalValue: economyInflation,
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
      signalValue: availableSkills,
    });
  }

  if (activeResearch < 2 && assignableResearch > 0) {
    const openSlots = Math.min(2 - activeResearch, assignableResearch);
    actions.push({
      id: 'research-slot',
      priority: activeResearch === 0 ? 'urgent' : 'recommended',
      title: activeResearch === 0 ? '연구가 중단됨' : `연구 슬롯 ${openSlots}개 비어 있음`,
      detail: '동시에 두 개 과제를 진행할 수 있습니다. 비어 있는 슬롯은 매주 손실되는 연구 기회입니다.',
      reason: `활성 연구 ${activeResearch}/2 · 배정 가능 과제 ${assignableResearch}개`,
      ifIgnored: '비어 있는 슬롯의 이번 주 연구 진척은 이후에 복구할 수 없습니다.',
      resolution: '과제 배정 즉시 · 다음 주 연구 진척에 반영',
      instruction: '비어 있는 연구 슬롯을 선택하고, 현재 장비 병목이나 장기 교리에 맞는 과제를 배정하십시오.',
      label: '연구 배정',
      tab: 'research',
      signalValue: openSlots,
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
      signalValue: idleFactories,
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
      signalValue: 4 - selectedPolicies.length,
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
      signalValue: readyDivisions,
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
      signalValue: recoveringDivisions,
    });
  }

  const priorityOrder: Record<UXActionPriority, number> = { urgent: 0, recommended: 1, info: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
