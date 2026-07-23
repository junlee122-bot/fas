import type { CareerBranch, CareerRole, GameState } from './types';

export type StrategicOperationDomain = 'demobilization' | 'deterrence' | 'peacekeeping' | 'proxy-conflict' | 'covert' | 'cyber' | 'space' | 'humanitarian';
export type StrategicOperationOutcome = 'success' | 'mixed' | 'setback';

export interface StrategicOperationDefinition {
  id: string;
  name: string;
  domain: StrategicOperationDomain;
  branch: CareerBranch | 'joint';
  minimumYear: number;
  maximumYear: number | null;
  durationWeeks: number;
  politicalCost: number;
  treasuryCost: number;
  commandCost: number;
  risk: number;
  description: string;
  success: string;
  failure: string;
}

export interface ActiveStrategicOperation {
  id: string;
  startedWeek: number;
  progressWeeks: number;
}

export interface StrategicOperationRecord {
  id: string;
  operationId: string;
  startedWeek: number;
  resolvedWeek: number;
  outcome: StrategicOperationOutcome;
  score: number;
  summary: string;
}

export interface StrategicContinuityState {
  version: 1;
  active: ActiveStrategicOperation | null;
  history: StrategicOperationRecord[];
}

export interface StrategicOperationContext {
  week: number;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  commandPoints: number;
  stability: number;
  legitimacy: number;
  institutionalCapacity: number;
  securityBudget: number;
  diplomacyBudget: number;
  intelNetwork: number;
  enemyPressure: number;
}

export interface StrategicOperationResult {
  state: StrategicContinuityState;
  gameDelta: Partial<Record<keyof GameState, number>>;
  event: {
    title: string;
    detail: string;
    tone: 'good' | 'bad' | 'neutral';
    cause: string;
    consequence: string;
  } | null;
}

export type NationalPlanId = 'secure-transition' | 'social-capability' | 'knowledge-economy' | 'open-prosperity' | 'climate-resilience' | 'plural-state';

export interface NationalPlanDefinition {
  id: NationalPlanId;
  name: string;
  horizonYears: 1 | 5 | 10;
  doctrine: string;
  description: string;
  targets: string[];
  risk: string;
}

export interface ActiveNationalPlan {
  id: NationalPlanId;
  startedWeek: number;
  reviewWeek: number;
  deadlineWeek: number;
  lastReviewWeek: number;
  progress: number;
  baselineScore: number;
}

export interface NationalPlanRecord {
  id: string;
  planId: NationalPlanId;
  startedWeek: number;
  resolvedWeek: number;
  outcome: 'fulfilled' | 'partial';
  progress: number;
}

export interface NationalPlanningState {
  version: 1;
  active: ActiveNationalPlan | null;
  history: NationalPlanRecord[];
}

export interface NationalPlanMetrics {
  nationalScore: number;
  mandateScore: number;
  legitimacy: number;
  welfare: number;
  education: number;
  civilianIndustry: number;
  institutionalCapacity: number;
  inequality: number;
  unrest: number;
  relativeCompetitiveness: number;
  demographicPressure: number;
  ecologicalPressure: number;
  hegemonyCost: number;
  relationAverage: number;
}

