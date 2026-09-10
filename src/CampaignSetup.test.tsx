import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CampaignSetup, CampaignSetupView, type CampaignSetupProps, type CampaignSetupViewProps } from './CampaignSetup';
import { careerRoles, nations } from './campaign';
import { civilianOrigins, civilianProfessions } from './civilianCareer';
import type { CareerBranch } from './types';

const role = careerRoles.find((item) => item.nationId === 'britain' && item.branch === 'military' && item.tier === 2)!;
function props(overrides: Partial<CampaignSetupViewProps> = {}): CampaignSetupViewProps {
  return {
    nationId: 'britain', roleId: role.id, startMode: 'office', civilianProfessionId: civilianProfessions[0].id,
    civilianOriginId: civilianOrigins[0].id, doctrine: 'coalition', hasSave: true, hasManualSaves: true,
    onNationChange: vi.fn(), onRoleChange: vi.fn(), onStartModeChange: vi.fn(),
    onCivilianProfessionChange: vi.fn(), onCivilianOriginChange: vi.fn(), onDoctrineChange: vi.fn(),
    onStart: vi.fn(), onContinue: vi.fn(), onManageSaves: vi.fn(),
    step: 1, branch: 'military', onStepChange: vi.fn(), onBranchChange: vi.fn(), ...overrides,
  };
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}
const action = (view: ReactNode, name: string) => elements(view).find((item) => item.props['data-action'] === name)!;
const click = (element: ReactElement<Record<string, unknown>>) => (element.props.onClick as () => void)();
const mutationCallbacks = (value: CampaignSetupProps) => [value.onNationChange, value.onRoleChange, value.onStartModeChange,
  value.onCivilianProfessionChange, value.onCivilianOriginChange, value.onDoctrineChange,
  value.onStart, value.onContinue, value.onManageSaves];

