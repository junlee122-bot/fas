import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createCovertOperations, getNation, getRole, nations } from './campaign';
import { createCareerMarketState } from './careerMarket';
import { createClandestineCareerState } from './clandestineCareer';
import { resolveIntelligenceHistory } from './intelligenceHistory';
import { createWarEventTrace } from './journal';
import { assessIntelligenceProposal, canDirectIntelligence, createIntelligenceExecutionController, createIntelligenceProposal, getIntelligenceInstitutionView, getIntelligenceOperationCost, initialIntelligenceDeskSelection, IntelligenceDesk, IntelligenceDeskView, resolveIntelligenceSelection, type IntelligenceDeskProps, type IntelligenceDeskSelection, type IntelligenceExecutionProposal } from './IntelligenceDesk';
import type { GameState } from './types';

const game: GameState = { week: 3, manpower: 1200, politicalPower: 82, fuel: 70, steel: 108, factories: 34, stability: 72, warSupport: 78, commandPoints: 48, treasury: 860, victoryScore: 66, airPower: 61, navalPower: 56, intelNetwork: 64, enemyPressure: 42 };
function input(overrides: Partial<IntelligenceDeskProps> = {}): IntelligenceDeskProps {
  return { game: { ...game }, operations: createCovertOperations('europe', 'britain'), setGame: vi.fn(), setOperations: vi.fn(), notify: vi.fn(), addEvent: vi.fn(), nation: getNation('britain'), role: getRole('britain-intelligence-director', 'britain'), activeTheater: 'europe', intelligenceHistory: resolveIntelligenceHistory([]), careerMarket: createCareerMarketState(), onOpenClandestineDesk: vi.fn(), onActionCompleted: vi.fn(), ...overrides };
}
function selection(patch: Partial<IntelligenceDeskSelection> = {}): IntelligenceDeskSelection { return { ...initialIntelligenceDeskSelection, ...patch }; }
function present(props: IntelligenceDeskProps, patch: Partial<IntelligenceDeskSelection> = {}, proposal: IntelligenceExecutionProposal | null = null, callbacks: Partial<Pick<Parameters<typeof IntelligenceDeskView>[0], 'onSelectionChange' | 'onReview' | 'onConfirm' | 'onDiscard' | 'headingRef' | 'reviewRef'>> = {}) {
  return IntelligenceDeskView({ ...props, selection: selection(patch), proposal, onSelectionChange: vi.fn(), onReview: vi.fn(), onConfirm: vi.fn(), onDiscard: vi.fn(), ...callbacks });
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
function button(tree: ReactNode, label: string) { return elements(tree).find((item) => item.type === 'button' && renderToStaticMarkup(item).includes(label))!; }
function click(tree: ReactNode, label: string) { const item = button(tree, label); (item.props.onClick as () => void)(); return item; }
function assertNoGameAction(props: IntelligenceDeskProps) {
  expect(props.setGame).not.toHaveBeenCalled(); expect(props.setOperations).not.toHaveBeenCalled();
  expect(props.addEvent).not.toHaveBeenCalled(); expect(props.notify).not.toHaveBeenCalled(); expect(props.onActionCompleted).not.toHaveBeenCalled();
}

describe('intelligence desk workspace presentation', () => {
  it('starts with current capability and one next decision, not all operation/agency/report cards', () => {
    const props = input(); const before = structuredClone({ game: props.game, operations: props.operations });
    const html = renderToStaticMarkup(<IntelligenceDesk {...props} />);
    expect(html).toContain('data-intelligence-workspace="overview"'); expect(html).toContain('전구 신호정보');
    expect(html).not.toContain('data-operation-id='); expect(html).not.toContain('data-report-id='); expect(html).not.toContain('data-organization-id=');
    expect({ game: props.game, operations: props.operations }).toEqual(before); assertNoGameAction(props);
  });

  it.each(['overview', 'planning', 'reports', 'institutions'] as const)('conditionally mounts the %s workspace without dispatching any command', (workspace) => {
    const props = input(); const onSelectionChange = vi.fn();
    const html = renderToStaticMarkup(present(props, { workspace }, null, { onSelectionChange }));
    expect(html.includes('data-operation-id=')).toBe(workspace === 'planning');
    expect(html.includes('data-report-id=')).toBe(workspace === 'reports');
    expect(html.includes('data-organization-id=')).toBe(workspace === 'institutions');
    expect(onSelectionChange).not.toHaveBeenCalled(); assertNoGameAction(props);
  });

  it('keeps menu navigation and operation selection read-only', () => {
    const props = input(); const onSelectionChange = vi.fn();
    click(present(props, {}, null, { onSelectionChange }), '공작 계획');
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ workspace: 'planning' });
    onSelectionChange.mockClear();
    const tree = present(props, { workspace: 'planning' }, null, { onSelectionChange });
    const selector = elements(tree).find((item) => item.type === 'select' && item.props.id === 'ids-operation-select')!;
    (selector.props.onChange as (event: unknown) => void)({ currentTarget: { value: props.operations[1].id } });
    expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ operationId: props.operations[1].id }); assertNoGameAction(props);
  });

  it('renders one selected operation detail with a native mobile selector and focusable heading', () => {
    const props = input(); const selected = props.operations[1]; const headingRef = vi.fn(); const onReview = vi.fn();
    const tree = present(props, { workspace: 'planning', operationId: selected.id }, null, { headingRef, onReview });
    const html = renderToStaticMarkup(tree);
    expect(html.match(/data-operation-id=/g)).toHaveLength(1); expect(html).toContain('data-operation-id="' + selected.id + '"');
    expect(html).toContain('for="ids-operation-select"'); expect(html).toContain('id="ids-operation-select"');
    expect(html).toContain('id="ids-selected-operation" tabindex="-1"'); expect(headingRef).not.toHaveBeenCalled();
    click(tree, '이 공작의 집행안 검토'); expect(onReview).toHaveBeenCalledExactlyOnceWith(selected.id); assertNoGameAction(props);
  });

  it('explains that reference risk and saved preparation are not a success forecast or weekly progression', () => {
    const props = input(); props.operations[0].risk = 99;
    const html = renderToStaticMarkup(present(props, { workspace: 'planning' }));
    expect(html).toContain('성공확률 아님'); expect(html).toContain('성공·실패·손실 판정에 반영되지 않는 참고값');
    expect(html).toContain('자동 주간 진행이 연결되어 있지 않습니다'); expect(html).not.toContain('예상 성공 1%'); assertNoGameAction(props);
  });

  it.each(nations)('renders the actual $id operation set without fabricating another nation workflow', (nation) => {
    const props = input({ nation, role: getRole(nation.id + '-tier1', nation.id), activeTheater: nation.defaultTheater, operations: createCovertOperations(nation.defaultTheater, nation.id) });
    const html = renderToStaticMarkup(present(props, { workspace: 'planning' }));
    expect(html).toContain(props.operations[0].name); expect(html.match(/data-operation-id=/g)).toHaveLength(1); assertNoGameAction(props);
  });

  it('handles absent and completed operations without fallback execution or invented ongoing missions', () => {
    const props = input({ operations: [] });
    expect(renderToStaticMarkup(present(props, { workspace: 'planning', operationId: 'deleted' }))).toContain('검토할 미완료 공작이 없습니다');
    expect(renderToStaticMarkup(present(props, { workspace: 'reports' }))).toContain('저장된 공작 기록이 없습니다');
    expect(resolveIntelligenceSelection([], 'deleted')).toBeNull(); assertNoGameAction(props);
    props.operations = createCovertOperations('europe').map((operation) => ({ ...operation, progress: 100 }));
    expect(renderToStaticMarkup(present(props, { workspace: 'planning' }))).not.toContain('이 공작의 집행안 검토');
    expect(createIntelligenceProposal(props, props.operations[0].id)).toBeNull();
  });
});

