import type { EconomyState } from './economy';
import { getDynasticWeeklyEffects, getGovernmentForm } from './dynasticPolitics';
import type { CampaignPhase, NationManagementState } from './nationManagement';
import type { CareerRole, GameState, NationId } from './types';

export type PoliticalFactionKind = 'civilian' | 'military' | 'security' | 'party' | 'royal' | 'regional' | 'resistance' | 'labor' | 'colonial';
export type CoupRiskTier = 'stable' | 'watch' | 'dangerous' | 'critical';
export type CoupResponseId = 'constitutional-appeal' | 'faction-negotiation' | 'loyal-command' | 'counter-operation';
export type CoupPreventionId = 'faction-dialogue' | 'loyalty-review' | 'security-audit' | 'public-relief';

export interface PoliticalFactionDefinition {
  id: string;
  name: string;
  shortName: string;
  kind: PoliticalFactionKind;
  agenda: string;
  grievance: string;
  baseSupport: number;
  baseOrganization: number;
}

export interface NationPoliticalProfile {
  nationId: NationId;
  constitutionalCenter: string;
  historicalContext: string;
  factions: [PoliticalFactionDefinition, PoliticalFactionDefinition, PoliticalFactionDefinition];
  successorNames: Partial<Record<PoliticalFactionKind, string>>;
}

export interface FactionStanding {
  support: number;
  grievance: number;
  organization: number;
}

export interface PoliticalCrisisState {
  version: 1;
  nationId: NationId;
  governmentName: string;
  generation: number;
  factionStandings: Record<string, FactionStanding>;
  relations: Record<string, number>;
  lastCoupWeek: number | null;
  lastPreventionWeek: number | null;
  weeksInDanger: number;
  attempts: number;
  prevented: number;
  successful: number;
  lastRiskTier: CoupRiskTier;
  lastOutcome: string | null;
}

export interface PoliticalCrisisContext {
  week: number;
  phase: CampaignPhase;
  game: Pick<GameState, 'stability' | 'warSupport' | 'treasury' | 'victoryScore' | 'intelNetwork' | 'enemyPressure' | 'politicalPower' | 'commandPoints'>;
  economy: Pick<EconomyState, 'debt' | 'inflation' | 'publicConfidence'>;
  nation: Pick<NationManagementState, 'unrest' | 'legitimacy' | 'mandateScore' | 'dynasty' | 'electoral'>;
  averageSupply: number;
  staffLoyalty: number;
  staffOverload: number;
  councilTrust: number;
  reputation: number;
}

export interface CoupRiskTrigger {
  id: string;
  label: string;
  contribution: number;
  detail: string;
}

export interface CoupRiskAssessment {
  score: number;
  tier: CoupRiskTier;
  weeklyChance: number;
  triggers: CoupRiskTrigger[];
  leadingFaction: PoliticalFactionDefinition;
  weakestRelation: { pair: string; value: number };
}

export interface CoupIncident {
  id: string;
  week: number;
  nationId: NationId;
  title: string;
  leadingFactionId: string;
  riskScore: number;
  weeklyChance: number;
  detected: boolean;
  briefing: string;
  historicalEcho: string;
}

export interface CoupResponseDefinition {
  id: CoupResponseId;
  name: string;
  branch: CareerRole['branch'] | 'any';
  description: string;
  costLabel: string;
}

export interface CoupResponseForecast extends CoupResponseDefinition {
  allowed: boolean;
  successChance: number;
  consequence: string;
}

export interface CoupPreventionDefinition {
  id: CoupPreventionId;
  name: string;
  branch: CareerRole['branch'] | 'any';
  description: string;
  costLabel: string;
}

export interface PoliticalWeekResult {
  state: PoliticalCrisisState;
  assessment: CoupRiskAssessment;
  incident: CoupIncident | null;
  notices: string[];
}

export interface CoupResolution {
  state: PoliticalCrisisState;
  outcome: 'prevented' | 'compromise' | 'successful';
  title: string;
  detail: string;
  gameDelta: Partial<Record<keyof GameState, number>>;
  careerDelta: { reputation: number; councilTrust: number; legacy: number };
  nationDelta: { unrest: number; legitimacy: number; mandateScore: number };
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));
const pairKey = (left: string, right: string) => [left, right].sort().join('::');

function faction(id: string, name: string, shortName: string, kind: PoliticalFactionKind, agenda: string, grievance: string, baseSupport: number, baseOrganization: number): PoliticalFactionDefinition {
  return { id, name, shortName, kind, agenda, grievance, baseSupport, baseOrganization };
}

