import { describe, expect, it, vi } from 'vitest';
import { createStaffCandidates, createStaffRoster, getRole } from './campaign';
import { defaultRecruitmentOffer, isCandidateShortlisted, weeklyRivalInterest } from './recruitment';
import {
  advanceCandidateScouting, assessPersonnelAction, assessPersonnelReview, confirmPersonnelReview,
  createPersonnelReview, createPersonnelReviewGate, getCandidateScoutingPlan,
  getPersonnelScoutingSummary, normalizeCandidateScouting, normalizeCandidateScoutingRoster,
  isPersonnelReviewSubmitted,
} from './personnelActions';
import type { PersonnelAction, PersonnelActionResult, PersonnelContext } from './personnelActions';
import type { NationId, StaffCandidate, StaffMember } from './types';

function fixture(): PersonnelContext {
  const candidate: StaffCandidate = {
    id: 'candidate-a', personId: 'person-a', name: '새 후보', role: '작전참모', historicalOffice: '현직', affiliation: '기관', summary: '요약',
    department: 'operations', ability: 88, potential: 94, loyalty: 75, weeklyCost: 8, signingCost: 150, interest: 85, knowledge: 70,
    status: 'unscouted', specialty: '작전', influence: 84, relationship: 20, rivalInterest: 30, availability: 'available', lastApproachWeek: null,
  };
  const incumbent: StaffMember = {
    id: 'operations', personId: 'person-incumbent', name: '전임자', candidateName: '후계자', role: '작전참모', historicalOffice: '전임 직무',
    affiliation: '군', summary: '기존 요약', department: 'operations', ability: 77, potential: 89, loyalty: 64, workload: 43,
    weeklyCost: 6, specialty: '방어', influence: 71, delegated: true, grade: 2, development: 53, lastMeetingWeek: 8,
  };
  return {
    game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
    role: getRole('britain-tier1', 'britain'), reputation: 45, staff: [incumbent], candidates: [candidate],
  };
}

function candidateWith(context: PersonnelContext, patch: Partial<StaffCandidate>) {
  return { ...context, candidates: [{ ...context.candidates[0], ...patch }, ...context.candidates.slice(1)] };
}

function result(context: PersonnelContext, action: PersonnelAction): PersonnelActionResult {
  const before = JSON.stringify(context);
  const assessment = assessPersonnelAction(context, action);
  expect(JSON.stringify(context)).toBe(before);
  if (!assessment.allowed) throw new Error(assessment.reason);
  return assessment.result;
}

function blocked(context: PersonnelContext, action: PersonnelAction, reason?: string) {
  const assessment = assessPersonnelAction(context, action);
  expect(assessment.allowed).toBe(false);
  if (!assessment.allowed && reason) expect(assessment.reason).toContain(reason);
}

const scout: PersonnelAction = { kind: 'scout', candidateId: 'candidate-a' };
const recruit: PersonnelAction = { kind: 'recruit', candidateId: 'candidate-a', offer: defaultRecruitmentOffer };
const stop: PersonnelAction = { kind: 'stop-scout', candidateId: 'candidate-a' };
const shortlist: PersonnelAction = { kind: 'shortlist', candidateId: 'candidate-a' };
const approach: PersonnelAction = { kind: 'approach', candidateId: 'candidate-a' };

