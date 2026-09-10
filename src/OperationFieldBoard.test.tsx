import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OperationFieldBoard, type OperationFieldBoardProps } from './OperationFieldBoard';
import { createOperationOrder } from './operations';
import type { BattleReport, Commander, Division, Territory } from './types';

const origin: Territory = { id: 'rear', name: '후방', region: '시험', x: 0, y: 0, controller: 'allies', value: 1, supply: 80, terrain: '평야', neighbors: ['front'] };
const target: Territory = { ...origin, id: 'front', name: '시험 전선', controller: 'axis', terrain: '요새', supply: 7, siteType: 'fortress' };
const division: Division = { id: 'first', name: '제1사단', commanderId: 'commander', type: 'infantry', strength: 68, organization: 58, supply: 42, experience: 65, territoryId: 'rear', status: 'combat' };
const commander: Commander = { id: 'commander', name: '현재 지휘관', rank: '장군', attack: 75, defense: 70, command: 75, logistics: 80, trait: '지휘', initials: 'M', color: '#fff', specialty: '보병', fatigue: 10, loyalty: 80 };
const order = { ...createOperationOrder({ commandId: 'order-command', commandCost: 5, divisionId: division.id, fromId: origin.id, targetId: target.id, startedWeek: 0 }, origin, target, division), elapsedWeeks: 1, operationProgress: 42 };
const phase: BattleReport['phases'][number] = { id: 'reconnaissance', title: '정찰', attackerScore: 1, defenderScore: 1, delta: 0, tone: 'contested', narrative: '보고' };
const report: BattleReport = { id: 'report', orderId: order.id, week: 1, divisionId: division.id, divisionName: division.name, commanderName: '당시 지휘관', commanderId: commander.id, targetId: target.id, targetName: target.name, terrain: target.terrain, stance: 'balanced', victory: true, margin: 12,
  phases: [phase, phase, phase, phase], attackerStrengthLoss: 10, defenderStrengthLoss: 20, organizationLoss: 12, supplySpent: 9, summary: '첫 주 교전은 우세했지만 공세는 계속됩니다.', operationOutcome: 'ongoing', operationProgress: 42, operationRequired: 170, operationWeek: 1, appliedAirSupport: 6, orderCommandCost: 5 };

function render(overrides: Partial<OperationFieldBoardProps> = {}) {
  const onStop = vi.fn();
  const onSelectTarget = vi.fn();
  const props: OperationFieldBoardProps = { week: 1, phase: 'war', orders: [order], reports: [report], divisions: [division], territories: [origin, target], commanders: [commander], commandableDivisionIds: new Set([division.id]), onStop, onSelectTarget, ...overrides };
  return { html: renderToStaticMarkup(<OperationFieldBoard {...props} />), onStop, onSelectTarget };
}

