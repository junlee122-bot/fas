import type { GameState, NationId, TheaterId, WarEvent } from './types';

export type OutbreakPhase = 'cluster' | 'epidemic' | 'pandemic' | 'recovery';
export type PublicHealthPolicyId = 'sentinel' | 'trace-isolate' | 'medical-surge' | 'suppression' | 'open-science';
export type PublicHealthInvestmentId = 'laboratory-network' | 'field-hospitals' | 'protective-stockpile' | 'countermeasure-consortium';

export interface OutbreakTemplate {
  id: string;
  name: string;
  shortName: string;
  family: 'respiratory' | 'vector' | 'waterborne';
  alternateHistory: boolean;
  historicalAnalogue: string;
  historicalYear: string;
  historicalNote: string;
  sourceLabel: string;
  sourceUrl: string;
  baseWeight: number;
  initialCases: number;
  reproductionNumber: number;
  fatalityRate: number;
  severeRate: number;
  mutationRisk: number;
  theaterBias: TheaterId[];
}

export interface PublicHealthPolicy {
  id: PublicHealthPolicyId;
  name: string;
  posture: string;
  description: string;
  tradeoff: string;
  transmissionControl: number;
  fatalityMitigation: number;
  knowledgeGain: number;
  trustDelta: number;
  weeklyTreasury: number;
  weeklyPoliticalPower: number;
}

export interface PublicHealthInvestment {
  id: PublicHealthInvestmentId;
  name: string;
  description: string;
  effectLabel: string;
  treasuryCost: number;
  politicalPowerCost?: number;
  steelCost?: number;
  manpowerCost?: number;
  requiredKnowledge?: number;
}

export interface ActiveOutbreak {
  id: string;
  templateId: string;
  codeName: string;
  origin: string;
  detectedWeek: number;
  phase: OutbreakPhase;
  weeksActive: number;
  estimatedCases: number;
  weeklyCases: number;
  deaths: number;
  rEffective: number;
  hospitalLoad: number;
  knowledge: number;
  peakWeeklyCases: number;
  consecutiveDecline: number;
  variantCount: number;
}

export interface OutbreakHistoryRecord {
  id: string;
  templateId: string;
  codeName: string;
  detectedWeek: number;
  resolvedWeek: number;
  cases: number;
  deaths: number;
  outcome: 'contained' | 'managed' | 'catastrophic';
}

export interface PublicHealthState {
  version: 1;
  seed: number;
  preparedness: number;
  surveillance: number;
  medicalCapacity: number;
  publicTrust: number;
  outbreakPressure: number;
  weeklyRisk: number;
  policyId: PublicHealthPolicyId;
  countermeasureProgress: number;
  activeOutbreak: ActiveOutbreak | null;
  history: OutbreakHistoryRecord[];
  totalDeaths: number;
  completedInvestments: PublicHealthInvestmentId[];
  lastEventWeek: number;
}

export interface PublicHealthContext {
  week: number;
  nationId: NationId;
  theater: TheaterId;
  enemyPressure: number;
  stability: number;
  averageSupply: number;
  scienceBonus?: number;
}

export interface PublicHealthAdvanceResult {
  state: PublicHealthState;
  gameDelta: Partial<Record<keyof GameState, number>>;
  supplyLoss: number;
  organizationLoss: number;
  events: Omit<WarEvent, 'id'>[];
}

export interface OutbreakRiskFactor {
  id: string;
  label: string;
  contribution: number;
  detail: string;
}

export interface PublicHealthPolicyForecast {
  policyId: PublicHealthPolicyId;
  rEffective: number;
  weeklyCases: number;
  weeklyDeaths: number;
  hospitalLoad: number;
  treasuryCost: number;
  politicalPowerCost: number;
}

