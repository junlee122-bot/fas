import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { nations } from './campaign';
import { createJointForcesState, forecastJointOperation, jointOperationTemplates, launchJointOperation, type JointForcesState, type JointOperationRecord } from './jointOperations';
import { createJointCommandGuard, getJointBoardPlan, getJointForceSelectionReason, initialJointBoardSelection, JointOperationsBoard, JointOperationsBoardView, resolveJointSelection, type JointBoardSelection, type JointOperationsBoardProps } from './JointOperationsBoard';
import type { GameState, Stockpile } from './types';

const game: GameState = { week: 3, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108, factories: 34, stability: 72, warSupport: 78, commandPoints: 48, treasury: 860, victoryScore: 66, airPower: 61, navalPower: 56, intelNetwork: 64, enemyPressure: 42 };
const stockpile: Stockpile = { infantryEquipment: 5000, tanks: 400, aircraft: 900, convoys: 50, artillery: 300, trucks: 500 };
const context = { week: game.week, theater: 'europe' as const, game };
function input(overrides: Partial<JointOperationsBoardProps> = {}): JointOperationsBoardProps {
  return { view: 'joint', state: createJointForcesState('britain'), theater: 'europe', game, stockpile, onLaunch: vi.fn(), onDoctrineChange: vi.fn(), onRefit: vi.fn(), onCommandResponse: vi.fn(), ...overrides };
}
function selection(overrides: Partial<JointBoardSelection> = {}): JointBoardSelection { return { ...initialJointBoardSelection, ...overrides }; }
function present(props: JointOperationsBoardProps, selected: Partial<JointBoardSelection> = {}, onSelectionChange = vi.fn()) {
  return JointOperationsBoardView({ ...props, selection: selection(selected), onSelectionChange });
}
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    if (typeof child.type === 'function') result.push(...elements((child.type as (props: Record<string, unknown>) => ReactNode)(child.props)));
    else result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}
function button(tree: ReactNode, text: string) {
  return elements(tree).find((item) => item.type === 'button' && renderToStaticMarkup(item).includes(text))!;
}
function invokeButton(tree: ReactNode, text: string) { const control = button(tree, text); (control.props.onClick as () => void)(); return control; }
function assertReadOnly(props: JointOperationsBoardProps) {
  expect(props.onLaunch).not.toHaveBeenCalled(); expect(props.onDoctrineChange).not.toHaveBeenCalled();
  expect(props.onRefit).not.toHaveBeenCalled(); expect(props.onCommandResponse).not.toHaveBeenCalled();
}
function airborneState() { const state = createJointForcesState('britain'); return launchJointOperation(state, 'fighter-sweep', [], [state.airGroups[0].id], context)!.state; }
function record(id: string, endedWeek: number): JointOperationRecord {
  return { id, templateId: 'fighter-sweep', name: '기록 ' + id, theater: 'europe', startedWeek: 1, endedWeek, outcome: 'success', losses: id + ' 실제 손실', result: id + ' 확정 결과', worldEffect: id + ' 실제 세계 변화', objectiveId: 'channel-air-zone', objectiveName: '영불해협 제공권', campaignChanges: [id + ' 실제 구역 변화'] };
}

