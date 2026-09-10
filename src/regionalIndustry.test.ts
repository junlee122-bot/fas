import { describe, expect, it } from 'vitest';
import {
  advanceRegionalTransportWeek, attributeRegionalIndustryReceipt, cancelRegionalReservedShipment,
  configureRegionalIndustry, createRegionalIndustryState, deriveRegionalCapacity, deriveRegionalOwnedStockpile,
  getRegionalEligibleTerritories, getRegionalIndustryAccount, normalizeRegionalIndustry, planRegionalShipment,
  REGIONAL_COMPLETED_SHIPMENT_LIMIT, REGIONAL_RECEIPT_ID_LIMIT, getRegionalDispatchConfiguration,
  deriveRegionalAutomaticReservation, reserveAutomaticRegionalShipmentWeek,
  type RegionalIndustryConfiguration, type RegionalIndustryContext, type RegionalIndustryState,
} from './regionalIndustry';
import type { Stockpile, Territory } from './types';

const territory = (id: string, x: number, neighbors: string[]): Territory => ({ id, name: id, x, y: 40, region: '시험 지역', controller: 'allies', ownerId: 'britain', value: 1, supply: 80, terrain: '평야', siteType: 'city', neighbors });
const territories = [territory('origin', 10, ['destination']), territory('destination', 30, ['origin']), territory('remote', 50, [])];
const context: RegionalIndustryContext = { nationId: 'britain', week: 100, territories, playableTerritoryIds: territories.map((item) => item.id), factories: 10, authorized: true };
const config: RegionalIndustryConfiguration = { mode: 'pilot', originTerritoryId: 'origin', destinationTerritoryId: 'destination', equipmentKey: 'infantryEquipment', allocatedFactories: 1 };
const stock: Stockpile = { infantryEquipment: 1000, tanks: 20, aircraft: 30, convoys: 4, artillery: 10, trucks: 60 };
const delivery: Stockpile = { infantryEquipment: 35, tanks: 2, aircraft: 0, convoys: 0, artillery: 1, trucks: 3 };
const plus = (a: Stockpile, b: Stockpile): Stockpile => Object.fromEntries(Object.keys(a).map((key) => [key, a[key as keyof Stockpile] + b[key as keyof Stockpile]])) as unknown as Stockpile;
function pilot(): RegionalIndustryState { return configureRegionalIndustry(createRegionalIndustryState('britain', 100), config, context).state; }
function receive(state = pilot()) { return attributeRegionalIndustryReceipt(state, { id: 'britain:101', week: 101, nationId: 'britain', stockpileDelta: delivery }, { ...context, week: 101 }); }

