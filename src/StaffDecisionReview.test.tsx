import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getNation, getRole } from './campaign';
import { createStaffReviewGate, getStaffDecisionReceipt } from './staffDecisions';
import type { StaffDecisionAction, StaffDecisionInput, StaffDecisionResult } from './staffDecisions';
import {
  StaffDecisionReview, assessStaffDeskReview, confirmStaffDeskReview, createStaffDeskReview, getStaffDeskAvailability, getStaffDeskReceiptHeading,
} from './StaffDecisionReview';
import type { StaffDeskContext } from './StaffDecisionReview';

function fixture(): StaffDeskContext {
  const role = getRole('britain-tier1', 'britain');
  const staff = createStaffRoster('britain', role.id).map((member) => ({ ...member,
    grade: 1 as const, development: 100, contractWeeksRemaining: 10, contractTermWeeks: 104,
    delegated: true, promisedDepartment: member.department, appointmentAuthority: 'autonomous' as const,
    appointmentPromise: 'resources' as const, weeklyCost: 12, morale: 55, roleSatisfaction: 58,
  }));
  const input: StaffDecisionInput = {
    game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78,
      warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
    role, staff, developmentFocusId: staff[0].id, campaignPhase: 'nation', nationStatus: getNation('britain').status,
    career: createCareerState('britain', role.id), affiliationStatus: 'serving',
  };
  return { input, formatMoney: vi.fn((value: number, options?: { exact?: boolean }) => value + (options?.exact ? ' 정확파운드' : ' 축약파운드')),
    onUpgradeStaff: vi.fn(), onRenewStaff: vi.fn(), onAssignStaff: vi.fn() };
}

function action(context: StaffDeskContext, kind: StaffDecisionAction['kind']): StaffDecisionAction {
  const staffId = context.input!.staff[0].id;
  return kind === 'assign' ? { kind, staffId, department: context.input!.staff[1].department } : { kind, staffId };
}
function persist(input: StaffDecisionInput, result: StaffDecisionResult): StaffDecisionInput {
  return { ...input, game: result.gameAfter, staff: result.staffAfter, developmentFocusId: result.developmentFocusAfter };
}

