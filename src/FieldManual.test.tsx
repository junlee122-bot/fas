import { Children, isValidElement, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FieldManual, FieldManualView, handleFieldManualKeyDown } from './FieldManual';
import { getPlayGuide } from './playGuide';
import { getRoleTabMandates } from './roleMandate';
import type { CareerRole } from './types';
import type { OnboardingStep } from './ux';

const role: CareerRole = {
  id: 'field-guide-test', nationId: 'britain', title: '야전 지휘관', branch: 'military', tier: 4,
  archetype: 'field-command', scope: '야전 부대', authority: 40, expectation: '준비 상태 확인',
  historicalHolderId: 'holder', historicalHolderName: '기존 지휘관', historicalOffice: '보직',
  historicalBasis: '시험', coverIdentity: '공식 기관', replacementEffect: '교체',
};
const guide = getPlayGuide({ role, mandates: getRoleTabMandates(role) });
const steps: OnboardingStep[] = [
  { id: 'test-army', tab: 'army', title: '부대 상태 살펴보기', detail: '병력·보급을 확인하세요.', complete: false },
];

function callbacks() {
  return { onNavigate: vi.fn(), onRestartTutorial: vi.fn(), onClose: vi.fn(), onOpenWorldWeekly: vi.fn(), onOpenBriefing: vi.fn() };
}

function viewProps() {
  return {
    steps, guide, ...callbacks(), view: 'overview' as const, category: 'all' as const, query: '',
    onViewChange: vi.fn(), onCategoryChange: vi.fn(), onQueryChange: vi.fn(),
  };
}

type ElementProps = { children?: ReactNode; onClick?: () => void; onChange?: (event: { target: { value: string } }) => void; [key: string]: unknown };

// Inspect native elements from the pure view; never invoke hook-based children.
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  return Children.toArray(node).flatMap((child) => {
    if (!isValidElement<ElementProps>(child)) return [];
    return [child, ...elements(child.props.children)];
  });
}

function buttonByText(tree: ReactNode, label: string) {
  const button = elements(tree).find((element) => element.type === 'button' && element.props.children === label);
  expect(button).toBeDefined();
  return button!;
}