describe('Command Edition joint workspace rendering', () => {
  it('lands on current theater information without mounting the planner, full roster or reports', () => {
    const props = input({ state: airborneState() });
    const before = structuredClone(props.state);
    const html = renderToStaticMarkup(<JointOperationsBoard {...props} />);
    expect(html).toContain('data-joint-workspace="overview"');
    expect(html).toContain('현재 전력 지표');
    expect(html).not.toContain('jcb-forecast-title');
    expect(html).not.toContain('data-operation-id=');
    expect(html).not.toContain('확정 작전 보고서');
    expect(props.state).toEqual(before); assertReadOnly(props);
  });

  it.each(['overview', 'planning', 'operations'] as const)('mounts only the requested %s workspace and stays pure', (workspace) => {
    const props = input(); const onSelectionChange = vi.fn();
    const html = renderToStaticMarkup(present(props, { workspace }, onSelectionChange));
    expect(html.includes('현재 전력 지표')).toBe(workspace === 'overview');
    expect(html.includes('id="jcb-template"')).toBe(workspace === 'planning');
    expect(html.includes('확정 작전 보고서')).toBe(workspace === 'operations');
    expect(onSelectionChange).not.toHaveBeenCalled(); assertReadOnly(props);
  });

  it('switches workspace through local selection only', () => {
    const props = input(); const onSelectionChange = vi.fn();
    const tree = present(props, {}, onSelectionChange);
    invokeButton(tree, '진행·보고서');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ workspace: 'operations' });
    assertReadOnly(props);
  });

  it.each(['naval', 'air'] as const)('renders one %s detail and a labeled native mobile selector', (view) => {
    const props = input({ view });
    const forces = view === 'naval' ? props.state.fleets : props.state.airGroups;
    const selected = forces.at(-1)!;
    const onSelectionChange = vi.fn();
    const tree = present(props, view === 'naval' ? { fleetId: selected.id } : { airGroupId: selected.id }, onSelectionChange);
    const html = renderToStaticMarkup(tree);
    expect(html.match(/data-force-id=/g)).toHaveLength(1);
    expect(html).toContain('data-force-id="' + selected.id + '"');
    expect(html).toContain('id="jcb-force-select"');
    expect(html).toContain('for="jcb-force-select"');
    expect(html).toContain('id="jcb-force-title" tabindex="-1"');
    expect(html).toContain(selected.historicalBasis);
    expect(html).not.toContain(forces[0].historicalBasis);
    const select = elements(tree).find((item) => item.type === 'select' && item.props.id === 'jcb-force-select')!;
    (select.props.onChange as (event: unknown) => void)({ currentTarget: { value: forces[0].id } });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith(view === 'naval' ? { fleetId: forces[0].id } : { airGroupId: forces[0].id });
    assertReadOnly(props);
  });

  it('supports every nation force roster without inventing missing units or invoking game actions', () => {
    for (const nation of nations) for (const view of ['naval', 'air'] as const) {
      const props = input({ view, state: createJointForcesState(nation.id) });
      const html = renderToStaticMarkup(<JointOperationsBoard {...props} />);
      expect(html).toContain('data-joint-view="' + view + '"');
      expect(html.match(/data-force-id=/g)?.length ?? 0).toBeLessThanOrEqual(1);
      assertReadOnly(props);
    }
  });

  it.each(['naval', 'air'] as const)('handles an empty %s roster and stale selection with no automatic action', (view) => {
    const state = createJointForcesState('britain'); state.fleets = []; state.airGroups = [];
    const props = input({ view, state });
    const html = renderToStaticMarkup(present(props, { fleetId: 'deleted', airGroupId: 'deleted' }));
    expect(html).toContain('선택할 전력이 없습니다');
    expect(html).not.toContain('data-force-id'); expect(html).not.toContain('정비 전환');
    assertReadOnly(props);
    expect(resolveJointSelection([], 'deleted')).toBeNull();
  });

  it('resolves a vanished detail ID to a current own unit for reading only', () => {
    const props = input({ view: 'naval' });
    const html = renderToStaticMarkup(present(props, { fleetId: 'foreign-or-deleted-unit' }));
    expect(html).toContain('data-force-id="' + props.state.fleets[0].id + '"');
    expect(html).not.toContain('foreign-or-deleted-unit'); assertReadOnly(props);
  });
});

