import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createStaffRoster } from './campaign';
import { createRegionalIndustryState, type RegionalIndustryContext } from './regionalIndustry';
import { createStaffDeliveryPledge, createStaffDeliveryPledgeState, type StaffDeliveryPledgeContext } from './staffDeliveryPledges';
import { DeliveryGoalTracePanel, type DeliveryGoalTracePanelProps } from './DeliveryGoalTracePanel';
import { StaffDeliveryPledgeBoard } from './StaffDeliveryPledgeBoard';
import type { Territory } from './types';

function fixture(): DeliveryGoalTracePanelProps {
  const staff = createStaffRoster('britain', 'britain-tier1').map(member => ({ ...member, joinedWeek: 0 }));
  const context: StaffDeliveryPledgeContext = { nationId: 'britain', week: 10, phase: 'nation', staff,
    production: [{ id: 'rifle', name: '정확한 보병 생산선', assigned: 5, output: 100, efficiency: 84, category: '보병', icon: 'rifle' }],
    manageableDepartments: staff.map(member => member.department), industryMandate: { tab: 'industry', mode: 'direct', label: '직접 결재', reason: '현재 보직', authorityRoute: '기존 경로' },
    lineEquipment: [{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }] };
  const pledge = createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { id: 'goal-1', expectedWeek: 10, staffId: staff[0].id, personId: staff[0].personId,
    lineId: 'rifle', metric: 'national-available', targetQuantity: 20, durationWeeks: 4 }, context).state.pledges[0];
  pledge.receipts = [{ id: 'arrival:britain:arrival:britain:shipment-exact', nationId: 'britain', week: 12, equipmentKey: 'infantryEquipment', source: 'shipment-arrival', quantity: 9 }];
  const state = createRegionalIndustryState('britain', 12);
  const account = state.accounts.britain!;
  account.configuration = { mode: 'pilot', originTerritoryId: 'origin', destinationTerritoryId: 'destination', equipmentKey: 'infantryEquipment', allocatedFactories: 2 };
  account.warehouse.infantryEquipment = 50;
  account.shipments = [
    { id: 'shipment-exact', equipmentKey: 'infantryEquipment', quantity: 9, originTerritoryId: 'origin', destinationTerritoryId: 'destination', status: 'delivered', reservedWeek: 10, remainingWeeks: 0, deliveredWeek: 12, heldReason: null },
    { id: 'shipment-pending', equipmentKey: 'infantryEquipment', quantity: 10, originTerritoryId: 'origin', destinationTerritoryId: 'destination', status: 'reserved', reservedWeek: 12, remainingWeeks: 2, deliveredWeek: null, heldReason: null },
  ];
  const territories: Territory[] = ['origin', 'destination'].map((id, index) => ({ id, name: index ? '실제 도착 거점' : '실제 출발 창고', x: 10 + index * 20, y: 40, region: 'test', controller: 'allies', ownerId: 'britain', value: 1, supply: 80, terrain: '평야', siteType: 'city', neighbors: [index ? 'origin' : 'destination'] }));
  const regionalContext: RegionalIndustryContext = { nationId: 'britain', week: 12, territories, playableTerritoryIds: ['origin', 'destination'], factories: 10, authorized: true, controllingFaction: 'allies' };
  return { pledge, context: { ...context, week: 12 }, regional: { state, context: regionalContext }, onNavigate: vi.fn() };
}