export interface PublicHealthPolicyRecommendation {
  policyId: PublicHealthPolicyId;
  reason: string;
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));
const round = (value: number, digits = 0) => Number(value.toFixed(digits));

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFor(seed: number, key: string) {
  let value = (seed ^ hashText(key)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 2246822507);
  value = Math.imul(value ^ (value >>> 13), 3266489909);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

export const outbreakTemplates: OutbreakTemplate[] = [
  {
    id: 'wartime-influenza',
    name: '전시 인플루엔자 유행',
    shortName: '인플루엔자',
    family: 'respiratory',
    alternateHistory: false,
    historicalAnalogue: '20세기 전시·대유행 인플루엔자',
    historicalYear: '1918–현재',
    historicalNote: '병영 밀집, 수송망, 영양 저하가 호흡기 감염 확산을 증폭시키는 역사적 양상을 바탕으로 합니다.',
    sourceLabel: 'WHO PRET 호흡기 병원체 대비 모듈',
    sourceUrl: 'https://www.who.int/publications/i/item/9789240084674',
    baseWeight: 30,
    initialCases: 720,
    reproductionNumber: 1.65,
    fatalityRate: 0.012,
    severeRate: 0.045,
    mutationRisk: 0.018,
    theaterBias: ['europe', 'asia'],
  },
  {
    id: 'epidemic-typhus',
    name: '발진티푸스 비상',
    shortName: '발진티푸스',
    family: 'vector',
    alternateHistory: false,
    historicalAnalogue: '전시 난민·수용소의 이 매개 발진티푸스',
    historicalYear: '1939–1945',
    historicalNote: '피난, 위생 붕괴와 과밀 수용 환경에서 실제로 커진 전시 감염 위험을 반영합니다.',
    sourceLabel: 'WHO 감염병 대비 체크리스트',
    sourceUrl: 'https://www.who.int/publications/i/item/9789240084513',
    baseWeight: 25,
    initialCases: 280,
    reproductionNumber: 1.38,
    fatalityRate: 0.075,
    severeRate: 0.14,
    mutationRisk: 0.002,
    theaterBias: ['europe'],
  },
  {
    id: 'wartime-cholera',
    name: '콜레라 수인성 유행',
    shortName: '콜레라',
    family: 'waterborne',
    alternateHistory: false,
    historicalAnalogue: '전쟁·피난 지역의 수인성 콜레라',
    historicalYear: '19–20세기',
    historicalNote: '상수도 파괴, 피난민 이동과 의료 접근 저하가 만드는 현실적 전시 유행 경로를 모델링합니다.',
    sourceLabel: 'WHO 팬데믹·감염병 대비 체크리스트',
    sourceUrl: 'https://www.who.int/publications/i/item/9789240084513',
    baseWeight: 20,
    initialCases: 430,
    reproductionNumber: 1.48,
    fatalityRate: 0.042,
    severeRate: 0.11,
    mutationRisk: 0.004,
    theaterBias: ['asia'],
  },
  {
    id: 'sars-like-coronavirus',
    name: 'SARS형 급성호흡기증후군',
    shortName: 'SARS형 신종병원체',
    family: 'respiratory',
    alternateHistory: true,
    historicalAnalogue: '2003년 SARS-CoV 국제 유행',
    historicalYear: '2003',
    historicalNote: '실제 SARS를 1940년대에 복제하지 않고, 밀접 접촉·병원 내 전파·격리 대응이라는 후대의 양상을 대체역사 병원체에 적용합니다.',
    sourceLabel: 'CDC 2003 SARS 대응 기록',
    sourceUrl: 'https://www.cdc.gov/orr/responses/sars.html',
    baseWeight: 15,
    initialCases: 96,
    reproductionNumber: 2.18,
    fatalityRate: 0.092,
    severeRate: 0.22,
    mutationRisk: 0.008,
    theaterBias: ['asia'],
  },
  {
    id: 'covid-like-coronavirus',
    name: 'COVID형 신종 코로나바이러스',
    shortName: 'COVID형 신종병원체',
    family: 'respiratory',
    alternateHistory: true,
    historicalAnalogue: '2019년 이후 COVID-19 팬데믹',
    historicalYear: '2019–2023',
    historicalNote: '실제 COVID-19의 조기 집단감염, 무증상 확산, 변이와 국제 공조 양상을 1940년대 기술·물류 제약 아래의 가상 병원체로 재구성합니다.',
    sourceLabel: 'WHO COVID-19 대응 연표',
    sourceUrl: 'https://www.who.int/news/item/29-06-2020-covidtimeline',
    baseWeight: 10,
    initialCases: 640,
    reproductionNumber: 2.72,
    fatalityRate: 0.018,
    severeRate: 0.078,
    mutationRisk: 0.032,
    theaterBias: ['europe', 'asia'],
  },
];

export const publicHealthPolicies: PublicHealthPolicy[] = [
  {
    id: 'sentinel',
    name: '감시 유지',
    posture: '최소 개입',
    description: '표본 감시와 주간 보고를 유지하며 경제·군사 활동을 보존합니다.',
    tradeoff: '비용은 낮지만 은밀한 지역사회 전파를 놓칠 수 있습니다.',
    transmissionControl: 0.08,
    fatalityMitigation: 0.04,
    knowledgeGain: 2.4,
    trustDelta: 0.15,
    weeklyTreasury: 6,
    weeklyPoliticalPower: 0,
  },
  {
    id: 'trace-isolate',
    name: '추적·격리',
    posture: '정밀 봉쇄',
    description: '신속 감시, 접촉자 추적, 환자 격리와 병원 감염 통제를 결합합니다.',
    tradeoff: '정보망과 행정력이 필요하지만 사회 전체의 충격은 제한적입니다.',
    transmissionControl: 0.42,
    fatalityMitigation: 0.14,
    knowledgeGain: 4.8,
    trustDelta: 0.05,
    weeklyTreasury: 22,
    weeklyPoliticalPower: 2,
  },
  {
    id: 'medical-surge',
    name: '의료 총동원',
    posture: '치료 역량 우선',
    description: '야전병원, 의료열차, 산소·보호장비를 중증 환자 구호에 우선 배치합니다.',
    tradeoff: '사망률과 병상 과부하는 낮추지만 감염 자체를 멈추는 효과는 작습니다.',
    transmissionControl: 0.18,
    fatalityMitigation: 0.38,
    knowledgeGain: 3.2,
    trustDelta: 0.35,
    weeklyTreasury: 34,
    weeklyPoliticalPower: 1,
  },
  {
    id: 'suppression',
    name: '비상 억제령',
    posture: '최대 억제',
    description: '대규모 집회·수송을 제한하고 위험 지역을 단계적으로 봉쇄합니다.',
    tradeoff: '전파를 가장 크게 낮추지만 재정, 보급과 공공 신뢰에 강한 부담을 줍니다.',
    transmissionControl: 0.82,
    fatalityMitigation: 0.22,
    knowledgeGain: 3.8,
    trustDelta: -0.55,
    weeklyTreasury: 48,
    weeklyPoliticalPower: 4,
  },
  {
    id: 'open-science',
    name: '국제 공개 과학',
    posture: '정보·연구 우선',
    description: '표본, 임상 자료와 연구 성과를 동맹·중립국 네트워크에 공개합니다.',
    tradeoff: '대응책 개발은 빨라지지만 기밀과 국내 정치 자산을 소모합니다.',
    transmissionControl: 0.3,
    fatalityMitigation: 0.2,
    knowledgeGain: 7.2,
    trustDelta: 0.25,
    weeklyTreasury: 30,
    weeklyPoliticalPower: 3,
  },
];

export const publicHealthInvestments: PublicHealthInvestment[] = [
  {
    id: 'laboratory-network',
    name: '국립 감시 실험실망',
    description: '철도·항만·군 병원의 표본을 중앙 역학실로 연결합니다.',
    effectLabel: '감시 +16 · 대비 +5',
    treasuryCost: 160,
    politicalPowerCost: 8,
  },
  {
    id: 'field-hospitals',
    name: '이동식 감염병 병원',
    description: '분리 병동, 의료열차와 숙련 인력을 위험 전구에 배치합니다.',
    effectLabel: '의료 역량 +18 · 신뢰 +3',
    treasuryCost: 190,
    manpowerCost: 18,
  },
  {
    id: 'protective-stockpile',
    name: '보호장비 전략 비축',
    description: '마스크·가운·소독제와 급수 정화 장비를 전선 후방에 비축합니다.',
    effectLabel: '대비 +12 · 의료 역량 +5',
    treasuryCost: 125,
    steelCost: 12,
  },
  {
    id: 'countermeasure-consortium',
    name: '치료제·백신 공동 연구단',
    description: '병원체 지식이 축적되면 군·대학·제약 연구진을 하나의 임무 조직으로 묶습니다.',
    effectLabel: '대응책 진척 +32 · 대비 +6',
    treasuryCost: 280,
    politicalPowerCost: 10,
    requiredKnowledge: 45,
  },
];

const policyById = new Map(publicHealthPolicies.map((policy) => [policy.id, policy]));
const templateById = new Map(outbreakTemplates.map((template) => [template.id, template]));
const investmentById = new Map(publicHealthInvestments.map((investment) => [investment.id, investment]));

export function getPublicHealthPolicy(id: PublicHealthPolicyId) {
  return policyById.get(id) ?? publicHealthPolicies[0];
}

export function getOutbreakTemplate(id: string) {
  return templateById.get(id) ?? outbreakTemplates[0];
}

export function createPublicHealthSeed(nationId: NationId, roleId: string) {
  return (hashText(`${nationId}:${roleId}:public-health`) % 900_000_000) + 1;
}

export function createPublicHealthState(seed: number): PublicHealthState {
  return {
    version: 1,
    seed,
    preparedness: 38,
    surveillance: 32,
    medicalCapacity: 42,
    publicTrust: 66,
    outbreakPressure: 18,
    weeklyRisk: 0.006,
    policyId: 'sentinel',
    countermeasureProgress: 0,
    activeOutbreak: null,
    history: [],
    totalDeaths: 0,
    completedInvestments: [],
    lastEventWeek: -12,
  };
}

function safeNumber(value: unknown, fallback: number, minimum = 0, maximum = 100) {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, minimum, maximum) : fallback;
}