export const nationPoliticalProfiles: Record<NationId, NationPoliticalProfile> = {
  britain: {
    nationId: 'britain', constitutionalCenter: '전쟁내각과 의회', historicalContext: '전쟁내각, 참모총장위원회, 정보·당파 조직 사이의 책임과 권한 경쟁을 바탕으로 재구성했습니다.',
    factions: [faction('cabinet', '전쟁내각 연립파', '전쟁내각', 'civilian', '의회 책임과 연합 유지', '전쟁 실패와 내각 불신', 48, 54), faction('chiefs', '참모총장위원회', '합동참모', 'military', '작전 자율성과 군수 우선', '민간의 작전 간섭', 34, 68), faction('security', '국내안보·강경 블록', '안보 블록', 'security', '후방 질서와 제국 결속', '파업·식민지 이탈·침투', 18, 57)],
    successorNames: { civilian: '국가비상내각', military: '합동참모 비상위원회', security: '국가안보집행부' },
  },
  usa: {
    nationId: 'usa', constitutionalCenter: '대통령 행정부와 의회', historicalContext: '행정부, 합동참모, 의회·산업 정치의 견제 관계를 대체역사 위기 구조로 모델링했습니다.',
    factions: [faction('executive', '행정부 전쟁연합', '행정부', 'civilian', '연합전과 행정 통합', '의회 봉쇄와 전쟁 피로', 47, 55), faction('joint-chiefs', '합동참모 본부', '합동참모', 'military', '전구 우선순위와 군 지휘권', '정치적 개입과 패전', 33, 70), faction('congressional', '의회·산업 보수연합', '의회 블록', 'party', '재정 통제와 국내 우선', '부채·배급·권력 집중', 20, 52)],
    successorNames: { civilian: '초당파 국가내각', military: '합동국방 비상위원회', party: '의회국가위원회' },
  },
  ussr: {
    nationId: 'ussr', constitutionalCenter: '국가방위위원회', historicalContext: '당 중앙, 붉은군대 지휘부, 국가보안기관 사이의 생존·숙청·전쟁 지휘 경쟁을 반영했습니다.',
    factions: [faction('party-center', '당 중앙 지도부', '당 중앙', 'party', '당 통제와 전시 동원', '군부 독자화와 패전 책임', 48, 83), faction('red-army', '붉은군대 지휘부', '붉은군대', 'military', '전문 지휘와 전선 생존', '숙청과 정치감독', 34, 76), faction('security-directorate', '국가보안기관', '보안기관', 'security', '후방 통제와 충성 검증', '통제력 약화와 내부 음모', 18, 88)],
    successorNames: { party: '비상 당·국가위원회', military: '혁명군사평의회', security: '국가안전보장위원회' },
  },
  germany: {
    nationId: 'germany', constitutionalCenter: '국가전쟁지도부', historicalContext: '당 관료, 국방군 지휘부, SS·경찰 복합체의 충성·전쟁노선 대립을 반영했습니다.',
    factions: [faction('party-chancellery', '당 총통관저 블록', '당 관저', 'party', '정권 보존과 총력 동원', '군부 불복과 민심 이반', 42, 78), faction('wehrmacht', '국방군 지휘·반대파', '국방군', 'military', '군사 전문성과 전쟁 종결 선택권', '전략 간섭과 숙청', 37, 73), faction('ss-police', 'SS·경찰 권력복합체', 'SS·경찰', 'security', '경찰국가와 독자 권력', '군·당의 권한 견제', 21, 91)],
    successorNames: { party: '국가구제 당위원회', military: '국방군 임시정부', security: '국가안보지도부' },
  },
  japan: {
    nationId: 'japan', constitutionalCenter: '대본영과 궁중·내각', historicalContext: '황도파·통제파의 군내 갈등, 육해군 경쟁, 궁중과 관료제의 제어력을 바탕으로 구성했습니다.',
    factions: [faction('army', '육군 통제·행동파', '육군', 'military', '대륙전 우선과 군정 확대', '전선 교착과 해군 자원 배분', 40, 82), faction('navy', '해군성·연합함대 블록', '해군', 'military', '해양전·교섭 선택권', '육군 독주와 연료 부족', 32, 74), faction('court', '궁중·중신·관료 연합', '궁중·관료', 'royal', '국체 보존과 통제 회복', '청년장교 폭주와 국가 붕괴', 28, 61)],
    successorNames: { military: '대본영 비상정부', royal: '칙명 국가수습내각' },
  },
  china: {
    nationId: 'china', constitutionalCenter: '국민정부 군사위원회', historicalContext: '중앙정부, 지방군벌, 항일통일전선 세력의 군대·세원·영토 경쟁을 반영했습니다.',
    factions: [faction('national-center', '국민정부 중앙계', '중앙정부', 'party', '국가 통합과 중앙군 지휘', '지방 불복과 부패 비난', 44, 67), faction('regional-cliques', '지방군·성정부 연합', '지방 세력', 'regional', '지역 군정과 재정 자치', '중앙의 징발과 인사 독점', 31, 64), faction('united-front', '공산·항일통일전선', '통일전선', 'resistance', '대중 동원과 농촌 기반 확대', '탄압과 불평등', 25, 71)],
    successorNames: { party: '국민구국위원회', regional: '연합성정부 군사평의회', resistance: '인민연합임시정부' },
  },
  india: {
    nationId: 'india', constitutionalCenter: '총독부·입법기구와 민족정치', historicalContext: '식민 행정, 국민회의 대중운동, 인도국민군 계열의 상충하는 정통성을 반영했습니다.',
    factions: [faction('raj', '총독부·식민 행정', '식민 행정', 'colonial', '전시 질서와 제국 연결', '불복종·군 이탈·행정 붕괴', 38, 70), faction('congress', '국민회의 대중연합', '국민회의', 'party', '대표정부와 독립', '탄압·기근·대표성 부재', 39, 58), faction('ina', '인도국민군·급진 독립파', '급진 독립파', 'resistance', '즉각 독립과 무장 행동', '협상 지연과 식민군 충성', 23, 69)],
    successorNames: { colonial: '제국 비상집행부', party: '인도 임시국민정부', resistance: '자유인도 혁명평의회' },
  },
  freefrance: {
    nationId: 'freefrance', constitutionalCenter: '프랑스 민족위원회', historicalContext: '자유프랑스 지도부, 북아프리카 군정 세력, 국내 레지스탕스 평의회의 정통성 경쟁을 반영했습니다.',
    factions: [faction('national-committee', '민족위원회 지도부', '민족위원회', 'civilian', '공화정 정통성과 통합 지휘', '연합국 간섭과 내부 도전', 43, 62), faction('army-command', '북아프리카 군 지휘부', '군 지휘부', 'military', '정규군 확대와 군사 효율', '정치 우선과 인사 배제', 32, 68), faction('resistance-council', '국내 레지스탕스 평의회', '레지스탕스', 'resistance', '국내 대표성과 사회 개혁', '망명 지도부의 독점', 25, 72)],
    successorNames: { civilian: '공화국 비상정부', military: '프랑스 해방군사위원회', resistance: '전국저항평의회 정부' },
  },
  italy: {
    nationId: 'italy', constitutionalCenter: '국왕·정부와 국가평의회', historicalContext: '파시스트 대평의회, 왕실·군부, 당 민병대가 패전과 정권 생존을 두고 갈라지는 구조를 반영했습니다.',
    factions: [faction('grand-council', '파시스트 대평의회', '대평의회', 'party', '당 체제 보존과 지도부 교체', '패전과 개인독재 책임', 36, 69), faction('crown-army', '왕실·정규군 연합', '왕실·군부', 'royal', '왕국 보존과 전쟁 이탈', '국가 붕괴와 당 민병대', 39, 72), faction('party-militia', '당 민병대 강경파', '당 민병대', 'security', '동맹과 혁명체제 고수', '왕실 배신과 타협 노선', 25, 77)],
    successorNames: { party: '국가수습평의회', royal: '국왕 임명 비상내각', security: '공화국 국가안보정부' },
  },
  korea: {
    nationId: 'korea', constitutionalCenter: '대한민국 임시정부', historicalContext: '임시정부 정파, 광복군 지휘부, 국내 비밀결사·지역조직의 대표성과 건국노선 경쟁을 반영했습니다.',
    factions: [faction('provisional', '임시정부 국무원', '임시정부', 'civilian', '공화국 법통과 연합외교', '정파 분열과 국내 기반 부족', 40, 58), faction('liberation-army', '한국광복군 지휘부', '광복군', 'military', '국내 진공과 군사 건국', '작전 지연과 외세 의존', 31, 67), faction('domestic-network', '국내 비밀결사 연합', '국내 조직', 'resistance', '국내 봉기와 민중 대표', '망명조직의 대표 독점', 29, 72)],
    successorNames: { civilian: '건국비상국무원', military: '광복군 군정위원회', resistance: '전국인민건국위원회' },
  },
  vietnam: {
    nationId: 'vietnam', constitutionalCenter: '독립동맹 중앙과 지역위원회', historicalContext: '베트민 중앙, 비공산 민족주의 조직, 식민·지역 행정 잔존세력의 독립·권력 경쟁을 반영했습니다.',
    factions: [faction('viet-minh', '베트민 중앙지도부', '베트민', 'party', '통일 독립과 대중 동원', '분파 행동과 외세 복귀', 43, 74), faction('national-fronts', '비공산 민족주의 전선', '민족주의 전선', 'party', '다당 독립정부와 외교 균형', '중앙조직의 독점', 30, 55), faction('regional-admin', '지역·식민행정 잔존망', '지역 행정', 'regional', '행정 연속성과 지역 자치', '혁명적 몰수와 숙청', 27, 61)],
    successorNames: { party: '민족해방 임시정부', regional: '지역연합 국가위원회' },
  },
  indonesia: {
    nationId: 'indonesia', constitutionalCenter: '독립준비위원회와 군도 대표기구', historicalContext: '민족지도부, 청년·PETA 무장세력, 지역·연방 엘리트의 독립 시기와 국가 형태 경쟁을 반영했습니다.',
    factions: [faction('republican', '공화국 민족지도부', '공화 지도부', 'civilian', '군도 단일 공화국과 외교 승인', '독립 지연과 타협 비난', 40, 57), faction('youth-peta', '청년·PETA 무장세력', '청년·PETA', 'military', '즉각 독립과 무장 혁명', '기성 지도부의 신중론', 34, 73), faction('regional-federal', '지역·연방 엘리트', '지역 엘리트', 'regional', '지역 권리와 행정 연속성', '자바 중심주의와 동원 부담', 26, 55)],
    successorNames: { civilian: '공화국 비상내각', military: '독립군 혁명위원회', regional: '인도네시아 연방평의회' },
  },
  philippines: {
    nationId: 'philippines', constitutionalCenter: '자치정부와 전시내각', historicalContext: '자치정부, 정규군·게릴라 지휘망, 후크 계열 대중조직의 전쟁 공헌과 전후 권력 경쟁을 반영했습니다.',
    factions: [faction('commonwealth', '자치정부 전시내각', '자치정부', 'civilian', '헌정 복원과 국제 승인', '점령기 부재와 엘리트 불신', 42, 58), faction('usaffe-guerrilla', 'USAFFE·게릴라 지휘망', '군·게릴라', 'military', '해방전 공헌과 안보 지휘권', '정치권의 공훈 배제', 34, 70), faction('huk-front', '후크·농민 대중전선', '대중전선', 'labor', '토지개혁과 지방 권력', '지주 복귀와 탄압', 24, 68)],
    successorNames: { civilian: '필리핀 국가비상정부', military: '해방군사평의회', labor: '민주인민연합정부' },
  },
};

