import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createStaffCandidates, createStaffRoster, getRole } from './campaign';
import { createPersonnelReviewGate, type PersonnelContext } from './personnelActions';
import { defaultRecruitmentOffer } from './recruitment';
import { RecruitmentNegotiation, assessRecruitmentDeskReview, confirmRecruitmentDeskReview, createRecruitmentDeskReview, getRecruitmentDeskAvailability, getRecruitmentDeskReceipt, getRecruitmentDeskSummary, type RecruitmentNegotiationProps } from './RecruitmentNegotiation';

function fixture(success = true): RecruitmentNegotiationProps {
  const staff = createStaffRoster('britain', 'britain-tier1');
  const candidate = { ...createStaffCandidates('britain', 'britain-tier1')[0], id: 'candidate-test', personId: 'new-person', name: '새 후보', department: staff[0].department, knowledge: 75, interest: success ? 95 : 1, relationship: success ? 60 : 0, rivalInterest: success ? 0 : 90, weeklyCost: 11, signingCost: 130, status: 'unscouted' as const, availability: 'available' as const };
  const context: PersonnelContext = {
    game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
    role: getRole('britain-tier1', 'britain'), reputation: 45, staff, candidates: [candidate],
  };
  return { candidate, offer: { ...defaultRecruitmentOffer }, politicalPower: context.game.politicalPower, treasury: context.game.treasury, reputation: context.reputation, context, formatMoney: (value) => `${value} 테스트화폐`, onChange: vi.fn(), onClose: vi.fn(), onSubmit: vi.fn() };
}

