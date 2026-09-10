import { getCampaignYearForWeek } from './campaignCalendar';
import type { EconomyState } from './economy';
import {
  advanceElectoralPoliticsWeek,
  createElectoralPoliticsState,
  getCampaignStageName,
  getElectionTypeName,
  normalizeElectoralPoliticsState,
  type ElectoralPoliticsState,
} from './electoralPolitics';
import {
  createDynasticPoliticsState,
  getDynasticWeeklyEffects,
  getGovernmentForm,
  normalizeDynasticPoliticsState,
  type DynasticPoliticsState,
} from './dynasticPolitics';
import {
  advancePersonalLifeWeek,
  createPersonalLifeState,
  normalizePersonalLifeState,
  type PersonalLifeState,
} from './personalLife';
import {
  advanceMediaRelationsWeek,
  createMediaRelationsState,
  normalizeMediaRelationsState,
  type MediaRelationsState,
} from './mediaRelations';
import {
  advancePowerNetworkWeek,
  createPowerNetworkState,
  normalizePowerNetworkState,
  type PowerNetworkState,
} from './powerNetwork';
import {
  advanceStrategicSagaWeek,
  createStrategicSagaState,
  normalizeStrategicSagaState,
  type StrategicSagaState,
} from './strategicSaga';
import {
  advanceSocialistWorldWeek,
  createSocialistWorldState,
  normalizeSocialistWorldState,
  type SocialistWorldState,
} from './socialistWorld';
import {
  advanceJusticeWeek,
  createJusticeSystemState,
  normalizeJusticeSystemState,
  type JusticeSystemState,
} from './justiceSystem';
import {
  advanceConstitutionalJudiciaryWeek,
  createConstitutionalJudiciaryState,
  normalizeConstitutionalJudiciaryState,
  type ConstitutionalJudiciaryState,
} from './constitutionalJudiciary';
import {
  advanceSovereignPowersWeek,
  createSovereignPowersState,
  normalizeSovereignPowersState,
  type SovereignPowersState,
} from './sovereignPowers';
import {
  advanceNationalPlanWeek,
  advanceStrategicOperationWeek,
  createNationalPlanningState,
  createStrategicContinuityState,
  normalizeNationalPlanningState,
  normalizeStrategicContinuityState,
  type NationalPlanMetrics,
  type NationalPlanningState,
  type StrategicContinuityState,
} from './strategicContinuity';
import {
  getNationDevelopmentProfile,
  type NationAgendaChoiceId,
  type NationTransitionOutcome,
} from './nationDevelopment';
import type { CareerRole, GameState, NationId } from './types';

export type CampaignPhase = 'war' | 'nation';
export type NationBudgetDomain = 'reconstruction' | 'welfare' | 'education' | 'industry' | 'diplomacy' | 'security';
export type NationStrategyId = 'reconstruction-state' | 'social-contract' | 'developmental-state' | 'open-republic' | 'security-republic';
export type NationTransitionReason = NationTransitionOutcome;

export interface NationBudgetDefinition {
  id: NationBudgetDomain;
  name: string;
  ministry: string;
  description: string;
  primaryEffect: string;
}

export interface NationStrategyDefinition {
  id: NationStrategyId;
  name: string;
  doctrine: string;
  description: string;
  strengths: string;
  risk: string;
}

export interface NationWeeklyEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface NationStructuralPressure {
  floor: number;
  targetUnrest: number;
  policyRelief: number;
  dominantDriver: string;
  drivers: Array<{ id: string; label: string; value: number; detail: string }>;
}

export interface StructuralPressureLever {
  budgetDomain: NationBudgetDomain;
  action: string;
  expectedEffect: string;
  verificationWeeks: 4 | 13;
}

const structuralPressureLevers: Record<string, StructuralPressureLever> = {
  regional: {
    budgetDomain: 'reconstruction',
    action: '지역 재건 예산과 지방 대표 협상을 확대',
    expectedEffect: '지역 격차와 분리 압력을 함께 낮춤',
    verificationWeeks: 13,
  },
  identity: {
    budgetDomain: 'diplomacy',
    action: '자치·언어·대표권 협약을 국가 의제로 상정',
    expectedEffect: '정체성 갈등과 체제 정당성 손실을 완화',
    verificationWeeks: 13,
  },
  inequality: {
    budgetDomain: 'welfare',
    action: '복지 예산과 누진 재원을 확대',
    expectedEffect: '불평등 압력과 생활비 불만을 낮춤',
    verificationWeeks: 4,
  },
  housing: {
    budgetDomain: 'reconstruction',
    action: '주택·이주 정착 사업을 우선 배정',
    expectedEffect: '주거 부족과 도시 과밀을 완화',
    verificationWeeks: 13,
  },
  generation: {
    budgetDomain: 'education',
    action: '교육·청년 대표·전쟁세대 통합 사업을 확대',
    expectedEffect: '세대 교체기의 급진화와 신뢰 단절을 완화',
    verificationWeeks: 13,
  },
  demography: {
    budgetDomain: 'welfare',
    action: '가족·이민·고령화 지원을 인구 구조에 맞게 재편',
    expectedEffect: '부양 부담과 노동력 충격을 완화',
    verificationWeeks: 13,
  },
  ecology: {
    budgetDomain: 'industry',
    action: '산업 전환과 자원 효율 투자를 병행',
    expectedEffect: '환경 비용과 자원 공급 충격을 낮춤',
    verificationWeeks: 13,
  },
  institutions: {
    budgetDomain: 'education',
    action: '공직 전문화·감사·사법 독립 개혁을 추진',
    expectedEffect: '제도 피로와 불신을 줄이고 정당성을 회복',
    verificationWeeks: 13,
  },
  'cost-of-living': {
    budgetDomain: 'welfare',
    action: '생활비·보건 긴급 지원과 물가 대책을 시행',
    expectedEffect: '단기 생활 충격과 보건 불안을 완화',
    verificationWeeks: 4,
  },
};

export function getStructuralPressureLever(driverId: string): StructuralPressureLever {
  return structuralPressureLevers[driverId] ?? {
    budgetDomain: 'reconstruction',
    action: '관련 부처 예산과 국가 의제를 함께 재검토',
    expectedEffect: '구조 압력의 원인과 정책 완화 효과를 재측정',
    verificationWeeks: 13,
  };
}

export interface ActiveNationAgenda {
  issueId: string;
  openedWeek: number;
  expiresWeek: number;
}

export interface NationAgendaRecord {
  issueId: string;
  choiceId: NationAgendaChoiceId;
  decidedWeek: number;
  outcome: string;
}

export interface NationAgendaState {
  nextIssueWeek: number;
  active: ActiveNationAgenda | null;
  totalDecisions: number;
  history: NationAgendaRecord[];
}

export interface NationWeeklyReport {
  week: number;
  industrySettlement?: { nationId: NationId; week: number; additionalTreasuryCost: number; includedBudgetUsed: number };
  fiscalRevenue: number;
  fiscalExpenditure: number;
  /** Included in fiscalExpenditure, not an additional debit; absent in legacy reports. */
  staffWeeklyCost?: number;
  fiscalBalance: number;
  debtChange: number;
  inflationChange: number;
  nationalScore: number;
  mandateScore: number;
  causes: string[];
  effects: string[];
  events: NationWeeklyEvent[];
}

export interface NationManagementState {
  version: 1;
  nationId: NationId;
  startedWeek: number;
  transitionReason: NationTransitionReason;
  strategyId: NationStrategyId;
  budget: Record<NationBudgetDomain, number>;
  taxBurden: number;
  spendingLevel: number;
  legitimacy: number;
  welfare: number;
  infrastructure: number;
  education: number;
  housing: number;
  employment: number;
  inequality: number;
  institutionalCapacity: number;
  civilianIndustry: number;
  tradeBalance: number;
  unrest: number;
  nationalScore: number;
  mandateScore: number;
  nextElectionWeek: number;
  electionWins: number;
  relativeCompetitiveness: number;
  institutionalAge: number;
  demographicPressure: number;
  ecologicalPressure: number;
  hegemonyCost: number;
  structuralPressure: NationStructuralPressure;
  agenda: NationAgendaState;
  dynasty: DynasticPoliticsState;
  personalLife: PersonalLifeState;
  mediaRelations: MediaRelationsState;
  justice: JusticeSystemState;
  constitutionalJudiciary: ConstitutionalJudiciaryState;
  sovereignPowers: SovereignPowersState;
  powerNetwork: PowerNetworkState;
  strategicSaga: StrategicSagaState;
  socialistWorld: SocialistWorldState;
  electoral: ElectoralPoliticsState;
  strategicContinuity: StrategicContinuityState;
  nationalPlanning: NationalPlanningState;
  reports: NationWeeklyReport[];
}

