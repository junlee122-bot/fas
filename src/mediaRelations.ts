import { getGovernmentForm, type GovernmentFormId } from './dynasticPolitics';
import { getNewsMediaEra } from './newsMediaEvolution';
import {
  getFamilyLaw,
  getOrientationLabel,
  type FamilyLawId,
  type PersonalLifeState,
} from './personalLife';
import type { CareerBranch, CareerRole, NationId } from './types';

export type MediaLawId = 'wartime-censorship' | 'licensed-press' | 'plural-press' | 'constitutional-free-press';
export type MediaTopicId = 'personal-life' | 'national-vision' | 'economy' | 'security' | 'election' | 'foreign-policy';
export type InterviewResponseId = 'candid' | 'values-first' | 'fact-check' | 'no-comment' | 'decline';
export type ExposureResponseId = 'own-terms' | 'privacy-rights' | 'independent-review' | 'legal-protection' | 'attack-source';
export type InterviewInitiator = 'media' | 'player';
export type ExposureStage = 'rumor' | 'verification' | 'published' | 'resolved';

export interface MediaLawDefinition {
  id: MediaLawId;
  name: string;
  principle: string;
  description: string;
  freedomTarget: number;
  independentInterviews: boolean;
  sourceProtection: boolean;
  politicalCost: number;
  treasuryCost: number;
  requiredEducation: number;
  requiredInstitutions: number;
  requiredLegitimacy: number;
  historicalAnchor: string;
}

export interface MediaOutlet {
  id: 'state' | 'public' | 'independent' | 'partisan' | 'international';
  name: string;
  desk: string;
  editorialLine: string;
  reach: number;
  rigor: number;
  independence: number;
}

export interface InterviewRequest {
  id: string;
  requestedWeek: number;
  deadlineWeek: number;
  initiator: InterviewInitiator;
  outlet: MediaOutlet;
  topicId: MediaTopicId;
  format: string;
  question: string;
  context: string;
  pressure: number;
}

export interface ExposureIncident {
  id: string;
  openedWeek: number;
  updatedWeek: number;
  stage: ExposureStage;
  subject: string;
  instigator: string;
  motive: string;
  outlet: MediaOutlet;
  evidenceQuality: number;
  publicAttention: number;
  privacyViolation: boolean;
  resolution: string | null;
}

export interface MediaHistoryRecord {
  id: string;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'neutral' | 'bad';
}

export interface MediaRelationsState {
  version: 1;
  nationId: NationId;
  lawId: MediaLawId;
  freedom: number;
  pressTrust: number;
  access: number;
  hostility: number;
  nextInterviewWeek: number;
  lastExposureWeek: number | null;
  pendingInterview: InterviewRequest | null;
  activeExposure: ExposureIncident | null;
  interviewsCompleted: number;
  history: MediaHistoryRecord[];
}

export interface MediaRelationsContext {
  week: number;
  year: number;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  unrest: number;
  education: number;
  institutionalCapacity: number;
  inflation: number;
  publicConfidence: number;
  intelNetwork: number;
  governmentFormId: GovernmentFormId;
  strategyId: string;
  activeElection: boolean;
  personalLife: PersonalLifeState;
}

export interface MediaActionResult {
  state: MediaRelationsState;
  personalLife: PersonalLifeState;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  publicConfidenceDelta: number;
  title: string;
  detail: string;
}

export interface MediaWeeklyEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface MediaWeeklyEffects {
  state: MediaRelationsState;
  personalLife: PersonalLifeState;
  legitimacy: number;
  unrest: number;
  stability: number;
  publicConfidence: number;
  events: MediaWeeklyEvent[];
  note: string;
}

export interface DisclosureRiskAssessment {
  score: number;
  weeklyChance: number;
  subject: string;
  likelyInstigator: string;
  factors: Array<{ label: string; value: number; detail: string }>;
  protection: string;
}

export const mediaLawDefinitions: MediaLawDefinition[] = [
  {
    id: 'wartime-censorship',
    name: '전시 검열령',
    principle: '허가된 발표만 보도',
    description: '군·정부 검열관이 기사와 방송을 사전 심사합니다. 공개 질문은 적지만 정보기관과 집권파의 비공식 협박 위험이 큽니다.',
    freedomTarget: 12,
    independentInterviews: false,
    sourceProtection: false,
    politicalCost: 8,
    treasuryCost: 6,
    requiredEducation: 0,
    requiredInstitutions: 0,
    requiredLegitimacy: 15,
    historicalAnchor: '총력전기의 보도 검열·군사기밀 통제와 국가 선전 체제를 기본점으로 삼습니다.',
  },
  {
    id: 'licensed-press',
    name: '허가 언론제',
    principle: '복수 매체·행정 허가',
    description: '신문과 방송이 취재할 수 있으나 면허·보도지침·명예훼손법이 편집권을 제한합니다.',
    freedomTarget: 38,
    independentInterviews: true,
    sourceProtection: false,
    politicalCost: 14,
    treasuryCost: 10,
    requiredEducation: 25,
    requiredInstitutions: 30,
    requiredLegitimacy: 28,
    historicalAnchor: '전후 과도정부와 권위주의적 다당제에서 반복된 허가·정간·보도지침 체계를 반영합니다.',
  },
  {
    id: 'plural-press',
    name: '다원 언론법',
    principle: '편집권·반론권·복수 소유',
    description: '정부·야당·지역·노동·상업 매체가 경쟁하고 정정·반론 절차와 취재원 보호가 작동합니다.',
    freedomTarget: 68,
    independentInterviews: true,
    sourceProtection: true,
    politicalCost: 25,
    treasuryCost: 18,
    requiredEducation: 42,
    requiredInstitutions: 48,
    requiredLegitimacy: 38,
    historicalAnchor: '전후 민주화기의 복수 신문, 공영방송, 언론노조와 반론권 제도를 조합한 단계입니다.',
  },
  {
    id: 'constitutional-free-press',
    name: '헌법상 언론자유',
    principle: '독립 보도·강한 사생활 보호',
    description: '사전 검열을 금지하고 독립 규제, 취재원 보호, 정보공개와 사생활 구제 절차를 헌법적으로 보장합니다.',
    freedomTarget: 88,
    independentInterviews: true,
    sourceProtection: true,
    politicalCost: 38,
    treasuryCost: 28,
    requiredEducation: 58,
    requiredInstitutions: 64,
    requiredLegitimacy: 50,
    historicalAnchor: '독립 사법부·정보공개·공영방송 독립·언론중재를 함께 갖춘 현대적 자유언론 모델입니다.',
  },
];

