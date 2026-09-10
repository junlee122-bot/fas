import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getRole, nations } from './campaign';
import { advanceJusticeWeek, createJusticeSystemState, getJusticeDecisionOptions, openJusticeCase, resolveJusticeDecision, type JusticeContext } from './justiceSystem';
import { assessJusticeDeskReview, createJusticeDeskController, initialJusticeDeskSelection, JusticeDocketBoard, JusticeDocketView, resolveJusticeDeskCase, reviewJusticeDeskCommand, type JusticeDeskReview, type JusticeDeskSelection, type JusticeDocketBoardProps, type JusticeDocketViewProps } from './JusticeDocketBoard';

function input(overrides: Partial<JusticeDocketBoardProps> = {}): JusticeDocketBoardProps {
  const context: JusticeContext = { week: 0, year: 1942, phase: 'war', nationId: 'britain', role: getRole('britain-tier1', 'britain'), politicalPower: 100, treasury: 500, stability: 72, intelNetwork: 68, legitimacy: 64, unrest: 34, institutionalCapacity: 58, mediaFreedom: 62, pressTrust: 57, activeElection: false, strategyId: 'reconstruction-state' };
  return { state: createJusticeSystemState('britain', 0), context, formatMoney: (value) => `${value} 국고`, onOpenCase: vi.fn(), onDecision: vi.fn(), ...overrides };
}
function present(p: JusticeDocketBoardProps, patch: Partial<JusticeDeskSelection> = {}, review: JusticeDeskReview | null = null, callbacks: Partial<JusticeDocketViewProps> = {}) {
  return JusticeDocketView({ ...p, selection: { ...initialJusticeDeskSelection, ...patch }, review, onSelectionChange: vi.fn(), onReview: vi.fn(), onDiscard: vi.fn(), onConfirm: vi.fn(), ...callbacks });
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
function button(tree: ReactNode, label: string) { return elements(tree).find((element) => element.type === 'button' && renderToStaticMarkup(element).includes(label))!; }
function click(tree: ReactNode, label: string) { const element = button(tree, label); (element.props.onClick as () => void)(); return element; }
function noWrites(p: JusticeDocketBoardProps) { expect(p.onOpenCase).not.toHaveBeenCalled(); expect(p.onDecision).not.toHaveBeenCalled(); }
function initialReview(p: JusticeDocketBoardProps) { return reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'appoint-independent-prosecutor' }, p.state.cases[0].id).review!; }
function bribery(p: JusticeDocketBoardProps) {
  p.state = resolveJusticeDecision(p.state, 'direct-ministry-investigation', p.context)!.state;
  p.context = { ...p.context, week: 2 };
  p.state = advanceJusticeWeek(p.state, p.context).state;
}

