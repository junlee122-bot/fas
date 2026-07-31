import type { CareerRole, NationId, StaffDepartment } from './types';

export type PowerBlocId = 'armed-forces' | 'civil-service' | 'labor' | 'industry' | 'intelligentsia' | 'regions' | 'security' | 'civic';
export type LeadershipPrincipleId = 'duty' | 'prosperity' | 'solidarity' | 'liberty' | 'sovereignty' | 'truth';
export type LegacyPathId = 'constitutional-order' | 'industrial-miracle' | 'social-commonwealth' | 'strategic-autonomy' | 'knowledge-society' | 'regional-order';
export type RivalActionId = 'private-talk' | 'share-credit' | 'coalition-offer' | 'public-challenge' | 'background-audit';
export type OpportunityChoiceId = 'first' | 'second' | 'third';
export type PowerBudgetDomain = 'reconstruction' | 'welfare' | 'education' | 'industry' | 'diplomacy' | 'security';

export interface PowerBlocDefinition {
  id: PowerBlocId;
  name: string;
  shortName: string;
  identity: string;
  interest: string;
  redLine: string;
  championDepartments: StaffDepartment[];
  principleAffinities: LeadershipPrincipleId[];
}

export interface PowerBlocState {
  id: PowerBlocId;
  influence: number;
  support: number;
  cohesion: number;
  mobilization: number;
  grievance: number;
  trend: number;
  lastReason: string;
}

export interface PowerPromise {
  id: string;
  blocId: PowerBlocId;
  title: string;
  requirement: string;
  acceptedWeek: number;
  deadlineWeek: number;
  progress: number;
  status: 'active' | 'fulfilled' | 'broken';
  reward: string;
  failure: string;
}

export interface PowerPromiseRecord extends PowerPromise {
  resolvedWeek: number;
  outcome: string;
}

export interface PowerRival {
  name: string;
  title: string;
  blocId: PowerBlocId;
  ambition: string;
  pressure: number;
  respect: number;
  leverage: number;
  lastMoveWeek: number;
  actionCooldownUntil: number;
  latestMove: string;
}

export interface LegacyState {
  activePathId: LegacyPathId;
  progress: number;
  highWaterMark: number;
  stage: 0 | 1 | 2 | 3 | 4;
  focusChangedWeek: number;
  milestones: string[];
}

export interface PowerOpportunityChoice {
  id: OpportunityChoiceId;
  label: string;
  description: string;
  forecast: string;
  support: Partial<Record<PowerBlocId, number>>;
  influence?: Partial<Record<PowerBlocId, number>>;
  legitimacy: number;
  unrest: number;
  stability: number;
  publicConfidence: number;
  politicalPower: number;
  treasury: number;
  rivalPressure: number;
}

export interface PowerOpportunity {
  id: string;
  templateId: string;
  openedWeek: number;
  expiresWeek: number;
  title: string;
  briefing: string;
  stakes: string;
  historicalPattern: string;
  choices: [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice];
}

export interface PowerOpportunityRecord {
  id: string;
  title: string;
  choice: string;
  outcome: string;
  resolvedWeek: number;
}

