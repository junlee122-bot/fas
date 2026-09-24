import { describe, expect, it, vi } from 'vitest';
import { careerRoles, createCareerState, getRole, nations } from './campaign';
import { createCivilianCareerState, getCivilianRoleId } from './civilianCareer';
import { createCareerMarketState, initiateCareerApproach, respondToCareerOffer } from './careerMarket';
import type { CareerApproachKind, CareerOfferResponse, ForeignCareerOffer, ForeignCareerOfferKind } from './careerMarket';
import {
  applyCareerGameDelta, assessCareerDecision, assessCareerReview, confirmCareerReview, createCareerReview,
  createCareerReviewGate, getCareerDecisionReceipt, isCareerReviewSubmitted, projectCareerTransfer,
} from './careerDecisions';
import type { CareerDecisionAction, CareerDecisionInput, CareerDecisionResult } from './careerDecisions';
import type { GameState } from './types';

function fixture(kind: ForeignCareerOfferKind = 'official-appointment'): CareerDecisionInput {
  const role = getRole('britain-tier2', 'britain');
  const game: GameState = {
    week: 26, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 78, enemyPressure: 68,
  };
  const offer: ForeignCareerOffer = {
    id: 'ce7-offer', sourceNationId: 'usa', targetRoleId: getRole('usa-tier2', 'usa').id,
    kind, status: 'pending', origin: 'foreign-initiated', receivedWeek: 24, deadlineWeek: 30,
    title: '국제 경력 검증용 제안', sender: '연락 대표', coverChannel: '공식 회선', pitch: '새 보직', demand: '합류',
    motive: 'security', secrecy: 65, exposureRisk: 30, credibility: 72, acceptanceChance: 60,
    terms: { signingBonus: 150, weeklyRetainer: 9, authority: 75, protection: 62, extraction: 70, autonomy: 'operational' },
    consequencePreview: ['인계'],
  };
  return {
    state: { ...createCareerMarketState(), offers: [offer], exposure: 12 },
    context: { week: game.week, game, role,
      career: { ...createCareerState('britain', role.id), reputation: 76, councilTrust: 48, experience: 61, legacy: 10, alternatePathId: 'old-path' },
      campaignPhase: 'war', relationByNation: { usa: 72 } },
  };
}

const responseAction = (response: CareerOfferResponse): CareerDecisionAction => ({ kind: 'respond', offerId: 'ce7-offer', response });

function execute(input: CareerDecisionInput, action: CareerDecisionAction): CareerDecisionResult {
  const before = JSON.stringify(input);
  const review = createCareerReview(input, action);
  expect(review).not.toBeNull();
  let result: CareerDecisionResult | undefined;
  const approval = confirmCareerReview(review!, input, (value) => { result = value; }, createCareerReviewGate());
  expect(approval.ok).toBe(true);
  expect(JSON.stringify(input)).toBe(before);
  if (!result) throw new Error('No result dispatched');
  return result;
}

function persisted(input: CareerDecisionInput, result: CareerDecisionResult): CareerDecisionInput {
  return { state: result.stateAfter,
    context: { ...input.context, game: result.gameAfter, career: result.careerAfter,
      role: result.transfer?.nextRole ?? input.context.role } };
}

function civilianFixture(kind: ForeignCareerOfferKind = 'official-appointment'): CareerDecisionInput {
  const input = fixture(kind);
  const roleId = getCivilianRoleId('britain', 'intellectual');
  input.context.role = getRole(roleId, 'britain');
  input.context.career = {
    ...input.context.career, roleId, startMode: 'civilian', replacedPersonId: 'civilian-self',
    civilian: { ...createCivilianCareerState('intellectual', 'university-network'),
      actionHistory: [{ id: 'civilian-past', week: 20, title: '공개 강연', outcome: '공적 신뢰 형성' }] },
  };
  return input;
}

