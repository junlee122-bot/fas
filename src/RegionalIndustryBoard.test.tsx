import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { getRegionalIndustryDraftBasis, getRegionalShipmentRecordLabels, RegionalIndustryBoard, resolveRegionalIndustryDraft } from './RegionalIndustryBoard';
import { attributeRegionalIndustryReceipt, configureRegionalIndustry, createRegionalIndustryState, normalizeRegionalIndustry, planRegionalShipment, type RegionalIndustryContext, type RegionalIndustryState } from './regionalIndustry';
import type { Stockpile, Territory } from './types';

const territories: Territory[] = [
  { id: 'a', name: '직접 소유 출발지', x: 10, y: 20, neighbors: ['b'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
  { id: 'b', name: '직접 소유 도착지', x: 30, y: 25, neighbors: ['a'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
  { id: 'foreign', name: '동맹국 소유 제외', x: 50, y: 25, neighbors: ['a'], region: '지역', controller: 'allies', ownerId: 'usa', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
];
const context: RegionalIndustryContext = { nationId: 'britain', week: 100, factories: 10, authorized: true, territories, playableTerritoryIds: ['a', 'b', 'foreign'] };
const stockpile: Stockpile = { infantryEquipment: 100, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 };
const config = { mode: 'pilot' as const, originTerritoryId: 'a', destinationTerritoryId: 'b', equipmentKey: 'infantryEquipment' as const, allocatedFactories: 1 };
function render(state = createRegionalIndustryState('britain', 100), ctx = context) {
  const onConfigure = vi.fn(); const onPlanShipment = vi.fn(); const onCancelReserved = vi.fn();
  const html = renderToStaticMarkup(<RegionalIndustryBoard state={state} context={ctx} nationalStockpile={stockpile} onConfigure={onConfigure} onPlanShipment={onPlanShipment} onCancelReserved={onCancelReserved} />);
  return { html, onConfigure, onPlanShipment, onCancelReserved };
}
describe('regional warehouse desk', () => {
  it('is explicitly opt-in and cannot create cargo or commands by rendering', () => {
    const state = createRegionalIndustryState('britain', 100); const before = structuredClone(state);
    const { html, onConfigure, onPlanShipment, onCancelReserved } = render(state);
    expect(html).toContain('국가 비축 모드');
    expect(html).toContain('선택형 시범은 꺼져 있습니다');
    expect(html).toContain('기존 국가 비축은 계속 즉시 사용');
    expect(html).not.toContain('동맹국 소유 제외');
    expect(html).not.toContain('value="convoys"');
    expect(onConfigure).not.toHaveBeenCalled(); expect(onPlanShipment).not.toHaveBeenCalled(); expect(onCancelReserved).not.toHaveBeenCalled();
    expect(state).toEqual(before);
  });

  it('distinguishes staged goods from immediately usable stocks and shows real coordinate endpoints', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    const state = attributeRegionalIndustryReceipt(pilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 35 } }, { ...context, week: 101 }).state;
    const { html } = render(state, { ...context, week: 101 });
    expect(html).toContain('국가 즉시 사용 가능</dt><dd>100');
    expect(html).toContain('출발 창고 미예약</dt><dd>35');
    expect(html).toContain('국가 총보유</dt><dd>135');
    expect(html).toContain('x1="10" y1="20" x2="30" y2="25"');
    expect(html).toContain('역사적 철도·도로를 확인한 표시가 아닙니다');
    expect(html).toContain('전략지도 인접 연결의 추상 수송 시범');
    expect(html).toContain('운송 추가 비용 모델은 없으며 국고를 차감하지 않습니다');
    expect(html).toContain('아직 확정 도착 영수증이 없습니다');
    expect(html).toContain('신규 집하 중지');
  });

  it('disables configuration and dispatch controls without direct authority', () => {
    const state = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    const { html } = render(state, { ...context, authorized: false });
    expect(html).toContain('<fieldset disabled=""');
    expect(html).toContain('직접 집행권이 없어 열람만 가능합니다');
    expect(html).toMatch(/disabled=""[^>]*>신규 집하 중지/);
    expect(html).toMatch(/disabled=""[^>]*>출발 예약/);
  });

  it('keeps corrupted raw accounts quarantined and explains export recovery instead of invented quantities', () => {
    const invalid = { ...createRegionalIndustryState('britain', 100), accounts: { britain: { warehouse: { tanks: 'bad' } } } };
    const state: RegionalIndustryState = normalizeRegionalIndustry(invalid, 'britain', 100);
    const { html } = render(state);
    expect(html).toContain('원본은 격리 보존하며 수량을 추정하지 않습니다');
    expect(html).toContain('저장을 내보내 복구하기 전');
    expect(html).toContain('새 납품은 국가 비축으로 보냅니다');
    expect(html).toContain('<fieldset disabled=""');
  });

  it('shows real per-week reservation capacity and a qualified warehouse drain time, not automatic transport', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    const state = attributeRegionalIndustryReceipt(pilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 1152 } }, { ...context, week: 101 }).state;
    const { html, onPlanShipment } = render(state, { ...context, week: 101 });
    expect(html).toContain('이번 주 예약 가능 20개');
    expect(html).toContain('창고 전량 출발 최소 58주 + 마지막 출발 후 운송 1주');
    expect(html).toContain('국가 가용까지 최소 59주');
    expect(html).toContain('매주 가능한 물량을 직접 예약한다는 최소치');
    expect(html).toContain('자동 예약의 낮은 주당 상한·창고 최소잔량은 전량 처리를 늦추거나 잔량을 남깁니다');
    expect(html).toContain('신규 집하 중지’ 후 기존 물량부터 예약');
    expect(html).toContain('동일 경로·품목의 귀속 역량과 자동 예약 설정은 지금도 조정할 수 있습니다');
    expect(onPlanShipment).not.toHaveBeenCalled();
    const reserved = planRegionalShipment(state, { id: 'partial-reservation', quantity: 5 }, { ...context, week: 101 });
    expect(render(reserved.state, { ...context, week: 101 }).html).toContain('이번 주 예약 가능 15개');
  });

  it('uses equipment cargo weight and suppresses time promises when material cannot depart', () => {
    const truckPilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), { ...config, equipmentKey: 'trucks' }, context).state;
    const state = attributeRegionalIndustryReceipt(truckPilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 0, trucks: 12 } }, { ...context, week: 101 }).state;
    const html = render(state, { ...context, week: 101 }).html;
    expect(html).toContain('이번 주 예약 가능 6개');
    expect(html).toContain('창고 전량 출발 최소 2주 + 마지막 출발 후 운송 1주');
    const blocked = render(state, { ...context, week: 101, factories: 0 }).html;
    expect(blocked).toContain('이번 주 예약 가능 0개');
    expect(blocked).toContain('창고 처리 기간을 확정할 수 없습니다');
    expect(blocked).not.toContain('Infinity'); expect(blocked).not.toContain('NaN');
    expect(blocked).not.toContain('창고 전량 출발 최소');
  });

  it('warns that a reservation exceeding reduced capacity must be cancelled and split, not shipped automatically', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), { ...config, allocatedFactories: 2 }, context).state;
    const received = attributeRegionalIndustryReceipt(pilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 35 } }, { ...context, week: 101 }).state;
    const reserved = planRegionalShipment(received, { id: 'oversized', quantity: 30 }, { ...context, week: 101 }).state;
    const html = render(reserved, { ...context, week: 101, factories: 1 }).html;
    expect(html).toContain('이번 주 예약 가능 0개');
    expect(html).toContain('창고 처리 기간을 확정할 수 없습니다');
    expect(html).toContain('해당 예약을 취소한 뒤 현재 용량에 맞춰 나누어 예약');
    expect(html).not.toContain('창고 전량 출발 최소');
  });

  it('shows explicitly approved auto limits, current-stock preview and independent stop without issuing commands by render', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), { ...config, dispatch: { mode: 'automatic', maxItemsPerWeek: 7, minimumWarehouse: 10 } }, context).state;
    const state = attributeRegionalIndustryReceipt(pilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 35 } }, { ...context, week: 101 }).state;
    const { html, onConfigure, onPlanShipment } = render(state, { ...context, week: 101 });
    expect(html).toContain('현재 창고 기준 자동 예약 가능 7개');
    expect(html).toContain('자동 예약 주당 7개 / 창고 최소 10개');
    expect(html).toContain('자동 예약 중지');
    expect(html).toContain('입력만으로는 실행되지 않습니다');
    expect(html).toContain('기존 운송 진행 → 새 생산 집하 → 자동 출발 예약');
    expect(html).toContain('중지해도 이미 승인된 예약과 운송은 유지됩니다');
    expect(html).toContain('<fieldset class="regional-dispatch-config">');
    expect(onConfigure).not.toHaveBeenCalled();
    expect(onPlanShipment).not.toHaveBeenCalled();
  });

  it('explains authority holds while leaving only an existing automatic order revocation available', () => {
    const state = configureRegionalIndustry(createRegionalIndustryState('britain', 100), { ...config, dispatch: { mode: 'automatic', maxItemsPerWeek: 7, minimumWarehouse: 0 } }, context).state;
    const { html } = render(state, { ...context, authorized: false });
    expect(html).toContain('자동 예약 보류: 지역 산업 직접 집행권이 필요합니다');
    expect(html).toMatch(/<button type="button">자동 예약 중지<\/button>/);
    expect(html).toMatch(/disabled=""[^>]*>설정 결재/);
    expect(html).toMatch(/disabled=""[^>]*>출발 예약/);
  });
  it('starts with the approved four-stage overview, not an open configuration or shipping form', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    const received = attributeRegionalIndustryReceipt(pilot, { id: 'britain:101', nationId: 'britain', week: 101, stockpileDelta: { ...stockpile, infantryEquipment: 35 } }, { ...context, week: 101 }).state;
    const state = planRegionalShipment(received, { id: 'reserved-real', quantity: 5 }, { ...context, week: 101 }).state;
    const before = structuredClone(state);
    const { html, onConfigure, onPlanShipment, onCancelReserved } = render(state, { ...context, week: 101 });
    expect(html).toContain('class="regional-overview">');
    expect(html).toContain('class="regional-configuration-view" hidden=""');
    expect(html).toContain('class="regional-dispatch-view" hidden=""');
    expect(html).toContain('class="regional-records-view" hidden=""');
    const flow = html.match(/<div class="regional-flow-stages"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(flow).toContain('출발 창고</small><strong>30개');
    expect(flow).toContain('출발 예약</small><strong>5개');
    expect(flow).toContain('수송 중</small><strong>0개');
    expect(flow).toContain('최근 도착 영수증</small><strong>기록 없음');
    expect(html).toContain('aria-label="제102주 · 보병 장비 5개 · 출발 예약 · 직접 소유 도착지 운송 상세"');
    expect(html).toContain('aria-label="제102주 · 보병 장비 5개 · 출발 예약 · 직접 소유 도착지 예약 취소"');
    expect(onConfigure).not.toHaveBeenCalled(); expect(onPlanShipment).not.toHaveBeenCalled(); expect(onCancelReserved).not.toHaveBeenCalled();
    expect(state).toEqual(before);
  });
  it('invalidates configuration drafts on week, nation, permission, approved route, capacity and geographic eligibility changes', () => {
    const state = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    const basis = getRegionalIndustryDraftBasis(state, context);
    const draft = { basis, configuration: { ...config, allocatedFactories: 2 } };
    expect(resolveRegionalIndustryDraft(draft, basis, config)).toEqual({ proposal: draft.configuration, stale: false });
    const changedContexts: RegionalIndustryContext[] = [{ ...context, week: 101 }, { ...context, nationId: 'germany' }, { ...context, authorized: false }, { ...context, factories: 0 }, { ...context, playableTerritoryIds: ['a'] }];
    for (const changed of changedContexts) expect(resolveRegionalIndustryDraft(draft, getRegionalIndustryDraftBasis(state, changed), config)).toEqual({ proposal: config, stale: true });
    const changed = configureRegionalIndustry(state, { ...config, allocatedFactories: 3 }, context).state;
    expect(resolveRegionalIndustryDraft(draft, getRegionalIndustryDraftBasis(changed, context), config).stale).toBe(true);
    expect(draft.configuration.allocatedFactories).toBe(2);
  });
  it('retains cancelled and completed historical shipments after switching back to national stock mode', () => {
    const state = createRegionalIndustryState('britain', 100);
    state.accounts.britain!.shipments = [{ id: 'cancelled-real', equipmentKey: 'infantryEquipment', quantity: 7, originTerritoryId: 'a', destinationTerritoryId: 'b', status: 'cancelled', reservedWeek: 96, remainingWeeks: 2, deliveredWeek: null, closedWeek: 97, heldReason: null }];
    const { html, onCancelReserved } = render(state);
    expect(html).toContain('운송 기록 선택');
    expect(html).toContain('aria-label="제97주 · 보병 장비 7개 · 예약 취소됨 · 직접 소유 도착지 운송 상세"');
    expect(html).toContain('예약 취소됨 · 도착 실적 아님');
    expect(html).not.toMatch(/aria-label="[^"]+ 예약 취소"/);
    expect(onCancelReserved).not.toHaveBeenCalled();
  });
  it('does not show another nation or future receipt as the current route arrival', () => {
    const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state;
    for (const receipt of [
      { id: 'wrong-nation', nationId: 'germany' as const, week: 99 },
      { id: 'future-receipt', nationId: 'britain' as const, week: 101 },
    ]) {
      const state = structuredClone(pilot);
      state.accounts.britain!.lastDelivery = { ...receipt, shipmentId: 'unverified', destinationTerritoryId: 'b', equipmentKey: 'infantryEquipment', quantity: 999 };
      const { html } = render(state);
      expect(html).not.toContain('999');
      expect(html).toContain('아직 확정 도착 영수증이 없습니다');
    }
  });
  it('uses readable shipment names and keeps raw tracing identifiers only in a closed disclosure', () => {
    const shipmentId = 'britain:shipment:8d6709f5-0000-4000-8000-aaaabbbbcccc';
    const receiptId = 'britain:delivery:8d6709f5-0000-4000-8000-ddddeeeeffff';
    const state = createRegionalIndustryState('britain', 100);
    state.accounts.britain!.shipments = [{ id: shipmentId, equipmentKey: 'infantryEquipment', quantity: 7, originTerritoryId: 'a', destinationTerritoryId: 'b', status: 'delivered', reservedWeek: 96, remainingWeeks: 0, deliveredWeek: 98, closedWeek: 98, heldReason: null }];
    state.accounts.britain!.lastDelivery = { id: receiptId, shipmentId, nationId: 'britain', week: 98, destinationTerritoryId: 'b', equipmentKey: 'infantryEquipment', quantity: 7 };
    const { html, onCancelReserved, onPlanShipment } = render(state);
    const label = '제97주 · 보병 장비 7개 · 도착 완료 · 직접 소유 도착지';
    expect(html).toContain(`value="${shipmentId}" selected="">${label}</option>`);
    expect(html).toContain(`aria-label="${label} 운송 상세"`);
    const tracking = html.match(/<details class="regional-detail"><summary>운송 추적 번호<\/summary>[\s\S]*?<\/details>/)?.[0] ?? '';
    expect(tracking).toContain(shipmentId); expect(tracking).toContain(receiptId); expect(tracking).not.toContain(' open');
    const outsideTracking = html.replace(tracking, '').replace(`value="${shipmentId}"`, '');
    expect(outsideTracking).not.toContain(shipmentId); expect(outsideTracking).not.toContain(receiptId);
    expect(html).toContain('현재 설정이 아닌 이 운송에 기록된 출발·도착지입니다');
    expect(onCancelReserved).not.toHaveBeenCalled(); expect(onPlanShipment).not.toHaveBeenCalled();
  });
  it('disambiguates equal readable labels with record numbers, without shortening or changing command IDs', () => {
    const state = createRegionalIndustryState('britain', 100);
    const shipment = { id: 'first-full-id', equipmentKey: 'infantryEquipment' as const, quantity: 7, originTerritoryId: 'a', destinationTerritoryId: 'b', status: 'reserved' as const, reservedWeek: 96, remainingWeeks: 2, deliveredWeek: null, heldReason: null };
    state.accounts.britain!.shipments = [shipment, { ...shipment, id: 'second-full-id' }];
    const labels = getRegionalShipmentRecordLabels(state.accounts.britain!.shipments, territories);
    expect(labels.get('first-full-id')).toBe('제97주 · 보병 장비 7개 · 출발 예약 · 직접 소유 도착지 · 기록 1');
    expect(labels.get('second-full-id')).toBe('제97주 · 보병 장비 7개 · 출발 예약 · 직접 소유 도착지 · 기록 2');
    expect(getRegionalShipmentRecordLabels([{ ...shipment, destinationTerritoryId: 'missing' }], territories).get(shipment.id)).toContain('도착지 미상');
    const { html } = render(state);
    expect(html).toContain('value="first-full-id"'); expect(html).toContain('value="second-full-id"');
    expect(html).toContain(`aria-label="${labels.get('first-full-id')} 예약 취소"`);
  });
});
