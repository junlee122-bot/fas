import { careerRoles, nations } from './campaign';
import { getCivilianSyntheticRole } from './civilianCareer';
import { withJosa } from './koreanGrammar';
import {
  createClandestineCareerState,
  normalizeClandestineCareerState,
} from './clandestineCareer';
import type { ClandestineCareerState } from './clandestineCareer';
import type {
  CareerBranch,
  CareerRole,
  CareerState,
  CareerTier,
  GameState,
  NationId,
} from './types';

export type CareerAffiliationStatus =
  | 'serving'
  | 'dismissed'
  | 'unattached'
  | 'exile'
  | 'defector'
  | 'double-agent';

export type ForeignCareerOfferKind =
  | 'official-appointment'
  | 'asylum-and-post'
  | 'government-in-exile'
  | 'secret-retainer'
  | 'sell-secrets'
  | 'double-agent'
  | 'state-betrayal';

export type ForeignCareerOfferStatus =
  | 'pending'
  | 'exploring'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'reported'
  | 'turned'
  | 'expired';

export type CareerOfferResponse =
  | 'defer'
  | 'explore'
  | 'negotiate'
  | 'accept'
  | 'reject'
  | 'report'
  | 'turn';

export type CareerApproachKind =
  | 'apply'
  | 'appeal'
  | 'request-asylum'
  | 'offer-secrets'
  | 'offer-double-agent';

export interface CareerOfferTerms {
  signingBonus: number;
  weeklyRetainer: number;
  authority: number;
  protection: number;
  extraction: number;
  autonomy: 'limited' | 'operational' | 'independent';
}

export interface ForeignCareerOffer {
  id: string;
  sourceNationId: NationId;
  targetRoleId: string;
  kind: ForeignCareerOfferKind;
  status: ForeignCareerOfferStatus;
  origin: 'foreign-initiated' | 'player-initiated';
  receivedWeek: number;
  deadlineWeek: number;
  title: string;
  sender: string;
  coverChannel: string;
  pitch: string;
  demand: string;
  motive: 'money' | 'ideology' | 'compromise' | 'ego' | 'security' | 'revenge';
  secrecy: number;
  exposureRisk: number;
  credibility: number;
  acceptanceChance: number;
  terms: CareerOfferTerms;
  consequencePreview: string[];
  /** Optional for pre-CE7 saves. Each contact can be explored and renegotiated once. */
  explorationCount?: number;
  negotiationCount?: number;
}

export interface CareerMarketRecord {
  id: string;
  week: number;
  nationId: NationId;
  title: string;
  outcome: ForeignCareerOfferStatus | 'approach-failed';
  detail: string;
}

export interface CareerMarketState {
  affiliationStatus: CareerAffiliationStatus;
  offers: ForeignCareerOffer[];
  history: CareerMarketRecord[];
  lastEvaluationWeek: number;
  lastApproachWeek: number;
  unemploymentWeeks: number;
  exposure: number;
  leverage: number;
  foreignTrust: Partial<Record<NationId, number>>;
  handlerNationId: NationId | null;
  secretsDelivered: number;
  defections: number;
  clandestine: ClandestineCareerState | null;
}

export interface CareerMarketContext {
  week: number;
  career: CareerState;
  role: CareerRole;
  game: Pick<GameState, 'treasury' | 'politicalPower' | 'stability' | 'warSupport' | 'intelNetwork' | 'victoryScore' | 'enemyPressure'>;
  campaignPhase: 'war' | 'nation';
  relationByNation?: Partial<Record<NationId, number>>;
  busy?: boolean;
}

export interface CareerOfferResolution {
  state: CareerMarketState;
  offer: ForeignCareerOffer;
  transfer?: {
    nationId: NationId;
    roleId: string;
    status: Extract<CareerAffiliationStatus, 'serving' | 'exile' | 'defector'>;
  };
  gameDelta: Partial<Record<keyof GameState, number>>;
  careerDelta: {
    reputation: number;
    councilTrust: number;
    legacy: number;
  };
  title: string;
  detail: string;
  tone: 'good' | 'neutral' | 'bad';
}

export interface CareerApproachResult {
  state: CareerMarketState;
  offer?: ForeignCareerOffer;
  success: boolean;
  title: string;
  detail: string;
  careerTrustDelta: number;
  gameDelta: Partial<Record<keyof GameState, number>>;
}

export interface CareerActionEligibility {
  allowed: boolean;
  reason: string;
  politicalPowerCost: number;
}

export interface CareerOfferResponsePreview extends CareerActionEligibility {
  response: CareerOfferResponse;
  offer: ForeignCareerOffer | null;
  gameDelta: CareerOfferResolution['gameDelta'];
  careerDelta: CareerOfferResolution['careerDelta'];
  exposureDelta: number;
  termsBefore: CareerOfferTerms | null;
  termsAfter: CareerOfferTerms | null;
  deadlineWeek: number | null;
  transfer: CareerOfferResolution['transfer'] | null;
  weeklyRetainer: number;
  summary: string[];
}

export interface CareerApproachPreview extends CareerActionEligibility {
  successChance: number;
  trustDelta: number;
  exposureDelta: number;
  nextApproachWeek: number;
  summary: string[];
}

export const CAREER_OFFER_NEGOTIATION_LIMIT = 1;
export const CAREER_OFFER_EXPLORATION_LIMIT = 1;

const offerKindLabels: Record<ForeignCareerOfferKind, string> = {
  'official-appointment': '공식 보직 제안',
  'asylum-and-post': '망명·보직 패키지',
  'government-in-exile': '망명정부 합류 제안',
  'secret-retainer': '비밀 고문 계약',
  'sell-secrets': '기밀 거래 제안',
  'double-agent': '이중공작 제안',
  'state-betrayal': '정권 전복·국가 양도 제안',
};

export const careerOfferKindLabels = offerKindLabels;

export const careerOfferStatusLabels: Record<ForeignCareerOfferStatus, string> = {
  pending: '답변 대기',
  exploring: '비공식 탐색',
  negotiating: '조건 협상 중',
  accepted: '수락',
  rejected: '거절',
  reported: '상부 보고',
  turned: '역포섭',
  expired: '기한 만료',
};

export const careerAffiliationLabels: Record<CareerAffiliationStatus, string> = {
  serving: '현직 복무',
  dismissed: '해임',
  unattached: '무소속',
  exile: '망명 인사',
  defector: '전향 인사',
  'double-agent': '이중 소속',
};

