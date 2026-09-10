import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  ConstitutionalJudiciaryBoard, confirmConstitutionalReview, createConstitutionalReview,
  resolveConstitutionClauseChoice, resolveJudicialCandidateChoice, resolveJudicialOfficeChoice,
  type ConstitutionalJudiciaryBoardProps, type ConstitutionalJudiciaryView, type ConstitutionalOrder,
} from './ConstitutionalJudiciaryBoard';
import {
  activateConstitutionalFounding, advanceConstitutionalJudiciaryWeek, constitutionClauses,
  createConstitutionalJudiciaryState, nominateJudicialCandidate, ratificationMethods,
  ratifyConstitution, resolveJudicialNomination, selectConstitutionClause,
  type ConstitutionalContext, type ConstitutionalJudiciaryState, type NominationDecisionId,
} from './constitutionalJudiciary';
import { getCampaignYearForWeek } from './campaignCalendar';
import type { CareerRole } from './types';

const role: CareerRole = { id: 'korea-tier1', nationId: 'korea', title: '국가주석', branch: 'politics', tier: 1, archetype: 'head-of-state', scope: '국가 전체', authority: 95, expectation: '헌정 창설', historicalHolderId: 'historical-office', historicalHolderName: '기존 지도부', historicalOffice: '국가원수', historicalBasis: '테스트', coverIdentity: '국가원수', replacementEffect: '국가원수 대체' };
const context = (week = 0, overrides: Partial<ConstitutionalContext> = {}): ConstitutionalContext => ({ week, year: getCampaignYearForWeek(week), nationId: 'korea', role, politicalPower: 200, treasury: 500, stability: 68, legitimacy: 64, institutionalCapacity: 55, publicConfidence: 61, ...overrides });
const clauseIds = ['parliamentary-cabinet', 'civil-liberties-charter', 'constitutional-court-review', 'independent-commission', 'independent-prosecution', 'sunset-emergency', 'devolved-regions'];
function drafting(complete = false) {
  const state = activateConstitutionalFounding(createConstitutionalJudiciaryState('korea'), context())!.state;
  return complete ? clauseIds.reduce((current, id) => selectConstitutionClause(current, id, context())!.state, state) : state;
}
function confirmation() {
  let state = createConstitutionalJudiciaryState('korea');
  state = nominateJudicialCandidate(state, 'supreme-chief', state.candidates[0].id, context())!.state;
  state = advanceConstitutionalJudiciaryWeek(state, context(2)).state;
  return advanceConstitutionalJudiciaryWeek(state, context(3)).state;
}
function props(state: ConstitutionalJudiciaryState = drafting()): ConstitutionalJudiciaryBoardProps {
  return { state, context: context(), formatMoney: (value) => `₩ ${value}`, onActivate: vi.fn(), onClauseSelect: vi.fn(), onRatify: vi.fn(), onNominate: vi.fn(), onNominationDecision: vi.fn() };
}
function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
function callbackCount(input: ConstitutionalJudiciaryBoardProps) {
  return [input.onActivate, input.onClauseSelect, input.onRatify, input.onNominate, input.onNominationDecision].reduce((count, fn) => count + vi.mocked(fn).mock.calls.length, 0);
}
const clauseOrder: ConstitutionalOrder = { kind: 'clause', id: clauseIds[0] };