describe('limited regional production and logistics pilot', () => {
  it('defaults old saves to national mode without copying or retroactively gifting national stock', () => {
    const state = normalizeRegionalIndustry(undefined, 'britain', 100);
    expect(getRegionalIndustryAccount(state, 'britain').configuration.mode).toBe('national');
    expect(deriveRegionalOwnedStockpile(state, 'britain', stock)).toEqual(stock);
    expect(Object.values(getRegionalIndustryAccount(state, 'britain').warehouse).every((n) => n === 0)).toBe(true);
    const applied = receive(state);
    expect(applied.stockpileDelta).toEqual(delivery);
    expect(deriveRegionalOwnedStockpile(applied.state, 'britain', plus(stock, applied.stockpileDelta))).toEqual(plus(stock, delivery));
  });

  it('attributes capacity without creating factories or changing national usable inventory', () => {
    const before = structuredClone(context);
    const state = pilot();
    expect(deriveRegionalCapacity(state, context)).toEqual({ total: 10, attributed: 1, unlocated: 9, cargoPerWeek: 20 });
    expect(deriveRegionalOwnedStockpile(state, 'britain', stock)).toEqual(stock);
    expect(context).toEqual(before);
    expect(configureRegionalIndustry(state, { ...config, allocatedFactories: 11 }, context).applied).toBe(false);
    expect(configureRegionalIndustry(state, { ...config, allocatedFactories: NaN }, context).applied).toBe(false);
  });

  it('requires nation ownership, active ground eligibility, distinct adjacency and current authority', () => {
    const state = createRegionalIndustryState('britain', 100);
    for (const candidate of [
      { ...context, authorized: false },
      { ...context, playableTerritoryIds: ['origin'] },
      { ...context, territories: territories.map((t) => t.id === 'destination' ? { ...t, ownerId: 'usa' as const } : t) },
      { ...context, territories: territories.map((t) => t.id === 'destination' ? { ...t, siteType: 'sea' as const } : t) },
      { ...context, territories: territories.map((t) => ({ ...t, neighbors: [] })) },
      { ...context, territories: territories.map((t) => t.id === 'destination' ? { ...t, theater: 'asia' as const } : t) },
      { ...context, week: 99 },
    ]) expect(configureRegionalIndustry(state, config, candidate).applied).toBe(false);
    expect(configureRegionalIndustry(state, { ...config, destinationTerritoryId: 'origin' }, context).applied).toBe(false);
    expect(getRegionalEligibleTerritories({ ...context, playableTerritoryIds: ['origin'] }).map((t) => t.id)).toEqual(['origin']);
    expect(configureRegionalIndustry(state, { ...config, equipmentKey: 'convoys' }, context).applied).toBe(false);
  });

  it('stages exactly one new production category and passes other equipment through once', () => {
    const initial = pilot();
    const before = structuredClone(initial);
    const result = receive(initial);
    expect(result.stockpileDelta).toEqual({ ...delivery, infantryEquipment: 0 });
    expect(getRegionalIndustryAccount(result.state, 'britain').warehouse.infantryEquipment).toBe(35);
    expect(deriveRegionalOwnedStockpile(result.state, 'britain', plus(stock, result.stockpileDelta))).toEqual(plus(stock, delivery));
    expect(initial).toEqual(before);
    expect(receive(result.state).applied).toBe(false);
    expect(receive(result.state).stockpileDelta.infantryEquipment).toBe(0);
    expect(attributeRegionalIndustryReceipt(result.state, { id: 'britain:101', week: 102, nationId: 'britain', stockpileDelta: delivery }, { ...context, week: 102 }).applied).toBe(false);
  });

  it('rejects past, wrong-nation, nonfinite or negative source receipts without mutating inventories', () => {
    const state = pilot();
    for (const receipt of [
      { id: 'old', week: 100, nationId: 'britain' as const, stockpileDelta: delivery },
      { id: 'foreign', week: 101, nationId: 'usa' as const, stockpileDelta: delivery },
      { id: 'nan', week: 101, nationId: 'britain' as const, stockpileDelta: { ...delivery, tanks: NaN } },
      { id: 'negative', week: 101, nationId: 'britain' as const, stockpileDelta: { ...delivery, tanks: -1 } },
    ]) expect(attributeRegionalIndustryReceipt(state, receipt, { ...context, week: 101 }).applied).toBe(false);
    expect(getRegionalIndustryAccount(state, 'britain').warehouse.infantryEquipment).toBe(0);
  });

  it('bounds multiple reservations by shared cargo capacity and keeps the remainder at origin', () => {
    const received = receive();
    const first = planRegionalShipment(received.state, { id: 'a', quantity: 12 }, { ...context, week: 101 });
    const second = planRegionalShipment(first.state, { id: 'b', quantity: 12 }, { ...context, week: 101 });
    const account = getRegionalIndustryAccount(second.state, 'britain');
    expect(account.shipments.map((s) => s.quantity)).toEqual([12, 8]);
    expect(account.warehouse.infantryEquipment).toBe(15);
    expect(planRegionalShipment(second.state, { id: 'c', quantity: 1 }, { ...context, week: 101 }).applied).toBe(false);
    expect(planRegionalShipment(second.state, { id: 'a', quantity: 1 }, { ...context, week: 101 }).applied).toBe(false);
    expect(deriveRegionalOwnedStockpile(second.state, 'britain', stock).infantryEquipment).toBe(1035);
  });

  it('requires two weekly boundaries and releases only actual destination arrivals exactly once', () => {
    const reserved = planRegionalShipment(receive().state, { id: 'a', quantity: 20 }, { ...context, week: 101 });
    const sameWeek = advanceRegionalTransportWeek(reserved.state, { ...context, week: 101 });
    expect(sameWeek.stockpileDelta.infantryEquipment).toBe(0);
    const first = advanceRegionalTransportWeek(sameWeek.state, { ...context, week: 102 });
    expect(first.stockpileDelta.infantryEquipment).toBe(0);
    expect(getRegionalIndustryAccount(first.state, 'britain').shipments[0].status).toBe('in-transit');
    const second = advanceRegionalTransportWeek(first.state, { ...context, week: 103 });
    expect(second.stockpileDelta.infantryEquipment).toBe(20);
    expect(second.deliveries[0]).toMatchObject({ shipmentId: 'a', destinationTerritoryId: 'destination', week: 103, quantity: 20 });
    expect(deriveRegionalOwnedStockpile(second.state, 'britain', plus(stock, second.stockpileDelta))).toEqual(deriveRegionalOwnedStockpile(reserved.state, 'britain', stock));
    expect(advanceRegionalTransportWeek(second.state, { ...context, week: 103 }).applied).toBe(false);
    expect(advanceRegionalTransportWeek(second.state, { ...context, week: 104 }).stockpileDelta.infantryEquipment).toBe(0);
  });

  it('holds material on route loss and resumes the remaining journey after access is restored', () => {
    const reserved = planRegionalShipment(receive().state, { id: 'a', quantity: 20 }, { ...context, week: 101 });
    const first = advanceRegionalTransportWeek(reserved.state, { ...context, week: 102 });
    const lost = { ...context, week: 103, territories: territories.map((t) => t.id === 'destination' ? { ...t, ownerId: 'usa' as const } : t) };
    const held = advanceRegionalTransportWeek(first.state, lost);
    expect(held.stockpileDelta.infantryEquipment).toBe(0);
    expect(getRegionalIndustryAccount(held.state, 'britain').shipments[0]).toMatchObject({ remainingWeeks: 1, status: 'in-transit' });
    expect(getRegionalIndustryAccount(held.state, 'britain').shipments[0].heldReason).toContain('직접 소유');
    expect(deriveRegionalOwnedStockpile(held.state, 'britain', stock).infantryEquipment).toBe(1035);
    expect(advanceRegionalTransportWeek(held.state, { ...context, week: 104 }).stockpileDelta.infantryEquipment).toBe(20);
  });

  it('cancels reserved cargo to origin once but never teleports in-transit cargo home', () => {
    const reserved = planRegionalShipment(receive().state, { id: 'a', quantity: 20 }, { ...context, week: 101 });
    const cancelled = cancelRegionalReservedShipment(reserved.state, 'a', { ...context, week: 101 });
    expect(getRegionalIndustryAccount(cancelled.state, 'britain').warehouse.infantryEquipment).toBe(35);
    expect(cancelled.stockpileDelta.infantryEquipment).toBe(0);
    expect(cancelRegionalReservedShipment(cancelled.state, 'a', { ...context, week: 101 }).applied).toBe(false);
    const moving = advanceRegionalTransportWeek(reserved.state, { ...context, week: 102 });
    expect(cancelRegionalReservedShipment(moving.state, 'a', { ...context, week: 102 }).applied).toBe(false);
  });

  it('blocks mode/path changes with pending materials and permits national mode only after real drain', () => {
    const received = receive();
    expect(configureRegionalIndustry(received.state, { ...config, mode: 'national' }, { ...context, week: 101 }).applied).toBe(false);
    const small = attributeRegionalIndustryReceipt(pilot(), { id: 'small', nationId: 'britain', week: 101, stockpileDelta: { ...delivery, infantryEquipment: 10 } }, { ...context, week: 101 });
    const reserved = planRegionalShipment(small.state, { id: 'a', quantity: 10 }, { ...context, week: 101 });
    const departed = advanceRegionalTransportWeek(reserved.state, { ...context, week: 102 });
    const arrived = advanceRegionalTransportWeek(departed.state, { ...context, week: 103 });
    expect(configureRegionalIndustry(arrived.state, { ...config, mode: 'national' }, { ...context, week: 103 }).applied).toBe(true);
  });

  it('preserves foreign-country inventories and in-transit saves without retroactive movement', () => {
    const reserved = planRegionalShipment(receive().state, { id: 'a', quantity: 20 }, { ...context, week: 101 });
    const moving = advanceRegionalTransportWeek(reserved.state, { ...context, week: 102 });
    const restored = normalizeRegionalIndustry(JSON.parse(JSON.stringify(moving.state)), 'britain', 102);
    expect(restored.accounts.britain).toEqual({ ...moving.state.accounts.britain, lastAutomaticReservationWeek: 102 });
    expect(advanceRegionalTransportWeek(restored, { ...context, week: 102 }).applied).toBe(false);
    const foreign = normalizeRegionalIndustry(restored, 'usa', 102);
    expect(deriveRegionalOwnedStockpile(foreign, 'britain', stock).infantryEquipment).toBe(1035);
    expect(deriveRegionalOwnedStockpile(foreign, 'usa', stock)).toEqual(stock);
    expect(getRegionalIndustryAccount(foreign, 'usa').configuration.mode).toBe('national');
    const jumped = advanceRegionalTransportWeek(reserved.state, { ...context, week: 1000 });
    expect(jumped.stockpileDelta.infantryEquipment).toBe(0);
    expect(getRegionalIndustryAccount(jumped.state, 'britain').shipments[0].remainingWeeks).toBe(1);
  });

  it('rejects zero/NaN/negative/fractional shipments and holds over-capacity reservations after factory loss', () => {
    const state = receive().state;
    for (const quantity of [0, NaN, -1, 1.5, Infinity]) expect(planRegionalShipment(state, { id: String(quantity), quantity }, { ...context, week: 101 }).applied).toBe(false);
    const reserved = planRegionalShipment(state, { id: 'a', quantity: 20 }, { ...context, week: 101 });
    const held = advanceRegionalTransportWeek(reserved.state, { ...context, week: 102, factories: 0 });
    expect(getRegionalIndustryAccount(held.state, 'britain').shipments[0].status).toBe('reserved');
    expect(held.stockpileDelta.infantryEquipment).toBe(0);
    expect(deriveRegionalOwnedStockpile(held.state, 'britain', stock).infantryEquipment).toBe(1035);
    const malformed = structuredClone(state); malformed.accounts.britain!.warehouse.infantryEquipment = NaN;
    const normalized = normalizeRegionalIndustry(malformed, 'britain', 102);
    expect(normalized.diagnostics).toHaveLength(1);
    expect(deriveRegionalOwnedStockpile(normalized, 'britain', stock)).toEqual(stock);
  });

  it('pauses new intake while keeping existing cargo movable until the pilot is drained', () => {
    const received = receive();
    const paused = configureRegionalIndustry(received.state, { ...config, acceptNewReceipts: false }, { ...context, week: 101 });
    expect(paused.applied).toBe(true);
    const next = attributeRegionalIndustryReceipt(paused.state, { id: 'britain:102', nationId: 'britain', week: 102, stockpileDelta: delivery }, { ...context, week: 102 });
    expect(next.stockpileDelta).toEqual(delivery);
    expect(getRegionalIndustryAccount(next.state, 'britain').warehouse.infantryEquipment).toBe(35);
    expect(planRegionalShipment(next.state, { id: 'drain', quantity: 20 }, { ...context, week: 102 }).applied).toBe(true);
    const lostRoute = { ...context, week: 101, playableTerritoryIds: [] };
    expect(configureRegionalIndustry(received.state, { ...config, acceptNewReceipts: false }, lostRoute).applied).toBe(true);
  });

  it('preserves corrupted raw cargo through save round trips, blocks regional commands and passes new goods nationally', () => {
    const state = receive().state;
    const rawAccount = { ...state.accounts.britain!, warehouse: { ...delivery, tanks: 'corrupt-quantity' } };
    const normalized = normalizeRegionalIndustry({ ...state, accounts: { britain: rawAccount } }, 'britain', 101);
    expect(normalized.quarantinedAccounts.britain).toEqual(rawAccount);
    expect(configureRegionalIndustry(normalized, config, { ...context, week: 101 }).applied).toBe(false);
    expect(planRegionalShipment(normalized, { id: 'bad', quantity: 1 }, { ...context, week: 101 }).applied).toBe(false);
    expect(advanceRegionalTransportWeek(normalized, { ...context, week: 102 }).applied).toBe(false);
    const receipt = attributeRegionalIndustryReceipt(normalized, { id: 'britain:102', nationId: 'britain', week: 102, stockpileDelta: delivery }, { ...context, week: 102 });
    expect(receipt.applied).toBe(true);
    expect(receipt.stockpileDelta).toEqual(delivery);
    const restored = normalizeRegionalIndustry(JSON.parse(JSON.stringify(receipt.state)), 'britain', 102);
    expect(restored.quarantinedAccounts.britain).toEqual(rawAccount);
    expect(configureRegionalIndustry(restored, config, { ...context, week: 102 }).applied).toBe(false);
    expect(receive(restored).applied).toBe(false);
  });

  it('holds a route when control is lost even if the national owner ID was not updated', () => {
    const controlled = { ...context, controllingFaction: 'allies' as const };
    const reserved = planRegionalShipment(receive().state, { id: 'control-test', quantity: 20 }, { ...controlled, week: 101 });
    const captured = { ...controlled, week: 102, territories: territories.map((territory) => territory.id === 'destination' ? { ...territory, controller: 'axis' as const } : territory) };
    expect(getRegionalEligibleTerritories(captured).some((territory) => territory.id === 'destination')).toBe(false);
    const held = advanceRegionalTransportWeek(reserved.state, captured);
    expect(held.stockpileDelta.infantryEquipment).toBe(0);
    expect(getRegionalIndustryAccount(held.state, 'britain').shipments[0]).toMatchObject({ status: 'reserved', remainingWeeks: 2 });
    expect(getRegionalIndustryAccount(held.state, 'britain').shipments[0].heldReason).toContain('소유·통제');
    expect(deriveRegionalOwnedStockpile(held.state, 'britain', stock)).toEqual(deriveRegionalOwnedStockpile(reserved.state, 'britain', stock));
    expect(planRegionalShipment(held.state, { id: 'blocked-new', quantity: 1 }, captured).applied).toBe(false);
  });

  it('bounds old receipt and terminal shipment records without dropping active cargo or last arrival evidence', () => {
    let state = pilot();
    for (let week = 101; week <= 400; week += 1) {
      const next = { ...context, week };
      state = advanceRegionalTransportWeek(state, next).state;
      state = attributeRegionalIndustryReceipt(state, { id: `britain:industry:${week}`, nationId: 'britain', week, stockpileDelta: { ...delivery, infantryEquipment: 20 } }, next).state;
      state = planRegionalShipment(state, { id: `bounded:${week}`, quantity: 20 }, next).state;
    }
    const account = getRegionalIndustryAccount(state, 'britain');
    expect(account.processedReceiptIds).toHaveLength(REGIONAL_RECEIPT_ID_LIMIT);
    expect(account.shipments.filter((shipment) => shipment.status === 'delivered')).toHaveLength(REGIONAL_COMPLETED_SHIPMENT_LIMIT);
    expect(account.shipments.filter((shipment) => shipment.status === 'reserved' || shipment.status === 'in-transit')).toHaveLength(2);
    const beforeOwned = deriveRegionalOwnedStockpile(state, 'britain', stock);
    state = cancelRegionalReservedShipment(state, 'bounded:400', { ...context, week: 400 }).state;
    for (let index = 0; index < 150; index += 1) {
      const command = { id: `cancelled:${index}`, quantity: 1 };
      state = planRegionalShipment(state, command, { ...context, week: 400 }).state;
      state = cancelRegionalReservedShipment(state, command.id, { ...context, week: 400 }).state;
    }
    const after = getRegionalIndustryAccount(state, 'britain');
    expect(after.shipments.filter((shipment) => shipment.status === 'cancelled' || shipment.status === 'delivered')).toHaveLength(REGIONAL_COMPLETED_SHIPMENT_LIMIT);
    expect(after.shipments.find((shipment) => shipment.id === after.lastDelivery?.shipmentId)?.status).toBe('delivered');
    expect(deriveRegionalOwnedStockpile(state, 'britain', stock)).toEqual(beforeOwned);
    const restored = normalizeRegionalIndustry(JSON.parse(JSON.stringify(state)), 'britain', 400);
    expect(restored.accounts.britain).toEqual({ ...state.accounts.britain, lastAutomaticReservationWeek: 400 });
    expect(attributeRegionalIndustryReceipt(restored, { id: 'britain:industry:101', nationId: 'britain', week: 101, stockpileDelta: delivery }, { ...context, week: 101 }).applied).toBe(false);
    const oldLargeSave = structuredClone(state);
    const oldAccount = oldLargeSave.accounts.britain!;
    const cancelled = oldAccount.shipments.find((shipment) => shipment.status === 'cancelled')!;
    oldAccount.shipments.push(...Array.from({ length: 300 }, (_, index) => ({ ...cancelled, id: `old-extra:${index}` })));
    oldAccount.processedReceiptIds = Array.from({ length: 400 }, (_, index) => `old-receipt:${index}`);
    const compactedLoad = normalizeRegionalIndustry(oldLargeSave, 'britain', 400);
    expect(compactedLoad.accounts.britain!.shipments).toHaveLength(REGIONAL_COMPLETED_SHIPMENT_LIMIT + 1);
    expect(compactedLoad.accounts.britain!.processedReceiptIds).toHaveLength(REGIONAL_RECEIPT_ID_LIMIT);
    expect(compactedLoad.accounts.britain!.lastDelivery).toEqual(after.lastDelivery);
    expect(deriveRegionalOwnedStockpile(compactedLoad, 'britain', stock)).toEqual(beforeOwned);
    expect(oldLargeSave.accounts.britain!.shipments.length).toBeGreaterThan(REGIONAL_COMPLETED_SHIPMENT_LIMIT + 1);
  });
});

