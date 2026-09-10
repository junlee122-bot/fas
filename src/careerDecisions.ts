import { careerRoles, nations } from './campaign';
import {
  getCareerApproachPreview, getCareerOfferResponsePreview, initiateCareerApproach, respondToCareerOffer,
} from './careerMarket';
import type {
  CareerApproachKind, CareerApproachPreview, CareerApproachResult, CareerMarketContext,
  CareerMarketState, CareerOfferResponse, CareerOfferResponsePreview, CareerOfferResolution,
} from './careerMarket';
import type { CareerRole, CareerState, GameState, NationId, NationProfile } from './types';

export interface CareerDecisionInput {
  state: CareerMarketState;
  context: CareerMarketContext & { game: GameState };
  busy?: boolean;
}

export type CareerDecisionAction =
  | { kind: 'respond'; offerId: string; response: CareerOfferResponse }
  | { kind: 'approach'; nationId: NationId; approach: CareerApproachKind };

export interface CareerTransferPlan {
  nextNation: NationProfile;
  nextRole: CareerRole;
  nextGame: GameState;
  nextCareer: CareerState;
  resourceChanges: { field: keyof GameState; before: number; after: number }[];
  resets: string[];
  preserved: string[];
}

export type CareerDecisionPreview =
  | { kind: 'respond'; response: CareerOfferResponsePreview; transfer?: CareerTransferPlan }
  | { kind: 'approach'; approach: CareerApproachPreview };

export type CareerDecisionAssessment =
  | { allowed: false; reason: string }
  | { allowed: true; reason: string; preview: CareerDecisionPreview };

interface CareerDecisionResultBase {
  action: CareerDecisionAction;
  stateAfter: CareerMarketState;
  gameAfter: GameState;
  careerAfter: CareerState;
  transfer?: CareerTransferPlan;
}

/** Actual approach outcomes exist only at approval, never in a review's public preview. */
export type CareerDecisionResult = CareerDecisionResultBase & (
  | { kind: 'respond'; resolution: CareerOfferResolution }
  | { kind: 'approach'; approachResult: CareerApproachResult }
);

export interface CareerDecisionReview {
  readonly action: CareerDecisionAction;
  readonly fingerprint: string;
  readonly contextFingerprint: string;
  readonly basis: Readonly<{ week: number; nationId: NationId; roleId: string; treasury: number; politicalPower: number }>;
  readonly assessment: Extract<CareerDecisionAssessment, { allowed: true }>;
}

export interface CareerReviewGate {
  submitted: Set<string>;
  contextFingerprint?: string;
}

const boundedFields = new Set<keyof GameState>([
  'stability', 'warSupport', 'commandPoints', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure',
]);
const gameFields: (keyof GameState)[] = [
  'week', 'manpower', 'politicalPower', 'fuel', 'steel', 'factories', 'stability', 'warSupport',
  'commandPoints', 'treasury', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure',
];
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const deny = (reason: string): CareerDecisionAssessment => ({ allowed: false, reason });

/** Mirrors the campaign's numeric delta rules; nation modifiers are merged before this. */
export function applyCareerGameDelta(game: GameState, delta: CareerOfferResolution['gameDelta']): GameState {
  const next = { ...game };
  for (const key of gameFields) {
    const amount = delta[key];
    if (typeof amount !== 'number' || !Number.isFinite(amount)) continue;
    next[key] = boundedFields.has(key) ? clamp(game[key] + amount) : Math.max(0, game[key] + amount);
  }
  return next;
}

function applyCareerDelta(career: CareerState, delta: CareerOfferResolution['careerDelta']): CareerState {
  return {
    ...career,
    reputation: clamp(career.reputation + delta.reputation),
    councilTrust: clamp(career.councilTrust + delta.councilTrust),
    legacy: Math.max(0, career.legacy + delta.legacy),
  };
}

