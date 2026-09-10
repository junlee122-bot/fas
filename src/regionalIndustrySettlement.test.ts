import { describe, expect, it } from 'vitest';
import {
  configureRegionalIndustry, createRegionalIndustryState, deriveRegionalOwnedStockpile,
  getRegionalIndustryAccount, normalizeRegionalIndustry, planRegionalShipment,
  type RegionalIndustryContext, type RegionalIndustrySourceReceipt, type RegionalIndustryState,
} from './regionalIndustry';
import { forecastPostwarIndustry, postwarStockpileKeys, type PostwarStockpileKey } from './postwarIndustry';
import {
  combineStockpileDeltas, regionalEquipmentProductionCoverage, settleRegionalIndustryDelivery,
} from './regionalIndustrySettlement';
import type { ProductionLine, Stockpile, Territory } from './types';

const stock = (values: Partial<Stockpile> = {}): Stockpile => ({
  infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0, ...values,
});
const territories: Territory[] = ['origin', 'destination'].map((id, index) => ({
  id, name: id, x: 10 + index * 20, y: 40, region: '시험 지역', controller: 'allies',
  ownerId: 'britain', value: 1, supply: 80, terrain: '평야', siteType: 'city',
  neighbors: [index === 0 ? 'destination' : 'origin'],
}));
const context: RegionalIndustryContext = {
  nationId: 'britain', week: 100, territories, playableTerritoryIds: ['origin', 'destination'],
  factories: 10, authorized: true,
};
const delivery = stock({ infantryEquipment: 35, tanks: 2, aircraft: 4, convoys: 1, artillery: 3, trucks: 6 });
const national = stock({ infantryEquipment: 1000, tanks: 20, aircraft: 30, convoys: 4, artillery: 10, trucks: 60 });
const source = (week: number, stockpileDelta = delivery): RegionalIndustrySourceReceipt => ({
  id: `industry:britain:${week}`, nationId: 'britain', week, stockpileDelta,
});
const at = (week: number): RegionalIndustryContext => ({ ...context, week });
function pilot(equipmentKey: PostwarStockpileKey = 'infantryEquipment'): RegionalIndustryState {
  const configured = configureRegionalIndustry(createRegionalIndustryState('britain', 100), {
    mode: 'pilot', originTerritoryId: 'origin', destinationTerritoryId: 'destination',
    equipmentKey, allocatedFactories: 2,
  }, context);
  expect(configured.applied).toBe(true);
  return configured.state;
}
function reserved(): RegionalIndustryState {
  const produced = settleRegionalIndustryDelivery(pilot(), at(101), source(101));
  const planned = planRegionalShipment(produced.state, { id: 'shipment:101', quantity: 20 }, at(101));
  expect(planned.applied).toBe(true);
  return planned.state;
}
const production: ProductionLine[] = ['rifle', 'sherman', 'spitfire', 'convoy', 'artillery', 'truck'].map((id) => ({
  id, name: id, category: id, assigned: 5, efficiency: 100, output: 100, icon: 'factory',
}));
const report = forecastPostwarIndustry({
  nationId: 'britain', week: 103, production, stockpile: national,
  game: { factories: 30, fuel: 1000, steel: 1000, treasury: 100 },
  spendingLevel: 100, securityBudgetPercent: 100,
});