describe('approved automatic regional reservations', () => {
  const automatic = { mode: 'automatic' as const, maxItemsPerWeek: 12, minimumWarehouse: 10 };
  const autoPilot = () => configureRegionalIndustry(pilot(), { ...config, dispatch: automatic }, context).state;
  const at = (week: number) => ({ ...context, week });

  it('keeps existing goods while safely disabling invalid saved automation and defaults old saves to manual', () => {
    const initial = receive().state;
    const old = structuredClone(initial);
    delete old.accounts.britain!.configuration.dispatch;
    delete old.accounts.britain!.lastAutomaticReservationWeek;
    const restored = normalizeRegionalIndustry(old, 'britain', 101);
    expect(getRegionalDispatchConfiguration(restored.accounts.britain!.configuration).mode).toBe('manual');
    expect(restored.accounts.britain!.warehouse.infantryEquipment).toBe(35);
    for (const dispatch of [null, { ...automatic, maxItemsPerWeek: NaN }, { ...automatic, maxItemsPerWeek: 0 }, { ...automatic, minimumWarehouse: -1 }, { ...automatic, mode: 'unknown' }]) {
      const corrupted = structuredClone(initial);
      Object.assign(corrupted.accounts.britain!.configuration, { dispatch });
      const normalized = normalizeRegionalIndustry(corrupted, 'britain', 101);
      expect(normalized.quarantinedAccounts).toEqual({});
      expect(getRegionalDispatchConfiguration(normalized.accounts.britain!.configuration).mode).toBe('manual');
      expect(normalized.accounts.britain!.warehouse).toEqual(initial.accounts.britain!.warehouse);
      expect(normalized.diagnostics.join(' ')).toContain('수동으로 해제');
    }
  });

  it('changes capacity with backlog without changing production, inventory or route and permits zero departure capacity', () => {
    const received = receive().state;
    const before = structuredClone(received);
    const increased = configureRegionalIndustry(received, { ...config, allocatedFactories: 3 }, at(101));
    expect(increased.applied).toBe(true);
    expect(deriveRegionalCapacity(increased.state, at(101)).cargoPerWeek).toBe(60);
    expect(deriveRegionalOwnedStockpile(increased.state, 'britain', stock)).toEqual(deriveRegionalOwnedStockpile(received, 'britain', stock));
    const paused = configureRegionalIndustry(increased.state, { ...config, allocatedFactories: 0 }, at(101));
    expect(paused.applied).toBe(true);
    expect(deriveRegionalCapacity(paused.state, at(101)).cargoPerWeek).toBe(0);
    for (const allocatedFactories of [11, -1, 1.5, NaN, Infinity]) expect(configureRegionalIndustry(received, { ...config, allocatedFactories }, at(101)).applied).toBe(false);
    expect(configureRegionalIndustry(received, { ...config, equipmentKey: 'trucks' }, at(101)).applied).toBe(false);
    expect(configureRegionalIndustry(received, { ...config, destinationTerritoryId: 'remote' }, at(101)).applied).toBe(false);
    expect(received).toEqual(before);
  });

  it('limits automatic items by shared manual reservation capacity and warehouse minimum without mutation', () => {
    const received = receive(autoPilot()).state;
    const manual = planRegionalShipment(received, { id: 'manual', quantity: 15 }, at(101)).state;
    const before = structuredClone(manual);
    expect(deriveRegionalAutomaticReservation(manual, at(101)).quantity).toBe(5);
    const auto = reserveAutomaticRegionalShipmentWeek(manual, at(101));
    expect(auto).toMatchObject({ applied: true, reservedQuantity: 5, attempted: true });
    expect(auto.state.accounts.britain!.warehouse.infantryEquipment).toBe(15);
    expect(auto.state.accounts.britain!.shipments.at(-1)).toMatchObject({ id: 'regional-auto:britain:101', reservedWeek: 101, status: 'reserved', quantity: 5, remainingWeeks: 2 });
    expect(auto.stockpileDelta.infantryEquipment).toBe(0);
    expect(deriveRegionalOwnedStockpile(auto.state, 'britain', stock)).toEqual(deriveRegionalOwnedStockpile(manual, 'britain', stock));
    expect(manual).toEqual(before);
  });

  it('holds at minimum inventory and applies automatic limit in item counts rather than cargo weight', () => {
    const trucks = configureRegionalIndustry(pilot(), { ...config, equipmentKey: 'trucks', dispatch: { ...automatic, maxItemsPerWeek: 3, minimumWarehouse: 2 } }, context).state;
    const received = attributeRegionalIndustryReceipt(trucks, { id: 'trucks', nationId: 'britain', week: 101, stockpileDelta: { ...delivery, trucks: 10 } }, at(101)).state;
    const result = reserveAutomaticRegionalShipmentWeek(received, at(101));
    expect(result.reservedQuantity).toBe(3);
    expect(result.state.accounts.britain!.warehouse.trucks).toBe(7);
    const heldState = configureRegionalIndustry(receive(autoPilot()).state, { ...config, dispatch: { ...automatic, minimumWarehouse: 35 } }, at(101)).state;
    const held = reserveAutomaticRegionalShipmentWeek(heldState, at(101));
    expect(held).toMatchObject({ applied: false, reservedQuantity: 0, attempted: true });
    expect(held.reason).toContain('최소잔량');
    expect(held.state.accounts.britain!.warehouse.infantryEquipment).toBe(35);
  });

  it('does not repeat an automatic order after cancellation, same-week retry, restoration or a past week', () => {
    const first = reserveAutomaticRegionalShipmentWeek(receive(autoPilot()).state, at(101));
    const cancelled = cancelRegionalReservedShipment(first.state, 'regional-auto:britain:101', at(101)).state;
    for (const state of [first.state, cancelled, normalizeRegionalIndustry(JSON.parse(JSON.stringify(cancelled)), 'britain', 101)]) {
      for (const week of [100, 101, NaN]) expect(reserveAutomaticRegionalShipmentWeek(state, at(week)).applied).toBe(false);
    }
    expect(reserveAutomaticRegionalShipmentWeek(first.state, at(102)).reason).toContain('결산 후');
    const next = advanceRegionalTransportWeek(cancelled, at(102)).state;
    expect(reserveAutomaticRegionalShipmentWeek(next, at(102)).applied).toBe(true);
  });

  it('holds on authority loss, consumes only one attempt and always permits revocation without renewed authority', () => {
    const state = receive(autoPilot()).state;
    const held = reserveAutomaticRegionalShipmentWeek(state, { ...at(101), authorized: false });
    expect(held).toMatchObject({ applied: false, attempted: true, reservedQuantity: 0 });
    expect(held.reason).toContain('직접 집행권');
    expect(reserveAutomaticRegionalShipmentWeek(held.state, at(101)).applied).toBe(false);
    const stopped = configureRegionalIndustry(held.state, { ...config, dispatch: { ...automatic, mode: 'manual' } }, { ...at(101), authorized: false });
    expect(stopped.applied).toBe(true);
    expect(getRegionalDispatchConfiguration(stopped.state.accounts.britain!.configuration).mode).toBe('manual');
    expect(configureRegionalIndustry(stopped.state, { ...config, dispatch: automatic }, { ...at(101), authorized: false }).applied).toBe(false);
    expect(deriveRegionalOwnedStockpile(stopped.state, 'britain', stock)).toEqual(deriveRegionalOwnedStockpile(state, 'britain', stock));
  });

  it('holds automatic routing on foreign ownership or hostile control, with zero capacity and in another nation', () => {
    const state = receive(autoPilot()).state;
    const contexts = [
      { ...at(101), factories: 0 },
      { ...at(101), territories: territories.map((t) => ({ ...t, ownerId: 'usa' as const })) },
      { ...at(101), controllingFaction: 'allies' as const, territories: territories.map((t) => ({ ...t, controller: 'axis' as const })) },
      { ...at(101), nationId: 'usa' as const },
    ];
    for (const ctx of contexts) {
      const result = reserveAutomaticRegionalShipmentWeek(state, ctx);
      expect(result.applied).toBe(false);
      expect(result.state.accounts.britain!.warehouse.infantryEquipment).toBe(35);
      expect(result.state.accounts.britain!.shipments).toHaveLength(0);
    }
  });

  it('rejects malformed auto commands and preserves all active cargo when reducing capacity', () => {
    for (const dispatch of [{ ...automatic, maxItemsPerWeek: 0 }, { ...automatic, minimumWarehouse: Infinity }]) expect(configureRegionalIndustry(pilot(), { ...config, dispatch }, context).applied).toBe(false);
    const auto = reserveAutomaticRegionalShipmentWeek(receive(autoPilot()).state, at(101));
    const reduced = configureRegionalIndustry(auto.state, { ...config, allocatedFactories: 0, dispatch: automatic }, at(101));
    const held = advanceRegionalTransportWeek(reduced.state, at(102));
    expect(held.state.accounts.britain!.shipments[0]).toMatchObject({ quantity: 12, status: 'reserved', remainingWeeks: 2 });
    expect(held.stockpileDelta.infantryEquipment).toBe(0);
    expect(deriveRegionalOwnedStockpile(held.state, 'britain', stock)).toEqual(deriveRegionalOwnedStockpile(auto.state, 'britain', stock));
  });
});