export const strategicOperationDefinitions: StrategicOperationDefinition[] = [
  { id: 'demobilization-security', name: '동원해제·국경안정 임무', domain: 'demobilization', branch: 'military', minimumYear: 1945, maximumYear: 1955, durationWeeks: 13, politicalCost: 6, treasuryCost: 36, commandCost: 8, risk: 35, description: '귀환병·무장집단·국경수비를 재편해 전시 군대가 평시 국가를 압도하지 않게 합니다.', success: '군의 충성·국경 안정과 민간 이양 절차가 함께 확립됩니다.', failure: '무장해제 지연과 장교단 반발이 쿠데타 위험을 높입니다.' },
  { id: 'alliance-standardization', name: '동맹군 표준화 계획', domain: 'deterrence', branch: 'military', minimumYear: 1949, maximumYear: 1975, durationWeeks: 18, politicalCost: 8, treasuryCost: 54, commandCost: 12, risk: 42, description: '교리·탄약·통신·지휘절차를 동맹군과 표준화해 연합 억지력을 만듭니다.', success: '동맹 상호운용성과 국경 억지력이 강화됩니다.', failure: '주권·조달권 충돌로 군비와 외교 비용이 동시에 늘어납니다.' },
  { id: 'peacekeeping-command', name: '다국적 평화유지 파견', domain: 'peacekeeping', branch: 'joint', minimumYear: 1956, maximumYear: null, durationWeeks: 16, politicalCost: 8, treasuryCost: 48, commandCost: 10, risk: 38, description: '휴전감시·민간보호·선거지원·공병 임무를 하나의 제한된 교전규칙 아래 파견합니다.', success: '국제 신뢰와 실전 경험을 얻고 분쟁의 확전을 억제합니다.', failure: '임무범위가 흔들리며 사상자와 국내 반발이 누적됩니다.' },
  { id: 'proxy-advisory-mission', name: '지역전 군사고문단', domain: 'proxy-conflict', branch: 'military', minimumYear: 1955, maximumYear: 1995, durationWeeks: 20, politicalCost: 7, treasuryCost: 62, commandCost: 14, risk: 58, description: '현지군 훈련·보급·정보지원으로 직접 참전 없이 지역전의 균형을 바꿉니다.', success: '현지 동맹이 자립하고 영향력과 억지력이 커집니다.', failure: '임무가 확대되고 대리군의 행위가 본국 정통성을 훼손합니다.' },
  { id: 'arms-control-verification', name: '군비통제 현장검증', domain: 'deterrence', branch: 'intelligence', minimumYear: 1963, maximumYear: null, durationWeeks: 14, politicalCost: 9, treasuryCost: 42, commandCost: 6, risk: 32, description: '기지·탄두·미사일·연산체계의 신고와 현장검증을 정보기관이 교차 확인합니다.', success: '기습 위험과 오판을 낮추면서 상대 전력 정보를 축적합니다.', failure: '사찰 거부와 기만 논란이 협정을 무너뜨립니다.' },
  { id: 'covert-liaison-network', name: '비밀 연락망·망명자 포섭', domain: 'covert', branch: 'intelligence', minimumYear: 1947, maximumYear: 1989, durationWeeks: 13, politicalCost: 5, treasuryCost: 34, commandCost: 4, risk: 48, description: '망명자·노동조합·저항조직·외교공관을 통해 비공식 정보·탈출망을 구축합니다.', success: '현지 조기경보와 인재 포섭 통로가 열립니다.', failure: '연락망 노출과 이중공작이 외교 위기를 만듭니다.' },
  { id: 'maritime-chokepoint-patrol', name: '해협·수송로 국제초계', domain: 'deterrence', branch: 'military', minimumYear: 1973, maximumYear: null, durationWeeks: 15, politicalCost: 7, treasuryCost: 58, commandCost: 13, risk: 45, description: '해협·기뢰·해적·봉쇄 위험을 호송과 국제감시로 관리합니다.', success: '연료·무역 흐름과 해양 억지력이 안정됩니다.', failure: '우발 충돌이 수송비와 외교 압력을 키웁니다.' },
  { id: 'counterproliferation-taskforce', name: '확산방지 합동태스크포스', domain: 'covert', branch: 'intelligence', minimumYear: 1970, maximumYear: null, durationWeeks: 17, politicalCost: 9, treasuryCost: 52, commandCost: 7, risk: 55, description: '과학자·금융·운송·조달망을 추적해 핵·화학·생물·미사일 기술 이전을 차단합니다.', success: '위험물질과 기술자의 이동을 억제하고 정보망을 강화합니다.', failure: '비밀작전 폭로가 주권 침해와 보복공작을 부릅니다.' },
  { id: 'humanitarian-airlift', name: '재난·난민 전략수송', domain: 'humanitarian', branch: 'joint', minimumYear: 1948, maximumYear: null, durationWeeks: 10, politicalCost: 5, treasuryCost: 44, commandCost: 8, risk: 28, description: '항공·해상 수송과 야전병원을 투입해 대형 재난·기근·난민 이동을 지원합니다.', success: '민간 피해와 지역 불안을 줄이고 국제 신뢰를 얻습니다.', failure: '수송 병목과 배분 갈등이 국내외 불신을 키웁니다.' },
  { id: 'counterterror-finance', name: '비정규조직 자금추적', domain: 'covert', branch: 'intelligence', minimumYear: 1980, maximumYear: null, durationWeeks: 14, politicalCost: 8, treasuryCost: 40, commandCost: 5, risk: 44, description: '은행·무역·비영리조직·암시장을 연결해 무장조직의 자금과 조달선을 차단합니다.', success: '공격 준비와 조직화 능력을 낮추고 금융정보 협력을 강화합니다.', failure: '과잉 동결과 오판이 권리·외교 신뢰를 훼손합니다.' },
  { id: 'cyber-counterintelligence', name: '국가망 사이버 방첩전', domain: 'cyber', branch: 'intelligence', minimumYear: 1995, maximumYear: null, durationWeeks: 12, politicalCost: 7, treasuryCost: 46, commandCost: 5, risk: 46, description: '기반시설 침투를 추적하고 기만 서버·공급망 감사·동맹 경보를 함께 운용합니다.', success: '정보망·산업망의 복구력과 공격 주체 식별력이 높아집니다.', failure: '귀속 판단 오류와 보복 공격이 디지털 위기를 확전시킵니다.' },
  { id: 'coalition-precision-campaign', name: '제한목표 연합작전', domain: 'proxy-conflict', branch: 'military', minimumYear: 1990, maximumYear: null, durationWeeks: 18, politicalCost: 10, treasuryCost: 76, commandCost: 16, risk: 60, description: '정밀타격·비행금지·해상차단·현지군 지원을 제한된 정치목표에 묶습니다.', success: '작전목표를 달성하고 장기 점령 없이 억지 신호를 남깁니다.', failure: '목표 확대와 민간 피해가 승리를 장기 정치비용으로 바꿉니다.' },
  { id: 'information-integrity-cell', name: '선거·정보공간 방어실', domain: 'cyber', branch: 'intelligence', minimumYear: 2005, maximumYear: null, durationWeeks: 13, politicalCost: 8, treasuryCost: 38, commandCost: 4, risk: 40, description: '허위정보·해킹·불법자금을 추적하되 언론·야당 감시로 변질되지 않도록 독립감사를 둡니다.', success: '선거 신뢰와 정보망 방어가 함께 개선됩니다.', failure: '검열 논란 또는 외부 개입이 양극화를 심화합니다.' },
  { id: 'anti-access-readiness', name: '분산기지·거부전력 훈련', domain: 'deterrence', branch: 'military', minimumYear: 2005, maximumYear: null, durationWeeks: 16, politicalCost: 8, treasuryCost: 64, commandCost: 14, risk: 43, description: '기지 분산·예비 활주로·무인정찰·장거리 방어를 훈련해 선제타격 취약성을 낮춥니다.', success: '초기 충격을 흡수할 회복성과 억지력이 강화됩니다.', failure: '훈련이 공세 준비로 오인되어 군비경쟁이 가속됩니다.' },
  { id: 'ai-command-audit', name: 'AI 지휘체계 적대검증', domain: 'cyber', branch: 'intelligence', minimumYear: 2025, maximumYear: null, durationWeeks: 14, politicalCost: 9, treasuryCost: 48, commandCost: 7, risk: 47, description: '모델 조작·센서기만·자동표적 오류를 레드팀과 독립감사단이 검증합니다.', success: '기계 추천의 신뢰구간과 인간 중지권이 작전절차에 정착됩니다.', failure: '검증 실패 또는 은폐가 지휘 신뢰와 동맹 상호운용성을 훼손합니다.' },
  { id: 'autonomous-deterrence-exercise', name: '무인전력 인간통제 훈련', domain: 'deterrence', branch: 'military', minimumYear: 2025, maximumYear: null, durationWeeks: 15, politicalCost: 8, treasuryCost: 60, commandCost: 15, risk: 49, description: '무인편대·분산센서·전자전을 인간 승인 교전규칙 아래 통합합니다.', success: '병력 위험을 줄이면서 대응속도와 억지 신뢰를 높입니다.', failure: '통제권 상실과 오인 교전이 정치적·군사적 비용을 만듭니다.' },
  { id: 'orbital-resilience-exercise', name: '우주자산 회복훈련', domain: 'space', branch: 'military', minimumYear: 2035, maximumYear: null, durationWeeks: 18, politicalCost: 9, treasuryCost: 72, commandCost: 13, risk: 46, description: '재밍·잔해·위성상실 상황에서 대체 발사와 지상망 복구를 연습합니다.', success: '통신·항법·조기경보의 단일 실패점을 줄입니다.', failure: '우주 군사화 인식과 비용 폭증이 동맹 내부 갈등을 만듭니다.' },
  { id: 'synthetic-identity-defense', name: '합성신원·내부자 방첩', domain: 'covert', branch: 'intelligence', minimumYear: 2035, maximumYear: null, durationWeeks: 13, politicalCost: 8, treasuryCost: 44, commandCost: 5, risk: 45, description: '생성형 위조·신원복제·내부자 조작을 막는 다중검증과 출처추적 체계를 운용합니다.', success: '인사·지휘·선거 절차의 신뢰와 정보망 보안이 개선됩니다.', failure: '과잉 인증과 오탐이 시민권·조직 신뢰를 훼손합니다.' },
];