export const mediaTopicDefinitions: Array<{ id: MediaTopicId; name: string; purpose: string }> = [
  { id: 'personal-life', name: '개인생활·가족', purpose: '소문을 남이 규정하기 전에 공개 범위와 원칙을 설명합니다.' },
  { id: 'national-vision', name: '국가 비전', purpose: '장기 목표와 통치 철학을 국민에게 직접 설명합니다.' },
  { id: 'economy', name: '경제·민생', purpose: '물가·고용·재정 선택의 이유와 확인 시점을 밝힙니다.' },
  { id: 'security', name: '안보·전쟁', purpose: '공개 가능한 범위에서 작전과 안보정책의 책임을 설명합니다.' },
  { id: 'election', name: '선거·정치', purpose: '공약, 연정, 경쟁자 비판과 권력 이양 원칙을 답합니다.' },
  { id: 'foreign-policy', name: '외교·세계질서', purpose: '동맹과 경쟁국을 향한 메시지를 국제면에 전달합니다.' },
];

export const interviewResponseDefinitions: Array<{ id: InterviewResponseId; name: string; approach: string }> = [
  { id: 'candid', name: '솔직하게 답한다', approach: '질문의 전제를 인정하고 가능한 사실과 불확실성을 함께 밝힙니다.' },
  { id: 'values-first', name: '원칙과 정책으로 답한다', approach: '개인의 존엄·국가 목표·검증 가능한 정책을 중심으로 의제를 전환합니다.' },
  { id: 'fact-check', name: '사실관계를 바로잡는다', approach: '틀린 전제와 확인된 자료를 구분해 기록에 남는 반론을 제시합니다.' },
  { id: 'no-comment', name: '답변을 유보한다', approach: '사생활·안보·수사상 이유를 명시하고 답변 가능한 시점을 약속합니다.' },
  { id: 'decline', name: '인터뷰를 거절한다', approach: '이번 요청 전체를 거절합니다. 즉시 위험은 피하지만 접근성과 신뢰가 떨어집니다.' },
];

export const exposureResponseDefinitions: Array<{ id: ExposureResponseId; name: string; approach: string }> = [
  { id: 'own-terms', name: '내 말로 먼저 공개', approach: '사실과 공개 경계를 직접 설명해 폭로자의 프레임을 빼앗습니다.' },
  { id: 'privacy-rights', name: '사생활 원칙 선언', approach: '성적 지향이 공적 능력의 판단 기준이 아님을 밝히고 동의 없는 공개를 문제 삼습니다.' },
  { id: 'independent-review', name: '독립 검증 요청', approach: '보도 경위·자료 조작·불법 사찰 여부를 독립기관이 검증하게 합니다.' },
  { id: 'legal-protection', name: '법적 보호 신청', approach: '신원정보 비공개와 정정보도를 요청합니다. 언론법과 가족법 수준에 따라 결과가 달라집니다.' },
  { id: 'attack-source', name: '제보자를 공격', approach: '경쟁자의 동기를 전면에 내세웁니다. 증거가 강하면 역풍이 큽니다.' },
];

const initialLawByNation: Partial<Record<NationId, MediaLawId>> = {
  britain: 'plural-press',
  usa: 'plural-press',
  freefrance: 'plural-press',
  india: 'licensed-press',
  philippines: 'licensed-press',
  korea: 'licensed-press',
  china: 'licensed-press',
  italy: 'licensed-press',
  indonesia: 'licensed-press',
  vietnam: 'licensed-press',
  ussr: 'wartime-censorship',
  germany: 'wartime-censorship',
  japan: 'wartime-censorship',
};