describe('constitutional review uses actual action results without settlement', () => {
  it('quotes free founding without calling an external action or mutating input', () => {
    const input = props(createConstitutionalJudiciaryState('korea'));
    freeze(input.state); freeze(input.context);
    const before = JSON.stringify(input.state);
    const review = createConstitutionalReview(input, { kind: 'activate' }).review!;
    expect(review.result).toEqual(activateConstitutionalFounding(input.state, input.context));
    expect(review.politicalCost).toBe(0); expect(review.treasuryCost).toBe(0);
    expect(review.timing).toContain('자동');
    expect(JSON.stringify(input.state)).toBe(before); expect(callbackCount(input)).toBe(0);
  });

  it.each(clauseIds)('quotes %s at one political power, with no immediate institutional bonus', (id) => {
    const input = props();
    freeze(input.state); freeze(input.context);
    const before = JSON.stringify([input.state, input.context]);
    const review = createConstitutionalReview(input, { kind: 'clause', id }).review!;
    expect(review.result).toEqual(selectConstitutionClause(input.state, id, input.context));
    expect(review.politicalCost).toBe(1); expect(review.treasuryCost).toBe(0);
    expect(review.politicalPowerAfter).toBe(199); expect(review.changes).toEqual([]);
    expect(review.contributions).toEqual([]); expect(review.timing).toContain('비준');
    expect(JSON.stringify([input.state, input.context])).toBe(before); expect(callbackCount(input)).toBe(0);
  });

  it.each(ratificationMethods)('quotes $id from exact ratification arithmetic and costs', (method) => {
    const state = drafting(true);
    if (method.id === 'royal-assent') state.draft.government = 'constitutional-crown';
    if (method.id === 'party-congress') state.draft.government = 'peoples-congress';
    const input = props(state); freeze(state); freeze(input.context);
    const before = JSON.stringify(state);
    const review = createConstitutionalReview(input, { kind: 'ratify', id: method.id }).review!;
    expect(review.result).toEqual(ratifyConstitution(state, method.id, input.context));
    expect(review.politicalCost).toBe(method.politicalCost); expect(review.treasuryCost).toBe(method.treasuryCost);
    expect(review.result.state.enacted?.enactedWeek).toBe(input.context.week);
    expect(review.timing).toContain('즉시'); expect(review.timing).toContain('문턱은 없습니다');
    expect(JSON.stringify(state)).toBe(before); expect(callbackCount(input)).toBe(0);
  });

  it('does not invent a support threshold or block a contradictory constitution', () => {
    const input = props(drafting(true));
    input.state.draft.emergency = 'permanent-security-directorate';
    input.state.draft.appointments = 'leader-appointment';
    input.context = context(0, { legitimacy: 0, publicConfidence: 0, stability: 0 });
    const review = createConstitutionalReview(input, { kind: 'ratify', id: 'executive-proclamation' }).review!;
    expect(review.result.state.enacted!.publicSupport).toBeLessThan(50);
    expect(review.result.state.enacted!.contradictions.length).toBeGreaterThan(0);
  });

  it('quotes nomination costs now and review at current week plus two without advancing time', () => {
    const input = props(createConstitutionalJudiciaryState('korea'));
    input.context = context(10); freeze(input.state); freeze(input.context);
    const order: ConstitutionalOrder = { kind: 'nominate', officeId: 'supreme-chief', candidateId: input.state.candidates[0].id };
    const before = JSON.stringify(input.state);
    const review = createConstitutionalReview(input, order).review!;
    expect(review.result).toEqual(nominateJudicialCandidate(input.state, order.officeId, order.candidateId, input.context));
    expect(review.politicalCost).toBe(12); expect(review.treasuryCost).toBe(8);
    expect(review.nextReviewWeek).toBe(12); expect(review.result.state.appointments).toEqual([]);
    expect(review.result.state.activeNomination?.stage).toBe('vetting');
    expect(review.timing).toContain('제 13주'); expect(JSON.stringify(input.state)).toBe(before);
  });

  it.each<NominationDecisionId>(['confirm', 'return-vetting', 'withdraw', 'force-through'])('quotes %s exactly, without altering nomination or appointments', (id) => {
    const input = props(confirmation()); input.context = context(3);
    freeze(input.state); freeze(input.context);
    const before = JSON.stringify(input.state);
    const review = createConstitutionalReview(input, { kind: 'decision', id }).review!;
    expect(review.result).toEqual(resolveJudicialNomination(input.state, id, input.context));
    expect(JSON.stringify(input.state)).toBe(before); expect(callbackCount(input)).toBe(0);
    if (id === 'return-vetting') { expect(review.nextReviewWeek).toBe(5); expect(review.timing).toContain('청문 1주'); }
    if (id === 'confirm') { expect(review.politicalCost).toBe(2); expect(review.result.state.appointments[0].appointedWeek).toBe(3); }
    if (id === 'withdraw') { expect(review.treasuryCost).toBe(0); expect(review.politicalCost).toBe(0); expect(review.result.state.activeNomination).toBeNull(); }
  });
});