export const nationalPlanDefinitions: NationalPlanDefinition[] = [
  { id: 'secure-transition', name: '1년 안보·문민통제 계약', horizonYears: 1, doctrine: '위기 회복', description: '군·정보기관·경찰의 임무와 민간 통제를 1년 안에 재정비합니다.', targets: ['사회불안 45 이하', '대외압력 관리', '제도역량 50 이상'], risk: '성과를 서두르면 군·관료 조직의 반발이 커집니다.' },
  { id: 'social-capability', name: '5개년 사회역량 계획', horizonYears: 5, doctrine: '보편 역량', description: '주택·의료·교육·고용의 최소선을 세대 전체의 생산성으로 전환합니다.', targets: ['복지 65', '교육 65', '불평등 45 이하'], risk: '지출과 공급을 맞추지 못하면 물가와 부채가 성과를 상쇄합니다.' },
  { id: 'knowledge-economy', name: '5개년 과학·산업 도약', horizonYears: 5, doctrine: '혁신 추격', description: '연구기관·전략산업·기술인력을 연결해 다음 세대 생산기반을 만듭니다.', targets: ['교육 70', '민수산업 70', '상대경쟁력 65'], risk: '지역·계층 격차와 독점이 정당성을 훼손할 수 있습니다.' },
  { id: 'open-prosperity', name: '5개년 개방번영 협약', horizonYears: 5, doctrine: '무역·동맹', description: '시장접근·통화협력·동맹 분담을 장기 외교·산업 계약으로 묶습니다.', targets: ['외교관계 65', '국민위임 55', '상대경쟁력 60'], risk: '외부 충격과 의존이 국내 산업·주권 논쟁을 키울 수 있습니다.' },
  { id: 'climate-resilience', name: '10개년 국토회복 계획', horizonYears: 10, doctrine: '세대 회복력', description: '주택·전력·수자원·보건·이주를 기후와 재난의 세대 비용에 맞춰 재설계합니다.', targets: ['생태압력 35 이하', '주거·복지 65', '제도역량 70'], risk: '초기 비용이 크고 혜택이 임기 뒤에 나타나 단기 지지를 잃기 쉽습니다.' },
  { id: 'plural-state', name: '10개년 다원국가 헌장', horizonYears: 10, doctrine: '권리·대표', description: '지방·세대·소수집단 대표와 독립감사 기관을 장기 헌정질서로 정착시킵니다.', targets: ['정통성 70', '불안 35 이하', '국민위임 60'], risk: '권력 분산이 초기 정책속도와 중앙 통제력을 낮춥니다.' },
];

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const campaignYear = (week: number) => 1942 + Math.floor(Math.max(0, week) / 52);

