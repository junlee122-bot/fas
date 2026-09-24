import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createStaffRoster } from './campaign';
import { forecastPostwarIndustry } from './postwarIndustry';
import { StaffDeliveryCheckIn, StaffDeliveryPledgeBoard } from './StaffDeliveryPledgeBoard';
import { advanceStaffDeliveryPledges, createStaffDeliveryPledge, createStaffDeliveryPledgeState, normalizeStaffDeliveryPledges } from './staffDeliveryPledges';
import type { StaffDeliveryPledgeContext, StaffDeliveryPledgeState } from './staffDeliveryPledges';

function fixture() {
  const staff = createStaffRoster('britain', 'britain-tier1').map((member) => ({ ...member, joinedWeek: 0 }));
  const context: StaffDeliveryPledgeContext = { nationId: 'britain', week: 10, phase: 'nation', staff, production: [{ id: 'rifle', name: '보병 장비 생산선', assigned: 5, output: 100, efficiency: 100, category: '보병', icon: 'rifle' }], manageableDepartments: [staff[0].department], industryMandate: { tab: 'industry', mode: 'direct', label: '직접 결재', reason: '현재 보직', authorityRoute: '기존 경로' }, lineEquipment: [{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }] };
  const forecast = forecastPostwarIndustry({ nationId: 'britain', week: 11, production: context.production, game: { factories: 5, fuel: 100, steel: 100, treasury: 100 }, stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, spendingLevel: 100, securityBudgetPercent: 100 });
  return { context, forecast };
}
function render(state: StaffDeliveryPledgeState = createStaffDeliveryPledgeState(), options = fixture()) {
  const onCreate = vi.fn(() => true);
  const before = JSON.stringify({ state, options });
  const html = renderToStaticMarkup(<StaffDeliveryPledgeBoard state={state} context={options.context} forecast={options.forecast} onCreate={onCreate} />);
  expect(onCreate).not.toHaveBeenCalled();
  expect(JSON.stringify({ state, options })).toBe(before);
  return html;
}
function pledgeState(metric: 'factory-completed' | 'national-available' = 'factory-completed') {
  const { context } = fixture();
  return createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { id: 'actual-pledge', expectedWeek: 10, staffId: context.staff[0].id, personId: context.staff[0].personId, lineId: 'rifle', metric, targetQuantity: 20, durationWeeks: 2 }, context).state;
}