describe('regional weekly delivery settlement integration', () => {
  const automatic = () => {
    const state = pilot();
    return configureRegionalIndustry(state, { ...state.accounts.britain!.configuration, dispatch: { mode: 'automatic', maxItemsPerWeek: 20, minimumWarehouse: 5 } }, context).state;
  };

  it('reserves automatically only after staging and requires two later boundaries for national availability', () => {
    const initial = automatic();
    const before = structuredClone(initial);
    const first = settleRegionalIndustryDelivery(initial, at(101), source(101));
    expect(first.automaticReservation).toMatchObject({ applied: true, reservedQuantity: 20 });
    expect(first.availableDelta.infantryEquipment).toBe(0);
    expect(first.stagedDelta.infantryEquipment).toBe(35);
    expect(first.state.accounts.britain!.warehouse.infantryEquipment).toBe(15);
    expect(first.state.accounts.britain!.shipments[0]).toMatchObject({ status: 'reserved', reservedWeek: 101, remainingWeeks: 2 });
    expect(initial).toEqual(before);
    const second = settleRegionalIndustryDelivery(first.state, at(102), source(102));
    expect(second.availableDelta.infantryEquipment).toBe(0);
    expect(second.state.accounts.britain!.shipments.map((s) => s.status)).toEqual(['in-transit', 'reserved']);
    const third = settleRegionalIndustryDelivery(second.state, at(103), source(103));
    expect(third.availableDelta.infantryEquipment).toBe(20);
    expect(third.transport.deliveries[0].shipmentId).toBe('regional-auto:britain:101');
    expect(third.automaticReservation?.reservedQuantity).toBe(20);
  });

  it('does not repeat auto reservation or cashless inventory movements when weekly settlement is replayed', () => {
    const first = settleRegionalIndustryDelivery(automatic(), at(101), source(101));
    for (const state of [first.state, normalizeRegionalIndustry(JSON.parse(JSON.stringify(first.state)), 'britain', 101)]) {
      const duplicate = settleRegionalIndustryDelivery(state, at(101), source(101));
      expect(duplicate.automaticReservation).toBeNull();
      expect(duplicate.availableDelta).toEqual(stock());
      expect(duplicate.stagedDelta).toEqual(stock());
      expect(duplicate.state).toEqual(state);
    }
  });

  it('drains existing warehouse without new production after intake pauses and stops only future auto orders', () => {
    const first = settleRegionalIndustryDelivery(automatic(), at(101), source(101));
    const paused = configureRegionalIndustry(first.state, { ...first.state.accounts.britain!.configuration, acceptNewReceipts: false }, at(101)).state;
    const drain = settleRegionalIndustryDelivery(paused, at(102));
    expect(drain.automaticReservation?.reservedQuantity).toBe(10);
    expect(drain.state.accounts.britain!.warehouse.infantryEquipment).toBe(5);
    const account = drain.state.accounts.britain!;
    const stopped = configureRegionalIndustry(drain.state, { ...account.configuration, dispatch: { ...account.configuration.dispatch!, mode: 'manual' } }, at(102)).state;
    const arrival = settleRegionalIndustryDelivery(stopped, at(103), source(103));
    expect(arrival.automaticReservation?.applied).toBe(false);
    expect(arrival.availableDelta.infantryEquipment).toBe(55);
    expect(arrival.state.accounts.britain!.warehouse.infantryEquipment).toBe(5);
    expect(arrival.state.accounts.britain!.shipments.filter((s) => s.status === 'reserved')).toHaveLength(0);
  });

  it('keeps manual orders when authority is lost but holds new automatic reservations with an explanation', () => {
    const first = settleRegionalIndustryDelivery(automatic(), at(101), source(101));
    const next = settleRegionalIndustryDelivery(first.state, { ...at(102), authorized: false }, source(102));
    expect(next.state.accounts.britain!.shipments[0].status).toBe('in-transit');
    expect(next.automaticReservation).toMatchObject({ applied: false, attempted: true, reservedQuantity: 0 });
    expect(next.automaticReservation?.reason).toContain('집행권');
    expect(next.state.accounts.britain!.warehouse.infantryEquipment).toBe(50);
  });

  it('conserves all equipment over repeated automatic settlements and bounds completed history', () => {
    let state = automatic();
    let available = { ...national };
    let expected = { ...national };
    for (let week = 101; week <= 300; week += 1) {
      const result = settleRegionalIndustryDelivery(state, at(week), source(week));
      state = result.state;
      available = combineStockpileDeltas(available, result.availableDelta);
      expected = combineStockpileDeltas(expected, delivery);
      expect(deriveRegionalOwnedStockpile(state, 'britain', available)).toEqual(expected);
      expect(state.accounts.britain!.warehouse.infantryEquipment).toBeGreaterThanOrEqual(5);
    }
    expect(state.accounts.britain!.processedReceiptIds).toHaveLength(128);
    expect(state.accounts.britain!.shipments.filter((s) => s.status === 'delivered')).toHaveLength(120);
    expect(state.accounts.britain!.shipments.filter((s) => s.status !== 'delivered')).toHaveLength(2);
    expect(state.accounts.britain!.lastAutomaticReservationWeek).toBe(300);
  });

  it('sums all six categories, including negative net deltas, without mutating inputs', () => {
    const negative = stock({ infantryEquipment: -5, tanks: -1, aircraft: -2, convoys: -1, artillery: -1, trucks: -3 });
    const before = structuredClone([delivery, negative]);
    expect(combineStockpileDeltas()).toEqual(stock());
    expect(combineStockpileDeltas(delivery, negative)).toEqual(stock({ infantryEquipment: 30, tanks: 1, aircraft: 2, artillery: 2, trucks: 3 }));
    expect([delivery, negative]).toEqual(before);
  });

  it('keeps national-mode delivery immediately available without copying it to a warehouse', () => {
    const settled = settleRegionalIndustryDelivery(createRegionalIndustryState('britain', 100), at(101), source(101));
    expect(settled.availableDelta).toEqual(delivery);
    expect(settled.stagedDelta).toEqual(stock());
    expect(getRegionalIndustryAccount(settled.state, 'britain').warehouse).toEqual(stock());
    expect(settled.attribution?.applied).toBe(true);
  });

  it('advances only old transport before attributing new output and never transports new production automatically', () => {
    const initial = reserved();
    const before = structuredClone(initial);
    const first = settleRegionalIndustryDelivery(initial, at(102), source(102));
    expect(first.transport.deliveries).toEqual([]);
    expect(first.transport.state.accounts.britain?.warehouse.infantryEquipment).toBe(15);
    expect(first.state.accounts.britain?.warehouse.infantryEquipment).toBe(50);
    expect(first.state.accounts.britain?.shipments).toHaveLength(1);
    expect(first.state.accounts.britain?.shipments[0]).toMatchObject({ status: 'in-transit', quantity: 20, remainingWeeks: 1 });
    expect(first.availableDelta).toEqual({ ...delivery, infantryEquipment: 0 });
    expect(first.stagedDelta).toEqual(stock({ infantryEquipment: 35 }));
    expect(initial).toEqual(before);

    const arrival = settleRegionalIndustryDelivery(first.state, at(103), source(103));
    expect(arrival.transport.deliveries).toEqual([expect.objectContaining({ shipmentId: 'shipment:101', quantity: 20, week: 103 })]);
    expect(arrival.transport.state.accounts.britain?.warehouse.infantryEquipment).toBe(50);
    expect(arrival.state.accounts.britain?.warehouse.infantryEquipment).toBe(85);
    expect(arrival.availableDelta).toEqual({ ...delivery, infantryEquipment: 20 });
    expect(arrival.stagedDelta).toEqual(stock({ infantryEquipment: 35 }));
    expect(arrival.state.accounts.britain?.shipments[0].status).toBe('delivered');
  });

  it.each(['infantryEquipment', 'tanks', 'aircraft', 'artillery', 'trucks'] as const)(
    'conserves national available + warehouse + reserved/in-transit %s through production and arrival',
    (equipmentKey) => {
      let state = pilot(equipmentKey);
      const available = { ...national };
      const expectedOwned = { ...national };
      for (const week of [101, 102, 103, 104]) {
        const result = settleRegionalIndustryDelivery(state, at(week), source(week));
        state = result.state;
        for (const key of postwarStockpileKeys) {
          available[key] += result.availableDelta[key];
          expectedOwned[key] += delivery[key];
        }
        expect(deriveRegionalOwnedStockpile(state, 'britain', available)).toEqual(expectedOwned);
        if (week === 101) {
          const planned = planRegionalShipment(state, { id: `cargo:${equipmentKey}`, quantity: 1 }, at(week));
          expect(planned.applied).toBe(true);
          state = planned.state;
          expect(deriveRegionalOwnedStockpile(state, 'britain', available)).toEqual(expectedOwned);
        }
        if (week === 102) expect(state.accounts.britain?.shipments[0].status).toBe('in-transit');
        if (week >= 103) expect(state.accounts.britain?.shipments[0].status).toBe('delivered');
      }
      expect(available[equipmentKey]).toBe(national[equipmentKey] + 1);
      expect(state.accounts.britain?.warehouse[equipmentKey]).toBe(delivery[equipmentKey] * 4 - 1);
    },
  );

  it('applies neither arrivals nor newly staged/national production twice in the same week, including after reload', () => {
    const transit = settleRegionalIndustryDelivery(reserved(), at(102)).state;
    const first = settleRegionalIndustryDelivery(transit, at(103), source(103));
    const reloaded = normalizeRegionalIndustry(JSON.parse(JSON.stringify(first.state)), 'britain', 103);
    for (const state of [first.state, reloaded]) {
      for (const receipt of [source(103), { ...source(103), id: 'different-id-same-week' }]) {
        const repeated = settleRegionalIndustryDelivery(state, at(103), receipt);
        expect(repeated.transport.applied).toBe(false);
        expect(repeated.attribution?.applied).toBe(false);
        expect(repeated.availableDelta).toEqual(stock());
        expect(repeated.stagedDelta).toEqual(stock());
        expect(repeated.state).toEqual(state);
      }
    }
  });

  it('finishes existing transit without new production and does not re-credit a delivered shipment next week', () => {
    const first = settleRegionalIndustryDelivery(reserved(), at(102));
    const arrival = settleRegionalIndustryDelivery(first.state, at(103));
    expect(arrival.attribution).toBeNull();
    expect(arrival.availableDelta).toEqual(stock({ infantryEquipment: 20 }));
    expect(arrival.stagedDelta).toEqual(stock());
    const later = settleRegionalIndustryDelivery(arrival.state, at(104));
    expect(later.availableDelta).toEqual(stock());
    expect(later.transport.deliveries).toEqual([]);
  });

  it('rejects a replayed source ID without discarding a legitimate transport arrival', () => {
    const transit = settleRegionalIndustryDelivery(reserved(), at(102)).state;
    const result = settleRegionalIndustryDelivery(transit, at(103), { ...source(103), id: source(101).id });
    expect(result.transport.applied).toBe(true);
    expect(result.transport.deliveries).toHaveLength(1);
    expect(result.attribution?.applied).toBe(false);
    expect(result.availableDelta).toEqual(stock({ infantryEquipment: 20 }));
    expect(result.stagedDelta).toEqual(stock());
    expect(result.state.accounts.britain?.warehouse.infantryEquipment).toBe(15);
  });

  it('holds an inaccessible shipment without losing it while new confirmed output remains in its warehouse', () => {
    const initial = reserved();
    const blocked = { ...at(102), playableTerritoryIds: ['origin'] };
    const result = settleRegionalIndustryDelivery(initial, blocked, source(102));
    expect(result.transport.deliveries).toEqual([]);
    expect(result.state.accounts.britain?.shipments[0]).toMatchObject({ status: 'reserved', quantity: 20, remainingWeeks: 2 });
    expect(result.state.accounts.britain?.shipments[0].heldReason).toBeTruthy();
    expect(result.availableDelta.infantryEquipment).toBe(0);
    expect(result.state.accounts.britain?.warehouse.infantryEquipment).toBe(50);
  });
});