const branchRivals: Record<CareerBranch, [string, string]> = {
  military: ['총참모부 내 승진 경쟁파', '전역 지휘권을 노리는 유력 장성'],
  politics: ['당내 지도부 경쟁파', '차기 권력 승계를 노리는 유력 후보'],
  intelligence: ['정보기관 내부 감찰파', '공작 주도권을 다투는 방첩 책임자'],
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function seededPercent(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 10000 / 100;
}

function addHistory(state: MediaRelationsState, record: MediaHistoryRecord) {
  return [record, ...state.history].slice(0, 120);
}

export function getMediaLaw(lawId: MediaLawId) {
  return mediaLawDefinitions.find((law) => law.id === lawId) ?? mediaLawDefinitions[0];
}

export function getMediaTopic(topicId: MediaTopicId) {
  return mediaTopicDefinitions.find((topic) => topic.id === topicId) ?? mediaTopicDefinitions[0];
}

export function getExposureStageLabel(stage: ExposureStage) {
  if (stage === 'rumor') return '제보·소문';
  if (stage === 'verification') return '취재·교차검증';
  if (stage === 'published') return '보도됨';
  return '해결·기록';
}

export function getEraInterviewFormat(year: number) {
  const era = getNewsMediaEra(year);
  if (era.id === 'wartime-press') return '신문 서면 문답·기자회견';
  if (era.id === 'radio-wire') return '라디오 생방송 대담';
  if (era.id === 'television-bulletin') return '텔레비전 스튜디오 인터뷰';
  if (era.id === 'satellite-network') return '위성 생중계 특별대담';
  if (era.id === 'web-edition') return '온라인 장문 인터뷰·실시간 문답';
  if (era.id === 'live-feed') return '라이브 스트림·실시간 검증 인터뷰';
  return '시민 검증망 공개 질의·분산 중계';
}

export function getMediaOutlets(year: number): MediaOutlet[] {
  const era = getNewsMediaEra(year);
  const suffix = era.id === 'wartime-press' ? '일보' : era.id === 'radio-wire' ? '라디오' : era.id === 'television-bulletin' ? '방송' : era.id === 'satellite-network' ? '24' : era.id === 'web-edition' ? '온라인' : era.id === 'live-feed' ? '라이브' : '공공망';
  return [
    { id: 'state', name: `국가공보 ${suffix}`, desk: '정부 출입실', editorialLine: '정부 발표·질서 우선', reach: 78, rigor: 42, independence: 10 },
    { id: 'public', name: `공영 ${suffix}`, desk: '공공정책부', editorialLine: '공익·균형·책임', reach: 74, rigor: 72, independence: 58 },
    { id: 'independent', name: `독립시보 ${suffix}`, desk: '탐사보도팀', editorialLine: '권력 감시·자료 검증', reach: 62, rigor: 82, independence: 88 },
    { id: 'partisan', name: `민중논단 ${suffix}`, desk: '정치부', editorialLine: '야당·경쟁파·대중 동원', reach: 57, rigor: 48, independence: 66 },
    { id: 'international', name: `세계통신 ${suffix}`, desk: '국제 편집국', editorialLine: '국제 비교·외교 파장', reach: 86, rigor: 76, independence: 80 },
  ];
}

function chooseOutlet(state: MediaRelationsState, context: MediaRelationsContext, purpose: 'interview' | 'exposure') {
  const outlets = getMediaOutlets(context.year);
  if (state.lawId === 'wartime-censorship') return outlets[0];
  const eligible = state.lawId === 'licensed-press' ? outlets.filter((outlet) => outlet.id !== 'independent') : outlets.slice(1);
  const offset = purpose === 'exposure' ? 2 : 0;
  return eligible[(context.week + context.role.tier + offset) % eligible.length];
}

function questionFor(topicId: MediaTopicId, context: MediaRelationsContext, exposure: ExposureIncident | null) {
  if (topicId === 'personal-life') return exposure
    ? `${exposure.instigator}의 제보가 취재 중입니다. 공개할 사실과 끝까지 지킬 사생활의 경계는 어디입니까?`
    : '공적 책임과 개인의 관계·가족생활 사이의 경계를 국민에게 어떻게 설명하시겠습니까?';
  if (topicId === 'economy') return `물가 ${context.inflation.toFixed(1)}%와 국민 신뢰 ${Math.round(context.publicConfidence)}/100 앞에서, 이번 정책의 비용과 확인 시점은 언제입니까?`;
  if (topicId === 'security') return `안정도 ${Math.round(context.stability)}/100인 상황에서 안보를 이유로 공개하지 않는 정보의 범위는 누가 통제합니까?`;
  if (topicId === 'election') return `정통성 ${Math.round(context.legitimacy)}/100인 현 정부가 경쟁자에게도 같은 언론 접근과 권력 이양 원칙을 보장합니까?`;
  if (topicId === 'foreign-policy') return '동맹과 경쟁국 모두에게 적용할 외교 원칙과 넘지 않을 선을 구체적으로 밝혀주십시오.';
  return `불안 ${Math.round(context.unrest)}/100인 국가를 어디로 이끌며, 국민이 다음 13주 안에 확인할 수 있는 결과는 무엇입니까?`;
}

function topicForContext(state: MediaRelationsState, context: MediaRelationsContext): MediaTopicId {
  if (state.activeExposure && state.activeExposure.stage !== 'resolved') return 'personal-life';
  if (context.activeElection) return 'election';
  if (context.inflation >= 9) return 'economy';
  if (context.unrest >= 62 || context.stability <= 42) return 'security';
  return context.week % 2 === 0 ? 'national-vision' : 'foreign-policy';
}

function createInterviewRequest(state: MediaRelationsState, context: MediaRelationsContext, topicId: MediaTopicId, initiator: InterviewInitiator): InterviewRequest {
  const outlet = chooseOutlet(state, context, 'interview');
  return {
    id: `interview-${context.week}-${initiator}-${topicId}`,
    requestedWeek: context.week,
    deadlineWeek: context.week + 1,
    initiator,
    outlet,
    topicId,
    format: getEraInterviewFormat(context.year),
    question: questionFor(topicId, context, state.activeExposure),
    context: initiator === 'player'
      ? `${getMediaTopic(topicId).purpose} 편집국이 독립 질문을 추가할 수 있습니다.`
      : `${outlet.editorialLine} 성향의 ${outlet.desk}이 현재 지지·반대 여론을 근거로 요청했습니다.`,
    pressure: clamp(28 + context.role.tier * -3 + context.unrest * .25 + (state.activeExposure ? 22 : 0)),
  };
}

export function createMediaRelationsState(nationId: NationId, startedWeek = 0): MediaRelationsState {
  const lawId = initialLawByNation[nationId] ?? 'licensed-press';
  const law = getMediaLaw(lawId);
  return {
    version: 1,
    nationId,
    lawId,
    freedom: law.freedomTarget,
    pressTrust: 50,
    access: law.independentInterviews ? 56 : 22,
    hostility: 26,
    nextInterviewWeek: startedWeek + 3,
    lastExposureWeek: null,
    pendingInterview: null,
    activeExposure: null,
    interviewsCompleted: 0,
    history: [],
  };
}

export function normalizeMediaRelationsState(value: unknown, nationId: NationId, startedWeek = 0): MediaRelationsState {
  const fallback = createMediaRelationsState(nationId, startedWeek);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<MediaRelationsState>;
  const validLaw = mediaLawDefinitions.some((law) => law.id === candidate.lawId);
  return {
    ...fallback,
    ...candidate,
    version: 1,
    nationId,
    lawId: validLaw ? candidate.lawId! : fallback.lawId,
    freedom: clamp(Number(candidate.freedom ?? fallback.freedom)),
    pressTrust: clamp(Number(candidate.pressTrust ?? fallback.pressTrust)),
    access: clamp(Number(candidate.access ?? fallback.access)),
    hostility: clamp(Number(candidate.hostility ?? fallback.hostility)),
    pendingInterview: candidate.pendingInterview && typeof candidate.pendingInterview === 'object' ? candidate.pendingInterview : null,
    activeExposure: candidate.activeExposure && typeof candidate.activeExposure === 'object' ? candidate.activeExposure : null,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 120) : [],
  };
}

