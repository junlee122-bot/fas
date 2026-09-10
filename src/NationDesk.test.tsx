import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles, getNation } from './campaign';
import { createEconomyState } from './economy';
import { createNationManagementState, rebalanceNationBudget } from './nationManagement';
import { assessNationBudgetProposal, createNationBudgetProposal, focusNationBudgetElement, getNationDeskSections, NationBudgetEditor, NationBudgetProposalView, NationDeskNavigation, resolveNationDeskView } from './NationDesk';
import type { GameState } from './types';

const game: GameState = { week: 48, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108, factories: 34, stability: 72, warSupport: 78, commandPoints: 48, treasury: 860, victoryScore: 66, airPower: 61, navalPower: 56, intelNetwork: 64, enemyPressure: 42 };
const nation = getNation('britain');
const role = careerRoles.find((item) => item.nationId === nation.id && item.branch === 'politics' && item.tier === 1)!;
const economy = createEconomyState(nation.id);
const state = createNationManagementState(nation.id, game, economy, 3, 'victory');
const input = { state, nation, role, week: game.week, phase: 'nation' as const };
const proposal = createNationBudgetProposal(state, nation, role, game.week, 'welfare', 5);
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => { if (isValidElement<Record<string, unknown>>(child)) { result.push(child); result.push(...elements(child.props.children as ReactNode)); } });
  return result;
}