export interface NationManagementContext {
  week: number;
  game: Pick<GameState, 'factories' | 'stability' | 'warSupport' | 'treasury' | 'politicalPower' | 'enemyPressure' | 'commandPoints' | 'intelNetwork'>;
  economy: Pick<EconomyState, 'debt' | 'inflation' | 'publicConfidence'>;
  relationAverage: number;
  completedResearch: number;
  publicHealthPressure: number;
  /** Current appointed roster payroll. Legacy simulations may omit this value. */
  staffWeeklyCost?: number;
  role?: CareerRole;
}

export interface NationAdvanceResult {
  state: NationManagementState;
  report: NationWeeklyReport;
  gameDelta: Partial<Record<keyof GameState, number>>;
  economyDelta: { debt: number; inflation: number; publicConfidence: number };
}

export const nationBudgetDefinitions: NationBudgetDefinition[] = [
  { id: 'reconstruction', name: '재건·주택', ministry: '국토재건부', description: '파괴된 도시, 철도, 항만과 주택을 복구합니다.', primaryEffect: '인프라·주거·고용' },
  { id: 'welfare', name: '복지·보건', ministry: '사회보장부', description: '식량, 의료, 연금과 실향민 정착을 지원합니다.', primaryEffect: '복지·불평등·불안' },
  { id: 'education', name: '교육·과학', ministry: '교육과학부', description: '보통교육, 대학, 연구기관과 기술인력을 확충합니다.', primaryEffect: '교육·제도·생산성' },
  { id: 'industry', name: '산업·고용', ministry: '상공개발부', description: '군수공장을 민수산업으로 전환하고 일자리를 만듭니다.', primaryEffect: '민수산업·고용·무역' },
  { id: 'diplomacy', name: '무역·외교', ministry: '외무통상부', description: '시장 접근, 원조, 통화협정과 국제기구를 관리합니다.', primaryEffect: '무역·관계·제도' },
  { id: 'security', name: '치안·국방', ministry: '국가안전부', description: '동원해제, 국경, 경찰과 잔존 무장세력을 관리합니다.', primaryEffect: '불안·정당성·안보' },
];

export const nationStrategies: NationStrategyDefinition[] = [
  { id: 'reconstruction-state', name: '국가 재건위원회', doctrine: '균형 재건', description: '주택·기반시설과 제도 복구를 같은 속도로 추진합니다.', strengths: '인프라와 정당성의 안정적 성장', risk: '산업 도약과 복지 확대가 모두 느릴 수 있음' },
  { id: 'social-contract', name: '전후 사회계약', doctrine: '보편 복지', description: '의료·교육·노동권을 전후 국가의 새 정당성으로 삼습니다.', strengths: '복지·교육·불평등 개선', risk: '높은 지출과 물가 압력' },
  { id: 'developmental-state', name: '개발국가 계획', doctrine: '산업 추격', description: '전략산업, 수출금융과 기술관료제를 성장의 엔진으로 삼습니다.', strengths: '산업·고용·무역 성장', risk: '불평등과 주거 부족 누적' },
  { id: 'open-republic', name: '개방 공화국', doctrine: '무역·제도 개방', description: '의회, 국제기구, 자유무역과 민간투자를 우선합니다.', strengths: '외교·무역·제도 신뢰', risk: '취약 산업과 실업 충격' },
  { id: 'security-republic', name: '안보 공화국', doctrine: '질서 우선', description: '전시 조직을 유지해 국경·치안·정치적 급변을 억제합니다.', strengths: '단기 불안 억제와 국가 역량', risk: '정당성·복지·국제 신뢰 훼손' },
];

