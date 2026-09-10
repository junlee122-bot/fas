import { describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getRole, nations } from './campaign';
import { createCivilianCareerState } from './civilianCareer';
import {
  assessStaffDecision, assessStaffReview, confirmStaffReview, createStaffReview, createStaffReviewGate,
  getStaffDecisionReceipt, getStaffOfficeProblem, isStaffReviewSubmitted,
} from './staffDecisions';
import type { StaffDecisionAction, StaffDecisionInput, StaffDecisionResult } from './staffDecisions';
import {
  assessStaffPromise, getStaffContractWeeks, getStaffMorale, getStaffRenewalCost, getStaffRoleSatisfaction,
} from './staffManagement';
import { calculateStaffSuitability, reassignStaff } from './staffOrganization';
import type { GameState } from './types';

function fixture(): StaffDecisionInput {
  const role = getRole('britain-tier1', 'britain');
  const game: GameState = {
    week: 26, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 78, enemyPressure: 68,
  };
  const staff = createStaffRoster('britain', role.id).map((member) => ({ ...member, contractWeeksRemaining: 26 }));
  staff[0] = { ...staff[0], grade: 1, development: 100, ability: 78, potential: 90 };
  return { game, role, staff, developmentFocusId: staff[0].id, campaignPhase: 'war', nationStatus: 'sovereign',
    career: createCareerState('britain', role.id), affiliationStatus: 'serving' };
}

function action(input: StaffDecisionInput, kind: 'promote' | 'renew' | 'assign' = 'promote'): StaffDecisionAction {
  return kind === 'assign'
    ? { kind, staffId: input.staff[0].id, department: input.staff[1].department }
    : { kind, staffId: input.staff[0].id };
}

function result(input: StaffDecisionInput, command = action(input)): StaffDecisionResult {
  const original = JSON.stringify(input);
  const assessment = assessStaffDecision(input, command);
  expect(assessment.allowed, assessment.reason).toBe(true);
  if (!assessment.allowed) throw new Error(assessment.reason);
  expect(JSON.stringify(input)).toBe(original);
  return assessment.result;
}

function persisted(input: StaffDecisionInput, actual: StaffDecisionResult): StaffDecisionInput {
  return { ...input, staff: actual.staffAfter, game: actual.gameAfter, developmentFocusId: actual.developmentFocusAfter };
}

describe('CE8 exact staff promotions', () => {
  it('projects all immediate changes, constant influence, and recurring payroll without mutating state', () => {
    const input = fixture();
    const actual = result(input);
    const before = input.staff[0];
    expect(actual.cost).toEqual({ politicalPower: 8, treasury: 50 });
    expect(actual.gameAfter).toEqual({ ...input.game, politicalPower: 78, treasury: 870 });
    expect(actual.memberAfter).toEqual({ ...before, grade: 2, development: 0, ability: 82, potential: 91,
      loyalty: Math.min(100, before.loyalty + 5), workload: Math.min(100, before.workload + 8), weeklyCost: before.weeklyCost + 1 });
    expect(actual.weeklyPayrollAfter).toBe(actual.weeklyPayrollBefore + 1);
    expect(actual.memberAfter.influence).toBe(before.influence);
    expect(actual.memberAfter.contractWeeksRemaining).toBe(before.contractWeeksRemaining);
    expect(actual.developmentFocusAfter).toBe(input.developmentFocusId);
    expect(actual.staffAfter.slice(1)).toEqual(input.staff.slice(1));
    expect(actual.summary.join(' ')).toContain('영향력');
    expect(actual.summary.join(' ')).toContain('다음 주간 결산');
  });

  it.each([0, 98, 99.9])('requires completed development, not %s', (development) => {
    const input = fixture(); input.staff[0].development = development;
    expect(assessStaffDecision(input, action(input))).toMatchObject({ allowed: false });
  });

  it('does not allow expert grade 3 to become a fourth grade', () => {
    const input = fixture(); input.staff[0].grade = 3;
    expect(assessStaffDecision(input, action(input))).toMatchObject({ allowed: false, reason: expect.stringContaining('최고 전문 등급 3') });
  });

  it('retains existing potential 100 and legacy over-potential ability instead of reducing either on promotion', () => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], ability: 100, potential: 100 };
    expect(result(input).memberAfter).toMatchObject({ ability: 100, potential: 100 });
    input.staff[0] = { ...input.staff[0], ability: 96, potential: 93 };
    expect(result(input).memberAfter).toMatchObject({ ability: 96, potential: 94 });
  });

  it('clamps loyalty and workload, and warns about resulting overload', () => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], loyalty: 98, workload: 97 };
    const actual = result(input);
    expect(actual.memberAfter).toMatchObject({ loyalty: 100, workload: 100 });
    expect(actual.warnings.join(' ')).toContain('과부하');
  });

  it('requires new development after an approved promotion', () => {
    const input = fixture(); const actual = result(input);
    expect(assessStaffDecision(persisted(input, actual), action(input)).allowed).toBe(false);
  });
});

