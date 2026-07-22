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
import type { CareerRole, GameState, NationId } from './types';

export type CampaignPhase = 'war' | 'nation';
export type NationBudgetDomain = 'reconstruction' | 'welfare' | 'education' | 'industry' | 'diplomacy' | 'security';
export type NationStrategyId = 'reconstruction-state' | 'social-contract' | 'developmental-state' | 'open-republic' | 'security-republic';
export type NationTransitionReason = 'victory' | 'negotiated';

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

export interface NationWeeklyReport {
  week: number;
  fiscalRevenue: number;
  fiscalExpenditure: number;
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
  dynasty: DynasticPoliticsState;
  electoral: ElectoralPoliticsState;
  reports: NationWeeklyReport[];
}

export interface NationManagementContext {
  week: number;
  game: Pick<GameState, 'factories' | 'stability' | 'warSupport' | 'treasury' | 'politicalPower' | 'enemyPressure'>;
  economy: Pick<EconomyState, 'debt' | 'inflation' | 'publicConfidence'>;
  relationAverage: number;
  completedResearch: number;
  publicHealthPressure: number;
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

export function calculateNationScore(state: Pick<NationManagementState, 'legitimacy' | 'welfare' | 'infrastructure' | 'education' | 'housing' | 'employment' | 'inequality' | 'institutionalCapacity' | 'civilianIndustry' | 'unrest'>) {
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
    + (100 - state.unrest) * 0.04,
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

export function calculateTransitionReadiness(game: Pick<GameState, 'victoryScore' | 'stability' | 'treasury' | 'factories'>, relationAverage: number, economy: Pick<EconomyState, 'inflation'>) {
  const security = game.victoryScore;
  const legitimacy = game.stability;
  const finance = clamp(game.treasury / 12);
  const industry = clamp(game.factories * 2.1);
  const diplomacy = clamp(relationAverage - Math.max(0, economy.inflation - 8));
  const score = Math.round(security * 0.24 + legitimacy * 0.23 + finance * 0.18 + industry * 0.2 + diplomacy * 0.15);
  return {
    score,
    eligible: score >= 45 && game.stability >= 35,
    pillars: { security: Math.round(security), legitimacy: Math.round(legitimacy), finance: Math.round(finance), industry: Math.round(industry), diplomacy: Math.round(diplomacy) },
  };
}

export function createNationManagementState(
  nationId: NationId,
  game: Pick<GameState, 'week' | 'victoryScore' | 'stability' | 'warSupport' | 'factories' | 'intelNetwork'>,
  economy: Pick<EconomyState, 'inflation' | 'publicConfidence'>,
  completedResearch: number,
  transitionReason: NationTransitionReason,
): NationManagementState {
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
    infrastructure: clamp(32 + game.factories * 0.72),
    education: clamp(35 + completedResearch * 4.5),
    housing: clamp(38 + game.stability * 0.08),
    employment: clamp(45 + game.factories * 0.55 - economy.inflation * 0.25),
    inequality: clamp(58 - game.stability * 0.12),
    institutionalCapacity: clamp(38 + game.intelNetwork * 0.26 + economy.publicConfidence * 0.14),
    civilianIndustry: clamp(25 + game.factories * 0.8),
    tradeBalance: transitionReason === 'victory' ? 3 : -4,
    unrest: clamp(52 - game.stability * 0.35 + economy.inflation * 0.4),
    nationalScore: 0,
    mandateScore: 0,
    nextElectionWeek: game.week + 208,
    electionWins: 0,
    dynasty: createDynasticPoliticsState(nationId),
    electoral: createElectoralPoliticsState(nationId, game.week),
    reports: [],
  };
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
  const dynasticEffects = getDynasticWeeklyEffects(state.dynasty);
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
  const fiscalExpenditure = round(
    state.spendingLevel * 0.78
    + Math.min(fiscalRevenue * 0.45, context.economy.debt * 0.0008)
    + context.publicHealthPressure * 0.08
    + Math.max(0, state.unrest - 55) * 0.08
    + dynasticEffects.weeklyCost,
  );
  const fiscalBalance = round(fiscalRevenue - fiscalExpenditure);
  const debtChange = round(fiscalBalance < 0
    ? Math.min(20, Math.abs(fiscalBalance) * 0.5)
    : -Math.min(context.economy.debt * 0.003, fiscalBalance * 0.35));
  const campaignYear = 1942 + Math.floor(context.week / 52);
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

  const next = {
    ...state,
    infrastructure: clamp(state.infrastructure + reconstruction * 0.013 + industry * 0.002 - 0.05),
    housing: clamp(state.housing + reconstruction * 0.009 + welfare * 0.003 - 0.04),
    welfare: clamp(state.welfare + welfare * 0.014 + education * 0.002 - context.publicHealthPressure * 0.003 - Math.max(0, context.economy.inflation - 7) * 0.006),
    education: clamp(state.education + education * 0.014 + context.completedResearch * 0.003),
    civilianIndustry: clamp(state.civilianIndustry + industry * 0.014 + reconstruction * 0.002 - Math.max(0, context.economy.inflation - 10) * 0.005),
    employment: clamp(state.employment + industry * 0.009 + reconstruction * 0.004 - Math.max(0, state.taxBurden - 62) * 0.006),
    institutionalCapacity: clamp(state.institutionalCapacity + education * 0.005 + diplomacy * 0.005 + security * 0.003 - Math.max(0, state.unrest - 60) * 0.005),
    tradeBalance: clamp(state.tradeBalance + diplomacy * 0.025 + industry * 0.018 - state.spendingLevel * 0.004, -100, 100),
    inequality: clamp(state.inequality - welfare * 0.009 - Math.max(0, state.taxBurden - 45) * 0.004 + industry * 0.003),
    unrest: clamp(state.unrest - welfare * 0.006 - security * 0.007 - state.legitimacy * 0.0015 + Math.max(0, context.economy.inflation - 7) * 0.025 + dynasticEffects.unrest),
    legitimacy: state.legitimacy,
    dynasty: {
      ...state.dynasty,
      courtUnity: clamp(state.dynasty.courtUnity + (context.game.stability >= 65 ? 0.08 : -0.04) - Math.max(0, state.dynasty.estateBurden - 50) * 0.003),
      successionSecurity: clamp(state.dynasty.successionSecurity + (state.dynasty.successionLawId === 'unsettled' && getGovernmentForm(state.dynasty.formId).monarchy ? -0.05 : 0.03)),
    },
    electoral: state.electoral,
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
  const projectedEconomy = {
    inflation: clamp(context.economy.inflation + inflationChange, 0, 60),
    publicConfidence: clamp(context.economy.publicConfidence + (fiscalBalance >= 0 ? 0.08 : -0.08) + (next.legitimacy - state.legitimacy) * 0.12),
  };
  next.nationalScore = calculateNationScore(next);
  next.mandateScore = calculateMandateScore(next, projectedEconomy);
  const stabilityTarget = clamp(30 + next.legitimacy * 0.35 + next.mandateScore * 0.25 - next.unrest * 0.3, 25, 85);
  const stabilityChange = round(
    (next.legitimacy - state.legitimacy) * 0.18
      - Math.max(0, next.unrest - 65) * 0.01
      + electoralResult.stabilityDelta
      + (stabilityTarget - context.game.stability) * 0.025,
    2,
  );
  const event = selectNationEvent(next, context);
  const dynasticEvent = selectDynasticEvent(next, context);
  if (electoralResult.playerWonElection) next.electionWins += 1;
  next.nextElectionWeek = Math.min(next.electoral.nextPresidentialWeek, next.electoral.nextParliamentaryWeek);
  const events = [
    ...(event ? [event] : []),
    ...(dynasticEvent ? [dynasticEvent] : []),
    ...electoralResult.events,
  ];
  const report: NationWeeklyReport = {
    week: context.week,
    fiscalRevenue,
    fiscalExpenditure,
    fiscalBalance,
    debtChange,
    inflationChange,
    nationalScore: next.nationalScore,
    mandateScore: next.mandateScore,
    causes: [
      `세입 = 산업기반 ${context.game.factories}개 · 조세부담 ${state.taxBurden}/100 · 안정도 ${context.game.stability}/100 · 무역수지 ${state.tradeBalance.toFixed(1)}`,
      `지출 = 공공지출 ${state.spendingLevel}/100 · 부채상환 £${Math.min(fiscalRevenue * 0.45, context.economy.debt * 0.0008).toFixed(1)}M · 보건·사회불안 비용`,
      `정책효율 = ${nationStrategies.find((candidate) => candidate.id === state.strategyId)?.name ?? state.strategyId} × 부처별 예산배분`,
      `거시균형 = ${campaignYear}년 물가 목표 ${inflationTarget.toFixed(1)}% · 7년 경기순환 ${businessCycle >= 0 ? '확장' : '조정'} 국면`,
      `대외압력 = 외교관계·국가안정·치안예산을 반영한 균형점 ${externalPressureTarget.toFixed(1)}/100`,
      `국가안정 = 정당성·국민위임·사회불안을 반영한 장기 균형점 ${stabilityTarget.toFixed(1)}/100`,
      ...(getGovernmentForm(state.dynasty.formId).monarchy ? [`왕실재정 = ${dynasticEffects.note} · 궁정 결속 ${Math.round(state.dynasty.courtUnity)} · 계승 안정 ${Math.round(state.dynasty.successionSecurity)}`] : []),
      ...(state.electoral.activeCampaign ? [`선거일정 = ${getElectionTypeName(state.electoral.activeCampaign.type)} · ${getCampaignStageName(state.electoral.activeCampaign.stage)} · 투표일까지 ${Math.max(0, state.electoral.activeCampaign.electionWeek - context.week)}주`] : []),
    ],
    effects: [
      `국가 성과 ${state.nationalScore} → ${next.nationalScore}`,
      `국민 위임 ${state.mandateScore} → ${next.mandateScore}`,
      `재정 ${fiscalBalance >= 0 ? '+' : ''}£${fiscalBalance.toFixed(1)}M · 부채 ${debtChange >= 0 ? '+' : ''}£${debtChange.toFixed(1)}M · 물가 ${inflationChange >= 0 ? '+' : ''}${inflationChange.toFixed(2)}%p`,
      `정치 역량 ${politicalPowerChange >= 0 ? '+' : ''}${politicalPowerChange.toFixed(2)} · 대외 압력 ${enemyPressureChange >= 0 ? '+' : ''}${enemyPressureChange.toFixed(2)}`,
      ...(getGovernmentForm(state.dynasty.formId).monarchy ? [`왕실 상태: 왕권 ${Math.round(next.dynasty.crownAuthority)} · 궁정 결속 ${Math.round(next.dynasty.courtUnity)} · 찬탈 위험 보정 +${dynasticEffects.coupRisk.toFixed(1)}`] : []),
    ],
    events,
  };
  next.reports = [report, ...state.reports].slice(0, 208);
  return {
    state: next,
    report,
    gameDelta: {
      week: 1,
      treasury: fiscalBalance,
      stability: stabilityChange,
      politicalPower: politicalPowerChange + electoralResult.politicalPowerDelta,
      enemyPressure: enemyPressureChange,
      commandPoints: 1,
    },
    economyDelta: {
      debt: debtChange,
      inflation: inflationChange,
      publicConfidence: round(projectedEconomy.publicConfidence - context.economy.publicConfidence, 2),
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
    dynasty: normalizeDynasticPoliticsState(candidate.dynasty, fallback.nationId),
    electoral: normalizeElectoralPoliticsState(candidate.electoral, fallback.nationId, fallback.startedWeek),
    reports: Array.isArray(candidate.reports) ? candidate.reports.slice(0, 208) : [],
  };
}