describe('constitutional review permissions, funds and stage boundaries', () => {
  it.each([0, -1, 1.5, 5.5, 6, NaN, Infinity])('rejects invalid tier %s before invoking any action', (tier) => {
    const input = props(confirmation());
    input.context.role = { ...role, tier: tier as CareerRole['tier'] };
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review).toBeNull();
    input.state = drafting();
    expect(createConstitutionalReview(input, { kind: 'nominate', officeId: 'appellate-chief', candidateId: input.state.candidates[0].id }).review).toBeNull();
    expect(callbackCount(input)).toBe(0);
  });
  it('blocks already adopted clauses so an unchanged approval cannot cost political power again', () => {
    const input = props(drafting(true));
    expect(createConstitutionalReview(input, clauseOrder).reason).toContain('이미 초안');
    expect(callbackCount(input)).toBe(0);
  });
  it.each<ConstitutionalOrder>([{ kind: 'activate' }, clauseOrder, { kind: 'ratify', id: 'referendum' }])('requires top-tier authority for $kind', (order) => {
    const input = props(order.kind === 'activate' ? createConstitutionalJudiciaryState('korea') : drafting(true));
    input.context.role = { ...role, tier: 2 };
    expect(createConstitutionalReview(input, order).review).toBeNull();
  });
  it('requires seven valid chapters and compatible ratification methods', () => {
    expect(createConstitutionalReview(props(), { kind: 'ratify', id: 'referendum' }).reason).toContain('일곱 장');
    const input = props(drafting(true));
    expect(createConstitutionalReview(input, { kind: 'ratify', id: 'royal-assent' }).review).toBeNull();
    expect(createConstitutionalReview(input, { kind: 'ratify', id: 'party-congress' }).review).toBeNull();
    input.state.draft.government = 'unknown-clause';
    expect(createConstitutionalReview(input, { kind: 'ratify', id: 'referendum' }).reason).toContain('확인할 수 없는 조항');
  });
  it('requires the two political power actually charged for normal confirmation', () => {
    const input = props(confirmation()); input.context = context(3, { politicalPower: 1 });
    // Both direct engine calls and the review reject an unfunded confirmation.
    expect(resolveJudicialNomination(input.state, 'confirm', input.context)).toBeNull();
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review).toBeNull();
    input.context.politicalPower = 2;
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review?.politicalPowerAfter).toBe(0);
  });
  it.each(['vetting', 'hearing'] as const)('does not permit even withdrawal in the %s stage', (stage) => {
    const input = props(confirmation()); input.state.activeNomination!.stage = stage;
    for (const id of ['confirm', 'return-vetting', 'withdraw', 'force-through'] as const) expect(createConstitutionalReview(input, { kind: 'decision', id }).review).toBeNull();
  });
  it('respects office tier, branch and special military appointment authority', () => {
    const input = props(); input.context.role = { ...role, tier: 2, branch: 'politics' };
    const order = { kind: 'nominate', officeId: 'appellate-chief', candidateId: input.state.candidates[0].id } as const;
    expect(createConstitutionalReview(input, order).review).not.toBeNull();
    expect(createConstitutionalReview(input, { ...order, officeId: 'supreme-chief' }).review).toBeNull();
    input.context.role = { ...role, tier: 2, branch: 'military' };
    expect(createConstitutionalReview(input, order).review).toBeNull();
    expect(createConstitutionalReview(input, { ...order, officeId: 'military-advocate-general' }).review).not.toBeNull();
  });
  it('blocks final decisions after losing the required office tier', () => {
    const input = props(confirmation()); input.context.role = { ...role, tier: 2 };
    for (const id of ['confirm', 'return-vetting', 'withdraw', 'force-through'] as const) expect(createConstitutionalReview(input, { kind: 'decision', id }).review).toBeNull();
  });
  it('requires hearing support for ordinary approval, but preserves the explicit force-through alternative', () => {
    const input = props(confirmation()); input.state.activeNomination!.hearingSupport = 49;
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review).toBeNull();
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'force-through' }).review?.politicalCost).toBe(8);
    input.context.politicalPower = 7;
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'force-through' }).review).toBeNull();
  });
  it('requires both resources for re-vetting and has no refund for withdrawal', () => {
    const input = props(confirmation()); input.context = context(3, { treasury: 3, politicalPower: 3 });
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'return-vetting' }).review).toBeNull();
    input.context.treasury = 4;
    expect(createConstitutionalReview(input, { kind: 'decision', id: 'return-vetting' }).review?.treasuryAfter).toBe(0);
    const withdrawal = createConstitutionalReview(input, { kind: 'decision', id: 'withdraw' }).review!;
    expect(withdrawal.treasuryAfter).toBe(4);
  });
  it('blocks nomination when the office is occupied, absent from the constitution, or another process is active', () => {
    const state = drafting(true);
    state.draft.review = 'parliamentary-sovereignty';
    const enacted = ratifyConstitution(state, 'constituent-assembly', context())!.state;
    const input = props(enacted); const order: ConstitutionalOrder = { kind: 'nominate', officeId: 'constitutional-justice', candidateId: state.candidates[0].id };
    expect(createConstitutionalReview(input, order).review).toBeNull();
    const pending = props(confirmation());
    expect(createConstitutionalReview(pending, { ...order, officeId: 'supreme-chief' }).review).toBeNull();
    const appointed = resolveJudicialNomination(pending.state, 'confirm', context(3))!.state;
    expect(createConstitutionalReview(props(appointed), { ...order, officeId: 'supreme-chief' }).review).toBeNull();
  });
  it.each(['cash', 'power', 'foreign', 'foreign-role', 'nan', 'week', 'busy'] as const)('fails closed for %s input', (kind) => {
    const input = props();
    if (kind === 'cash') { input.state = drafting(true); input.context.treasury = 0; }
    if (kind === 'power') input.context.politicalPower = 0;
    if (kind === 'foreign') input.context.nationId = 'usa';
    if (kind === 'foreign-role') input.context.role = { ...role, nationId: 'usa' };
    if (kind === 'nan') input.context.treasury = NaN;
    if (kind === 'week') input.context.week = -1;
    if (kind === 'busy') input.busy = true;
    expect(createConstitutionalReview(input, kind === 'cash' ? { kind: 'ratify', id: 'referendum' } : clauseOrder).review).toBeNull();
    expect(callbackCount(input)).toBe(0);
  });
});