describe('CE8 finite staff contract renewal', () => {
  it('rounds human-facing fractional statistics to one decimal without rounding actual state', () => {
    const input = fixture();
    input.staff[0] = { ...input.staff[0], loyalty: 87.39999999999998, workload: 78.29999999999998, ability: 78.23, potential: 90.26 };
    const renewal = result(input, action(input, 'renew'));
    expect(renewal.summary.join(' ')).toContain('충성도 87.4 → 92.4');
    expect(renewal.memberAfter.loyalty).toBe(input.staff[0].loyalty + 5);
    expect(renewal.memberAfter.loyalty).not.toBe(92.4);
    const promotion = result(input);
    expect(promotion.summary.join(' ')).toContain('능력 78.2 → 82.2 · 잠재력 90.3 → 91.3');
    expect(promotion.summary.join(' ')).toContain('업무량 78.3 → 86.3');
    expect(promotion.warnings.join(' ')).toContain('업무량 86.3');
    expect(promotion.memberAfter.ability).toBe(input.staff[0].ability + 4);
    input.staff[0].loyalty = 90;
    expect(result(input, action(input, 'renew')).summary.join(' ')).toContain('충성도 90 → 95 ·');
  });

  it.each([0, 1, 13, 26, 52])('extends %s remaining weeks by exactly 104 with the shared renewal cost', (weeks) => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], contractWeeksRemaining: weeks, weeklyCost: 9 };
    const before = input.staff[0]; const actual = result(input, action(input, 'renew'));
    expect(actual.cost).toEqual({ politicalPower: 4, treasury: getStaffRenewalCost(before) });
    expect(actual.memberAfter.contractWeeksRemaining).toBe(weeks + 104);
    expect(actual.memberAfter.contractTermWeeks).toBe(104);
    expect(actual.memberAfter.weeklyCost).toBe(10);
    expect(actual.weeklyPayrollAfter - actual.weeklyPayrollBefore).toBe(1);
    expect(actual.memberAfter.morale).toBe(Math.min(100, getStaffMorale(before) + 10));
    expect(actual.memberAfter.roleSatisfaction).toBe(Math.min(100, getStaffRoleSatisfaction(before) + 6));
  });

  it('uses computed legacy morale and role satisfaction rather than an invented 65 baseline', () => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], loyalty: 20, workload: 98, delegated: false, morale: undefined, roleSatisfaction: undefined };
    const before = input.staff[0]; const actual = result(input, action(input, 'renew'));
    expect(getStaffMorale(before)).not.toBe(65);
    expect(actual.memberAfter.morale).toBe(getStaffMorale(before) + 10);
    expect(actual.memberAfter.roleSatisfaction).toBe(getStaffRoleSatisfaction(before) + 6);
  });

  it('clamps near-maximum morale and satisfaction to actual gains', () => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], morale: 98, roleSatisfaction: 98, loyalty: 98 };
    expect(result(input, action(input, 'renew')).memberAfter).toMatchObject({ morale: 100, roleSatisfaction: 100, loyalty: 100 });
  });

  it.each([53, 104, 156, 999])('rejects premature and repeat renewals with %s weeks left', (weeks) => {
    const input = fixture(); input.staff[0].contractWeeksRemaining = weeks;
    expect(assessStaffDecision(input, action(input, 'renew'))).toMatchObject({ allowed: false, reason: expect.stringContaining('52주 이하') });
  });

  it('cannot farm morale or loyalty by repeating renewals after applying a result', () => {
    const input = fixture(); const actual = result(input, action(input, 'renew'));
    expect(assessStaffDecision(persisted(input, actual), action(input, 'renew')).allowed).toBe(false);
  });

  it('supports missing legacy contract fields with the same default term as the weekly engine', () => {
    const input = fixture();
    // Select a real member with a default near renewal, rather than inventing a separate legacy rule.
    const index = input.staff.findIndex((member) => getStaffContractWeeks({ ...member, contractWeeksRemaining: undefined }) <= 52);
    expect(index).toBeGreaterThanOrEqual(0);
    input.staff[index].contractWeeksRemaining = undefined;
    const member = input.staff[index];
    const actual = result(input, { kind: 'renew', staffId: member.id });
    expect(actual.memberAfter.contractWeeksRemaining).toBe(getStaffContractWeeks(member) + 104);
  });

  it('keeps appointment promises, delegation, department and development intact', () => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], appointmentAuthority: 'autonomous', delegated: false,
      promisedDepartment: 'science', appointmentPromise: 'resources', squadStatus: 'key' };
    input.developmentFocusId = null;
    const actual = result(input, action(input, 'renew'));
    expect(actual.memberAfter).toMatchObject({ appointmentAuthority: 'autonomous', delegated: false,
      promisedDepartment: 'science', appointmentPromise: 'resources', squadStatus: 'key', development: 100 });
    expect(actual.changes[0].promiseAfter.state).toBe('broken');
    expect(actual.warnings.join(' ')).toContain('약속 위반');
  });
});