describe('justice workspaces and case identity', () => {
  it('starts with one actual case, not every decision, intake and history at once', () => {
    const p = input(); const before = JSON.stringify([p.state, p.context]);
    const html = renderToStaticMarkup(<JusticeDocketBoard {...p} />);
    expect(html).toContain('data-justice-workspace="cases"'); expect(html.match(/data-justice-case=/g)).toHaveLength(1);
    expect(html).not.toContain('data-decision-case='); expect(html).not.toContain('사건 접수안 검토'); expect(html).not.toContain('data-justice-record=');
    expect(html).toContain('해당 사건 결재 보기'); expect(JSON.stringify([p.state, p.context])).toBe(before); noWrites(p);
  });
  it.each(['cases', 'decision', 'intake', 'records'] as const)('conditionally mounts %s without game actions', (workspace) => {
    const p = input(); const callback = vi.fn();
    const html = renderToStaticMarkup(present(p, { workspace }, null, { onSelectionChange: callback }));
    expect(html.includes('data-justice-case=')).toBe(workspace === 'cases');
    expect(html.includes('data-decision-case=')).toBe(workspace === 'decision');
    expect(html.includes('data-justice-record=')).toBe(workspace === 'records'); expect(callback).not.toHaveBeenCalled(); noWrites(p);
  });
  it('never applies the global pending decision to a different selected case', () => {
    const p = input(); const second = { ...p.state.cases[0], id: 'second-case', title: '두 번째 사건' }; p.state.cases.push(second);
    const onSelectionChange = vi.fn(); const tree = present(p, { workspace: 'decision', caseId: second.id }, null, { onSelectionChange });
    const html = renderToStaticMarkup(tree);
    expect(html).toContain('선택 사건과 결재 대상이 다릅니다'); expect(html).not.toContain('이 처리안 검토');
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'appoint-independent-prosecutor' }, second.id).review).toBeNull();
    click(tree, '결재 대상 사건으로 이동'); expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ workspace: 'decision', caseId: p.state.pendingDecision!.caseId, optionId: null }); noWrites(p);
  });
  it('keeps native case selection and navigation read-only, including a vanished selection', () => {
    const p = input(); const onSelectionChange = vi.fn(); const tree = present(p, {}, null, { onSelectionChange });
    const select = elements(tree).find((element) => element.type === 'select')!;
    (select.props.onChange as (event: unknown) => void)({ currentTarget: { value: p.state.cases[0].id } });
    expect(onSelectionChange).toHaveBeenCalledWith({ caseId: p.state.cases[0].id });
    click(tree, '현재 결재'); expect(onSelectionChange).toHaveBeenCalledWith({ workspace: 'decision' });
    expect(resolveJusticeDeskCase(p.state, 'deleted')).toBeNull();
    expect(renderToStaticMarkup(present(p, { caseId: 'deleted' }))).toContain('선택 사건을 확인할 수 없습니다'); noWrites(p);
  });
  it('retains intake controls in compact wartime mode', () => {
    const p = input({ compact: true }); p.state.pendingDecision = null;
    const onReview = vi.fn(); const tree = present(p, { workspace: 'intake' }, null, { onReview });
    expect(renderToStaticMarkup(tree)).toContain('사건 접수안 검토');
    click(tree, '사건 접수안 검토'); expect(onReview).toHaveBeenCalledWith({ kind: 'open', templateId: 'wartime-shell-ledger' }); noWrites(p);
  });
  it('handles no cases, no pending decision and no history without inventing actions', () => {
    const p = input(); p.state = { ...p.state, cases: [], activeCaseId: null, pendingDecision: null, history: [] };
    for (const workspace of ['cases', 'decision', 'records'] as const) expect(renderToStaticMarkup(present(p, { workspace }))).not.toContain('이 사건 결재 확정');
    expect(renderToStaticMarkup(present(p, { workspace: 'records' }))).toContain('검토안을 완료 기록으로 채우지 않습니다'); noWrites(p);
  });
  it.each(nations)('preserves the existing current-nation docket for $id', (nation) => {
    const p = input(); p.context.nationId = nation.id; p.context.role = getRole(nation.id + '-tier1', nation.id); p.state = createJusticeSystemState(nation.id, 0);
    expect(initialReview(p)).not.toBeNull(); expect(renderToStaticMarkup(present(p))).toContain(p.state.cases[0].title); noWrites(p);
  });
});