export const coupResponseDefinitions: CoupResponseDefinition[] = [
  { id: 'constitutional-appeal', name: '헌정·공개 명령', branch: 'any', description: '국가기관과 국민에게 공개 명령을 내려 중립 세력이 음모에 가담할 비용을 높입니다.', costLabel: '정치력 8 · 실패 시 양극화' },
  { id: 'faction-negotiation', name: '파벌 지도부 막후 협상', branch: 'politics', description: '인사·정책 양보로 핵심 파벌을 분리하고 연합 음모를 깨뜨립니다.', costLabel: '정치력 14 · 국고 £35M' },
  { id: 'loyal-command', name: '충성부대 선점 배치', branch: 'military', description: '수도·방송·통신·탄약고를 충성 지휘관에게 맡겨 실행부대의 기동을 봉쇄합니다.', costLabel: '지휘점수 14 · 안정도 2' },
  { id: 'counter-operation', name: '방첩망 역공작', branch: 'intelligence', description: '연락책과 명령망을 추적해 거사 시점에 핵심 조직자를 동시에 체포합니다.', costLabel: '정치력 8 · 정보망 6' },
];

export const coupPreventionDefinitions: CoupPreventionDefinition[] = [
  { id: 'faction-dialogue', name: '권력집단 조정회의', branch: 'politics', description: '가장 불만이 큰 집단과 정책·인사 거래를 열어 긴장을 낮춥니다.', costLabel: '정치력 8 · 국고 £30M' },
  { id: 'loyalty-review', name: '지휘계통 충성도 검토', branch: 'military', description: '위험 지휘관을 순환 배치하고 수도권 명령 체계를 이중 확인합니다.', costLabel: '지휘점수 8 · 안정도 1' },
  { id: 'security-audit', name: '비밀조직 방첩감사', branch: 'intelligence', description: '자금·통신·무기고 접근 기록을 감사해 음모 조직력을 훼손합니다.', costLabel: '정치력 5 · 정보망 4' },
  { id: 'public-relief', name: '민생·보급 긴급대책', branch: 'any', description: '배급과 임금·구호를 개선해 쿠데타가 기대는 대중 불만을 낮춥니다.', costLabel: '국고 £90M' },
];

