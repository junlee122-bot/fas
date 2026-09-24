import { describe, expect, it } from 'vitest';
import {
  advanceRegionalTransportWeek,
  attributeRegionalIndustryReceipt,
  cancelRegionalReservedShipment,
  configureRegionalIndustry,
  createRegionalIndustryState,
  planRegionalShipment,
  type RegionalIndustryConfiguration,
  type RegionalIndustryContext,
  type RegionalIndustryState,
  type RegionalShipment,
} from './regionalIndustry';
import {
  buildRegionalLogisticsPresentation,
  resolveRegionalLogisticsSelection,
} from './regionalLogisticsPresentation';
import type { Stockpile, Territory } from './types';

const territory = (id: string, name: string, neighbors: string[]): Territory => ({
  id, name, x: 10, y: 40, region: '시험 지역', controller: 'allies', ownerId: 'britain',
  value: 1, supply: 80, terrain: '평야', siteType: 'city', neighbors,
});
const territories = [territory('origin', '원래 출발지', ['destination']), territory('destination', '원래 도착지', ['origin']), territory('remote', '새 설정 지역', [])];
const context: RegionalIndustryContext = {
  nationId: 'britain', week: 100, territories, playableTerritoryIds: territories.map((item) => item.id),
  factories: 10, authorized: true, controllingFaction: 'allies',
};
const configuration: RegionalIndustryConfiguration = {
  mode: 'pilot', originTerritoryId: 'origin', destinationTerritoryId: 'destination',
  equipmentKey: 'infantryEquipment', allocatedFactories: 1,
};
const emptyStockpile: Stockpile = { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 };
const at = (week: number, overrides: Partial<RegionalIndustryContext> = {}): RegionalIndustryContext => ({ ...context, week, ...overrides });
function received(quantity = 35, allocatedFactories = 1): RegionalIndustryState {
  const pilot = configureRegionalIndustry(createRegionalIndustryState('britain', 100), { ...configuration, allocatedFactories }, context);
  expect(pilot.applied).toBe(true);
  return attributeRegionalIndustryReceipt(pilot.state, {
    id: 'source:101', week: 101, nationId: 'britain', stockpileDelta: { ...emptyStockpile, infantryEquipment: quantity },
  }, at(101)).state;
}
function reserved(quantity = 20, inventory = 35): RegionalIndustryState {
  const result = planRegionalShipment(received(inventory), { id: 'shipment-a', quantity }, at(101));
  expect(result.applied).toBe(true);
  return result.state;
}
function freezeDeep<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value);
    Object.values(value).forEach((nested) => freezeDeep(nested));
  }
  return value;
}