describe('operation field source, authority and receipt rendering', () => {
  it('shows one actual order, own supply and the latest linked report without running commands', () => {
    const before = JSON.stringify({ order, report, division, target });
    const { html, onStop, onSelectTarget } = render();
    expect(html).toContain('교전 진행 중');
    expect(html).toContain('현재 지휘관');
    expect(html).toContain('아군 보급');
    expect(html).toContain('42 / 100');
    expect(html).toContain('실제 적용 항공지원 진척');
    expect(html).toContain('+6');
    expect(html).toContain('5 · 이미 집행');
    expect(html).toContain('작전은 당시 진행 중');
    expect(html).not.toContain('작전 승리 확정');
    expect(html).not.toContain('적 보급');
    expect(html).not.toContain('7 / 100');
    expect(html).toContain('이 공세 중단 요청');
    expect(onStop).not.toHaveBeenCalled();
    expect(onSelectTarget).not.toHaveBeenCalled();
    expect(JSON.stringify({ order, report, division, target })).toBe(before);
  });

  it.each([
    [{ phase: 'nation' as const }, '국정에서는'],
    [{ commandableDivisionIds: new Set<string>() }, '지휘 범위 밖'],
    [{ processingWeek: true }, '결산 중'],
    [{ orders: [{ ...order, stopRequestedWeek: 1 }] }, '중단 요청이 저장'],
  ])('disables stopping for unavailable action context %s', (overrides, reason) => {
    const { html } = render(overrides);
    expect(html).toContain(reason);
    expect(html).toMatch(/<button type="button" disabled="">이 공세 중단 요청/);
  });

  it('does not reuse an older attack report for a new command on the same target', () => {
    const { html } = render({ reports: [{ ...report, orderId: 'old-assault', summary: '이전 공격의 기밀 없는 기록' }, { ...report, orderId: undefined, summary: '구기록' }] });
    expect(html).toContain('이 작전 ID에 연결된 교전 결산이 아직 없습니다');
    expect(html).not.toContain('이전 공격의 기밀 없는 기록');
    expect(html).toContain('구 교전 기록 1건');
  });

  it('does not show future or mismatched-target reports as the selected receipt', () => {
    const { html } = render({ reports: [{ ...report, week: 5, summary: '미래 결과' }, { ...report, targetId: 'elsewhere', summary: '다른 목표 결과' }] });
    expect(html).not.toContain('미래 결과');
    expect(html).not.toContain('다른 목표 결과');
    expect(html).toContain('교전 결산이 아직 없습니다');
  });

  it('keeps a completed operation selectable with historical rather than current commander', () => {
    const { html } = render({ orders: [], reports: [{ ...report, operationOutcome: 'victory', operationProgress: 170 }] });
    expect(html).toContain('작전 승리 확정');
    expect(html).toContain('당시 지휘관');
    expect(html).not.toContain('현재 지휘관');
    expect(html).not.toContain('이 공세 중단 요청');
    expect(html).not.toContain('배속 부대의 현재 상태');
  });

  it('keeps a stopped operation visible without fabricating a battle or refund', () => {
    const { html } = render({ orders: [], reports: [], stoppages: [{ orderId: order.id!, week: 1, divisionId: division.id, targetId: target.id, reason: '위치와 기존 손실 유지 · 환급 없음', elapsedWeeks: 0, progressPercent: 0 }] });
    expect(html).toContain('중단 완료');
    expect(html).toContain('환급 없음');
    expect(html).not.toContain('작전 승리');
    expect(html).not.toContain('이 공세 중단 요청');
  });

  it('distinguishes calculated losses from actual clamped deltas and later recovery', () => {
    const { html } = render({ reports: [{ ...report, appliedLosses: { strength: 3, organization: 4, supply: 2 } }] });
    expect(html).toContain('확정 반영 전력 손실');
    expect(html).toContain('후속 회복·재보급은 별도');
    expect(html).not.toContain('계산된 전력 소모');
    expect(render().html).toContain('계산 소모를 실제 차감량으로 단정하지 않습니다');
  });

  it('renders an empty phase honestly and never creates a default offensive', () => {
    const { html, onStop } = render({ orders: [], reports: [], stoppages: [] });
    expect(html).toContain('작전이 없습니다');
    expect(html).not.toContain('지도에서 목표 보기');
    expect(onStop).not.toHaveBeenCalled();
  });

  it('does not execute actions or change source data across one hundred renders', () => {
    const onStop = vi.fn();
    const onSelectTarget = vi.fn();
    const onSelectOrder = vi.fn();
    const before = JSON.stringify({ order, report, division, target });
    for (let index = 0; index < 100; index += 1) render({ onStop, onSelectTarget, onSelectOrder });
    expect(onStop).not.toHaveBeenCalled();
    expect(onSelectTarget).not.toHaveBeenCalled();
    expect(onSelectOrder).not.toHaveBeenCalled();
    expect(JSON.stringify({ order, report, division, target })).toBe(before);
  });
});