const initialBudget: Record<NationBudgetDomain, number> = {
  reconstruction: 25,
  welfare: 15,
  education: 15,
  industry: 20,
  diplomacy: 10,
  security: 15,
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

export function createNationAgendaState(nationId: NationId, startedWeek: number): NationAgendaState {
  const profile = getNationDevelopmentProfile(nationId);
  return {
    nextIssueWeek: startedWeek + profile.agendaCadenceWeeks,
    active: null,
    totalDecisions: 0,
    history: [],
  };
}

export function getActiveNationAgenda(state: Pick<NationManagementState, 'nationId' | 'agenda'>) {
  if (!state.agenda.active) return null;
  const definition = getNationDevelopmentProfile(state.nationId).agendas
    .find((candidate) => candidate.id === state.agenda.active?.issueId);
  return definition ? { ...definition, ...state.agenda.active } : null;
}

function advanceNationAgendaState(state: NationManagementState, week: number) {
  if (state.agenda.active || week < state.agenda.nextIssueWeek) return state.agenda;
  const profile = getNationDevelopmentProfile(state.nationId);
  const definition = profile.agendas[state.agenda.history.length % profile.agendas.length];
  return {
    ...state.agenda,
    active: {
      issueId: definition.id,
      openedWeek: week,
      expiresWeek: week + Math.max(8, Math.round(profile.agendaCadenceWeeks * .45)),
    },
  };
}

export function calculateStructuralPressure(
  state: Pick<NationManagementState, 'nationId' | 'inequality' | 'housing' | 'demographicPressure' | 'ecologicalPressure' | 'institutionalAge' | 'welfare' | 'legitimacy' | 'budget'>,
  context: { week: number; inflation: number; publicHealthPressure: number },
): NationStructuralPressure {
  const profile = getNationDevelopmentProfile(state.nationId);
  const structure = profile.structure;
  const elapsedYears = context.week / 52;
  const generationalCycle = (Math.sin((elapsedYears / 18) * Math.PI * 2) + 1) * .5 * structure.generationalVolatility;
  const drivers: NationStructuralPressure['drivers'] = [
    {
      id: 'regional',
      label: '지역·중앙 격차',
      value: structure.regionalPressure,
      detail: `${profile.transition.label}에서 이어진 지역 대표권과 행정력의 불균형`,
    },
    {
      id: 'identity',
      label: '정체성·역사 청산',
      value: structure.identityPressure,
      detail: '전쟁·점령·식민지·망명 경험에서 남은 대표권과 기억정치의 압력',
    },
    {
      id: 'inequality',
      label: '소득·자산 불평등',
      value: Math.max(0, state.inequality - 32) * structure.inequalityWeight,
      detail: `불평등 ${state.inequality.toFixed(1)} · 복지 ${state.welfare.toFixed(1)}`,
    },
    {
      id: 'housing',
      label: '주거·이주 압력',
      value: Math.max(0, 62 - state.housing) * structure.housingWeight,
      detail: `주거 역량 ${state.housing.toFixed(1)} · 귀환·도시화·지역 이동의 누적`,
    },
    {
      id: 'generation',
      label: '세대 갈등',
      value: generationalCycle,
      detail: `${getCampaignYearForWeek(context.week)}년 교육·전쟁기억·권리 기대의 세대 교체`,
    },
    {
      id: 'demography',
      label: '인구구조',
      value: state.demographicPressure * structure.demographicWeight,
      detail: `인구 압력 ${state.demographicPressure.toFixed(1)}`,
    },
    {
      id: 'ecology',
      label: '환경·자원 전환',
      value: state.ecologicalPressure * structure.ecologicalWeight,
      detail: `생태 압력 ${state.ecologicalPressure.toFixed(1)}`,
    },
    {
      id: 'institutions',
      label: '제도 노후·불신',
      value: state.institutionalAge * structure.institutionalWeight,
      detail: `제도 노후 ${state.institutionalAge.toFixed(1)} · 정당성 ${state.legitimacy.toFixed(1)}`,
    },
    {
      id: 'cost-of-living',
      label: '생활비·보건 충격',
      value: Math.max(0, context.inflation - 4) * .34 + context.publicHealthPressure * .035,
      detail: `물가 ${context.inflation.toFixed(1)}% · 보건 압력 ${context.publicHealthPressure.toFixed(1)}`,
    },
  ].map((driver) => ({ ...driver, value: round(driver.value) }));
  const policyRelief = round(
    state.welfare * .045
    + state.legitimacy * .025
    + state.budget.welfare * .06
    + state.budget.reconstruction * .035,
  );
  const targetUnrest = round(clamp(
    structure.baseUnrest
    + drivers.reduce((sum, driver) => sum + driver.value, 0)
    - policyRelief,
    structure.baseUnrest,
    88,
  ));
  const dominantDriver = [...drivers].sort((left, right) => right.value - left.value)[0]?.label ?? '구조 압력';
  return {
    floor: structure.baseUnrest,
    targetUnrest,
    policyRelief,
    dominantDriver,
    drivers: drivers.sort((left, right) => right.value - left.value),
  };
}

export function resolveNationAgendaChoice(
  state: NationManagementState,
  choiceId: NationAgendaChoiceId,
  week: number,
): {
  state: NationManagementState;
  gameDelta: Partial<Record<keyof GameState, number>>;
  economyDelta: { debt: number; inflation: number; publicConfidence: number };
  title: string;
  detail: string;
  effects: string[];
} | null {
  const issue = getActiveNationAgenda(state);
  if (!issue) return null;
  const profile = getNationDevelopmentProfile(state.nationId);
  const choice = issue.options[choiceId];
  const baseAgenda = {
    ...state.agenda,
    active: null,
    nextIssueWeek: week + profile.agendaCadenceWeeks,
    totalDecisions: state.agenda.totalDecisions + 1,
    history: [{
      issueId: issue.id,
      choiceId,
      decidedWeek: week,
      outcome: choice.label,
    }, ...state.agenda.history].slice(0, 80),
  };
  if (choiceId === 'bargain') {
    const next = {
      ...state,
      agenda: baseAgenda,
      legitimacy: clamp(state.legitimacy + 3),
      institutionalCapacity: clamp(state.institutionalCapacity + 2.5),
      inequality: clamp(state.inequality - 1.8),
      unrest: clamp(state.unrest - 1),
      hegemonyCost: clamp(state.hegemonyCost - 1.5),
    };
    return {
      state: next,
      gameDelta: { politicalPower: -10, stability: 1 },
      economyDelta: { debt: 8, inflation: .05, publicConfidence: 2 },
      title: `${issue.title} — ${choice.label}`,
      detail: choice.description,
      effects: ['정당성 +3', '제도역량 +2.5', '불평등 -1.8', '정치력 -10'],
    };
  }
  if (choiceId === 'invest') {
    const next = {
      ...state,
      agenda: baseAgenda,
      infrastructure: clamp(state.infrastructure + 2.5),
      housing: clamp(state.housing + 1.5),
      civilianIndustry: clamp(state.civilianIndustry + 2.8),
      employment: clamp(state.employment + 1.8),
      inequality: clamp(state.inequality + .8),
    };
    return {
      state: next,
      gameDelta: { treasury: -90, politicalPower: -5 },
      economyDelta: { debt: 45, inflation: .18, publicConfidence: 1 },
      title: `${issue.title} — ${choice.label}`,
      detail: choice.description,
      effects: ['민수산업 +2.8', '인프라 +2.5', '고용 +1.8', '국고 -90'],
    };
  }
  const next = {
    ...state,
    agenda: baseAgenda,
    institutionalCapacity: clamp(state.institutionalCapacity + 1.2),
    legitimacy: clamp(state.legitimacy - 2.5),
    unrest: clamp(state.unrest - 2),
    hegemonyCost: clamp(state.hegemonyCost + 1.2),
  };
  return {
    state: next,
    gameDelta: { commandPoints: -8, stability: 2, politicalPower: -4 },
    economyDelta: { debt: 0, inflation: 0, publicConfidence: -1.5 },
    title: `${issue.title} — ${choice.label}`,
    detail: choice.description,
    effects: ['단기 안정 +2', '사회불안 -2', '정당성 -2.5', '지휘점수 -8'],
  };
}

export function calculateNationScore(state: Pick<NationManagementState, 'legitimacy' | 'welfare' | 'infrastructure' | 'education' | 'housing' | 'employment' | 'inequality' | 'institutionalCapacity' | 'civilianIndustry' | 'unrest'> & Partial<Pick<NationManagementState, 'nationId' | 'relativeCompetitiveness' | 'institutionalAge' | 'demographicPressure' | 'ecologicalPressure' | 'hegemonyCost'>>) {
  const structure = state.nationId ? getNationDevelopmentProfile(state.nationId).structure : null;
  const structuralBalance =
    -1.5
    + ((state.relativeCompetitiveness ?? 50) - 50) * 0.04
    - (state.institutionalAge ?? 0) * 0.13
    - (state.demographicPressure ?? 0) * 0.08
    - (state.ecologicalPressure ?? 0) * 0.08
    - (state.hegemonyCost ?? 0) * 0.1
    + (structure ? (structure.longTermPotential - 50) * .055 + (structure.resourceBase - 50) * .02 : 0);
  return Math.round(clamp(
    state.legitimacy * 0.16
    + state.welfare * 0.11
    + state.infrastructure * 0.11
    + state.education * 0.1
    + state.housing * 0.08
    + state.employment * 0.12
    + (100 - state.inequality) * 0.09
    + state.institutionalCapacity * 0.1
    + state.civilianIndustry * 0.09
    + (100 - state.unrest) * 0.04
    + structuralBalance,
  ));
}

export function calculateMandateScore(state: Pick<NationManagementState, 'legitimacy' | 'welfare' | 'employment' | 'inequality' | 'unrest'>, economy: Pick<EconomyState, 'inflation' | 'publicConfidence'>) {
  return Math.round(clamp(
    state.legitimacy * 0.28
    + state.welfare * 0.18
    + state.employment * 0.17
    + (100 - state.inequality) * 0.1
    + (100 - state.unrest) * 0.14
    + economy.publicConfidence * 0.13
    - Math.max(0, economy.inflation - 5) * 0.8,
  ));
}

export function calculateTransitionReadiness(
  game: Pick<GameState, 'week' | 'victoryScore' | 'stability' | 'warSupport' | 'treasury' | 'factories' | 'politicalPower' | 'intelNetwork'>,
  relationAverage: number,
  economy: Pick<EconomyState, 'inflation'>,
  nationId: NationId = 'britain',
) {
  const development = getNationDevelopmentProfile(nationId);
  const transition = development.transition;
  const security = game.victoryScore;
  const legitimacy = game.stability;
  const finance = clamp(game.treasury / 12);
  const industry = clamp(game.factories * 2.1);
  const diplomacy = clamp(relationAverage - Math.max(0, economy.inflation - 8));
  const sovereignty = development.status === 'sovereign'
    ? clamp(38 + game.victoryScore * .38 + game.politicalPower * .12)
    : clamp(
      game.victoryScore * .24
      + game.warSupport * .18
      + game.intelNetwork * .25
      + game.politicalPower * .15
      + relationAverage * .18,
    );
  const score = Math.round(security * .18 + legitimacy * .18 + finance * .14 + industry * .15 + diplomacy * .13 + sovereignty * .22);
  const calendarReady = game.week >= transition.earliestWeek || score >= transition.extraordinaryThreshold;
  const blockedReasons = [
    ...(calendarReady ? [] : [`${transition.label}의 최소 준비기간까지 ${transition.earliestWeek - game.week}주`]),
    ...(score >= transition.readinessThreshold ? [] : [`종합 준비도 ${score}/${transition.readinessThreshold}`]),
    ...(game.stability >= transition.stabilityFloor ? [] : [`안정도 ${Math.round(game.stability)}/${transition.stabilityFloor}`]),
    ...(sovereignty >= 42 ? [] : [`주권·대표성 ${Math.round(sovereignty)}/42`]),
  ];
  return {
    score,
    eligible: blockedReasons.length === 0,
    threshold: transition.readinessThreshold,
    stabilityFloor: transition.stabilityFloor,
    earliestWeek: transition.earliestWeek,
    transitionLabel: transition.label,
    transitionDescription: transition.description,
    blockedReasons,
    pillars: {
      security: Math.round(security),
      legitimacy: Math.round(legitimacy),
      finance: Math.round(finance),
      industry: Math.round(industry),
      diplomacy: Math.round(diplomacy),
      sovereignty: Math.round(sovereignty),
    },
  };
}

export function createNationManagementState(
  nationId: NationId,
  game: Pick<GameState, 'week' | 'victoryScore' | 'stability' | 'warSupport' | 'factories' | 'intelNetwork'>,
  economy: Pick<EconomyState, 'inflation' | 'publicConfidence'>,
  completedResearch: number,
  transitionReason: NationTransitionReason,
): NationManagementState {
  const development = getNationDevelopmentProfile(nationId);
  const structure = development.structure;
  const state: NationManagementState = {
    version: 1,
    nationId,
    startedWeek: game.week,
    transitionReason,
    strategyId: 'reconstruction-state',
    budget: { ...initialBudget },
    taxBurden: 48,
    spendingLevel: 58,
    legitimacy: clamp(game.stability * 0.58 + game.warSupport * 0.22 + game.victoryScore * 0.2),
    welfare: clamp(34 + game.stability * 0.12 - economy.inflation * 0.45),
    infrastructure: clamp(32 + game.factories * 0.72 + (structure.reconstructionEfficiency - 1) * 20),
    education: clamp(35 + completedResearch * 4.5),
    housing: clamp(38 + game.stability * 0.08),
    employment: clamp(45 + game.factories * 0.55 - economy.inflation * 0.25),
    inequality: clamp(58 - game.stability * 0.12 + Math.max(0, 58 - structure.administrativeEfficiency) * .08),
    institutionalCapacity: clamp(22 + structure.administrativeEfficiency * .28 + game.intelNetwork * 0.18 + economy.publicConfidence * 0.1),
    civilianIndustry: clamp(16 + game.factories * 0.72 + structure.industrialPotential * .16),
    tradeBalance: transitionReason === 'victory' ? 3 : -4,
    unrest: clamp(Math.max(structure.baseUnrest, 52 - game.stability * 0.35 + economy.inflation * 0.4 + structure.identityPressure * .35)),
    nationalScore: 0,
    mandateScore: 0,
    nextElectionWeek: game.week + 208,
    electionWins: 0,
    relativeCompetitiveness: clamp(18 + structure.industrialPotential * .38 + game.factories * 0.48 + completedResearch * 1.4),
    institutionalAge: 8,
    demographicPressure: 10,
    ecologicalPressure: 6,
    hegemonyCost: 0,
    structuralPressure: {
      floor: structure.baseUnrest,
      targetUnrest: structure.baseUnrest,
      policyRelief: 0,
      dominantDriver: '전환기 구조 압력',
      drivers: [],
    },
    agenda: createNationAgendaState(nationId, game.week),
    dynasty: createDynasticPoliticsState(nationId),
    personalLife: createPersonalLifeState(nationId),
    mediaRelations: createMediaRelationsState(nationId, game.week),
    justice: createJusticeSystemState(nationId, game.week),
    constitutionalJudiciary: createConstitutionalJudiciaryState(nationId),
    sovereignPowers: createSovereignPowersState(nationId),
    powerNetwork: createPowerNetworkState(nationId, game.week, {
      id: `default-${nationId}-leader`,
      nationId,
      title: '국가 지도부',
      branch: 'politics',
      tier: 3,
      archetype: 'cabinet-minister',
      scope: '국가 운영',
      authority: 70,
      expectation: '전시와 전후의 권력 연합을 유지합니다.',
      historicalHolderId: 'institutional-office',
      historicalHolderName: '기존 지도부',
      historicalOffice: '국가 지도부',
      historicalBasis: '저장 호환용 기본 보직',
      coverIdentity: '공적 지도부',
      replacementEffect: '사용자가 권력 연합을 재구성합니다.',
    }, 'reconstruction-state'),
    strategicSaga: createStrategicSagaState({
      week: game.week,
      year: getCampaignYearForWeek(game.week),
      phase: 'war',
      nationId,
      completedResearch,
      publicHealthPressure: 0,
    }),
    socialistWorld: createSocialistWorldState(nationId, game.week),
    electoral: createElectoralPoliticsState(nationId, game.week),
    strategicContinuity: createStrategicContinuityState(),
    nationalPlanning: createNationalPlanningState(),
    reports: [],
  };
  state.structuralPressure = calculateStructuralPressure(state, {
    week: game.week,
    inflation: economy.inflation,
    publicHealthPressure: 0,
  });
  state.unrest = Math.max(state.unrest, state.structuralPressure.floor);
  state.nationalScore = calculateNationScore(state);
  state.mandateScore = calculateMandateScore(state, economy);
  return state;
}

export function rebalanceNationBudget(state: NationManagementState, domain: NationBudgetDomain, delta: -5 | 5): NationManagementState {
  const current = state.budget[domain];
  if ((delta > 0 && current >= 45) || (delta < 0 && current <= 5)) return state;
  const others = nationBudgetDefinitions.map((definition) => definition.id).filter((id) => id !== domain);
  const counterpart = delta > 0
    ? [...others].sort((left, right) => state.budget[right] - state.budget[left] || left.localeCompare(right))[0]
    : [...others].sort((left, right) => state.budget[left] - state.budget[right] || left.localeCompare(right))[0];
  if (!counterpart || (delta > 0 && state.budget[counterpart] <= 5) || (delta < 0 && state.budget[counterpart] >= 45)) return state;
  return {
    ...state,
    budget: {
      ...state.budget,
      [domain]: current + delta,
      [counterpart]: state.budget[counterpart] - delta,
    },
  };
}

function strategyModifiers(strategyId: NationStrategyId) {
  return {
    reconstruction: strategyId === 'reconstruction-state' ? 1.2 : 1,
    welfare: strategyId === 'social-contract' ? 1.35 : strategyId === 'security-republic' ? 0.75 : 1,
    education: strategyId === 'social-contract' || strategyId === 'open-republic' ? 1.2 : 1,
    industry: strategyId === 'developmental-state' ? 1.4 : strategyId === 'open-republic' ? 1.12 : 1,
    diplomacy: strategyId === 'open-republic' ? 1.4 : strategyId === 'security-republic' ? 0.7 : 1,
    security: strategyId === 'security-republic' ? 1.5 : 1,
  };
}

function selectNationEvent(state: NationManagementState, context: NationManagementContext): NationWeeklyEvent | null {
  if ((context.week - state.startedWeek) % 13 !== 0) return null;
  if (state.unrest >= 62 || (state.inequality >= 64 && state.welfare < 48)) return {
    id: `labor-crisis-${context.week}`, title: '전국 노동·배급 협상 결렬', detail: '임금, 배급과 노동시간을 둘러싼 파업이 주요 산업도시로 확산됐습니다.', tone: 'bad',
    cause: `불평등 ${Math.round(state.inequality)}, 복지 ${Math.round(state.welfare)}, 사회불안 ${Math.round(state.unrest)}가 동시에 위험선에 접근했습니다.`, consequence: '다음 분기까지 고용·생산·정당성이 압박받으며 복지 또는 노사협정 투자가 중요해집니다.',
  };
  if (state.housing < 48) return {
    id: `housing-crisis-${context.week}`, title: '귀환병·실향민 주택 부족', detail: '도시 유입 인구가 복구 속도를 앞지르며 임시거처와 임대료 문제가 정치 의제로 부상했습니다.', tone: 'bad',
    cause: `주거 ${Math.round(state.housing)}와 재건 예산 ${state.budget.reconstruction}%가 인구 이동을 감당하지 못했습니다.`, consequence: '주택 투자가 부족하면 복지·고용 개선도 사회불안과 정당성으로 전환되지 않습니다.',
  };
  if (context.economy.inflation >= 12) return {
    id: `currency-crisis-${context.week}`, title: '통화·생필품 가격 불안', detail: '전시 통화량과 재정지출이 식량·연료 가격에 다시 반영되고 있습니다.', tone: 'bad',
    cause: `인플레이션 ${context.economy.inflation.toFixed(1)}%와 지출수준 ${state.spendingLevel}/100의 결합입니다.`, consequence: '증세·지출조정·산업공급 확대 중 하나가 없으면 국민 위임이 계속 하락합니다.',
  };
  if (state.civilianIndustry >= 62 && state.education >= 58) return {
    id: `productivity-boom-${context.week}`, title: '민수 전환 생산성 도약', detail: '군수공장의 정밀가공 능력과 연구 인력이 수송·전기·소비재 산업으로 확산됐습니다.', tone: 'good',
    cause: `민수산업 ${Math.round(state.civilianIndustry)}와 교육 ${Math.round(state.education)}가 동시 임계점을 넘었습니다.`, consequence: '세입·고용·수출 여력이 커져 복지나 재건의 장기 재원을 마련할 수 있습니다.',
  };
  return {
    id: `civic-review-${context.week}`, title: '전후 국가계획 분기 평가', detail: '의회·내각·지방정부가 재건 예산의 성과와 다음 분기 우선순위를 공개 검토했습니다.', tone: 'neutral',
    cause: '13주 단위 국가계획 평가 시점이 도래했습니다.', consequence: '현재 예산 배분이 다음 분기의 국가 성과와 국민 위임을 규정합니다.',
  };
}

function selectDynasticEvent(state: NationManagementState, context: NationManagementContext): NationWeeklyEvent | null {
  const form = getGovernmentForm(state.dynasty.formId);
  if (!form.monarchy || (context.week - state.startedWeek) % 13 !== 0) return null;
  if (state.dynasty.successionSecurity < 36) return {
    id: `succession-crisis-${context.week}`,
    title: '왕위계승 요구권 충돌',
    detail: '확정되지 않은 계승 원칙을 두고 왕실 방계·군 지휘부·유력 작위가 서로 다른 후보를 지지하기 시작했습니다.',
    tone: 'bad',
    cause: `계승 안정 ${Math.round(state.dynasty.successionSecurity)} · 궁정 결속 ${Math.round(state.dynasty.courtUnity)}. 계승법 또는 혼인 동맹이 충분히 정비되지 않았습니다.`,
    consequence: '계승법을 확정하거나 왕실 혼인을 체결하지 않으면 왕위 찬탈·궁정 쿠데타 위험이 다음 주에도 누적됩니다.',
  };
  if (state.dynasty.estateBurden >= 58) return {
    id: `estate-crisis-${context.week}`,
    title: '귀족원과 지방 영지의 특권 요구',
    detail: '대작위 보유자들이 세금 감면·지방 지휘권·세습권 확대를 공동 요구했습니다.',
    tone: 'bad',
    cause: `영지 부담 ${Math.round(state.dynasty.estateBurden)} · 서임 작위 ${state.dynasty.titleGrants.length}건. 왕실이 충성을 얻기 위해 너무 많은 특권을 배분했습니다.`,
    consequence: '작위를 회수하면 즉시 반발이 발생하고, 유지하면 국고 지출과 귀족 주도 쿠데타 위험이 증가합니다.',
  };
  if (state.dynasty.courtUnity >= 68 && state.dynasty.successionSecurity >= 62) return {
    id: `court-settlement-${context.week}`,
    title: '왕실·내각·귀족원 대타협',
    detail: '계승 원칙과 영지 책임을 둘러싼 협약이 정착되며 왕실 의례가 국가 통합의 상징으로 기능했습니다.',
    tone: 'good',
    cause: `궁정 결속 ${Math.round(state.dynasty.courtUnity)} · 계승 안정 ${Math.round(state.dynasty.successionSecurity)}가 함께 안정권에 진입했습니다.`,
    consequence: '정통성과 외교 신뢰가 완만하게 상승하며 왕위 찬탈 세력의 명분이 약해집니다.',
  };
  return null;
}

export function advanceNationManagementWeek(state: NationManagementState, context: NationManagementContext): NationAdvanceResult {
  const development = getNationDevelopmentProfile(state.nationId);
  const structure = development.structure;
  const dynasticEffects = getDynasticWeeklyEffects(state.dynasty);
  const personalLifeEffects = advancePersonalLifeWeek(state.personalLife, {
    week: context.week,
    stability: context.game.stability,
    publicHealthPressure: context.publicHealthPressure,
    roleTier: context.role?.tier ?? 1,
  });
  const mediaEffects = advanceMediaRelationsWeek(state.mediaRelations, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    education: state.education,
    institutionalCapacity: state.institutionalCapacity,
    inflation: context.economy.inflation,
    publicConfidence: context.economy.publicConfidence,
    intelNetwork: context.game.intelNetwork,
    governmentFormId: state.dynasty.formId,
    strategyId: state.strategyId,
    activeElection: Boolean(state.electoral.activeCampaign),
    personalLife: personalLifeEffects.state,
  });
  const justiceEffects = advanceJusticeWeek(state.justice, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    phase: 'nation',
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    intelNetwork: context.game.intelNetwork,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    institutionalCapacity: state.institutionalCapacity,
    mediaFreedom: mediaEffects.state.freedom,
    pressTrust: mediaEffects.state.pressTrust,
    activeElection: Boolean(state.electoral.activeCampaign),
    strategyId: state.strategyId,
  });
  const constitutionalEffects = advanceConstitutionalJudiciaryWeek(state.constitutionalJudiciary, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    legitimacy: state.legitimacy,
    institutionalCapacity: state.institutionalCapacity,
    publicConfidence: context.economy.publicConfidence,
  });
  const sovereignEffects = advanceSovereignPowersWeek(state.sovereignPowers, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    formId: state.dynasty.formId,
    constitution: constitutionalEffects.state,
    dynasty: state.dynasty,
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    publicConfidence: context.economy.publicConfidence,
    institutionalCapacity: state.institutionalCapacity,
    mediaFreedom: mediaEffects.state.freedom,
    justiceIndependence: justiceEffects.state.independence,
  });
  const powerEffects = advancePowerNetworkWeek(state.powerNetwork, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    phase: 'nation',
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    strategyId: state.strategyId,
    budget: state.budget,
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    warSupport: context.game.warSupport,
    enemyPressure: context.game.enemyPressure,
    intelNetwork: context.game.intelNetwork,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    welfare: state.welfare,
    education: state.education,
    employment: state.employment,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    inequality: state.inequality,
    relativeCompetitiveness: state.relativeCompetitiveness,
    relationAverage: context.relationAverage,
    inflation: context.economy.inflation,
    publicConfidence: context.economy.publicConfidence,
    mediaFreedom: mediaEffects.state.freedom,
    pressTrust: mediaEffects.state.pressTrust,
    activeElection: Boolean(state.electoral.activeCampaign),
  });
  const sagaEffects = advanceStrategicSagaWeek(state.strategicSaga, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    phase: 'nation',
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    warSupport: context.game.warSupport,
    enemyPressure: context.game.enemyPressure,
    intelNetwork: context.game.intelNetwork,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    education: state.education,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    relativeCompetitiveness: state.relativeCompetitiveness,
    relationAverage: context.relationAverage,
    publicConfidence: context.economy.publicConfidence,
    inflation: context.economy.inflation,
    completedResearch: context.completedResearch,
    publicHealthPressure: context.publicHealthPressure,
    coalitionSupport: state.powerNetwork.blocs.reduce((sum, bloc) => sum + bloc.support, 0) / Math.max(1, state.powerNetwork.blocs.length),
    promiseReliability: state.powerNetwork.promiseReliability,
  });
  const blocById = new Map(state.powerNetwork.blocs.map((bloc) => [bloc.id, bloc]));
  const socialistEffects = advanceSocialistWorldWeek(state.socialistWorld, {
    week: context.week,
    year: getCampaignYearForWeek(context.week),
    phase: 'nation',
    nationId: state.nationId,
    role: context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    warSupport: context.game.warSupport,
    enemyPressure: context.game.enemyPressure,
    legitimacy: state.legitimacy,
    unrest: state.unrest,
    welfare: state.welfare,
    employment: state.employment,
    inequality: state.inequality,
    education: state.education,
    civilianIndustry: state.civilianIndustry,
    institutionalCapacity: state.institutionalCapacity,
    publicConfidence: context.economy.publicConfidence,
    inflation: context.economy.inflation,
    relationAverage: context.relationAverage,
    laborSupport: blocById.get('labor')?.support ?? 50,
    laborInfluence: blocById.get('labor')?.influence ?? 50,
    civicSupport: blocById.get('civic')?.support ?? 50,
    intelligentsiaSupport: blocById.get('intelligentsia')?.support ?? 50,
    securitySupport: blocById.get('security')?.support ?? 50,
  });
  const strategy = strategyModifiers(state.strategyId);
  const investmentScale = state.spendingLevel / 100;
  const pressure = (domain: NationBudgetDomain) => state.budget[domain] * investmentScale;
  const reconstruction = pressure('reconstruction') * strategy.reconstruction;
  const welfare = pressure('welfare') * strategy.welfare;
  const education = pressure('education') * strategy.education;
  const industry = pressure('industry') * strategy.industry;
  const diplomacy = pressure('diplomacy') * strategy.diplomacy;
  const security = pressure('security') * strategy.security;

  const fiscalRevenue = round(
    context.game.factories * 0.72
    + context.game.stability * 0.12
    + state.taxBurden * 0.44
    + Math.max(-8, state.tradeBalance * 0.12)
    + state.civilianIndustry * 0.08,
  );
  const staffWeeklyCost = typeof context.staffWeeklyCost === 'number'
    && Number.isFinite(context.staffWeeklyCost) && context.staffWeeklyCost >= 0
    ? context.staffWeeklyCost
    : 0;
  const fiscalExpenditure = round(
    state.spendingLevel * 0.78
    + Math.min(fiscalRevenue * 0.45, context.economy.debt * 0.0008)
    + context.publicHealthPressure * 0.08
    + Math.max(0, state.unrest - 55) * 0.08
    + dynasticEffects.weeklyCost
    + personalLifeEffects.weeklyCost
    + staffWeeklyCost,
  );
  const fiscalBalance = round(fiscalRevenue - fiscalExpenditure);
  const debtChange = round(fiscalBalance < 0
    ? Math.min(20, Math.abs(fiscalBalance) * 0.5)
    : -Math.min(context.economy.debt * 0.003, fiscalBalance * 0.35));
  const campaignYear = getCampaignYearForWeek(context.week);
  const inflationTarget = campaignYear < 1955 ? 6 : campaignYear < 1985 ? 4.5 : 3;
  const businessCycle = Math.sin((context.week / (52 * 7)) * Math.PI * 2);
  const policyInflationChange = round(
    state.spendingLevel * 0.0028
    + Math.max(-0.08, fiscalBalance < 0 ? Math.min(0.65, Math.abs(fiscalBalance) * 0.008) : -0.08)
    - industry * 0.005
    - Math.max(0, state.taxBurden - 45) * 0.006,
    2,
  );
  const inflationChange = round(
    policyInflationChange
    - (context.economy.inflation - inflationTarget) * 0.08
    + businessCycle * 0.035,
    2,
  );
  const externalPressureTarget = clamp(
    22
    + businessCycle * 9
    + (100 - context.relationAverage) * 0.16
    + (100 - context.game.stability) * 0.08
    + Math.max(0, 15 - state.budget.security) * 0.6,
    12,
    68,
  );
  const enemyPressureChange = round((externalPressureTarget - context.game.enemyPressure) * 0.08, 2);
  const politicalPowerChange = round(
    1
    - Math.max(0, context.game.politicalPower - 160) / 240
    - Math.max(0, state.unrest - 60) * 0.012,
    2,
  );
  const competitivenessTarget = clamp(
    8
    + structure.industrialPotential * .22
    + structure.resourceBase * .1
    + structure.administrativeEfficiency * .08
    + state.civilianIndustry * 0.32
    + state.education * 0.24
    + state.institutionalCapacity * 0.13
    + context.relationAverage * 0.12
    + Math.min(80, context.completedResearch * 1.4)
    - state.demographicPressure * 0.08
    - state.ecologicalPressure * 0.05,
  );
  const institutionalAgeTarget = clamp(
    5
    + Math.max(0, campaignYear - 1948) * 0.38
    + Math.max(0, 64 - structure.administrativeEfficiency) * .16
    + Math.max(0, state.institutionalCapacity - 72) * 0.28
    - state.education * 0.12
    - diplomacy * 0.16,
    3,
    78,
  );
  const demographicTarget = clamp(
    Math.max(0, campaignYear - 1958) * 0.34
    + development.structure.identityPressure * .35
    + state.inequality * 0.2
    - state.welfare * 0.15
    - state.housing * 0.1,
    4,
    82,
  );
  const ecologicalTarget = clamp(
    Math.max(0, campaignYear - 1968) * 0.4
    + Math.max(0, structure.resourceBase - 50) * .08
    + state.civilianIndustry * 0.28
    - state.education * 0.12
    - state.infrastructure * 0.08,
    3,
    88,
  );
  const hegemonyTarget = clamp(
    Math.max(0, state.nationalScore - 76) * 1.35
    + Math.max(0, 45 - context.game.enemyPressure) * 0.22
    - diplomacy * 0.28
    - state.institutionalCapacity * 0.05,
    0,
    80,
  );
  const structuralPressure = calculateStructuralPressure(state, {
    week: context.week,
    inflation: context.economy.inflation,
    publicHealthPressure: context.publicHealthPressure,
  });
  const agenda = advanceNationAgendaState(state, context.week);

  const next = {
    ...state,
    infrastructure: clamp(state.infrastructure + reconstruction * 0.013 * structure.reconstructionEfficiency + industry * 0.002 - 0.05),
    housing: clamp(state.housing + reconstruction * 0.009 * structure.reconstructionEfficiency + welfare * 0.003 - 0.04),
    welfare: clamp(state.welfare + welfare * 0.014 + education * 0.002 - context.publicHealthPressure * 0.003 - Math.max(0, context.economy.inflation - 7) * 0.006 + socialistEffects.nationDelta.welfare),
    education: clamp(state.education + education * 0.014 + context.completedResearch * 0.003),
    civilianIndustry: clamp(state.civilianIndustry + (industry * 0.014 + reconstruction * 0.002) * (.72 + structure.industrialPotential / 180) - Math.max(0, context.economy.inflation - 10) * 0.005 + socialistEffects.nationDelta.civilianIndustry),
    employment: clamp(state.employment + (industry * 0.009 + reconstruction * 0.004) * (.78 + structure.administrativeEfficiency / 220) - Math.max(0, state.taxBurden - 62) * 0.006 + socialistEffects.nationDelta.employment),
    institutionalCapacity: clamp(state.institutionalCapacity + (education * 0.005 + diplomacy * 0.005 + security * 0.003) * (.7 + structure.administrativeEfficiency / 170) - Math.max(0, state.unrest - 60) * 0.005 + socialistEffects.nationDelta.institutionalCapacity + justiceEffects.institutionalCapacityDelta),
    tradeBalance: clamp(state.tradeBalance + diplomacy * 0.025 + industry * 0.018 + (structure.resourceBase - 50) * .0015 - state.spendingLevel * 0.004, -100, 100),
    inequality: clamp(state.inequality - welfare * 0.009 - Math.max(0, state.taxBurden - 45) * 0.004 + industry * 0.003 + socialistEffects.nationDelta.inequality),
    unrest: clamp(state.unrest + (structuralPressure.targetUnrest - state.unrest) * .018 + dynasticEffects.unrest + personalLifeEffects.unrest + mediaEffects.unrest + powerEffects.unrest + sagaEffects.unrest + socialistEffects.nationDelta.unrest + justiceEffects.unrestDelta + sovereignEffects.impact.unrest),
    legitimacy: clamp(state.legitimacy + sagaEffects.legitimacy),
    relativeCompetitiveness: clamp(state.relativeCompetitiveness + (competitivenessTarget - state.relativeCompetitiveness) * 0.018),
    institutionalAge: clamp(state.institutionalAge + (institutionalAgeTarget - state.institutionalAge) * 0.012),
    demographicPressure: clamp(state.demographicPressure + (demographicTarget - state.demographicPressure) * 0.01),
    ecologicalPressure: clamp(state.ecologicalPressure + (ecologicalTarget - state.ecologicalPressure) * 0.01),
    hegemonyCost: clamp(state.hegemonyCost + (hegemonyTarget - state.hegemonyCost) * 0.016),
    structuralPressure,
    agenda,
    dynasty: {
      ...state.dynasty,
      crownAuthority: clamp(state.dynasty.crownAuthority + sovereignEffects.impact.crownAuthority),
      courtUnity: clamp(state.dynasty.courtUnity + (context.game.stability >= 65 ? 0.08 : -0.04) - Math.max(0, state.dynasty.estateBurden - 50) * 0.003 + sovereignEffects.impact.courtUnity),
      successionSecurity: clamp(state.dynasty.successionSecurity + (state.dynasty.successionLawId === 'unsettled' && getGovernmentForm(state.dynasty.formId).monarchy ? -0.05 : 0.03) + sovereignEffects.impact.successionSecurity),
      estateBurden: clamp(state.dynasty.estateBurden + sovereignEffects.impact.estateBurden),
    },
    personalLife: mediaEffects.personalLife,
    mediaRelations: {
      ...mediaEffects.state,
      freedom: clamp(mediaEffects.state.freedom + sovereignEffects.impact.mediaFreedom),
      pressTrust: clamp(mediaEffects.state.pressTrust + sovereignEffects.impact.pressTrust),
    },
    justice: justiceEffects.state,
    constitutionalJudiciary: {
      ...constitutionalEffects.state,
      courtIndependence: clamp(constitutionalEffects.state.courtIndependence + sovereignEffects.impact.justiceIndependence),
    },
    sovereignPowers: sovereignEffects.state,
    powerNetwork: powerEffects.state,
    strategicSaga: sagaEffects.state,
    socialistWorld: socialistEffects.state,
    electoral: state.electoral,
    strategicContinuity: state.strategicContinuity,
    nationalPlanning: state.nationalPlanning,
    reports: state.reports,
  };
  next.legitimacy = clamp(
    state.legitimacy
    + (next.welfare - state.welfare) * 0.22
    + (next.employment - state.employment) * 0.18
    + (next.institutionalCapacity - state.institutionalCapacity) * 0.18
    - Math.max(0, next.unrest - 50) * 0.004
    - Math.max(0, context.economy.inflation - 8) * 0.008
    + dynasticEffects.legitimacy
    + personalLifeEffects.legitimacy
    + mediaEffects.legitimacy
    + justiceEffects.legitimacyDelta
    + sovereignEffects.impact.legitimacy
    + powerEffects.legitimacy
    + sagaEffects.legitimacy
    + socialistEffects.nationDelta.legitimacy
    + (state.strategyId === 'security-republic' ? -0.025 : 0.015),
  );
  const electoralResult = advanceElectoralPoliticsWeek(state.electoral, {
    week: context.week,
    role: context.role ?? ({ tier: 1, branch: 'politics' } as CareerRole),
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    stability: context.game.stability,
    legitimacy: next.legitimacy,
    mandateScore: state.mandateScore,
    unrest: next.unrest,
    education: next.education,
    institutionalCapacity: next.institutionalCapacity,
    inflation: context.economy.inflation,
    publicConfidence: context.economy.publicConfidence,
  });
  next.electoral = electoralResult.state;
  next.legitimacy = clamp(next.legitimacy + electoralResult.legitimacyDelta);
  next.unrest = clamp(next.unrest + electoralResult.unrestDelta);
  next.structuralPressure = calculateStructuralPressure(next, {
    week: context.week,
    inflation: context.economy.inflation + inflationChange,
    publicHealthPressure: context.publicHealthPressure,
  });
  next.unrest = Math.max(next.structuralPressure.floor, next.unrest);
  const projectedEconomy = {
    inflation: clamp(context.economy.inflation + inflationChange, 0, 60),
    publicConfidence: clamp(context.economy.publicConfidence + (fiscalBalance >= 0 ? 0.08 : -0.08) + (next.legitimacy - state.legitimacy) * 0.12 + sovereignEffects.impact.publicConfidence),
  };
  next.nationalScore = calculateNationScore(next);
  next.mandateScore = calculateMandateScore(next, projectedEconomy);
  const role = context.role ?? ({ tier: 1, branch: 'politics', title: '국가 지도자' } as CareerRole);
  const strategicResult = advanceStrategicOperationWeek(next.strategicContinuity, {
    week: context.week,
    role,
    politicalPower: context.game.politicalPower,
    treasury: context.game.treasury,
    commandPoints: context.game.commandPoints,
    stability: context.game.stability,
    legitimacy: next.legitimacy,
    institutionalCapacity: next.institutionalCapacity,
    securityBudget: next.budget.security,
    diplomacyBudget: next.budget.diplomacy,
    intelNetwork: context.game.intelNetwork,
    enemyPressure: context.game.enemyPressure,
  });
  next.strategicContinuity = strategicResult.state;
  const planMetrics: NationalPlanMetrics = {
    nationalScore: next.nationalScore,
    mandateScore: next.mandateScore,
    legitimacy: next.legitimacy,
    welfare: next.welfare,
    education: next.education,
    civilianIndustry: next.civilianIndustry,
    institutionalCapacity: next.institutionalCapacity,
    inequality: next.inequality,
    unrest: next.unrest,
    relativeCompetitiveness: next.relativeCompetitiveness,
    demographicPressure: next.demographicPressure,
    ecologicalPressure: next.ecologicalPressure,
    hegemonyCost: next.hegemonyCost,
    relationAverage: context.relationAverage,
  };
  const planResult = advanceNationalPlanWeek(next.nationalPlanning, context.week, planMetrics);
  next.nationalPlanning = planResult.state;
  if (planResult.fulfilled) {
    next.legitimacy = clamp(next.legitimacy + 3);
    next.institutionalAge = clamp(next.institutionalAge - 5);
    next.demographicPressure = clamp(next.demographicPressure - 3);
    next.ecologicalPressure = clamp(next.ecologicalPressure - 3);
    next.hegemonyCost = clamp(next.hegemonyCost - 4);
    next.nationalScore = calculateNationScore(next);
    next.mandateScore = calculateMandateScore(next, projectedEconomy);
  }
  const stabilityTarget = clamp(30 + next.legitimacy * 0.35 + next.mandateScore * 0.25 - next.unrest * 0.3, 25, 85);
  const stabilityChange = round(
    (next.legitimacy - state.legitimacy) * 0.18
      - Math.max(0, next.unrest - 65) * 0.01
      + electoralResult.stabilityDelta
      + personalLifeEffects.stability
      + mediaEffects.stability
      + justiceEffects.stabilityDelta
      + sovereignEffects.impact.stability
      + powerEffects.stability
      + (stabilityTarget - context.game.stability) * 0.025,
    2,
  );
  const event = selectNationEvent(next, context);
  const dynasticEvent = selectDynasticEvent(next, context);
  const openedAgenda = !state.agenda.active && next.agenda.active
    ? getActiveNationAgenda(next)
    : null;
  if (electoralResult.playerWonElection) next.electionWins += 1;
  next.nextElectionWeek = Math.min(next.electoral.nextPresidentialWeek, next.electoral.nextParliamentaryWeek);
  const events = [
    ...(event ? [event] : []),
    ...(dynasticEvent ? [dynasticEvent] : []),
    ...(openedAgenda ? [{
      id: `national-agenda-${openedAgenda.id}-${context.week}`,
      title: `국가 고유 의제 개시 · ${openedAgenda.title}`,
      detail: openedAgenda.briefing,
      tone: 'neutral' as const,
      cause: `${development.transition.label} 이후에도 남은 ${openedAgenda.stakes}`,
      consequence: `${Math.max(0, openedAgenda.expiresWeek - context.week)}주 안에 대표협상·집중투자·중앙집행 가운데 하나를 선택해야 합니다.`,
    }] : []),
    ...mediaEffects.events,
    ...justiceEffects.events,
    ...constitutionalEffects.events.map((constitutionalEvent, index) => ({
      id: `constitutional-${context.week}-${index}`,
      ...constitutionalEvent,
      cause: '최고위 보직 진입, 사법 고위직 검증 기한 또는 임기 종료 조건이 충족됐습니다.',
      consequence: '헌법 조항과 사법 인사는 이후 권력형 사건의 독립성·정당성·제도 역량에 계속 반영됩니다.',
    })),
    ...sovereignEffects.events.map((sovereignEvent, index) => ({ id: `sovereign-${context.week}-${index}`, ...sovereignEvent })),
    ...powerEffects.events,
    ...sagaEffects.events,
    ...socialistEffects.events,
    ...electoralResult.events,
    ...(strategicResult.event ? [{
      id: `strategic-${context.week}-${next.strategicContinuity.active?.id ?? next.strategicContinuity.history[0]?.id ?? 'review'}`,
      ...strategicResult.event,
    }] : []),
    ...(planResult.event ? [{
      id: `plan-${context.week}-${next.nationalPlanning.active?.id ?? next.nationalPlanning.history[0]?.id ?? 'review'}`,
      ...planResult.event,
    }] : []),
  ];
  const report: NationWeeklyReport = {
    week: context.week,
    fiscalRevenue,
    fiscalExpenditure,
    staffWeeklyCost,
    fiscalBalance,
    debtChange,
    inflationChange,
    nationalScore: next.nationalScore,
    mandateScore: next.mandateScore,
    causes: [
      `세입 = 산업기반 ${round(context.game.factories)}개 · 조세부담 ${round(state.taxBurden)}/100 · 안정도 ${round(context.game.stability)}/100 · 무역수지 ${state.tradeBalance.toFixed(1)}`,
      `지출 = 공공지출 ${state.spendingLevel}/100 · 부채상환 £${Math.min(fiscalRevenue * 0.45, context.economy.debt * 0.0008).toFixed(1)}M · 보건·사회불안 비용`,
      '참모·전문가 급여 = 현재 재직 명단의 계약 보수는 총지출에 한 번 포함되며 별도로 다시 차감하지 않습니다.',
      `정책효율 = ${nationStrategies.find((candidate) => candidate.id === state.strategyId)?.name ?? state.strategyId} × 부처별 예산배분`,
      `거시균형 = ${campaignYear}년 물가 목표 ${inflationTarget.toFixed(1)}% · 7년 경기순환 ${businessCycle >= 0 ? '확장' : '조정'} 국면`,
      `대외압력 = 외교관계·국가안정·치안예산을 반영한 균형점 ${externalPressureTarget.toFixed(1)}/100`,
      `국가안정 = 정당성·국민위임·사회불안을 반영한 장기 균형점 ${stabilityTarget.toFixed(1)}/100`,
      `구조적 불안 = ${next.structuralPressure.dominantDriver} 중심 목표 ${next.structuralPressure.targetUnrest.toFixed(1)} · 정책 완화 ${next.structuralPressure.policyRelief.toFixed(1)} · 최소 잔존 ${next.structuralPressure.floor}`,
      `후기 경쟁 = 상대경쟁력 ${next.relativeCompetitiveness.toFixed(1)} · 제도노후 ${next.institutionalAge.toFixed(1)} · 인구압력 ${next.demographicPressure.toFixed(1)} · 생태압력 ${next.ecologicalPressure.toFixed(1)} · 패권비용 ${next.hegemonyCost.toFixed(1)}`,
      ...(getGovernmentForm(state.dynasty.formId).monarchy ? [`왕실재정 = ${dynasticEffects.note} · 궁정 결속 ${Math.round(state.dynasty.courtUnity)} · 계승 안정 ${Math.round(state.dynasty.successionSecurity)}`] : []),
      ...(state.personalLife.activeRelationship ? [`개인생활 = ${personalLifeEffects.note} · 주간 가구·경호비 ${personalLifeEffects.weeklyCost.toFixed(2)}M`] : []),
      `언론환경 = ${mediaEffects.note}`,
      `사법·검찰 = ${justiceEffects.note}`,
      `헌정·인사 = ${next.constitutionalJudiciary.enacted?.name ?? (next.constitutionalJudiciary.status === 'drafting' ? '제헌회의 초안 작성 중' : '최고위 제헌권 대기')} · 법원 독립 ${Math.round(next.constitutionalJudiciary.courtIndependence)} · 검찰 자율 ${Math.round(next.constitutionalJudiciary.prosecutorialAutonomy)}`,
      `국가원수·귀족권 = ${sovereignEffects.note}`,
      `권력생태계 = ${powerEffects.note}`,
      ...(next.strategicSaga.active ? [`시대 국면 = ${next.strategicSaga.active.definitionId} · 진척 ${Math.round(next.strategicSaga.active.progress)} · 압력 ${Math.round(next.strategicSaga.active.pressure)} · 후퇴 ${next.strategicSaga.active.setbacks}`] : []),
      `사회체제 = ${next.socialistWorld.currentModelId ?? '혼합질서'} · 계급 압력 ${Math.round(next.socialistWorld.classPressure)} · 노동 조직 ${Math.round(next.socialistWorld.workerOrganization)} · 사회적 소유 ${Math.round(next.socialistWorld.socialOwnership)} · 강제력 ${Math.round(next.socialistWorld.coercion)}`,
      ...(state.electoral.activeCampaign ? [`선거일정 = ${getElectionTypeName(state.electoral.activeCampaign.type)} · ${getCampaignStageName(state.electoral.activeCampaign.stage)} · 투표일까지 ${Math.max(0, state.electoral.activeCampaign.electionWeek - context.week)}주`] : []),
    ],
    effects: [
      `국가 성과 ${state.nationalScore} → ${next.nationalScore}`,
      `국민 위임 ${state.mandateScore} → ${next.mandateScore}`,
      `재정 ${fiscalBalance >= 0 ? '+' : ''}£${fiscalBalance.toFixed(1)}M · 부채 ${debtChange >= 0 ? '+' : ''}£${debtChange.toFixed(1)}M · 물가 ${inflationChange >= 0 ? '+' : ''}${inflationChange.toFixed(2)}%p`,
      `정치 역량 ${politicalPowerChange >= 0 ? '+' : ''}${politicalPowerChange.toFixed(2)} · 대외 압력 ${enemyPressureChange >= 0 ? '+' : ''}${enemyPressureChange.toFixed(2)}`,
      ...(next.agenda.active ? [`국가 의제 ${getActiveNationAgenda(next)?.title ?? next.agenda.active.issueId} · 결론까지 ${Math.max(0, next.agenda.active.expiresWeek - context.week)}주`] : []),
      ...(next.strategicContinuity.active ? [`전략작전 ${next.strategicContinuity.active.progressWeeks}주 진행 · 지도 위임을 다음 주까지 유지합니다.`] : []),
      ...(next.nationalPlanning.active ? [`국가계획 진척 ${next.nationalPlanning.active.progress.toFixed(0)}% · 다음 검증까지 ${Math.max(0, next.nationalPlanning.active.reviewWeek - context.week)}주`] : []),
      ...(getGovernmentForm(state.dynasty.formId).monarchy ? [`왕실 상태: 왕권 ${Math.round(next.dynasty.crownAuthority)} · 궁정 결속 ${Math.round(next.dynasty.courtUnity)} · 찬탈 위험 보정 +${dynasticEffects.coupRisk.toFixed(1)}`] : []),
      ...(next.personalLife.activeRelationship ? [`개인 관계: ${personalLifeEffects.note}`] : []),
      `언론·평판: ${mediaEffects.note}`,
      `수사·재판: ${justiceEffects.note}`,
      `헌정·사법 인사: ${next.constitutionalJudiciary.activeNomination ? `${next.constitutionalJudiciary.activeNomination.stage} 단계 진행` : `현직 ${next.constitutionalJudiciary.appointments.length}명 · 공포 헌법 ${next.constitutionalJudiciary.enacted ? '있음' : '없음'}`}`,
      `권한 행사: 헌정 관례 ${Math.round(next.sovereignPowers.constitutionalConvention)} · 의회 신임 ${Math.round(next.sovereignPowers.parliamentaryConfidence)} · 미검증 ${next.sovereignPowers.history.filter((record) => !record.resolved).length}건`,
      `세력·공약·유산: ${powerEffects.note}`,
      ...(next.strategicSaga.active ? [`전략 서사: ${next.strategicSaga.active.approachId ? `선택한 원칙 ${next.strategicSaga.active.approachId}로 진행 중` : '새 막의 대응 원칙 결재 필요'}`] : []),
      ...(next.socialistWorld.active ? [`사회주의 전환: ${next.socialistWorld.active.stage} · 진척 ${Math.round(next.socialistWorld.active.progress)} · 내부 모순 ${Math.round(next.socialistWorld.active.contradiction)}`] : []),
    ],
    events,
  };
  next.reports = [report, ...state.reports].slice(0, 208);
  return {
    state: next,
    report,
    gameDelta: {
      week: 1,
      treasury: fiscalBalance + powerEffects.treasury + sagaEffects.treasury + socialistEffects.treasury + justiceEffects.treasuryDelta,
      stability: stabilityChange + sagaEffects.stability + socialistEffects.stability,
      politicalPower: politicalPowerChange + powerEffects.politicalPower + sagaEffects.politicalPower + socialistEffects.politicalPower + justiceEffects.politicalPowerDelta + electoralResult.politicalPowerDelta + (strategicResult.gameDelta.politicalPower ?? 0),
      enemyPressure: enemyPressureChange + (strategicResult.gameDelta.enemyPressure ?? 0),
      commandPoints: 1,
      intelNetwork: strategicResult.gameDelta.intelNetwork ?? 0,
      warSupport: strategicResult.gameDelta.warSupport ?? 0,
    },
    economyDelta: {
      debt: debtChange,
      inflation: inflationChange,
      publicConfidence: round(projectedEconomy.publicConfidence - context.economy.publicConfidence + mediaEffects.publicConfidence + powerEffects.publicConfidence + sagaEffects.publicConfidence + socialistEffects.publicConfidence + justiceEffects.publicConfidenceDelta, 2),
    },
  };
}