export const careerApproachLabels: Record<CareerApproachKind, { title: string; detail: string }> = {
  apply: { title: '공식 보직 지원', detail: '경력과 평판을 공개하고 정식 면담을 요청합니다.' },
  appeal: { title: '비공식 자기 어필', detail: '중개인을 통해 관심과 활용 가능성을 은밀히 전달합니다.' },
  'request-asylum': { title: '망명·신변보호 요청', detail: '안전한 탈출과 새 보직을 묶어 협상합니다.' },
  'offer-secrets': { title: '기밀 접근권 제시', detail: '보유 정보의 표본을 대가와 보호 조건에 연결합니다.' },
  'offer-double-agent': { title: '이중간첩 역제안', detail: '현직을 유지하면서 상대 기관의 비밀 협조자가 되겠다고 제안합니다.' },
};

const senderByBranch: Record<CareerBranch, string[]> = {
  politics: ['대통령·수상 비서실 특사', '외무부 정치고문', '망명정부 연락대표'],
  military: ['합동참모본부 인사특사', '전구사령부 연락장교', '군사사절단장'],
  intelligence: ['해외정보부 공작관', '방첩국 비밀 연락관', '대사관 문화담당관'],
};

const channelByKind: Record<ForeignCareerOfferKind, string> = {
  'official-appointment': '중립국 대사관의 공식 면담',
  'asylum-and-post': '적십자·외교행낭을 이용한 보호 회선',
  'government-in-exile': '망명 정치조직의 공동 지인',
  'secret-retainer': '학술회의·군사사절단의 비공식 접촉',
  'sell-secrets': '일회용 암호와 안전가옥',
  'double-agent': '제3국 사업가를 가장한 공작관',
  'state-betrayal': '국가수반 직속 극비 특사',
};

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, value));
}

