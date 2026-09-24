import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { RegionalLogisticsScene } from './RegionalLogisticsScene';
import { advanceRegionalTransportWeek, attributeRegionalIndustryReceipt, configureRegionalIndustry, createRegionalIndustryState, planRegionalShipment, type RegionalIndustryContext } from './regionalIndustry';
import type { Stockpile, Territory } from './types';

const territories: Territory[] = [
  { id: 'a', name: '출발 창고', x: 10, y: 20, neighbors: ['b'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
  { id: 'b', name: '도착 집하장', x: 30, y: 25, neighbors: ['a'], region: '지역', controller: 'allies', ownerId: 'britain', supply: 80, value: 1, terrain: '평야', siteType: 'city' },
];
const context: RegionalIndustryContext = { nationId: 'britain', week: 100, factories: 10, authorized: true, territories, playableTerritoryIds: ['a', 'b'] };
const stockpile: Stockpile = { infantryEquipment: 20, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 };
function fixture() {
  const configured = configureRegionalIndustry(createRegionalIndustryState('britain', 99), { mode: 'pilot', originTerritoryId: 'a', destinationTerritoryId: 'b', equipmentKey: 'infantryEquipment', allocatedFactories: 1 }, { ...context, week: 99 }).state;
  const staged = attributeRegionalIndustryReceipt(configured, { id: 'real-intake', nationId: 'britain', week: 100, stockpileDelta: stockpile }, context).state;
  return planRegionalShipment(staged, { id: 'real-shipment', quantity: 7 }, context).state;
}
function render(state = fixture(), ctx = context) {
  const onOpen = vi.fn();
  return { html: renderToStaticMarkup(<RegionalLogisticsScene state={state} context={ctx} onOpen={onOpen} />), onOpen };
}
describe('regional logistics scene', () => {
  it('shows a real reservation and stage without dispatching or mutating on render', () => {
    const state = fixture(); const before = structuredClone(state);
    const { html, onOpen } = render(state);
    expect(html).toContain('수송 관제판'); expect(html).toContain('보병 장비 7개');
    expect(html).toContain('출발 창고 → 도착 집하장'); expect(html).toContain('aria-current="step"');
    expect(html).toContain('최소 2회 주간 결산'); expect(html).toContain('실제 도로·철도 경로나 차량의 현재 위치가 아닙니다');
    expect(html).toContain('이 운송 기록 열기'); expect(html).not.toContain('progressbar');
    expect(state).toEqual(before); expect(onOpen).not.toHaveBeenCalled();
  });
  it('only reaches transit and delivered when the actual settlement engine changes state', () => {
    const moving = advanceRegionalTransportWeek(fixture(), { ...context, week: 101 });
    const movingHtml = render(moving.state, { ...context, week: 101 }).html;
    expect(movingHtml).toMatch(/aria-current="step"><div><svg[^]*?운송 중/);
    expect(movingHtml).toContain('최소 1회 주간 결산');
    const arrival = advanceRegionalTransportWeek(moving.state, { ...context, week: 102 });
    const arrivedHtml = render(arrival.state, { ...context, week: 102 }).html;
    expect(arrival.stockpileDelta.infantryEquipment).toBe(7);
    expect(arrivedHtml).toMatch(/aria-current="step"><div><svg[^]*?도착 확정/);
    expect(arrivedHtml).not.toContain('최소 0회');
    expect(arrivedHtml).toContain('이번 주 도착');
  });
  it('shows current route holds without promising arrival', () => {
    const { html } = render(fixture(), { ...context, playableTerritoryIds: ['a'] });
    expect(html).toContain('보류·재확인 사유'); expect(html).not.toContain('최소 2회 주간 결산');
    expect(html).toContain('노선·출발 조건 검토');
  });
  it('offers report navigation rather than direct commands to read-only roles', () => {
    const { html, onOpen } = render(fixture(), { ...context, authorized: false });
    expect(html).toContain('현재는 물류 보고 열람'); expect(html).toContain('권한·상신 확인');
    expect(html).not.toContain('>예약 취소<'); expect(html).not.toContain('>설정 결재<');
    expect(onOpen).not.toHaveBeenCalled();
  });
  it('does not invent a vehicle for an empty or quarantined account', () => {
    const state = createRegionalIndustryState('britain', 100);
    const empty = render(state).html;
    expect(empty).toContain('아직 지역 수송 기록이 없습니다'); expect(empty).not.toContain('aria-current="step"');
    state.quarantinedAccounts.britain = { warehouse: 'corrupt-original' };
    const corrupt = render(state).html;
    expect(corrupt).toContain('물량과 이동을 추정하지 않습니다');
    expect(corrupt).toContain('자료 확인 필요'); expect(corrupt).not.toContain('0건');
    expect(corrupt).not.toContain('집하 노선 검토하기'); expect(corrupt).not.toContain('<table');
  });
  it('does not leak another nation shipment or a future reservation into the scene', () => {
    const state = fixture();
    expect(render(state, { ...context, nationId: 'usa' }).html).not.toContain('보병 장비 7개');
    state.accounts.britain!.shipments[0].reservedWeek = 101;
    expect(render(state).html).not.toContain('보병 장비 7개');
  });
  it('labels cancellation as cancellation, never as a completed delivery', () => {
    const state = fixture(); state.accounts.britain!.shipments[0] = { ...state.accounts.britain!.shipments[0], status: 'cancelled', closedWeek: 100 };
    const { html } = render(state);
    expect(html).toContain('예약 취소'); expect(html).not.toContain('aria-current="step"');
    expect(html).not.toContain('최소 2회 주간 결산');
  });
});