describe('CE7 civilian origin and foreign office handover', () => {
  it('a legitimate civilian can preview an approach and remains civilian after sending it', () => {
    const input = civilianFixture();
    const action: CareerDecisionAction = { kind: 'approach', nationId: 'usa', approach: 'apply' };
    expect(assessCareerDecision(input, action).allowed).toBe(true);
    const actual = execute(input, action);
    expect(actual.careerAfter.roleId).toBe(input.context.career.roleId);
    expect(actual.careerAfter.civilian?.enteredOfficeRoleId).toBeNull();
    expect(actual.careerAfter.civilian).toEqual(input.context.career.civilian);
    expect(getCareerDecisionReceipt(actual, persisted(input, actual)).confirmed).toBe(true);
  });

  it('formal foreign appointment leaves civilian-only mandates while preserving the background and history', () => {
    const input = civilianFixture();
    const before = input.context.career.civilian!;
    const assessment = assessCareerDecision(input, responseAction('accept'));
    expect(assessment.allowed).toBe(true);
    const actual = execute(input, responseAction('accept'));
    expect(actual.careerAfter.nationId).toBe('usa');
    expect(actual.careerAfter.startMode).toBe('civilian');
    expect(actual.careerAfter.civilian).toEqual({ ...before, stage: 'institutional-insider', enteredOfficeRoleId: actual.careerAfter.roleId });
    expect(actual.careerAfter.startMode === 'civilian' && !actual.careerAfter.civilian?.enteredOfficeRoleId).toBe(false);
    expect(input.context.career.civilian?.enteredOfficeRoleId).toBeNull();
    if (!assessment.allowed || assessment.preview.kind !== 'respond') throw new Error('Missing formal preview');
    expect(assessment.preview.transfer?.nextCareer).toEqual(actual.careerAfter);
    expect(assessment.preview.transfer?.preserved.join(' ')).toContain('민간 출신과 활동 기록');
    expect(getCareerDecisionReceipt(actual, persisted(input, actual)).confirmed).toBe(true);
  });

  it('a covert contract does not fabricate a formal office or mark institutional entry', () => {
    const input = civilianFixture('secret-retainer');
    const actual = execute(input, responseAction('accept'));
    expect(actual.transfer).toBeUndefined();
    expect(actual.careerAfter.nationId).toBe('britain');
    expect(actual.careerAfter.civilian).toEqual(input.context.career.civilian);
    expect(actual.careerAfter.civilian?.enteredOfficeRoleId).toBeNull();
    expect(actual.stateAfter.clandestine).not.toBeNull();
    expect(getCareerDecisionReceipt(actual, persisted(input, actual)).confirmed).toBe(true);
  });

  it('an already appointed civilian origin points to the new office without repeating any entry reward', () => {
    const input = civilianFixture();
    input.context.role = getRole('britain-tier2', 'britain');
    input.context.career.roleId = input.context.role.id;
    input.context.career.civilian = { ...input.context.career.civilian!, stage: 'institutional-insider', enteredOfficeRoleId: input.context.role.id };
    const actual = execute(input, responseAction('accept'));
    expect(actual.careerAfter.civilian?.enteredOfficeRoleId).toBe(actual.careerAfter.roleId);
    expect(actual.careerAfter.civilian?.scrutiny).toBe(input.context.career.civilian.scrutiny);
    expect(actual.careerAfter.civilian?.worldInfluences).toEqual(input.context.career.civilian.worldInfluences);
  });
});