describe('staff delivery pledge board', () => {
  it('lands on actual records without exposing another full creation form', () => {
    const html = render(pledgeState());
    expect(html).toContain('aria-label="실제 저장된 약속과 검증 기록"');
    expect(html).not.toContain('type="submit"'); expect(html).toContain('새 약속 작성');
  });
  it('keeps a clicked staff identity and does not silently select a successor', () => {
    const { context } = fixture(); const onCreate = vi.fn(() => true);
    const html = renderToStaticMarkup(<StaffDeliveryPledgeBoard state={createStaffDeliveryPledgeState()} context={context} initialOwner={{ staffId: context.staff[0].id, personId: 'departed-person' }} onCreate={onCreate} />);
    expect(html).toContain('후임에게 자동 연결하지 않습니다'); expect(html).toContain('value="" selected=""');
    expect(html).toContain('<button type="submit" disabled="">'); expect(onCreate).not.toHaveBeenCalled();
  });
  it('filters the staff shortcut by person identity and can offer all history', () => {
    const { context } = fixture();
    const html = renderToStaticMarkup(<StaffDeliveryPledgeBoard state={pledgeState()} context={context} initialOwner={{ staffId: context.staff[0].id, personId: 'different-person' }} onCreate={() => true} />);
    expect(html).toContain('선택 인물의 저장된 약속이 없습니다'); expect(html).toContain('전체 이행 기록 보기'); expect(html).not.toContain('약속 ID: actual-pledge');
  });
  it('links availability records to production and transport without executing either', () => {
    const { context } = fixture(); const onOpenProduction = vi.fn(); const onOpenLogistics = vi.fn();
    const html = renderToStaticMarkup(<StaffDeliveryPledgeBoard state={pledgeState('national-available')} context={context} onCreate={() => true} onOpenProduction={onOpenProduction} onOpenLogistics={onOpenLogistics} />);
    expect(html).toContain('생산 배정 확인'); expect(html).toContain('수송·도착 확인'); expect(onOpenProduction).not.toHaveBeenCalled(); expect(onOpenLogistics).not.toHaveBeenCalled();
  });
  it('does not render cross-domain controls without authority callbacks', () => {
    const html = render(pledgeState('national-available'));
    expect(html).not.toContain('생산 배정 확인'); expect(html).not.toContain('수송·도착 확인');
  });
  it('projects meeting check-ins only from real manageable current-nation commitments', () => {
    const { context } = fixture(); const state = pledgeState(); const onOpen = vi.fn(); const before = JSON.stringify(state);
    const html = renderToStaticMarkup(<StaffDeliveryCheckIn state={state} context={context} onOpen={onOpen} />);
    expect(html).toContain('진행 중 1건'); expect(html).toContain('제13주 검증'); expect(html).toContain(context.staff[0].name);
    expect(onOpen).not.toHaveBeenCalled(); expect(JSON.stringify(state)).toBe(before);
    expect(renderToStaticMarkup(<StaffDeliveryCheckIn state={state} context={{ ...context, manageableDepartments: [] }} onOpen={onOpen} />)).toBe('');
    expect(renderToStaticMarkup(<StaffDeliveryCheckIn state={state} context={{ ...context, nationId: 'korea' }} onOpen={onOpen} />)).toBe('');
  });
  it('shows real managed staff and lines without causing writes or promising gameplay rewards', () => {
    const options = fixture();
    const html = render(undefined, options);
    expect(html).toContain(options.context.staff[0].name);
    expect(html).toContain('국가안보보좌관');
    expect(html).not.toContain(options.context.staff[1].name);
    expect(html).toContain('보병 장비 생산선');
    expect(html).toContain('생성 비용 0');
    expect(html).toContain('정치력·사기 보상과 벌점 0');
    expect(html).toContain('생산·운송 명령이나 물량 예약이 아닙니다');
    expect(html).toContain('열람·입력·예측은 원래 게임 상태를 바꾸지 않습니다');
    expect(html).toContain('새 약속 작성');
    expect(html).not.toContain('aria-label="실제 저장된 약속과 검증 기록"');
  });

  it('distinguishes factory completion, national availability and old warehouse arrivals', () => {
    const html = render();
    expect(html).toContain('공장 생산 완료');
    expect(html).toContain('국가 가용 새 편입');
    expect(html).toContain('이전 창고 생산의 도착도 포함하며 미도착 창고 재고는 제외합니다');
    expect(html).toContain('같은 품목에 연결된 라인이 정확히 하나');
    expect(html).toContain('단순 환산 · 보장 아님');
    expect(render(pledgeState('national-available'))).toContain('특정 생산라인의 생산 묶음 출처를 증명하지 않습니다');
  });

  it('disables creation when industry authority is missing and does not invent a request button', () => {
    const options = fixture();
    options.context.industryMandate.mode = 'request';
    const html = render(undefined, options);
    expect(html).toContain('현재 산업 직접 결재권이 없습니다');
    expect(html).toContain('이 화면에는 상신·권한 위임 기능이 없습니다');
    expect(html).toContain('<button type="submit" disabled="">이 조건으로 약속 기록</button>');
    expect(html).not.toContain('권한을 요청합니다</button>');
  });

  it('does not seat or select absent staff and disables ambiguous line choices', () => {
    const options = fixture();
    options.context.staff = [];
    const html = render(undefined, options);
    expect(html).toContain('현재 재직하는 동일 담당자를 다시 선택하세요');
    expect(html).toContain('<button type="submit" disabled="">');
    options.context = { ...fixture().context, lineEquipment: [] };
    expect(render(undefined, options)).toContain('생산라인과 품목의 유일한 연결이 필요합니다');
  });

  it('labels form inputs and exposes two/four/eight week choices and keyboard-native controls', () => {
    const html = render();
    expect(html).toContain('직접 관리하는 실제 담당자');
    expect(html).toContain('목표 수량 · 게임 장비 단위');
    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('2주 · 제13주 검증');
    expect(html).toContain('4주 · 제15주 검증');
    expect(html).toContain('8주 · 제19주 검증');
    expect(html).toContain('aria-label="약속의 수량 지표"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('role="status"');
  });

  it('shows due dates as waiting until an actual weekly verification is persisted', () => {
    const options = fixture();
    const state = pledgeState();
    options.context.week = 12;
    const html = render(state, options);
    expect(html).toContain('기한 도착 · 주간 검증 기록 대기');
    expect(html).not.toContain('목표 미달</strong>');
    expect(html).not.toContain('목표 충족</strong>');
    const failed = advanceStaffDeliveryPledges(state, options.context, []);
    expect(render(failed.state, options)).toContain('목표 미달</strong>');
  });

  it('uses only persisted receipts and preserves departed owners rather than displaying the successor', () => {
    const options = fixture();
    const formerName = options.context.staff[0].name;
    let state = advanceStaffDeliveryPledges(pledgeState(), { ...options.context, week: 11 }, [{ id: 'actual-factory-11', nationId: 'britain', week: 11, equipmentKey: 'infantryEquipment', lineId: 'rifle', source: 'factory-completed', quantity: 9 }]).state;
    options.context.staff = options.context.staff.map((person, index) => index === 0 ? { ...person, personId: 'successor-person', name: '새 후임자' } : person);
    options.context.week = 11;
    state = normalizeStaffDeliveryPledges(state, options.context);
    const html = render(state, options);
    const records = html.split('aria-label="실제 저장된 약속과 검증 기록"')[1];
    expect(records).toContain(formerName);
    expect(records).not.toContain('새 후임자');
    expect(records).toContain('검증 불가');
    expect(records).toContain('actual-factory-11');
    expect(records).toContain('실제 영수증 1건');
    expect(records).toContain('후임자에게 자동 양도하지 않습니다');
  });

  it('never presents future saved receipts or future completion as current success', () => {
    const options = fixture();
    options.context.week = 11;
    const state = pledgeState();
    state.pledges[0].receipts = [{ id: 'future-evidence', nationId: 'britain', week: 12, equipmentKey: 'infantryEquipment', lineId: 'rifle', source: 'factory-completed', quantity: 20 }];
    state.pledges[0].status = 'succeeded'; state.pledges[0].resolvedWeek = 12;
    const html = render(state, options);
    expect(html).toContain('검증 불가');
    expect(html).not.toContain('목표 충족</strong>');
    expect(html).not.toContain('영수증 ID: future-evidence');
    expect(html).toContain('미래 영수증 1건을 제외');
  });

  it('labels stale forecasts as missing and keeps zero assigned production as an explicit zero forecast', () => {
    const options = fixture();
    options.forecast.week = 10;
    expect(render(undefined, options)).toContain('다음 주와 일치하는 생산 전망이 없습니다');
    options.forecast.week = 11;
    options.context.production = options.context.production.map((line) => ({ ...line, assigned: 0 }));
    options.forecast.perLine = [];
    const html = render(undefined, options);
    expect(html).toContain('현재 조건의 다음 주 예상</span><strong>0</strong>');
    expect(html).not.toContain('다음 주와 일치하는 생산 전망이 없습니다');
  });
});