describe('regional equipment production readiness coverage', () => {
  it('maps all six equipment categories independently and clamps coverage to zero through one', () => {
    expect(report.potentialDelivery).toEqual(stock({ infantryEquipment: 100, tanks: 100, aircraft: 100, convoys: 100, artillery: 100, trucks: 100 }));
    expect(regionalEquipmentProductionCoverage(report, stock({ infantryEquipment: 25, tanks: 50, aircraft: 75, convoys: 100, artillery: 150, trucks: -5 }))).toEqual({
      infantry: 0.25, armor: 0.5, aircraft: 0.75, naval: 1, artillery: 1, logistics: 0,
    });
  });

  it('counts actual usable arrivals, not staged production or the national stockpile total', () => {
    const first = settleRegionalIndustryDelivery(pilot(), at(101), source(101, report.delivered));
    expect(first.stagedDelta.infantryEquipment).toBe(100);
    expect(regionalEquipmentProductionCoverage(report, first.availableDelta)).toEqual({
      infantry: 0, armor: 1, aircraft: 1, naval: 1, artillery: 1, logistics: 1,
    });
    const planned = planRegionalShipment(first.state, { id: 'readiness-cargo', quantity: 20 }, at(101));
    expect(planned.applied).toBe(true);
    const transit = settleRegionalIndustryDelivery(planned.state, at(102));
    expect(regionalEquipmentProductionCoverage(report, transit.availableDelta).infantry).toBe(0);
    const arrived = settleRegionalIndustryDelivery(transit.state, at(103));
    expect(regionalEquipmentProductionCoverage(report, arrived.availableDelta)).toEqual({
      infantry: 0.2, armor: 0, aircraft: 0, naval: 0, artillery: 0, logistics: 0,
    });
  });

  it('does not invent a readiness contribution when the report or a category production denominator is absent', () => {
    const emptyCoverage = { infantry: 0, armor: 0, aircraft: 0, naval: 0, artillery: 0, logistics: 0 };
    expect(regionalEquipmentProductionCoverage(null, national)).toEqual(emptyCoverage);
    expect(regionalEquipmentProductionCoverage({ ...report, potentialDelivery: stock() }, national)).toEqual(emptyCoverage);
    expect(regionalEquipmentProductionCoverage({ ...report, potentialDelivery: stock({ artillery: 20 }) }, stock({ artillery: 5, tanks: 50 }))).toEqual({
      ...emptyCoverage, artillery: 0.25,
    });
  });
});