describe('CE8 two-person assignment preview', () => {
  it('exactly swaps persistent identities and clears both delegations and affected focus without charging money', () => {
    const input = fixture(); input.staff[0].delegated = true; input.staff[1].delegated = true;
    const actual = result(input, action(input, 'assign'));
    expect(actual.staffAfter).toEqual(reassignStaff(input.staff, input.staff[0].id, input.staff[1].department));
    expect(actual.cost).toEqual({ politicalPower: 0, treasury: 0 });
    expect(actual.gameAfter).toEqual(input.game);
    expect(actual.weeklyPayrollAfter).toBe(actual.weeklyPayrollBefore);
    expect(actual.developmentFocusAfter).toBeNull();
    expect(actual.changes).toHaveLength(2);
    actual.changes.forEach((change) => {
      expect(change.after.id).toBe(change.before.id);
      expect(change.after.personId).toBe(change.before.personId);
      expect(change.after.delegated).toBe(false);
      expect(change.after.development).toBe(change.before.development);
      expect(change.fitBefore).toEqual(calculateStaffSuitability(change.before, change.before.department));
      expect(change.fitAfter).toEqual(calculateStaffSuitability(change.after, change.after.department));
    });
  });

  it('clears focus when the second swapped member was focused', () => {
    const input = fixture(); input.developmentFocusId = input.staff[1].id;
    expect(result(input, action(input, 'assign')).developmentFocusAfter).toBeNull();
  });

  it('preserves an unrelated focus and unrelated staff exactly', () => {
    const input = fixture(); input.developmentFocusId = input.staff[2].id;
    const actual = result(input, action(input, 'assign'));
    expect(actual.developmentFocusAfter).toBe(input.staff[2].id);
    expect(actual.staffAfter.slice(2)).toEqual(input.staff.slice(2));
  });

  it('warns about both changed members breaking autonomous and promised-department terms', () => {
    const input = fixture();
    for (const member of input.staff.slice(0, 2)) {
      member.delegated = true; member.appointmentAuthority = 'autonomous'; member.promisedDepartment = member.department;
    }
    const actual = result(input, action(input, 'assign'));
    for (const change of actual.changes) {
      expect(change.promiseBefore.state).toBe('kept');
      expect(change.promiseAfter).toEqual(assessStaffPromise(change.after, false));
      expect(change.promiseAfter.state).toBe('broken');
      expect(actual.warnings.join(' ')).toContain(change.before.name);
    }
  });

  it('gives postwar and founding titles according to the actual organization phase', () => {
    const input = fixture(); input.campaignPhase = 'nation';
    expect(result(input, action(input, 'assign')).summary.join(' ')).toContain('국가안보보좌관');
    input.nationStatus = 'government-in-exile';
    expect(result(input, action(input, 'assign')).summary.join(' ')).toContain('건국안보실장');
  });

  it('rejects same-seat and missing-target assignments without a fallback', () => {
    const input = fixture();
    expect(assessStaffDecision(input, { kind: 'assign', staffId: input.staff[0].id, department: input.staff[0].department }).allowed).toBe(false);
    input.staff = input.staff.filter((member) => member.department !== 'science');
    expect(assessStaffDecision(input, { kind: 'assign', staffId: input.staff[0].id, department: 'science' }).allowed).toBe(false);
  });

  it('allows zero-cost reassignment even with empty resources when authority is valid', () => {
    const input = fixture(); input.game.treasury = 0; input.game.politicalPower = 0;
    expect(result(input, action(input, 'assign')).gameAfter).toEqual(input.game);
  });
});

