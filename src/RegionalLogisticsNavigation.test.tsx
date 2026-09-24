import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RegionalIndustryBoard, type RegionalIndustryBoardProps } from './RegionalIndustryBoard';
import { advanceRegionalTransportWeek, createRegionalIndustryState, type RegionalIndustryContext } from './regionalIndustry';
import type { Territory } from './types';
const territories: Territory[] = [
  { id: 'a', name: '창고 A', x: 10, y: 20, neighbors: ['b'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
  { id: 'b', name: '거점 B', x: 30, y: 25, neighbors: ['a'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
];
function props(): RegionalIndustryBoardProps {
  const state = createRegionalIndustryState('britain', 99);
  state.accounts.britain!.configuration = { mode: 'pilot', originTerritoryId: 'a', destinationTerritoryId: 'b', equipmentKey: 'infantryEquipment', allocatedFactories: 1 };
  state.accounts.britain!.shipments = ['first', 'requested'].map((id, index) => ({ id, quantity: index + 2, equipmentKey: 'infantryEquipment', originTerritoryId: 'a', destinationTerritoryId: 'b', status: 'reserved', reservedWeek: 100, remainingWeeks: 2, deliveredWeek: null, heldReason: null }));
  return { state, context: { nationId: 'britain', week: 100, factories: 10, authorized: true, territories, playableTerritoryIds: ['a', 'b'] }, nationalStockpile: { infantryEquipment: 100, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, onConfigure: vi.fn(), onPlanShipment: vi.fn(), onCancelReserved: vi.fn() };
}
const detail = (html: string) => html.match(/<article class="regional-selected-shipment"[\s\S]*?<\/article>/)?.[0] ?? '';
describe('logistics scene to command desk navigation', () => {
  it('opens the requested record without issuing an order', () => {
    const input = props(); const before = structuredClone(input.state);
    const html = renderToStaticMarkup(<RegionalIndustryBoard {...input} initialRequest={{ nationId: 'britain', view: 'records', shipmentId: 'requested' }} />);
    expect(html).toContain('class="regional-records-view"');
    expect(html).toContain('value="requested" selected=""');
    expect(detail(html)).toContain('보병 장비 3개'); expect(detail(html)).not.toContain('보병 장비 2개');
    expect(input.state).toEqual(before); expect(input.onCancelReserved).not.toHaveBeenCalled(); expect(input.onConfigure).not.toHaveBeenCalled();
  });
  it('does not silently substitute a different shipment for a stale requested ID', () => {
    const html = renderToStaticMarkup(<RegionalIndustryBoard {...props()} initialRequest={{ nationId: 'britain', view: 'records', shipmentId: 'removed' }} />);
    expect(detail(html)).toBe(''); expect(html).toContain('운송을 다시 선택하십시오');
    expect(html).not.toMatch(/aria-label="[^"]+ 예약 취소"/);
  });
  it('ignores an initial navigation request from a different nation', () => {
    const html = renderToStaticMarkup(<RegionalIndustryBoard {...props()} initialRequest={{ nationId: 'usa', view: 'records', shipmentId: 'requested' }} />);
    expect(html).toContain('class="regional-records-view" hidden=""');
    expect(html).toContain('value="first" selected=""');
  });
  it('omits future shipments from both the flow totals and record selector', () => {
    const input = props(); input.state.accounts.britain!.shipments.forEach((shipment) => { shipment.reservedWeek = 101; shipment.quantity = 98765; });
    const html = renderToStaticMarkup(<RegionalIndustryBoard {...input} />);
    expect(html).not.toContain('98,765'); expect(html).not.toContain('value="requested"');
    expect(html).toContain('02 · 출발 예약</small><strong>0개');
  });
  it('uses current blockers and explicitly identifies a recovered historical hold', () => {
    const input = props();
    const blockedContext: RegionalIndustryContext = { ...input.context, week: 101, playableTerritoryIds: ['a'] };
    const blocked = advanceRegionalTransportWeek(input.state, blockedContext).state;
    const blockedHtml = renderToStaticMarkup(<RegionalIndustryBoard {...input} state={blocked} context={blockedContext} />);
    expect(detail(blockedHtml)).toContain('현재 보류 조건:');
    const restored = renderToStaticMarkup(<RegionalIndustryBoard {...input} state={blocked} context={{ ...input.context, week: 101 }} />);
    expect(detail(restored)).not.toContain('현재 보류 조건:');
    expect(detail(restored)).toContain('지난 결산 보류 기록:');
    expect(detail(restored)).toContain('재개 여부는 다음 결산에서 확정');
  });
});
