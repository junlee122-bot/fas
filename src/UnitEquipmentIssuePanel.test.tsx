import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UnitEquipmentIssuePanel, canConfirmUnitEquipmentIssue, createUnitEquipmentIssuePanelReview, type UnitEquipmentIssuePanelProps } from './UnitEquipmentIssuePanel';
import { createUnitEquipmentIssueState, issueUnitEquipment, reviewUnitEquipmentIssue, type UnitEquipmentIssueContext } from './unitEquipmentIssue';

const initialUiStates = vi.hoisted(() => ({ values: [] as unknown[] }));
vi.mock('react', async importOriginal => {
  const react = await importOriginal<typeof import('react')>();
  return { ...react, useState: (initial: unknown) => react.useState(initialUiStates.values.length ? initialUiStates.values.shift() : initial) };
});
beforeEach(() => { initialUiStates.values = []; });

function fixture(): UnitEquipmentIssuePanelProps {
  const context: UnitEquipmentIssueContext = {
    nationId: 'britain', week: 8, playerFaction: 'allies', authorized: true,
    divisions: [{ id: 'division-a', name: '선택된 제1사단', type: 'infantry', strength: 80, organization: 80, experience: 50, supply: 65, territoryId: 'home', commanderId: 'commander-a', status: 'ready' }],
    territories: [{ id: 'home', name: '자국 보급 거점', x: 10, y: 10, neighbors: [], region: '본토', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' }],
    playableTerritoryIds: ['home'], commandableDivisionIds: new Set(['division-a']),
    stockpile: { infantryEquipment: 300, tanks: 100, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 },
  };
  return { state: createUnitEquipmentIssueState(), context, divisionId: 'division-a', onApprove: vi.fn(() => true), onOpenIndustry: vi.fn() };
}
const button = (html: string, label: string) => [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)]
  .find(([markup]) => markup.replace(/<[^>]+>/g, '').includes(label))?.[0] ?? '';
function render(props: UnitEquipmentIssuePanelProps): string {
  const before = JSON.stringify([props.state, props.context]);
  const html = renderToStaticMarkup(<UnitEquipmentIssuePanel {...props} />);
  expect(JSON.stringify([props.state, props.context])).toBe(before);
  expect(props.onApprove).not.toHaveBeenCalled(); expect(props.onOpenIndustry).not.toHaveBeenCalled();
  return html;
}

describe('unit equipment issue panel', () => {
  it('shows national stock cost and raw supply preview without issuing or granting supply', () => {
    const props = fixture(); const html = render(props);
    expect(html).toContain('선택된 제1사단'); expect(html).toContain('300개'); expect(html).toContain('−100개'); expect(html).toContain('200개');
    expect(html).toContain('65 → 75 / 100'); expect(html).toContain('부대 기초 보급');
    expect(html).toContain('제식 장비·준비도 보정을 별도로');
    expect(html).toContain('추상화된 현지 지급'); expect(html).toContain('특정 공장의 생산 묶음 출처');
    expect(button(html, '장비 지급안 검토')).not.toContain('disabled');
    expect(button(html, '장비 지급 승인')).toBe('');
    expect(html).toContain('부대별 주 1회');
  });

  it('uses the armor cost supplied by the actual engine', () => {
    const props = fixture(); props.context.divisions = [{ ...props.context.divisions[0], type: 'armor' }];
    const html = render(props);
    expect(html).toContain('국가 가용 전차'); expect(html).toContain('−20개'); expect(html).toContain('80개');
  });

  it.each(['missing', 'duplicate', 'outside-scope'] as const)('does not substitute a unit or expose an issue action for %s selection', change => {
    const props = fixture();
    if (change === 'missing') props.divisionId = 'removed';
    if (change === 'duplicate') props.context.divisions = [...props.context.divisions, { ...props.context.divisions[0] }];
    if (change === 'outside-scope') props.context.commandableDivisionIds = new Set();
    const html = render(props);
    expect(button(html, '장비 지급안 검토')).toContain('disabled');
    expect(html).not.toContain('class="unit-issue-flow"');
    expect(createUnitEquipmentIssuePanelReview(props)).toBeNull();
  });

  it.each(['authority', 'busy', 'stock', 'combat', 'foreign-territory', 'sea-busy'] as const)('shows the actual engine denial for %s', change => {
    const props = fixture();
    if (change === 'authority') props.context.authorized = false;
    if (change === 'busy') props.context.processingWeek = true;
    if (change === 'stock') props.context.stockpile.infantryEquipment = 20;
    if (change === 'combat') props.context.divisions = [{ ...props.context.divisions[0], status: 'combat' }];
    if (change === 'foreign-territory') props.context.territories = [{ ...props.context.territories[0], ownerId: 'usa' }];
    if (change === 'sea-busy') props.context.seaBusyDivisionIds = new Set(['division-a']);
    const html = render(props); const review = reviewUnitEquipmentIssue(props.state, props.divisionId, props.context);
    expect(html).toContain(review.reason); expect(button(html, '장비 지급안 검토')).toContain('disabled');
  });

  it('renders the explicitly reviewed original snapshot but never approves on mount', () => {
    const props = fixture(); const review = createUnitEquipmentIssuePanelReview(props);
    expect(canConfirmUnitEquipmentIssue(review, props)).toBe(true);
    initialUiStates.values = [review]; const html = render(props);
    expect(html).toContain('장비 지급 최종 검토'); expect(html).toContain('제9주에 검토한 지급안');
    expect(button(html, '이 수량으로 장비 지급 승인')).not.toContain('disabled');
  });

  it.each(['stock', 'supply', 'week', 'nation', 'division', 'location', 'authority', 'busy'] as const)('disables a stale %s review and keeps the reviewed costs unchanged', change => {
    const props = fixture(); const review = createUnitEquipmentIssuePanelReview(props)!;
    if (change === 'stock') props.context.stockpile.infantryEquipment = 999;
    if (change === 'supply') props.context.divisions = [{ ...props.context.divisions[0], supply: 95 }];
    if (change === 'week') props.context.week += 1;
    if (change === 'nation') props.context.nationId = 'usa';
    if (change === 'division') props.divisionId = 'other';
    if (change === 'location') props.context.territories = [{ ...props.context.territories[0], supply: 70 }];
    if (change === 'authority') props.context.authorized = false;
    if (change === 'busy') props.context.processingWeek = true;
    expect(canConfirmUnitEquipmentIssue(review, props)).toBe(false);
    initialUiStates.values = [review]; const html = render(props);
    expect(button(html, '이 수량으로 장비 지급 승인')).toContain('disabled');
    expect(html).toContain('이전 검토안'); expect(html).toContain('300개'); expect(html).toContain('−100개');
    expect(html).not.toContain('999개');
  });

  it('shows only exact nation and division receipts and denies a second same-week issue', () => {
    const props = fixture(); const command = createUnitEquipmentIssuePanelReview(props)!;
    const first = issueUnitEquipment(props.state, command, props.context); expect(first.applied).toBe(true);
    const otherContext = { ...props.context, nationId: 'usa' as const, divisions: [{ ...props.context.divisions[0], name: '다른 국가 기록' }], territories: [{ ...props.context.territories[0], ownerId: 'usa' as const }] };
    const otherReview = reviewUnitEquipmentIssue(first.state, props.divisionId, otherContext);
    const foreign = issueUnitEquipment(first.state, { divisionId: props.divisionId, reviewKey: otherReview.reviewKey! }, otherContext); expect(foreign.applied).toBe(true);
    props.state = foreign.state; props.context.stockpile = first.stockpile; props.context.divisions = first.divisions;
    const html = render(props);
    expect(html).toContain('최근 실제 지급 1건'); expect(html).toContain('당시 확정 기록'); expect(html).not.toContain('다른 국가 기록');
    expect(button(html, '장비 지급안 검토')).toContain('disabled'); expect(html).toContain('이번 주 지급 완료');
    expect(html).not.toContain('class="unit-issue-flow"'); expect(html).not.toContain('지급 후 부대 기초 보급 예상');
    expect(html).toContain('부대 기초 보급 65 → 75');
    expect(canConfirmUnitEquipmentIssue(command, props)).toBe(false);
  });

  it('never renders future receipt history as already delivered', () => {
    const props = fixture(); const command = createUnitEquipmentIssuePanelReview(props)!;
    props.state = issueUnitEquipment(props.state, command, props.context).state; props.context.week = 7;
    const html = render(props); expect(html).toContain('최근 실제 지급 0건');
    expect(html).toContain('미래의 지급 기록'); expect(button(html, '장비 지급안 검토')).toContain('disabled');
  });
});