function identitySubject(personalLife: PersonalLifeState) {
  const orientation = personalLife.profile.orientation;
  if (orientation !== 'private' && orientation !== 'heterosexual') return `${getOrientationLabel(orientation)} 정체성`;
  const relationship = personalLife.activeRelationship;
  if (relationship?.pairKind === 'same-gender') return '동성 관계';
  if (relationship?.pairKind === 'gender-diverse') return '성별 다양성을 포함한 관계';
  return '개인적 관계와 가족생활';
}

function hasSensitiveIdentity(personalLife: PersonalLifeState) {
  const orientation = personalLife.profile.orientation;
  return personalLife.profile.configured && (
    (orientation !== 'private' && orientation !== 'heterosexual')
    || personalLife.activeRelationship?.pairKind === 'same-gender'
    || personalLife.activeRelationship?.pairKind === 'gender-diverse'
  );
}

function rivalForContext(context: MediaRelationsContext) {
  const rivals = branchRivals[context.role.branch];
  if (context.activeElection && context.role.branch === 'politics') return '전국 지지율을 다투는 유력 경쟁 후보';
  if (context.role.tier === 1) return '후계 구도를 노리는 최고위 권력 경쟁자';
  return rivals[(context.week + context.role.tier) % rivals.length];
}

export function calculateDisclosureRisk(state: MediaRelationsState, context: MediaRelationsContext): DisclosureRiskAssessment {
  const relationship = context.personalLife.activeRelationship;
  const law = getMediaLaw(state.lawId);
  const familyLaw = getFamilyLaw(context.personalLife.familyLawId);
  const factors: DisclosureRiskAssessment['factors'] = [];
  const publicOffice = context.role.tier === 1 ? 22 : context.role.tier === 2 ? 16 : context.role.tier === 3 ? 10 : 5;
  factors.push({ label: '보직·공적 관심', value: publicOffice, detail: `${context.role.title} · ${context.role.tier}단계 보직의 검증·공격 가치` });
  const groupPressure = context.role.branch === 'politics' ? 14 : context.role.branch === 'intelligence' ? 17 : 11;
  factors.push({ label: '소속 집단 경쟁', value: groupPressure, detail: `${rivalForContext(context)}가 인사·정책 주도권을 다툽니다.` });
  const legalPressure = hasSensitiveIdentity(context.personalLife)
    ? context.personalLife.familyLawId === 'restrictive-code' ? 24 : context.personalLife.familyLawId === 'private-life-protection' ? 12 : context.personalLife.familyLawId === 'civil-partnerships' ? 6 : 1
    : 0;
  factors.push({ label: '법·집단 규범', value: legalPressure, detail: `${familyLaw.name} 아래에서 정체성이 정치 공격 소재가 될 가능성` });
  const secrecy = relationship?.visibility === 'secret' ? 18 : relationship?.visibility === 'private' ? 9 : 1;
  factors.push({ label: '공개 경계', value: secrecy, detail: relationship ? `${relationship.candidate.name}와의 관계가 ${relationship.visibility === 'secret' ? '비밀' : relationship.visibility === 'private' ? '비공개' : '공개'} 상태` : '확인된 관계 정보 없음' });
  const crisis = round(Math.max(0, context.unrest - 42) * .24 + (context.activeElection ? 12 : 0), 0);
  factors.push({ label: '정치적 기회', value: crisis, detail: `사회 불안 ${Math.round(context.unrest)}${context.activeElection ? ' · 선거 경쟁 중' : ''}` });
  const protectionValue = round(
    (law.sourceProtection ? 5 : 0)
    + (context.personalLife.familyLawId === 'private-life-protection' ? 10 : context.personalLife.familyLawId === 'civil-partnerships' ? 13 : context.personalLife.familyLawId === 'marriage-equality' ? 18 : 0)
    + context.institutionalCapacity * .08,
    0,
  );
  const score = clamp(factors.reduce((sum, factor) => sum + factor.value, 0) - protectionValue);
  const publicationAccess = state.lawId === 'wartime-censorship' ? 0.72 : state.freedom >= 60 ? 1.05 : .88;
  const weeklyChance = hasSensitiveIdentity(context.personalLife)
    ? round(clamp((score - 20) * .19 * publicationAccess, .4, 18), 1)
    : 0;
  return {
    score: Math.round(score),
    weeklyChance,
    subject: identitySubject(context.personalLife),
    likelyInstigator: rivalForContext(context),
    factors,
    protection: `${familyLaw.name} · ${law.name} · 제도 역량 ${Math.round(context.institutionalCapacity)}`,
  };
}

