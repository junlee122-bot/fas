import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CandidateActionReview } from './CandidateActionReview';
import { createStaffCandidates, createStaffRoster, getRole } from './campaign';
import { createPersonnelReview } from './personnelActions';
import type { PersonnelAction, PersonnelContext } from './personnelActions';

function fixture(): PersonnelContext {
  const role = getRole('britain-tier1', 'britain');
  return {
    role, reputation: 45, staff: createStaffRoster('britain', role.id),
    candidates: createStaffCandidates('britain', role.id).slice(0, 3).map((candidate) => ({ ...candidate, knowledge: 60, status: 'unscouted', lastApproachWeek: null })),
    game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
  };
}

function render(kind: PersonnelAction['kind'], context: PersonnelContext, currentContext = context) {
  const action = { kind, candidateId: context.candidates[0].id };
  const review = createPersonnelReview(context, action);
  expect(review).not.toBeNull();
  if (!review) throw new Error('Fixture should allow review');
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const before = JSON.stringify({ review, context, currentContext });
  const html = renderToStaticMarkup(<CandidateActionReview review={review} context={currentContext} onConfirm={onConfirm} onClose={onClose} />);
  expect(JSON.stringify({ review, context, currentContext })).toBe(before);
  expect(onConfirm).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  return { html, review };
}

describe('Candidate action review desk', () => {
  it('renders real one-time investigation costs and instant plus weekly effects without dispatching', () => {
    const context = fixture();
    const { html } = render('scout', context);
    expect(html).toContain(`${context.candidates[0].name}`);
    expect(html).toContain('86 → 84');
    expect(html).toContain('60 → 68%');
    expect(html).toContain('신규 조사 승인 · 2 PP');
    expect(html).toContain('자동 조사에는 추가 정치력을 사용하지 않습니다');
    expect(html).not.toContain('role="dialog"');
  });

  it('renders clamped relationship and knowledge changes from the same engine as execution', () => {
    const context = fixture();
    context.candidates[0] = { ...context.candidates[0], knowledge: 98, relationship: 99, interest: 99 };
    const { html, review } = render('approach', context);
    expect(review.assessment.result.updatedCandidate?.knowledge).toBe(100);
    expect(html).toContain('98 → 100%');
    expect(html).toContain('99 → 100');
    expect(html).toContain('86 → 82');
    expect(html).toContain('동일 인물과의 다음 접촉은 다음 주부터');
    expect(html).not.toContain('99 → 113');
  });

  it('preserves knowledge and interest while reviewing a free investigation cancellation', () => {
    const context = fixture();
    context.candidates[0] = { ...context.candidates[0], status: 'scouting', shortlisted: true };
    const { html, review } = render('stop-scout', context);
    expect(html).toContain('86 → 86');
    expect(html).toContain('60 → 60%');
    expect(html).toContain('조사 중단 승인 · 0 PP');
    expect(html).toContain('관심 명단은 보존');
    expect(review.assessment.result.updatedCandidate?.shortlisted).toBe(true);
  });

  it.each(['week', 'resource', 'candidate', 'busy'] as const)('keeps reviewed values frozen and blocks stale approval after %s changes', (change) => {
    const context = fixture();
    const current = structuredClone(context);
    if (change === 'week') current.game.week += 1;
    if (change === 'resource') current.game.politicalPower = 999;
    if (change === 'candidate') current.candidates[0].relationship += 1;
    if (change === 'busy') current.busy = true;
    const { html } = render('scout', context, current);
    expect(html).toContain('86 → 84');
    expect(html).toContain('제9주 기준');
    expect(html).not.toContain('999 → 997');
    expect(html).toContain('최신 조건으로 다시 검토');
    expect(html).toMatch(/<button type="button" disabled="">[\s\S]*?신규 조사 승인/);
  });
});