export function normalizeNationManagementState(value: unknown, fallback: NationManagementState): NationManagementState {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<NationManagementState>;
  if (candidate.version !== 1 || candidate.nationId !== fallback.nationId || !candidate.budget) return fallback;
  const budget = { ...initialBudget, ...candidate.budget };
  if (Math.round(Object.values(budget).reduce((sum, amount) => sum + amount, 0)) !== 100) return fallback;
  return {
    ...fallback,
    ...candidate,
    budget,
    structuralPressure: candidate.structuralPressure ?? fallback.structuralPressure,
    agenda: {
      ...fallback.agenda,
      ...(candidate.agenda ?? {}),
      active: candidate.agenda?.active ?? null,
      totalDecisions: Number.isFinite(candidate.agenda?.totalDecisions)
        ? Math.max(0, Number(candidate.agenda?.totalDecisions))
        : candidate.agenda?.history?.length ?? 0,
      history: Array.isArray(candidate.agenda?.history) ? candidate.agenda.history.slice(0, 80) : [],
    },
    dynasty: normalizeDynasticPoliticsState(candidate.dynasty, fallback.nationId),
    personalLife: normalizePersonalLifeState(candidate.personalLife, fallback.nationId),
    mediaRelations: normalizeMediaRelationsState(candidate.mediaRelations, fallback.nationId, fallback.startedWeek),
    justice: normalizeJusticeSystemState(candidate.justice, fallback.nationId, fallback.startedWeek),
    constitutionalJudiciary: normalizeConstitutionalJudiciaryState(candidate.constitutionalJudiciary, fallback.nationId),
    sovereignPowers: normalizeSovereignPowersState(candidate.sovereignPowers, fallback.nationId),
    powerNetwork: normalizePowerNetworkState(candidate.powerNetwork, fallback.nationId, fallback.startedWeek, {
      id: `restored-${fallback.nationId}-leader`,
      nationId: fallback.nationId,
      title: '국가 지도부',
      branch: 'politics',
      tier: 3,
      archetype: 'cabinet-minister',
      scope: '국가 운영',
      authority: 70,
      expectation: '권력 연합을 유지합니다.',
      historicalHolderId: 'institutional-office',
      historicalHolderName: '기존 지도부',
      historicalOffice: '국가 지도부',
      historicalBasis: '저장 호환용 기본 보직',
      coverIdentity: '공적 지도부',
      replacementEffect: '사용자가 권력 연합을 재구성합니다.',
    }, candidate.strategyId ?? fallback.strategyId),
    strategicSaga: normalizeStrategicSagaState(candidate.strategicSaga, fallback.strategicSaga),
    socialistWorld: normalizeSocialistWorldState(candidate.socialistWorld, fallback.socialistWorld),
    electoral: normalizeElectoralPoliticsState(candidate.electoral, fallback.nationId, fallback.startedWeek),
    strategicContinuity: normalizeStrategicContinuityState(candidate.strategicContinuity),
    nationalPlanning: normalizeNationalPlanningState(candidate.nationalPlanning),
    reports: Array.isArray(candidate.reports) ? candidate.reports.slice(0, 208) : [],
  };
}