export function normalizePublicHealthState(value: unknown, seed: number): PublicHealthState {
  const fallback = createPublicHealthState(seed);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PublicHealthState>;
  const activeCandidate = candidate.activeOutbreak;
  const activeOutbreak = activeCandidate && typeof activeCandidate === 'object' && templateById.has(activeCandidate.templateId)
    ? {
      ...activeCandidate,
      phase: ['cluster', 'epidemic', 'pandemic', 'recovery'].includes(activeCandidate.phase) ? activeCandidate.phase : 'cluster',
      estimatedCases: safeNumber(activeCandidate.estimatedCases, 1, 0, 1_000_000_000),
      weeklyCases: safeNumber(activeCandidate.weeklyCases, 1, 0, 1_000_000_000),
      deaths: safeNumber(activeCandidate.deaths, 0, 0, 1_000_000_000),
      rEffective: safeNumber(activeCandidate.rEffective, 1, 0.1, 8),
      hospitalLoad: safeNumber(activeCandidate.hospitalLoad, 0, 0, 999),
      knowledge: safeNumber(activeCandidate.knowledge, 0),
      peakWeeklyCases: safeNumber(activeCandidate.peakWeeklyCases, 1, 0, 1_000_000_000),
      consecutiveDecline: safeNumber(activeCandidate.consecutiveDecline, 0, 0, 100),
      variantCount: safeNumber(activeCandidate.variantCount, 0, 0, 100),
      weeksActive: safeNumber(activeCandidate.weeksActive, 0, 0, 999),
      detectedWeek: safeNumber(activeCandidate.detectedWeek, 0, 0, 999),
    } as ActiveOutbreak
    : null;
  const policyId = policyById.has(candidate.policyId as PublicHealthPolicyId) ? candidate.policyId as PublicHealthPolicyId : fallback.policyId;
  const completedInvestments = Array.isArray(candidate.completedInvestments)
    ? candidate.completedInvestments.filter((id): id is PublicHealthInvestmentId => investmentById.has(id as PublicHealthInvestmentId))
    : [];
  return {
    ...fallback,
    seed: safeNumber(candidate.seed, seed, 1, 2_147_483_647),
    preparedness: safeNumber(candidate.preparedness, fallback.preparedness),
    surveillance: safeNumber(candidate.surveillance, fallback.surveillance),
    medicalCapacity: safeNumber(candidate.medicalCapacity, fallback.medicalCapacity),
    publicTrust: safeNumber(candidate.publicTrust, fallback.publicTrust),
    outbreakPressure: safeNumber(candidate.outbreakPressure, fallback.outbreakPressure),
    weeklyRisk: safeNumber(candidate.weeklyRisk, fallback.weeklyRisk, 0, 1),
    policyId,
    countermeasureProgress: safeNumber(candidate.countermeasureProgress, fallback.countermeasureProgress),
    activeOutbreak,
    history: Array.isArray(candidate.history) ? candidate.history.slice(-12) as OutbreakHistoryRecord[] : [],
    totalDeaths: safeNumber(candidate.totalDeaths, fallback.totalDeaths, 0, 1_000_000_000),
    completedInvestments: [...new Set(completedInvestments)],
    lastEventWeek: safeNumber(candidate.lastEventWeek, fallback.lastEventWeek, -999, 999),
  };
}