describe('force detail and explicit maintenance authority', () => {
  it('shows current own aircraft and distinct readiness/serviceability from the actual fields', () => {
    const state = createJointForcesState('britain');
    Object.assign(state.airGroups[0], { aircraft: 123, serviceability: 47, readiness: 68 });
    const html = renderToStaticMarkup(present(input({ view: 'air', state })));
    expect(html).toContain('123대'); expect(html).toContain('47%');
    expect(html).toContain('aria-label="부대 준비도" aria-valuemin="0" aria-valuemax="100" aria-valuenow="68"');
    expect(html).toContain('aria-label="항공기 가동률"');
  });

  it('does not claim maintenance replaces zero remaining ships or aircraft', () => {
    for (const view of ['naval', 'air'] as const) {
      const state = createJointForcesState('britain');
      state.fleets[0].ships = 0; state.airGroups[0].aircraft = 0;
      const html = renderToStaticMarkup(present(input({ view, state })));
      expect(html).toContain('현존 전력이 없어 출격할 수 없습니다');
      expect(html).toContain('정비는 손실된 함정·기체를 보충하지 않습니다');
      expect(html).not.toContain('출격 가능');
    }
  });

  it('sends maintenance only for the selected live force and retains the stop-maintenance toggle', () => {
    const props = input({ view: 'naval' }); const unit = props.state.fleets[1];
    invokeButton(present(props, { fleetId: unit.id }), '정비 전환');
    expect(props.onRefit).toHaveBeenCalledExactlyOnceWith(unit.id);
    unit.status = 'refit';
    expect(button(present(props, { fleetId: unit.id }), '정비 중단').props.disabled).toBe(false);
  });

  it.each(['assigned', 'authority'] as const)('blocks maintenance under %s even if a disabled handler is invoked directly', (restriction) => {
    const props = input({ view: 'air', planningDisabledReason: restriction === 'authority' ? '상급 관할' : undefined });
    if (restriction === 'assigned') props.state.airGroups[0].status = 'assigned';
    const control = invokeButton(present(props), '정비 전환');
    expect(control.props.disabled).toBe(true); expect(props.onRefit).not.toHaveBeenCalled();
  });

  it('matches current mission by assignment ID and membership, not another unit or prior result', () => {
    const state = airborneState(); state.operations[0].progress = 31; state.operations[0].elapsedWeeks = 2;
    const props = input({ view: 'air', state });
    let html = renderToStaticMarkup(present(props));
    expect(html).toContain(state.operations[0].name); expect(html).toContain('진척 31%');
    expect(html).toContain('진행 중입니다. 최종 손실과 전과');
    state.airGroups[0].assignmentId = 'missing-operation';
    html = renderToStaticMarkup(present(props));
    expect(html).toContain('배속 기록 확인 필요');
    state.airGroups[0].assignmentId = state.operations[0].id; state.operations[0].airGroupIds = [];
    expect(renderToStaticMarkup(present(props))).toContain('배속 기록 확인 필요');
    assertReadOnly(props);
  });
});