describe('national desk workspace boundaries', () => {
  it.each(['war', 'nation'] as const)('keeps unique reachable workspaces and defaults safely in %s', (phase) => {
    const sections = getNationDeskSections(phase);
    const views = sections.flatMap((section) => section.items.map((item) => item.id));
    expect(new Set(views).size).toBe(views.length);
    expect(views).toContain('overview');
    for (const view of views) expect(resolveNationDeskView(phase, view)).toBe(view);
    expect(views.includes('transition')).toBe(phase === 'war');
    expect(views.includes('budget')).toBe(phase === 'nation');
    for (const view of ['institutions', 'constitution', 'sovereign', 'justice', 'power', 'saga', 'socialist', 'media']) expect(views).toContain(view);
    expect(resolveNationDeskView('war', 'budget')).toBe('overview');
    expect(resolveNationDeskView('nation', 'transition')).toBe('overview');
  });

  it('browses a field or sub-workspace through navigation callbacks only', () => {
    const onChange = vi.fn();
    const tree = NationDeskNavigation({ phase: 'nation', view: 'constitution', onChange });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('aria-label="국정 분야"');
    expect(html).toContain('헌법과 임명');
    expect(html).toContain('선거·국민투표');
    expect(html).not.toContain('발전 노선');
    expect(onChange).not.toHaveBeenCalled();
    const justice = elements(tree).find((item) => item.type === 'button' && item.props.children === '사법 사건')!;
    (justice.props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('justice');
  });

  it.each(['war', 'nation'] as const)('opens the institutional itinerary first in %s', (phase) => {
    const onChange = vi.fn();
    const tree = NationDeskNavigation({ phase, view: 'overview', onChange });
    const field = elements(tree).find((item) => item.type === 'button' && item.props.children === '헌정·사법')!;
    (field.props.onClick as () => void)();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('institutions');
  });
});

describe('single-command national budget proposals', () => {
  it('previews exactly the existing rebalance rule, preserving 100% without executing or changing any state', () => {
    const before = structuredClone({ state, game, economy });
    const assessed = assessNationBudgetProposal(proposal, input);
    expect(assessed.allowed).toBe(true);
    expect(assessed.nextBudget).toEqual(rebalanceNationBudget(state, 'welfare', 5).budget);
    expect(assessed.nextBudget.welfare).toBe(state.budget.welfare + 5);
    expect(Object.values(assessed.nextBudget).reduce((sum, value) => sum + value, 0)).toBe(100);
    expect({ state, game, economy }).toEqual(before);
    expect(proposal.baseBudget).not.toBe(state.budget);
  });

  it.each([
    [{ week: game.week + 1 }, '주차'],
    [{ nation: getNation('usa') }, '소속'],
    [{ state: { ...state, nationId: 'usa' as const } }, '소속'],
    [{ role: { ...role, id: 'changed-role' } }, '보직'],
    [{ phase: 'war' as const }, '직접 집행권'],
    [{ authorized: false }, '직접 집행권'],
    [{ busy: true }, '기간 진행'],
    [{ week: Number.NaN }, '주차'],
    [{ state: rebalanceNationBudget(state, 'education', 5) }, '기존 예산'],
  ])('rejects changed context %s', (overrides, message) => {
    const assessed = assessNationBudgetProposal(proposal, { ...input, ...overrides });
    expect(assessed.allowed).toBe(false);
    expect(assessed.reason).toContain(message);
  });

  it('honors explicit current delegation and otherwise retains the role-derived budget boundary', () => {
    const military = careerRoles.find((item) => item.nationId === nation.id && item.branch === 'military' && item.tier === 4)!;
    const delegatedProposal = createNationBudgetProposal(state, nation, military, game.week, 'welfare', 5);
    expect(assessNationBudgetProposal(delegatedProposal, { ...input, role: military }).allowed).toBe(false);
    expect(assessNationBudgetProposal(delegatedProposal, { ...input, role: military, authorized: true }).allowed).toBe(true);
  });

  it('rejects malformed totals, nonfinite percentages, bounds and no-op proposals', () => {
    for (const budget of [
      { ...state.budget, welfare: state.budget.welfare + 1 },
      { ...state.budget, welfare: NaN },
      { reconstruction: 45, welfare: 5, education: 5, industry: 15, diplomacy: 15, security: 15 },
    ]) {
      const nextState = { ...state, budget };
      const candidate = createNationBudgetProposal(nextState, nation, role, game.week, 'reconstruction', 5);
      expect(assessNationBudgetProposal(candidate, { ...input, state: nextState }).allowed).toBe(false);
    }
    expect(assessNationBudgetProposal(null, input).allowed).toBe(false);
  });

  it('blocks replay once the original callback has applied the single approved rebalance', () => {
    const applied = rebalanceNationBudget(state, proposal.domain, proposal.delta);
    expect(assessNationBudgetProposal(proposal, { ...input, state: applied }).allowed).toBe(false);
    expect(state.budget).toEqual(proposal.baseBudget);
  });

  it('renders a draft with actual before/after allocations and explicit approval, without applying it', () => {
    const onApprove = vi.fn();
    const onDiscard = vi.fn();
    const tree = NationBudgetProposalView({ proposal, input, onApprove, onDiscard });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('아직 미집행');
    expect(html).toContain('15% → 20%');
    expect(html).toContain('25% → 20%');
    expect(html).toContain('배분 합계 100%');
    expect(html).toContain('다음 주 기존 국정 결산');
    expect(onApprove).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
    const approve = elements(tree).filter((item) => item.type === 'button').at(-1)!;
    (approve.props.onClick as () => void)();
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it('exposes the review as a focusable semantic heading without moving focus during rendering', () => {
    const headingRef = vi.fn();
    const onApprove = vi.fn();
    const onDiscard = vi.fn();
    const tree = NationBudgetProposalView({ proposal, input, onApprove, onDiscard, headingRef });
    const heading = elements(tree).find((item) => item.type === 'h2')!;
    expect(heading.props.id).toBe('nation-budget-review-title');
    expect(heading.props.tabIndex).toBe(-1);
    expect(heading.props['aria-describedby']).toBe('nation-budget-review-status');
    expect(heading.props.ref).toBe(headingRef);
    expect(tree.props['aria-labelledby']).toBe(heading.props.id);
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('예산 재배분안 검토');
    expect(html).not.toContain('autofocus');
    expect(headingRef).not.toHaveBeenCalled();
    expect(onApprove).not.toHaveBeenCalled();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('rechecks stale or unauthorized drafts before invoking approval even if a handler is invoked directly', () => {
    const onApprove = vi.fn();
    const tree = NationBudgetProposalView({ proposal, input: { ...input, week: game.week + 1 }, onApprove, onDiscard: vi.fn() });
    const approve = elements(tree).filter((item) => item.type === 'button').at(-1)!;
    expect(approve.props.disabled).toBe(true);
    (approve.props.onClick as () => void)();
    expect(onApprove).not.toHaveBeenCalled();
  });

  it('renders current allocations without creating a draft or invoking the engine callback', () => {
    const onBudgetChange = vi.fn();
    const html = renderToStaticMarkup(<NationBudgetEditor {...input} onBudgetChange={onBudgetChange} />);
    expect(html).toContain('단일 안건씩 적용');
    expect(html).toContain('확정된 현재 배분');
    expect(html).toContain('id="nation-budget-editor-title" tabindex="-1"');
    expect(html).not.toContain('id="nation-budget-review-title"');
    expect(html.match(/퍼센트포인트 (감액안|증액안)/g)).toHaveLength(12);
    expect(onBudgetChange).not.toHaveBeenCalled();
    const readonly = renderToStaticMarkup(<NationBudgetEditor {...input} authorized={false} onBudgetChange={onBudgetChange} />);
    expect(readonly).toContain('열람만 할 수 있습니다');
    expect(readonly.match(/disabled=""/g)).toHaveLength(12);
  });
});

describe('intentional budget review focus', () => {
  it.each([
    [true, 'instant'],
    [false, 'smooth'],
    [undefined, 'instant'],
  ] as const)('focuses before scrolling and honors reduced motion %s', (reducedMotion, behavior) => {
    const focus = vi.fn();
    const scrollIntoView = vi.fn();
    const matchMedia = reducedMotion === undefined ? undefined : vi.fn(() => ({ matches: reducedMotion }));
    const heading = { isConnected: true, focus, scrollIntoView, ownerDocument: { defaultView: { matchMedia } } } as unknown as HTMLElement;
    focusNationBudgetElement(heading);
    expect(focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior, block: 'start', inline: 'nearest' });
    expect(focus.mock.invocationCallOrder[0]).toBeLessThan(scrollIntoView.mock.invocationCallOrder[0]);
    if (matchMedia) expect(matchMedia).toHaveBeenCalledExactlyOnceWith('(prefers-reduced-motion: reduce)');
  });

  it('does nothing for missing or unmounted targets', () => {
    const focus = vi.fn();
    const scrollIntoView = vi.fn();
    focusNationBudgetElement(null);
    focusNationBudgetElement({ isConnected: false, focus, scrollIntoView } as unknown as HTMLElement);
    expect(focus).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