export function createStrategicContinuityState(): StrategicContinuityState {
  return { version: 1, active: null, history: [] };
}

export function createNationalPlanningState(): NationalPlanningState {
  return { version: 1, active: null, history: [] };
}

export function normalizeStrategicContinuityState(value: unknown): StrategicContinuityState {
  if (!value || typeof value !== 'object') return createStrategicContinuityState();
  const candidate = value as Partial<StrategicContinuityState>;
  const validIds = new Set(strategicOperationDefinitions.map((definition) => definition.id));
  const active = candidate.active && validIds.has(candidate.active.id)
    ? { id: candidate.active.id, startedWeek: Number(candidate.active.startedWeek) || 0, progressWeeks: Math.max(0, Number(candidate.active.progressWeeks) || 0) }
    : null;
  const history = Array.isArray(candidate.history)
    ? candidate.history.filter((record) => record && validIds.has(record.operationId)).slice(0, 80)
    : [];
  return { version: 1, active, history };
}

export function normalizeNationalPlanningState(value: unknown): NationalPlanningState {
  if (!value || typeof value !== 'object') return createNationalPlanningState();
  const candidate = value as Partial<NationalPlanningState>;
  const validIds = new Set(nationalPlanDefinitions.map((definition) => definition.id));
  const active = candidate.active && validIds.has(candidate.active.id)
    ? { ...candidate.active, progress: clamp(Number(candidate.active.progress) || 0) }
    : null;
  const history = Array.isArray(candidate.history)
    ? candidate.history.filter((record) => record && validIds.has(record.planId)).slice(0, 40)
    : [];
  return { version: 1, active, history };
}