describe('inline recruitment negotiation desk', () => {
  it('renders free editing and a real score instead of a fabricated acceptance probability', () => {
    const p = fixture(); const before = JSON.stringify(p);
    const html = renderToStaticMarkup(<RecruitmentNegotiation {...p} />);
    expect(html).toContain('비용·인사 영향 검토'); expect(html).toContain('72점 이상이면 합의');
    expect(html).toContain('제출 조건: 정치력 6'); expect(html).toContain('정치력 3');
    expect(html).toContain('현재 보직 담당자'); expect(html).toContain('기존 담당자 주급');
    expect(html).not.toContain('예상 합의율'); expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('staff-negotiation-backdrop'); expect(html).not.toContain('최종 승인</button>');
    expect(p.onSubmit).not.toHaveBeenCalled(); expect(p.onChange).not.toHaveBeenCalled(); expect(JSON.stringify(p)).toBe(before);
  });

  it('labels controls, exposes selected conditions and keeps native keyboard controls', () => {
    const p = fixture(); const html = renderToStaticMarkup(<RecruitmentNegotiation {...p} />);
    expect(html).toContain('aria-pressed="true"'); expect(html).toContain('<fieldset'); expect(html).toContain('<legend>');
    expect(html).toContain('aria-label="협상 작업대 닫기"'); expect(html).toContain('aria-current="step"'); expect(html).toContain('<label');
    expect(html).toContain('자원·승계·안전을 지금 즉시 지급하거나 법적으로 보장하는 행동은 아닙니다');
  });

  it('uses exact national currency values for visible compensation rather than rounded identical totals', () => {
    const p = fixture(); const formatter = vi.fn((value: number, options?: { signed?: boolean; exact?: boolean }) => `${value} 테스트화폐 ${options?.exact ? '정확' : '반올림'}`); p.formatMoney = formatter;
    const html = renderToStaticMarkup(<RecruitmentNegotiation {...p} />);
    expect(html).toContain('130 테스트화폐 정확'); expect(formatter.mock.calls.every((call) => call[1]?.exact === true)).toBe(true);
  });

  it.each([true, false])('formats every financial line in reviewed and approved summaries: %s', (success) => {
    const p = fixture(success); const review = createRecruitmentDeskReview(p)!; const summary = getRecruitmentDeskSummary(review, p.formatMoney).join('\n');
    expect(summary).toContain('130 테스트화폐');
    if (!success) expect(summary).toContain('142 테스트화폐');
    expect(summary).not.toContain('계약금 130를'); expect(summary).not.toContain('계약금 130을');
  });

  it('is read-only when an older caller cannot provide the live personnel context', () => {
    const p = { ...fixture(), context: undefined };
    expect(getRecruitmentDeskAvailability(p).allowed).toBe(false); expect(createRecruitmentDeskReview(p)).toBeNull();
    expect(renderToStaticMarkup(<RecruitmentNegotiation {...p} />)).toContain('조건을 읽을 수 있지만 제출할 수 없습니다');
  });

  it.each([true, false])('previews the actual pure engine without spending; success=%s', (success) => {
    const p = fixture(success); const before = JSON.stringify(p); const review = createRecruitmentDeskReview(p)!;
    expect(review).not.toBeNull(); expect(review.quote.assessment.result.recruitment?.success).toBe(success);
    const result = review.quote.assessment.result;
    expect(result.gameDelta.politicalPower).toBe(success ? -6 : -3);
    expect(result.requirements).toEqual({ politicalPower: 6, treasury: 130 });
    expect(result.gameDelta.treasury).toBe(success ? -130 : -0);
    expect(result.recruitment!.weeklyPayrollAfter).toBe(success ? result.recruitment!.weeklyPayrollBefore - result.recruitment!.incumbent.weeklyCost + 11 : result.recruitment!.weeklyPayrollBefore);
    if (!success) expect(result.updatedCandidate!.signingCost).toBe(p.candidate.signingCost + 12);
    expect(JSON.stringify(p)).toBe(before); expect(p.onSubmit).not.toHaveBeenCalled();
  });

  it('captures an immutable person, incumbent, resource and offer quotation', () => {
    const p = fixture(); const review = createRecruitmentDeskReview(p)!; const before = JSON.stringify(review);
    p.candidate.name = '이름 변경'; p.context!.staff[0].name = '다른 담당자'; p.context!.game.treasury -= 30; p.offer.termWeeks = 156;
    expect(JSON.stringify(review)).toBe(before); expect(review.treasury).toBe(920); expect(assessRecruitmentDeskReview(review, p).allowed).toBe(false);
  });

  it.each(['week', 'reputation', 'politicalPower', 'treasury', 'role', 'incumbent-person', 'incumbent-removed', 'candidate-person', 'candidate-removed', 'candidate-lost', 'candidate-signed', 'knowledge', 'offer', 'busy'] as const)('blocks stale approval after %s changes', (change) => {
    const p = fixture(); const review = createRecruitmentDeskReview(p)!; const context = p.context!;
    if (change === 'week') context.game.week += 1;
    if (change === 'reputation') context.reputation += 1;
    if (change === 'politicalPower') context.game.politicalPower -= 1;
    if (change === 'treasury') context.game.treasury -= 1;
    if (change === 'role') context.role = { ...context.role, tier: 5 };
    if (change === 'incumbent-person') context.staff[0] = { ...context.staff[0], personId: 'replacement-person' };
    if (change === 'incumbent-removed') context.staff = context.staff.slice(1);
    if (change === 'candidate-person') context.candidates[0] = { ...context.candidates[0], personId: 'different-candidate' };
    if (change === 'candidate-removed') context.candidates = [];
    if (change === 'candidate-lost') context.candidates[0] = { ...context.candidates[0], status: 'lost' };
    if (change === 'candidate-signed') context.candidates[0] = { ...context.candidates[0], status: 'signed' };
    if (change === 'knowledge') context.candidates[0] = { ...context.candidates[0], knowledge: 54 };
    if (change === 'offer') p.offer = { ...p.offer, termWeeks: 156 };
    if (change === 'busy') p.busy = true;
    expect(confirmRecruitmentDeskReview(review, p, createPersonnelReviewGate())).toMatchObject({ ok: false, submitted: false }); expect(p.onSubmit).not.toHaveBeenCalled();
  });

  it.each(['low-power', 'low-treasury', 'busy', 'unscouted', 'lost'] as const)('does not quote an unavailable action: %s', (reason) => {
    const p = fixture(false);
    if (reason === 'low-power') p.context!.game.politicalPower = 5;
    if (reason === 'low-treasury') p.context!.game.treasury = 129;
    if (reason === 'busy') p.context!.busy = true;
    if (reason === 'unscouted') p.candidate.knowledge = 54;
    if (reason === 'lost') p.candidate.status = 'lost';
    expect(createRecruitmentDeskReview(p)).toBeNull(); expect(getRecruitmentDeskAvailability(p).allowed).toBe(false);
  });

  it.each([true, false])('submits a valid decision at most once, including a deliberate failure: %s', (success) => {
    const p = fixture(success); const review = createRecruitmentDeskReview(p)!; const gate = createPersonnelReviewGate();
    expect(confirmRecruitmentDeskReview(review, p, gate)).toMatchObject({ ok: true, submitted: true }); expect(confirmRecruitmentDeskReview(review, p, gate)).toMatchObject({ ok: false, submitted: true });
    expect(p.onSubmit).toHaveBeenCalledTimes(1);
  });

  it.each(['false', 'throw'] as const)('does not retry an uncertain callback: %s', (mode) => {
    const p = fixture(); p.onSubmit = vi.fn(() => { if (mode === 'throw') throw new Error('unknown'); return false; });
    const review = createRecruitmentDeskReview(p)!; const gate = createPersonnelReviewGate();
    expect(confirmRecruitmentDeskReview(review, p, gate)).toMatchObject({ ok: false, submitted: true }); expect(confirmRecruitmentDeskReview(review, p, gate)).toMatchObject({ ok: false, submitted: true }); expect(p.onSubmit).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('only confirms success/failure after real roster or candidate changes: %s', (success) => {
    const p = fixture(success); const review = createRecruitmentDeskReview(p)!;
    expect(getRecruitmentDeskReceipt(review, p.context).state).toBe('waiting'); expect(getRecruitmentDeskReceipt(review).state).toBe('waiting');
    const result = review.quote.assessment.result;
    const context = { ...p.context!, staff: result.staff, candidates: result.candidates };
    expect(getRecruitmentDeskReceipt(review, context).state).toBe(success ? 'success' : 'failed');
  });

  it('does not mistake a different occupant of the same seat for the hired person', () => {
    const p = fixture(); const review = createRecruitmentDeskReview(p)!; const result = review.quote.assessment.result;
    const context = { ...p.context!, staff: result.staff.map((member) => member.id === result.recruitment!.incumbent.id ? { ...member, personId: 'another-person' } : member), candidates: result.candidates };
    expect(getRecruitmentDeskReceipt(review, context).state).toBe('waiting');
  });
});