describe('CE7 shared international career decision projection', () => {
  it.each<CareerOfferResponse>(['defer', 'explore', 'negotiate', 'accept', 'reject', 'report', 'turn'])('response %s uses the actual engine result', (response) => {
    const input = fixture();
    const actual = execute(input, responseAction(response));
    const engine = respondToCareerOffer(input.state, 'ce7-offer', response, input.context);
    expect(actual.kind).toBe('respond');
    if (actual.kind !== 'respond') throw new Error('Wrong kind');
    expect(actual.resolution).toEqual(engine);
    expect(actual.stateAfter).toEqual(engine?.state);
    expect(getCareerDecisionReceipt(actual, persisted(input, actual)).confirmed).toBe(true);
  });

  it.each<CareerApproachKind>(['apply', 'appeal', 'request-asylum', 'offer-secrets', 'offer-double-agent'])('approach %s is assessed without revealing its future draw', (approach) => {
    const input = fixture();
    const action: CareerDecisionAction = { kind: 'approach', nationId: 'usa', approach };
    const before = JSON.stringify(input);
    const assessment = assessCareerDecision(input, action);
    expect(assessment.allowed).toBe(true);
    if (!assessment.allowed || assessment.preview.kind !== 'approach') throw new Error('Wrong preview');
    expect(assessment.preview.approach.successChance).toBeGreaterThan(0);
    expect(assessment.preview).not.toHaveProperty('approachResult');
    expect(assessment.preview.approach).not.toHaveProperty('success');
    expect(JSON.stringify(input)).toBe(before);
    const actual = execute(input, action);
    if (actual.kind !== 'approach') throw new Error('Wrong kind');
    expect(actual.approachResult).toEqual(initiateCareerApproach(input.state, 'usa', approach, input.context));
    expect(actual.gameAfter.politicalPower).toBe(input.context.game.politicalPower - 2);
    expect(actual.stateAfter.lastApproachWeek).toBe(input.context.week);
    expect(actual.careerAfter.nationId).toBe('britain');
    expect(getCareerDecisionReceipt(actual, persisted(input, actual)).confirmed).toBe(true);
  });

  it('an unsuccessful approach still spends 2 political power and applies known trust and exposure changes', () => {
    let found: CareerDecisionInput | undefined;
    for (let week = 10; week < 60; week += 1) {
      const input = fixture();
      input.context.week = input.context.game.week = week;
      if (!initiateCareerApproach(input.state, 'usa', 'apply', input.context).success) { found = input; break; }
    }
    expect(found).toBeDefined();
    const actual = execute(found!, { kind: 'approach', nationId: 'usa', approach: 'apply' });
    expect(actual.kind === 'approach' && actual.approachResult.success).toBe(false);
    expect(actual.gameAfter.politicalPower).toBe(found!.context.game.politicalPower - 2);
    expect(actual.careerAfter.councilTrust).toBe(found!.context.career.councilTrust - 7);
    expect(actual.stateAfter.exposure).toBe(found!.state.exposure + 2);
  });

  it.each(nations.filter((nation) => nation.id !== 'britain'))('transfer into $id uses exact national modifiers, not the old treasury plus signing money', (nation) => {
    const input = fixture();
    const role = careerRoles.find((entry) => entry.nationId === nation.id && entry.tier === 2)!;
    input.state.offers[0] = { ...input.state.offers[0], sourceNationId: nation.id, targetRoleId: role.id };
    const actual = execute(input, responseAction('accept'));
    expect(actual.transfer?.nextNation.id).toBe(nation.id);
    expect(actual.transfer?.nextRole.id).toBe(role.id);
    expect(actual.gameAfter).toEqual(applyCareerGameDelta({ ...input.context.game, ...nation.modifiers, week: 26 }, { treasury: 150, politicalPower: 6, stability: -3 }));
    expect(actual.careerAfter).toMatchObject({ nationId: nation.id, roleId: role.id, councilTrust: 52, experience: 34,
      reputation: 81, legacy: 12, alternatePathId: null, replacedPersonId: role.historicalHolderId });
    expect(actual.transfer?.nextCareer).toEqual(actual.careerAfter);
    expect(actual.transfer?.nextGame).toEqual(actual.gameAfter);
  });

  it('transfer to Britain is also projected without a current-country fallback', () => {
    const input = fixture();
    const usa = getRole('usa-tier2', 'usa');
    input.context.role = usa;
    input.context.career = { ...input.context.career, nationId: 'usa', roleId: usa.id };
    input.state.offers[0] = { ...input.state.offers[0], sourceNationId: 'britain', targetRoleId: 'britain-tier2' };
    expect(execute(input, responseAction('accept')).careerAfter.nationId).toBe('britain');
  });

  it('transfer preview and saved projection agree exactly and describe all ongoing research as preserved', () => {
    const input = fixture();
    const assessment = assessCareerDecision(input, responseAction('accept'));
    const result = execute(input, responseAction('accept'));
    if (!assessment.allowed || assessment.preview.kind !== 'respond') throw new Error('Missing preview');
    expect(assessment.preview.transfer).toEqual(result.transfer);
    expect(result.transfer?.preserved.join(' ')).toContain('연구 목록과 진행도');
    expect(assessment.preview.response.weeklyRetainer).toBe(0);
    expect(result.transfer?.nextRole.authority).toBe(getRole('usa-tier2', 'usa').authority);
  });

  it('transfer floors experience at 12 and clamps bounded career values exactly', () => {
    const input = fixture();
    input.context.career.experience = 1;
    input.context.career.reputation = 99;
    const result = execute(input, responseAction('accept'));
    expect(result.careerAfter.experience).toBe(12);
    expect(result.careerAfter.reputation).toBe(100);
    expect(result.gameAfter.week).toBe(26);
  });

  it.each<ForeignCareerOfferKind>(['secret-retainer', 'sell-secrets', 'double-agent', 'state-betrayal'])('%s acceptance keeps the nation and establishes actual clandestine retainer state', (kind) => {
    const input = fixture(kind);
    const result = execute(input, responseAction('accept'));
    expect(result.transfer).toBeUndefined();
    expect(result.careerAfter.nationId).toBe('britain');
    expect(result.gameAfter.treasury).toBe(1070);
    expect(result.gameAfter.politicalPower).toBe(82);
    expect(result.careerAfter.councilTrust).toBe(34);
    expect(result.stateAfter.clandestine).not.toBeNull();
  });

  it('invalid target nation/role does not fall back to a first nation or role', () => {
    const input = fixture();
    const transfer = { nationId: 'usa' as const, roleId: 'missing-role', status: 'defector' as const };
    expect(projectCareerTransfer(input, transfer, {}, { reputation: 0, councilTrust: 0, legacy: 0 })).toBeNull();
  });

  it('game deltas retain the established percent caps and unbounded treasury units', () => {
    const game = fixture().context.game;
    const next = applyCareerGameDelta(game, { treasury: 10000, stability: 100, commandPoints: -999, week: 1 });
    expect(next.treasury).toBe(10920);
    expect(next.stability).toBe(100);
    expect(next.commandPoints).toBe(0);
    expect(next.week).toBe(27);
    expect(game.stability).toBe(78);
  });
});