export function getOutbreakRiskBreakdown(state: PublicHealthState, context: PublicHealthContext): OutbreakRiskFactor[] {
  return [
    { id: 'baseline', label: '기본 감시 위험', contribution: 0.0025, detail: '모든 전구에 존재하는 최소 유행 가능성' },
    { id: 'theater', label: '전구 이동망', contribution: context.theater === 'asia' ? 0.0014 : 0.0008, detail: context.theater === 'asia' ? '항만·도서·대륙 수송망의 복합 노출' : '대도시·항만·철도 집결망 노출' },
    { id: 'war-pressure', label: '전쟁 압력', contribution: Math.max(0, context.enemyPressure - 45) * 0.000055, detail: `현재 적 압력 ${Math.round(context.enemyPressure)}` },
    { id: 'supply', label: '보급·위생 취약', contribution: Math.max(0, 65 - context.averageSupply) * 0.00009, detail: `사단 평균 보급 ${Math.round(context.averageSupply)}%` },
    { id: 'stability', label: '행정 불안정', contribution: Math.max(0, 60 - context.stability) * 0.000055, detail: `국가 안정도 ${Math.round(context.stability)}` },
    { id: 'campaign', label: '장기전 누적', contribution: Math.min(0.0024, context.week * 0.000018), detail: `캠페인 제 ${context.week + 1}주` },
    { id: 'pressure', label: '유행 압력', contribution: state.outbreakPressure * 0.000055, detail: `국내·국경 압력 ${Math.round(state.outbreakPressure)}` },
    { id: 'preparedness', label: '사전 대비', contribution: -state.preparedness * 0.000022, detail: `대비 역량 ${Math.round(state.preparedness)}` },
    { id: 'surveillance', label: '감시·조기 탐지', contribution: -state.surveillance * 0.000018, detail: `감시 역량 ${Math.round(state.surveillance)}` },
  ];
}