describe('personnel scouting lifecycle and independent shortlist', () => {
  it('charges only initial scouting and gives the same +8 as the existing engine', () => {
    const context = fixture();
    const outcome = result(context, scout);
    expect(outcome.gameDelta).toEqual({ politicalPower: -2, treasury: -0 });
    expect(outcome.updatedCandidate).toMatchObject({ knowledge: 78, status: 'scouting', shortlisted: false });
    expect(outcome.staff).toBe(context.staff);
  });

  it('does not start or charge an already active assignment', () => {
    blocked(candidateWith(fixture(), { status: 'scouting' }), scout, '이미 자동 조사');
  });

  it('returns no charge or ongoing slot when investigation was already complete', () => {
    blocked(candidateWith(fixture(), { status: 'scouting', knowledge: 100 }), scout, '100% 완료');
    expect(normalizeCandidateScouting({ ...fixture().candidates[0], status: 'scouting', knowledge: 100 }).status).toBe('unscouted');
  });

  it('immediate +8 completion returns the slot in the same action', () => {
    const outcome = result(candidateWith(fixture(), { knowledge: 98, shortlisted: true }), scout);
    expect(outcome.updatedCandidate).toMatchObject({ knowledge: 100, status: 'shortlisted', shortlisted: true });
    expect(getPersonnelScoutingSummary({ ...fixture(), candidates: outcome.candidates }).active).toBe(0);
  });

  it('stopping investigation retains knowledge, interest and shortlist and costs nothing', () => {
    const context = candidateWith(fixture(), { status: 'scouting', shortlisted: true });
    const outcome = result(context, stop);
    expect(outcome.cost).toEqual({ politicalPower: 0, treasury: 0 });
    expect(outcome.updatedCandidate).toMatchObject({ knowledge: 70, status: 'shortlisted', shortlisted: true });
    expect(advanceCandidateScouting(outcome.candidates, false)[0].knowledge).toBe(70);
    expect(advanceCandidateScouting(outcome.candidates, false)[0].rivalInterest).toBeGreaterThanOrEqual(30);
  });

  it('cannot stop a non-assignment but can release a legacy completed one', () => {
    blocked(fixture(), stop, '진행 중인 조사');
    const outcome = result(candidateWith(fixture(), { status: 'scouting', knowledge: 100 }), stop);
    expect(outcome.updatedCandidate?.status).toBe('unscouted');
    expect(outcome.cost.politicalPower).toBe(0);
  });

  it('shortlist add and removal leave an active assignment running', () => {
    const context = candidateWith(fixture(), { status: 'scouting' });
    const added = result(context, shortlist);
    expect(added.updatedCandidate).toMatchObject({ status: 'scouting', shortlisted: true });
    expect(isCandidateShortlisted(added.candidates[0])).toBe(true);
    const removed = result({ ...context, candidates: added.candidates }, shortlist);
    expect(removed.updatedCandidate).toMatchObject({ status: 'scouting', shortlisted: false });
    expect(advanceCandidateScouting(removed.candidates, false)[0].knowledge).toBe(88);
  });

  it('reads legacy shortlist status and preserves it through scouting and JSON saves', () => {
    const context = candidateWith(fixture(), { status: 'shortlisted' });
    expect(isCandidateShortlisted(context.candidates[0])).toBe(true);
    const outcome = result(context, scout);
    const saved = JSON.parse(JSON.stringify(outcome.candidates)) as StaffCandidate[];
    expect(saved[0]).toMatchObject({ status: 'scouting', shortlisted: true });
    expect(isCandidateShortlisted(saved[0])).toBe(true);
    expect(normalizeCandidateScouting({ ...saved[0], knowledge: 100 }).status).toBe('shortlisted');
  });

  it('explicit false overrides obsolete shortlisted status', () => {
    const source = { ...fixture().candidates[0], status: 'shortlisted' as const, shortlisted: false };
    expect(isCandidateShortlisted(source)).toBe(false);
    expect(normalizeCandidateScouting(source).status).toBe('unscouted');
  });

  it('capacity excludes completed legacy assignments and respects personnel delegation', () => {
    const context = fixture();
    context.candidates.push({ ...context.candidates[0], id: 'b', personId: 'b', status: 'scouting', knowledge: 100 });
    context.candidates.push({ ...context.candidates[0], id: 'c', personId: 'c', status: 'scouting', knowledge: 20 });
    expect(getPersonnelScoutingSummary(context)).toEqual({ capacity: 2, active: 1, weeklyGain: 18, available: 1 });
    expect(result(context, scout).candidates[1].status).toBe('unscouted');
    context.staff.push({ ...context.staff[0], id: 'personnel', personId: 'hr-person', department: 'personnel', delegated: true });
    expect(getPersonnelScoutingSummary(context)).toEqual({ capacity: 3, active: 1, weeklyGain: 23, available: 2 });
  });

  it('blocks a full pool, then permits a new assignment after stopping one', () => {
    const context = fixture();
    context.candidates.push(...['b', 'c'].map((id) => ({ ...context.candidates[0], id, personId: id, status: 'scouting' as const, knowledge: 40 })));
    blocked(context, scout, '2/2');
    const stopped = result(context, { kind: 'stop-scout', candidateId: 'b' });
    expect(result({ ...context, candidates: stopped.candidates }, scout).updatedCandidate?.status).toBe('scouting');
  });

  it.each([false, true])('weekly gain and completion are real campaign progression (delegated=%s)', (delegated) => {
    const source = [{ ...fixture().candidates[0], knowledge: 70, status: 'scouting' as const, shortlisted: true }];
    const frozen = JSON.stringify(source);
    const first = advanceCandidateScouting(source, delegated);
    expect(first[0].knowledge).toBe(delegated ? 93 : 88);
    expect(first[0].status).toBe('scouting');
    expect(first[0].rivalInterest).toBe(weeklyRivalInterest(source[0]));
    const second = advanceCandidateScouting(first, delegated);
    expect(second[0]).toMatchObject({ knowledge: 100, status: 'shortlisted', shortlisted: true });
    expect(JSON.stringify(source)).toBe(frozen);
  });

  it('does not revive candidates already lost or signed, even at 100% knowledge', () => {
    const sources = (['lost', 'signed'] as const).map((status) => ({ ...fixture().candidates[0], status, knowledge: 100 }));
    expect(advanceCandidateScouting(sources, true).map((candidate) => candidate.status)).toEqual(['lost', 'signed']);
  });

  it('rival recruitment wins before a completed investigation could revive the target', () => {
    const [next] = advanceCandidateScouting([{ ...fixture().candidates[0], status: 'scouting', knowledge: 99, rivalInterest: 99 }], false);
    expect(next).toMatchObject({ status: 'lost', knowledge: 100 });
  });

  it('describes ETA only for active investigations and actual unlocked thresholds', () => {
    const source = { ...fixture().candidates[0], knowledge: 35, status: 'scouting' as const };
    const plan = getCandidateScoutingPlan(source, false);
    expect(plan.weeksToComplete).toBe(4);
    expect(plan.milestones.find((milestone) => milestone.knowledge === 35)?.weeks).toBe(0);
    expect(plan.milestones.find((milestone) => milestone.knowledge === 55)?.weeks).toBe(2);
    expect(getCandidateScoutingPlan(source, true).weeksToComplete).toBe(3);
    expect(getCandidateScoutingPlan({ ...source, status: 'unscouted' }, false).weeksToComplete).toBeNull();
    expect(getCandidateScoutingPlan({ ...source, knowledge: 100 }, false).weeksToComplete).toBe(0);
  });

  it('normalizing a roster is pure and idempotent', () => {
    const input = [{ ...fixture().candidates[0], status: 'scouting' as const, knowledge: 100, shortlisted: true }];
    const before = JSON.stringify(input);
    const normalized = normalizeCandidateScoutingRoster(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(normalizeCandidateScoutingRoster(normalized)).toEqual(normalized);
  });
});

describe('contact and appointment use real requirements and actual outcomes', () => {
  it.each([
    ['military', 64, 14], ['military', 70, 17], ['intelligence', 40, 19],
  ] as const)('contact applies the existing %s network modifier at %s', (branch, intelNetwork, relationshipGain) => {
    const context = fixture();
    context.role = { ...context.role, branch };
    context.game.intelNetwork = intelNetwork;
    const outcome = result(context, approach);
    expect(outcome.updatedCandidate).toMatchObject({ relationship: 20 + relationshipGain, interest: 91, rivalInterest: 22, knowledge: 76, lastApproachWeek: 8 });
    expect(outcome.gameDelta).toEqual({ politicalPower: -4, treasury: -0 });
    expect(outcome.requirements.politicalPower).toBe(4);
  });

  it('contact shows bounded actual changes and returns completed scouting capacity', () => {
    const context = candidateWith(fixture(), { relationship: 99, interest: 99, rivalInterest: 2, knowledge: 98, status: 'scouting' });
    const outcome = result(context, approach);
    expect(outcome.updatedCandidate).toMatchObject({ relationship: 100, interest: 100, rivalInterest: 0, knowledge: 100, status: 'unscouted' });
    expect(outcome.summary.join(' ')).toContain('99 → 100');
  });

  it('contact is allowed only once per real week', () => {
    const context = fixture();
    const contacted = result(context, approach);
    blocked({ ...context, candidates: contacted.candidates }, approach, '이번 주');
    expect(result({ ...context, candidates: contacted.candidates, game: { ...context.game, week: 9 } }, approach).updatedCandidate?.lastApproachWeek).toBe(9);
  });

  it.each([
    [29, 64, 86, '정보 30'], [70, 24, 86, '정보망 25'], [70, 64, 3, '정치력 4'],
  ])('contact blocks knowledge=%s network=%s PP=%s with a reason', (knowledge, intelNetwork, politicalPower, reason) => {
    const context = candidateWith(fixture(), { knowledge: knowledge as number });
    blocked({ ...context, game: { ...context.game, intelNetwork: intelNetwork as number, politicalPower: politicalPower as number } }, approach, String(reason));
  });

  it('lower-ranking players may investigate and contact but cannot appoint outside their jurisdiction', () => {
    const context = candidateWith(fixture(), { department: 'economy' });
    context.role = { ...context.role, tier: 5, branch: 'military', archetype: 'unit-command' };
    expect(result(context, scout).cost.politicalPower).toBe(2);
    expect(result(context, approach).cost.politicalPower).toBe(4);
    expect(result(context, shortlist).cost.politicalPower).toBe(0);
    blocked(context, recruit, '임명권');
  });

  it.each([71, 72])('recruitment threshold %s is deterministic, not a percentage roll', (score) => {
    const context = candidateWith(fixture(), { interest: score - 1, relationship: 0, rivalInterest: 0 });
    context.reputation = 0;
    const outcome = result(context, recruit);
    expect(outcome.recruitment?.assessment.score).toBe(score);
    expect(outcome.recruitment?.success).toBe(score >= 72);
    expect(outcome.summary.join(' ')).toContain('확률 추첨을 하지 않습니다');
  });

  it('failed recruitment requires full offer reserves but consumes only 3PP and no signing fee', () => {
    const context = candidateWith(fixture(), { interest: 20, relationship: 0, rivalInterest: 90 });
    const outcome = result(context, recruit);
    expect(outcome.requirements).toEqual({ politicalPower: 6, treasury: 150 });
    expect(outcome.cost).toEqual({ politicalPower: 3, treasury: 0 });
    expect(outcome.gameDelta).toEqual({ politicalPower: -3, treasury: -0 });
    expect(outcome.staff).toBe(context.staff);
    expect(outcome.updatedCandidate).toMatchObject({ interest: 27, relationship: 4, rivalInterest: 96, signingCost: 162 });
    expect(outcome.recruitment).toMatchObject({ success: false, weeklyPayrollBefore: 6, weeklyPayrollAfter: 6 });
    blocked({ ...context, game: { ...context.game, politicalPower: 5 } }, recruit, '정치력 6');
    blocked({ ...context, game: { ...context.game, treasury: 149 } }, recruit, '국고');
  });

  it('successful appointment replaces exactly one incumbent, clears inherited meeting cooldown, and accounts for payroll', () => {
    const context = fixture();
    const outcome = result(context, recruit);
    expect(outcome.recruitment?.success).toBe(true);
    expect(outcome.updatedCandidate).toBeNull();
    expect(outcome.cost).toEqual({ politicalPower: 6, treasury: 150 });
    expect(outcome.staff).toHaveLength(1);
    expect(outcome.staff[0]).toMatchObject({ id: 'operations', personId: 'person-a', name: '새 후보', grade: 1, development: 0, delegated: false, weeklyCost: 8, contractWeeksRemaining: 104, appointmentAuthority: 'executive', lastMeetingWeek: undefined });
    expect(outcome.recruitment).toMatchObject({ weeklyPayrollBefore: 6, weeklyPayrollAfter: 8, incumbent: context.staff[0] });
    expect(outcome.candidates[0]).toMatchObject({ personId: 'person-incumbent', availability: 'displaced', status: 'unscouted', knowledge: 100, shortlisted: false });
    expect(outcome.candidates[0].id).toBe('britain-candidate-displaced-person-incumbent-8');
  });

  it('retains negotiated term, pay, authority, promises and candidate source data', () => {
    const context = candidateWith(fixture(), { interest: 98, sourceUrl: 'https://example.com/person', sourceLabel: '사료', nationality: '영국', discipline: 'military' });
    const outcome = result(context, { ...recruit, offer: { authority: 'autonomous', termWeeks: 156, salaryMultiplier: 1.15, signingMultiplier: 1.15, promise: 'security' } });
    expect(outcome.staff[0]).toMatchObject({ contractWeeksRemaining: 156, weeklyCost: 10, appointmentAuthority: 'autonomous', appointmentPromise: 'security', morale: 77, roleSatisfaction: 84, sourceUrl: 'https://example.com/person', sourceLabel: '사료' });
    expect(outcome.cost.treasury).toBe(173);
  });

  it('does not spend on empty or ambiguous appointment slots or current employees', () => {
    const context = fixture();
    blocked({ ...context, staff: [] }, recruit, '현직자');
    blocked({ ...context, staff: [...context.staff, { ...context.staff[0], id: 'other-slot', personId: 'other-person' }] }, recruit, '현직자');
    blocked(candidateWith(context, { personId: context.staff[0].personId }), recruit, '재직 중');
  });

  it('reconciles an existing incumbent market listing into one actual displaced record', () => {
    const context = fixture();
    context.candidates.push({ ...context.candidates[0], id: 'legacy-incumbent', personId: context.staff[0].personId });
    const outcome = result(context, recruit);
    expect(outcome.candidates).toHaveLength(1);
    expect(outcome.candidates[0]).toMatchObject({ personId: 'person-incumbent', availability: 'displaced' });
  });

  it.each(['authority', 'termWeeks', 'salaryMultiplier', 'signingMultiplier', 'promise'] as const)('rejects malformed offer field %s instead of charging', (field) => {
    blocked(fixture(), { ...recruit, offer: { ...defaultRecruitmentOffer, [field]: 'bad' } as typeof defaultRecruitmentOffer }, '조건');
  });

  it('rejects missing offer and incomplete negotiation knowledge', () => {
    blocked(fixture(), { kind: 'recruit', candidateId: 'candidate-a' }, '조건');
    blocked(candidateWith(fixture(), { knowledge: 54 }), recruit, '55%');
  });
});

describe('personnel validation and read-only approval contract', () => {
  it.each(['scout', 'stop-scout', 'shortlist', 'approach', 'recruit'] as const)('blocks all %s writes while weekly processing is active', (kind) => {
    blocked({ ...fixture(), busy: true }, { kind, candidateId: 'candidate-a', offer: defaultRecruitmentOffer }, '주간 진행');
  });

  it.each(['lost', 'signed'] as const)('blocks every action on %s candidates', (status) => {
    for (const action of [scout, stop, shortlist, approach, recruit]) blocked(candidateWith(fixture(), { status }), action);
  });

  it.each([-1, 1.2, NaN, Infinity])('rejects malformed week %s', (week) => {
    const context = fixture();
    blocked({ ...context, game: { ...context.game, week } }, scout, '주차');
  });

  it.each(['politicalPower', 'treasury', 'intelNetwork'] as const)('rejects invalid %s resource state', (key) => {
    const context = fixture();
    blocked({ ...context, game: { ...context.game, [key]: NaN } }, scout, '자원');
  });

  it.each(['personId', 'id', 'knowledge', 'signingCost', 'weeklyCost', 'availability', 'lastApproachWeek', 'shortlisted'] as const)('rejects malformed candidate %s', (field) => {
    const value = field === 'personId' || field === 'id' ? '' : field === 'availability' ? 'bad' : field === 'shortlisted' ? 'yes' : NaN;
    const context = candidateWith(fixture(), { [field]: value } as Partial<StaffCandidate>);
    blocked(context, { ...scout, candidateId: context.candidates[0].id });
  });

  it('does not substitute a different person when candidate or role identities are invalid', () => {
    blocked(fixture(), { ...scout, candidateId: 'missing' }, '현재 시장');
    const context = fixture();
    blocked({ ...context, role: { ...context.role, tier: 0 as 1 } }, scout, '보직');
    blocked({ ...context, role: { ...context.role, nationId: 'not-a-nation' as NationId } }, scout, '보직');
    context.candidates.push({ ...context.candidates[0], id: 'duplicate-person' });
    blocked(context, scout, '중복');
  });

  it('blocks future contact records and duplicate staff identities', () => {
    blocked(candidateWith(fixture(), { lastApproachWeek: 10 }), approach, '접촉 기록');
    const context = fixture();
    blocked({ ...context, staff: [...context.staff, { ...context.staff[0], id: 'another-slot' }] }, recruit, '현직 참모');
  });

  it('creation, repeated assessment and cancel do not mutate state or dispatch anything', () => {
    const context = fixture();
    const before = JSON.stringify(context);
    const callback = vi.fn();
    const review = createPersonnelReview(context, recruit)!;
    expect(review).not.toBeNull();
    expect(assessPersonnelReview(review, context).allowed).toBe(true);
    expect(assessPersonnelReview(review, context).allowed).toBe(true);
    expect(JSON.stringify(context)).toBe(before);
    expect(callback).not.toHaveBeenCalled();
  });

  it('snapshots the offer rather than holding a mutable editor reference', () => {
    const context = fixture();
    const offer = { ...defaultRecruitmentOffer };
    const review = createPersonnelReview(context, { ...recruit, offer })!;
    offer.termWeeks = 156;
    expect(review.action.offer?.termWeeks).toBe(104);
    expect(assessPersonnelReview(review, context).allowed).toBe(true);
  });

  it('keeps the reviewed resource basis after live balances and week change', () => {
    const context = fixture();
    const review = createPersonnelReview(context, scout)!;
    context.game.politicalPower = 1;
    context.game.treasury = 0;
    context.game.week = 9;
    expect(review.basis).toEqual({ week: 8, politicalPower: 86, treasury: 920 });
    expect(assessPersonnelReview(review, context).allowed).toBe(false);
  });

  it.each(['week', 'role', 'resources', 'candidate', 'incumbent', 'busy', 'offer', 'reputation'] as const)('rejects stale %s before callback', (change) => {
    const context = fixture();
    const review = createPersonnelReview(context, recruit)!;
    const callback = vi.fn();
    if (change === 'week') context.game.week += 1;
    if (change === 'role') context.role = { ...context.role, nationId: 'korea' };
    if (change === 'resources') context.game.treasury -= 1;
    if (change === 'candidate') context.candidates[0].personId = 'replacement';
    if (change === 'incumbent') context.staff[0].personId = 'another-incumbent';
    if (change === 'busy') context.busy = true;
    if (change === 'offer') review.action.offer!.authority = 'advisor';
    if (change === 'reputation') context.reputation += 1;
    expect(confirmPersonnelReview(review, context, callback, createPersonnelReviewGate()).ok).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('recomputes real results instead of trusting altered preview result data', () => {
    const context = fixture();
    const review = createPersonnelReview(context, recruit)!;
    review.assessment.result.gameDelta.treasury = 999999;
    const callback = vi.fn();
    expect(confirmPersonnelReview(review, context, callback, createPersonnelReviewGate()).ok).toBe(true);
    expect(callback.mock.calls[0][0].gameDelta.treasury).toBe(-150);
  });

  it('dispatches exactly once even for synchronous re-entry before the parent rerenders', () => {
    const context = fixture();
    const review = createPersonnelReview(context, recruit)!;
    const gate = createPersonnelReviewGate();
    expect(isPersonnelReviewSubmitted(review, gate)).toBe(false);
    const callback = vi.fn(() => {
      expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(false);
    });
    expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(true);
    expect(isPersonnelReviewSubmitted(review, gate)).toBe(true);
    expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('serializes different actions on one roster snapshot so their full-roster writes cannot overwrite each other', () => {
    const context = fixture();
    const investigation = createPersonnelReview(context, scout)!;
    const contact = createPersonnelReview(context, approach)!;
    const gate = createPersonnelReviewGate();
    const contactCallback = vi.fn();
    let applied: PersonnelActionResult | undefined;
    const investigateCallback = vi.fn((outcome: PersonnelActionResult) => {
      applied = outcome;
      expect(confirmPersonnelReview(contact, context, contactCallback, gate)).toMatchObject({ ok: false });
      expect(isPersonnelReviewSubmitted(contact, gate)).toBe(false);
    });
    expect(confirmPersonnelReview(investigation, context, investigateCallback, gate).ok).toBe(true);
    expect(contactCallback).not.toHaveBeenCalled();
    const freshContext = {
      ...context, candidates: applied!.candidates, staff: applied!.staff,
      game: { ...context.game, politicalPower: context.game.politicalPower + applied!.gameDelta.politicalPower },
    };
    const freshContact = createPersonnelReview(freshContext, approach)!;
    expect(confirmPersonnelReview(freshContact, freshContext, contactCallback, gate).ok).toBe(true);
    expect(contactCallback).toHaveBeenCalledTimes(1);
    expect(contactCallback.mock.calls[0][0].updatedCandidate).toMatchObject({ status: 'scouting', knowledge: 84 });
  });

  it('does not retain every roster snapshot throughout a long campaign', () => {
    const context = fixture();
    const gate = createPersonnelReviewGate();
    const first = createPersonnelReview(context, shortlist)!;
    const callback = vi.fn();
    for (let week = 8; week < 208; week += 1) {
      context.game.week = week;
      const review = createPersonnelReview(context, shortlist)!;
      expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(true);
      expect(gate.submitted.size).toBe(1);
    }
    expect(callback).toHaveBeenCalledTimes(200);
    expect(confirmPersonnelReview(first, context, callback, gate).ok).toBe(false);
    expect(isPersonnelReviewSubmitted(first, gate)).toBe(false);
    expect(callback).toHaveBeenCalledTimes(200);
  });

  it.each(['throw', 'false'] as const)('keeps the gate locked after uncertain %s outcomes', (mode) => {
    const context = fixture();
    const review = createPersonnelReview(context, recruit)!;
    const gate = createPersonnelReviewGate();
    const callback = vi.fn(() => { if (mode === 'throw') throw new Error('unknown outcome'); return false; });
    expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(false);
    expect(isPersonnelReviewSubmitted(review, gate)).toBe(true);
    expect(confirmPersonnelReview(review, context, callback, gate).ok).toBe(false);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('a valid failed negotiation is still a dispatched action and only spends its actual failure cost', () => {
    const context = candidateWith(fixture(), { interest: 10, relationship: 0, rivalInterest: 90 });
    const review = createPersonnelReview(context, recruit)!;
    const callback = vi.fn();
    expect(confirmPersonnelReview(review, context, callback, createPersonnelReviewGate()).ok).toBe(true);
    expect(callback.mock.calls[0][0].recruitment.success).toBe(false);
    expect(callback.mock.calls[0][0].cost).toEqual({ politicalPower: 3, treasury: 0 });
  });

  it('refuses creation for illegal actions rather than creating an actionable empty review', () => {
    expect(createPersonnelReview(candidateWith(fixture(), { knowledge: 100 }), scout)).toBeNull();
  });
});

describe('national roster compatibility', () => {
  it.each(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines'] as NationId[])('%s can investigate and recruit a real generated candidate without synthetic slot IDs', (nationId) => {
    const role = getRole(`${nationId}-tier1`, nationId);
    const staff = createStaffRoster(nationId, role.id);
    const candidates = createStaffCandidates(nationId, role.id);
    const recruitable = candidates.find((candidate) => !staff.some((member) => member.personId === candidate.personId));
    expect(recruitable).toBeDefined();
    const context = {
      ...fixture(), role, staff, candidates: candidates.map((candidate) => candidate.id === recruitable!.id ? { ...candidate, interest: 100, relationship: 100, knowledge: 90, rivalInterest: 0 } : candidate),
    };
    const outcome = result(context, { ...recruit, candidateId: recruitable!.id });
    expect(outcome.recruitment?.success).toBe(true);
    expect(outcome.staff.find((member) => member.personId === recruitable!.personId)?.id).toBe(staff.find((member) => member.department === recruitable!.department)?.id);
    expect(new Set(outcome.staff.map((member) => member.personId)).size).toBe(outcome.staff.length);
  });
});