/** The exact current handover, not a hypothetical salary or alternative transfer rule. */
export function projectCareerTransfer(
  input: CareerDecisionInput,
  transfer: NonNullable<CareerOfferResolution['transfer']>,
  gameDelta: CareerOfferResolution['gameDelta'],
  careerDelta: CareerOfferResolution['careerDelta'],
): CareerTransferPlan | null {
  const nextNation = nations.find((nation) => nation.id === transfer.nationId);
  const nextRole = careerRoles.find((role) => role.id === transfer.roleId && role.nationId === transfer.nationId);
  if (!nextNation || !nextRole) return null;
  const { career, game } = input.context;
  const nextGame = applyCareerGameDelta({ ...game, ...nextNation.modifiers, week: game.week }, gameDelta);
  const nextCareer: CareerState = {
    ...career,
    nationId: nextNation.id,
    roleId: nextRole.id,
    reputation: clamp(career.reputation + careerDelta.reputation),
    councilTrust: clamp(52 + careerDelta.councilTrust),
    experience: Math.max(12, Math.round(career.experience * 0.55)),
    legacy: Math.max(0, career.legacy + careerDelta.legacy),
    alternatePathId: null,
    replacedPersonId: nextRole.historicalHolderId,
    // Preserve the civilian origin and story, but the new formal office must use
    // office mandates rather than remaining trapped in the citizen workspace.
    ...(career.civilian ? { civilian: { ...career.civilian, stage: 'institutional-insider' as const, enteredOfficeRoleId: nextRole.id } } : {}),
  };
  return {
    nextNation, nextRole, nextGame, nextCareer,
    resourceChanges: gameFields.filter((field) => game[field] !== nextGame[field])
      .map((field) => ({ field, before: game[field], after: nextGame[field] })),
    resets: [
      '국고와 국가별 기본 자원은 새 소속의 설정을 인수한 뒤 계약금·수락 효과를 적용합니다. 이전 국고에 계약금만 더하는 방식이 아닙니다.',
      '참모·후보 명단, 부대·합동전력, 생산·장비 개발, 외교 관계·공작망, 경제·보건·국정·정치 위기는 새 소속 기준으로 인계됩니다.',
      '진행 중인 작전 명령·전투 보고, 지휘 세션·참모 서사·지휘관 육성은 인계 과정에서 새로 구성됩니다.',
      '신임은 새 소속 기준 52에서 수락 효과를 적용합니다. 경험은 기존의 55%를 반올림하되 최소 12를 남기며 기존 국가 경로 선택은 해제합니다.',
    ],
    preserved: [
      '현재 주차·세계선·이미 내린 선택·세계 지도 상태는 유지됩니다.',
      '연구 목록과 진행도는 유지됩니다. 완료 연구만 남기는 초기화는 하지 않습니다.',
      '평판·유산에는 수락 효과를 더하며 국제 경력의 제안·이동·비밀 활동 기록도 남습니다.',
      ...(career.civilian ? ['민간 출신과 활동 기록은 유지하고 새 보직의 제도권 진입을 기록합니다. 시민 전용 권한 제한 대신 취임 보직의 권한을 적용합니다.'] : []),
      '공식 보직 제안의 주간 보수는 자동 수입이 아닙니다. 실제 정기 지급은 별도로 유지되는 비밀 협조 계약에서 발생합니다.',
    ],
  };
}

function engineContext(input: CareerDecisionInput): CareerMarketContext & { game: GameState } {
  return { ...input.context, busy: Boolean(input.busy || input.context.busy) };
}

export function assessCareerDecision(input: CareerDecisionInput, action: CareerDecisionAction): CareerDecisionAssessment {
  const context = engineContext(input);
  if (context.busy) return deny('시간 진행 중입니다. 결산이 끝난 뒤 현재 소속과 제안을 다시 검토하십시오.');
  if (context.week !== context.game.week || !Number.isSafeInteger(context.week) || context.week < 0
    || gameFields.some((field) => !Number.isFinite(context.game[field]) || context.game[field] < 0)) {
    return deny('현재 주차와 국가 자원을 확인할 수 없습니다. 저장 상태를 다시 확인하십시오.');
  }
  if (action.kind === 'respond') {
    const response = getCareerOfferResponsePreview(input.state, action.offerId, action.response, context);
    if (!response.allowed) return deny(response.reason);
    const transfer = response.transfer
      ? projectCareerTransfer(input, response.transfer, response.gameDelta, response.careerDelta)
      : undefined;
    if (transfer === null) return deny('인계할 국가와 보직의 신원을 확인할 수 없습니다. 다른 보직으로 대신 이동하지 않습니다.');
    return { allowed: true, reason: response.reason, preview: { kind: 'respond', response, ...(transfer ? { transfer } : {}) } };
  }
  if (action.kind === 'approach') {
    const approach = getCareerApproachPreview(input.state, action.nationId, action.approach, context);
    return approach.allowed
      ? { allowed: true, reason: approach.reason, preview: { kind: 'approach', approach } }
      : deny(approach.reason);
  }
  return deny('지원하지 않는 국제 경력 조치입니다.');
}

function contextFingerprint(input: CareerDecisionInput) {
  return JSON.stringify({ state: input.state, context: engineContext(input) });
}

function fingerprint(input: CareerDecisionInput, action: CareerDecisionAction) {
  return JSON.stringify({ context: contextFingerprint(input), action });
}

function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}

export function createCareerReview(input: CareerDecisionInput, action: CareerDecisionAction): CareerDecisionReview | null {
  const immutableAction = { ...action };
  const assessment = assessCareerDecision(input, immutableAction);
  if (!assessment.allowed) return null;
  // Clone before freezing: source offers, campaign definitions and save state stay mutable.
  return freezeDeep(structuredClone({
    action: immutableAction,
    fingerprint: fingerprint(input, immutableAction),
    contextFingerprint: contextFingerprint(input),
    basis: { week: input.context.week, nationId: input.context.career.nationId,
      roleId: input.context.career.roleId, treasury: input.context.game.treasury, politicalPower: input.context.game.politicalPower },
    assessment,
  }));
}

export function assessCareerReview(review: CareerDecisionReview, input: CareerDecisionInput): CareerDecisionAssessment {
  if (review.fingerprint !== fingerprint(input, review.action)) {
    return deny('검토 뒤 주차·소속·보직·자원 또는 제안 조건이 바뀌었습니다. 최신 상태로 다시 검토하십시오.');
  }
  return assessCareerDecision(input, review.action);
}