describe('CE8 shared serving-office gate for all staff management commands', () => {
  it.each(['serving', 'exile', 'defector', 'double-agent'] as const)('allows a currently appointed %s office without changing any state', (affiliationStatus) => {
    const input = fixture(); input.affiliationStatus = affiliationStatus;
    const before = JSON.stringify(input);
    expect(getStaffOfficeProblem(input)).toBeNull();
    expect(JSON.stringify(input)).toBe(before);
  });

  it.each(['dismissed', 'unattached'] as const)('returns the same %s rejection for legacy handlers and reviewed decisions', (affiliationStatus) => {
    const input = fixture(); input.affiliationStatus = affiliationStatus;
    const problem = getStaffOfficeProblem(input);
    expect(problem).toContain('공식 보직에서 이탈');
    for (const kind of ['promote', 'renew', 'assign'] as const) {
      expect(assessStaffDecision(input, action(input, kind))).toEqual({ allowed: false, reason: problem });
    }
  });

  it('blocks an unappointed civilian with or without legacy civilian details and permits actual institutional entry', () => {
    const input = fixture(); input.career!.startMode = 'civilian';
    expect(getStaffOfficeProblem(input)).toContain('일반인 경력');
    input.career!.civilian = createCivilianCareerState('intellectual', 'university-network');
    expect(getStaffOfficeProblem(input)).toContain('일반인 경력');
    input.career!.civilian.enteredOfficeRoleId = input.role.id;
    expect(getStaffOfficeProblem(input)).toBeNull();
  });

  it.each(['nation', 'role'] as const)('rejects mismatched career %s before legacy handlers spend resources', (identity) => {
    const input = fixture();
    if (identity === 'nation') input.career!.nationId = 'usa';
    else input.career!.roleId = 'britain-tier2';
    expect(getStaffOfficeProblem(input)).toContain('일치하지');
  });

  it('rejects an unknown affiliation while preserving optional legacy context compatibility', () => {
    const input = fixture(); input.affiliationStatus = 'invented' as StaffDecisionInput['affiliationStatus'];
    expect(getStaffOfficeProblem(input)).toBe('현재 소속 상태를 확인할 수 없습니다.');
    expect(getStaffOfficeProblem({ role: input.role })).toBeNull();
  });
});

