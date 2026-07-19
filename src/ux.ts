import { getAvailableSkillPoints } from './development';
import type { PublicHealthState } from './publicHealth';
import type { CommanderDevelopment, Division, GameTab, Order, ProductionLine, ResearchProject } from './types';

export type UXActionPriority = 'urgent' | 'recommended' | 'info';

export interface UXAction {
  id: string;
  priority: UXActionPriority;
  title: string;
  detail: string;
  label: string;
  tab: GameTab;
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
      label: '위기 지휘실',
      tab: 'health',
    });
  } else if (publicHealth && publicHealth.weeklyRisk >= 0.018) {
    actions.push({
      id: 'public-health-readiness',
      priority: 'recommended',
      title: `감염병 주간 위험 ${(publicHealth.weeklyRisk * 100).toFixed(1)}%`,
      detail: '전선 압력과 보급 상황이 발병 위험을 높이고 있습니다. 감시 실험실·의료 역량을 선제 확충할 수 있습니다.',
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
      label: '회복 상태 보기',
      tab: 'organization',
    });
  }

  const priorityOrder: Record<UXActionPriority, number> = { urgent: 0, recommended: 1, info: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