describe('CE7 stale review and dispatch protection', () => {
  const staleChanges: [string, (input: CareerDecisionInput) => void][] = [
    ['week', (input) => { input.context.week += 1; input.context.game.week += 1; }],
    ['nation', (input) => { input.context.career.nationId = 'usa'; }],
    ['role', (input) => { input.context.role = getRole('britain-tier3', 'britain'); }],
    ['treasury', (input) => { input.context.game.treasury -= 1; }],
    ['political power', (input) => { input.context.game.politicalPower -= 1; }],
    ['reputation', (input) => { input.context.career.reputation -= 1; }],
    ['intelligence', (input) => { input.context.game.intelNetwork -= 1; }],
    ['offer conditions', (input) => { input.state.offers[0].terms.signingBonus += 1; }],
    ['offer identity', (input) => { input.state.offers[0].targetRoleId = 'usa-tier3'; }],
    ['deadline', (input) => { input.state.offers[0].deadlineWeek += 1; }],
    ['offer deletion', (input) => { input.state.offers = []; }],
    ['market exposure', (input) => { input.state.exposure += 1; }],
    ['foreign relation', (input) => { input.context.relationByNation = { usa: 12 }; }],
    ['busy input', (input) => { input.busy = true; }],
    ['busy context', (input) => { input.context.busy = true; }],
  ];
  it.each(staleChanges)('rejects changed %s before callback', (_label, change) => {
    const input = fixture();
    const review = createCareerReview(input, responseAction('accept'))!;
    change(input);
    const callback = vi.fn();
    expect(assessCareerReview(review, input).allowed).toBe(false);
    expect(confirmCareerReview(review, input, callback, createCareerReviewGate()).ok).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it.each([NaN, Infinity, -1])('rejects invalid resource %s without projecting a result', (value) => {
    const input = fixture();
    input.context.game.treasury = value;
    expect(createCareerReview(input, responseAction('accept'))).toBeNull();
  });

  it('rejects contradictory context and game weeks', () => {
    const input = fixture();
    input.context.week += 1;
    expect(assessCareerDecision(input, responseAction('accept')).allowed).toBe(false);
  });

  it('review freezes its cloned action, terms and identity without freezing live campaign objects', () => {
    const input = fixture();
    const action = responseAction('accept');
    const review = createCareerReview(input, action)!;
    expect(Object.isFrozen(review)).toBe(true);
    expect(Object.isFrozen(review.action)).toBe(true);
    expect(Object.isFrozen(review.assessment.preview)).toBe(true);
    expect(Object.isFrozen(input.state.offers[0])).toBe(false);
    expect(Object.isFrozen(nations[0])).toBe(false);
    if (action.kind === 'respond') action.response = 'reject';
    expect(review.action).toEqual(responseAction('accept'));
  });

  it('deduplicates both repeated reviews and different actions before persisted state changes', () => {
    const input = fixture();
    const review = createCareerReview(input, responseAction('explore'))!;
    const other = createCareerReview(input, responseAction('report'))!;
    const gate = createCareerReviewGate();
    const callback = vi.fn();
    expect(isCareerReviewSubmitted(review, gate)).toBe(false);
    expect(confirmCareerReview(review, input, callback, gate).ok).toBe(true);
    expect(isCareerReviewSubmitted(review, gate)).toBe(true);
    expect(confirmCareerReview(review, input, callback, gate).ok).toBe(false);
    expect(confirmCareerReview(other, input, callback, gate).ok).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('blocks reentrant dispatch before invoking the outer callback', () => {
    const input = fixture();
    const review = createCareerReview(input, responseAction('report'))!;
    const gate = createCareerReviewGate();
    const inner = vi.fn();
    confirmCareerReview(review, input, () => {
      expect(confirmCareerReview(review, input, inner, gate).ok).toBe(false);
    }, gate);
    expect(inner).not.toHaveBeenCalled();
  });

  it.each(['false', 'throw'] as const)('uncertain callback %s keeps the lock and does not fabricate saved success', (mode) => {
    const input = fixture();
    const review = createCareerReview(input, responseAction('report'))!;
    const gate = createCareerReviewGate();
    let actual: CareerDecisionResult | undefined;
    const callback = vi.fn((result: CareerDecisionResult) => {
      actual = result;
      if (mode === 'throw') throw new Error('uncertain result');
      return false;
    });
    expect(confirmCareerReview(review, input, callback, gate).ok).toBe(false);
    expect(isCareerReviewSubmitted(review, gate)).toBe(true);
    expect(confirmCareerReview(review, input, callback, gate).ok).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(getCareerDecisionReceipt(actual!, input).confirmed).toBe(false);
  });

  it('allows a new review after real persisted change and bounds gate memory to one current snapshot', () => {
    const input = fixture();
    const gate = createCareerReviewGate();
    const oldReview = createCareerReview(input, responseAction('explore'))!;
    let result: CareerDecisionResult | undefined;
    confirmCareerReview(oldReview, input, (value) => { result = value; }, gate);
    const next = persisted(input, result!);
    const nextReview = createCareerReview(next, responseAction('negotiate'))!;
    expect(confirmCareerReview(nextReview, next, () => {}, gate).ok).toBe(true);
    expect(gate.submitted.size).toBe(1);
    expect(isCareerReviewSubmitted(oldReview, gate)).toBe(false);
  });

  it.each(['market', 'game', 'career'] as const)('receipt waits if the actual %s branch is not committed', (branch) => {
    const input = fixture();
    const result = execute(input, responseAction('accept'));
    const next = persisted(input, result);
    if (branch === 'market') next.state = input.state;
    if (branch === 'game') next.context.game = input.context.game;
    if (branch === 'career') next.context.career = input.context.career;
    expect(getCareerDecisionReceipt(result, next).confirmed).toBe(false);
    expect(getCareerDecisionReceipt(result, next).status).toBe('pending');
  });

  it('receipt remains available after changing nation, but does not claim exact current state after later weeks', () => {
    const input = fixture();
    const result = execute(input, responseAction('accept'));
    const next = persisted(input, result);
    expect(next.context.career.nationId).toBe('usa');
    expect(getCareerDecisionReceipt(result, next).confirmed).toBe(true);
    next.context = { ...next.context, week: 27, game: { ...next.context.game, week: 27 } };
    expect(getCareerDecisionReceipt(result, next).status).toBe('changed');
    expect(getCareerDecisionReceipt(result, next).confirmed).toBe(false);
  });
});