describe('justice review and callback guards', () => {
  it('uses the pure existing result, capped deltas and actual next review without executing it', () => {
    const p = input(); p.state.independence = 98; p.context.legitimacy = 99;
    const before = JSON.stringify([p.state, p.context]); const review = initialReview(p);
    expect(review.result).toEqual(resolveJusticeDecision(p.state, 'appoint-independent-prosecutor', p.context));
    expect(review.politicalCost).toBe(5); expect(review.treasuryCost).toBe(8);
    expect(review.previewLines).toContain('정치력 순변화 100 → 95'); expect(review.previewLines).toContain('국고 순변화 500 국고 → 492 국고');
    expect(review.previewLines).toContain('사법 독립 98 → 100'); expect(review.previewLines).toContain('정통성 99 → 100');
    const onConfirm = vi.fn(); const reviewRef = vi.fn(); const tree = present(p, { workspace: 'decision' }, review, { onConfirm, reviewRef });
    const html = renderToStaticMarkup(tree); expect(html).toContain('아직 미집행'); expect(html).toContain('다음 절차 검토 제4주'); expect(html).toContain('id="jd-review-title" tabindex="-1"');
    expect(reviewRef).not.toHaveBeenCalled(); expect(onConfirm).not.toHaveBeenCalled(); expect(JSON.stringify([p.state, p.context])).toBe(before); noWrites(p);
    click(tree, '이 사건 결재 확정'); expect(onConfirm).toHaveBeenCalledTimes(1); noWrites(p);
  });
  it('dispatches once and leaves costs to the existing App callback, including alternative same-pending options', () => {
    const p = input(); const first = initialReview(p);
    const second = reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'shelve-allegation' }, p.state.cases[0].id).review!;
    const execute = createJusticeDeskController(); const before = JSON.stringify([p.state, p.context]);
    expect(execute(first, p, first.caseId).accepted).toBe(true);
    expect(execute(first, p, first.caseId).accepted).toBe(false); expect(execute(second, p, second.caseId).accepted).toBe(false);
    expect(p.onDecision).toHaveBeenCalledExactlyOnceWith('appoint-independent-prosecutor'); expect(p.onOpenCase).not.toHaveBeenCalled();
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });
  it('requests exact money for before/after, review cost and option cost without changing compact summaries', () => {
    const formatMoney = vi.fn<JusticeDocketBoardProps['formatMoney']>((value, options) => options?.exact ? `${value.toLocaleString('ko-KR')} 정확 국고` : '10.0K 국고');
    const p = input({ formatMoney }); p.context.treasury = 10_005;
    const review = initialReview(p);
    expect(formatMoney).toHaveBeenCalledWith(10_005, { exact: true });
    expect(formatMoney).toHaveBeenCalledWith(9_997, { exact: true });
    expect(review.previewLines).toContain('국고 순변화 10,005 정확 국고 → 9,997 정확 국고');
    formatMoney.mockClear();
    const html = renderToStaticMarkup(present(p, { workspace: 'decision' }, review));
    expect(formatMoney).toHaveBeenCalledWith(8, { exact: true });
    expect(formatMoney.mock.calls.filter(([value, options]) => value === 8 && options?.exact)).toHaveLength(2);
    expect(html).toContain('8 정확 국고');
    expect(formatMoney.mock.calls.every(([, options]) => options?.exact === true)).toBe(true);
    formatMoney.mockClear();
    renderToStaticMarkup(present(p));
    expect(formatMoney).not.toHaveBeenCalled(); noWrites(p);
  });
  it.each([58, 99, 100])('uses actual economic confidence %s when provided, with its application cap', (confidence) => {
    const p = input({ publicConfidence: confidence }); const review = initialReview(p);
    const actual = Math.min(100, confidence + review.result.publicConfidenceDelta);
    if (actual !== confidence) expect(review.previewLines).toContain(`국민 신뢰 ${confidence} → ${actual}`);
    else expect(review.previewLines.some((line) => line.startsWith('국민 신뢰'))).toBe(false);
    expect(review.previewLines.join(' ')).not.toContain('경제 신뢰값은 이 화면에 없어'); noWrites(p);
  });
  it('retains honest contribution-only feedback without confidence, and invalidates a changed confidence review', () => {
    const p = input(); const unknown = initialReview(p);
    expect(unknown.previewLines.join(' ')).toContain('국민 신뢰 변화 요청 +3');
    p.publicConfidence = 99;
    expect(assessJusticeDeskReview(unknown, p, unknown.caseId).allowed).toBe(false);
    const known = initialReview(p); p.publicConfidence = 98;
    expect(createJusticeDeskController()(known, p, known.caseId).accepted).toBe(false); noWrites(p);
  });
  it.each(['week', 'year', 'phase', 'nation', 'role', 'resources', 'pending', 'case', 'busy', 'selected'] as const)('rejects a stale %s before callbacks', (changed) => {
    const p = input(); const review = initialReview(p); let selected = review.caseId;
    if (changed === 'week') p.context.week++;
    if (changed === 'year') p.context.year++;
    if (changed === 'phase') p.context.phase = 'nation';
    if (changed === 'nation') p.context.nationId = 'usa';
    if (changed === 'role') p.context.role = { ...p.context.role, tier: 5 };
    if (changed === 'resources') p.context.treasury--;
    if (changed === 'pending') p.state.pendingDecision = { ...p.state.pendingDecision!, id: 'changed-pending' };
    if (changed === 'case') p.state.cases[0] = { ...p.state.cases[0], chainOfCustody: 4 };
    if (changed === 'busy') p.busy = true;
    if (changed === 'selected') selected = 'another-case';
    expect(assessJusticeDeskReview(review, p, selected).allowed).toBe(false);
    expect(createJusticeDeskController()(review, p, selected).accepted).toBe(false); noWrites(p);
  });
  it('does not mix an old preview after-value with newly changed resources', () => {
    const p = input(); const review = initialReview(p); p.context.politicalPower = 80;
    const onConfirm = vi.fn(); const onDiscard = vi.fn(); const tree = present(p, { workspace: 'decision' }, review, { onConfirm, onDiscard });
    const html = renderToStaticMarkup(tree); expect(html).toContain('100 → 95'); expect(html).not.toContain('80 → 95');
    expect(click(tree, '이 사건 결재 확정').props.disabled).toBe(true); expect(onConfirm).not.toHaveBeenCalled();
    click(tree, '검토 취소'); expect(onDiscard).toHaveBeenCalledTimes(1); noWrites(p);
  });
  it.each(['tier', 'political', 'treasury', 'future-pending', 'missing-case', 'duplicate-case', 'closed-case', 'foreign-state', 'foreign-role', 'invalid-week'] as const)('blocks invalid %s records and authority', (kind) => {
    const p = input(); const id = p.state.cases[0].id;
    if (kind === 'tier') p.context.role = { ...p.context.role, tier: 5 };
    if (kind === 'political') p.context.politicalPower = 4;
    if (kind === 'treasury') p.context.treasury = 7;
    if (kind === 'future-pending') p.state.pendingDecision!.openedWeek = 20;
    if (kind === 'missing-case') p.state.cases = [];
    if (kind === 'duplicate-case') p.state.cases.push({ ...p.state.cases[0] });
    if (kind === 'closed-case') p.state.cases[0].stage = 'closed';
    if (kind === 'foreign-state') p.state.nationId = 'usa';
    if (kind === 'foreign-role') p.context.role = { ...p.context.role, nationId: 'usa' };
    if (kind === 'invalid-week') p.context.week = NaN;
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'appoint-independent-prosecutor' }, id).review).toBeNull(); noWrites(p);
  });
  it('preserves junior lawful reporting while restricting coercive options', () => {
    const p = input(); bribery(p); p.context.role = { ...p.context.role, tier: 5 };
    const id = p.state.pendingDecision!.caseId;
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'refuse-and-record-bribe' }, id).review).not.toBeNull();
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'controlled-sting' }, id).review).toBeNull(); noWrites(p);
  });
  it('matches war and era gates without adding an overdue lock not present in the engine', () => {
    const p = input(); const id = p.state.cases[0].id; p.context.phase = 'nation';
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'military-inquiry' }, id).review).toBeNull();
    p.context.phase = 'war'; p.context.week = 10;
    expect(initialReview(p)).not.toBeNull();
    p.state.cases[0].stage = 'charging'; p.state.pendingDecision = { ...p.state.pendingDecision!, kind: 'charge-route', optionIds: ['refer-truth-commission'] };
    expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'refer-truth-commission' }, id).review).toBeNull();
    p.context.year = 1945; expect(reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'refer-truth-commission' }, id).review).not.toBeNull(); noWrites(p);
  });
  it('shows actual secret-arrangement net gains without presenting them as a free beneficial policy', () => {
    const p = input(); bribery(p);
    const review = reviewJusticeDeskCommand(p, { kind: 'decision', optionId: 'accept-secret-arrangement' }, p.state.pendingDecision!.caseId).review!;
    expect(review.politicalCost).toBe(0); expect(review.result.politicalPowerDelta).toBe(8); expect(review.result.treasuryDelta).toBe(18);
    expect(review.previewLines).toContain('정치력 순변화 100 → 108'); expect(review.previewLines.some((line) => line.startsWith('부패 압력'))).toBe(true);
    expect(review.previewLines.some((line) => line.startsWith('무처벌 위험'))).toBe(true); noWrites(p);
  });
});