describe('approval is explicit, stale-safe and duplicate-safe', () => {
  it.each([['confirm', 'force-through'], ['force-through', 'confirm'], ['return-vetting', 'withdraw']] as const)('dispatches only one alternative for the same nomination round: %s then %s', (first, second) => {
    const input = props(confirmation()); input.context = context(3);
    const firstReview = createConstitutionalReview(input, { kind: 'decision', id: first }).review!;
    const secondReview = createConstitutionalReview(input, { kind: 'decision', id: second }).review!;
    const gate = { lastFingerprint: null };
    expect(confirmConstitutionalReview(firstReview, input, input, gate).status).toBe('sent');
    expect(confirmConstitutionalReview(secondReview, input, input, gate).status).toBe('blocked');
    expect(input.onNominationDecision).toHaveBeenCalledExactlyOnceWith(first);
  });
  it('does not reopen a dispatched nomination just because resources change', () => {
    const input = props(confirmation()); input.context = context(3);
    const gate = { lastFingerprint: null };
    const first = createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review!;
    expect(confirmConstitutionalReview(first, input, input, gate).status).toBe('sent');
    input.context.treasury += 1;
    const alternative = createConstitutionalReview(input, { kind: 'decision', id: 'force-through' }).review!;
    expect(confirmConstitutionalReview(alternative, input, input, gate).status).toBe('blocked');
    expect(callbackCount(input)).toBe(1);
  });
  it('allows a new decision for the same nomination id after actual re-vetting and hearing', () => {
    const input = props(confirmation()); input.context = context(3);
    const id = input.state.activeNomination!.id;
    const gate = { lastFingerprint: null };
    const recheck = createConstitutionalReview(input, { kind: 'decision', id: 'return-vetting' }).review!;
    expect(confirmConstitutionalReview(recheck, input, input, gate).status).toBe('sent');
    input.state = resolveJudicialNomination(input.state, 'return-vetting', input.context)!.state;
    input.state = advanceConstitutionalJudiciaryWeek(input.state, context(5)).state;
    input.state = advanceConstitutionalJudiciaryWeek(input.state, context(6)).state;
    input.context = context(6);
    expect(input.state.activeNomination!.id).toBe(id);
    const confirmationReview = createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review!;
    expect(confirmConstitutionalReview(confirmationReview, input, input, gate).status).toBe('sent');
    expect(input.onNominationDecision).toHaveBeenCalledTimes(2);
  });
  it('locks alternative nomination decisions before a reentrant dispatch', () => {
    const input = props(confirmation()); const gate = { lastFingerprint: null };
    const ordinary = createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review!;
    const force = createConstitutionalReview(input, { kind: 'decision', id: 'force-through' }).review!;
    input.onNominationDecision = vi.fn(() => expect(confirmConstitutionalReview(force, input, input, gate).status).toBe('blocked'));
    expect(confirmConstitutionalReview(ordinary, input, input, gate).status).toBe('sent');
    expect(callbackCount(input)).toBe(1);
  });
  it('sends one request only and never claims a void request proves settlement', () => {
    const input = props(); const before = JSON.stringify(input.state);
    const review = createConstitutionalReview(input, clauseOrder).review!;
    const gate = { lastFingerprint: null };
    expect(callbackCount(input)).toBe(0);
    const result = confirmConstitutionalReview(review, input, input, gate);
    expect(result.status).toBe('sent'); expect(result.reason).toContain('요청을 전달');
    expect(result.reason).toContain('반영 결과를 확인');
    expect(input.onClauseSelect).toHaveBeenCalledExactlyOnceWith(clauseIds[0]);
    expect(confirmConstitutionalReview(review, input, input, gate).status).toBe('blocked');
    expect(callbackCount(input)).toBe(1); expect(JSON.stringify(input.state)).toBe(before);
  });
  it.each(['week', 'year', 'nation', 'tier', 'branch', 'cash', 'power', 'confidence', 'draft', 'history'] as const)('requires renewed review after %s changes', (kind) => {
    const input = props(); const review = createConstitutionalReview(input, clauseOrder).review!;
    if (kind === 'week') input.context.week++;
    if (kind === 'year') input.context.year++;
    if (kind === 'nation') input.context.nationId = 'usa';
    if (kind === 'tier') input.context.role = { ...role, tier: 2 };
    if (kind === 'branch') input.context.role = { ...role, branch: 'military' };
    if (kind === 'cash') input.context.treasury++;
    if (kind === 'power') input.context.politicalPower++;
    if (kind === 'confidence') input.context.publicConfidence++;
    if (kind === 'draft') input.state.draft.rights = 'civil-liberties-charter';
    if (kind === 'history') input.state.history = [];
    expect(confirmConstitutionalReview(review, input, input, { lastFingerprint: null }).status).toBe('stale');
    expect(callbackCount(input)).toBe(0);
  });
  it('blocks approval while busy even if the reviewed state is otherwise identical', () => {
    const input = props(); const review = createConstitutionalReview(input, clauseOrder).review!;
    input.busy = true;
    expect(confirmConstitutionalReview(review, input, input, { lastFingerprint: null }).status).toBe('blocked');
    expect(callbackCount(input)).toBe(0);
  });
  it('locks before dispatch so a nested duplicate cannot be sent', () => {
    const input = props(); const review = createConstitutionalReview(input, clauseOrder).review!;
    const gate = { lastFingerprint: null };
    input.onClauseSelect = vi.fn(() => expect(confirmConstitutionalReview(review, input, input, gate).status).toBe('blocked'));
    expect(confirmConstitutionalReview(review, input, input, gate).status).toBe('sent');
    expect(callbackCount(input)).toBe(1);
  });
  it('keeps an uncertain request locked when its handler throws', () => {
    const input = props(); input.onClauseSelect = vi.fn(() => { throw new Error('request failure'); });
    const review = createConstitutionalReview(input, clauseOrder).review!;
    const gate = { lastFingerprint: null };
    expect(confirmConstitutionalReview(review, input, input, gate).status).toBe('uncertain');
    expect(confirmConstitutionalReview(review, input, input, gate).status).toBe('blocked');
    expect(callbackCount(input)).toBe(1);
  });
  it.each(['activate', 'ratify', 'nominate', 'decision'] as const)('dispatches only the selected %s request', (kind) => {
    const input = props(kind === 'activate' ? createConstitutionalJudiciaryState('korea') : kind === 'decision' ? confirmation() : drafting(true));
    const order: ConstitutionalOrder = kind === 'activate' ? { kind } : kind === 'ratify' ? { kind, id: 'referendum' } : kind === 'decision' ? { kind, id: 'confirm' } : { kind, officeId: 'supreme-chief', candidateId: input.state.candidates[0].id };
    const review = createConstitutionalReview(input, order).review!;
    expect(confirmConstitutionalReview(review, input, input, { lastFingerprint: null }).status).toBe('sent');
    expect(callbackCount(input)).toBe(1);
  });
});