describe('read-only planning and original-engine command contract', () => {
  function valid() { const props = input(); const selected = selection({ workspace: 'planning', templateId: 'atlantic-lifeline', fleetIds: [props.state.fleets[1].id], airGroupIds: [props.state.airGroups[1].id] }); return { props, selected }; }

  it('uses the existing exact forecast and deduplicates only real selected IDs', () => {
    const { props, selected } = valid(); selected.fleetIds.push(selected.fleetIds[0]);
    const before = structuredClone(props.state);
    const plan = getJointBoardPlan(props, selected);
    expect(plan.canLaunch).toBe(true);
    expect(plan.fleetIds).toEqual([props.state.fleets[1].id]);
    expect(plan.forecast).toEqual(forecastJointOperation(props.state, 'atlantic-lifeline', plan.fleetIds, plan.airGroupIds, context, plan.objective?.id));
    expect(props.state).toEqual(before); assertReadOnly(props);
  });

  it('passes the exact current template, units and objective only on explicit approval', () => {
    const { props, selected } = valid(); const plan = getJointBoardPlan(props, selected);
    const tree = present(props, selected); renderToStaticMarkup(tree); assertReadOnly(props);
    const approve = invokeButton(tree, '작전명령 승인');
    expect(approve.props.disabled).toBe(false);
    expect(props.onLaunch).toHaveBeenCalledExactlyOnceWith(plan.template!.id, plan.fleetIds, plan.airGroupIds, plan.objective!.id);
  });

  it.each(['fleet', 'air', 'target', 'template'] as const)('blocks a stale %s selection without silently issuing a fallback command', (missing) => {
    const { props, selected } = valid();
    if (missing === 'fleet') selected.fleetIds.push('deleted');
    if (missing === 'air') selected.airGroupIds.push('deleted');
    if (missing === 'target') selected.objectiveId = 'deleted';
    if (missing === 'template') selected.templateId = 'pacific-invalid';
    expect(getJointBoardPlan(props, selected).warning).toContain('변경되었습니다');
    const approve = invokeButton(present(props, selected), '작전명령 승인');
    expect(approve.props.disabled).toBe(true); assertReadOnly(props);
  });

  it.each(['command', 'fuel', 'convoys', 'authority'] as const)('keeps %s restrictions on approval and direct handler calls', (resource) => {
    const { props, selected } = valid();
    props.game = { ...game }; props.stockpile = { ...stockpile };
    if (resource === 'command') props.game.commandPoints = 0;
    if (resource === 'fuel') props.game.fuel = 0;
    if (resource === 'convoys') props.stockpile.convoys = 0;
    if (resource === 'authority') props.planningDisabledReason = '현재 보직은 상급 전구에 상신해야 합니다.';
    expect(getJointBoardPlan(props, selected).canLaunch).toBe(false);
    expect(invokeButton(present(props, selected), '작전명령 승인').props.disabled).toBe(true);
    assertReadOnly(props);
  });

  it.each(['assigned', 'refit', 'zero', 'incompatible'] as const)('rejects %s units before launch but allows deselecting a stale unavailable pick', (restriction) => {
    const { props, selected } = valid(); const unit = props.state.fleets[1];
    if (restriction === 'assigned' || restriction === 'refit') unit.status = restriction;
    if (restriction === 'zero') unit.ships = 0;
    if (restriction === 'incompatible') unit.kind = 'submarine';
    expect(getJointForceSelectionReason(unit, jointOperationTemplates.find((item) => item.id === 'atlantic-lifeline')!)).toBeTruthy();
    expect(getJointBoardPlan(props, selected).canLaunch).toBe(false);
    const onSelectionChange = vi.fn(); const tree = present(props, selected, onSelectionChange);
    const checked = elements(tree).find((item) => item.type === 'input' && item.props.checked === true)!;
    expect(checked.props.disabled).toBe(false);
    (checked.props.onChange as () => void)();
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ fleetIds: [] });
    assertReadOnly(props);
  });

  it('treats template and doctrine selection as reading; doctrine changes only by its apply button', () => {
    const props = input(); const onSelectionChange = vi.fn();
    const tree = present(props, { workspace: 'planning' }, onSelectionChange);
    const doctrineSelect = elements(tree).find((item) => item.type === 'select' && item.props.id === 'jcb-doctrine')!;
    (doctrineSelect.props.onChange as (event: unknown) => void)({ currentTarget: { value: 'interdiction' } });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ doctrineId: 'interdiction' }); assertReadOnly(props);
    const before = getJointBoardPlan(props, selection({ templateId: 'fighter-sweep', airGroupIds: [props.state.airGroups[0].id] }));
    const draft = getJointBoardPlan(props, selection({ doctrineId: 'interdiction', templateId: 'fighter-sweep', airGroupIds: [props.state.airGroups[0].id] }));
    expect(draft.forecast).toEqual(before.forecast);
    invokeButton(present(props, { workspace: 'planning', doctrineId: 'interdiction' }), '교리 적용');
    expect(props.onDoctrineChange).toHaveBeenCalledExactlyOnceWith('interdiction');
  });

  it('blocks doctrine application in readonly scope even while doctrine alternatives remain inspectable', () => {
    const props = input({ planningDisabledReason: '열람 전용' });
    const tree = present(props, { workspace: 'planning', doctrineId: 'interdiction' });
    expect(invokeButton(tree, '교리 적용').props.disabled).toBe(true); assertReadOnly(props);
  });

  it('shows the existing doctrine cost and blocks application below four command points', () => {
    const props = input({ game: { ...game, commandPoints: 3 } });
    const tree = present(props, { workspace: 'planning', doctrineId: 'interdiction' });
    expect(renderToStaticMarkup(tree)).toContain('교리 적용 · 4 CP');
    expect(invokeButton(tree, '교리 적용').props.disabled).toBe(true); assertReadOnly(props);
  });

  it('can explicitly clear stale selections even when a fallback select already displays the only valid choice', () => {
    const { props, selected } = valid(); selected.objectiveId = 'deleted-objective';
    const onSelectionChange = vi.fn();
    const tree = present(props, selected, onSelectionChange);
    invokeButton(tree, '현재 전력으로 계획 다시 검토');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ workspace: 'planning', templateId: 'atlantic-lifeline', objectiveId: null, fleetIds: [], airGroupIds: [] });
    assertReadOnly(props);
  });

  it('guards duplicate command delivery against the same state snapshot, but permits a later actual state', () => {
    const props = input(); const guard = createJointCommandGuard(); const action = vi.fn();
    expect(guard(props.state, 3, 'launch', action)).toBe(true);
    expect(guard(props.state, 3, 'launch', action)).toBe(false);
    expect(action).toHaveBeenCalledTimes(1);
    expect(guard({ ...props.state }, 3, 'launch', action)).toBe(true);
    expect(action).toHaveBeenCalledTimes(2);
  });
});