export function getAvailableStrategicOperations(state: StrategicContinuityState, role: CareerRole, year: number) {
  const recentlyResolved = new Set(state.history.filter((record) => year - campaignYear(record.resolvedWeek) <= 2).map((record) => record.operationId));
  return strategicOperationDefinitions.filter((definition) =>
    (definition.branch === 'joint' || definition.branch === role.branch)
    && definition.minimumYear <= year
    && (definition.maximumYear === null || definition.maximumYear >= year)
    && !recentlyResolved.has(definition.id));
}

export function canLaunchStrategicOperation(state: StrategicContinuityState, definition: StrategicOperationDefinition, context: StrategicOperationContext) {
  return !state.active
    && (definition.branch === 'joint' || definition.branch === context.role.branch)
    && definition.minimumYear <= campaignYear(context.week)
    && (definition.maximumYear === null || definition.maximumYear >= campaignYear(context.week))
    && context.politicalPower >= definition.politicalCost
    && context.treasury >= definition.treasuryCost
    && context.commandPoints >= definition.commandCost;
}

export function launchStrategicOperation(state: StrategicContinuityState, operationId: string, context: StrategicOperationContext): StrategicOperationResult | null {
  const definition = strategicOperationDefinitions.find((candidate) => candidate.id === operationId);
  if (!definition || !canLaunchStrategicOperation(state, definition, context)) return null;
  return {
    state: { ...state, active: { id: definition.id, startedWeek: context.week, progressWeeks: 0 } },
    gameDelta: { politicalPower: -definition.politicalCost, treasury: -definition.treasuryCost, commandPoints: -definition.commandCost },
    event: {
      title: `전략작전 개시 — ${definition.name}`,
      detail: `${definition.durationWeeks}주 임무를 승인했습니다. ${definition.description}`,
      tone: 'neutral',
      cause: `${campaignYear(context.week)}년 ${context.role.title} 권한 · 위험도 ${definition.risk}/100`,
      consequence: `${definition.success} 실패 시 ${definition.failure}`,
    },
  };
}