describe('regional logistics read-only presentation', () => {
  it('does not invent shipments or goods for an empty or absent current account', () => {
    const state = createRegionalIndustryState('britain', 100);
    const national = buildRegionalLogisticsPresentation(state, context);
    expect(national).toMatchObject({ nationKey: 'britain', week: 100, rows: [], totals: [], nextAction: 'configure', quarantined: false });
    expect(buildRegionalLogisticsPresentation(state, { ...context, nationId: 'usa' }).rows).toEqual([]);
    expect(buildRegionalLogisticsPresentation(state, { ...context, nationId: 'usa' }).totals).toEqual([]);
  });

  it('does not mutate state, configuration, records, inventory, context, or territory ordering', () => {
    const state = reserved();
    const snapshot = structuredClone(state);
    const ctx = at(101);
    const contextSnapshot = structuredClone(ctx);
    freezeDeep(state);
    freezeDeep(ctx);
    const model = buildRegionalLogisticsPresentation(state, ctx);
    model.rows[0].quantity = 999;
    model.totals[0].warehouse = 999;
    expect(state).toEqual(snapshot);
    expect(ctx).toEqual(contextSnapshot);
    expect(buildRegionalLogisticsPresentation(state, ctx).rows[0].quantity).toBe(20);
    expect(buildRegionalLogisticsPresentation(state, ctx).totals[0].warehouse).toBe(15);
  });

  it('shows real reserved, in-transit and delivered stages only after engine settlement', () => {
    const start = reserved();
    const initial = buildRegionalLogisticsPresentation(start, at(101));
    expect(initial.rows[0]).toMatchObject({ status: 'reserved', quantity: 20, equipmentLabel: '보병 장비', stageIndex: 0, completedSteps: 0, remainingSteps: 2, earliestArrivalSteps: 2, deliveredWeek: null });
    expect(initial.rows[0].arrivalCondition).toContain('도착은 보장되지 않습니다');
    expect(initial.totals).toEqual([{ equipmentKey: 'infantryEquipment', equipmentLabel: '보병 장비', warehouse: 15, reserved: 20, inTransit: 0, deliveredThisWeek: 0 }]);

    const sameWeek = advanceRegionalTransportWeek(start, at(101));
    expect(buildRegionalLogisticsPresentation(sameWeek.state, at(101)).rows[0].status).toBe('reserved');
    const moving = advanceRegionalTransportWeek(sameWeek.state, at(102));
    const transit = buildRegionalLogisticsPresentation(moving.state, at(102));
    expect(transit.rows[0]).toMatchObject({ status: 'in-transit', stageIndex: 1, completedSteps: 1, remainingSteps: 1, earliestArrivalSteps: 1, reservedWeek: 101 });
    expect(transit.totals[0]).toMatchObject({ reserved: 0, inTransit: 20, deliveredThisWeek: 0 });

    const arrived = advanceRegionalTransportWeek(moving.state, at(103));
    const delivered = buildRegionalLogisticsPresentation(arrived.state, at(103));
    expect(arrived.stockpileDelta.infantryEquipment).toBe(20);
    expect(delivered.rows[0]).toMatchObject({ status: 'delivered', stageIndex: 2, completedSteps: 2, remainingSteps: 0, earliestArrivalSteps: null, deliveredWeek: 103 });
    expect(delivered.rows[0].summary).toBe('도착 완료 · 제104주 국가 비축 편입');
    expect(delivered.totals[0]).toMatchObject({ reserved: 0, inTransit: 0, deliveredThisWeek: 20 });
    expect(buildRegionalLogisticsPresentation(arrived.state, at(104)).totals[0].deliveredThisWeek).toBe(0);
  });

  it('counts completed settlement steps, never calendar time or an inferred departure date', () => {
    const jumped = advanceRegionalTransportWeek(reserved(), at(1000));
    const model = buildRegionalLogisticsPresentation(jumped.state, at(1000));
    expect(model.rows[0]).toMatchObject({ reservedWeek: 101, completedSteps: 1, remainingSteps: 1, earliestArrivalSteps: 1 });
    expect(model.rows[0]).not.toHaveProperty('departureWeek');
    expect(model.rows[0]).not.toHaveProperty('position');
    expect(model.summary).toContain('주간 결산 단계');
  });

  it('explains current route loss before settlement and distinguishes recorded holds after restoration', () => {
    const moving = advanceRegionalTransportWeek(reserved(), at(102));
    const lost = at(103, { territories: territories.map((item) => item.id === 'destination' ? { ...item, controller: 'axis' as const } : item) });
    const beforeSettlement = buildRegionalLogisticsPresentation(moving.state, lost);
    expect(beforeSettlement.rows[0].holdReason).toContain('소유·통제');
    expect(beforeSettlement.rows[0].recordedHoldReason).toBeNull();
    expect(beforeSettlement.rows[0].earliestArrivalSteps).toBeNull();

    const held = advanceRegionalTransportWeek(moving.state, lost);
    const heldView = buildRegionalLogisticsPresentation(held.state, lost);
    expect(heldView.rows[0]).toMatchObject({ status: 'in-transit', completedSteps: 1, remainingSteps: 1, nextAction: 'configure' });
    expect(heldView.rows[0].recordedHoldReason).toContain('소유·통제');
    const restored = buildRegionalLogisticsPresentation(held.state, at(103));
    expect(restored.rows[0]).toMatchObject({ holdReason: null, currentBlocker: null, earliestArrivalSteps: 1 });
    expect(restored.rows[0].recordedHoldReason).toContain('소유·통제');
    const arrived = advanceRegionalTransportWeek(held.state, at(104));
    expect(buildRegionalLogisticsPresentation(arrived.state, at(104)).rows[0].status).toBe('delivered');
  });

  it('applies lost departure capacity only to reserved cargo, not already moving shipments', () => {
    const moving = advanceRegionalTransportWeek(reserved(), at(102)).state;
    const queued = planRegionalShipment(moving, { id: 'shipment-b', quantity: 10 }, at(102)).state;
    const stopped = configureRegionalIndustry(queued, { ...configuration, allocatedFactories: 0 }, at(102));
    expect(stopped.applied).toBe(true);
    const view = buildRegionalLogisticsPresentation(stopped.state, at(102, { factories: 0, authorized: false }));
    expect(view.rows.map((row) => row.id)).toEqual(['shipment-b', 'shipment-a']);
    expect(view.rows[0].holdReason).toContain('출발 용량');
    expect(view.rows[0].earliestArrivalSteps).toBeNull();
    expect(view.rows[1]).toMatchObject({ status: 'in-transit', holdReason: null, earliestArrivalSteps: 1 });
    const advanced = advanceRegionalTransportWeek(stopped.state, at(103, { factories: 0, authorized: false }));
    const after = buildRegionalLogisticsPresentation(advanced.state, at(103, { factories: 0, authorized: false }));
    expect(after.rows.find((row) => row.id === 'shipment-a')?.status).toBe('delivered');
    expect(after.rows.find((row) => row.id === 'shipment-b')?.status).toBe('reserved');
  });

  it('mirrors departure ordering and lets a smaller reservation use capacity skipped by an oversized one', () => {
    let state = received(60, 2);
    state = planRegionalShipment(state, { id: 'a-large', quantity: 25 }, at(101)).state;
    state = planRegionalShipment(state, { id: 'b-small', quantity: 15 }, at(101)).state;
    const ctx = at(102, { factories: 1 });
    const before = buildRegionalLogisticsPresentation(state, ctx);
    expect(before.rows.find((row) => row.id === 'a-large')?.holdReason).toContain('출발 용량');
    expect(before.rows.find((row) => row.id === 'b-small')?.holdReason).toBeNull();
    const advanced = advanceRegionalTransportWeek(state, ctx);
    expect(advanced.state.accounts.britain!.shipments.map((shipment) => shipment.status)).toEqual(['reserved', 'in-transit']);
  });

  it('uses each shipment’s own endpoints and equipment rather than current configuration', () => {
    const state = reserved();
    state.accounts.britain!.configuration = { ...configuration, originTerritoryId: 'remote', destinationTerritoryId: 'remote', equipmentKey: 'trucks' };
    const row = buildRegionalLogisticsPresentation(state, at(101)).rows[0];
    expect(row).toMatchObject({ originTerritoryId: 'origin', destinationTerritoryId: 'destination', originName: '원래 출발지', destinationName: '원래 도착지', equipmentKey: 'infantryEquipment', equipmentLabel: '보병 장비', quantity: 20, holdReason: null });
  });

  it('shows unknown endpoint identity and no arrival estimate when route data is missing', () => {
    const row = buildRegionalLogisticsPresentation(reserved(), at(101, { territories: [], playableTerritoryIds: [] })).rows[0];
    expect(row.originName).toContain('origin');
    expect(row.destinationName).toContain('destination');
    expect(row.currentBlocker).toContain('지역 두 곳');
    expect(row.earliestArrivalSteps).toBeNull();
    expect(row.quantity).toBe(20);
  });

  it('keeps terminal history in national mode without applying current route or capacity problems', () => {
    const moving = advanceRegionalTransportWeek(reserved(20, 20), at(102));
    const arrived = advanceRegionalTransportWeek(moving.state, at(103));
    const national = configureRegionalIndustry(arrived.state, { ...configuration, mode: 'national', originTerritoryId: 'remote', destinationTerritoryId: '', equipmentKey: 'trucks' }, at(103));
    expect(national.applied).toBe(true);
    const view = buildRegionalLogisticsPresentation(national.state, at(103, { territories: [], factories: 0 }));
    expect(view.rows[0]).toMatchObject({ status: 'delivered', holdReason: null, currentBlocker: null, recordedHoldReason: null, nextAction: 'records', originTerritoryId: 'origin', destinationTerritoryId: 'destination' });
    expect(view.nextAction).toBe('records');
    expect(view.totals[0]).toMatchObject({ equipmentKey: 'infantryEquipment', deliveredThisWeek: 20 });
  });

  it('represents cancellation as a return to warehouse, not a delivery or moving stage', () => {
    const cancelled = cancelRegionalReservedShipment(reserved(), 'shipment-a', at(101));
    const view = buildRegionalLogisticsPresentation(cancelled.state, at(101, { territories: [], factories: 0 }));
    expect(view.rows[0]).toMatchObject({ status: 'cancelled', stageIndex: null, remainingSteps: null, completedSteps: null, earliestArrivalSteps: null, holdReason: null });
    expect(view.totals[0]).toMatchObject({ warehouse: 35, reserved: 0, inTransit: 0, deliveredThisWeek: 0 });
  });

  it('does not display fallback amounts or real-looking shipments from a quarantined account', () => {
    const state = reserved();
    state.quarantinedAccounts.britain = { warehouse: 'unreadable original goods', shipments: [{ quantity: 999 }] };
    const before = structuredClone(state);
    const view = buildRegionalLogisticsPresentation(state, at(101));
    expect(view).toMatchObject({ quarantined: true, rows: [], totals: [], nextAction: 'records' });
    expect(view.summary).toContain('추정하지 않습니다');
    expect(state).toEqual(before);
  });

  it('ignores future reservations and terminal records without back-projecting their earlier state', () => {
    const state = reserved();
    const base = state.accounts.britain!.shipments[0];
    state.accounts.britain!.shipments.push(
      { ...base, id: 'future-reservation', reservedWeek: 105 },
      { ...base, id: 'future-arrival', status: 'delivered', remainingWeeks: 0, deliveredWeek: 105, closedWeek: 105 },
      { ...base, id: 'future-cancel', status: 'cancelled', closedWeek: 105 },
    );
    const view = buildRegionalLogisticsPresentation(state, at(101));
    expect(view.rows.map((row) => row.id)).toEqual(['shipment-a']);
    expect(view.totals[0]).toMatchObject({ reserved: 20, deliveredThisWeek: 0 });
  });

  it('does not create current-week arrivals from future, foreign, or orphan lastDelivery receipts', () => {
    const state = reserved();
    for (const receipt of [
      { nationId: 'usa' as const, week: 101 },
      { nationId: 'britain' as const, week: 200 },
      { nationId: 'britain' as const, week: 101 },
    ]) {
      state.accounts.britain!.lastDelivery = { id: 'untrusted-arrival', shipmentId: 'no-such-shipment', destinationTerritoryId: 'destination', equipmentKey: 'tanks', quantity: 999, ...receipt };
      const view = buildRegionalLogisticsPresentation(state, at(101));
      expect(view.rows.map((row) => row.id)).toEqual(['shipment-a']);
      expect(view.totals).toHaveLength(1);
      expect(view.totals[0].deliveredThisWeek).toBe(0);
    }
  });

  it('keeps equipment totals separate and includes every actual arrival this week', () => {
    const state = reserved();
    const base = state.accounts.britain!.shipments[0];
    state.accounts.britain!.warehouse.tanks = 3;
    state.accounts.britain!.shipments.push(
      { ...base, id: 'infantry-arrival', status: 'delivered', quantity: 7, remainingWeeks: 0, deliveredWeek: 103, closedWeek: 103 },
      { ...base, id: 'tank-arrival', status: 'delivered', equipmentKey: 'tanks', quantity: 2, remainingWeeks: 0, deliveredWeek: 103, closedWeek: 103 },
      { ...base, id: 'old-tank-arrival', status: 'delivered', equipmentKey: 'tanks', quantity: 4, remainingWeeks: 0, deliveredWeek: 102, closedWeek: 102 },
    );
    const view = buildRegionalLogisticsPresentation(state, at(103));
    expect(view.totals).toEqual([
      { equipmentKey: 'infantryEquipment', equipmentLabel: '보병 장비', warehouse: 15, reserved: 20, inTransit: 0, deliveredThisWeek: 7 },
      { equipmentKey: 'tanks', equipmentLabel: '전차', warehouse: 3, reserved: 0, inTransit: 0, deliveredThisWeek: 2 },
    ]);
    expect(view).not.toHaveProperty('totalQuantity');
  });

  it('orders current held cargo, moving cargo, reservations, then most recent terminal records', () => {
    const state = reserved();
    const base = state.accounts.britain!.shipments[0];
    const entries: RegionalShipment[] = [
      { ...base, id: 'old-arrival', status: 'delivered', remainingWeeks: 0, deliveredWeek: 102, closedWeek: 102 },
      { ...base, id: 'reserved' },
      { ...base, id: 'moving', status: 'in-transit', remainingWeeks: 1 },
      { ...base, id: 'recent-cancel', status: 'cancelled', closedWeek: 104 },
      { ...base, id: 'held', destinationTerritoryId: 'remote' },
    ];
    state.accounts.britain!.shipments = entries;
    const view = buildRegionalLogisticsPresentation(state, at(104));
    expect(view.rows.map((row) => row.id)).toEqual(['held', 'moving', 'reserved', 'recent-cancel', 'old-arrival']);
    expect(view.nextAction).toBe('configure');
  });

  it('resolves explicit selection by both shipment ID and nation and rejects stale selection', () => {
    const state = reserved();
    state.accounts.usa = structuredClone(state.accounts.britain!);
    const british = buildRegionalLogisticsPresentation(state, at(101));
    const american = buildRegionalLogisticsPresentation(state, at(101, { nationId: 'usa' }));
    const selected = { nationKey: 'britain' as const, shipmentId: 'shipment-a' };
    expect(resolveRegionalLogisticsSelection(british, selected)).toBe(british.rows[0]);
    expect(resolveRegionalLogisticsSelection(american, selected)).toBeNull();
    expect(resolveRegionalLogisticsSelection(british, { ...selected, shipmentId: 'no-longer-present' })).toBeNull();
    expect(resolveRegionalLogisticsSelection(british, null)).toBe(british.rows[0]);
    expect(resolveRegionalLogisticsSelection(buildRegionalLogisticsPresentation(createRegionalIndustryState('britain'), at(101)), null)).toBeNull();
  });

  it('suppresses an arrival estimate if settlement metadata is newer than the displayed week', () => {
    const state = reserved();
    state.accounts.britain!.lastTransportWeek = 110;
    const row = buildRegionalLogisticsPresentation(state, at(101)).rows[0];
    expect(row.status).toBe('reserved');
    expect(row.earliestArrivalSteps).toBeNull();
    expect(row.arrivalCondition).toBeNull();
  });

  it('requires a real settlement for an active legacy record even if its remaining counter is zero', () => {
    const state = reserved();
    state.accounts.britain!.shipments[0].remainingWeeks = 0;
    const row = buildRegionalLogisticsPresentation(state, at(101)).rows[0];
    expect(row).toMatchObject({ status: 'reserved', remainingSteps: 1, earliestArrivalSteps: 1, deliveredWeek: null });
    const arrived = advanceRegionalTransportWeek(state, at(102));
    expect(buildRegionalLogisticsPresentation(arrived.state, at(102)).rows[0].status).toBe('delivered');
  });
});