describe('CE8 permission, identity and finite-resource boundaries', () => {
  it.each(['promote', 'renew', 'assign'] as const)('blocks %s during weekly resolution', (kind) => {
    const input = fixture(); input.busy = true;
    expect(assessStaffDecision(input, action(input, kind)).allowed).toBe(false);
  });

  it.each(['dismissed', 'unattached'] as const)('blocks a formerly powerful but now %s career', (affiliationStatus) => {
    const input = fixture(); input.affiliationStatus = affiliationStatus;
    expect(assessStaffDecision(input, action(input))).toMatchObject({ allowed: false, reason: expect.stringContaining('공식 보직') });
  });

  it('blocks civilians before institutional appointment, including incomplete legacy civilian state', () => {
    const input = fixture(); input.career!.startMode = 'civilian';
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
    input.career!.civilian = createCivilianCareerState('intellectual', 'university-network');
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
    input.career!.civilian.enteredOfficeRoleId = input.role.id;
    expect(assessStaffDecision(input, action(input)).allowed).toBe(true);
  });

  it('does not treat an active double-agent as dismissed from their cover office', () => {
    const input = fixture(); input.affiliationStatus = 'double-agent';
    expect(assessStaffDecision(input, action(input)).allowed).toBe(true);
  });

  it('requires matching role and career identity', () => {
    const input = fixture(); input.career!.roleId = 'britain-tier2';
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
  });

  it('requires source AND destination authority, even when one side belongs to the player', () => {
    const input = fixture(); input.role = getRole('britain-tier2', 'britain'); input.career = createCareerState('britain', input.role.id);
    const science = input.staff.find((member) => member.department === 'science')!;
    expect(assessStaffDecision(input, { kind: 'assign', staffId: input.staff[0].id, department: 'science' }).allowed).toBe(false);
    expect(assessStaffDecision(input, { kind: 'assign', staffId: science.id, department: 'operations' }).allowed).toBe(false);
    expect(assessStaffDecision(input, { kind: 'renew', staffId: science.id }).allowed).toBe(false);
  });

  it.each(['id', 'personId', 'department'] as const)('rejects duplicate roster %s', (field) => {
    const input = fixture(); input.staff[1] = { ...input.staff[1], [field]: input.staff[0][field] };
    expect(assessStaffDecision(input, action(input))).toMatchObject({ allowed: false });
  });

  it.each([NaN, Infinity, -1])('rejects non-finite or negative national values: %s', (invalid) => {
    const input = fixture(); input.game.treasury = invalid;
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
    input.game.treasury = 920; input.game.politicalPower = invalid;
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
  });

  it.each(['ability', 'potential', 'morale', 'roleSatisfaction', 'development', 'weeklyCost', 'contractWeeksRemaining'] as const)('rejects corrupt member %s', (field) => {
    const input = fixture(); input.staff[0] = { ...input.staff[0], [field]: NaN };
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
  });

  it.each(['promote', 'renew'] as const)('rejects unfunded %s without spending and accepts exact requirements', (kind) => {
    const input = fixture(); const projected = result(input, action(input, kind));
    input.game.treasury = projected.cost.treasury - 1;
    const original = JSON.stringify(input);
    expect(assessStaffDecision(input, action(input, kind)).allowed).toBe(false);
    expect(JSON.stringify(input)).toBe(original);
    input.game.treasury = projected.cost.treasury; input.game.politicalPower = projected.cost.politicalPower;
    expect(result(input, action(input, kind)).gameAfter).toMatchObject({ treasury: 0, politicalPower: 0 });
  });

  it('rejects unknown actions, members, target departments and stale focus', () => {
    const input = fixture();
    expect(assessStaffDecision(input, { kind: 'invented', staffId: input.staff[0].id } as unknown as StaffDecisionAction).allowed).toBe(false);
    expect(assessStaffDecision(input, { kind: 'promote', staffId: 'deleted' }).allowed).toBe(false);
    expect(assessStaffDecision(input, { kind: 'assign', staffId: input.staff[0].id, department: 'unknown' } as unknown as StaffDecisionAction).allowed).toBe(false);
    input.developmentFocusId = 'removed';
    expect(assessStaffDecision(input, action(input)).allowed).toBe(false);
  });

  it.each(nations.map((nation) => nation.id))('supports the actual %s initial roster with current save fields', (nationId) => {
    const input = fixture(); input.role = getRole(`${nationId}-tier1`, nationId);
    input.career = createCareerState(nationId, input.role.id);
    input.staff = createStaffRoster(nationId, input.role.id);
    input.developmentFocusId = null; input.staff[0].development = 100;
    expect(assessStaffDecision(input, action(input)).allowed).toBe(true);
    expect(assessStaffDecision(input, action(input, 'assign')).allowed).toBe(true);
  });
});