function hashText(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function choose<T>(items: T[], seed: string, offset = 0) {
  return items[(hashText(`${seed}:${offset}`) + offset) % items.length];
}

export function getCareerOfferNegotiationCount(offer: ForeignCareerOffer): number {
  return offer.negotiationCount ?? (offer.status === 'negotiating' ? 1 : 0);
}

export function getCareerOfferExplorationCount(offer: ForeignCareerOffer): number {
  return offer.explorationCount ?? (offer.status === 'exploring' || offer.status === 'negotiating' ? 1 : 0);
}

function isTransferOffer(offer: ForeignCareerOffer): boolean {
  return ['official-appointment', 'asylum-and-post', 'government-in-exile'].includes(offer.kind);
}

function careerContextProblem(state: CareerMarketState, context: CareerMarketContext): string | null {
  if (context.busy) return '시간 진행을 마친 뒤 접촉을 승인할 수 있습니다.';
  if (!Number.isSafeInteger(context.week) || context.week < 0) return '현재 주차를 확인할 수 없습니다. 저장 상태를 다시 확인하십시오.';
  const knownNation = nations.some((nation) => nation.id === context.career.nationId);
  // Civilian professions have exact synthetic IDs, not entries in the office
  // roster. Avoid getRole here: its fallback would also accept unknown role IDs.
  const role = knownNation
    ? careerRoles.find((entry) => entry.id === context.role.id && entry.nationId === context.career.nationId)
      ?? getCivilianSyntheticRole(context.role.id, context.career.nationId)
    : null;
  if (!role || context.career.roleId !== context.role.id || context.role.nationId !== context.career.nationId
    || role.branch !== context.role.branch || role.tier !== context.role.tier) {
    return '현재 소속·보직 정보가 바뀌었습니다. 접촉 조건을 다시 확인하십시오.';
  }
  const values = [
    context.role.authority, context.career.reputation, context.career.councilTrust,
    context.career.experience, context.career.legacy, ...Object.values(context.game),
    state.exposure, state.leverage, state.lastApproachWeek, state.secretsDelivered, state.defections,
  ];
  if (values.some((value) => !Number.isFinite(value))) return '접촉 판정에 필요한 수치가 올바르지 않습니다. 저장 상태를 다시 확인하십시오.';
  if (Object.values(context.game).some((value) => value < 0)
    || [context.career.experience, context.career.legacy, state.secretsDelivered, state.defections].some((value) => value < 0)
    || [context.career.reputation, context.career.councilTrust, context.role.authority, state.exposure, state.leverage]
      .some((value) => value < 0 || value > 100)) return '접촉 판정의 자원·평판·노출 수치가 정상 범위를 벗어났습니다.';
  if (!Object.hasOwn(careerAffiliationLabels, state.affiliationStatus)) return '현재 경력 신분을 확인할 수 없습니다.';
  return null;
}

function validOfferNumbers(offer: ForeignCareerOffer): boolean {
  return Number.isSafeInteger(offer.receivedWeek) && offer.receivedWeek >= 0
    && Number.isSafeInteger(offer.deadlineWeek) && offer.deadlineWeek >= offer.receivedWeek
    && [offer.secrecy, offer.exposureRisk, offer.credibility, offer.acceptanceChance]
      .every((value) => Number.isFinite(value) && value >= 0 && value <= 100)
    && Boolean(offer.terms)
    && [offer.terms.signingBonus, offer.terms.weeklyRetainer, offer.terms.authority,
      offer.terms.protection, offer.terms.extraction].every((value) => Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER)
    && [offer.terms.authority, offer.terms.protection, offer.terms.extraction].every((value) => value <= 100)
    && [getCareerOfferNegotiationCount(offer), getCareerOfferExplorationCount(offer)]
      .every((value) => Number.isSafeInteger(value) && value >= 0);
}

export function getCareerOfferResponseEligibility(
  state: CareerMarketState, offerId: string, response: CareerOfferResponse, context: CareerMarketContext,
): CareerActionEligibility {
  const offer = state.offers.find((entry) => entry.id === offerId);
  const politicalPowerCost = response === 'turn' ? 3 : response === 'accept' && offer && !isTransferOffer(offer) ? 4 : 0;
  const blocked = (reason: string): CareerActionEligibility => ({ allowed: false, reason, politicalPowerCost });
  const contextProblem = careerContextProblem(state, context);
  if (contextProblem) return blocked(contextProblem);
  if (!['defer', 'explore', 'negotiate', 'accept', 'reject', 'report', 'turn'].includes(response)) return blocked('지원하지 않는 회신 방식입니다.');
  if (!offer || state.offers.filter((entry) => entry.id === offerId).length !== 1) return blocked('선택한 제안이 없거나 식별 정보가 중복됐습니다. 다시 선택하십시오.');
  if (!['pending', 'exploring', 'negotiating'].includes(offer.status)) return blocked('이미 처리가 끝난 제안입니다. 경력 기록에서 결과를 확인하십시오.');
  if (!validOfferNumbers(offer) || !Object.hasOwn(offerKindLabels, offer.kind)
    || !nations.some((nation) => nation.id === offer.sourceNationId)
    || !careerRoles.some((role) => role.id === offer.targetRoleId && role.nationId === offer.sourceNationId)
    || !Number.isFinite(state.foreignTrust[offer.sourceNationId] ?? 35)) return blocked('제안의 국가·보직·조건 정보를 확인할 수 없습니다.');
  if (context.week < offer.receivedWeek) return blocked('아직 도착하지 않은 제안입니다.');
  if (context.week > offer.deadlineWeek) return blocked(`제${offer.deadlineWeek + 1}주 마감이 지나 회신할 수 없습니다.`);
  if (response === 'explore' && getCareerOfferExplorationCount(offer) >= CAREER_OFFER_EXPLORATION_LIMIT) return blocked('이 제안의 비공식 탐색은 이미 끝났습니다. 확인된 조건으로 다음 대응을 선택하십시오.');
  if (response === 'negotiate' && getCareerOfferNegotiationCount(offer) >= CAREER_OFFER_NEGOTIATION_LIMIT) return blocked('조건 재협상은 제안당 1회만 가능합니다. 수정된 최종 조건을 검토하십시오.');
  if (response === 'negotiate' && (!Number.isSafeInteger(Math.round(offer.terms.signingBonus * 1.22))
    || !Number.isSafeInteger(offer.deadlineWeek + 2))) return blocked('재협상 결과가 안전한 계산 범위를 벗어납니다. 제안 조건을 다시 확인하십시오.');
  if (response === 'turn' && context.role.branch !== 'intelligence' && context.game.intelNetwork < 68) return blocked('역포섭에는 정보 보직 또는 정보망 68 이상이 필요합니다.');
  if (response === 'report' && (state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached')) return blocked('보고할 현 소속이 없습니다. 보직에 복귀한 뒤 상부에 보고할 수 있습니다.');
  if (response === 'accept' && offer.sourceNationId === context.career.nationId) return blocked('현재 소속국의 이전 제안은 수락할 수 없습니다. 새 소속에 맞는 제안을 검토하십시오.');
  if (politicalPowerCost > 0 && context.game.politicalPower < politicalPowerCost) return blocked(`정치력 ${politicalPowerCost}이 필요합니다. 현재 ${context.game.politicalPower}입니다.`);
  return { allowed: true, reason: '검토 후 회신할 수 있습니다.', politicalPowerCost };
}

export function getCareerApproachEligibility(
  state: CareerMarketState, targetNationId: NationId, approachKind: CareerApproachKind, context: CareerMarketContext,
): CareerActionEligibility {
  const blocked = (reason: string): CareerActionEligibility => ({ allowed: false, reason, politicalPowerCost: 2 });
  const contextProblem = careerContextProblem(state, context);
  if (contextProblem) return blocked(contextProblem);
  if (!Object.hasOwn(careerApproachLabels, approachKind)) return blocked('지원하지 않는 접촉 방식입니다.');
  if (!nations.some((nation) => nation.id === targetNationId)) return blocked('선택한 국가를 찾을 수 없습니다.');
  if (targetNationId === context.career.nationId) return blocked('현재 소속국에는 국제 경력 접근을 보낼 수 없습니다.');
  if (context.week - state.lastApproachWeek < 2) return blocked(`제${state.lastApproachWeek + 3}주부터 연락망을 다시 사용할 수 있습니다. 국가·방식을 바꿔도 2주 대기는 유지됩니다.`);
  if (context.game.politicalPower < 2) return blocked(`정치력 2가 필요합니다. 현재 ${context.game.politicalPower}입니다.`);
  if (!Number.isFinite(context.relationByNation?.[targetNationId] ?? 50)) return blocked('상대국과의 외교 관계 수치를 확인할 수 없습니다.');
  return { allowed: true, reason: '성공·실패와 관계없이 비용과 접촉 기록이 남습니다.', politicalPowerCost: 2 };
}

export function getCareerApproachPreview(
  state: CareerMarketState, targetNationId: NationId, approachKind: CareerApproachKind, context: CareerMarketContext,
): CareerApproachPreview {
  const eligibility = getCareerApproachEligibility(state, targetNationId, approachKind, context);
  if (!eligibility.allowed) return { ...eligibility, successChance: 0, trustDelta: 0, exposureDelta: 0,
    nextApproachWeek: Number.isFinite(state.lastApproachWeek) ? state.lastApproachWeek + 2 : 0, summary: [eligibility.reason] };
  // The deterministic roll is an integer in [0, 99]. Rounding the threshold up
  // preserves every existing result and shows the actual count of passing rolls.
  const successChance = Math.ceil(clamp(18 + context.career.reputation * 0.46 + context.role.authority * 0.18
    + state.leverage * 0.2 + (state.affiliationStatus === 'dismissed' ? 18 : 0)
    + (approachKind === 'offer-secrets' || approachKind === 'offer-double-agent' ? context.game.intelNetwork * 0.18 : 0)
    - state.exposure * 0.16, 8, 88));
  const trustDelta = state.affiliationStatus === 'serving'
    ? approachKind === 'apply' ? -7 : approachKind === 'appeal' ? -4 : -12 : 0;
  const rawExposure = approachKind === 'apply' ? 2 : approachKind === 'appeal' ? 4 : approachKind === 'request-asylum' ? 8 : 13;
  const exposureDelta = clamp(state.exposure + rawExposure) - state.exposure;
  return {
    ...eligibility, successChance, trustDelta, exposureDelta, nextApproachWeek: context.week + 2,
    summary: [
      '정치력 2를 사용하며 회신 실패 시에도 돌려받지 않습니다.',
      `지도부 신임 ${clamp(context.career.councilTrust + trustDelta) - context.career.councilTrust} · 접촉 노출 ${exposureDelta >= 0 ? '+' : ''}${exposureDelta}. 두 결과 모두 성공 여부와 관계없이 반영됩니다.`,
      `회신 판정 기준 ${Math.round(successChance)}%. 같은 주차·국가·방식은 저장을 다시 불러와도 같은 판정값을 사용합니다.`,
      `다음 접촉 제${context.week + 3}주. 성공하면 제안을 받을 뿐 자동으로 이적·비밀 계약을 체결하지 않습니다.`,
    ],
  };
}

function getBestTargetRole(nationId: NationId, sourceRole: CareerRole, reputation: number, kind: ForeignCareerOfferKind) {
  const sameBranch = careerRoles.filter((role) => role.nationId === nationId && role.branch === sourceRole.branch);
  const allRoles = careerRoles.filter((role) => role.nationId === nationId);
  const preferredTier = kind === 'official-appointment'
    ? clamp(sourceRole.tier - (reputation >= 72 ? 1 : 0), 1, 5) as CareerTier
    : kind === 'government-in-exile'
      ? Math.max(2, sourceRole.tier) as CareerTier
      : Math.min(5, sourceRole.tier + 1) as CareerTier;
  return sameBranch.find((role) => role.tier === preferredTier)
    ?? sameBranch.sort((left, right) => Math.abs(left.tier - preferredTier) - Math.abs(right.tier - preferredTier))[0]
    ?? allRoles[0];
}

const INITIAL_CAREER_SETTLING_WEEKS = 6;
const COVERT_RECRUITMENT_MIN_WEEK = 13;
const STATE_BETRAYAL_MIN_WEEK = 26;

export function getCareerRecruitmentReadiness(state: CareerMarketState, context: CareerMarketContext) {
  // Incoming mail alone is not a relationship. Count distinct contacts that the
  // player initiated or pursued, not repeated negotiation clicks on one letter.
  const contacts = new Set([
    ...state.offers.filter((offer) => offer.origin === 'player-initiated'
      || ['exploring', 'negotiating', 'accepted', 'turned'].includes(offer.status)).map((offer) => offer.id),
    ...state.history.filter((record) => record.outcome === 'approach-failed').map((record) => record.id),
  ]);
  const displaced = state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached';
  const dismissalHistory = state.history.some((record) => record.id.startsWith('career-dismissed-'));
  const establishedCovertCareer = state.affiliationStatus === 'double-agent' || Boolean(state.clandestine && state.clandestine.status !== 'closed');
  const reasons = [
    ...(displaced || dismissalHistory ? ['해임·무소속 경력'] : []),
    ...(context.career.councilTrust <= 35 ? ['지도부 신임 35 이하'] : []),
    ...(contacts.size >= 2 ? ['선행 외국 접촉 2회 이상'] : []),
    ...(context.week >= 52 ? ['52주 이상 장기 경력'] : []),
    ...(establishedCovertCareer ? ['기존 비밀 협조 관계'] : []),
  ];
  return {
    settlingIn: state.affiliationStatus === 'serving' && !establishedCovertCareer && context.week < INITIAL_CAREER_SETTLING_WEEKS,
    foreignContactCount: contacts.size,
    reasons,
    covertRecruitmentAllowed: context.week >= COVERT_RECRUITMENT_MIN_WEEK && reasons.length > 0,
    stateBetrayalAllowed: context.week >= STATE_BETRAYAL_MIN_WEEK && reasons.length > 0,
  };
}

function offerKindsFor(context: CareerMarketContext, state: CareerMarketState): ForeignCareerOfferKind[] {
  if (state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached') {
    return ['official-appointment', 'asylum-and-post', 'government-in-exile', 'secret-retainer'];
  }
  const kinds: ForeignCareerOfferKind[] = context.role.branch === 'intelligence'
    ? ['double-agent', 'sell-secrets', 'secret-retainer', 'official-appointment', 'state-betrayal']
    : context.role.branch === 'politics'
      ? ['official-appointment', 'secret-retainer', 'state-betrayal', 'double-agent', 'sell-secrets']
      : ['official-appointment', 'secret-retainer', 'double-agent', 'state-betrayal', 'sell-secrets'];
  const readiness = getCareerRecruitmentReadiness(state, context);
  return kinds.filter((kind) => kind === 'state-betrayal' ? readiness.stateBetrayalAllowed
    : kind === 'double-agent' || kind === 'sell-secrets' ? readiness.covertRecruitmentAllowed : true);
}

function buildOffer(
  sourceNationId: NationId,
  kind: ForeignCareerOfferKind,
  context: CareerMarketContext,
  state: CareerMarketState,
  origin: ForeignCareerOffer['origin'],
  salt: string,
): ForeignCareerOffer {
  const nation = nations.find((entry) => entry.id === sourceNationId) ?? nations[0];
  const targetRole = getBestTargetRole(sourceNationId, context.role, context.career.reputation, kind);
  const seed = `${context.week}:${context.career.roleId}:${sourceNationId}:${kind}:${salt}`;
  const motivePool: ForeignCareerOffer['motive'][] = state.affiliationStatus === 'dismissed'
    ? ['security', 'revenge', 'ego', 'money']
    : ['ideology', 'money', 'ego', 'compromise', 'security', 'revenge'];
  const motive = choose(motivePool, seed, 2);
  const rivalryBonus = nation.alignment !== (nations.find((entry) => entry.id === context.career.nationId)?.alignment ?? nation.alignment) ? 8 : 0;
  const relationship = context.relationByNation?.[sourceNationId] ?? (rivalryBonus > 0 ? 28 : 64);
  const accessBonus = context.role.authority * 0.22 + context.game.intelNetwork * 0.14;
  const unemploymentBonus = state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached' ? 14 : 0;
  const acceptanceChance = clamp(28 + context.career.reputation * 0.35 + unemploymentBonus - targetRole.tier * 3 + (relationship - 50) * 0.16 + (origin === 'player-initiated' ? -8 : 8));
  const exposureRisk = clamp(
    12
      + rivalryBonus
      + (kind === 'state-betrayal' ? 32 : kind === 'double-agent' ? 24 : kind === 'sell-secrets' ? 20 : 4)
      - context.game.intelNetwork * 0.08
      + state.exposure * 0.2,
    5,
    92,
  );
  const signingBonus = Math.round(80 + context.career.reputation * 3.2 + targetRole.authority * 2.4 + (kind === 'state-betrayal' ? 240 : 0));
  const formalAppointment = ['official-appointment', 'asylum-and-post', 'government-in-exile'].includes(kind);
  const weeklyRetainer = formalAppointment ? 0 : Math.round(4 + targetRole.authority / 12 + (kind === 'secret-retainer' || kind === 'double-agent' ? 7 : 0));
  const demand = kind === 'official-appointment'
    ? `${targetRole.title} 취임과 26주 성과심사`
    : kind === 'asylum-and-post'
      ? '현재 조직을 떠나 보호구역으로 이동하고 공개 전향 성명을 발표'
      : kind === 'government-in-exile'
        ? '망명정부의 정통성 확보와 국제 승인 교섭을 지휘'
        : kind === 'secret-retainer'
          ? '현직에서 얻은 정세 판단과 인맥을 비공식 자문으로 제공'
          : kind === 'sell-secrets'
            ? '작전계획·인사명부·보급 취약점 중 하나의 검증 가능한 표본 제공'
            : kind === 'double-agent'
              ? '현직을 유지한 채 정기 보고와 제한적 영향공작 수행'
              : '지도부 분열을 조성하고 결정적 시점에 정권·군 지휘권의 이양을 지원';
  const pitch = kind === 'official-appointment'
    ? `${withJosa(nation.shortName, '은/는')} 당신의 최근 성과와 국제 평판을 검토했습니다. ${targetRole.title} 면담 명단에 당신을 직접 올리려 합니다.`
    : kind === 'asylum-and-post'
      ? `${withJosa(nation.shortName, '은/는')} 신변보호·가족 이동·새 보직을 하나의 패키지로 제안합니다.`
      : kind === 'government-in-exile'
        ? `${nation.shortName} 계열의 망명조직이 당신의 인맥을 새 정부의 핵심 자산으로 평가합니다.`
        : `${nation.shortName}의 비밀 연락선은 당신의 보직 접근권과 지도부 내부 사정을 높게 평가합니다.`;
  const recruitmentReasons = origin === 'foreign-initiated' && ['state-betrayal', 'double-agent', 'sell-secrets'].includes(kind)
    ? getCareerRecruitmentReadiness(state, context).reasons : [];
  return {
    id: `career-offer-${context.week}-${sourceNationId}-${kind}-${hashText(seed).toString(36)}`,
    sourceNationId,
    targetRoleId: targetRole.id,
    kind,
    status: 'pending',
    origin,
    receivedWeek: context.week,
    deadlineWeek: context.week + (kind === 'state-betrayal' ? 2 : kind === 'official-appointment' ? 4 : 3),
    title: `${nation.shortName} · ${offerKindLabels[kind]}`,
    sender: choose(senderByBranch[targetRole.branch], seed, 4),
    coverChannel: channelByKind[kind],
    pitch: recruitmentReasons.length ? `${pitch} 접근 배경: ${recruitmentReasons.join(' · ')}.` : pitch,
    demand,
    motive,
    secrecy: clamp(58 + context.game.intelNetwork * 0.18 - exposureRisk * 0.12),
    exposureRisk,
    credibility: clamp(42 + context.career.reputation * 0.22 + relationship * 0.12 + (origin === 'foreign-initiated' ? 12 : 0)),
    acceptanceChance,
    explorationCount: 0,
    negotiationCount: 0,
    terms: {
      signingBonus,
      weeklyRetainer,
      authority: targetRole.authority,
      protection: clamp(35 + targetRole.authority * 0.45 + (kind === 'asylum-and-post' ? 24 : 0)),
      extraction: clamp(28 + context.game.intelNetwork * 0.32 + (state.affiliationStatus === 'dismissed' ? 18 : 0)),
      autonomy: targetRole.tier <= 2 ? 'independent' : targetRole.tier <= 4 ? 'operational' : 'limited',
    },
    consequencePreview: [
      formalAppointment
        ? `수락 시 ${nation.shortName}의 ${withJosa(targetRole.title, '으로/로')} 같은 세계선에서 경력을 계속합니다.`
        : '수락해도 현재 보직은 유지되지만 비밀 소속과 폭로 위험이 매주 누적됩니다.',
      `제안 노출 위험 ${Math.round(exposureRisk)}/100 · 제안 신뢰도 ${Math.round(clamp(42 + context.career.reputation * 0.22 + relationship * 0.12 + (origin === 'foreign-initiated' ? 12 : 0)))}/100 · 즉시 발각 확률이 아닌 접촉 지표입니다.`,
      `현재 외교 관계 ${Math.round(relationship)}/100 · 관계가 낮을수록 공식 이적은 어렵고 비밀공작 요구는 강경해집니다.`,
      `계약금 ${signingBonus} · ${formalAppointment ? '정기 비밀수당 없음' : `주간 비밀수당 ${weeklyRetainer}`} · 보호 보장 ${Math.round(clamp(35 + targetRole.authority * 0.45 + (kind === 'asylum-and-post' ? 24 : 0)))}/100`,
    ],
  };
}

export function createCareerMarketState(): CareerMarketState {
  return {
    affiliationStatus: 'serving',
    offers: [],
    history: [],
    lastEvaluationWeek: -1,
    lastApproachWeek: -52,
    unemploymentWeeks: 0,
    exposure: 0,
    leverage: 0,
    foreignTrust: {},
    handlerNationId: null,
    secretsDelivered: 0,
    defections: 0,
    clandestine: null,
  };
}

export function normalizeCareerMarketState(value: unknown): CareerMarketState {
  const fallback = createCareerMarketState();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<CareerMarketState>;
  return {
    ...fallback,
    ...candidate,
    offers: Array.isArray(candidate.offers) ? candidate.offers.filter((offer) => offer && typeof offer === 'object').map((offer) => ({
      ...offer,
      explorationCount: getCareerOfferExplorationCount(offer),
      negotiationCount: getCareerOfferNegotiationCount(offer),
    })) : [],
    history: Array.isArray(candidate.history) ? candidate.history : [],
    foreignTrust: candidate.foreignTrust && typeof candidate.foreignTrust === 'object' ? candidate.foreignTrust : {},
    clandestine: normalizeClandestineCareerState(candidate.clandestine),
  };
}

export function expireCareerOffers(state: CareerMarketState, week: number): CareerMarketState {
  const expired = state.offers.filter((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status) && offer.deadlineWeek < week);
  if (expired.length === 0) {
    return {
      ...state,
      unemploymentWeeks: state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached'
        ? state.unemploymentWeeks + 1
        : 0,
      exposure: clamp(
        state.exposure
          + (state.affiliationStatus === 'double-agent'
            ? 0.6 + state.secretsDelivered * 0.08
            : -0.2),
        0,
        100,
      ),
    };
  }
  return {
    ...state,
    offers: state.offers.map((offer) => expired.some((entry) => entry.id === offer.id) ? { ...offer, status: 'expired' } : offer),
    history: [
      ...expired.map((offer) => ({
        id: `${offer.id}-expired`,
        week,
        nationId: offer.sourceNationId,
        title: offer.title,
        outcome: 'expired' as const,
        detail: '답변 기한을 넘겨 제안이 철회됐습니다. 수락·계약금 지급·비밀 협조는 실행되지 않았습니다.',
      })),
      ...state.history,
    ].slice(0, 80),
    unemploymentWeeks: state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached'
      ? state.unemploymentWeeks + 1
      : 0,
    exposure: clamp(
      state.exposure
        + (state.affiliationStatus === 'double-agent'
          ? 0.6 + state.secretsDelivered * 0.08
          : -0.2),
      0,
      100,
    ),
  };
}

export function evaluateForeignCareerOffers(
  inputState: CareerMarketState,
  context: CareerMarketContext,
  force = false,
): { state: CareerMarketState; newOffers: ForeignCareerOffer[] } {
  if (!force && inputState.lastEvaluationWeek === context.week) return { state: inputState, newOffers: [] };
  const state = expireCareerOffers(inputState, context.week);
  const activeOfferCount = state.offers.filter((offer) => ['pending', 'exploring', 'negotiating'].includes(offer.status)).length;
  const isHighestOffice = context.role.tier === 1 && state.affiliationStatus === 'serving';
  const evaluationInterval = state.affiliationStatus === 'dismissed' || state.affiliationStatus === 'unattached' ? 2 : 6;
  const due = force || (context.week > 0 && context.week % evaluationInterval === 0);
  // Forced evaluation is used for post-dismissal recovery, not permission to
  // skip a serving player's introductory period or recruitment prerequisites.
  if (!due || isHighestOffice || getCareerRecruitmentReadiness(state, context).settlingIn || (!force && activeOfferCount >= 3)) {
    return { state: { ...state, lastEvaluationWeek: context.week }, newOffers: [] };
  }
  const seed = `${context.week}:${context.career.nationId}:${context.career.roleId}:${context.career.reputation}:${state.exposure}`;
  const foreignNations = nations.filter((nation) => nation.id !== context.career.nationId);
  const orderedNations = [...foreignNations].sort((left, right) => hashText(`${seed}:${left.id}`) - hashText(`${seed}:${right.id}`));
  const opportunityScore = context.career.reputation
    + context.role.authority * 0.32
    + (100 - context.career.councilTrust) * 0.25
    + (context.role.branch === 'intelligence' ? context.game.intelNetwork * 0.18 : 0)
    + (state.affiliationStatus === 'dismissed' ? 28 : 0);
  const generatedCount = force
    ? Math.min(3, Math.max(1, Math.floor(opportunityScore / 34)))
    : hashText(seed) % 100 < clamp(opportunityScore * 0.72, 10, 82) ? 1 : 0;
  const kinds = offerKindsFor(context, state);
  const newOffers = Array.from({ length: generatedCount }, (_, index) => {
    const nation = orderedNations[index % orderedNations.length];
    const kind = choose(kinds, seed, index + 1);
    return buildOffer(nation.id, kind, context, state, 'foreign-initiated', `generated-${index}`);
  }).filter((offer) => !state.offers.some((existing) =>
    existing.sourceNationId === offer.sourceNationId
    && existing.kind === offer.kind
    && ['pending', 'exploring', 'negotiating'].includes(existing.status),
  ));
  return {
    state: {
      ...state,
      lastEvaluationWeek: context.week,
      offers: [...newOffers, ...state.offers].slice(0, 40),
    },
    newOffers,
  };
}

export function markCareerDismissed(
  state: CareerMarketState,
  context: CareerMarketContext,
): { state: CareerMarketState; newOffers: ForeignCareerOffer[] } {
  const dismissalRecord: CareerMarketRecord = {
    id: `career-dismissed-${context.week}`,
    week: context.week,
    nationId: context.career.nationId,
    title: `${context.role.title} 해임`,
    outcome: 'rejected',
    detail: '현재 국가의 보직은 잃었지만 경력·평판·인맥·비밀 접근 기록은 국제 경력 시장에 남습니다.',
  };
  const dismissedState: CareerMarketState = {
    ...state,
    affiliationStatus: 'dismissed',
    unemploymentWeeks: 0,
    leverage: clamp(state.leverage + context.career.reputation * 0.22),
    history: [dismissalRecord, ...state.history].slice(0, 80),
  };
  return evaluateForeignCareerOffers(dismissedState, context, true);
}

export function respondToCareerOffer(
  state: CareerMarketState,
  offerId: string,
  response: CareerOfferResponse,
  context: CareerMarketContext,
): CareerOfferResolution | null {
  if (!getCareerOfferResponseEligibility(state, offerId, response, context).allowed) return null;
  return resolveCareerOfferResponse(state, offerId, response, context);
}

function resolveCareerOfferResponse(
  state: CareerMarketState,
  offerId: string,
  response: CareerOfferResponse,
  context: CareerMarketContext,
): CareerOfferResolution | null {
  const offer = state.offers.find((entry) => entry.id === offerId);
  if (!offer || !['pending', 'exploring', 'negotiating'].includes(offer.status)) return null;
  if (response === 'defer') {
    return {
      state,
      offer,
      gameDelta: {},
      careerDelta: { reputation: 0, councilTrust: 0, legacy: 0 },
      title: '제안 보류',
      detail: `제${offer.deadlineWeek + 1}주까지 회신할 수 있습니다. 제${offer.deadlineWeek + 2}주부터 만료되며, 보류해도 마감은 연장되지 않습니다.`,
      tone: 'neutral',
    };
  }
  if (response === 'explore') {
    const updated = { ...offer, status: 'exploring' as const, credibility: clamp(offer.credibility + 8), exposureRisk: clamp(offer.exposureRisk + 4),
      explorationCount: getCareerOfferExplorationCount(offer) + 1, negotiationCount: getCareerOfferNegotiationCount(offer) };
    const detail = '보직·보호·대가의 진위를 확인했습니다. 제안 신뢰도 최대 +8, 제안 노출 위험 최대 +4, 접촉 노출 최대 +2, 지도부 신임 -1이 반영됐습니다. 탐색은 제안당 1회입니다.';
    return {
      state: { ...state, offers: state.offers.map((entry) => entry.id === offerId ? updated : entry), exposure: clamp(state.exposure + 2),
        history: [{ id: `${offer.id}-exploring`, week: context.week, nationId: offer.sourceNationId, title: '비공식 탐색 회신', outcome: 'exploring' as const, detail }, ...state.history].slice(0, 80) },
      offer: updated,
      gameDelta: {},
      careerDelta: { reputation: 0, councilTrust: -1, legacy: 0 },
      title: '비공식 탐색 회신',
      detail,
      tone: 'neutral',
    };
  }
  if (response === 'negotiate') {
    const updated: ForeignCareerOffer = {
      ...offer,
      status: 'negotiating',
      explorationCount: getCareerOfferExplorationCount(offer),
      negotiationCount: getCareerOfferNegotiationCount(offer) + 1,
      deadlineWeek: offer.deadlineWeek + 2,
      exposureRisk: clamp(offer.exposureRisk + 7),
      terms: {
        ...offer.terms,
        signingBonus: Math.round(offer.terms.signingBonus * 1.22),
        protection: clamp(offer.terms.protection + 10),
      },
      consequencePreview: [
        ...offer.consequencePreview,
        '재협상으로 계약금·보호 조건이 개선됐지만 접촉 기간과 노출면이 늘었습니다. 실제 결재 권한은 취임하는 보직에 따르며 재협상으로 증가하지 않습니다.',
      ],
    };
    const detail = `계약금 ${offer.terms.signingBonus} → ${updated.terms.signingBonus}, 보호 보장 ${offer.terms.protection} → ${updated.terms.protection}, 마감 제${offer.deadlineWeek + 1}주 → 제${updated.deadlineWeek + 1}주로 최종 조건이 수정됐습니다. 접촉 노출 최대 +5, 제안 노출 위험 최대 +7, 지도부 신임 -2, 평판 +1이 반영됐습니다. 재협상은 제안당 1회입니다.`;
    return {
      state: { ...state, offers: state.offers.map((entry) => entry.id === offerId ? updated : entry), exposure: clamp(state.exposure + 5),
        history: [{ id: `${offer.id}-negotiating`, week: context.week, nationId: offer.sourceNationId, title: '조건 재협상', outcome: 'negotiating' as const, detail }, ...state.history].slice(0, 80) },
      offer: updated,
      gameDelta: {},
      careerDelta: { reputation: 1, councilTrust: -2, legacy: 0 },
      title: '조건 재협상',
      detail,
      tone: 'neutral',
    };
  }
  const resolvedStatus: ForeignCareerOfferStatus = response === 'accept'
    ? 'accepted'
    : response === 'report'
      ? 'reported'
      : response === 'turn'
        ? 'turned'
        : 'rejected';
  const resolvedOffer = { ...offer, status: resolvedStatus };
  const isTransfer = response === 'accept' && ['official-appointment', 'asylum-and-post', 'government-in-exile'].includes(offer.kind);
  const isCovertAcceptance = response === 'accept' && !isTransfer;
  const canTurn = context.role.branch === 'intelligence' || context.game.intelNetwork >= 68;
  if (response === 'turn' && !canTurn) return null;
  const history: CareerMarketRecord = {
    id: `${offer.id}-${resolvedStatus}`,
    week: context.week,
    nationId: offer.sourceNationId,
    title: offer.title,
    outcome: resolvedStatus,
    detail: response === 'accept'
      ? isTransfer
        ? '새 국가의 보직과 보호 조건을 수락해 같은 세계선에서 경력을 이어갑니다.'
        : '현재 보직을 유지한 채 외국 기관과 비밀 협조 관계를 시작했습니다.'
      : response === 'report'
        ? '접촉 전문과 식별 정보를 현재 지도부 방첩망에 넘겼습니다.'
        : response === 'turn'
          ? '상대의 포섭 연락망을 역이용해 정보망과 지휘 정보를 보강했습니다. 별도의 비밀 경력·장기 임무는 생성되지 않았습니다.'
          : '제안을 명시적으로 거절했습니다.',
  };
  const nextState: CareerMarketState = {
    ...state,
    affiliationStatus: isCovertAcceptance ? 'double-agent' : state.affiliationStatus,
    offers: state.offers.map((entry) => entry.id === offerId ? resolvedOffer : entry),
    history: [history, ...state.history].slice(0, 80),
    exposure: clamp(state.exposure + (
      response === 'accept' ? offer.exposureRisk * 0.24
        : response === 'report' ? -8
          : response === 'turn' ? 8
            : -2
    )),
    leverage: clamp(state.leverage + (response === 'accept' ? 12 : response === 'turn' ? 9 : 1)),
    handlerNationId: isCovertAcceptance ? offer.sourceNationId : state.handlerNationId,
    secretsDelivered: state.secretsDelivered + (isCovertAcceptance ? 1 : 0),
    defections: state.defections + (isTransfer && offer.sourceNationId !== context.career.nationId ? 1 : 0),
    clandestine: isCovertAcceptance
      ? createClandestineCareerState({
          homeNationId: context.career.nationId,
          handlerNationId: offer.sourceNationId,
          week: context.week,
          role: context.role,
          handlerTrust: offer.credibility,
          coverStrength: offer.secrecy,
          weeklyRetainer: offer.terms.weeklyRetainer,
        })
      : state.clandestine,
    foreignTrust: {
      ...state.foreignTrust,
      [offer.sourceNationId]: clamp((state.foreignTrust[offer.sourceNationId] ?? 35) + (
        response === 'accept' ? 28 : response === 'turn' ? -30 : -18
      )),
    },
  };
  const targetNation = nations.find((nation) => nation.id === offer.sourceNationId) ?? nations[0];
  return {
    state: isTransfer
      ? { ...nextState, affiliationStatus: offer.kind === 'asylum-and-post' ? 'exile' : offer.sourceNationId === context.career.nationId ? 'serving' : 'defector', handlerNationId: null, clandestine: null }
      : nextState,
    offer: resolvedOffer,
    transfer: isTransfer ? {
      nationId: offer.sourceNationId,
      roleId: offer.targetRoleId,
      status: offer.kind === 'asylum-and-post' ? 'exile' : offer.sourceNationId === context.career.nationId ? 'serving' : 'defector',
    } : undefined,
    gameDelta: response === 'accept'
      ? isTransfer
        ? { treasury: offer.terms.signingBonus, politicalPower: 6, stability: -3 }
        : { treasury: offer.terms.signingBonus, intelNetwork: 5, politicalPower: -4, stability: -2 }
      : response === 'report'
        ? { intelNetwork: 8, politicalPower: 4 }
        : response === 'turn'
          ? { intelNetwork: 11, commandPoints: 5, politicalPower: -3 }
          : {},
    careerDelta: response === 'accept'
      ? { reputation: isTransfer ? 5 : -3, councilTrust: isTransfer ? 0 : -14, legacy: 2 }
      : response === 'report'
        ? { reputation: 2, councilTrust: 9, legacy: 1 }
        : response === 'turn'
          ? { reputation: 4, councilTrust: 5, legacy: 3 }
          : { reputation: 0, councilTrust: 1, legacy: 0 },
    title: response === 'accept'
      ? isTransfer
        ? `${targetNation.shortName} 새 보직 수락`
        : `${targetNation.shortName} 비밀 협조 수락`
      : response === 'report'
        ? '외국 포섭 시도 상부 보고'
        : response === 'turn'
          ? '포섭 연락망 역이용'
          : '외국 제안 거절',
    detail: history.detail,
    tone: response === 'report' || response === 'turn' ? 'good' : response === 'accept' ? 'neutral' : 'neutral',
  };
}

export function getCareerOfferResponsePreview(
  state: CareerMarketState, offerId: string, response: CareerOfferResponse, context: CareerMarketContext,
): CareerOfferResponsePreview {
  const eligibility = getCareerOfferResponseEligibility(state, offerId, response, context);
  const offer = state.offers.find((entry) => entry.id === offerId) ?? null;
  const fallback: CareerOfferResponsePreview = {
    ...eligibility, response, offer, gameDelta: {}, careerDelta: { reputation: 0, councilTrust: 0, legacy: 0 },
    exposureDelta: 0, termsBefore: offer?.terms ?? null, termsAfter: offer?.terms ?? null,
    deadlineWeek: offer?.deadlineWeek ?? null, transfer: null,
    weeklyRetainer: offer && !isTransferOffer(offer) ? offer.terms?.weeklyRetainer ?? 0 : 0,
    summary: [eligibility.reason],
  };
  if (!eligibility.allowed || !offer) return fallback;
  const resolution = resolveCareerOfferResponse(state, offerId, response, context);
  if (!resolution) return { ...fallback, allowed: false, reason: '현재 조건으로 회신 결과를 확인할 수 없습니다.' };
  const exposureDelta = resolution.state.exposure - state.exposure;
  const labels: Record<string, string> = { treasury: '국고', politicalPower: '정치력', stability: '안정도', intelNetwork: '정보망', commandPoints: '지휘력' };
  const resources = Object.entries(resolution.gameDelta).map(([key, value]) => `${labels[key] ?? key} ${(value ?? 0) >= 0 ? '+' : ''}${value}`).join(' · ');
  const summary = [
    `즉시 정치력 비용 ${eligibility.politicalPowerCost}. ${resources || '국고·정치력 등 국가 자원 변화 없음.'}`,
    `평판 ${resolution.careerDelta.reputation >= 0 ? '+' : ''}${resolution.careerDelta.reputation} · 지도부 신임 ${resolution.careerDelta.councilTrust >= 0 ? '+' : ''}${resolution.careerDelta.councilTrust} · 경력 유산 ${resolution.careerDelta.legacy >= 0 ? '+' : ''}${resolution.careerDelta.legacy} · 접촉 노출 ${exposureDelta >= 0 ? '+' : ''}${Math.round(exposureDelta * 10) / 10}.`,
    `회신 마감 제${resolution.offer.deadlineWeek + 1}주까지. 보류·탐색은 마감을 연장하지 않으며, 재협상 1회만 2주 연장합니다.`,
  ];
  if (response === 'explore') summary.push(`신뢰도 ${offer.credibility} → ${resolution.offer.credibility}, 제안 노출 위험 ${offer.exposureRisk} → ${resolution.offer.exposureRisk}. 다시 탐색할 수 없습니다.`);
  if (response === 'negotiate') summary.push(`계약금 ${offer.terms.signingBonus} → ${resolution.offer.terms.signingBonus}, 보호 ${offer.terms.protection} → ${resolution.offer.terms.protection}. 아직 계약금은 받지 않으며, 이 수정안이 최종 조건입니다. 실제 결재 권한은 취임 보직에 따르며 재협상으로 증가하지 않습니다.`);
  if (response === 'turn') summary.push('상대 연락망을 역이용해 정보망·지휘 정보를 보강합니다. 별도의 비밀 경력이나 장기 공작 임무는 생성되지 않습니다.');
  if (response === 'accept') summary.push(
    '받은 제안의 수락에는 추가 확률 판정이 없습니다. 승인하면 표시된 계약을 체결합니다.',
    isTransferOffer(offer)
      ? '정식 보직 이동: 국가·참모·부대·국정 자원을 새 소속에 맞게 인계합니다. 정기 비밀수당은 지급되지 않습니다.'
      : `현 보직을 유지하고 비밀 협조를 시작합니다. 계약금은 즉시, 주간 비밀수당 ${offer.terms.weeklyRetainer}은 비밀 경력의 주간 처리에서 반영됩니다.${state.clandestine && state.clandestine.status !== 'closed' ? ' 기존 비밀 경력의 연락관·임무·작전 자금은 새 계약으로 교체됩니다.' : ''}`,
  );
  return { ...fallback, gameDelta: resolution.gameDelta, careerDelta: resolution.careerDelta,
    exposureDelta, termsAfter: resolution.offer.terms, deadlineWeek: resolution.offer.deadlineWeek,
    transfer: resolution.transfer ?? null, summary };
}

export function initiateCareerApproach(
  state: CareerMarketState,
  targetNationId: NationId,
  approachKind: CareerApproachKind,
  context: CareerMarketContext,
): CareerApproachResult {
  const preview = getCareerApproachPreview(state, targetNationId, approachKind, context);
  if (!preview.allowed) {
    return {
      state,
      success: false,
      title: '접촉망 사용 불가',
      detail: preview.reason,
      careerTrustDelta: 0,
      gameDelta: {},
    };
  }
  const kind: ForeignCareerOfferKind = approachKind === 'apply'
    ? 'official-appointment'
    : approachKind === 'request-asylum'
      ? 'asylum-and-post'
      : approachKind === 'offer-secrets'
        ? 'sell-secrets'
        : approachKind === 'offer-double-agent'
          ? 'double-agent'
          : 'secret-retainer';
  const sourceNation = nations.find((nation) => nation.id === targetNationId) ?? nations[0];
  const seed = `approach:${context.week}:${context.career.roleId}:${targetNationId}:${approachKind}`;
  const chance = preview.successChance;
  const roll = hashText(seed) % 100;
  const success = roll < chance;
  const trustDelta = preview.trustDelta;
  const nextBase: CareerMarketState = {
    ...state,
    lastApproachWeek: context.week,
    exposure: state.exposure + preview.exposureDelta,
  };
  if (!success) {
    const failureRecord: CareerMarketRecord = {
      id: `career-approach-failed-${context.week}-${targetNationId}`,
      week: context.week,
      nationId: targetNationId,
      title: `${sourceNation.shortName} · ${careerApproachLabels[approachKind].title}`,
      outcome: 'approach-failed',
      detail: `상대 기관이 회신하지 않았습니다. 정치력 -2, 지도부 신임 ${trustDelta}, 접촉 노출 +${preview.exposureDelta}가 반영됐습니다. 다음 접촉은 제${preview.nextApproachWeek + 1}주입니다.`,
    };
    return {
      state: {
        ...nextBase,
        history: [failureRecord, ...state.history].slice(0, 80),
      },
      success: false,
      title: `${sourceNation.shortName} 접촉 실패`,
      detail: `회신 판정 기준 ${Math.round(chance)}%였으나 상대가 회신하지 않았습니다. ${failureRecord.detail}`,
      careerTrustDelta: trustDelta,
      gameDelta: { politicalPower: -2 },
    };
  }
  const offer = buildOffer(targetNationId, kind, context, nextBase, 'player-initiated', approachKind);
  return {
    state: {
      ...nextBase,
      offers: [offer, ...nextBase.offers].slice(0, 40),
      leverage: clamp(nextBase.leverage + 4),
      history: [{ id: `${offer.id}-received`, week: context.week, nationId: targetNationId, title: `${sourceNation.shortName} 회신 도착`, outcome: 'pending' as const,
        detail: `${careerApproachLabels[approachKind].title} 후 조건부 제안이 도착했습니다. 정치력 -2, 지도부 신임 ${trustDelta}, 접촉 노출 +${preview.exposureDelta}가 반영됐습니다. 아직 계약을 수락하지 않았습니다.` }, ...nextBase.history].slice(0, 80),
    },
    offer,
    success: true,
    title: `${sourceNation.shortName} 회신 도착`,
    detail: `${careerApproachLabels[approachKind].title}에 상대 기관이 응답했습니다. 받은편지함에서 실제 조건과 요구사항을 검토하십시오.`,
    careerTrustDelta: trustDelta,
    gameDelta: { politicalPower: -2 },
  };
}