describe('single selection and compact workspaces', () => {
  it('keeps the reviewed candidate and office after appointment instead of moving to the next vacancy', () => {
    const state = confirmation(); const selected = state.candidates[0].id;
    const result = resolveJudicialNomination(state, 'confirm', context(3))!.state;
    expect(resolveJudicialCandidateChoice(result, selected).id).toBe(selected);
    expect(resolveJudicialOfficeChoice(result, 3, 'supreme-chief').id).toBe('supreme-chief');
    expect(resolveJudicialOfficeChoice(result, 3).id).not.toBe('supreme-chief');
  });
  it('keeps the chosen clause after approval and only falls back for missing targets', () => {
    const before = drafting();
    const choice = resolveConstitutionClauseChoice(before, 'government').id;
    const after = selectConstitutionClause(before, choice, context())!.state;
    expect(resolveConstitutionClauseChoice(after, 'government', choice).id).toBe(choice);
    expect(resolveConstitutionClauseChoice(after, 'government', 'missing').id).toBe(choice);
    expect(resolveJudicialCandidateChoice(after, 'removed')?.id).toBe(after.candidates[0].id);
  });
  it.each<ConstitutionalJudiciaryView>(['draft', 'appointments', 'procedure', 'records'])('renders %s without invoking actions or changing input', (initialView) => {
    const input = props(drafting(true)); freeze(input.state); freeze(input.context);
    const before = JSON.stringify(input.state);
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView={initialView} />);
    expect(html).toContain('헌정·사법 작업보기');
    expect(html).toContain('헌법 초안'); expect(html).toContain('사법 인사'); expect(html).toContain('절차 진행'); expect(html).toContain('기록');
    expect(callbackCount(input)).toBe(0); expect(JSON.stringify(input.state)).toBe(before);
  });
  it('renders only one candidate detail, preserving the explicit fictional label and local currency', () => {
    const input = props();
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView="appointments" />);
    expect(html).toContain(input.state.candidates[0].profile);
    expect(html).not.toContain(input.state.candidates[1].profile);
    expect(html).toContain('가상 법조인'); expect(html).toContain('₩ 8'); expect(html).not.toContain('작업 승인');
  });
  it('requests exact money resolution for cost, current cash and cash after expenditure', () => {
    const input = props();
    const formatter = vi.fn((value: number, options?: { signed?: boolean; exact?: boolean }) => options?.exact ? `£ ${value.toFixed(2)}` : '£ compact');
    input.formatMoney = formatter;
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView="appointments" />);
    expect(formatter).toHaveBeenCalledWith(8, { exact: true });
    expect(formatter).toHaveBeenCalledWith(500, { exact: true });
    expect(formatter).toHaveBeenCalledWith(492, { exact: true });
    expect(formatter.mock.calls.filter(([, options]) => options?.exact)).toHaveLength(3);
    expect(html).toContain('£ 8.00'); expect(html).toContain('£ 500.00'); expect(html).toContain('£ 492.00');
    expect(formatter).toHaveBeenCalledWith(500);
    expect(callbackCount(input)).toBe(0);
  });
  it('does not render all alternative clause details together or pretend preview is adoption', () => {
    const input = props(); const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} />);
    const choice = resolveConstitutionClauseChoice(input.state, 'government');
    expect(html).toContain(choice.summary);
    expect(html).not.toContain(constitutionClauses.find((clause) => clause.axis === 'government' && clause.id !== choice.id)!.summary);
    expect(html).toContain('열람은 무료'); expect(html).toContain('조항 채택 비용 검토');
    expect(html).not.toContain('작업 승인');
  });
  it('keeps ratification and the active nomination reachable even in compact mode', () => {
    const input = props({ ...drafting(true), activeNomination: confirmation().activeNomination });
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView="procedure" compact />);
    expect(html).toContain('검토할 절차'); expect(html).toContain('헌법 비준');
    expect(html).toContain('인사 결정과 결과 검토'); expect(html).toContain('인준·임명');
  });
  it('keeps actual history and constitutional metrics available in compact mode', () => {
    const input = props(drafting(true));
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView="records" compact />);
    expect(html).toContain(input.state.history[0].detail); expect(html).toContain('법원 독립');
    expect(html).not.toContain('constitutional-history');
  });
  it('shows the current stage and exact next-review week without automatic advancement', () => {
    const input = props();
    input.state = nominateJudicialCandidate(input.state, 'supreme-chief', input.state.candidates[0].id, context(10))!.state;
    input.context = context(10);
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...input} initialView="procedure" />);
    expect(html).toContain('제 13주'); expect(html).toContain('신원·재산 검증');
    expect(html).not.toContain('인사 결정과 결과 검토'); expect(input.state.activeNomination?.stage).toBe('vetting');
  });
  it('renders busy read-only guidance and a disabled review button', () => {
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...props()} busy />);
    expect(html).toContain('열람은 가능'); expect(html).toMatch(/disabled=""[^>]*>조항 채택 비용 검토/);
  });
  it('exposes a dedicated CSS scope and labelled native single selectors for mobile layout', () => {
    const html = renderToStaticMarkup(<ConstitutionalJudiciaryBoard {...props()} />);
    expect(html).toContain('constitutional-judiciary-board ce5-constitution');
    expect(html).toContain('검토할 장<select');
    expect(html).toContain('조항 선택 · 열람은 무료<select');
    expect(html).not.toContain('constitution-clause-grid');
  });
});