export function canReformMediaLaw(state: MediaRelationsState, lawId: MediaLawId, context: MediaRelationsContext) {
  const target = getMediaLaw(lawId);
  const currentIndex = mediaLawDefinitions.findIndex((law) => law.id === state.lawId);
  const targetIndex = mediaLawDefinitions.findIndex((law) => law.id === lawId);
  if (state.lawId === lawId) return { allowed: false, reason: '이미 시행 중인 언론법입니다.' };
  if (context.role.tier > 2 || (context.role.branch !== 'politics' && context.role.tier > 1)) return { allowed: false, reason: '국가원수 또는 상급 정치 보직의 입법 권한이 필요합니다.' };
  if (context.politicalPower < target.politicalCost) return { allowed: false, reason: `정치력 ${target.politicalCost}가 필요합니다.` };
  if (context.treasury < target.treasuryCost) return { allowed: false, reason: `언론중재·공영 기반 예산 ${target.treasuryCost}M이 필요합니다.` };
  if (context.education < target.requiredEducation) return { allowed: false, reason: `교육 ${target.requiredEducation}가 필요합니다.` };
  if (context.institutionalCapacity < target.requiredInstitutions) return { allowed: false, reason: `제도 역량 ${target.requiredInstitutions}가 필요합니다.` };
  if (context.legitimacy < target.requiredLegitimacy) return { allowed: false, reason: `정통성 ${target.requiredLegitimacy}가 필요합니다.` };
  return { allowed: true, reason: targetIndex > currentIndex ? '자유화 개혁 가능' : '통제 강화 가능' };
}

export function reformMediaLaw(state: MediaRelationsState, lawId: MediaLawId, context: MediaRelationsContext): MediaActionResult | null {
  const eligibility = canReformMediaLaw(state, lawId, context);
  if (!eligibility.allowed) return null;
  const target = getMediaLaw(lawId);
  const currentIndex = mediaLawDefinitions.findIndex((law) => law.id === state.lawId);
  const targetIndex = mediaLawDefinitions.findIndex((law) => law.id === lawId);
  const liberalizing = targetIndex > currentIndex;
  const next = {
    ...state,
    lawId,
    freedom: clamp(state.freedom + (target.freedomTarget - state.freedom) * .35),
    pressTrust: clamp(state.pressTrust + (liberalizing ? 8 : -10)),
    hostility: clamp(state.hostility + (liberalizing ? -4 : 12)),
  };
  next.history = addHistory(next, {
    id: `media-law-${context.week}-${lawId}`,
    week: context.week,
    title: `언론법 개정 · ${target.name}`,
    detail: `${target.principle}. ${target.description}`,
    tone: liberalizing ? 'good' : 'bad',
  });
  return {
    state: next,
    personalLife: context.personalLife,
    politicalPowerDelta: -target.politicalCost,
    treasuryDelta: -target.treasuryCost,
    stabilityDelta: liberalizing ? -1 : 1,
    legitimacyDelta: liberalizing ? 3 : -3,
    unrestDelta: liberalizing ? -1 : 3,
    publicConfidenceDelta: liberalizing ? 5 : -5,
    title: `언론법 개정 · ${target.name}`,
    detail: `${target.principle} 원칙이 시행됩니다. 언론 자유 목표 ${target.freedomTarget}/100, 언론 신뢰 ${liberalizing ? '+8' : '-10'}.`,
  };
}

export function requestPressInterview(state: MediaRelationsState, topicId: MediaTopicId, context: MediaRelationsContext): MediaActionResult | null {
  const law = getMediaLaw(state.lawId);
  if (state.pendingInterview || !law.independentInterviews || state.access < 25 || context.politicalPower < 2) return null;
  const request = createInterviewRequest(state, context, topicId, 'player');
  const next = {
    ...state,
    pendingInterview: request,
    access: clamp(state.access + 1),
    nextInterviewWeek: Math.max(state.nextInterviewWeek, context.week + 4),
  };
  next.history = addHistory(next, {
    id: `outbound-interview-${context.week}-${topicId}`,
    week: context.week,
    title: `${request.outlet.name}에 인터뷰 요청`,
    detail: `${getMediaTopic(topicId).name} 의제로 ${request.format}을 잡았습니다. 편집국의 독립 질문에 답해야 합니다.`,
    tone: 'neutral',
  });
  return {
    state: next,
    personalLife: context.personalLife,
    politicalPowerDelta: -2,
    treasuryDelta: 0,
    stabilityDelta: 0,
    legitimacyDelta: 0,
    unrestDelta: 0,
    publicConfidenceDelta: 0,
    title: `인터뷰 제안 · ${request.outlet.name}`,
    detail: `${request.format} 일정이 잡혔습니다. 제${request.deadlineWeek + 1}주가 끝나기 전에 답변 방식을 고르십시오.`,
  };
}

export function previewInterviewResponse(request: InterviewRequest, responseId: InterviewResponseId, context: Pick<MediaRelationsContext, 'personalLife'>) {
  const personal = request.topicId === 'personal-life' || Boolean(context.personalLife.activeRelationship);
  if (responseId === 'candid') return { trust: 8, access: 5, hostility: -3, legitimacy: personal ? 2 : 3, unrest: personal ? 1 : -1, label: '신뢰 +8 · 접근 +5 · 발언 공개' };
  if (responseId === 'values-first') return { trust: 5, access: 3, hostility: -2, legitimacy: 2, unrest: -1, label: '신뢰 +5 · 정통성 +2 · 의제 전환' };
  if (responseId === 'fact-check') return { trust: request.outlet.rigor >= 65 ? 7 : 3, access: 2, hostility: 1, legitimacy: 1, unrest: -1, label: `신뢰 +${request.outlet.rigor >= 65 ? 7 : 3} · 기록 반론 · 적대 +1` };
  if (responseId === 'no-comment') return { trust: -3, access: -2, hostility: 4, legitimacy: -1, unrest: 1, label: '신뢰 -3 · 적대 +4 · 후속 질문 예약' };
  return { trust: -7, access: -8, hostility: 7, legitimacy: -2, unrest: 1, label: '신뢰 -7 · 접근 -8 · 요청 종료' };
}