describe('delivery goal trace panel', () => {
  it('separates allocation, current logistics and credited evidence without mutating or executing', () => {
    const props = fixture(); const before = JSON.stringify(props);
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('배정 5개 · 효율 84%');
    expect(html).toContain('50개'); expect(html).toContain('10개');
    expect(html).toContain('목표까지 11개 남음'); expect(html).toContain('실제 영수증 1건');
    expect(html).toContain('이 목표 전용 예약이나 달성량이 아닙니다');
    expect(html).toContain('이 생산라인 열기'); expect(html).toContain('이 담당자 업무 확인');
    expect(html).toContain('해당 작업 확인'); expect(html).not.toContain('현재 보직은 생산·수송의');
    expect(html).toContain('실제 출발 창고 → 실제 도착 거점'); expect(html).toContain('이 도착 증빙 열기');
    expect(props.onNavigate).not.toHaveBeenCalled(); expect(JSON.stringify(props)).toBe(before);
  });
  it.each([
    ['request', '생산 보고·상신 확인', '담당 부서 보고·상신 확인', '보고·상신 화면으로 이동합니다'],
    ['report', '생산 보고 열람', '담당 부서 보고 열람', '보고 열람 화면으로 이동합니다'],
  ] as const)('labels %s navigation as the actual authority route, not an editable desk', (mode, productionLabel, workLabel, note) => {
    const props = fixture(); props.context.industryMandate.mode = mode;
    props.regional!.context.authorized = false;
    const before = JSON.stringify(props);
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain(productionLabel); expect(html).toContain(workLabel); expect(html).toContain(note);
    expect(html).not.toContain('이 생산라인 열기'); expect(html).not.toContain('해당 작업 확인');
    expect(html).toContain('목표까지 11개 남음');
    expect(props.onNavigate).not.toHaveBeenCalled(); expect(JSON.stringify(props)).toBe(before);
  });
  it('shows an explicit trace affordance but does not eagerly render every full trace', () => {
    const props = fixture(); const onCreate = vi.fn(() => false);
    const html = renderToStaticMarkup(<StaffDeliveryPledgeBoard state={{ version: 1, lastAdvancedWeek: 12, pledges: [props.pledge], diagnostics: [] }} context={props.context} regional={props.regional} onNavigateGoal={props.onNavigate} onCreate={onCreate} />);
    expect(html).toContain('생산·수송 경로 추적'); expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('class="delivery-goal-trace"'); expect(onCreate).not.toHaveBeenCalled(); expect(props.onNavigate).not.toHaveBeenCalled();
  });
  it('keeps compacted evidence but never substitutes a similar shipment', () => {
    const props = fixture(); props.regional!.state.accounts.britain!.shipments[0].id = 'similar-not-same';
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('목표까지 11개 남음'); expect(html).toContain('정확히 일치하는 수송 원본이 없습니다');
    expect(html).not.toContain('이 도착 증빙 열기');
  });
  it('withholds a tampered arrival link even when its id matches', () => {
    const props = fixture(); props.regional!.state.accounts.britain!.shipments[0].quantity = 8;
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).not.toContain('이 도착 증빙 열기'); expect(html).toContain('일치하지 않아 다른 운송으로 대신 연결하지 않습니다');
  });
  it('does not show missing or foreign records as zero remaining and fulfilled', () => {
    const props = fixture(); props.context.nationId = 'korea';
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('검증 불가'); expect(html).toContain('현재 유효한 달성 판정을 제공하지 않습니다');
    expect(html).not.toContain('목표 수량 충족'); expect(html).not.toContain('이 생산라인 열기'); expect(html).not.toContain('이 도착 증빙 열기');
  });
  it('does not promise a successful result before deadline verification', () => {
    const props = fixture(); props.pledge.targetQuantity = 9;
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('목표 수량 충족'); expect(html).toContain('기한의 동일 담당자 검증 전에는 성공으로 확정하지 않습니다');
    expect(html).not.toContain('>해당 작업 확인<');
  });
  it('does not turn current warehouse conditions into the cause of a historical result', () => {
    const props = fixture(); props.context.week = 14; props.regional!.context.week = 14;
    props.pledge.status = 'failed'; props.pledge.resolvedWeek = 14; props.pledge.resolution = '기한에 실제 9개만 확인됨';
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('확정 결과 확인'); expect(html).toContain('이 도착 증빙 열기');
    expect(html).not.toContain('50개'); expect(html).not.toContain('이 생산라인 열기');
  });
  it('shows unavailable logistics as unknown, not a zero-valued warehouse', () => {
    const props = fixture(); props.regional = undefined;
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('확인 불가'); expect(html).toContain('지역 수송 자료가 연결되지 않아');
    expect(html).toContain('목표까지 11개 남음'); expect(html).not.toContain('이 도착 증빙 열기');
  });
  it('keeps historical evidence but does not navigate into the same person newly reappointed', () => {
    const props = fixture(); props.context.week = 14; props.regional!.context.week = 14;
    props.pledge.status = 'failed'; props.pledge.resolvedWeek = 14;
    props.context.staff = props.context.staff.map(member => member.id === props.pledge.staffId ? { ...member, joinedWeek: 13 } : member);
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('이 도착 증빙 열기'); expect(html).not.toContain('이 담당자 업무 확인');
  });
  it('renders reading-only content without navigation callbacks', () => {
    const props = fixture(); props.onNavigate = undefined;
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('9개'); expect(html).not.toContain('<button');
  });
  it('never treats factory completion as proof of national availability', () => {
    const props = fixture(); props.pledge.metric = 'factory-completed'; props.pledge.receipts = [{ id: 'factory:britain:12:rifle', nationId: 'britain', week: 12, equipmentKey: 'infantryEquipment', source: 'factory-completed', quantity: 8, lineId: 'rifle' }];
    const html = renderToStaticMarkup(<DeliveryGoalTracePanel {...props} />);
    expect(html).toContain('수송 도착은 달성 조건이 아닙니다'); expect(html).toContain('특정 수송에 귀속하지 않습니다'); expect(html).not.toContain('이 도착 증빙 열기');
  });
});