describe('bounded national indicator previews', () => {
  it('shows exact clamped before and after values for all supplied indicators', () => {
    const input = props(drafting(true));
    input.context = context(0, { stability: 99, legitimacy: 99, institutionalCapacity: 99, publicConfidence: 99 });
    input.nationalIndicators = { unrest: 1, justiceIndependence: 99, justiceIntegrity: 99 };
    freeze(input.state); freeze(input.context); freeze(input.nationalIndicators);
    const before = JSON.stringify([input.state, input.context, input.nationalIndicators]);
    const review = createConstitutionalReview(input, { kind: 'ratify', id: 'constituent-assembly' }).review!;
    expect(review.contributions.length).toBeGreaterThan(4);
    for (const change of review.contributions) {
      expect(change.before).toBeDefined();
      expect(change.after).toBe(Math.max(0, Math.min(100, change.before! + change.value)));
    }
    expect(review.contributions.find((change) => change.label === '사회 불안')).toMatchObject({ before: 1, after: 0 });
    expect(review.contributions.find((change) => change.label === '국정 사법 독립')).toMatchObject({ before: 99, after: 100 });
    expect(JSON.stringify([input.state, input.context, input.nationalIndicators])).toBe(before);
  });
  it('keeps explicit nominal-only fallback for absent national indicators', () => {
    const review = createConstitutionalReview(props(drafting(true)), { kind: 'ratify', id: 'referendum' }).review!;
    expect(review.contributions.find((change) => change.label === '안정도')?.before).toBe(68);
    const independence = review.contributions.find((change) => change.label === '국정 사법 독립')!;
    expect(independence.value).not.toBe(0);
    expect(independence.before).toBeUndefined(); expect(independence.after).toBeUndefined();
  });
  it('preserves zero actual improvement at a cap instead of promising the nominal increase', () => {
    const input = props(confirmation()); input.context = context(3, { institutionalCapacity: 100 });
    input.nationalIndicators = { unrest: 0, justiceIndependence: 100, justiceIntegrity: 100 };
    const review = createConstitutionalReview(input, { kind: 'decision', id: 'confirm' }).review!;
    const independence = review.contributions.find((change) => change.label === '국정 사법 독립')!;
    expect(independence.value).toBeGreaterThan(0);
    expect(independence.before).toBe(100); expect(independence.after).toBe(100);
  });
  it('requires renewed approval when supplied national indicators change', () => {
    const input = props(drafting(true));
    input.nationalIndicators = { unrest: 20, justiceIndependence: 50, justiceIntegrity: 60 };
    const review = createConstitutionalReview(input, { kind: 'ratify', id: 'referendum' }).review!;
    input.nationalIndicators.unrest = 21;
    expect(confirmConstitutionalReview(review, input, input, { lastFingerprint: null }).status).toBe('stale');
    expect(callbackCount(input)).toBe(0);
  });
  it('blocks non-finite optional indicators without reading them as a valid quote', () => {
    const input = props(drafting(true));
    input.nationalIndicators = { unrest: NaN, justiceIndependence: 50, justiceIntegrity: 60 };
    expect(createConstitutionalReview(input, { kind: 'ratify', id: 'referendum' }).review).toBeNull();
  });
});