export function getNationPoliticalProfile(nationId: NationId) {
  return nationPoliticalProfiles[nationId];
}

export function createPoliticalCrisisState(nationId: NationId, governmentName?: string): PoliticalCrisisState {
  const profile = getNationPoliticalProfile(nationId);
  const factionStandings = Object.fromEntries(profile.factions.map((item) => [item.id, {
    support: item.baseSupport,
    grievance: 16 + Math.round(item.baseOrganization * 0.08),
    organization: item.baseOrganization,
  }]));
  const relations: Record<string, number> = {};
  profile.factions.forEach((left, index) => profile.factions.slice(index + 1).forEach((right) => {
    relations[pairKey(left.id, right.id)] = left.kind === right.kind ? 58 : 48;
  }));
  return {
    version: 1,
    nationId,
    governmentName: governmentName ?? profile.constitutionalCenter,
    generation: 0,
    factionStandings,
    relations,
    lastCoupWeek: null,
    lastPreventionWeek: null,
    weeksInDanger: 0,
    attempts: 0,
    prevented: 0,
    successful: 0,
    lastRiskTier: 'stable',
    lastOutcome: null,
  };
}

export function normalizePoliticalCrisisState(value: unknown, nationId: NationId): PoliticalCrisisState {
  const fallback = createPoliticalCrisisState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PoliticalCrisisState>;
  if (candidate.nationId !== nationId) return fallback;
  return {
    ...fallback,
    ...candidate,
    version: 1,
    nationId,
    factionStandings: Object.fromEntries(Object.entries(fallback.factionStandings).map(([id, standing]) => [id, { ...standing, ...(candidate.factionStandings?.[id] ?? {}) }])),
    relations: { ...fallback.relations, ...(candidate.relations ?? {}) },
  };
}