export function createCareerReviewGate(): CareerReviewGate {
  return { submitted: new Set<string>() };
}

export function isCareerReviewSubmitted(review: CareerDecisionReview, gate: CareerReviewGate): boolean {
  return gate.contextFingerprint === review.contextFingerprint && gate.submitted.has(JSON.stringify(review.action));
}

function resolveCareerDecision(input: CareerDecisionInput, action: CareerDecisionAction): CareerDecisionResult | null {
  const context = engineContext(input);
  if (action.kind === 'respond') {
    const resolution = respondToCareerOffer(input.state, action.offerId, action.response, context);
    if (!resolution) return null;
    const transfer = resolution.transfer
      ? projectCareerTransfer(input, resolution.transfer, resolution.gameDelta, resolution.careerDelta)
      : undefined;
    if (transfer === null) return null;
    return { kind: 'respond', action, resolution, stateAfter: resolution.state,
      gameAfter: transfer?.nextGame ?? applyCareerGameDelta(context.game, resolution.gameDelta),
      careerAfter: transfer?.nextCareer ?? applyCareerDelta(context.career, resolution.careerDelta),
      ...(transfer ? { transfer } : {}) };
  }
  const approachResult = initiateCareerApproach(input.state, action.nationId, action.approach, context);
  if (approachResult.state === input.state) return null;
  return { kind: 'approach', action, approachResult, stateAfter: approachResult.state,
    gameAfter: applyCareerGameDelta(context.game, approachResult.gameDelta),
    careerAfter: { ...context.career, councilTrust: clamp(context.career.councilTrust + approachResult.careerTrustDelta) } };
}

export function confirmCareerReview(
  review: CareerDecisionReview,
  input: CareerDecisionInput,
  submit: (result: CareerDecisionResult) => void | boolean,
  gate: CareerReviewGate,
): { ok: boolean; reason: string } {
  const assessment = assessCareerReview(review, input);
  if (!assessment.allowed) return { ok: false, reason: assessment.reason };
  const currentFingerprint = contextFingerprint(input);
  if (gate.contextFingerprint !== currentFingerprint) {
    gate.contextFingerprint = currentFingerprint;
    gate.submitted.clear();
  }
  const actionKey = JSON.stringify(review.action);
  if (gate.submitted.has(actionKey)) return { ok: false, reason: '이미 승인 요청을 전달한 검토안입니다. 실제 경력 기록을 먼저 확인하십시오.' };
  if (gate.submitted.size > 0) return { ok: false, reason: '현재 상태에 다른 회신을 전달했습니다. 처리 결과가 반영된 뒤 다시 검토하십시오.' };
  const result = resolveCareerDecision(input, review.action);
  if (!result) return { ok: false, reason: '집행 직전 제안과 소속을 확인하지 못했습니다. 최신 상태로 다시 검토하십시오.' };
  // Mark before the callback so synchronous React handlers and reentrant calls cannot double-spend.
  gate.submitted.add(actionKey);
  try {
    if (submit(result) === false) return { ok: false, reason: '집행이 확인되지 않았습니다. 실제 경력 기록을 확인하십시오. 중복 승인은 차단됐습니다.' };
    return { ok: true, reason: '승인 요청을 전달했습니다. 실제 소속·제안·자원에 반영됐는지 확인합니다.' };
  } catch {
    return { ok: false, reason: '집행 결과를 확인할 수 없습니다. 경력 기록을 확인하기 전 같은 요청을 반복하지 않습니다.' };
  }
}

export interface CareerDecisionReceipt {
  confirmed: boolean;
  status: 'confirmed' | 'pending' | 'changed';
  title: string;
  detail: string;
  checks: { label: string; confirmed: boolean }[];
}

/** A callback returning true is not evidence: compare the actual three saved state branches. */
export function getCareerDecisionReceipt(result: CareerDecisionResult, input: CareerDecisionInput): CareerDecisionReceipt {
  const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  const checks = [
    { label: '국제 경력·제안 기록', confirmed: same(input.state, result.stateAfter) },
    { label: '국가 자원', confirmed: same(input.context.game, result.gameAfter) },
    { label: '소속·보직·평판·신임', confirmed: same(input.context.career, result.careerAfter) },
  ];
  const confirmed = checks.every((check) => check.confirmed);
  const changed = input.context.week !== result.gameAfter.week;
  return {
    confirmed,
    status: confirmed ? 'confirmed' : changed ? 'changed' : 'pending',
    title: confirmed ? result.kind === 'respond' ? result.resolution.title : result.approachResult.title : '실제 반영 확인 중',
    detail: confirmed
      ? result.kind === 'respond' ? result.resolution.detail : result.approachResult.detail
      : changed ? '시간이 진행돼 현재 상태와 승인 직후 상태가 달라졌습니다. 경력 기록에서 해당 조치를 확인하십시오.'
        : '예상 결과와 실제 저장 상태가 아직 모두 일치하지 않습니다. 성공으로 표시하지 않으며 중복 승인하지 않습니다.',
    checks,
  };
}
