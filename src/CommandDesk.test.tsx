import { Children, isValidElement, type ComponentProps, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { CommandDesk } from './CommandDesk';
import { careerRoles } from './campaign';
import { getRoleTabMandates } from './roleMandate';
import {
  advanceRoleCommandWeek, createRoleCommandState, getRoleCommandChainProfile, getRoleOperationalScope,
  recordRoleActionEvidence, recordRoleInteraction,
} from './roleCommand';
import type { CareerBranch, CareerTier, GameTab } from './types';
import type { UXAction } from './ux';

type DeskProps = ComponentProps<typeof CommandDesk>;
const roleFor = (branch: CareerBranch, tier: CareerTier = 3) => careerRoles.find((role) => role.nationId === 'britain' && role.branch === branch && role.tier === tier)!;
const action = (id: string, tab: GameTab, priority: UXAction['priority'] = 'recommended'): UXAction => ({
  id, tab, priority, title: '안건 ' + id, detail: '근거 ' + id, label: '열기 ' + id, resolution: '결산 ' + id,
});
function props(overrides: Partial<DeskProps> = {}): DeskProps {
  const role = overrides.role ?? roleFor('military');
  const mandates = getRoleTabMandates(role);
  return {
    role, mandates, tabs: (Object.keys(mandates) as GameTab[]).map((id) => ({ id, label: '화면 ' + id })),
    actions: [action('urgent-army', 'army', 'urgent'), action('staff-next', 'organization')],
    commandState: createRoleCommandState(role, 4), commandChain: getRoleCommandChainProfile(role),
    operationalScope: getRoleOperationalScope(role, ['division-a', 'division-b', 'division-c']),
    worldlineTitle: '시험 세계선', expanded: false, nationName: '영국', dateLabel: '1942년 시험 주차', nextLabel: '다음 주 결산',
    recentEvents: [{ id: 'event-1', title: '확정 기록 첫째', week: 3, tone: 'neutral' }],
    activities: [{ id: 'operations', label: '진행 중 작전', value: 2, detail: '승인된 지상 명령', tab: 'army' }],
    onNavigate: vi.fn(), onAction: vi.fn(), onNextWeek: vi.fn(), onToggleExpanded: vi.fn(), onActivity: vi.fn(), onOpenBriefing: vi.fn(),
    ...overrides,
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
const byClass = (node: ReactNode, className: string) => elements(node).find((item) => String(item.props.className).split(' ').includes(className))!;
const buttons = (node: ReactNode) => elements(node).filter((item) => item.type === 'button');
const click = (node: ReactElement<Record<string, unknown>>) => (node.props.onClick as () => void)();
const callbacks = (value: DeskProps) => [value.onNavigate, value.onAction, value.onNextWeek, value.onToggleExpanded, value.onActivity, value.onOpenBriefing];

describe('command desk authority and priority presentation', () => {
  it.each(['military', 'politics', 'intelligence'] as const)('shows only direct, branch-relevant decisions for %s', (branch) => {
    const role = roleFor(branch);
    const value = props({ role, activities: [], actions: [action('war', 'army'), action('policy', 'governance'), action('covert', 'intelligence'), action('research-request', 'research'), action('foreign-report', 'economy')] });
    const view = CommandDesk(value);
    const html = renderToStaticMarkup(view);
    const expected = branch === 'military' ? 'war' : branch === 'politics' ? 'policy' : 'covert';
    expect(html).toContain('안건 ' + expected);
    for (const id of ['war', 'policy', 'covert', 'research-request', 'foreign-report'].filter((id) => id !== expected)) expect(html).not.toContain('안건 ' + id);
    const shortcutButtons = elements(view).find((item) => item.props['aria-label'] === '내 담당 업무 바로가기')!;
    click(buttons(shortcutButtons)[0]);
    const destination = vi.mocked(value.onNavigate).mock.calls[0][0];
    expect(value.mandates[destination].mode).toBe('direct');
    expect(value.onAction).not.toHaveBeenCalled();
  });

  it.each(['request', 'report', 'locked'] as const)('never offers a %s mandate as a direct decision', (mode) => {
    const value = props({ actions: [action('unavailable', 'army')] });
    value.mandates = { ...value.mandates, army: { ...value.mandates.army, mode } };
    const html = renderToStaticMarkup(<CommandDesk {...value} />);
    expect(html).not.toContain('안건 unavailable');
    expect(html).toContain('다음 장을 준비할 시간입니다.');
    callbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
  });

  it('preserves the upstream priority order after filtering and shows the actual resolution point', () => {
    const actionable = action('urgent-own', 'army', 'urgent');
    const value = props({ actions: [action('urgent-outside', 'health', 'urgent'), actionable, action('later', 'organization', 'recommended')] });
    const view = CommandDesk(value);
    const decision = byClass(view, 'command-desk-decision');
    const html = renderToStaticMarkup(decision);
    expect(html).toContain('command-desk-decision urgent');
    expect(html).toContain('우선 검토');
    expect(html).toContain(actionable.title);
    expect(html).toContain(actionable.detail);
    expect(html).toContain(actionable.resolution);
    expect(html).not.toContain('urgent-outside');
    expect(html).not.toContain('안건 later');
    click(byClass(view, 'command-desk-primary'));
    expect(value.onAction).toHaveBeenCalledExactlyOnceWith(actionable);
    expect(value.onAction).toHaveBeenCalledWith(expect.objectContaining({ id: actionable.id, tab: actionable.tab }));
    expect(value.onNextWeek).not.toHaveBeenCalled();
  });

  it('limits national policy and political-crisis decisions by the existing office restrictions', () => {
    const actions = [action('national-policy', 'organization'), action('political-crisis', 'organization')];
    const lowerMilitary = renderToStaticMarkup(<CommandDesk {...props({ role: roleFor('military', 4), actions })} />);
    expect(lowerMilitary).not.toContain('안건 national-policy');
    expect(lowerMilitary).not.toContain('안건 political-crisis');
    const seniorMilitary = renderToStaticMarkup(<CommandDesk {...props({ role: roleFor('military', 2), actions })} />);
    expect(seniorMilitary).not.toContain('안건 national-policy');
    expect(seniorMilitary).toContain('안건 political-crisis');
    const political = renderToStaticMarkup(<CommandDesk {...props({ role: roleFor('politics', 3), actions })} />);
    expect(political).toContain('안건 national-policy');
    const intelligence = renderToStaticMarkup(<CommandDesk {...props({ role: roleFor('intelligence', 3), actions })} />);
    expect(intelligence).not.toContain('안건 national-policy');
  });

  it('does not expose unrelated branch decisions merely because a delegation allows direct access', () => {
    const value = props({ role: roleFor('military', 2), activities: [], actions: [action('civilian-budget', 'economy'), action('military-research', 'research')] });
    value.mandates = { ...value.mandates, economy: { ...value.mandates.economy, mode: 'direct', label: '한시 위임' } };
    expect(value.mandates.economy.mode).toBe('direct');
    const html = renderToStaticMarkup(<CommandDesk {...value} />);
    expect(html).not.toContain('안건 civilian-budget');
    expect(html).toContain('안건 military-research');
  });

  it('uses the current non-national division scope in the idle-formation heading', () => {
    const value = props({ actions: [{ ...action('idle-formations', 'army'), title: '전국 준비 사단 99개' }], operationalScope: { level: 'unit', label: '직속 부대', detail: '현재 지휘 범위', divisionIds: ['own-a', 'own-b'] } });
    const html = renderToStaticMarkup(<CommandDesk {...value} />);
    expect(html).toContain('예하 2개 부대의 준비 상태 점검');
    expect(html).not.toContain('전국 준비 사단 99개');
    const national = renderToStaticMarkup(<CommandDesk {...value} operationalScope={{ ...value.operationalScope, level: 'national' }} />);
    expect(national).toContain('전국 준비 사단 99개');
  });

  it('safely falls back to next-week confirmation with no actions, events, activities or objective tasks', () => {
    const value = props({ actions: [], activities: [], recentEvents: [] });
    value.commandState = { ...value.commandState, objective: { ...value.commandState.objective, tasks: [] } };
    const view = CommandDesk(value);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('준비 완료');
    expect(html).toContain('다음 주 결산');
    expect(html).toContain('아직 기록이 없습니다.');
    expect(html).toContain('대기 중인 추가 직접 결재 안건이 없습니다.');
    expect(html).toContain('width:0%');
    expect(html).not.toMatch(/NaN|Infinity|undefined/);
    expect(value.onNextWeek).not.toHaveBeenCalled();
    click(byClass(view, 'command-desk-primary'));
    expect(value.onNextWeek).toHaveBeenCalledTimes(1);
    expect(value.onAction).not.toHaveBeenCalled();
  });

  it('bounds secondary decisions to three, role shortcuts to five, and actual recent records to three', () => {
    const value = props({ role: roleFor('politics', 1), actions: Array.from({ length: 7 }, (_, index) => action('decision-' + index, 'organization')),
      recentEvents: Array.from({ length: 6 }, (_, index) => ({ id: 'record-' + index, title: '최근 실제 기록 ' + index, week: index, tone: 'neutral' })) });
    const view = CommandDesk(value);
    const html = renderToStaticMarkup(view);
    expect(html).toContain('안건 decision-3');
    expect(html).not.toContain('안건 decision-4');
    const shortcuts = elements(view).find((item) => item.props['aria-label'] === '내 담당 업무 바로가기')!;
    expect(buttons(shortcuts)).toHaveLength(5);
    expect(renderToStaticMarkup(shortcuts)).not.toContain('화면 command');
    expect(html).toContain('최근 실제 기록 2');
    expect(html).not.toContain('최근 실제 기록 3');
    expect(html).toContain('시험 세계선');
  });
});

describe('command desk objective evidence and callback boundaries', () => {
  it('renders repeatedly without marking tasks, claiming rewards, navigating or invoking actions', () => {
    const value = props();
    const before = JSON.stringify(value);
    for (let index = 0; index < 10; index += 1) renderToStaticMarkup(<CommandDesk {...value} />);
    callbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    expect(JSON.stringify(value)).toBe(before);
    expect(value.commandState.objective.rewardClaimed).toBe(false);
  });

  it('keeps a clicked visit a navigation-only interaction, without granting action evidence or weekly reward', () => {
    const value = props();
    let state = value.commandState;
    value.onNavigate = vi.fn((tab: GameTab) => { state = recordRoleInteraction(state, 'direct', tab); });
    const view = CommandDesk(value);
    const taskList = byClass(view, 'command-desk-task-list');
    const visitButtons = buttons(taskList);
    expect(visitButtons).toHaveLength(state.objective.tasks.filter((task) => task.kind === 'visit' && task.tab).length);
    click(visitButtons[0]);
    expect(value.onNavigate).toHaveBeenCalledTimes(1);
    expect(state.objective.tasks.find((task) => task.kind === 'visit')?.done).toBe(true);
    expect(state.objective.tasks.find((task) => task.kind === 'action')?.done).toBe(false);
    expect(state.objective.actionEvidence).toEqual([]);
    expect(state.objective.completed).toBe(false);
    const html = renderToStaticMarkup(<CommandDesk {...value} commandState={state} />);
    expect(html).toContain('화면 방문만으로 보상이 지급되지는 않습니다. 실제 조치의 성공 기록이 필요합니다.');
    expect(advanceRoleCommandWeek(state, value.role, 5).careerDelta).toEqual({ reputation: 0, councilTrust: 0, experience: 0 });
    expect(value.onAction).not.toHaveBeenCalled();
    expect(value.onNextWeek).not.toHaveBeenCalled();
  });

  it('shows only supplied successful evidence and leaves actual reward settlement to the weekly engine', () => {
    const value = props();
    let state = value.commandState;
    const visit = state.objective.tasks.find((task) => task.kind === 'visit')!;
    state = recordRoleInteraction(state, 'direct', visit.tab!);
    state = recordRoleInteraction(state, 'report', 'economy');
    state = recordRoleActionEvidence(state, value.role, { id: 'actual-training', week: 4, tab: 'army', description: '예하 부대 훈련이 실제 적용됨', outcome: 'succeeded' });
    expect(state.objective.completed).toBe(true);
    const html = renderToStaticMarkup(<CommandDesk {...value} commandState={state} />);
    expect(html).toContain('성과 근거: 예하 부대 훈련이 실제 적용됨');
    expect(html).toContain('aria-label="주간 임무 진행" aria-valuenow="4" aria-valuemin="0" aria-valuemax="4"');
    expect(html).toContain('width:100%');
    expect(state.objective.rewardClaimed).toBe(false);
    callbacks(value).forEach((callback) => expect(callback).not.toHaveBeenCalled());
    expect(advanceRoleCommandWeek(state, value.role, 5).careerDelta).toEqual({ reputation: 1, councilTrust: 2, experience: 5 });
  });

  it('keeps the evidence warning and zero reward even if an inconsistent objective claims all tasks done', () => {
    const value = props();
    const state = { ...value.commandState, objective: { ...value.commandState.objective, completed: true, tasks: value.commandState.objective.tasks.map((task) => ({ ...task, done: true })) } };
    const html = renderToStaticMarkup(<CommandDesk {...value} commandState={state} />);
    expect(html).toContain('화면 방문만으로 보상이 지급되지는 않습니다.');
    expect(html).not.toContain('성과 근거:');
    expect(advanceRoleCommandWeek(state, value.role, 5).careerDelta).toEqual({ reputation: 0, councilTrust: 0, experience: 0 });
  });

  it('passes original secondary actions and source activity IDs/tabs to only their explicit callbacks', () => {
    const value = props();
    const view = CommandDesk(value);
    const inbox = byClass(view, 'command-desk-inbox');
    click(buttons(inbox)[0]);
    expect(value.onAction).toHaveBeenCalledExactlyOnceWith(value.actions[1]);
    const activity = byClass(view, 'command-desk-activities');
    click(buttons(activity)[0]);
    expect(value.onActivity).toHaveBeenCalledExactlyOnceWith('operations', 'army');
    click(byClass(view, 'command-desk-briefing'));
    expect(value.onOpenBriefing).toHaveBeenCalledTimes(1);
    expect(value.onNavigate).not.toHaveBeenCalled();
    expect(value.onNextWeek).not.toHaveBeenCalled();
    expect(value.onToggleExpanded).not.toHaveBeenCalled();
  });
});