export function calculateWeeklyOutbreakRisk(state: PublicHealthState, context: PublicHealthContext) {
  const rawRisk = getOutbreakRiskBreakdown(state, context).reduce((total, factor) => total + factor.contribution, 0);
  return clamp(rawRisk, 0.001, 0.045);
}

export function comparePublicHealthPolicies(state: PublicHealthState, context: PublicHealthContext): PublicHealthPolicyForecast[] {
  if (!state.activeOutbreak) return [];
  return publicHealthPolicies.map((policy) => {
    const result = advancePublicHealthWeek({ ...state, policyId: policy.id }, context);
    const nextOutbreak = result.state.activeOutbreak;
    return {
      policyId: policy.id,
      rEffective: nextOutbreak?.rEffective ?? 0,
      weeklyCases: nextOutbreak?.weeklyCases ?? 0,
      weeklyDeaths: Math.max(0, (nextOutbreak?.deaths ?? state.activeOutbreak?.deaths ?? 0) - (state.activeOutbreak?.deaths ?? 0)),
      hospitalLoad: nextOutbreak?.hospitalLoad ?? 0,
      treasuryCost: policy.weeklyTreasury,
      politicalPowerCost: policy.weeklyPoliticalPower,
    };
  });
}

export function recommendPublicHealthPolicy(state: PublicHealthState, game: GameState): PublicHealthPolicyRecommendation {
  const outbreak = state.activeOutbreak;
  if (!outbreak) return { policyId: 'sentinel', reason: '유행이 없을 때는 감시를 유지하고 영구 역량에 투자하는 편이 효율적입니다.' };
  if (outbreak.rEffective >= 1.55 && state.publicTrust >= 34 && game.treasury >= 110) {
    return { policyId: 'suppression', reason: `R ${outbreak.rEffective.toFixed(2)}의 급격한 확산을 먼저 꺾어야 합니다. 재정·신뢰 비용을 감당할 여력이 있습니다.` };
  }
  if (outbreak.hospitalLoad >= 90) {
    return { policyId: 'medical-surge', reason: `병상 부하 ${Math.round(outbreak.hospitalLoad)}%로 중증 환자 수용력이 우선 병목입니다.` };
  }
  if (outbreak.knowledge < 42 && game.politicalPower >= 6) {
    return { policyId: 'open-science', reason: `병원체 지식 ${Math.round(outbreak.knowledge)}%로 불확실성이 높아 공개 연구의 정보 이득이 큽니다.` };
  }
  if (outbreak.phase === 'cluster' || outbreak.phase === 'recovery') {
    return { policyId: 'trace-isolate', reason: '현재 규모에서는 광범위한 봉쇄보다 추적·격리로 잔존 전파망을 끊는 편이 효율적입니다.' };
  }
  return { policyId: 'medical-surge', reason: '전파 억제와 치료 역량을 균형 있게 보강해 사망과 사회 충격을 낮추는 단계입니다.' };
}

function originFor(context: PublicHealthContext, roll: number) {
  const origins: Record<TheaterId, string[]> = {
    europe: ['군수 항만 검역소', '대도시 방공호', '난민 수용 구역', '전선 후방 야전병원', '철도 집결지'],
    asia: ['남방 항만 검역소', '대륙 철도 집결지', '피난민 임시 정착지', '도서 지역 야전병원', '하천 보급 거점'],
  };
  const candidates = origins[context.theater];
  return candidates[Math.min(candidates.length - 1, Math.floor(roll * candidates.length))];
}