export function advanceStrategicOperationWeek(state: StrategicContinuityState, context: StrategicOperationContext): StrategicOperationResult {
  if (!state.active) return { state, gameDelta: {}, event: null };
  const definition = strategicOperationDefinitions.find((candidate) => candidate.id === state.active?.id);
  if (!definition) return { state: { ...state, active: null }, gameDelta: {}, event: null };
  const progressWeeks = state.active.progressWeeks + 1;
  if (progressWeeks < definition.durationWeeks) {
    const reachedReview = progressWeeks === Math.ceil(definition.durationWeeks / 2);
    return {
      state: { ...state, active: { ...state.active, progressWeeks } },
      gameDelta: {},
      event: reachedReview ? {
        title: `전략작전 중간검토 — ${definition.name}`,
        detail: `${progressWeeks}/${definition.durationWeeks}주가 지났습니다. 임무범위·보급·외교 노출을 재검토했습니다.`,
        tone: 'neutral',
        cause: '작전 기간의 절반에 도달했습니다.',
        consequence: '현재 조직역량과 예산 상태가 최종 성공 판정에 반영됩니다.',
      } : null,
    };
  }
  const branchAbility = context.role.branch === 'military'
    ? context.securityBudget * .6 + context.commandPoints * .18
    : context.role.branch === 'intelligence'
      ? context.intelNetwork * .45 + context.institutionalCapacity * .25
      : context.diplomacyBudget * .65 + context.legitimacy * .18;
  const score = round(clamp(
    28
    + branchAbility
    + context.stability * .16
    + context.legitimacy * .12
    - definition.risk * .45
    - context.enemyPressure * .08,
  ));
  const outcome: StrategicOperationOutcome = score >= 68 ? 'success' : score >= 48 ? 'mixed' : 'setback';
  const summary = outcome === 'success' ? definition.success : outcome === 'mixed' ? `${definition.success} 다만 ${definition.failure}` : definition.failure;
  const record: StrategicOperationRecord = {
    id: `${definition.id}:${state.active.startedWeek}:${context.week}`,
    operationId: definition.id,
    startedWeek: state.active.startedWeek,
    resolvedWeek: context.week,
    outcome,
    score,
    summary,
  };
  const gameDelta = outcome === 'success'
    ? { stability: 2, enemyPressure: -5, intelNetwork: definition.branch === 'intelligence' ? 4 : 1, warSupport: definition.branch === 'military' ? 2 : 0, politicalPower: 3 }
    : outcome === 'mixed'
      ? { enemyPressure: -1, intelNetwork: 1, politicalPower: 1 }
      : { stability: -3, enemyPressure: 5, warSupport: -2, politicalPower: -2 };
  return {
    state: { ...state, active: null, history: [record, ...state.history].slice(0, 80) },
    gameDelta,
    event: {
      title: `전략작전 ${outcome === 'success' ? '성공' : outcome === 'mixed' ? '혼합 결과' : '실패'} — ${definition.name}`,
      detail: summary,
      tone: outcome === 'success' ? 'good' : outcome === 'setback' ? 'bad' : 'neutral',
      cause: `역량점수 ${score} · 임무위험 ${definition.risk} · ${definition.durationWeeks}주 운용`,
      consequence: outcome === 'success' ? '성과가 장기 세계선과 직무 경력에 누적됩니다.' : '후속 작전과 조직·외교 회복 비용이 필요합니다.',
    },
  };
}

export function launchNationalPlan(state: NationalPlanningState, planId: NationalPlanId, week: number, metrics: NationalPlanMetrics): NationalPlanningState | null {
  if (state.active) return null;
  const definition = nationalPlanDefinitions.find((candidate) => candidate.id === planId);
  if (!definition) return null;
  const duration = definition.horizonYears * 52;
  return {
    ...state,
    active: {
      id: definition.id,
      startedWeek: week,
      reviewWeek: week + Math.max(13, Math.round(duration / 2)),
      deadlineWeek: week + duration,
      lastReviewWeek: week,
      progress: 0,
      baselineScore: metrics.nationalScore,
    },
  };
}