describe('intelligence proposal validation and exact legacy effects', () => {
  it.each([
    ['britain-intelligence-director', 7], ['britain-tier1', 10], ['britain-field-command', 10],
  ] as const)('retains the original cost for %s', (roleId, cost) => {
    expect(getIntelligenceOperationCost(getRole(roleId, 'britain'))).toBe(cost);
  });

  it('creates an immutable review of the selected operation, not always the first one', () => {
    const props = input(); const before = structuredClone(props.operations);
    const proposal = createIntelligenceProposal(props, props.operations[1].id)!;
    expect(proposal.operation.id).toBe(props.operations[1].id); expect(proposal.operation).not.toBe(props.operations[1]);
    expect(assessIntelligenceProposal(proposal, props)).toMatchObject({ allowed: true, cost: 7, intelDelta: 4 });
    expect(props.operations).toEqual(before); assertNoGameAction(props);
  });

  it.each(['week', 'theater', 'nation', 'role', 'operation', 'removed', 'duplicate-id', 'political', 'network', 'cost'] as const)('blocks a stale %s proposal without costs, events or completion evidence', (changed) => {
    const props = input(); const proposal = createIntelligenceProposal(props, props.operations[1].id)!;
    if (changed === 'week') props.game.week += 1;
    if (changed === 'theater') props.activeTheater = 'asia';
    if (changed === 'nation') props.nation = getNation('usa');
    if (changed === 'role') props.role = getRole('britain-tier1', 'britain');
    if (changed === 'operation') props.operations[1].region = '변경된 표적';
    if (changed === 'removed') props.operations = props.operations.filter((operation) => operation.id !== proposal.operation.id);
    if (changed === 'duplicate-id') props.operations.push({ ...props.operations[1] });
    if (changed === 'political') props.game.politicalPower -= 1;
    if (changed === 'network') props.game.intelNetwork += 1;
    if (changed === 'cost') proposal.politicalCost = 0;
    expect(assessIntelligenceProposal(proposal, props).allowed).toBe(false);
    expect(createIntelligenceExecutionController()(proposal, props).accepted).toBe(false); assertNoGameAction(props);
  });

  it.each(['busy', 'authority', 'insufficient', 'completed', 'invalid-progress', 'invalid-week', 'invalid-network'] as const)('rejects %s without invoking any existing setter or callback', (blocked) => {
    const props = input();
    if (blocked === 'busy') props.busy = true;
    if (blocked === 'authority') props.authorized = false;
    if (blocked === 'insufficient') props.game.politicalPower = 6;
    if (blocked === 'invalid-progress') props.operations[0].progress = NaN;
    if (blocked === 'invalid-week') props.game.week = NaN;
    if (blocked === 'invalid-network') props.game.intelNetwork = Infinity;
    const proposal = createIntelligenceProposal(props, props.operations[0].id);
    if (blocked === 'completed') props.operations[0].progress = 100;
    expect(createIntelligenceExecutionController()(proposal, props).accepted).toBe(false); assertNoGameAction(props);
  });

  it('respects role-derived authority, explicit current delegation and foreign-role mismatch', () => {
    const props = input({ role: getRole('britain-field-command', 'britain') });
    const proposal = createIntelligenceProposal(props, props.operations[0].id)!;
    expect(canDirectIntelligence(props)).toBe(false); expect(assessIntelligenceProposal(proposal, props).allowed).toBe(false);
    props.authorized = true; expect(assessIntelligenceProposal(proposal, props).allowed).toBe(true);
    props.role = { ...props.role, nationId: 'usa' }; expect(assessIntelligenceProposal(proposal, props).allowed).toBe(false);
  });

  it.each([64, 98, 100])('caps the existing information gain from %s without inventing other outcomes', (network) => {
    const props = input({ game: { ...game, intelNetwork: network } });
    const proposal = createIntelligenceProposal(props, props.operations[0].id)!;
    expect(assessIntelligenceProposal(proposal, props).intelDelta).toBe(Math.min(100, network + 4) - network);
  });

  it('charges once, completes only the chosen operation, and emits exactly one event and one evidence item', () => {
    const props = input(); const chosen = props.operations[1]; const before = structuredClone({ game: props.game, operations: props.operations });
    const proposal = createIntelligenceProposal(props, chosen.id)!; const execute = createIntelligenceExecutionController();
    expect(execute(proposal, props).accepted).toBe(true); expect(execute(proposal, props).accepted).toBe(false);
    expect(props.setGame).toHaveBeenCalledTimes(1); expect(props.setOperations).toHaveBeenCalledTimes(1);
    const gameUpdate = vi.mocked(props.setGame).mock.calls[0][0] as (current: GameState) => GameState;
    const operationsUpdate = vi.mocked(props.setOperations).mock.calls[0][0] as (current: typeof props.operations) => typeof props.operations;
    const appliedGame = gameUpdate(props.game); const appliedOperations = operationsUpdate(props.operations);
    expect(appliedGame).toEqual({ ...props.game, politicalPower: 75, intelNetwork: 68 });
    expect(appliedOperations.map((operation) => operation.progress)).toEqual([72, 100, 88]);
    expect(props.addEvent).toHaveBeenCalledExactlyOnceWith('정보 작전 성공 — ' + chosen.name, chosen.region + '에서 준비한 공작이 목표를 달성했습니다. 정보망이 확장됩니다.', 'good', game.week, expect.objectContaining({ domain: 'operations', certainty: 'confirmed' }));
    expect(props.onActionCompleted).toHaveBeenCalledExactlyOnceWith('intelligence', 'intelligence-operation:' + chosen.id, chosen.name + ' 정보 작전 완료');
    expect(props.notify).toHaveBeenCalledTimes(1);
    expect(gameUpdate(props.game)).toEqual(appliedGame); expect(operationsUpdate(props.operations)).toEqual(appliedOperations);
    expect(props.addEvent).toHaveBeenCalledTimes(1); expect(props.game).toEqual(before.game); expect(props.operations).toEqual(before.operations);
  });

  it('preserves the old active flag contract rather than silently adding a new launch restriction', () => {
    const props = input(); props.operations[1].active = false;
    const proposal = createIntelligenceProposal(props, props.operations[1].id)!;
    expect(assessIntelligenceProposal(proposal, props).allowed).toBe(true);
  });

  it.each([
    ['britain-intelligence-director', 64, 7, 4],
    ['britain-tier1', 98, 10, 2],
    ['britain-tier1', 100, 10, 0],
  ] as const)('records actual one-shot costs and capped gains for %s at information %s', (roleId, network, cost, gain) => {
    const props = input({ role: getRole(roleId, 'britain'), game: { ...game, intelNetwork: network } });
    const operation = props.operations[1];
    const proposal = createIntelligenceProposal(props, operation.id)!;
    const execute = createIntelligenceExecutionController();
    expect(execute(proposal, props).accepted).toBe(true);
    expect(execute(proposal, props).accepted).toBe(false);
    expect(props.addEvent).toHaveBeenCalledTimes(1);
    const [title, detail, tone, week, override] = vi.mocked(props.addEvent).mock.calls[0];
    const trace = createWarEventTrace(title, detail, tone, override);
    expect(week).toBe(game.week);
    expect(trace.trigger).toContain(`제${game.week + 1}주`);
    expect(trace.decision).toContain(operation.name);
    expect(trace.decision).toContain(operation.region);
    expect(trace.effects).toEqual([
      { label: '정치력', value: `82 → ${82 - cost} (−${cost})`, tone: 'negative' },
      { label: '공작 상태', value: '34% → 완료 100% · 즉시 반영', tone: 'positive' },
      { label: '정보망', value: `${network} → ${network + gain} (+${gain})`, tone: gain ? 'positive' : 'neutral' },
    ]);
    expect(trace.factors.join(' ')).toContain('정보망 최대 +4');
    expect(trace.factors.join(' ')).toContain('성공·실패·손실 판정에 반영되지 않습니다');
    expect(trace.nextActions.join(' ')).toContain('정보국의 진행·보고');
    expect(JSON.stringify(trace)).not.toMatch(/사단|육군 화면|예약된 작전/);
    const applyGame = vi.mocked(props.setGame).mock.calls[0][0] as (current: GameState) => GameState;
    const actual = applyGame(props.game);
    expect(actual.politicalPower).toBe(82 - cost);
    expect(actual.intelNetwork).toBe(network + gain);
    expect(props.addEvent).toHaveBeenCalledTimes(1);
  });
});