export function respondToInterview(state: MediaRelationsState, responseId: InterviewResponseId, context: MediaRelationsContext): MediaActionResult | null {
  const request = state.pendingInterview;
  if (!request) return null;
  const preview = previewInterviewResponse(request, responseId, context);
  const relationship = context.personalLife.activeRelationship;
  const personalTopic = request.topicId === 'personal-life';
  const publishedPersonalLife = personalTopic && responseId === 'candid' && relationship
    ? {
      ...context.personalLife,
      activeRelationship: {
        ...relationship,
        visibility: 'public' as const,
        exposure: clamp(relationship.exposure + 18),
        trust: clamp(relationship.trust + 4),
        publicSupport: clamp(relationship.publicSupport + 5),
      },
    }
    : context.personalLife;
  const next = {
    ...state,
    pendingInterview: null,
    pressTrust: clamp(state.pressTrust + preview.trust),
    access: clamp(state.access + preview.access),
    hostility: clamp(state.hostility + preview.hostility),
    interviewsCompleted: state.interviewsCompleted + 1,
    nextInterviewWeek: context.week + 5 + (context.week % 4),
  };
  const responseName = interviewResponseDefinitions.find((response) => response.id === responseId)?.name ?? responseId;
  next.history = addHistory(next, {
    id: `interview-answer-${context.week}-${request.id}`,
    week: context.week,
    title: `${request.outlet.name} 인터뷰 · ${responseName}`,
    detail: `${request.question} — ${preview.label}`,
    tone: preview.trust >= 5 ? 'good' : preview.trust < 0 ? 'bad' : 'neutral',
  });
  return {
    state: next,
    personalLife: publishedPersonalLife,
    politicalPowerDelta: responseId === 'fact-check' ? -2 : 0,
    treasuryDelta: 0,
    stabilityDelta: preview.unrest < 0 ? 1 : 0,
    legitimacyDelta: preview.legitimacy,
    unrestDelta: preview.unrest,
    publicConfidenceDelta: round(preview.trust * .35, 1),
    title: `언론 인터뷰 · ${request.outlet.name}`,
    detail: `${responseName}. ${preview.label}${personalTopic && responseId === 'candid' ? ' 공개 범위가 공개로 전환되었습니다.' : ''}`,
  };
}

function adjustRelationshipForExposure(personalLife: PersonalLifeState, input: { trust: number; strain: number; support: number; visibility?: 'public' | 'private' | 'secret' }) {
  const relationship = personalLife.activeRelationship;
  if (!relationship) return personalLife;
  return {
    ...personalLife,
    activeRelationship: {
      ...relationship,
      trust: clamp(relationship.trust + input.trust),
      strain: clamp(relationship.strain + input.strain),
      publicSupport: clamp(relationship.publicSupport + input.support),
      visibility: input.visibility ?? relationship.visibility,
      exposure: clamp(relationship.exposure + (input.visibility === 'public' ? 24 : input.visibility === 'private' ? -8 : 0)),
    },
  };
}

export function resolveExposureIncident(state: MediaRelationsState, responseId: ExposureResponseId, context: MediaRelationsContext): MediaActionResult | null {
  const incident = state.activeExposure;
  if (!incident || incident.stage === 'resolved') return null;
  const familyLaw = getFamilyLaw(context.personalLife.familyLawId);
  const mediaLaw = getMediaLaw(state.lawId);
  let legitimacy = 0;
  let unrest = 0;
  let stability = 0;
  let confidence = 0;
  let political = 0;
  let treasury = 0;
  let trust = 0;
  let access = 0;
  let hostility = 0;
  let relationship = context.personalLife;
  let resolution = '';

  if (responseId === 'own-terms') {
    const protectedByLaw = context.personalLife.familyLawId === 'marriage-equality' || context.personalLife.familyLawId === 'civil-partnerships';
    legitimacy = protectedByLaw ? 5 : context.personalLife.familyLawId === 'restrictive-code' ? -4 : 2;
    unrest = protectedByLaw ? -2 : context.personalLife.familyLawId === 'restrictive-code' ? 5 : 1;
    confidence = 6;
    trust = 8;
    hostility = -6;
    relationship = adjustRelationshipForExposure(context.personalLife, { trust: 9, strain: -5, support: protectedByLaw ? 9 : -2, visibility: 'public' });
    resolution = `본인이 ${incident.subject}의 공개 범위를 직접 정했습니다. ${familyLaw.name} 아래의 사회 반응이 적용되었습니다.`;
  } else if (responseId === 'privacy-rights') {
    const protection = context.personalLife.familyLawId === 'restrictive-code' ? 0 : context.personalLife.familyLawId === 'private-life-protection' ? 2 : 4;
    legitimacy = 2 + protection;
    unrest = protection >= 2 ? -2 : 1;
    confidence = 4;
    trust = mediaLaw.sourceProtection ? 5 : 2;
    relationship = adjustRelationshipForExposure(context.personalLife, { trust: 7, strain: -4, support: protection * 2, visibility: 'private' });
    resolution = '공적 능력과 사생활을 분리하는 원칙을 선언하고 동의 없는 공개에 반론권을 행사했습니다.';
  } else if (responseId === 'independent-review') {
    if (context.institutionalCapacity < 42 || context.treasury < 10) return null;
    political = -3;
    treasury = -10;
    const reliable = incident.evidenceQuality >= 62;
    legitimacy = 3;
    unrest = -1;
    confidence = 5;
    trust = 7;
    access = 2;
    relationship = adjustRelationshipForExposure(context.personalLife, { trust: 6, strain: -3, support: reliable ? 2 : 6 });
    resolution = reliable
      ? '독립 검증은 자료의 일부가 사실이지만 취득·공개 과정이 사생활 침해였다고 결론냈습니다.'
      : '독립 검증은 제보 자료가 편집·과장되었으며 폭로자의 정치적 동기를 확인했습니다.';
  } else if (responseId === 'legal-protection') {
    if (context.personalLife.familyLawId === 'restrictive-code' || context.politicalPower < 5 || context.treasury < 6) return null;
    political = -5;
    treasury = -6;
    legitimacy = mediaLaw.sourceProtection && incident.stage === 'published' ? -1 : 2;
    unrest = -1;
    confidence = 2;
    trust = mediaLaw.sourceProtection ? -3 : 1;
    access = -2;
    relationship = adjustRelationshipForExposure(context.personalLife, { trust: 5, strain: -4, support: 2, visibility: 'private' });
    resolution = '법원이 식별정보 비공개·정정 절차를 명령했습니다. 취재원 보호와 충돌한 부분은 공개 기록에 남습니다.';
  } else {
    const backfire = incident.evidenceQuality >= 58;
    legitimacy = backfire ? -7 : 1;
    unrest = backfire ? 5 : 1;
    stability = backfire ? -2 : 0;
    confidence = backfire ? -7 : -2;
    trust = backfire ? -10 : -4;
    hostility = 12;
    relationship = adjustRelationshipForExposure(context.personalLife, { trust: -5, strain: 10, support: backfire ? -9 : -3 });
    resolution = backfire ? '증거가 확인되며 제보자 공격이 역풍을 맞았습니다.' : '제보자의 정치적 동기는 드러났지만 사생활 논쟁은 끝나지 않았습니다.';
  }

  const resolvedIncident = { ...incident, stage: 'resolved' as const, updatedWeek: context.week, resolution };
  const next = {
    ...state,
    activeExposure: resolvedIncident,
    pressTrust: clamp(state.pressTrust + trust),
    access: clamp(state.access + access),
    hostility: clamp(state.hostility + hostility),
  };
  next.history = addHistory(next, {
    id: `exposure-resolution-${context.week}-${incident.id}`,
    week: context.week,
    title: `폭로 대응 · ${exposureResponseDefinitions.find((response) => response.id === responseId)?.name ?? responseId}`,
    detail: resolution,
    tone: legitimacy >= 2 ? 'good' : legitimacy < 0 ? 'bad' : 'neutral',
  });
  return {
    state: next,
    personalLife: relationship,
    politicalPowerDelta: political,
    treasuryDelta: treasury,
    stabilityDelta: stability,
    legitimacyDelta: legitimacy,
    unrestDelta: unrest,
    publicConfidenceDelta: confidence,
    title: '사생활 폭로 대응 결과',
    detail: resolution,
  };
}