function scorePlan(definition: NationalPlanDefinition, metrics: NationalPlanMetrics) {
  if (definition.id === 'secure-transition') return (100 - metrics.unrest) * .35 + metrics.institutionalCapacity * .35 + (100 - metrics.hegemonyCost) * .3;
  if (definition.id === 'social-capability') return metrics.welfare * .3 + metrics.education * .26 + (100 - metrics.inequality) * .24 + (100 - metrics.demographicPressure) * .2;
  if (definition.id === 'knowledge-economy') return metrics.education * .3 + metrics.civilianIndustry * .3 + metrics.relativeCompetitiveness * .4;
  if (definition.id === 'open-prosperity') return metrics.relationAverage * .34 + metrics.mandateScore * .26 + metrics.relativeCompetitiveness * .4;
  if (definition.id === 'climate-resilience') return (100 - metrics.ecologicalPressure) * .4 + metrics.welfare * .2 + metrics.institutionalCapacity * .4;
  return metrics.legitimacy * .35 + (100 - metrics.unrest) * .35 + metrics.mandateScore * .3;
}

export function advanceNationalPlanWeek(state: NationalPlanningState, week: number, metrics: NationalPlanMetrics) {
  if (!state.active) return { state, event: null, fulfilled: false };
  const definition = nationalPlanDefinitions.find((candidate) => candidate.id === state.active?.id);
  if (!definition) return { state: { ...state, active: null }, event: null, fulfilled: false };
  const score = round(clamp(scorePlan(definition, metrics)));
  const elapsedRatio = clamp((week - state.active.startedWeek) / Math.max(1, state.active.deadlineWeek - state.active.startedWeek));
  const progress = round(clamp(score * .72 + elapsedRatio * 28));
  if (week < state.active.deadlineWeek) {
    const reviewDue = week >= state.active.reviewWeek && state.active.lastReviewWeek < state.active.reviewWeek
      || week - state.active.lastReviewWeek >= 52;
    const active = { ...state.active, progress, lastReviewWeek: reviewDue ? week : state.active.lastReviewWeek };
    return {
      state: { ...state, active },
      fulfilled: false,
      event: reviewDue ? {
        title: `국가계획 중간평가 — ${definition.name}`,
        detail: `진척 ${progress}% · ${definition.targets.join(' · ')}`,
        tone: progress >= 65 ? 'good' as const : progress >= 45 ? 'neutral' as const : 'bad' as const,
        cause: `${definition.horizonYears}개년 계획의 정기 검증 시점입니다.`,
        consequence: progress >= 65 ? '현재 정책 조합이 목표에 접근하고 있습니다.' : '예산·제도·외교 조합을 바꾸지 않으면 기한 내 완수가 어렵습니다.',
      } : null,
    };
  }
  const fulfilled = progress >= 68;
  const record: NationalPlanRecord = {
    id: `${definition.id}:${state.active.startedWeek}:${week}`,
    planId: definition.id,
    startedWeek: state.active.startedWeek,
    resolvedWeek: week,
    outcome: fulfilled ? 'fulfilled' : 'partial',
    progress,
  };
  return {
    state: { ...state, active: null, history: [record, ...state.history].slice(0, 40) },
    fulfilled,
    event: {
      title: `국가계획 ${fulfilled ? '달성' : '부분 달성'} — ${definition.name}`,
      detail: `최종 진척 ${progress}% · 기준 국가성과 ${state.active.baselineScore}에서 출발한 ${definition.horizonYears}개년 계획이 종료됐습니다.`,
      tone: fulfilled ? 'good' as const : 'neutral' as const,
      cause: definition.targets.join(' · '),
      consequence: fulfilled ? '구조적 압력 완화와 국민 위임 보너스가 다음 계획의 출발선에 반영됩니다.' : '달성하지 못한 목표는 후속 계획의 부담으로 남습니다.',
    },
  };
}