describe('explicit review, honest reports and private information', () => {
  it('shows exact approval deltas and a semantic focus target, but does not execute during rendering', () => {
    const props = input(); const proposal = createIntelligenceProposal(props, props.operations[1].id)!;
    const onConfirm = vi.fn(); const reviewRef = vi.fn();
    const tree = present(props, { workspace: 'planning', operationId: proposal.operation.id }, proposal, { onConfirm, reviewRef });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('아직 미집행'); expect(html).toContain('82 → 75'); expect(html).toContain('64 → 68');
    expect(html).toContain('34% → 완료 100%'); expect(html).toContain('id="ids-review-title" tabindex="-1"');
    expect(reviewRef).not.toHaveBeenCalled(); expect(onConfirm).not.toHaveBeenCalled(); assertNoGameAction(props);
    click(tree, '공작 집행 확정'); expect(onConfirm).toHaveBeenCalledTimes(1); assertNoGameAction(props);
  });

  it('blocks stale confirm handlers, while discarding remains a local action', () => {
    const props = input(); const proposal = createIntelligenceProposal(props, props.operations[0].id)!; props.game.week += 1;
    const onConfirm = vi.fn(); const onDiscard = vi.fn();
    const tree = present(props, { workspace: 'planning' }, proposal, { onConfirm, onDiscard });
    expect(click(tree, '공작 집행 확정').props.disabled).toBe(true); expect(onConfirm).not.toHaveBeenCalled();
    click(tree, '검토 취소'); expect(onDiscard).toHaveBeenCalledTimes(1); assertNoGameAction(props);
  });

  it('shows a single actual saved report without inventing completion dates, loss rolls or financial receipts', () => {
    const props = input(); props.operations[1].progress = 100;
    const html = renderToStaticMarkup(present(props, { workspace: 'reports', reportId: props.operations[1].id }));
    expect(html.match(/data-report-id=/g)).toHaveLength(1); expect(html).toContain('현재 저장: 완료');
    expect(html).toContain('완료 주차·실제 차감 영수증·실패 또는 손실 상세가 없습니다');
    expect(html).toContain('현재 수치로 과거 비용을 역산하지 않습니다'); expect(html).not.toContain('공작 집행 확정'); assertNoGameAction(props);
  });

  it('keeps ordinary observers read-only while leaving the separate personal-career route available', () => {
    const props = input({ authorized: false }); const proposal = createIntelligenceProposal(props, props.operations[0].id)!;
    const onConfirm = vi.fn(); const html = renderToStaticMarkup(present(props)); expect(html).toContain('직접 집행할 수 없습니다');
    click(present(props, { workspace: 'planning' }, proposal, { onConfirm }), '공작 집행 확정'); expect(onConfirm).not.toHaveBeenCalled();
    click(present(props), '개인 비밀 커리어 열기'); expect(props.onOpenClandestineDesk).toHaveBeenCalledTimes(1); assertNoGameAction(props);
  });

  it('preserves personal cover and handler management without exposing mission payloads on the summary', () => {
    const props = input();
    props.careerMarket.clandestine = createClandestineCareerState({ homeNationId: 'britain', handlerNationId: 'usa', week: game.week, role: props.role, weeklyRetainer: 8 });
    props.careerMarket.clandestine.missions = [];
    const tree = present(props); const html = renderToStaticMarkup(tree);
    expect(html).toContain(props.careerMarket.clandestine.coverName); expect(html).toContain(props.careerMarket.clandestine.handlerAlias);
    click(tree, '비밀 임무·핸들러 관리'); expect(props.onOpenClandestineDesk).toHaveBeenCalledTimes(1); assertNoGameAction(props);
  });

  it('filters institution selection by current nation and year, with future lineage kept as historical reference', () => {
    const props = input(); const institutions = getIntelligenceInstitutionView(props);
    expect(institutions.active.every((organization) => organization.nationIds.includes('britain') && organization.appearanceYear <= institutions.year)).toBe(true);
    expect(institutions.next!.appearanceYear).toBeGreaterThan(institutions.year);
    const html = renderToStaticMarkup(present(props, { workspace: 'institutions' }));
    expect(html.match(/data-organization-id=/g)).toHaveLength(1); expect(html).toContain('전체 역사 계보 참고');
    expect(html).toContain('현재의 작전 실체가 아닌 기존 역사 카탈로그'); assertNoGameAction(props);
  });

  it('does not expose underlying loyalty, dual-agent roles or future people as current campaign knowledge', () => {
    const props = input(); const active = getIntelligenceInstitutionView(props).active[0];
    active.figures = [{ ...props.intelligenceHistory.flatMap((organization) => organization.figures)[0], id: 'person-public', name: '현재 이름', office: '공개 직책', activeFromYear: 1900, availableFromYear: 1900 }, { ...props.intelligenceHistory.flatMap((organization) => organization.figures)[0], id: 'future-person', name: 'FUTURE_SECRET_PERSON', activeFromYear: 2099, availableFromYear: 2099 }];
    const before = renderToStaticMarkup(present(props, { workspace: 'institutions', organizationId: active.id }));
    active.figures[0].role = 'double-agent'; active.figures[0].loyalty = 2; active.figures[0].summary = 'SECRET_TRUE_ALLEGIANCE';
    const after = renderToStaticMarkup(present(props, { workspace: 'institutions', organizationId: active.id }));
    expect(after).toBe(before); expect(after).toContain('현재 이름'); expect(after).not.toContain('FUTURE_SECRET_PERSON'); expect(after).not.toContain('SECRET_TRUE_ALLEGIANCE');
    expect(after).toContain('현재 영입 가능성, 실제 충성도 또는 이중간첩 판정이 아닙니다'); assertNoGameAction(props);
  });
});