function selectTemplate(context: PublicHealthContext, seed: number) {
  const weighted = outbreakTemplates.map((template) => ({
    template,
    weight: template.baseWeight * (template.theaterBias.includes(context.theater) ? 1.35 : 0.78),
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = randomFor(seed, `template:${context.week}:${context.theater}`) * total;
  for (const entry of weighted) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.template;
  }
  return weighted[weighted.length - 1].template;
}

function phaseFor(outbreak: ActiveOutbreak, nextWeeklyCases: number, consecutiveDecline: number): OutbreakPhase {
  if (consecutiveDecline >= 3 && outbreak.weeksActive >= 4) return 'recovery';
  if (nextWeeklyCases >= 35_000 || outbreak.estimatedCases >= 140_000) return 'pandemic';
  if (nextWeeklyCases >= 2_500 || outbreak.weeksActive >= 3) return 'epidemic';
  return 'cluster';
}

export function formatOutbreakPhase(phase: OutbreakPhase) {
  return { cluster: '초기 집단감염', epidemic: '지역 유행', pandemic: '대유행', recovery: '회복·감시' }[phase];
}

function outcomeFor(outbreak: ActiveOutbreak): OutbreakHistoryRecord['outcome'] {
  if (outbreak.deaths >= 50_000 || outbreak.estimatedCases >= 2_000_000) return 'catastrophic';
  if (outbreak.deaths >= 4_000 || outbreak.estimatedCases >= 180_000) return 'managed';
  return 'contained';
}

export function canFundPublicHealthInvestment(state: PublicHealthState, investmentId: PublicHealthInvestmentId, game: GameState) {
  const investment = investmentById.get(investmentId);
  if (!investment || state.completedInvestments.includes(investmentId)) return false;
  if ((investment.requiredKnowledge ?? 0) > (state.activeOutbreak?.knowledge ?? 0)) return false;
  return game.treasury >= investment.treasuryCost
    && game.politicalPower >= (investment.politicalPowerCost ?? 0)
    && game.steel >= (investment.steelCost ?? 0)
    && game.manpower >= (investment.manpowerCost ?? 0);
}

export function applyPublicHealthInvestment(state: PublicHealthState, investmentId: PublicHealthInvestmentId) {
  if (state.completedInvestments.includes(investmentId)) return state;
  if (!investmentById.has(investmentId)) return state;
  if (investmentId === 'laboratory-network') return { ...state, surveillance: clamp(state.surveillance + 16, 0, 100), preparedness: clamp(state.preparedness + 5, 0, 100), completedInvestments: [...state.completedInvestments, investmentId] };
  if (investmentId === 'field-hospitals') return { ...state, medicalCapacity: clamp(state.medicalCapacity + 18, 0, 100), publicTrust: clamp(state.publicTrust + 3, 0, 100), completedInvestments: [...state.completedInvestments, investmentId] };
  if (investmentId === 'protective-stockpile') return { ...state, preparedness: clamp(state.preparedness + 12, 0, 100), medicalCapacity: clamp(state.medicalCapacity + 5, 0, 100), completedInvestments: [...state.completedInvestments, investmentId] };
  return { ...state, countermeasureProgress: clamp(state.countermeasureProgress + 32, 0, 100), preparedness: clamp(state.preparedness + 6, 0, 100), completedInvestments: [...state.completedInvestments, investmentId] };
}

export function getPublicHealthInvestment(id: PublicHealthInvestmentId) {
  return investmentById.get(id) ?? publicHealthInvestments[0];
}

export function advancePublicHealthWeek(state: PublicHealthState, context: PublicHealthContext): PublicHealthAdvanceResult {
  const events: Omit<WarEvent, 'id'>[] = [];
  const pressureNoise = randomFor(state.seed, `pressure:${context.week}`) * 3 - 1;
  const pressureTarget = 13 + context.enemyPressure * 0.18 + Math.max(0, 60 - context.averageSupply) * 0.28;
  const outbreakPressure = clamp(state.outbreakPressure * 0.8 + pressureTarget * 0.2 + pressureNoise, 5, 100);
  const workingState = { ...state, outbreakPressure };
  const weeklyRisk = calculateWeeklyOutbreakRisk(workingState, context);

  if (!state.activeOutbreak) {
    const canEmerge = context.week >= 4 && context.week - state.lastEventWeek >= 8;
    const emergenceRoll = randomFor(state.seed, `emergence:${context.week}`);
    if (canEmerge && emergenceRoll < weeklyRisk) {
      const template = selectTemplate(context, state.seed);
      const detectionAdvantage = state.surveillance / 180;
      const initialCases = Math.max(24, Math.round(template.initialCases * (1 - detectionAdvantage) * (0.75 + randomFor(state.seed, `cases:${context.week}`) * 0.5)));
      const codeName = `PH-${String(context.week + 1).padStart(3, '0')}`;
      const outbreak: ActiveOutbreak = {
        id: `${template.id}-${context.week}`,
        templateId: template.id,
        codeName,
        origin: originFor(context, randomFor(state.seed, `origin:${context.week}`)),
        detectedWeek: context.week,
        phase: 'cluster',
        weeksActive: 0,
        estimatedCases: initialCases,
        weeklyCases: initialCases,
        deaths: 0,
        rEffective: template.reproductionNumber,
        hospitalLoad: round(initialCases * template.severeRate / Math.max(30, state.medicalCapacity * 18) * 100, 1),
        knowledge: clamp(5 + state.surveillance * 0.12, 0, 100),
        peakWeeklyCases: initialCases,
        consecutiveDecline: 0,
        variantCount: 0,
      };
      events.push({
        week: context.week,
        title: `보건 비상 — ${template.name}`,
        detail: `${outbreak.origin}에서 ${initialCases.toLocaleString('ko-KR')}건의 추정 사례가 포착됐습니다. ${template.alternateHistory ? '후대 유행을 바탕으로 한 대체역사 병원체입니다.' : '전시 사료 기반 위험입니다.'}`,
        tone: 'bad',
      });
      return {
        state: { ...workingState, weeklyRisk, activeOutbreak: outbreak, lastEventWeek: context.week },
        gameDelta: { stability: -1, commandPoints: -2 },
        supplyLoss: 0,
        organizationLoss: 0,
        events,
      };
    }
    return {
      state: {
        ...workingState,
        weeklyRisk,
        preparedness: clamp(state.preparedness + (state.completedInvestments.length > 0 ? 0.08 : 0.02), 0, 100),
        surveillance: clamp(state.surveillance + (state.policyId === 'sentinel' ? 0.04 : 0), 0, 100),
      },
      gameDelta: {},
      supplyLoss: 0,
      organizationLoss: 0,
      events,
    };
  }

  const outbreak = state.activeOutbreak;
  const template = getOutbreakTemplate(outbreak.templateId);
  const policy = getPublicHealthPolicy(state.policyId);
  const weeksActive = outbreak.weeksActive + 1;
  const scienceBonus = context.scienceBonus ?? 0;
  const knowledge = clamp(outbreak.knowledge + policy.knowledgeGain + state.surveillance / 45 + scienceBonus * 0.35, 0, 100);
  const countermeasureProgress = clamp(state.countermeasureProgress + (knowledge >= 55 ? 0.35 + scienceBonus * 0.08 : 0), 0, 100);
  const noise = randomFor(state.seed, `spread:${outbreak.id}:${context.week}`) * 0.24 - 0.12;
  const capacityControl = state.preparedness * 0.0022 + state.surveillance * 0.0016;
  const countermeasureControl = countermeasureProgress * 0.0065;
  const forcedLateDecline = weeksActive > 28 ? (weeksActive - 28) * 0.055 : 0;
  const variantPressure = outbreak.variantCount * 0.075;
  const rEffective = clamp(template.reproductionNumber - policy.transmissionControl - capacityControl - countermeasureControl - forcedLateDecline + variantPressure + noise, 0.42, 4.4);
  const growthFactor = 0.38 + rEffective * 0.57;
  const nextWeeklyCases = Math.max(1, Math.round(outbreak.weeklyCases * growthFactor));
  const consecutiveDecline = nextWeeklyCases < outbreak.weeklyCases * 0.94 ? outbreak.consecutiveDecline + 1 : 0;
  const estimatedCases = outbreak.estimatedCases + nextWeeklyCases;
  const effectiveMedicalCapacity = state.medicalCapacity + scienceBonus * 2;
  const hospitalLoad = round(nextWeeklyCases * template.severeRate / Math.max(80, effectiveMedicalCapacity * 24) * 100, 1);
  const overloadPenalty = hospitalLoad > 100 ? Math.min(0.7, (hospitalLoad - 100) / 210) : 0;
  const fatalityRate = template.fatalityRate * (1 - policy.fatalityMitigation) * (1 - effectiveMedicalCapacity * 0.0032) * (1 + overloadPenalty);
  const weeklyDeaths = Math.max(0, Math.round(nextWeeklyCases * clamp(fatalityRate, 0.001, 0.35)));
  const deaths = outbreak.deaths + weeklyDeaths;
  const variantChance = template.mutationRisk * Math.min(1.8, Math.max(0.35, nextWeeklyCases / 18_000));
  const variantEmerged = randomFor(state.seed, `variant:${outbreak.id}:${context.week}`) < variantChance;
  const variantCount = outbreak.variantCount + (variantEmerged ? 1 : 0);
  const nextOutbreak: ActiveOutbreak = {
    ...outbreak,
    phase: outbreak.phase,
    weeksActive,
    estimatedCases,
    weeklyCases: nextWeeklyCases,
    deaths,
    rEffective,
    hospitalLoad,
    knowledge,
    peakWeeklyCases: Math.max(outbreak.peakWeeklyCases, nextWeeklyCases),
    consecutiveDecline,
    variantCount,
  };
  const nextPhase = phaseFor(nextOutbreak, nextWeeklyCases, consecutiveDecline);
  nextOutbreak.phase = nextPhase;

  if (nextPhase !== outbreak.phase) {
    events.push({
      week: context.week,
      title: nextPhase === 'recovery' ? `${outbreak.codeName} 유행 감소 확인` : `${outbreak.codeName} — ${formatOutbreakPhase(nextPhase)} 전환`,
      detail: `주간 추정 ${nextWeeklyCases.toLocaleString('ko-KR')}건 · 유효 재생산지수 ${round(rEffective, 2)} · 병상 부하 ${Math.round(hospitalLoad)}%`,
      tone: nextPhase === 'recovery' ? 'good' : 'bad',
    });
  }
  if (variantEmerged) {
    events.push({
      week: context.week,
      title: `${outbreak.codeName} 변이 계통 포착`,
      detail: '감시 실험실이 전파력이 다른 계통을 포착했습니다. 공개 과학과 대응책 연구가 변이 충격을 줄입니다.',
      tone: 'bad',
    });
  }

  const resolved = nextPhase === 'recovery' && (nextWeeklyCases <= Math.max(18, nextOutbreak.peakWeeklyCases * 0.055) || weeksActive >= 42);
  const trustDelta = policy.trustDelta - (hospitalLoad > 100 ? 0.7 : 0) + (nextPhase === 'recovery' ? 0.8 : 0);
  const baseNextState: PublicHealthState = {
    ...workingState,
    weeklyRisk,
    countermeasureProgress,
    medicalCapacity: clamp(state.medicalCapacity + (policy.id === 'medical-surge' ? 0.15 : 0), 0, 100),
    publicTrust: clamp(state.publicTrust + trustDelta, 0, 100),
    activeOutbreak: nextOutbreak,
    totalDeaths: state.totalDeaths + weeklyDeaths,
  };

  const severity = nextPhase === 'pandemic' ? 2 : nextPhase === 'epidemic' ? 1 : 0;
  const gameDelta: Partial<Record<keyof GameState, number>> = {
    treasury: -policy.weeklyTreasury,
    politicalPower: -policy.weeklyPoliticalPower,
    manpower: weeklyDeaths > 0 ? -Math.max(1, Math.ceil(weeklyDeaths / 1_000)) : 0,
    stability: severity > 0 && context.week % 2 === 0 ? -severity : 0,
    warSupport: severity === 2 && context.week % 3 === 0 ? -1 : 0,
    commandPoints: severity === 2 ? -1 : 0,
  };

  if (!resolved) {
    return {
      state: baseNextState,
      gameDelta,
      supplyLoss: policy.id === 'suppression' ? severity + 1 : severity,
      organizationLoss: severity === 2 ? 2 : severity,
      events,
    };
  }

  const record: OutbreakHistoryRecord = {
    id: outbreak.id,
    templateId: outbreak.templateId,
    codeName: outbreak.codeName,
    detectedWeek: outbreak.detectedWeek,
    resolvedWeek: context.week,
    cases: estimatedCases,
    deaths,
    outcome: outcomeFor(nextOutbreak),
  };
  events.push({
    week: context.week,
    title: `${outbreak.codeName} 유행 종결 선언`,
    detail: `누적 추정 ${estimatedCases.toLocaleString('ko-KR')}건 · 사망 ${deaths.toLocaleString('ko-KR')}명. 대응 기록은 다음 위기의 대비 역량으로 전환됩니다.`,
    tone: record.outcome === 'catastrophic' ? 'bad' : 'good',
  });
  return {
    state: {
      ...baseNextState,
      activeOutbreak: null,
      history: [...state.history, record].slice(-12),
      preparedness: clamp(state.preparedness + 6, 0, 100),
      outbreakPressure: clamp(outbreakPressure - 14, 5, 100),
      policyId: 'sentinel',
      lastEventWeek: context.week,
    },
    gameDelta,
    supplyLoss: 0,
    organizationLoss: 0,
    events,
  };
}