export interface PowerMemory {
  id: string;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface PowerNetworkState {
  version: 1;
  principles: [LeadershipPrincipleId, LeadershipPrincipleId, LeadershipPrincipleId];
  blocs: PowerBlocState[];
  activePromise: PowerPromise | null;
  promiseHistory: PowerPromiseRecord[];
  rival: PowerRival;
  legacy: LegacyState;
  activeOpportunity: PowerOpportunity | null;
  opportunityHistory: PowerOpportunityRecord[];
  memories: PowerMemory[];
  promiseReliability: number;
  nextOpportunityWeek: number;
  lastUpdatedWeek: number;
}

export interface PowerNetworkContext {
  week: number;
  year: number;
  phase: 'war' | 'nation';
  nationId: NationId;
  role: CareerRole;
  strategyId: string;
  budget: Record<PowerBudgetDomain, number>;
  politicalPower: number;
  treasury: number;
  stability: number;
  warSupport: number;
  enemyPressure: number;
  intelNetwork: number;
  legitimacy: number;
  unrest: number;
  welfare: number;
  education: number;
  employment: number;
  civilianIndustry: number;
  institutionalCapacity: number;
  inequality: number;
  relativeCompetitiveness: number;
  relationAverage: number;
  inflation: number;
  publicConfidence: number;
  mediaFreedom: number;
  pressTrust: number;
  activeElection: boolean;
}

export interface PowerNetworkEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface PowerNetworkActionResult {
  state: PowerNetworkState;
  title: string;
  detail: string;
  politicalPowerDelta: number;
  treasuryDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  stabilityDelta: number;
  publicConfidenceDelta: number;
}

export interface PowerNetworkWeeklyEffects {
  state: PowerNetworkState;
  politicalPower: number;
  treasury: number;
  legitimacy: number;
  unrest: number;
  stability: number;
  publicConfidence: number;
  events: PowerNetworkEvent[];
  note: string;
}

export interface LegacyPathDefinition {
  id: LegacyPathId;
  name: string;
  doctrine: string;
  description: string;
  success: string;
  tension: string;
  alignedBlocs: PowerBlocId[];
}

export interface LeadershipPrincipleDefinition {
  id: LeadershipPrincipleId;
  name: string;
  promise: string;
}

export interface RivalActionDefinition {
  id: RivalActionId;
  name: string;
  approach: string;
  politicalCost: number;
  treasuryCost: number;
  minimumTier: 1 | 2 | 3;
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const seeded = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const memory = (id: string, week: number, title: string, detail: string, tone: PowerMemory['tone']): PowerMemory => ({ id, week, title, detail, tone });

export const leadershipPrinciples: LeadershipPrincipleDefinition[] = [
  { id: 'duty', name: '책임', promise: '약속과 절차를 끝까지 지킨다' },
  { id: 'prosperity', name: '번영', promise: '생산과 일자리를 성과로 증명한다' },
  { id: 'solidarity', name: '연대', promise: '희생과 성과를 넓게 나눈다' },
  { id: 'liberty', name: '자유', promise: '반대와 검증을 제도의 일부로 인정한다' },
  { id: 'sovereignty', name: '자주', promise: '외부 의존을 줄이고 선택권을 지킨다' },
  { id: 'truth', name: '진실', promise: '정보를 숨기기보다 근거로 설득한다' },
];

export const powerBlocDefinitions: PowerBlocDefinition[] = [
  { id: 'armed-forces', name: '군부·참전 조직', shortName: '군부', identity: '전선 지휘관, 장교단, 참전 인력', interest: '전력·보급·명예와 동원 이후의 처우', redLine: '준비 없는 작전과 희생의 망각', championDepartments: ['operations', 'logistics', 'personnel'], principleAffinities: ['duty', 'sovereignty'] },
  { id: 'civil-service', name: '관료·사법 기구', shortName: '관료', identity: '행정관, 법률가, 지방 집행 조직', interest: '예측 가능한 절차와 집행 역량', redLine: '자의적 명령과 잦은 제도 뒤집기', championDepartments: ['political', 'economy'], principleAffinities: ['duty', 'truth'] },
  { id: 'labor', name: '노동·생활 연합', shortName: '노동', identity: '노동조합, 배급 조직, 도시 생활권', interest: '임금·주택·복지와 공정한 부담', redLine: '물가 폭등과 일방적 희생', championDepartments: ['personnel', 'economy', 'science'], principleAffinities: ['solidarity', 'prosperity'] },
  { id: 'industry', name: '산업·금융 협의회', shortName: '산업', identity: '기업가, 기술 관료, 금융·생산 네트워크', interest: '생산성·투자 안정·시장 접근', redLine: '정책 급변과 공급망 붕괴', championDepartments: ['armaments', 'science', 'economy'], principleAffinities: ['prosperity', 'sovereignty'] },
  { id: 'intelligentsia', name: '학계·전문가 사회', shortName: '지식인', identity: '과학자, 교육자, 연구·문화 기관', interest: '교육·연구·전문성의 자율', redLine: '검열과 근거 없는 숙청', championDepartments: ['science', 'personnel', 'political'], principleAffinities: ['truth', 'liberty'] },
  { id: 'regions', name: '지역·민족 대표회의', shortName: '지역', identity: '지방 지도자, 소수 집단, 독립·자치 세력', interest: '대표성·재건 배분·언어와 자치', redLine: '중앙 독점과 지역 격차', championDepartments: ['political', 'logistics', 'economy'], principleAffinities: ['solidarity', 'liberty'] },
  { id: 'security', name: '정보·치안 공동체', shortName: '정보', identity: '정보기관, 경찰, 비밀 연락망', interest: '기밀·침투 방지·작전 재량', redLine: '정보 노출과 통제력 상실', championDepartments: ['political', 'operations'], principleAffinities: ['sovereignty', 'duty'] },
  { id: 'civic', name: '시민·언론 네트워크', shortName: '시민', identity: '언론, 시민단체, 종교·지역 공동체', interest: '공개 검증·권리·정치 참여', redLine: '검열, 부패, 설명 없는 비상권', championDepartments: ['political', 'science', 'personnel'], principleAffinities: ['liberty', 'truth'] },
];

export const legacyPathDefinitions: LegacyPathDefinition[] = [
  { id: 'constitutional-order', name: '지속 가능한 헌정', doctrine: '권력보다 오래가는 규칙', description: '선거·언론·관료제와 평화적 권력 교체를 하나의 국가 관행으로 만듭니다.', success: '정통성·제도 역량·언론 자유·사회 안정', tension: '빠른 비상조치와 권력 집중이 어려워집니다.', alignedBlocs: ['civil-service', 'civic', 'intelligentsia'] },
  { id: 'industrial-miracle', name: '산업 기적', doctrine: '공장을 생활과 경쟁력으로', description: '전시 생산력을 고용·주택·기술 수출로 전환해 세대 단위 번영을 만듭니다.', success: '산업·고용·인프라·상대 경쟁력', tension: '불평등과 생태 비용을 방치하면 성과가 꺾입니다.', alignedBlocs: ['industry', 'labor', 'civil-service'] },
  { id: 'social-commonwealth', name: '사회 공동체', doctrine: '희생의 공정한 배분', description: '복지·주택·노동권과 낮은 불평등으로 전쟁과 위기의 상처를 복구합니다.', success: '복지·고용·평등·낮은 불안', tension: '재정 기반 없는 약속은 신뢰 붕괴로 돌아옵니다.', alignedBlocs: ['labor', 'regions', 'civic'] },
  { id: 'strategic-autonomy', name: '전략적 자주', doctrine: '어느 진영에도 팔리지 않는 선택권', description: '국방·정보·생산 기반과 외교 다변화를 결합해 강대국 압력에 버팁니다.', success: '안보·정보·산업·외교 관계', tension: '비밀주의와 군부 영향력이 민간 제도를 압박할 수 있습니다.', alignedBlocs: ['armed-forces', 'security', 'industry'] },
  { id: 'knowledge-society', name: '지식 사회', doctrine: '교육과 증거가 국력', description: '교육·연구·언론 검증과 전문 관료제를 장기 혁신의 기반으로 만듭니다.', success: '교육·제도·언론 신뢰·경쟁력', tension: '전문가 중심주의가 생활 현장과 멀어질 수 있습니다.', alignedBlocs: ['intelligentsia', 'civil-service', 'civic'] },
  { id: 'regional-order', name: '지역 공동질서', doctrine: '패권보다 연결된 안전', description: '지역 대표성·무역·외교 신뢰와 공동 안보를 엮어 새로운 국제 질서를 만듭니다.', success: '외교 관계·지역 지지·무역·낮은 패권 비용', tension: '국내 강경파는 타협을 양보로 규정할 수 있습니다.', alignedBlocs: ['regions', 'civic', 'armed-forces'] },
];

export const rivalActionDefinitions: RivalActionDefinition[] = [
  { id: 'private-talk', name: '비공개 면담', approach: '쟁점을 좁혀 다음 공격을 늦춥니다. 존중이 높을수록 효과가 큽니다.', politicalCost: 2, treasuryCost: 0, minimumTier: 1 },
  { id: 'share-credit', name: '성과 공동 발표', approach: '지지층을 안심시키지만 경쟁자에게도 정통성을 나눠줍니다.', politicalCost: 2, treasuryCost: 0, minimumTier: 1 },
  { id: 'coalition-offer', name: '연정·공동지휘 제안', approach: '큰 폭의 화해를 시도합니다. 실패하면 약점으로 읽힐 수 있습니다.', politicalCost: 6, treasuryCost: 4, minimumTier: 2 },
  { id: 'public-challenge', name: '공개 노선 대결', approach: '언론과 대중 앞에서 경쟁자의 모순을 겨룹니다. 신뢰도에 따라 역풍이 납니다.', politicalCost: 4, treasuryCost: 0, minimumTier: 2 },
  { id: 'background-audit', name: '적법한 이해충돌 감사', approach: '제도 절차로 자금·인사 관계를 조사합니다. 낮은 제도 역량에서는 정치 수사로 보입니다.', politicalCost: 4, treasuryCost: 6, minimumTier: 3 },
];

function principleSet(strategyId: string): [LeadershipPrincipleId, LeadershipPrincipleId, LeadershipPrincipleId] {
  if (strategyId === 'social-contract') return ['solidarity', 'duty', 'liberty'];
  if (strategyId === 'developmental-state') return ['prosperity', 'duty', 'sovereignty'];
  if (strategyId === 'open-republic') return ['liberty', 'truth', 'prosperity'];
  if (strategyId === 'security-republic') return ['sovereignty', 'duty', 'truth'];
  return ['duty', 'prosperity', 'solidarity'];
}

function defaultLegacy(strategyId: string): LegacyPathId {
  if (strategyId === 'social-contract') return 'social-commonwealth';
  if (strategyId === 'developmental-state') return 'industrial-miracle';
  if (strategyId === 'open-republic') return 'constitutional-order';
  if (strategyId === 'security-republic') return 'strategic-autonomy';
  return 'knowledge-society';
}

function rivalIdentity(nationId: NationId, role: CareerRole) {
  const titles: Record<NationId, string> = {
    britain: '의회 원내총무', usa: '전국 조직위원장', ussr: '중앙위원회 서기', germany: '국가재건위원', japan: '중앙조정회의 간사', china: '연합전선 정치위원', india: '전인도 조직서기', freefrance: '국민평의회 대표', italy: '헌정연합 원내대표', korea: '임시의정원 대표', vietnam: '민족연합 정치위원', indonesia: '독립준비위원', philippines: '국민연합 원내대표',
  };
  const names: Record<NationId, string> = {
    britain: '아서 베넷', usa: '엘리너 헤이스', ussr: '알렉세이 모로조프', germany: '마르타 켈러', japan: '다카하시 레이', china: '린쥔', india: '아샤 메타', freefrance: '클레르 모로', italy: '루치아 페라로', korea: '윤해진', vietnam: '응우옌 민 안', indonesia: '사리 위자야', philippines: '마리아 산토스',
  };
  const blocId: PowerBlocId = role.branch === 'military' ? 'armed-forces' : role.branch === 'intelligence' ? 'security' : role.tier >= 4 ? 'civil-service' : 'civic';
  return { name: names[nationId], title: titles[nationId], blocId };
}

export function createPowerNetworkState(nationId: NationId, week: number, role: CareerRole, strategyId: string): PowerNetworkState {
  const rival = rivalIdentity(nationId, role);
  const principles = principleSet(strategyId);
  return {
    version: 1,
    principles,
    blocs: powerBlocDefinitions.map((bloc, index) => ({
      id: bloc.id,
      influence: clamp(42 + ((index * 11 + role.tier * 7) % 31)),
      support: clamp(47 + (bloc.principleAffinities.some((principle) => principles.includes(principle)) ? 8 : -2)),
      cohesion: clamp(48 + ((index * 17 + role.authority) % 28)),
      mobilization: 18 + ((index * 9) % 24),
      grievance: 28 + ((index * 7) % 25),
      trend: 0,
      lastReason: '새 지도부의 첫 결정을 관망하고 있습니다.',
    })),
    activePromise: null,
    promiseHistory: [],
    rival: {
      ...rival,
      ambition: role.tier >= 4 ? '당신을 대신해 국가 노선을 결정하는 것' : '당신보다 먼저 상위 보직의 신임을 얻는 것',
      pressure: 38,
      respect: 42,
      leverage: 24,
      lastMoveWeek: week,
      actionCooldownUntil: week,
      latestMove: '아직 공개 행동에 나서지 않았습니다.',
    },
    legacy: { activePathId: defaultLegacy(strategyId), progress: 8, highWaterMark: 8, stage: 0, focusChangedWeek: week - 26, milestones: [] },
    activeOpportunity: null,
    opportunityHistory: [],
    memories: [],
    promiseReliability: 60,
    nextOpportunityWeek: week + 5,
    lastUpdatedWeek: week,
  };
}

function getBloc(state: PowerNetworkState, id: PowerBlocId) {
  return state.blocs.find((bloc) => bloc.id === id)!;
}

export function getPowerBlocDefinition(id: PowerBlocId) {
  return powerBlocDefinitions.find((bloc) => bloc.id === id) ?? powerBlocDefinitions[0];
}

export function getLegacyPathDefinition(id: LegacyPathId) {
  return legacyPathDefinitions.find((path) => path.id === id) ?? legacyPathDefinitions[0];
}

export function calculateCoalitionSupport(state: PowerNetworkState) {
  const totalInfluence = state.blocs.reduce((sum, bloc) => sum + bloc.influence, 0) || 1;
  return round(state.blocs.reduce((sum, bloc) => sum + bloc.support * bloc.influence, 0) / totalInfluence);
}

function demandFor(blocId: PowerBlocId, context: PowerNetworkContext) {
  const demands: Record<PowerBlocId, { title: string; requirement: string; deadline: number; progress: () => number; reward: string; failure: string }> = {
    'armed-forces': { title: context.phase === 'war' ? '보급 우선권 보장' : '참전 인력 전환 협약', requirement: context.phase === 'war' ? '안보 예산 20%와 전쟁 지지 55 이상' : '고용 58과 복지 52 이상', deadline: 13, progress: () => context.phase === 'war' ? Math.min(context.budget.security / 20, context.warSupport / 55) * 100 : Math.min(context.employment / 58, context.welfare / 52) * 100, reward: '군부 지지와 동원 효율 상승', failure: '명령 신뢰 저하와 독자 행동 증가' },
    'civil-service': { title: '집행 역량 강화', requirement: '제도 역량 58과 정치 안정 55 이상', deadline: 26, progress: () => Math.min(context.institutionalCapacity / 58, context.stability / 55) * 100, reward: '정책 집행력과 약속 신뢰 상승', failure: '복지부동과 정책 누수 증가' },
    labor: { title: '생활 안정 협약', requirement: '복지 예산 20%, 고용 55, 물가 9% 이하', deadline: 13, progress: () => Math.min(context.budget.welfare / 20, context.employment / 55, 9 / Math.max(1, context.inflation)) * 100, reward: '노동 지지와 사회 안정 상승', failure: '파업·시위 동원 증가' },
    industry: { title: '생산·투자 예측성', requirement: '산업 예산 22%, 민수 산업 52, 물가 12% 이하', deadline: 26, progress: () => Math.min(context.budget.industry / 22, context.civilianIndustry / 52, 12 / Math.max(1, context.inflation)) * 100, reward: '산업 지지와 국고 신뢰 상승', failure: '투자 보류와 공급망 이탈' },
    intelligentsia: { title: '교육·연구 자율 보장', requirement: '교육 예산 18%, 교육 55, 언론 자유 42 이상', deadline: 26, progress: () => Math.min(context.budget.education / 18, context.education / 55, context.mediaFreedom / 42) * 100, reward: '전문가 지지와 제도 혁신 상승', failure: '인재 이탈과 공개 비판 증가' },
    regions: { title: '지역 재건·대표성 협약', requirement: '재건 예산 22%, 사회 불안 48 이하', deadline: 26, progress: () => Math.min(context.budget.reconstruction / 22, 48 / Math.max(1, context.unrest)) * 100, reward: '지역 지지와 분리 압력 완화', failure: '지역 동원과 중앙 불신 증가' },
    security: { title: '방첩 역량 보장', requirement: '안보 예산 18%, 정보망 52 이상', deadline: 13, progress: () => Math.min(context.budget.security / 18, context.intelNetwork / 52) * 100, reward: '정보 지지와 경쟁자 견제력 상승', failure: '기밀 유출과 기관 불복 증가' },
    civic: { title: '공개 검증 약속', requirement: '언론 자유 50, 언론 신뢰 52, 정통성 48 이상', deadline: 13, progress: () => Math.min(context.mediaFreedom / 50, context.pressTrust / 52, context.legitimacy / 48) * 100, reward: '시민 지지와 공적 신뢰 상승', failure: '언론 적대와 반정부 연대 증가' },
  };
  return demands[blocId];
}

function blocTarget(blocId: PowerBlocId, context: PowerNetworkContext) {
  const target: Record<PowerBlocId, { score: number; reason: string }> = {
    'armed-forces': { score: context.phase === 'war' ? context.warSupport * .35 + context.budget.security * 1.2 + (100 - context.enemyPressure) * .2 : context.employment * .35 + context.welfare * .25 + context.stability * .25, reason: context.phase === 'war' ? '보급·전쟁 지지·전선 압력' : '동원 해제·고용·참전 처우' },
    'civil-service': { score: context.institutionalCapacity * .48 + context.stability * .3 + context.legitimacy * .22, reason: '제도 역량·안정·명령의 정당성' },
    labor: { score: context.welfare * .32 + context.employment * .3 + (100 - context.inequality) * .22 + clamp(100 - context.inflation * 4) * .16, reason: '복지·고용·불평등·생활물가' },
    industry: { score: context.civilianIndustry * .35 + context.relativeCompetitiveness * .25 + clamp(100 - context.inflation * 3) * .18 + context.budget.industry * .9, reason: '산업 기반·경쟁력·물가·산업예산' },
    intelligentsia: { score: context.education * .42 + context.mediaFreedom * .24 + context.institutionalCapacity * .2 + context.pressTrust * .14, reason: '교육·학문 자유·전문 행정·검증' },
    regions: { score: context.budget.reconstruction * 1.05 + (100 - context.unrest) * .35 + context.legitimacy * .2 + context.relationAverage * .14, reason: '재건 배분·대표성·사회 안정' },
    security: { score: context.intelNetwork * .36 + context.budget.security * 1.05 + context.stability * .25 + clamp(100 - context.enemyPressure) * .13, reason: '정보망·안보 자원·통제·대외 위협' },
    civic: { score: context.mediaFreedom * .3 + context.pressTrust * .24 + context.legitimacy * .24 + context.publicConfidence * .22, reason: '언론 자유·검증 신뢰·정통성·국민 신뢰' },
  };
  return { ...target[blocId], score: clamp(target[blocId].score) };
}

function legacyScore(pathId: LegacyPathId, context: PowerNetworkContext, coalitionSupport: number) {
  const scores: Record<LegacyPathId, number> = {
    'constitutional-order': context.legitimacy * .24 + context.institutionalCapacity * .25 + context.mediaFreedom * .2 + context.stability * .16 + coalitionSupport * .15,
    'industrial-miracle': context.civilianIndustry * .27 + context.employment * .2 + context.relativeCompetitiveness * .22 + context.budget.industry * .8 + (100 - context.inequality) * .13,
    'social-commonwealth': context.welfare * .28 + context.employment * .2 + (100 - context.inequality) * .24 + (100 - context.unrest) * .16 + context.publicConfidence * .12,
    'strategic-autonomy': context.intelNetwork * .2 + context.civilianIndustry * .18 + context.stability * .18 + context.relationAverage * .18 + (100 - context.enemyPressure) * .16 + context.budget.security * .5,
    'knowledge-society': context.education * .3 + context.institutionalCapacity * .24 + context.pressTrust * .16 + context.relativeCompetitiveness * .2 + context.mediaFreedom * .1,
    'regional-order': context.relationAverage * .28 + (100 - context.unrest) * .18 + context.legitimacy * .16 + context.publicConfidence * .12 + getBlocSupportValue(context, 'regions') * .1 + clamp(100 - context.enemyPressure) * .16,
  };
  return clamp(scores[pathId]);
}

function getBlocSupportValue(context: PowerNetworkContext, blocId: PowerBlocId) {
  if (blocId === 'regions') return (context.relationAverage + 100 - context.unrest) / 2;
  return context.publicConfidence;
}

function choice(id: OpportunityChoiceId, label: string, description: string, forecast: string, input: Partial<Omit<PowerOpportunityChoice, 'id' | 'label' | 'description' | 'forecast'>> = {}): PowerOpportunityChoice {
  return { id, label, description, forecast, support: {}, legitimacy: 0, unrest: 0, stability: 0, publicConfidence: 0, politicalPower: 0, treasury: 0, rivalPressure: 0, ...input };
}

function createOpportunity(state: PowerNetworkState, context: PowerNetworkContext): PowerOpportunity {
  const weakest = [...state.blocs].sort((a, b) => a.support - b.support || b.influence - a.influence)[0];
  const strongest = [...state.blocs].sort((a, b) => b.influence - a.influence)[0];
  const weakName = getPowerBlocDefinition(weakest.id).name;
  const strongName = getPowerBlocDefinition(strongest.id).name;
  const candidates = [
    {
      id: 'coalition-bargain', eligible: true, title: '국가 방향 공동협약', briefing: `${weakName}은 더는 일방 통보를 받아들일 수 없다며 ${strongName}과의 공개 협약을 요구했습니다.`, stakes: '두 세력을 함께 묶을 수 있지만 정책의 자유가 줄어듭니다.', historicalPattern: '전시 연립내각, 국민정부, 사회협약과 노사정 합의의 반복되는 역사적 유형',
      choices: [
        choice('first', '공개 공동협약', '요구·기한·검증 절차를 문서로 공개합니다.', '약속 신뢰와 양측 지지 상승 · 정치력 소모', { support: { [weakest.id]: 9, [strongest.id]: 3 }, legitimacy: 2, publicConfidence: 3, politicalPower: -5, rivalPressure: -3 }),
        choice('second', '비공개 실무거래', '예산과 인사를 맞바꾸되 합의문은 공개하지 않습니다.', '즉시 갈등 완화 · 폭로 시 신뢰 위험', { support: { [weakest.id]: 6, [strongest.id]: 5, civic: -4 }, stability: 1, politicalPower: -2, rivalPressure: 3 }),
        choice('third', '독자 노선 선언', '현재 위임이 충분하다며 요구를 거절합니다.', '정책 자유 확보 · 반대 동원과 경쟁자 압박 증가', { support: { [weakest.id]: -9, [strongest.id]: 4 }, legitimacy: -1, unrest: 3, publicConfidence: -2, rivalPressure: 8 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
    {
      id: 'public-inquiry', eligible: context.pressTrust >= 38 || context.mediaFreedom >= 40, title: '국가 사업 공개 검증 요구', briefing: '감사관과 편집국이 대형 사업의 비용·인사 기록을 함께 공개하라고 요구했습니다.', stakes: '투명성은 단기 상처를 드러내지만 장기 집행 신뢰를 만들 수 있습니다.', historicalPattern: '의회 조사, 독립위원회, 감사원 조사와 진실위원회의 제도적 유형',
      choices: [
        choice('first', '독립 조사위원회', '야권·전문가·시민 대표가 자료를 검증하게 합니다.', '시민·관료 신뢰 상승 · 비용과 단기 불확실성', { support: { civic: 9, 'civil-service': 6, security: -3 }, legitimacy: 3, publicConfidence: 4, treasury: -7, politicalPower: -3, rivalPressure: -2 }),
        choice('second', '내부 감사 후 요약 공개', '정부가 먼저 조사한 뒤 핵심 결과만 발표합니다.', '낮은 비용 · 절반의 신뢰 회복', { support: { 'civil-service': 4, civic: 2 }, legitimacy: 1, treasury: -2, rivalPressure: 1 }),
        choice('third', '국가 기밀 지정', '안보를 이유로 기록 공개를 거부합니다.', '정보기관 지지 · 시민·언론 반발', { support: { security: 8, civic: -10, intelligentsia: -6 }, stability: 1, legitimacy: -3, publicConfidence: -5, rivalPressure: 7 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
    {
      id: 'production-breakthrough', eligible: context.civilianIndustry >= 45 || context.phase === 'war', title: context.phase === 'war' ? '현장 생산 혁신 제안' : '전시 공장의 민수 전환 돌파구', briefing: '기술자·노동자·조달관이 기존 절차를 넘어서는 공동 생산안을 제출했습니다.', stakes: '성과 배분 방식에 따라 산업·노동·관료의 관계가 달라집니다.', historicalPattern: '전시 생산위원회, 공동결정, 개발계획과 산업 전환의 역사적 유형',
      choices: [
        choice('first', '공동 성과계약', '노동·기술·자본에 목표와 보상을 함께 배분합니다.', '폭넓은 지지와 비용 · 장기 결속', { support: { labor: 7, industry: 6, intelligentsia: 4 }, publicConfidence: 2, treasury: -8, politicalPower: -2, rivalPressure: -1 }),
        choice('second', '기업·기술진 주도', '가장 빠른 지휘선에 자원과 특허를 집중합니다.', '산업 성과 기대 · 불평등과 노동 반발', { support: { industry: 10, intelligentsia: 3, labor: -7 }, unrest: 2, treasury: -4, rivalPressure: 2 }),
        choice('third', '국가 직접 동원', '명령 생산과 가격 통제로 전환 속도를 끌어올립니다.', '단기 통제력 · 관료 부담과 시민 우려', { support: { 'civil-service': 6, security: 4, industry: -4, civic: -5 }, stability: 2, legitimacy: -1, politicalPower: -4, rivalPressure: 2 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
    {
      id: 'regional-congress', eligible: context.unrest >= 38 || context.relationAverage >= 55, title: '지역 대표자 대회', briefing: '지역·민족·지방정부 대표들이 재건 배분과 자치 원칙을 한 자리에서 협상하자고 제안했습니다.', stakes: '중앙의 속도와 지역의 동의를 어떻게 결합할지 결정해야 합니다.', historicalPattern: '헌정회의, 독립협상, 연방협약과 지방분권 교섭의 역사적 유형',
      choices: [
        choice('first', '권한·재정 협약', '대표성과 재정을 동시에 명문화합니다.', '지역 지지와 정통성 상승 · 중앙 자원 소모', { support: { regions: 11, civic: 5, 'civil-service': -2 }, legitimacy: 3, unrest: -3, treasury: -6, politicalPower: -4, rivalPressure: -2 }),
        choice('second', '재건 우선 시범구역', '헌정 문제를 미루고 눈에 보이는 사업부터 시작합니다.', '빠른 체감 성과 · 자치 논쟁은 남음', { support: { regions: 6, industry: 4 }, publicConfidence: 2, treasury: -7, politicalPower: -1, rivalPressure: 1 }),
        choice('third', '중앙 기준 일괄 적용', '전국 단일 속도와 행정 기준을 유지합니다.', '집행 단순화 · 지역 반발과 동원 증가', { support: { 'civil-service': 5, regions: -10 }, unrest: 4, stability: -1, rivalPressure: 6 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
    {
      id: 'new-generation', eligible: context.year >= 1960 || context.education >= 58, title: '새 세대의 국가 질문', briefing: '학생·청년 장교·신진 관료들이 기존 지도층의 전쟁 기억과 권력 관행을 공개적으로 묻기 시작했습니다.', stakes: '세대 교체를 흡수할지, 통제할지, 제도 밖 실험으로 돌릴지 선택합니다.', historicalPattern: '학생운동, 세대 교체, 신좌파·신보수 운동과 후기 산업사회 개혁의 유형',
      choices: [
        choice('first', '세대개혁위원회', '청년 대표에게 실제 예산과 감사권을 부여합니다.', '지식인·시민 지지 · 기존 관료 반발', { support: { intelligentsia: 9, civic: 7, 'civil-service': -4 }, legitimacy: 2, publicConfidence: 3, politicalPower: -4, rivalPressure: 1 }),
        choice('second', '국가 프로젝트 공모', '정치 요구를 과학·산업·지역 사업 경쟁으로 전환합니다.', '성과 가능성 · 구조 개혁은 지연', { support: { intelligentsia: 5, industry: 5, regions: 3 }, treasury: -5, publicConfidence: 1 }),
        choice('third', '집회·조직 제한', '질서 회복을 이유로 조직 활동을 제한합니다.', '단기 안정 · 장기 급진화 가능성', { support: { security: 7, 'armed-forces': 3, civic: -9, intelligentsia: -8 }, stability: 2, legitimacy: -3, unrest: 3, rivalPressure: 5 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
    {
      id: 'global-shock', eligible: context.enemyPressure >= 52 || context.inflation >= 10, title: '대외 충격과 국내 연합', briefing: '외부 압력과 생활비 충격이 겹치며 각 세력이 서로 다른 비상 처방을 요구합니다.', stakes: '위기를 이유로 권력을 집중할 수도, 부담을 협상할 수도 있습니다.', historicalPattern: '석유·통화·공급망 위기와 전시 배급, 긴축·소득정책의 역사적 유형',
      choices: [
        choice('first', '사회적 고통분담 협약', '가격·임금·세금과 보상을 하나의 공개 패키지로 묶습니다.', '넓은 동의 · 정치력과 재정 비용', { support: { labor: 7, industry: 4, civic: 4 }, legitimacy: 2, unrest: -2, treasury: -8, politicalPower: -5, rivalPressure: -2 }),
        choice('second', '핵심 산업 선별 보호', '전략 부문에 외화·원료·신용을 집중합니다.', '산업 회복 기대 · 비선정 집단 반발', { support: { industry: 9, 'armed-forces': 4, labor: -5, regions: -3 }, stability: 1, treasury: -5, rivalPressure: 2 }),
        choice('third', '비상 통제경제', '가격·언론·이동과 생산을 중앙에서 통제합니다.', '즉시 통제 · 정통성과 장기 신뢰 손실', { support: { security: 9, 'civil-service': 4, civic: -10, industry: -4 }, stability: 3, legitimacy: -4, publicConfidence: -5, politicalPower: -3, rivalPressure: 4 }),
      ] as [PowerOpportunityChoice, PowerOpportunityChoice, PowerOpportunityChoice],
    },
  ];
  const eligible = candidates.filter((candidate) => candidate.eligible);
  const index = Math.floor(seeded(context.week + state.opportunityHistory.length * 17 + context.role.tier) * eligible.length);
  const selected = eligible[index] ?? candidates[0];
  return { id: `${selected.id}-${context.week}`, templateId: selected.id, openedWeek: context.week, expiresWeek: context.week + 4, title: selected.title, briefing: selected.briefing, stakes: selected.stakes, historicalPattern: selected.historicalPattern, choices: selected.choices };
}

function updateBloc(state: PowerNetworkState, id: PowerBlocId, supportDelta = 0, influenceDelta = 0): PowerNetworkState {
  return { ...state, blocs: state.blocs.map((bloc) => bloc.id === id ? { ...bloc, support: clamp(bloc.support + supportDelta), influence: clamp(bloc.influence + influenceDelta, 8, 92), grievance: clamp(bloc.grievance - supportDelta * .65) } : bloc) };
}

export function setLeadershipPrinciples(state: PowerNetworkState, principles: LeadershipPrincipleId[], context: PowerNetworkContext): PowerNetworkActionResult | null {
  const unique = [...new Set(principles)];
  if (unique.length !== 3 || context.politicalPower < 4) return null;
  const nextPrinciples = unique as [LeadershipPrincipleId, LeadershipPrincipleId, LeadershipPrincipleId];
  const changed = nextPrinciples.filter((principle) => !state.principles.includes(principle)).length;
  if (changed === 0) return null;
  const blocs = state.blocs.map((bloc) => {
    const definition = getPowerBlocDefinition(bloc.id);
    const affinity = definition.principleAffinities.some((principle) => nextPrinciples.includes(principle));
    return { ...bloc, support: clamp(bloc.support + (affinity ? 3 : -2)), trend: affinity ? 3 : -2, lastReason: affinity ? '새 지도 원칙이 집단의 핵심 가치와 맞습니다.' : '새 지도 원칙에서 자신들의 우선순위를 찾지 못했습니다.' };
  });
  return { state: { ...state, principles: nextPrinciples, blocs, memories: [memory(`principles-${context.week}`, context.week, '지도 원칙 재선언', nextPrinciples.map((id) => leadershipPrinciples.find((item) => item.id === id)?.name).join(' · '), 'neutral'), ...state.memories].slice(0, 60) }, title: '지도 원칙 재선언', detail: '세 가지 원칙을 공개했습니다. 이후 정책의 일관성이 각 집단의 지지를 바꿉니다.', politicalPowerDelta: -4, treasuryDelta: 0, legitimacyDelta: changed >= 2 ? -1 : 0, unrestDelta: 0, stabilityDelta: 0, publicConfidenceDelta: 1 };
}

export function makeBlocPromise(state: PowerNetworkState, blocId: PowerBlocId, context: PowerNetworkContext): PowerNetworkActionResult | null {
  if (state.activePromise || context.politicalPower < 3) return null;
  const bloc = getBloc(state, blocId);
  const demand = demandFor(blocId, context);
  const promise: PowerPromise = { id: `${blocId}-${context.week}`, blocId, title: demand.title, requirement: demand.requirement, acceptedWeek: context.week, deadlineWeek: context.week + demand.deadline, progress: clamp(demand.progress()), status: 'active', reward: demand.reward, failure: demand.failure };
  const next = updateBloc({ ...state, activePromise: promise, memories: [memory(`promise-${context.week}`, context.week, `${getPowerBlocDefinition(blocId).shortName}과 공약`, `${demand.title} · ${demand.requirement}`, 'neutral'), ...state.memories].slice(0, 60) }, blocId, 3 + bloc.grievance * .03);
  return { state: next, title: `${getPowerBlocDefinition(blocId).shortName}과 공약 체결`, detail: `${demand.deadline}주 안에 ${demand.requirement}을 달성해야 합니다.`, politicalPowerDelta: -3, treasuryDelta: 0, legitimacyDelta: 1, unrestDelta: 0, stabilityDelta: 0, publicConfidenceDelta: 1 };
}

export function selectLegacyPath(state: PowerNetworkState, pathId: LegacyPathId, context: PowerNetworkContext): PowerNetworkActionResult | null {
  if (state.legacy.activePathId === pathId || context.week < state.legacy.focusChangedWeek + 26 || context.politicalPower < 6) return null;
  const definition = getLegacyPathDefinition(pathId);
  const blocs = state.blocs.map((bloc) => ({ ...bloc, support: clamp(bloc.support + (definition.alignedBlocs.includes(bloc.id) ? 4 : -1)), trend: definition.alignedBlocs.includes(bloc.id) ? 4 : -1, lastReason: definition.alignedBlocs.includes(bloc.id) ? '새 국가 유산의 핵심 동반자로 지목됐습니다.' : '새 장기 노선에서 영향력이 줄어들 수 있다고 봅니다.' }));
  return { state: { ...state, blocs, legacy: { activePathId: pathId, progress: Math.max(5, state.legacy.progress - 8), highWaterMark: Math.max(5, state.legacy.progress - 8), stage: 0, focusChangedWeek: context.week, milestones: [] }, memories: [memory(`legacy-${context.week}`, context.week, `국가 유산 전환 · ${definition.name}`, definition.description, 'neutral'), ...state.memories].slice(0, 60) }, title: `장기 유산 선언 · ${definition.name}`, detail: `${definition.doctrine}. 정책과 세력 연합이 매주 진척을 증명해야 합니다.`, politicalPowerDelta: -6, treasuryDelta: 0, legitimacyDelta: -1, unrestDelta: 1, stabilityDelta: -1, publicConfidenceDelta: 1 };
}

export function previewRivalAction(state: PowerNetworkState, actionId: RivalActionId, context: PowerNetworkContext) {
  const action = rivalActionDefinitions.find((item) => item.id === actionId) ?? rivalActionDefinitions[0];
  const institutional = actionId === 'background-audit' ? context.institutionalCapacity * .28 + context.pressTrust * .18 : 0;
  const relational = actionId === 'private-talk' || actionId === 'coalition-offer' ? state.rival.respect * .35 + context.legitimacy * .18 : 0;
  const publicScore = actionId === 'public-challenge' ? context.pressTrust * .25 + context.publicConfidence * .2 + context.legitimacy * .15 : 0;
  const special = actionId === 'share-credit' ? 64 : institutional + relational + publicScore;
  const base = 32 + context.role.tier * 3 + special - state.rival.pressure * .18 - state.rival.leverage * .12;
  return { action, chance: Math.round(clamp(base, 18, 88)), allowed: context.week >= state.rival.actionCooldownUntil && context.role.tier >= action.minimumTier && context.politicalPower >= action.politicalCost && context.treasury >= action.treasuryCost };
}

export function manageRival(state: PowerNetworkState, actionId: RivalActionId, context: PowerNetworkContext): PowerNetworkActionResult | null {
  const preview = previewRivalAction(state, actionId, context);
  if (!preview.allowed) return null;
  const success = seeded(context.week * 7 + actionId.length * 31 + Math.round(state.rival.pressure)) * 100 <= preview.chance;
  const pressureDelta = success ? (actionId === 'coalition-offer' ? -16 : actionId === 'background-audit' ? -13 : -9) : 7;
  const respectDelta = actionId === 'share-credit' ? 8 : actionId === 'private-talk' ? 5 : actionId === 'public-challenge' || actionId === 'background-audit' ? -5 : success ? 3 : -4;
  const leverageDelta = actionId === 'share-credit' ? 5 : actionId === 'background-audit' && success ? -8 : success ? -2 : 5;
  const blocSupport = success ? 4 : -3;
  const rival = { ...state.rival, pressure: clamp(state.rival.pressure + pressureDelta), respect: clamp(state.rival.respect + respectDelta), leverage: clamp(state.rival.leverage + leverageDelta), actionCooldownUntil: context.week + 6, latestMove: success ? `${preview.action.name}으로 당분간 공세가 잦아들었습니다.` : `${preview.action.name}이 역풍을 맞아 경쟁자가 주도권을 넓혔습니다.` };
  const next = updateBloc({ ...state, rival, memories: [memory(`rival-${context.week}`, context.week, `${preview.action.name} · ${success ? '성과' : '역풍'}`, rival.latestMove, success ? 'good' : 'bad'), ...state.memories].slice(0, 60) }, state.rival.blocId, blocSupport);
  return { state: next, title: `${state.rival.name} 대응 · ${success ? '성과' : '역풍'}`, detail: rival.latestMove, politicalPowerDelta: -preview.action.politicalCost, treasuryDelta: -preview.action.treasuryCost, legitimacyDelta: success ? 1 : -2, unrestDelta: success ? -1 : 2, stabilityDelta: success ? 1 : -1, publicConfidenceDelta: actionId === 'public-challenge' ? (success ? 3 : -4) : success ? 1 : -1 };
}

export function resolvePowerOpportunity(state: PowerNetworkState, choiceId: OpportunityChoiceId, context: PowerNetworkContext): PowerNetworkActionResult | null {
  const opportunity = state.activeOpportunity;
  if (!opportunity) return null;
  const selected = opportunity.choices.find((item) => item.id === choiceId);
  if (!selected || context.politicalPower + selected.politicalPower < 0 || context.treasury + selected.treasury < 0) return null;
  let next: PowerNetworkState = { ...state, activeOpportunity: null, rival: { ...state.rival, pressure: clamp(state.rival.pressure + selected.rivalPressure) }, nextOpportunityWeek: context.week + 7 + Math.floor(seeded(context.week + state.opportunityHistory.length) * 7), opportunityHistory: [{ id: opportunity.id, title: opportunity.title, choice: selected.label, outcome: selected.forecast, resolvedWeek: context.week }, ...state.opportunityHistory].slice(0, 80), memories: [memory(`opportunity-${context.week}`, context.week, `${opportunity.title} · ${selected.label}`, selected.forecast, selected.legitimacy < 0 || selected.unrest > 1 ? 'bad' : selected.legitimacy > 0 || selected.unrest < 0 ? 'good' : 'neutral'), ...state.memories].slice(0, 60) };
  for (const [blocId, delta] of Object.entries(selected.support) as Array<[PowerBlocId, number]>) next = updateBloc(next, blocId, delta, selected.influence?.[blocId] ?? 0);
  return { state: next, title: `${opportunity.title} · ${selected.label}`, detail: `${selected.description} ${selected.forecast}`, politicalPowerDelta: selected.politicalPower, treasuryDelta: selected.treasury, legitimacyDelta: selected.legitimacy, unrestDelta: selected.unrest, stabilityDelta: selected.stability, publicConfidenceDelta: selected.publicConfidence };
}

export function advancePowerNetworkWeek(state: PowerNetworkState, context: PowerNetworkContext): PowerNetworkWeeklyEffects {
  let legitimacy = 0;
  let unrest = 0;
  let stability = 0;
  let publicConfidence = 0;
  let politicalPower = 0;
  let treasury = 0;
  const events: PowerNetworkEvent[] = [];
  const principles = state.principles;
  let next: PowerNetworkState = {
    ...state,
    blocs: state.blocs.map((bloc) => {
      const target = blocTarget(bloc.id, context);
      const definition = getPowerBlocDefinition(bloc.id);
      const affinity = definition.principleAffinities.filter((principle) => principles.includes(principle)).length;
      const consistency = affinity * 2.2 + (state.promiseReliability - 50) * .08;
      const trend = round((target.score + consistency - bloc.support) * .045, 2);
      const grievance = clamp(bloc.grievance + (bloc.support < 42 ? .55 : -.22) + (target.score < 40 ? .3 : 0));
      const mobilizationTarget = clamp(grievance * .55 + bloc.influence * .25 + (context.activeElection ? 9 : 0));
      return { ...bloc, support: clamp(bloc.support + trend), grievance, mobilization: clamp(bloc.mobilization + (mobilizationTarget - bloc.mobilization) * .08), trend, lastReason: `${target.reason}이 지지 목표 ${Math.round(target.score)}를 만들었습니다.` };
    }),
    lastUpdatedWeek: context.week,
  };

  if (next.activePromise) {
    const demand = demandFor(next.activePromise.blocId, context);
    const progress = clamp(demand.progress());
    next.activePromise = { ...next.activePromise, progress };
    if (progress >= 100) {
      const promise = { ...next.activePromise, status: 'fulfilled' as const };
      next = updateBloc({ ...next, activePromise: null, promiseReliability: clamp(next.promiseReliability + 8), promiseHistory: [{ ...promise, resolvedWeek: context.week, outcome: promise.reward }, ...next.promiseHistory].slice(0, 80), memories: [memory(`promise-kept-${context.week}`, context.week, `공약 이행 · ${promise.title}`, promise.reward, 'good'), ...next.memories].slice(0, 60) }, promise.blocId, 10, 2);
      legitimacy += 2; stability += 1; publicConfidence += 2; politicalPower += 1;
      events.push({ id: `promise-kept-${context.week}`, title: `공약 이행 · ${promise.title}`, detail: `${getPowerBlocDefinition(promise.blocId).name}이 결과를 확인했습니다.`, tone: 'good', cause: `${promise.requirement} 기준을 기한 안에 달성했습니다.`, consequence: `${promise.reward}. 다음 협상에서 지도부의 약속을 더 신뢰합니다.` });
    } else if (context.week > next.activePromise.deadlineWeek) {
      const promise = { ...next.activePromise, status: 'broken' as const };
      next = updateBloc({ ...next, activePromise: null, promiseReliability: clamp(next.promiseReliability - 12), promiseHistory: [{ ...promise, resolvedWeek: context.week, outcome: promise.failure }, ...next.promiseHistory].slice(0, 80), memories: [memory(`promise-broken-${context.week}`, context.week, `공약 파기 · ${promise.title}`, promise.failure, 'bad'), ...next.memories].slice(0, 60) }, promise.blocId, -13, 3);
      legitimacy -= 3; unrest += 3; stability -= 2; publicConfidence -= 3;
      events.push({ id: `promise-broken-${context.week}`, title: `공약 파기 · ${promise.title}`, detail: `${getPowerBlocDefinition(promise.blocId).name}이 지도부의 설명을 거부했습니다.`, tone: 'bad', cause: `${promise.requirement} 진척이 ${Math.round(progress)}%에서 기한을 넘겼습니다.`, consequence: `${promise.failure}. 향후 공약의 초기 신뢰도도 낮아집니다.` });
    }
  }

  if (next.activeOpportunity && context.week > next.activeOpportunity.expiresWeek) {
    const expired = next.activeOpportunity;
    const weakest = [...next.blocs].sort((a, b) => a.support - b.support)[0];
    next = updateBloc({ ...next, activeOpportunity: null, nextOpportunityWeek: context.week + 6, rival: { ...next.rival, pressure: clamp(next.rival.pressure + 6) }, opportunityHistory: [{ id: expired.id, title: expired.title, choice: '결정 회피', outcome: '기회를 놓치고 가장 소외된 집단이 경쟁자 쪽으로 이동했습니다.', resolvedWeek: context.week }, ...next.opportunityHistory].slice(0, 80) }, weakest.id, -7);
    legitimacy -= 2; unrest += 2; publicConfidence -= 2;
    events.push({ id: `opportunity-expired-${context.week}`, title: `결정 시한 경과 · ${expired.title}`, detail: '아무 노선도 선택하지 않아 경쟁자가 무대의 중심을 차지했습니다.', tone: 'bad', cause: `제${expired.expiresWeek + 1}주까지 결재하지 않았습니다.`, consequence: `${getPowerBlocDefinition(weakest.id).name} 지지가 하락하고 경쟁자 압력이 상승합니다.` });
  } else if (!next.activeOpportunity && context.week >= next.nextOpportunityWeek) {
    const opportunity = createOpportunity(next, context);
    next = { ...next, activeOpportunity: opportunity };
    events.push({ id: `opportunity-open-${context.week}`, title: `정치적 기회 · ${opportunity.title}`, detail: opportunity.briefing, tone: 'neutral', cause: opportunity.historicalPattern, consequence: `${opportunity.expiresWeek - context.week}주 안에 세 노선 중 하나를 선택해야 하며, 무응답도 결과로 기록됩니다.` });
  }

  if (context.week >= next.rival.lastMoveWeek + 13) {
    const rivalBloc = getBloc(next, next.rival.blocId);
    const opening = clamp((100 - context.legitimacy) * .25 + context.unrest * .2 + rivalBloc.grievance * .3 + (100 - next.promiseReliability) * .15);
    const success = seeded(context.week * 19 + next.rival.pressure) * 100 < opening;
    const latestMove = success ? `${next.rival.name}가 ${getPowerBlocDefinition(next.rival.blocId).name} 지도부와 공동 성명을 발표했습니다.` : `${next.rival.name}의 지도부 비판은 충분한 호응을 얻지 못했습니다.`;
    next = { ...next, rival: { ...next.rival, pressure: clamp(next.rival.pressure + (success ? 7 : -3)), leverage: clamp(next.rival.leverage + (success ? 5 : -1)), lastMoveWeek: context.week, latestMove } };
    if (success) { legitimacy -= 1; publicConfidence -= 1; }
    events.push({ id: `rival-move-${context.week}`, title: `${next.rival.name}의 주도권 시도`, detail: latestMove, tone: success ? 'bad' : 'neutral', cause: `정통성·사회 불안·${getPowerBlocDefinition(next.rival.blocId).shortName} 불만을 합친 정치적 틈 ${Math.round(opening)}/100`, consequence: success ? '경쟁자 압력과 협상 지렛대가 커졌습니다.' : '경쟁자의 압력이 잠시 낮아졌지만 갈등은 사라지지 않았습니다.' });
  }

  const coalitionSupport = calculateCoalitionSupport(next);
  const score = legacyScore(next.legacy.activePathId, context, coalitionSupport);
  const progress = clamp(next.legacy.progress + (score - next.legacy.progress) * .035);
  const thresholds = [25, 50, 75, 100];
  const stage = thresholds.filter((threshold) => progress >= threshold).length as 0 | 1 | 2 | 3 | 4;
  const path = getLegacyPathDefinition(next.legacy.activePathId);
  if (stage > next.legacy.stage) {
    const label = ['기반 형성', '제도 정착', '세대 전환', '역사적 유산'][stage - 1];
    const milestone = `${path.name} · ${label}`;
    next = { ...next, legacy: { ...next.legacy, progress, highWaterMark: Math.max(next.legacy.highWaterMark, progress), stage, milestones: [milestone, ...next.legacy.milestones].slice(0, 12) }, memories: [memory(`legacy-stage-${context.week}`, context.week, milestone, `${path.success} 지표가 장기 문턱을 통과했습니다.`, 'good'), ...next.memories].slice(0, 60) };
    legitimacy += stage; publicConfidence += 2; politicalPower += 1;
    events.push({ id: `legacy-stage-${context.week}`, title: `유산 이정표 · ${milestone}`, detail: `${path.doctrine} 노선이 선언을 넘어 실제 제도로 남기 시작했습니다.`, tone: 'good', cause: `${path.success} 종합 진척 ${Math.round(progress)}%`, consequence: '연계 세력의 장기 신뢰와 국가의 역사적 정체성이 강화됩니다.' });
  } else {
    next = { ...next, legacy: { ...next.legacy, progress, highWaterMark: Math.max(next.legacy.highWaterMark, progress), stage } };
  }

  const highGrievance = next.blocs.filter((bloc) => bloc.grievance >= 68 && bloc.mobilization >= 55);
  if (highGrievance.length > 0) unrest += round(highGrievance.reduce((sum, bloc) => sum + bloc.influence, 0) / 900, 2);
  if (coalitionSupport >= 68) { legitimacy += .08; stability += .06; }
  if (coalitionSupport < 38) { legitimacy -= .1; stability -= .08; }
  const dominant = [...next.blocs].sort((a, b) => b.influence * b.support - a.influence * a.support)[0];
  const volatile = [...next.blocs].sort((a, b) => b.grievance * b.mobilization - a.grievance * a.mobilization)[0];
  return { state: next, politicalPower: round(politicalPower, 2), treasury: round(treasury, 2), legitimacy: round(legitimacy, 2), unrest: round(unrest, 2), stability: round(stability, 2), publicConfidence: round(publicConfidence, 2), events, note: `연정 지지 ${coalitionSupport} · 주도 ${getPowerBlocDefinition(dominant.id).shortName} · 최대 동원 위험 ${getPowerBlocDefinition(volatile.id).shortName} · 유산 ${path.name} ${Math.round(progress)}%` };
}

function normalizeBloc(value: unknown, fallback: PowerBlocState): PowerBlocState {
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PowerBlocState>;
  return { ...fallback, ...candidate, id: fallback.id, influence: clamp(Number(candidate.influence ?? fallback.influence), 8, 92), support: clamp(Number(candidate.support ?? fallback.support)), cohesion: clamp(Number(candidate.cohesion ?? fallback.cohesion)), mobilization: clamp(Number(candidate.mobilization ?? fallback.mobilization)), grievance: clamp(Number(candidate.grievance ?? fallback.grievance)), trend: Number(candidate.trend ?? 0) };
}

export function normalizePowerNetworkState(value: unknown, nationId: NationId, week: number, role: CareerRole, strategyId: string): PowerNetworkState {
  const fallback = createPowerNetworkState(nationId, week, role, strategyId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PowerNetworkState>;
  const incomingBlocs = Array.isArray(candidate.blocs) ? candidate.blocs : [];
  const principles = Array.isArray(candidate.principles) && new Set(candidate.principles).size === 3 ? candidate.principles as [LeadershipPrincipleId, LeadershipPrincipleId, LeadershipPrincipleId] : fallback.principles;
  return {
    ...fallback,
    ...candidate,
    version: 1,
    principles,
    blocs: fallback.blocs.map((bloc) => normalizeBloc(incomingBlocs.find((item) => item?.id === bloc.id), bloc)),
    activePromise: candidate.activePromise ?? null,
    promiseHistory: Array.isArray(candidate.promiseHistory) ? candidate.promiseHistory.slice(0, 80) : [],
    rival: { ...fallback.rival, ...(candidate.rival ?? {}) },
    legacy: { ...fallback.legacy, ...(candidate.legacy ?? {}), milestones: Array.isArray(candidate.legacy?.milestones) ? candidate.legacy.milestones.slice(0, 12) : [] },
    activeOpportunity: candidate.activeOpportunity ?? null,
    opportunityHistory: Array.isArray(candidate.opportunityHistory) ? candidate.opportunityHistory.slice(0, 80) : [],
    memories: Array.isArray(candidate.memories) ? candidate.memories.slice(0, 60) : [],
    promiseReliability: clamp(Number(candidate.promiseReliability ?? fallback.promiseReliability)),
    nextOpportunityWeek: Number(candidate.nextOpportunityWeek ?? fallback.nextOpportunityWeek),
    lastUpdatedWeek: Number(candidate.lastUpdatedWeek ?? fallback.lastUpdatedWeek),
  };
}