describe('CE8 staff review and receipt desk', () => {
  it('distinguishes an unconfirmed dispatch from later changes to a previously approved record', () => {
    expect(getStaffDeskReceiptHeading('confirmed')).toContain('기록과 일치');
    expect(getStaffDeskReceiptHeading('changed')).toBe('승인 이후 현재 상태가 달라졌습니다.');
    expect(getStaffDeskReceiptHeading('pending')).toContain('완료 처리하지 않습니다');
    expect(getStaffDeskReceiptHeading(undefined)).toContain('완료 처리하지 않습니다');
  });
  it.each(['promote', 'renew', 'assign'] as const)('creates a free immutable %s review without callbacks or changing the input', (kind) => {
    const context = fixture(); const before = JSON.stringify(context);
    const review = createStaffDeskReview(context, action(context, kind));
    expect(review).not.toBeNull(); expect(JSON.stringify(context)).toBe(before);
    expect(Object.isFrozen(review!.quote)).toBe(true);
    expect(context.onUpgradeStaff).not.toHaveBeenCalled(); expect(context.onRenewStaff).not.toHaveBeenCalled(); expect(context.onAssignStaff).not.toHaveBeenCalled();
  });

  it.each(['promote', 'renew', 'assign'] as const)('renders %s as an inline review with explicit approval and no modal', (kind) => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, kind))!;
    const html = renderToStaticMarkup(<StaffDecisionReview review={review} context={context} gate={createStaffReviewGate()} onClose={vi.fn()} />);
    expect(html).toContain('인사 검토서'); expect(html).toContain('검토 취소 · 무료'); expect(html).toContain('최종 승인');
    expect(html).toContain('aria-labelledby='); expect(html).toContain('tabindex="-1"');
    expect(html).not.toContain('aria-modal'); expect(html).not.toContain('role="dialog"');
    expect(html).toContain('정확파운드'); expect(html).not.toContain('축약파운드');
    expect(context.onUpgradeStaff).not.toHaveBeenCalled(); expect(context.onRenewStaff).not.toHaveBeenCalled(); expect(context.onAssignStaff).not.toHaveBeenCalled();
  });

  it('shows promotion growth, unchanged authority, exact one-off cost and future payroll', () => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, 'promote'))!;
    expect(review.cost).toBe('정치력 8 · 국고 50 정확파운드');
    expect(review.metrics[0]).toEqual({ label: '즉시 국고', before: '920 정확파운드', after: '870 정확파운드' });
    expect(review.people[0].metrics).toContainEqual({ label: '성장 등급 · 3단계', before: '1/3', after: '2/3' });
    expect(review.people[0].metrics).toContainEqual({ label: '성장도', before: '100%', after: '0%' });
    const html = renderToStaticMarkup(<StaffDecisionReview review={review} context={context} gate={createStaffReviewGate()} onClose={vi.fn()} />);
    expect(html).toContain('시작 보직의 별 5단계'); expect(html).toContain('새 보직이나 결재 권한을 얻지 않습니다');
  });

  it.each([0, 3, 52])('adds 104 weeks to a %i-week remainder instead of replacing it', (weeks) => {
    const context = fixture(); context.input!.staff[0].contractWeeksRemaining = weeks;
    const review = createStaffDeskReview(context, action(context, 'renew'))!;
    expect(review.people[0].metrics).toContainEqual({ label: '잔여 계약', before: weeks + '주', after: (weeks + 104) + '주' });
    expect(review.metrics[2].label).toContain('다음 주부터');
    const html = renderToStaticMarkup(<StaffDecisionReview review={review} context={context} gate={createStaffReviewGate()} onClose={vi.fn()} />);
    expect(html).toContain('현재 남은 계약을 없애지 않고 104주를 더합니다');
    expect(html).not.toContain('자동 퇴직');
  });

  it('shows both real swap participants, loss of both delegations, focus and promise consequences', () => {
    const context = fixture(); const input = context.input!;
    const review = createStaffDeskReview(context, action(context, 'assign'))!;
    expect(review.people).toHaveLength(2);
    for (const person of review.people) {
      expect(person.metrics).toContainEqual({ label: '책임 위임', before: '위임 중', after: '직접 결재' });
      expect(person.promiseAfter).toContain('약속 위반');
      expect(person.from).not.toBe(person.to);
    }
    expect(review.focus).toBe(input.staff[0].name + ' → 지정 없음');
    expect(review.acknowledgement).toContain('모든 인물');
    const html = renderToStaticMarkup(<StaffDecisionReview review={review} context={context} gate={createStaffReviewGate()} onClose={vi.fn()} />);
    expect(html).toContain(input.staff[0].name); expect(html).toContain(input.staff[1].name);
    expect(html).toContain('type="checkbox"'); expect(html).toContain('staff-review-promises" open');
  });

  it('keeps original-currency amounts fixed when the formatter changes after review', () => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, 'renew'))!;
    const before = JSON.stringify(review); context.formatMoney = (value) => value + ' 신통화';
    expect(JSON.stringify(review)).toBe(before); expect(review.cost).toContain('정확파운드');
    expect(review.currencyNote).toContain('표기는 바뀌지 않습니다');
  });

  it('requires acknowledgement for a swap, then dispatches the exact chosen people and seat only once', () => {
    const context = fixture(); const selected = action(context, 'assign');
    const review = createStaffDeskReview(context, selected)!; const gate = createStaffReviewGate();
    expect(confirmStaffDeskReview(review, context, gate, false)).toMatchObject({ ok: false, submitted: false });
    expect(context.onAssignStaff).not.toHaveBeenCalled();
    expect(confirmStaffDeskReview(review, context, gate, true)).toMatchObject({ ok: true, submitted: true });
    expect(context.onAssignStaff).toHaveBeenCalledExactlyOnceWith(selected.staffId, 'department' in selected ? selected.department : '');
    expect(confirmStaffDeskReview(review, context, gate, true).ok).toBe(false);
    expect(context.onAssignStaff).toHaveBeenCalledTimes(1);
  });

  it.each(['promote', 'renew'] as const)('dispatches %s to its existing callback only after approval', (kind) => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, kind))!;
    const result = confirmStaffDeskReview(review, context, createStaffReviewGate(), false);
    expect(result.ok).toBe(true); expect(result.result?.action.kind).toBe(kind);
    expect(kind === 'promote' ? context.onUpgradeStaff : context.onRenewStaff).toHaveBeenCalledExactlyOnceWith(context.input!.staff[0].id);
    expect(context.onAssignStaff).not.toHaveBeenCalled();
  });

  it.each(['week', 'money', 'political', 'staff', 'identity', 'focus', 'role', 'phase', 'busy', 'removed'] as const)('blocks a stale review after %s changes', (change) => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, 'promote'))!; const input = context.input!;
    if (change === 'week') input.game.week++;
    if (change === 'money') input.game.treasury++;
    if (change === 'political') input.game.politicalPower++;
    if (change === 'staff') input.staff[1].weeklyCost++;
    if (change === 'identity') input.staff[0].personId += '-different';
    if (change === 'focus') input.developmentFocusId = null;
    if (change === 'role') input.role = getRole('britain-tier2', 'britain');
    if (change === 'phase') input.campaignPhase = 'war';
    if (change === 'busy') input.busy = true;
    if (change === 'removed') input.staff = input.staff.slice(1);
    expect(assessStaffDeskReview(review, context).allowed).toBe(false);
    expect(confirmStaffDeskReview(review, context, createStaffReviewGate(), true).ok).toBe(false);
    expect(context.onUpgradeStaff).not.toHaveBeenCalled();
  });

  it('does not approve a different selected identity or target seat from the one reviewed', () => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, 'assign'))!;
    const changed: StaffDecisionAction = { kind: 'assign', staffId: context.input!.staff[2].id, department: context.input!.staff[1].department };
    expect(confirmStaffDeskReview(review, context, createStaffReviewGate(), true, changed).ok).toBe(false);
    expect(context.onAssignStaff).not.toHaveBeenCalled();
  });

  it('keeps missing context read-only and does not pick a fallback staff member', () => {
    const context = fixture(); const selected = action(context, 'renew'); context.input = null;
    expect(createStaffDeskReview(context, selected)).toBeNull();
    expect(getStaffDeskAvailability(null, selected).allowed).toBe(false);
    const fresh = fixture(); expect(createStaffDeskReview(fresh, { kind: 'renew', staffId: 'missing' })).toBeNull();
    expect(fresh.onRenewStaff).not.toHaveBeenCalled();
  });

  it.each(['return-false', 'throw', 'reentry'] as const)('contains %s callbacks without repeated cost dispatch', (mode) => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, 'promote'))!; const gate = createStaffReviewGate();
    const callback = vi.fn(() => {
      if (mode === 'return-false') return false;
      if (mode === 'throw') throw new Error('uncertain submission');
      expect(confirmStaffDeskReview(review, context, gate, true).ok).toBe(false);
    });
    context.onUpgradeStaff = callback;
    const result = confirmStaffDeskReview(review, context, gate, true);
    expect(result.submitted).toBe(true); expect(result.ok).toBe(mode === 'reentry');
    expect(confirmStaffDeskReview(review, context, gate, true).ok).toBe(false); expect(callback).toHaveBeenCalledTimes(1);
  });

  it.each(['promote', 'renew', 'assign'] as const)('confirms %s only after actual game, full staff and focus state are persisted', (kind) => {
    const context = fixture(); const review = createStaffDeskReview(context, action(context, kind))!;
    const outcome = confirmStaffDeskReview(review, context, createStaffReviewGate(), true);
    expect(outcome.ok).toBe(true); expect(outcome.result).not.toBeNull();
    expect(getStaffDecisionReceipt(outcome.result!, context.input!).confirmed).toBe(false);
    const actual = persist(context.input!, outcome.result!);
    expect(getStaffDecisionReceipt(outcome.result!, actual).confirmed).toBe(true);
    expect(getStaffDecisionReceipt(outcome.result!, { ...actual, staff: context.input!.staff }).confirmed).toBe(false);
    const changedGame = { ...actual.game, treasury: actual.game.treasury + 1 };
    expect(getStaffDecisionReceipt(outcome.result!, { ...actual, game: changedGame }).confirmed).toBe(false);
    if (kind === 'assign') expect(getStaffDecisionReceipt(outcome.result!, { ...actual, developmentFocusId: context.input!.developmentFocusId }).confirmed).toBe(false);
  });
});