describe('FieldManual accessible guide views', () => {
  it('opens the supplied guide on overview without the reference search or long article library', () => {
    const handlers = callbacks();
    const before = JSON.stringify({ guide, steps });
    const html = renderToStaticMarkup(<FieldManual steps={steps} guide={guide} {...handlers} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('guide-enabled');
    expect(html).toContain('플레이 안내 닫기');
    expect(html).toContain('시작과 할 수 있는 일');
    expect(html).toContain(guide.firstAction.title);
    expect(html).not.toContain('aria-label="야전 교범 검색"');
    expect(html).not.toContain('class="manual-results"');
    expect(html).not.toContain('class="first-week-steps"');
    expect(JSON.stringify({ guide, steps })).toBe(before);
    Object.values(handlers).forEach((handler) => expect(handler).not.toHaveBeenCalled());
  });

  it('preserves the existing checklist and reference view when no guide is supplied', () => {
    const html = renderToStaticMarkup(<FieldManual steps={steps} {...callbacks()} />);
    expect(html).toContain('야전 교범 닫기');
    expect(html).toContain('class="first-week-steps"');
    expect(html).toContain('aria-label="야전 교범 검색"');
    expect(html).not.toContain('manual-view-switch');
  });

  it('changes view selection only, without navigation or game actions', () => {
    const props = viewProps();
    const tree = FieldManualView(props);
    const overview = buttonByText(tree, '시작과 할 수 있는 일');
    const checklist = buttonByText(tree, '첫 주 체크리스트');
    const reference = buttonByText(tree, '시스템 교범');
    expect(overview.props['aria-pressed']).toBe(true);
    expect(checklist.props['aria-pressed']).toBe(false);
    checklist.props.onClick!();
    reference.props.onClick!();
    expect(props.onViewChange.mock.calls).toEqual([['checklist'], ['reference']]);
    expect(props.onNavigate).not.toHaveBeenCalled();
    expect(props.onOpenWorldWeekly).not.toHaveBeenCalled();
    expect(props.onOpenBriefing).not.toHaveBeenCalled();
  });

  it('shows the checklist alone and passes its destination without claiming completion', () => {
    const props = { ...viewProps(), view: 'checklist' as const };
    const tree = FieldManualView(props);
    const button = elements(tree).find((element) => element.type === 'button' && String(element.props['aria-label']).startsWith('부대 상태 살펴보기 · 미완료'))!;
    button.props.onClick!();
    expect(props.onNavigate).toHaveBeenCalledExactlyOnceWith('army');
    expect(steps[0].complete).toBe(false);
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('class="first-week-steps"');
    expect(html).not.toContain('aria-label="야전 교범 검색"');
    expect(html).not.toContain(guide.firstAction.title);
  });

  it('shows only the chosen article category and searches without issuing an action', () => {
    const props = { ...viewProps(), view: 'reference' as const, query: '플레이 지도' };
    const tree = FieldManualView(props);
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('플레이 지도와 사료 지도는 무엇이 다릅니까?');
    expect(html).not.toContain('class="first-week-steps"');
    expect(html).not.toContain('219개');
    expect(html).not.toContain('66개 전선군');
    expect(html).not.toContain('600%');
    const input = elements(tree).find((element) => element.type === 'input')!;
    input.props.onChange!({ target: { value: '권한' } });
    const clear = elements(tree).find((element) => element.props['aria-label'] === '검색어 지우기')!;
    clear.props.onClick!();
    expect(props.onQueryChange.mock.calls).toEqual([['권한'], ['']]);
    expect(props.onNavigate).not.toHaveBeenCalled();
  });

  it('opens the world weekly for both office and civilian briefing checklist entries', () => {
    const civilianGuide = getPlayGuide({ role, mandates: getRoleTabMandates(role, 'civilian'), civilian: { professionId: 'journalist', originId: 'working-community' } });
    for (const [activeGuide, title] of [[guide, '취임 브리핑 읽기'], [civilianGuide, '세계 주보 읽기']] as const) {
      const briefingSteps: OnboardingStep[] = [{ id: 'briefing', tab: 'command', title, detail: '세계 상황을 읽습니다.', complete: false }];
      const props = { ...viewProps(), guide: activeGuide, steps: briefingSteps, view: 'checklist' as const };
      const tree = FieldManualView(props);
      const button = elements(tree).find((element) => String(element.props['aria-label']).startsWith(`${title} · 미완료`))!;
      button.props.onClick!();
      expect(props.onOpenWorldWeekly).toHaveBeenCalledOnce();
      expect(props.onOpenBriefing).not.toHaveBeenCalled();
      expect(props.onNavigate).not.toHaveBeenCalled();
      expect(briefingSteps[0].complete).toBe(false);
    }
  });

  it('opens weekly review for the advance entry without advancing time or completing the step', () => {
    const advanceSteps: OnboardingStep[] = [{ id: 'advance', tab: 'command', title: '첫 주를 진행하고 결과 찾아보기', detail: '준비와 결과를 확인합니다.', complete: false }];
    const props = { ...viewProps(), steps: advanceSteps, view: 'checklist' as const };
    const before = JSON.stringify(advanceSteps);
    const button = elements(FieldManualView(props)).find((element) => String(element.props['aria-label']).startsWith('첫 주를 진행하고 결과 찾아보기 · 미완료'))!;
    button.props.onClick!();
    expect(props.onOpenBriefing).toHaveBeenCalledOnce();
    expect(props.onOpenWorldWeekly).not.toHaveBeenCalled();
    expect(props.onNavigate).not.toHaveBeenCalled();
    expect(JSON.stringify(advanceSteps)).toBe(before);
  });

  it('retains legacy navigation when dedicated briefing callbacks are unavailable', () => {
    const legacySteps: OnboardingStep[] = [
      { id: 'briefing', tab: 'command', title: '세계 주보 읽기', detail: '상황 확인', complete: false },
      { id: 'advance', tab: 'command', title: '첫 주 검토', detail: '진행 전 확인', complete: false },
    ];
    const props = { ...viewProps(), guide: undefined, steps: legacySteps, onOpenWorldWeekly: undefined, onOpenBriefing: undefined };
    const tree = FieldManualView(props);
    for (const step of legacySteps) {
      const button = elements(tree).find((element) => String(element.props['aria-label']).startsWith(`${step.title} · 미완료`))!;
      button.props.onClick!();
    }
    expect(props.onNavigate.mock.calls).toEqual([['command'], ['command']]);
    expect(legacySteps.every((step) => !step.complete)).toBe(true);
  });

  it('limits first-step articles to authority-aware guidance and actual geography', () => {
    const tree = FieldManualView({ ...viewProps(), view: 'reference', category: 'start' });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('모든 메뉴를 한 번에 이해하거나 모든 빈 슬롯을 채울 필요는 없습니다');
    expect(html).toContain('상신만으로 승인되지는 않습니다');
    expect(html).toContain('이동·전투·협상·연구가 모두 한 주 안에 끝나는 것은 아닙니다');
    expect(html).toContain('현재 대체역사의 국경이나 부대 위치를 보증하지 않습니다');
  });

  it('keeps close and replay callbacks separate from navigation', () => {
    const props = viewProps();
    const tree = FieldManualView(props);
    const close = elements(tree).find((element) => element.props['aria-label'] === '플레이 안내 닫기')!;
    close.props.onClick!();
    const replay = elements(tree).find((element) => element.type === 'button' && element.props.onClick === props.onRestartTutorial)!;
    replay.props.onClick!();
    expect(props.onClose).toHaveBeenCalledOnce();
    expect(props.onRestartTutorial).toHaveBeenCalledOnce();
    expect(props.onNavigate).not.toHaveBeenCalled();
  });
});

function keyEvent(key: string, settings: { shiftKey?: boolean; active?: unknown; empty?: boolean } = {}) {
  const first = { focus: vi.fn(), closest: () => null, getAttribute: () => null, getClientRects: () => [{}] };
  const last = { focus: vi.fn(), closest: () => null, getAttribute: () => null, getClientRects: () => [{}] };
  const target = {
    querySelectorAll: () => settings.empty ? [] : [first, last],
    ownerDocument: { activeElement: settings.active === 'first' ? first : settings.active === 'last' ? last : settings.active },
    focus: vi.fn(),
  };
  const event = { key, shiftKey: settings.shiftKey ?? false, currentTarget: target, stopPropagation: vi.fn(), preventDefault: vi.fn() };
  return { event: event as unknown as KeyboardEvent<HTMLElement>, raw: event, first, last, target };
}

describe('FieldManual keyboard boundary', () => {
  it('closes once on Escape and prevents it reaching the map underneath', () => {
    const { event, raw } = keyEvent('Escape');
    const close = vi.fn();
    handleFieldManualKeyDown(event, close);
    expect(close).toHaveBeenCalledOnce();
    expect(raw.stopPropagation).toHaveBeenCalledOnce();
    expect(raw.preventDefault).toHaveBeenCalledOnce();
  });

  it('wraps forward Tab from the last control to the first', () => {
    const { event, raw, first, last } = keyEvent('Tab', { active: 'last' });
    handleFieldManualKeyDown(event, vi.fn());
    expect(raw.preventDefault).toHaveBeenCalledOnce();
    expect(first.focus).toHaveBeenCalledOnce();
    expect(last.focus).not.toHaveBeenCalled();
  });

  it('wraps reverse Tab from the first control to the last', () => {
    const { event, raw, last } = keyEvent('Tab', { active: 'first', shiftKey: true });
    handleFieldManualKeyDown(event, vi.fn());
    expect(raw.preventDefault).toHaveBeenCalledOnce();
    expect(last.focus).toHaveBeenCalledOnce();
  });

  it('recovers focus from outside the dialog without leaking a Tab', () => {
    const { event, first } = keyEvent('Tab', { active: {} });
    handleFieldManualKeyDown(event, vi.fn());
    expect(first.focus).toHaveBeenCalledOnce();
  });

  it('focuses the dialog itself when no visible controls are available', () => {
    const { event, raw, target } = keyEvent('Tab', { empty: true });
    handleFieldManualKeyDown(event, vi.fn());
    expect(target.focus).toHaveBeenCalledOnce();
    expect(raw.preventDefault).toHaveBeenCalledOnce();
  });

  it('leaves ordinary text editing intact but contains background keyboard shortcuts', () => {
    const { event, raw } = keyEvent('n');
    const close = vi.fn();
    handleFieldManualKeyDown(event, close);
    expect(raw.stopPropagation).toHaveBeenCalledOnce();
    expect(raw.preventDefault).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});