describe('confirmed reports and intelligence boundaries', () => {
  it('renders no secret identities, force details, progress or even hidden-operation count changes', () => {
    const props = input(); const original = renderToStaticMarkup(present(props));
    const enemyOperation = { ...airborneState().operations[0], id: 'secret-enemy-operation', name: 'SECRET_OPERATION_NAME', target: 'SECRET_TARGET', detected: false, intelligenceConfidence: 99, detectedWeek: null };
    props.state.opponent.operations = [enemyOperation, { ...enemyOperation, id: 'second-secret' }];
    props.state.opponent.fleets[0].name = 'SECRET_ENEMY_FLEET';
    props.state.opponent.airGroups[0].principalAircraft = 'SECRET_AIRCRAFT';
    const html = renderToStaticMarkup(present(props));
    expect(html).toBe(original); expect(html).not.toContain('SECRET');
  });

  it('shows only detected estimates and does not reveal exact progress through a meter', () => {
    const props = input();
    props.state.opponent.operations = [{ ...airborneState().operations[0], name: 'UNCONFIRMED_SECRET_NAME', target: '관측 표적', progress: 53, detected: true, intelligenceConfidence: 40, detectedWeek: 2 }];
    const tree = present(props); const intel = elements(tree).find((item) => item.props.className === 'jcb-intel-report')!;
    const html = renderToStaticMarkup(intel);
    expect(html).toContain('진척 추정 39~67%'); expect(html).toContain('관측 표적');
    expect(html).not.toContain('UNCONFIRMED_SECRET_NAME'); expect(html).not.toContain('role="meter"');
    expect(html).not.toContain('aria-valuenow'); expect(html).not.toContain('53%');
  });

  it('offers a detected counter-plan as a local planning selection, never as an automatic launch', () => {
    const props = input(); props.state.opponent.operations = [{ ...airborneState().operations[0], target: '관측 표적', detected: true, intelligenceConfidence: 80, detectedWeek: 2 }];
    const onSelectionChange = vi.fn(); const tree = present(props, {}, onSelectionChange);
    invokeButton(tree, '대응 계획 검토');
    expect(onSelectionChange).toHaveBeenCalledWith(expect.objectContaining({ workspace: 'planning', fleetIds: [], airGroupIds: [] }));
    assertReadOnly(props);
  });

  it('renders only the chosen confirmed record, including its real losses and campaign changes', () => {
    const props = input(); props.state.records = [record('older', 3), record('newest', 6)];
    let html = renderToStaticMarkup(present(props, { workspace: 'operations' }));
    expect(html.match(/data-record-id=/g)).toHaveLength(1);
    expect(html).toContain('newest 확정 결과'); expect(html).not.toContain('older 확정 결과');
    html = renderToStaticMarkup(present(props, { workspace: 'operations', recordId: 'older' }));
    expect(html).toContain('older 실제 손실'); expect(html).toContain('older 실제 구역 변화');
    expect(html).not.toContain('newest 확정 결과'); assertReadOnly(props);
  });

  it('distinguishes active missions and stored outlooks from completed results', () => {
    const props = input({ state: airborneState() });
    props.state.operations[0].progress = 47; props.state.airGroups[0].aircraft = 11;
    const html = renderToStaticMarkup(present(props, { workspace: 'operations' }));
    expect(html.match(/data-operation-id=/g)).toHaveLength(1);
    expect(html).toContain('현존 11대'); expect(html).toContain('이후 실제 손실·교전은 주간 판정에 추가 반영');
    expect(html).toContain('아직 확정된 합동작전 보고서가 없습니다'); assertReadOnly(props);
  });

  it.each(['authority', 'command'] as const)('checks %s for commander responses even if called directly', (restriction) => {
    const props = input({ state: airborneState(), planningDisabledReason: restriction === 'authority' ? '상급 관할' : undefined, game: restriction === 'command' ? { ...game, commandPoints: 0 } : game });
    const tree = present(props, { workspace: 'operations' });
    for (const label of ['재량권 보장', '계획 보강']) expect(invokeButton(tree, label).props.disabled).toBe(true);
    expect(props.onCommandResponse).not.toHaveBeenCalled();
    const overrule = invokeButton(tree, '원안 강행');
    expect(overrule.props.disabled).toBe(restriction === 'authority');
    if (restriction === 'authority') assertReadOnly(props);
    else expect(props.onCommandResponse).toHaveBeenCalledExactlyOnceWith(props.state.commandMessages[0].id, 'overrule');
  });
});