function deterministicPercent(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

function riskTier(score: number): CoupRiskTier {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'dangerous';
  if (score >= 30) return 'watch';
  return 'stable';
}

export function assessCoupRisk(state: PoliticalCrisisState, context: PoliticalCrisisContext): CoupRiskAssessment {
  const profile = getNationPoliticalProfile(state.nationId);
  const weakestRelationEntry = Object.entries(state.relations).sort((left, right) => left[1] - right[1])[0] ?? ['', 50];
  const leadingFaction = [...profile.factions].sort((left, right) => {
    const leftState = state.factionStandings[left.id];
    const rightState = state.factionStandings[right.id];
    return (rightState.grievance * 0.48 + rightState.organization * 0.32 + rightState.support * 0.2)
      - (leftState.grievance * 0.48 + leftState.organization * 0.32 + leftState.support * 0.2);
  })[0];
  const lead = state.factionStandings[leadingFaction.id];
  const dynasticEffects = getDynasticWeeklyEffects(context.nation.dynasty);
  const governmentForm = getGovernmentForm(context.nation.dynasty.formId);
  const activeElection = context.nation.electoral.activeCampaign;
  const triggers: CoupRiskTrigger[] = [
    { id: 'stability', label: '국가 안정도', contribution: Math.max(0, (55 - context.game.stability) * 0.42), detail: `현재 ${Math.round(context.game.stability)} · 55 미만에서 권력 공백이 커집니다.` },
    { id: 'war', label: '전쟁 지지·전황', contribution: Math.max(0, (50 - context.game.warSupport) * 0.18) + Math.max(0, (42 - context.game.victoryScore) * 0.15), detail: `전쟁 지지 ${Math.round(context.game.warSupport)} · 승전 지수 ${Math.round(context.game.victoryScore)}` },
    { id: 'finance', label: '재정·물가 압박', contribution: Math.max(0, (240 - context.game.treasury) / 38) + Math.max(0, context.economy.inflation - 8) * 0.42 + Math.max(0, context.economy.debt - 900) / 180, detail: `국고 £${Math.round(context.game.treasury)}M · 물가 ${context.economy.inflation.toFixed(1)}% · 부채 £${Math.round(context.economy.debt)}M` },
    { id: 'public', label: '정당성·사회 불안', contribution: context.phase === 'nation' ? Math.max(0, context.nation.unrest - 35) * 0.25 + Math.max(0, 55 - context.nation.legitimacy) * 0.18 + Math.max(0, 50 - context.nation.mandateScore) * 0.12 : 0, detail: `불안 ${Math.round(context.nation.unrest)} · 정당성 ${Math.round(context.nation.legitimacy)} · 국민 위임 ${Math.round(context.nation.mandateScore)}` },
    { id: 'supply', label: '보급·전선 압박', contribution: Math.max(0, 58 - context.averageSupply) * 0.16 + Math.max(0, context.game.enemyPressure - 72) * 0.13, detail: `평균 보급 ${Math.round(context.averageSupply)} · 적 압박 ${Math.round(context.game.enemyPressure)}` },
    { id: 'elite', label: '엘리트 충성·정부 신임', contribution: Math.max(0, 66 - context.staffLoyalty) * 0.2 + Math.max(0, context.staffOverload - 70) * 0.12 + Math.max(0, 58 - context.councilTrust) * 0.2, detail: `참모 충성 ${Math.round(context.staffLoyalty)} · 과부하 ${Math.round(context.staffOverload)} · 지도부 신임 ${Math.round(context.councilTrust)}` },
    { id: 'factions', label: `${leadingFaction.shortName} 동원력`, contribution: Math.max(0, lead.grievance - 25) * 0.22 + Math.max(0, lead.organization - 55) * 0.13 + Math.max(0, 42 - weakestRelationEntry[1]) * 0.22, detail: `불만 ${Math.round(lead.grievance)} · 조직력 ${Math.round(lead.organization)} · 최저 관계 ${Math.round(weakestRelationEntry[1])}` },
    { id: 'succession', label: governmentForm.monarchy ? '왕위계승·궁정 균형' : '헌정 연속성', contribution: context.phase === 'nation' ? dynasticEffects.coupRisk : 0, detail: governmentForm.monarchy ? `계승 안정 ${Math.round(context.nation.dynasty.successionSecurity)} · 궁정 결속 ${Math.round(context.nation.dynasty.courtUnity)} · 영지 부담 ${Math.round(context.nation.dynasty.estateBurden)}` : '비왕정 체제로 왕위 찬탈 위험은 없습니다.' },
    { id: 'election', label: activeElection ? '선거 불복·정치 양극화' : '선거제도 신뢰', contribution: context.phase === 'nation' ? Math.max(0, 52 - context.nation.electoral.electoralIntegrity) * 0.18 + Math.max(0, (activeElection?.polarization ?? 0) - 55) * 0.14 : 0, detail: activeElection ? `절차 신뢰 ${activeElection.integrity.toFixed(1)} · 양극화 ${activeElection.polarization.toFixed(1)} · ${activeElection.stage}` : `선거 신뢰 ${context.nation.electoral.electoralIntegrity.toFixed(1)} · 진행 중 선거 없음` },
    { id: 'intelligence', label: '방첩 억제력', contribution: -Math.max(0, context.game.intelNetwork - 45) * 0.11, detail: `정보망 ${Math.round(context.game.intelNetwork)}가 사전 적발 가능성을 높입니다.` },
  ].map((trigger) => ({ ...trigger, contribution: round(trigger.contribution) }));
  const raw = triggers.reduce((total, trigger) => total + trigger.contribution, 8 + Math.min(9, state.weeksInDanger * 0.8));
  const score = Math.round(clamp(raw));
  const tier = riskTier(score);
  const weeklyChance = tier === 'stable' || tier === 'watch' ? 0 : round(Math.min(46, 2 + (score - 50) * 0.82 + state.weeksInDanger * 0.65));
  return {
    score,
    tier,
    weeklyChance,
    triggers: triggers.sort((left, right) => right.contribution - left.contribution),
    leadingFaction,
    weakestRelation: { pair: weakestRelationEntry[0], value: weakestRelationEntry[1] },
  };
}

function updateFactionStanding(definition: PoliticalFactionDefinition, standing: FactionStanding, context: PoliticalCrisisContext): FactionStanding {
  const nationalStress = Math.max(0, 55 - context.game.stability) / 25
    + Math.max(0, 48 - context.game.warSupport) / 35
    + Math.max(0, context.economy.inflation - 8) / 18
    + (context.phase === 'nation' ? Math.max(0, context.nation.unrest - 38) / 34 : 0);
  const specificStress = definition.kind === 'military' ? Math.max(0, context.game.enemyPressure - 62) / 28 + Math.max(0, 55 - context.averageSupply) / 30
    : definition.kind === 'civilian' || definition.kind === 'party' ? Math.max(0, 52 - context.councilTrust) / 35 + Math.max(0, context.economy.inflation - 6) / 25
      : definition.kind === 'security' ? Math.max(0, 55 - context.game.intelNetwork) / 35
        : definition.kind === 'labor' || definition.kind === 'resistance' ? Math.max(0, context.nation.unrest - 32) / 32
          : Math.max(0, 50 - context.nation.legitimacy) / 40;
  const relief = context.game.stability >= 68 ? 0.55 : 0;
  return {
    support: round(clamp(standing.support + (nationalStress > 1.2 ? 0.15 : -0.05))),
    grievance: round(clamp(standing.grievance + nationalStress * 0.72 + specificStress * 0.55 - relief)),
    organization: round(clamp(standing.organization + (standing.grievance >= 55 ? 0.3 : -0.05))),
  };
}

export function advancePoliticalCrisisWeek(state: PoliticalCrisisState, context: PoliticalCrisisContext): PoliticalWeekResult {
  const profile = getNationPoliticalProfile(state.nationId);
  const activeElection = context.nation.electoral.activeCampaign;
  const factionStandings = Object.fromEntries(profile.factions.map((definition) => [definition.id, updateFactionStanding(definition, state.factionStandings[definition.id], context)]));
  const averageGrievance = Object.values(factionStandings).reduce((total, item) => total + item.grievance, 0) / profile.factions.length;
  const relationShift = context.game.stability >= 65 && context.councilTrust >= 60 ? 0.28 : -(Math.max(0, averageGrievance - 35) / 32 + Math.max(0, 50 - context.councilTrust) / 45);
  const relations = Object.fromEntries(Object.entries(state.relations).map(([key, value]) => [key, round(clamp(value + relationShift))]));
  let nextState: PoliticalCrisisState = { ...state, factionStandings, relations };
  let assessment = assessCoupRisk(nextState, context);
  nextState = {
    ...nextState,
    weeksInDanger: assessment.tier === 'dangerous' || assessment.tier === 'critical' ? state.weeksInDanger + 1 : Math.max(0, state.weeksInDanger - 1),
    lastRiskTier: assessment.tier,
  };
  assessment = assessCoupRisk(nextState, context);
  const cooldownReady = state.lastCoupWeek === null || context.week - state.lastCoupWeek >= 12;
  const roll = deterministicPercent(`${state.nationId}:${context.week}:${state.attempts}:${assessment.leadingFaction.id}`);
  const shouldTrigger = context.week >= 6 && cooldownReady && assessment.weeklyChance > 0 && roll < assessment.weeklyChance;
  const notices: string[] = [];
  if (state.lastRiskTier !== assessment.tier) notices.push(`정치 위기 단계가 ${getCoupRiskLabel(assessment.tier)}(으)로 변경됐습니다.`);
  if (!shouldTrigger) return { state: nextState, assessment, incident: null, notices };
  const detectionScore = clamp(context.game.intelNetwork * 0.55 + context.staffLoyalty * 0.25 + context.councilTrust * 0.2 - assessment.leadingFaction.baseOrganization * 0.25);
  const detected = deterministicPercent(`${state.nationId}:detect:${context.week}:${state.attempts}`) < detectionScore;
  const incident: CoupIncident = {
    id: `coup-${state.nationId}-${context.week}-${state.attempts + 1}`,
    week: context.week,
    nationId: state.nationId,
    title: `${assessment.leadingFaction.name}의 ${activeElection && activeElection.integrity < 48 ? '개표 불복·권력 장악 시도' : getGovernmentForm(context.nation.dynasty.formId).monarchy ? (context.nation.dynasty.successionSecurity < 42 ? '왕위 찬탈' : '궁정 쿠데타') : (detected ? '쿠데타 음모 적발' : '권력 장악 시도')}`,
    leadingFactionId: assessment.leadingFaction.id,
    riskScore: assessment.score,
    weeklyChance: assessment.weeklyChance,
    detected,
    briefing: detected
      ? '연락망과 병력 이동 징후를 조기에 포착했습니다. 실행 전 대응할 수 있지만 잘못된 선택은 중립 집단을 음모 쪽으로 밀어낼 수 있습니다.'
      : '수도 핵심시설과 명령망 일부가 이미 흔들리고 있습니다. 제한된 정보 속에서 즉시 대응해야 합니다.',
    historicalEcho: profile.historicalContext,
  };
  nextState = { ...nextState, lastCoupWeek: context.week, attempts: state.attempts + 1, lastOutcome: '쿠데타 대응 대기' };
  return { state: nextState, assessment, incident, notices };
}

export function canUsePoliticalAction(role: CareerRole, branch: CareerRole['branch'] | 'any') {
  return branch === 'any' || role.tier === 1 || role.branch === branch;
}

function responseBaseChance(id: CoupResponseId, context: PoliticalCrisisContext, incident: CoupIncident) {
  const early = incident.detected ? 12 : -8;
  if (id === 'constitutional-appeal') return 38 + context.game.stability * 0.24 + context.reputation * 0.12 + early;
  if (id === 'faction-negotiation') return 32 + context.councilTrust * 0.32 + context.game.politicalPower * 0.08 + early;
  if (id === 'loyal-command') return 34 + context.staffLoyalty * 0.24 + context.game.commandPoints * 0.18 + context.averageSupply * 0.08 + early;
  return 31 + context.game.intelNetwork * 0.38 + context.staffLoyalty * 0.12 + early;
}

export function getCoupResponseForecasts(incident: CoupIncident, role: CareerRole, context: PoliticalCrisisContext): CoupResponseForecast[] {
  return coupResponseDefinitions.map((definition) => ({
    ...definition,
    allowed: canUsePoliticalAction(role, definition.branch),
    successChance: Math.round(clamp(responseBaseChance(definition.id, context, incident) - Math.max(0, incident.riskScore - 55) * 0.45, 8, 92)),
    consequence: definition.id === 'constitutional-appeal' ? '성공하면 헌정 질서가 강화되지만 실패하면 공개 대립이 격화됩니다.'
      : definition.id === 'faction-negotiation' ? '성공하면 연합 음모가 분열되며, 타협 시 일부 권한을 양도합니다.'
        : definition.id === 'loyal-command' ? '성공하면 실행부대가 무장해제되며, 실패하면 수도에서 무력충돌이 납니다.'
          : '성공하면 지도부를 일망타진하지만 실패하면 정보망이 노출됩니다.',
  }));
}

function canAffordResponse(id: CoupResponseId, context: PoliticalCrisisContext) {
  if (id === 'constitutional-appeal') return context.game.politicalPower >= 8;
  if (id === 'faction-negotiation') return context.game.politicalPower >= 14 && context.game.treasury >= 35;
  if (id === 'loyal-command') return context.game.commandPoints >= 14;
  return context.game.politicalPower >= 8 && context.game.intelNetwork >= 6;
}

export function resolveCoupAttempt(state: PoliticalCrisisState, incident: CoupIncident, role: CareerRole, context: PoliticalCrisisContext, responseId: CoupResponseId): CoupResolution | null {
  const forecast = getCoupResponseForecasts(incident, role, context).find((item) => item.id === responseId);
  if (!forecast?.allowed || !canAffordResponse(responseId, context)) return null;
  const roll = deterministicPercent(`${incident.id}:${responseId}:${state.generation}`);
  const success = roll < forecast.successChance;
  const compromise = !success && responseId === 'faction-negotiation' && roll < forecast.successChance + 24;
  const outcome: CoupResolution['outcome'] = success ? 'prevented' : compromise ? 'compromise' : 'successful';
  const profile = getNationPoliticalProfile(state.nationId);
  const leader = profile.factions.find((item) => item.id === incident.leadingFactionId) ?? profile.factions[0];
  const leaderStanding = state.factionStandings[leader.id];
  const directCosts: Partial<Record<keyof GameState, number>> = responseId === 'constitutional-appeal' ? { politicalPower: -8 }
    : responseId === 'faction-negotiation' ? { politicalPower: -14, treasury: -35 }
      : responseId === 'loyal-command' ? { commandPoints: -14, stability: -2 }
        : { politicalPower: -8, intelNetwork: -6 };
  if (outcome === 'prevented') {
    return {
      state: {
        ...state,
        prevented: state.prevented + 1,
        weeksInDanger: Math.max(0, state.weeksInDanger - 4),
        lastRiskTier: 'watch',
        lastOutcome: `${leader.name} 쿠데타 저지`,
        factionStandings: { ...state.factionStandings, [leader.id]: { ...leaderStanding, grievance: clamp(leaderStanding.grievance - 12), organization: clamp(leaderStanding.organization - 18) } },
      },
      outcome,
      title: '쿠데타 진압 — 지휘체계 유지',
      detail: `${leader.name}의 실행망을 분리하고 정부 지휘권을 지켰습니다. 관련 파벌은 약화됐지만 정치적 후유증은 남습니다.`,
      gameDelta: { ...directCosts, stability: (directCosts.stability ?? 0) + 3, warSupport: 2 },
      careerDelta: { reputation: 5, councilTrust: 6, legacy: 2 },
      nationDelta: { unrest: -8, legitimacy: 5, mandateScore: 3 },
    };
  }
  if (outcome === 'compromise') {
    return {
      state: {
        ...state,
        prevented: state.prevented + 1,
        weeksInDanger: Math.max(0, state.weeksInDanger - 2),
        lastRiskTier: 'dangerous',
        lastOutcome: `${leader.name}과 권력분점`,
        governmentName: `${state.governmentName}·${leader.shortName} 공동체제`,
        factionStandings: { ...state.factionStandings, [leader.id]: { ...leaderStanding, grievance: clamp(leaderStanding.grievance - 20), support: clamp(leaderStanding.support + 7) } },
      },
      outcome,
      title: '쿠데타 봉합 — 권력분점 합의',
      detail: `${leader.name}이 무력행동을 중단하는 대신 내각·군 지휘권 일부를 얻었습니다. 정권은 생존했지만 이후 결정 자유가 좁아집니다.`,
      gameDelta: { ...directCosts, stability: -1, politicalPower: (directCosts.politicalPower ?? 0) - 5 },
      careerDelta: { reputation: -2, councilTrust: -3, legacy: 1 },
      nationDelta: { unrest: -4, legitimacy: -3, mandateScore: -3 },
    };
  }
  const successor = profile.successorNames[leader.kind] ?? `${leader.shortName} 국가비상위원회`;
  const resetStandings = Object.fromEntries(profile.factions.map((item) => {
    const standing = state.factionStandings[item.id];
    return [item.id, item.id === leader.id
      ? { ...standing, support: clamp(standing.support + 12), grievance: 12, organization: clamp(standing.organization + 8) }
      : { ...standing, support: clamp(standing.support - 6), grievance: clamp(standing.grievance + 8), organization: clamp(standing.organization - 7) }];
  }));
  return {
    state: { ...state, successful: state.successful + 1, generation: state.generation + 1, governmentName: successor, weeksInDanger: 0, lastRiskTier: 'watch', lastOutcome: `${successor} 수립`, factionStandings: resetStandings },
    outcome,
    title: '쿠데타 성공 — 정권 교체',
    detail: `${leader.name}이 핵심 국가기관을 장악해 ${successor}을(를) 세웠습니다. 캠페인은 끝나지 않으며, 사용자는 새 권력구조 속에서 보직과 영향력을 다시 확보해야 합니다.`,
    gameDelta: { ...directCosts, stability: -14, warSupport: -7, politicalPower: -18, commandPoints: -10, treasury: -80 },
    careerDelta: { reputation: -12, councilTrust: -18, legacy: -2 },
    nationDelta: { unrest: 14, legitimacy: -16, mandateScore: -12 },
  };
}

function canAffordPrevention(id: CoupPreventionId, context: PoliticalCrisisContext) {
  if (id === 'faction-dialogue') return context.game.politicalPower >= 8 && context.game.treasury >= 30;
  if (id === 'loyalty-review') return context.game.commandPoints >= 8;
  if (id === 'security-audit') return context.game.politicalPower >= 5 && context.game.intelNetwork >= 4;
  return context.game.treasury >= 90;
}

export function applyCoupPrevention(state: PoliticalCrisisState, context: PoliticalCrisisContext, role: CareerRole, id: CoupPreventionId): { state: PoliticalCrisisState; gameDelta: Partial<Record<keyof GameState, number>>; detail: string } | null {
  const action = coupPreventionDefinitions.find((item) => item.id === id);
  if (!action || !canUsePoliticalAction(role, action.branch) || !canAffordPrevention(id, context) || state.lastPreventionWeek === context.week) return null;
  const assessment = assessCoupRisk(state, context);
  const leaderId = assessment.leadingFaction.id;
  const leader = state.factionStandings[leaderId];
  let factionStandings = { ...state.factionStandings };
  let relations = { ...state.relations };
  let gameDelta: Partial<Record<keyof GameState, number>> = {};
  if (id === 'faction-dialogue') {
    factionStandings[leaderId] = { ...leader, grievance: clamp(leader.grievance - 14) };
    relations = Object.fromEntries(Object.entries(relations).map(([key, value]) => [key, key.includes(leaderId) ? clamp(value + 8) : value]));
    gameDelta = { politicalPower: -8, treasury: -30 };
  } else if (id === 'loyalty-review') {
    const military = getNationPoliticalProfile(state.nationId).factions.find((item) => item.kind === 'military') ?? assessment.leadingFaction;
    const standing = factionStandings[military.id];
    factionStandings[military.id] = { ...standing, grievance: clamp(standing.grievance - 7), organization: clamp(standing.organization - 9) };
    gameDelta = { commandPoints: -8, stability: -1 };
  } else if (id === 'security-audit') {
    factionStandings[leaderId] = { ...leader, organization: clamp(leader.organization - 12) };
    gameDelta = { politicalPower: -5, intelNetwork: -4 };
  } else {
    factionStandings = Object.fromEntries(Object.entries(factionStandings).map(([key, standing]) => [key, { ...standing, grievance: clamp(standing.grievance - 6) }]));
    gameDelta = { treasury: -90, stability: 3, warSupport: 1 };
  }
  return {
    state: { ...state, factionStandings, relations, lastPreventionWeek: context.week, lastOutcome: `${action.name} 실시` },
    gameDelta,
    detail: `${action.name}을(를) 실시했습니다. ${assessment.leadingFaction.shortName}의 위험 요인을 중심으로 다음 주 쿠데타 계산이 갱신됩니다.`,
  };
}

export function getCoupRiskLabel(tier: CoupRiskTier) {
  return tier === 'critical' ? '임박' : tier === 'dangerous' ? '위험' : tier === 'watch' ? '관찰' : '안정';
}

export function getFactionRelationLabel(value: number) {
  return value < 25 ? '적대' : value < 42 ? '대립' : value < 58 ? '경쟁' : value < 72 ? '협력' : '동맹';
}