describe('CE8 immutable review, anti-reentry and live receipt', () => {
  it('freezes a detached review without freezing source state', () => {
    const input = fixture(); const command = action(input); const review = createStaffReview(input, command)!;
    expect(Object.isFrozen(review)).toBe(true);
    expect(Object.isFrozen(review.assessment.result.memberBefore)).toBe(true);
    expect(Object.isFrozen(review.assessment.result.memberAfter)).toBe(true);
    expect(Object.isFrozen(review.assessment.result.changes[0].fitAfter.reasons)).toBe(true);
    expect(Object.isFrozen(input.staff[0])).toBe(false);
    input.staff[0].name = '다른 이름';
    expect(review.assessment.result.memberBefore.name).not.toBe(input.staff[0].name);
  });

  it.each(['week', 'funds', 'person', 'contract', 'role', 'focus', 'phase', 'affiliation', 'busy'] as const)('invalidates review after a %s change', (change) => {
    const input = fixture(); const review = createStaffReview(input, action(input))!;
    if (change === 'week') input.game.week++;
    if (change === 'funds') input.game.treasury--;
    if (change === 'person') input.staff[0].personId = 'new-person-in-same-slot';
    if (change === 'contract') input.staff[0].contractWeeksRemaining = input.staff[0].contractWeeksRemaining! - 1;
    if (change === 'role') input.role = { ...input.role, tier: 2, archetype: 'theater-command' };
    if (change === 'focus') input.developmentFocusId = null;
    if (change === 'phase') input.campaignPhase = 'nation';
    if (change === 'affiliation') input.affiliationStatus = 'dismissed';
    if (change === 'busy') input.busy = true;
    const submit = vi.fn();
    expect(assessStaffReview(review, input).allowed).toBe(false);
    expect(confirmStaffReview(review, input, submit, createStaffReviewGate()).ok).toBe(false);
    expect(submit).not.toHaveBeenCalled();
  });

  it('ignores tampered projected outcomes and recomputes the actual result', () => {
    const input = fixture(); const review = structuredClone(createStaffReview(input, action(input))!);
    review.assessment.result.gameAfter.treasury = 999999;
    const submit = vi.fn();
    expect(confirmStaffReview(review, input, submit, createStaffReviewGate()).ok).toBe(true);
    expect(submit.mock.calls[0][0].gameAfter.treasury).toBe(870);
  });

  it('blocks synchronous reentry, same-review resubmission and competing actions in one state epoch', () => {
    const input = fixture(); const gate = createStaffReviewGate();
    const review = createStaffReview(input, action(input))!;
    const alternative = createStaffReview(input, action(input, 'assign'))!;
    const nested = vi.fn();
    const submit = vi.fn(() => {
      expect(isStaffReviewSubmitted(review, gate)).toBe(true);
      expect(confirmStaffReview(review, input, nested, gate).ok).toBe(false);
      expect(confirmStaffReview(alternative, input, nested, gate).ok).toBe(false);
    });
    expect(confirmStaffReview(review, input, submit, gate).ok).toBe(true);
    expect(confirmStaffReview(review, input, submit, gate).ok).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(nested).not.toHaveBeenCalled();
    expect(gate.submitted.size).toBe(1);
  });

  it.each(['false', 'throw'] as const)('keeps uncertainty blocked when the callback returns %s', (failure) => {
    const input = fixture(); const review = createStaffReview(input, action(input))!; const gate = createStaffReviewGate();
    const submit = vi.fn(() => { if (failure === 'throw') throw new Error('failed'); return false; });
    expect(confirmStaffReview(review, input, submit, gate).ok).toBe(false);
    expect(isStaffReviewSubmitted(review, gate)).toBe(true);
    expect(confirmStaffReview(review, input, submit, gate).ok).toBe(false);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('uses bounded current-state gate storage while allowing another legitimate action after persistence', () => {
    let input = fixture(); const gate = createStaffReviewGate();
    for (let index = 0; index < 30; index++) {
      const review = createStaffReview(input, { kind: 'assign', staffId: input.staff[0].id, department: input.staff[1].department })!;
      const before = input;
      const submitted: { value?: StaffDecisionResult } = {};
      expect(confirmStaffReview(review, input, (actual) => { submitted.value = actual; }, gate).ok).toBe(true);
      input = persisted(before, submitted.value!);
      expect(gate.submitted.size).toBe(1);
    }
  });

  it.each(['promote', 'renew', 'assign'] as const)('requires actual game, roster and focus persistence for the %s receipt', (kind) => {
    const input = fixture(); const actual = result(input, action(input, kind));
    expect(getStaffDecisionReceipt(actual, input).confirmed).toBe(false);
    expect(getStaffDecisionReceipt(actual, { ...input, game: actual.gameAfter }).confirmed).toBe(false);
    const committed = persisted(input, actual);
    const receipt = getStaffDecisionReceipt(actual, committed);
    expect(receipt).toMatchObject({ confirmed: true, status: 'confirmed' });
    expect(receipt.checks.every((check) => check.confirmed)).toBe(true);
    expect(getStaffDecisionReceipt(actual, { ...committed, game: { ...committed.game, week: committed.game.week + 1 } })).toMatchObject({
      confirmed: false, status: 'changed', title: '승인 이후 상태가 변경되었습니다',
    });
  });

  it('does not confirm a swap when the actual development focus reset was omitted', () => {
    const input = fixture(); const actual = result(input, action(input, 'assign'));
    expect(getStaffDecisionReceipt(actual, { ...persisted(input, actual), developmentFocusId: input.developmentFocusId }).confirmed).toBe(false);
  });

  it('rejects an unrelated roster replacement or changed office as evidence for an old result', () => {
    const input = fixture(); const actual = result(input); const committed = persisted(input, actual);
    committed.staff = committed.staff.map((member, index) => index === 0 ? { ...member, personId: 'replacement' } : member);
    expect(getStaffDecisionReceipt(actual, committed).confirmed).toBe(false);
    const changedOffice = { ...persisted(input, actual), role: getRole('usa-tier1', 'usa') };
    expect(getStaffDecisionReceipt(actual, changedOffice)).toMatchObject({ confirmed: false, status: 'changed' });
  });

  it('has no review to approve for an ineligible action', () => {
    const input = fixture(); input.staff[0].development = 0;
    expect(createStaffReview(input, action(input))).toBeNull();
  });
});