describe('intake and honest saved reports', () => {
  it('uses the engine intake result and permits junior intake without inventing a new authority rule', () => {
    const p = input(); p.state.pendingDecision = null; p.context.role = { ...p.context.role, tier: 5 };
    const before = JSON.stringify([p.state, p.context]);
    const review = reviewJusticeDeskCommand(p, { kind: 'open', templateId: 'classified-papers' }, null).review!;
    expect(review.result).toEqual(openJusticeCase(p.state, 'classified-papers', p.context)); expect(review.politicalCost).toBe(2);
    const execute = createJusticeDeskController(); expect(execute(review, p, null).accepted).toBe(true); expect(execute(review, p, null).accepted).toBe(false);
    expect(p.onOpenCase).toHaveBeenCalledExactlyOnceWith('classified-papers'); expect(p.onDecision).not.toHaveBeenCalled(); expect(JSON.stringify([p.state, p.context])).toBe(before);
  });
  it.each(['pending', 'six-cases', 'political', 'future-era', 'missing-template', 'busy'] as const)('guards intake %s', (kind) => {
    const p = input(); if (kind !== 'pending') p.state.pendingDecision = null;
    if (kind === 'six-cases') p.state.cases = Array.from({ length: 6 }, (_, index) => ({ ...p.state.cases[0], id: `case-${index}` }));
    if (kind === 'political') p.context.politicalPower = 1;
    if (kind === 'busy') p.busy = true;
    const templateId = kind === 'future-era' ? 'offshore-minister' : kind === 'missing-template' ? 'missing' : 'classified-papers';
    expect(reviewJusticeDeskCommand(p, { kind: 'open', templateId }, null).review).toBeNull(); noWrites(p);
  });
  it('blocks a second different intake before its new pending case has rendered', () => {
    const p = input(); p.state.pendingDecision = null;
    const first = reviewJusticeDeskCommand(p, { kind: 'open', templateId: 'classified-papers' }, null).review!;
    const second = reviewJusticeDeskCommand(p, { kind: 'open', templateId: 'newsroom-attack' }, null).review!;
    const execute = createJusticeDeskController(); expect(execute(first, p, null).accepted).toBe(true); expect(execute(second, p, null).accepted).toBe(false);
    expect(p.onOpenCase).toHaveBeenCalledTimes(1);
  });
  it('does not turn allegations, private documents, indictment or an appeal into final guilt', () => {
    const p = input(); const html = renderToStaticMarkup(present(p));
    expect(html).toContain('의혹·기소·비공개 증거는 유죄 확정이 아닙니다'); expect(html).toContain('법정 채택·유죄 확정 아님');
    expect(html).toContain('아직 저장된 판단·처분이 없습니다'); expect(html).not.toContain('유죄 확률 48');
    p.state.cases[0] = { ...p.state.cases[0], stage: 'appeal', outcome: '일부 유죄·핵심 소인 무죄', sentence: '저장된 형량' };
    const appealed = renderToStaticMarkup(present(p)); expect(appealed).toContain('일부 유죄·핵심 소인 무죄'); expect(appealed).toContain('아직 종결되지 않았습니다'); noWrites(p);
  });
  it('renders one actual history record with its real case link, not preview-created history', () => {
    const p = input(); const review = initialReview(p); const onSelectionChange = vi.fn();
    const tree = present(p, { workspace: 'records' }, null, { onSelectionChange }); const html = renderToStaticMarkup(tree);
    expect(html.match(/data-justice-record=/g)).toHaveLength(1); expect(html).toContain('초기 사건철 접수'); expect(html).not.toContain(review.title);
    expect(html).toContain('과거 실제 차감 영수증이 없는 항목은 현재 값으로 역산하지 않습니다');
    click(tree, '연결된 사건 열기'); expect(onSelectionChange).toHaveBeenCalledExactlyOnceWith({ workspace: 'cases', caseId: p.state.cases[0].id }); noWrites(p);
  });
  it('does not expose a future template simply because its id remains selected', () => {
    const p = input(); p.state.pendingDecision = null;
    const html = renderToStaticMarkup(present(p, { workspace: 'intake', templateId: 'offshore-minister' }));
    expect(html).not.toContain('고위공직자 차명계좌·해외자산'); expect(html).not.toContain('사건 접수안 검토'); noWrites(p);
  });
});