describe('three-stage campaign entry', () => {
  it('starts with all 13 nations and immediate save access, without exposing later-stage choices', () => {
    const value = props();
    const html = renderToStaticMarkup(<CampaignSetup {...value} />);
    expect(nations).toHaveLength(13);
    expect(html).toContain('data-step="1"');
    for (const nation of nations) expect(html).toContain('aria-label="' + nation.shortName + ', ');
    expect(html).toContain('저장 캠페인 계속');
    expect(html).toContain('체크포인트 관리');
    expect(html).toContain('삶과 보직 선택');
    expect(html).not.toContain('data-action="start"');
    expect(html).not.toContain('aria-label="보직 분야"');
    expect(html).not.toContain('id="campaign-origin"');
    mutationCallbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });

  it.each([1, 2, 3] as const)('renders stage %s with one current step and never mutates selections or starts a game', (step) => {
    const value = props({ step });
    const before = JSON.stringify(value);
    const html = renderToStaticMarkup(<CampaignSetupView {...value} />);
    expect(html.match(/aria-current="step"/g)).toHaveLength(1);
    expect(html).toContain('role="dialog" aria-modal="true"');
    expect(html).toContain('aria-labelledby="campaign-onboarding-title"');
    expect(html).toContain('id="campaign-onboarding-title"');
    expect(html).toContain('id="campaign-onboarding-description"');
    expect(html).toContain('현재 선택 · 아직 시작 전');
    expect(html).toContain(role.title);
    expect(html).not.toContain('campaign-setup-modal');
    expect(html).not.toContain('modal-backdrop');
    mutationCallbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    expect(value.onStepChange).not.toHaveBeenCalled();
    expect(value.onBranchChange).not.toHaveBeenCalled();
    expect(JSON.stringify(value)).toBe(before);
  });

  it('keeps next/back transitions navigation-only and calls the existing start callback only on final confirmation', () => {
    const value = props();
    let view = CampaignSetupView(value);
    click(action(view, 'back'));
    expect(value.onStepChange).not.toHaveBeenCalled();
    click(action(view, 'next'));
    expect(value.onStepChange).toHaveBeenLastCalledWith(2);
    expect(value.onStart).not.toHaveBeenCalled();
    view = CampaignSetupView({ ...value, step: 2 });
    click(action(view, 'next'));
    expect(value.onStepChange).toHaveBeenLastCalledWith(3);
    click(action(view, 'back'));
    expect(value.onStepChange).toHaveBeenLastCalledWith(1);
    mutationCallbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    view = CampaignSetupView({ ...value, step: 3 });
    expect(action(view, 'next')).toBeUndefined();
    click(action(view, 'start'));
    expect(value.onStart).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('gates saved-campaign actions using their existing availability props (%s)', (available) => {
    const value = props({ hasSave: available, hasManualSaves: available });
    const view = CampaignSetupView(value);
    const html = renderToStaticMarkup(view);
    expect(html.includes('저장 캠페인 계속')).toBe(available);
    expect(html.includes('체크포인트 관리')).toBe(available);
    if (available) {
      const controls = elements(view);
      click(controls.find((item) => item.props.onClick === value.onContinue)!);
      click(controls.find((item) => item.props.onClick === value.onManageSaves)!);
      expect(value.onContinue).toHaveBeenCalledTimes(1);
      expect(value.onManageSaves).toHaveBeenCalledTimes(1);
      expect(value.onStart).not.toHaveBeenCalled();
    }
  });

  it.each(nations.map((nation) => [nation.id] as const))('limits selectable offices to the selected nation and branch: %s', (nationId) => {
    for (const branch of ['military', 'politics', 'intelligence'] as const) {
      const ownRoles = careerRoles.filter((item) => item.nationId === nationId && item.branch === branch);
      const html = renderToStaticMarkup(<CampaignSetupView {...props({ nationId, roleId: ownRoles[0].id, branch, step: 2 })} />);
      expect(html.match(/성 보직, /g)).toHaveLength(ownRoles.length);
      for (const item of ownRoles) expect(html).toContain('aria-label="' + item.title + ', ');
      expect(html).toContain('id="campaign-branch-panel" role="tabpanel" aria-labelledby="campaign-branch-' + branch + '"');
      expect(html).not.toContain('campaign-onboarding__doctrines');
    }
  });

  it('does not silently choose a new office when browsing branches and requires a selection in that branch before next', () => {
    const value = props({ step: 2 });
    const view = CampaignSetupView(value);
    const politics = elements(view).find((item) => item.props.id === 'campaign-branch-politics')!;
    click(politics);
    expect(value.onBranchChange).toHaveBeenCalledWith('politics');
    expect(value.onRoleChange).not.toHaveBeenCalled();
    const otherBranch = CampaignSetupView({ ...value, branch: 'politics' });
    expect(action(otherBranch, 'next').props.disabled).toBe(true);
    click(action(otherBranch, 'next'));
    expect(value.onStepChange).not.toHaveBeenCalled();
    expect(renderToStaticMarkup(otherBranch)).toContain('이 분야의 자리를 선택하십시오');
  });

  it('keeps every draft selector wired to its existing callback without implicitly starting', () => {
    const value = props();
    const initial = CampaignSetupView(value);
    const koreaLabel = nations.find((item) => item.id === 'korea')!.shortName;
    const korea = elements(initial).find((item) => item.type === 'button' && String(item.props['aria-label']).startsWith(koreaLabel + ','))!;
    click(korea);
    expect(value.onNationChange).toHaveBeenCalledWith('korea');
    const offices = CampaignSetupView({ ...value, step: 2 });
    const office = elements(offices).find((item) => item.type === 'button' && String(item.props['aria-label']).startsWith(role.title + ','))!;
    click(office);
    expect(value.onRoleChange).toHaveBeenCalledWith(role.id);
    click(elements(offices).find((item) => item.props.id === 'campaign-mode-civilian')!);
    expect(value.onStartModeChange).toHaveBeenCalledWith('civilian');
    const civilian = CampaignSetupView({ ...value, step: 2, startMode: 'civilian' });
    const profession = elements(civilian).find((item) => item.type === 'button' && renderToStaticMarkup(item).includes('과학자·연구자'))!;
    click(profession);
    expect(value.onCivilianProfessionChange).toHaveBeenCalledWith('scientist');
    const origin = elements(civilian).find((item) => item.props.id === 'campaign-origin')!;
    (origin.props.onChange as (event: unknown) => void)({ target: { value: civilianOrigins[1].id } });
    expect(value.onCivilianOriginChange).toHaveBeenCalledWith(civilianOrigins[1].id);
    const final = CampaignSetupView({ ...value, step: 3 });
    const principle = elements(final).find((item) => item.type === 'button' && renderToStaticMarkup(item).includes('산업과 준비'))!;
    click(principle);
    expect(value.onDoctrineChange).toHaveBeenCalledWith('methodical');
    expect(value.onStart).not.toHaveBeenCalled();
  });

  it('rejects missing or foreign-nation role IDs instead of starting with an unconfirmed fallback role', () => {
    const foreign = careerRoles.find((item) => item.nationId === 'usa')!;
    for (const roleId of ['missing-role', foreign.id]) {
      const value = props({ roleId, step: 3 });
      const view = CampaignSetupView(value);
      expect(action(view, 'start').props.disabled).toBe(true);
      click(action(view, 'start'));
      expect(value.onStart).not.toHaveBeenCalled();
      expect(renderToStaticMarkup(view)).toContain('role="alert"');
    }
  });

  it('preserves all civilian professions, origin options and selected activity/risk before final civilian start', () => {
    const profession = civilianProfessions.find((item) => item.id === 'scientist')!;
    const origin = civilianOrigins[1];
    const value = props({ step: 2, startMode: 'civilian', civilianProfessionId: profession.id, civilianOriginId: origin.id });
    const html = renderToStaticMarkup(<CampaignSetupView {...value} />);
    for (const item of civilianProfessions) expect(html).toContain(item.name);
    for (const item of civilianOrigins) expect(html).toContain('value="' + item.id + '"');
    expect(html).toContain(profession.vocation);
    expect(html).toContain(profession.risk);
    expect(html).toContain(origin.advantage);
    expect(html).toContain('for="campaign-origin"');
    expect(html).not.toContain('aria-label="보직 분야"');
    const final = CampaignSetupView({ ...value, step: 3 });
    const finalHtml = renderToStaticMarkup(final);
    expect(finalHtml).toContain('연대와 설득');
    expect(finalHtml).toContain('전문성과 준비');
    expect(finalHtml).toContain('행동과 돌파');
    expect(finalHtml).not.toContain('군수 공장 +3');
    click(action(final, 'start'));
    expect(value.onStart).toHaveBeenCalledTimes(1);
  });

  it('preserves the Korean headquarters, homeland and branch-specific authority briefing', () => {
    for (const branch of ['military', 'politics', 'intelligence'] as const) {
      const koreaRole = careerRoles.find((item) => item.nationId === 'korea' && item.branch === branch)!;
      const html = renderToStaticMarkup(<CampaignSetupView {...props({ nationId: 'korea', roleId: koreaRole.id, branch, step: 2 })} />);
      expect(html).toContain('충칭에서 시작해 조선으로 돌아갑니다');
      expect(html).toContain('대한민국 임시정부');
      expect(html).toContain('일제강점기 조선');
      expect(html).toContain('한국광복군');
      expect(html).toContain('권한 밖의 업무');
      expect(html).toContain(koreaRole.expectation);
    }
  });

  it('supports roving keyboard branch tabs without triggering office or campaign actions', () => {
    const value = props({ step: 2 });
    const view = CampaignSetupView(value);
    const tab = elements(view).find((item) => item.props.id === 'campaign-branch-military')!;
    const focus = [vi.fn(), vi.fn(), vi.fn()];
    const preventDefault = vi.fn();
    (tab.props.onKeyDown as (event: unknown) => void)({ key: 'ArrowRight', preventDefault,
      currentTarget: { closest: () => ({ querySelectorAll: () => focus.map((callback) => ({ focus: callback })) }) } });
    expect(value.onBranchChange).toHaveBeenCalledWith('intelligence' satisfies CareerBranch);
    expect(focus[2]).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(value.onRoleChange).not.toHaveBeenCalled();
    expect(value.onStart).not.toHaveBeenCalled();
  });

  it('wraps keyboard focus inside the modal instead of reaching the underlying campaign', () => {
    const view = CampaignSetupView(props());
    const dialog = elements(view).find((item) => item.props.role === 'dialog')!;
    const first = { focus: vi.fn() };
    const last = { focus: vi.fn() };
    const preventDefault = vi.fn();
    const keyDown = dialog.props.onKeyDown as (event: unknown) => void;
    keyDown({ key: 'Tab', shiftKey: false, preventDefault, currentTarget: { querySelectorAll: () => [first, last], ownerDocument: { activeElement: last } } });
    expect(first.focus).toHaveBeenCalledTimes(1);
    keyDown({ key: 'Tab', shiftKey: true, preventDefault, currentTarget: { querySelectorAll: () => [first, last], ownerDocument: { activeElement: first } } });
    expect(last.focus).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });
});