function createExposureIncident(state: MediaRelationsState, context: MediaRelationsContext, assessment: DisclosureRiskAssessment): ExposureIncident {
  const outlet = chooseOutlet(state, context, 'exposure');
  const evidenceQuality = Math.round(clamp(28 + outlet.rigor * .42 + context.intelNetwork * .18 + seededPercent(`${state.nationId}-${context.week}-evidence`) * .18));
  return {
    id: `exposure-${state.nationId}-${context.week}`,
    openedWeek: context.week,
    updatedWeek: context.week,
    stage: 'rumor',
    subject: assessment.subject,
    instigator: assessment.likelyInstigator,
    motive: `${context.role.title}의 권한·승진·후계 구도를 약화하려는 경쟁`,
    outlet,
    evidenceQuality,
    publicAttention: Math.round(clamp(36 + context.unrest * .28 + (context.activeElection ? 18 : 0) + outlet.reach * .18)),
    privacyViolation: true,
    resolution: null,
  };
}

export function advanceMediaRelationsWeek(state: MediaRelationsState, context: MediaRelationsContext): MediaWeeklyEffects {
  const law = getMediaLaw(state.lawId);
  const government = getGovernmentForm(context.governmentFormId);
  const formAdjustment = government.id === 'parliamentary-republic' ? 6 : government.id === 'constitutional-monarchy' ? 3 : government.id === 'peoples-commonwealth' ? 0 : -8;
  const strategyAdjustment = context.strategyId === 'open-republic' ? 8 : context.strategyId === 'security-republic' ? -12 : 0;
  const capacityAdjustment = (context.education + context.institutionalCapacity - 100) * .08;
  const freedomTarget = clamp(law.freedomTarget + formAdjustment + strategyAdjustment + capacityAdjustment);
  let next: MediaRelationsState = {
    ...state,
    freedom: clamp(state.freedom + (freedomTarget - state.freedom) * .035),
    hostility: clamp(state.hostility + (context.unrest > 60 ? .12 : -.06)),
  };
  let personalLife = context.personalLife;
  let legitimacy = 0;
  let unrest = 0;
  let stability = 0;
  let publicConfidence = 0;
  const events: MediaWeeklyEvent[] = [];

  if (next.activeExposure?.stage === 'resolved' && context.week - next.activeExposure.updatedWeek >= 8) {
    next = { ...next, activeExposure: null };
  }

  if (next.pendingInterview && context.week > next.pendingInterview.deadlineWeek) {
    const expired = next.pendingInterview;
    next = {
      ...next,
      pendingInterview: null,
      pressTrust: clamp(next.pressTrust - 3),
      access: clamp(next.access - 4),
      hostility: clamp(next.hostility + 2),
      nextInterviewWeek: context.week + 4,
    };
    next.history = addHistory(next, {
      id: `interview-expired-${context.week}-${expired.id}`,
      week: context.week,
      title: '인터뷰 요청 기한 만료',
      detail: `${expired.outlet.name}의 ${getMediaTopic(expired.topicId).name} 인터뷰에 답하지 않았습니다.`,
      tone: 'bad',
    });
    legitimacy -= 1;
    publicConfidence -= 1;
    events.push({
      id: `media-expired-${context.week}`,
      title: `${expired.outlet.name}, 답변 없는 권력을 지적`,
      detail: `${expired.question}에 대한 답변 기한이 지났습니다.`,
      tone: 'neutral',
      cause: '언론 인터뷰 요청이 답변·거절 선택 없이 만료되었습니다.',
      consequence: '언론 접근 -4, 언론 신뢰 -3. 다음 인터뷰의 질문 강도가 높아집니다.',
    });
  }

  if (next.activeExposure && next.activeExposure.stage !== 'resolved') {
    const age = context.week - next.activeExposure.openedWeek;
    if (age >= 2 && next.activeExposure.stage !== 'published') {
      const incident = { ...next.activeExposure, stage: 'published' as const, updatedWeek: context.week };
      const protectedByLaw = context.personalLife.familyLawId !== 'restrictive-code';
      next = { ...next, activeExposure: incident, pressTrust: clamp(next.pressTrust + (incident.outlet.rigor >= 70 ? 2 : -2)), hostility: clamp(next.hostility + 5) };
      personalLife = adjustRelationshipForExposure(personalLife, { trust: -4, strain: 9, support: protectedByLaw ? -2 : -8 });
      legitimacy += protectedByLaw ? -1 : -5;
      unrest += protectedByLaw ? 2 : 6;
      stability -= protectedByLaw ? 0 : 2;
      publicConfidence -= 3;
      events.push({
        id: `media-exposure-published-${context.week}`,
        title: `${incident.outlet.name}, ${incident.subject} 관련 자료 보도`,
        detail: `${incident.instigator}의 제보가 ${incident.evidenceQuality}/100 수준의 증거와 함께 보도되었습니다. 동의 없는 공개라는 반론도 함께 제기됩니다.`,
        tone: 'bad',
        cause: `${incident.motive}. 보도 전 대응이 끝나지 않은 채 검증 단계가 완료되었습니다.`,
        consequence: `${getFamilyLaw(context.personalLife.familyLawId).name}에 따라 정치적 반발이 계산되었습니다. 언론 상황실에서 대응을 선택할 수 있습니다.`,
      });
    } else if (age >= 1 && next.activeExposure.stage === 'rumor') {
      const incident = { ...next.activeExposure, stage: 'verification' as const, updatedWeek: context.week };
      next = { ...next, activeExposure: incident };
      events.push({
        id: `media-exposure-verify-${context.week}`,
        title: `${incident.outlet.name}, 사생활 제보 교차검증 착수`,
        detail: `편집국이 ${incident.subject} 관련 자료의 출처·취득 경위·공익성을 검토하고 있습니다.`,
        tone: 'neutral',
        cause: `${incident.instigator}가 경쟁 국면에서 자료를 전달했습니다.`,
        consequence: '다음 주 보도 전에 공개 범위 선언, 독립 검증, 법적 보호 또는 제보자 대응을 선택할 수 있습니다.',
      });
    }
  }

  const assessment = calculateDisclosureRisk(next, { ...context, personalLife });
  const exposureOffCooldown = next.lastExposureWeek === null || context.week - next.lastExposureWeek >= 26;
  if (!next.activeExposure && exposureOffCooldown && assessment.weeklyChance > 0 && seededPercent(`${state.nationId}-${context.week}-outing`) < assessment.weeklyChance) {
    const incident = createExposureIncident(next, { ...context, personalLife }, assessment);
    next = { ...next, activeExposure: incident, lastExposureWeek: context.week, hostility: clamp(next.hostility + 4) };
    next.history = addHistory(next, {
      id: `exposure-open-${context.week}`,
      week: context.week,
      title: `사생활 폭로 제보 포착 · ${incident.outlet.name}`,
      detail: `${incident.instigator}가 ${incident.subject} 관련 자료를 전달했습니다. 아직 보도 전이며 증거 신뢰도는 ${incident.evidenceQuality}/100입니다.`,
      tone: 'bad',
    });
    events.push({
      id: `media-exposure-open-${context.week}`,
      title: '유력 경쟁자의 사생활 제보 포착',
      detail: `${incident.instigator}가 ${incident.outlet.name}에 ${incident.subject} 관련 자료를 전달했습니다.`,
      tone: 'bad',
      cause: `${context.role.title}의 공적 지위, 소속 집단 경쟁, ${getFamilyLaw(context.personalLife.familyLawId).name}, 공개 경계가 함께 위험을 만들었습니다.`,
      consequence: '즉시 능력치가 깎이지 않습니다. 취재·검증이 진행되며 사용자의 대응과 법·언론 환경이 결과를 결정합니다.',
    });
  }

  if (!next.pendingInterview && context.week >= next.nextInterviewWeek) {
    const topicId = topicForContext(next, context);
    const request = createInterviewRequest(next, context, topicId, 'media');
    next = { ...next, pendingInterview: request };
    next.history = addHistory(next, {
      id: `incoming-interview-${context.week}`,
      week: context.week,
      title: `${request.outlet.name} 인터뷰 요청`,
      detail: `${request.format} · ${request.question}`,
      tone: 'neutral',
    });
    events.push({
      id: `media-interview-request-${context.week}`,
      title: `${request.outlet.name}, ${context.role.title}에게 인터뷰 요청`,
      detail: request.question,
      tone: 'neutral',
      cause: `${request.outlet.editorialLine} 편집 방향과 현재 국민 여론이 질문 의제를 결정했습니다.`,
      consequence: `제${request.deadlineWeek + 1}주까지 답변 방식을 고르지 않으면 언론 접근과 신뢰가 낮아집니다.`,
    });
  }

  return {
    state: next,
    personalLife,
    legitimacy,
    unrest,
    stability,
    publicConfidence,
    events,
    note: `${law.name} · 자유 ${Math.round(next.freedom)} · 신뢰 ${Math.round(next.pressTrust)} · 접근 ${Math.round(next.access)}${next.pendingInterview ? ' · 인터뷰 답변 대기' : ''}${next.activeExposure && next.activeExposure.stage !== 'resolved' ? ` · 폭로 ${getExposureStageLabel(next.activeExposure.stage)}` : ''}`,
  };
}
