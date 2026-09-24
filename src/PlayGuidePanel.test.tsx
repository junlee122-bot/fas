import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { careerRoles } from './campaign';
import { getRoleTabMandates } from './roleMandate';
import { getPlayGuide } from './playGuide';
import { FirstWeekOrientation, PlayGuidePanel } from './PlayGuidePanel';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}
const buttons = (node: ReactNode) => elements(node).filter((item) => item.type === 'button');
const click = (node: ReactElement<Record<string, unknown>>) => (node.props.onClick as () => void)();

describe('read-only capability discovery', () => {
  it.each(['military', 'politics', 'intelligence'] as const)('uses the live %s role and only routes explicit clicks', (branch) => {
    const role = careerRoles.find((item) => item.nationId === 'britain' && item.branch === branch && item.tier === 3)!;
    const guide = getPlayGuide({ role, mandates: getRoleTabMandates(role) });
    const before = JSON.stringify(guide);
    const callbacks = { onNavigate: vi.fn(), onOpenWorldWeekly: vi.fn(), onOpenBriefing: vi.fn() };
    const view = PlayGuidePanel({ guide, ...callbacks });
    const html = renderToStaticMarkup(view);
    expect(html).toContain('첫 주 플레이 순서');
    expect(html).toContain('직접 담당');
    expect(html).toContain('상신');
    expect(html).toContain('보고');
    Object.values(callbacks).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    click(buttons(view)[1]);
    expect(callbacks.onNavigate).toHaveBeenCalledExactlyOnceWith(guide.firstAction.tab);
    expect(callbacks.onOpenBriefing).not.toHaveBeenCalled();
    expect(callbacks.onOpenWorldWeekly).not.toHaveBeenCalled();
    expect(JSON.stringify(guide)).toBe(before);
  });

  it('separates reading the world and opening the weekly briefing from time advancement', () => {
    const role = careerRoles[0];
    const guide = getPlayGuide({ role, mandates: getRoleTabMandates(role) });
    const callbacks = { onNavigate: vi.fn(), onOpenWorldWeekly: vi.fn(), onOpenBriefing: vi.fn() };
    const view = PlayGuidePanel({ guide, ...callbacks });
    click(buttons(view)[0]);
    expect(callbacks.onOpenWorldWeekly).toHaveBeenCalledOnce();
    expect(callbacks.onOpenBriefing).not.toHaveBeenCalled();
    click(buttons(view)[2]);
    expect(callbacks.onOpenBriefing).toHaveBeenCalledOnce();
    expect(callbacks.onNavigate).not.toHaveBeenCalled();
    expect(renderToStaticMarkup(view)).toContain('주간 브리핑을 여는 것만으로 시간이 흐르지는 않습니다.');
  });

  it('keeps all national work locked for a civilian, even when a handler is invoked directly', () => {
    const role = careerRoles[0];
    const guide = getPlayGuide({ role, mandates: getRoleTabMandates(role), civilian: { professionId: 'intellectual', originId: 'university-network' } });
    const onNavigate = vi.fn();
    const view = PlayGuidePanel({ guide, onNavigate, onOpenWorldWeekly: vi.fn(), onOpenBriefing: vi.fn() });
    const locked = buttons(view).filter((button) => button.props.disabled);
    expect(locked).toHaveLength(10);
    locked.forEach(click);
    expect(onNavigate).not.toHaveBeenCalled();
    click(buttons(view)[1]);
    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('command');
  });

  it('keeps four progressive groups, without hiding capabilities or implying execution', () => {
    const role = careerRoles[0];
    const guide = getPlayGuide({ role, mandates: getRoleTabMandates(role) });
    const view = PlayGuidePanel({ guide, onNavigate: vi.fn(), onOpenWorldWeekly: vi.fn(), onOpenBriefing: vi.fn() });
    const details = elements(view).filter((item) => item.type === 'details');
    expect(details).toHaveLength(4);
    expect(details.every((item) => !item.props.open)).toBe(true);
    expect(elements(view).filter((item) => item.type === 'article')).toHaveLength(10);
  });

  it.each([false, true])('first-week entry only opens the guide (civilian=%s)', (civilian) => {
    const onOpenGuide = vi.fn();
    const view = FirstWeekOrientation({ onOpenGuide, civilian });
    const html = renderToStaticMarkup(view);
    expect(html).toContain('내가 할 수 있는 일');
    if (civilian) expect(html).toContain('이번 주 개인 활동 고르기');
    expect(onOpenGuide).not.toHaveBeenCalled();
    expect(buttons(view)).toHaveLength(1);
    click(buttons(view)[0]);
    expect(onOpenGuide).toHaveBeenCalledOnce();
  });
});
