import { describe, expect, it } from 'vitest';
import { createStaffRoster } from './campaign';
import { buildDeliveryGoalTrace } from './deliveryGoalTrace';
import type { DeliveryGoalTraceInput } from './deliveryGoalTrace';
import { advanceRegionalTransportWeek, attributeRegionalIndustryReceipt, configureRegionalIndustry, createRegionalIndustryState, planRegionalShipment } from './regionalIndustry';
import type { RegionalIndustryContext } from './regionalIndustry';
import { advanceStaffDeliveryPledges, buildStaffDeliveryReceipts, createStaffDeliveryPledge, createStaffDeliveryPledgeState } from './staffDeliveryPledges';
import type { StaffDeliveryPledgeContext, StaffDeliveryPledgeMetric } from './staffDeliveryPledges';
import type { Territory } from './types';

function fixture(metric: StaffDeliveryPledgeMetric = 'national-available'): DeliveryGoalTraceInput {
  const staff = createStaffRoster('britain', 'britain-tier1').map((member) => ({ ...member, joinedWeek: 0 }));
  const context: StaffDeliveryPledgeContext = { nationId: 'britain', week: 10, phase: 'nation', staff,
    production: [{ id: 'rifle', name: '보병 장비 생산선', assigned: 5, output: 100, efficiency: 90, category: '보병', icon: 'rifle' }],
    manageableDepartments: staff.map((member) => member.department),
    industryMandate: { tab: 'industry', mode: 'direct', label: '직접 결재', reason: '보직 권한', authorityRoute: '기존 경로' },
    lineEquipment: [{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }] };
  const opened = createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { id: 'goal-1', expectedWeek: 10, staffId: staff[0].id,
    personId: staff[0].personId, lineId: 'rifle', metric, targetQuantity: 50, durationWeeks: 4 }, context);
  const site = (id: string, neighbors: string[]): Territory => ({ id, name: `지역 ${id}`, x: 10, y: 40, region: '시험', controller: 'allies',
    ownerId: 'britain', value: 1, supply: 80, terrain: '평야', siteType: 'city', neighbors });
  const territories = [site('origin', ['destination']), site('destination', ['origin'])];
  const regionalContext: RegionalIndustryContext = { nationId: 'britain', week: 10, territories,
    playableTerritoryIds: territories.map((territory) => territory.id), factories: 10, authorized: true, controllingFaction: 'allies' };
  const configured = configureRegionalIndustry(createRegionalIndustryState('britain', 10), { mode: 'pilot', originTerritoryId: 'origin',
    destinationTerritoryId: 'destination', equipmentKey: 'infantryEquipment', allocatedFactories: 2 }, regionalContext);
  const received = attributeRegionalIndustryReceipt(configured.state, { id: 'britain:industry:11', nationId: 'britain', week: 11,
    stockpileDelta: { infantryEquipment: 100, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 } }, { ...regionalContext, week: 11 });
  const reserved = planRegionalShipment(received.state, { id: 'cargo:original-1', quantity: 20 }, { ...regionalContext, week: 11 });
  const moved = advanceRegionalTransportWeek(reserved.state, { ...regionalContext, week: 12 });
  const arrived = advanceRegionalTransportWeek(moved.state, { ...regionalContext, week: 13 });
  const receiptBatch = metric === 'national-available'
    ? buildStaffDeliveryReceipts({ nationId: 'britain', week: 13, industryApplied: false, industryReport: null, deliveries: arrived.deliveries })
    : [{ id: 'factory:britain:13:rifle', nationId: 'britain' as const, week: 13, equipmentKey: 'infantryEquipment' as const,
      source: 'factory-completed' as const, quantity: 15, lineId: 'rifle' }];
  const updated = advanceStaffDeliveryPledges(opened.state, { ...context, week: 13 }, receiptBatch);
  return { pledge: updated.state.pledges[0], context: { ...context, week: 13 }, regional: { state: arrived.state, context: { ...regionalContext, week: 13 } } };
}

function addReserved(input: DeliveryGoalTraceInput, id = 'pending-1', quantity = 20) {
  const result = planRegionalShipment(input.regional!.state, { id, quantity }, input.regional!.context);
  expect(result.applied).toBe(true);
  input.regional!.state = result.state;
}

describe('read-only delivery goal trace', () => {
  it('links a real arrival by exact identity, payload and week while separating mixed warehouse inventory', () => {
    const input = fixture();
    const trace = buildDeliveryGoalTrace(input);
    expect(trace).toMatchObject({ available: true, credited: 20, remaining: 30,
      production: { lineId: 'rifle', name: '보병 장비 생산선', assigned: 5, efficiency: 90 }, warehouse: 80, reserved: 0, inTransit: 0 });
    expect(trace.receipts[0]).toMatchObject({ shipmentId: 'cargo:original-1', originName: '지역 origin', destinationName: '지역 destination' });
    expect(trace.receipts[0].receipt.id).toBe('arrival:britain:arrival:britain:cargo:original-1');
    expect(trace.nextStep.kind).toBe('dispatch');
    expect(trace.notes.join(' ')).toContain('특정 생산 묶음이라고 단정하지');
    expect(trace.credited).not.toBe(trace.warehouse! + 20);
  });

  it('never mutates source state, creates cargo, consumes receipts or advances a deadline while rendering', () => {
    const input = fixture();
    const before = structuredClone(input);
    expect(buildDeliveryGoalTrace(input)).toEqual(buildDeliveryGoalTrace(input));
    const model = buildDeliveryGoalTrace(input);
    model.receipts[0].receipt.quantity = 900;
    expect(input).toEqual(before);
    expect(buildDeliveryGoalTrace(input).credited).toBe(20);
  });

  it('keeps the real arrival credited if source history has been compacted or is unavailable', () => {
    const input = fixture();
    input.regional!.state.accounts.britain!.shipments = [];
    input.regional!.state.accounts.britain!.lastDelivery = null;
    const compacted = buildDeliveryGoalTrace(input);
    expect(compacted.credited).toBe(20);
    expect(compacted.receipts[0].shipmentId).toBeNull();
    expect(compacted.receipts[0].linkReason).toContain('원인은 단정하지');
    delete input.regional;
    const absent = buildDeliveryGoalTrace(input);
    expect(absent.credited).toBe(20);
    expect(absent.warehouse).toBeNull();
    expect(absent.reserved).toBeNull();
    expect(absent.receipts[0].shipmentId).toBeNull();
  });

  it('does not mistake a factory completion or a direct national delivery for a shipment', () => {
    const factory = fixture('factory-completed');
    expect(buildDeliveryGoalTrace(factory)).toMatchObject({ credited: 15, nextStep: { kind: 'production' } });
    expect(buildDeliveryGoalTrace(factory).receipts[0].shipmentId).toBeNull();
    const direct = fixture();
    direct.pledge.receipts = [{ id: 'direct:britain:13:infantryEquipment', nationId: 'britain', week: 13,
      equipmentKey: 'infantryEquipment', source: 'national-direct', quantity: 10 }];
    expect(buildDeliveryGoalTrace(direct).credited).toBe(10);
    expect(buildDeliveryGoalTrace(direct).receipts[0].shipmentId).toBeNull();
    expect(buildDeliveryGoalTrace(direct).receipts[0].linkReason).toContain('지역 수송을 거친 것으로 표시하지');
  });

  it('never sums completion and availability receipts for the same goal metric', () => {
    const input = fixture();
    input.pledge.receipts.push({ id: 'factory:britain:13:rifle', nationId: 'britain', week: 13, equipmentKey: 'infantryEquipment',
      source: 'factory-completed', lineId: 'rifle', quantity: 100 });
    expect(buildDeliveryGoalTrace(input).credited).toBe(20);
    expect(buildDeliveryGoalTrace(input).receipts).toHaveLength(1);
  });

  it('deduplicates receipts and excludes foreign, invalid and out-of-period quantities', () => {
    const input = fixture();
    const valid = input.pledge.receipts[0];
    input.pledge.receipts.push({ ...valid }, { ...valid, id: 'foreign', nationId: 'japan' },
      { ...valid, id: 'old', week: 10 }, { ...valid, id: 'negative', quantity: -1 }, { ...valid, id: 'nan', quantity: NaN });
    expect(buildDeliveryGoalTrace(input)).toMatchObject({ available: true, credited: 20 });
    expect(buildDeliveryGoalTrace(input).receipts).toHaveLength(1);
  });

  it('does not count a future receipt and marks its conflicting saved goal unavailable', () => {
    const input = fixture();
    input.pledge.receipts.push({ ...input.pledge.receipts[0], id: 'future', week: 14, quantity: 30 });
    expect(buildDeliveryGoalTrace(input)).toMatchObject({ available: false, credited: 20, warehouse: null, relatedShipments: [] });
    expect(buildDeliveryGoalTrace(input).receipts).toHaveLength(1);
  });

  it.each(['quantity', 'equipment', 'week', 'status', 'id'] as const)('refuses a shipment link whose %s does not match without redirecting to a similar record', (field) => {
    const input = fixture();
    const shipment = input.regional!.state.accounts.britain!.shipments[0];
    if (field === 'quantity') shipment.quantity = 21;
    if (field === 'equipment') shipment.equipmentKey = 'tanks';
    if (field === 'week') { shipment.deliveredWeek = 12; shipment.reservedWeek = 10; shipment.closedWeek = 12; }
    if (field === 'status') { shipment.status = 'cancelled'; shipment.deliveredWeek = null; }
    if (field === 'id') shipment.id = 'similar-name-same-cargo';
    const trace = buildDeliveryGoalTrace(input);
    expect(trace.credited).toBe(20);
    expect(trace.receipts[0].shipmentId).toBeNull();
  });

  it('does not parse a legacy receipt suffix as a verified shipment identity', () => {
    const input = fixture();
    input.pledge.receipts[0].id = 'arrival:britain:cargo:original-1';
    expect(buildDeliveryGoalTrace(input).receipts[0].shipmentId).toBeNull();
    expect(buildDeliveryGoalTrace(input).credited).toBe(20);
  });

  it('reuses actual logistics blockers and queue ordering for same-item pending shipments', () => {
    const input = fixture();
    addReserved(input);
    input.regional!.context.territories = input.regional!.context.territories.map((territory) => territory.id === 'destination'
      ? { ...territory, ownerId: 'japan' as const, controller: 'axis' as const } : territory);
    const trace = buildDeliveryGoalTrace(input);
    expect(trace.credited).toBe(20);
    expect(trace.relatedShipments).toHaveLength(1);
    expect(trace.relatedShipments[0].holdReason).toContain('직접 소유');
    expect(trace.nextStep).toMatchObject({ kind: 'records', shipmentId: 'pending-1' });
    expect(trace.nextStep.reason).toContain('같은 품목의 현재 수송 참고');
  });

  it('keeps reserved and moving counts distinct from credited, including capacity holds', () => {
    const input = fixture();
    addReserved(input);
    input.regional!.state.accounts.britain!.configuration.allocatedFactories = 0;
    const held = buildDeliveryGoalTrace(input);
    expect(held).toMatchObject({ credited: 20, warehouse: 60, reserved: 20, inTransit: 0 });
    expect(held.relatedShipments[0].holdReason).toContain('출발 용량');
    input.regional!.state.accounts.britain!.configuration.allocatedFactories = 2;
    input.regional!.state = advanceRegionalTransportWeek(input.regional!.state, { ...input.regional!.context, week: 14 }).state;
    input.regional!.context.week = 14;
    input.context.week = 14;
    const moving = buildDeliveryGoalTrace(input);
    expect(moving).toMatchObject({ credited: 20, reserved: 0, inTransit: 20 });
    expect(moving.nextStep.kind).toBe('verification');
  });

  it('does not prematurely succeed when the quantity is met before the deadline', () => {
    const input = fixture();
    input.pledge.targetQuantity = 20;
    expect(buildDeliveryGoalTrace(input)).toMatchObject({ available: true, credited: 20, remaining: 0, nextStep: { kind: 'verification' } });
    expect(buildDeliveryGoalTrace(input).nextStep.reason).toContain('성공으로 확정하지');
    expect(input.pledge.status).toBe('open');
  });

  it.each(['succeeded', 'failed'] as const)('shows %s history without blaming current personnel, production, warehouse or blockers', (status) => {
    const input = fixture();
    input.pledge = { ...input.pledge, status, resolvedWeek: 14, targetQuantity: status === 'succeeded' ? 20 : 50 };
    input.context.week = 15;
    input.regional!.context.week = 15;
    addReserved(input);
    input.regional!.context.territories = input.regional!.context.territories.map((territory) => ({ ...territory, ownerId: 'japan' as const }));
    input.context.staff = input.context.staff.map((member) => ({ ...member, personId: 'replacement-' + member.personId }));
    const trace = buildDeliveryGoalTrace(input);
    expect(trace).toMatchObject({ available: true, credited: 20, production: null, warehouse: null, reserved: null, inTransit: null,
      relatedShipments: [], nextStep: { kind: 'verification' } });
    expect(trace.receipts[0].shipmentId).toBe('cargo:original-1');
    expect(trace.notes.join(' ')).toContain('과거 결과의 원인으로 연결하지');
  });
});

describe('delivery goal scope and corrupted data', () => {
  it.each(['foreign', 'war', 'replaced', 'rehired', 'duplicateOwner', 'ambiguousLine', 'void', 'futureGoal', 'hidden'] as const)('does not connect current material for %s', (kind) => {
    const input = fixture();
    if (kind === 'foreign') input.context.nationId = 'japan';
    if (kind === 'war') input.context.phase = 'war';
    if (kind === 'replaced') input.context.staff = input.context.staff.map((member) => ({ ...member, personId: 'replacement-' + member.personId }));
    if (kind === 'rehired') input.context.staff = input.context.staff.map((member) => ({ ...member, joinedWeek: 12 }));
    if (kind === 'duplicateOwner') input.context.staff = [...input.context.staff, { ...input.context.staff[0], id: 'other-seat' }];
    if (kind === 'ambiguousLine') input.context.production = [...input.context.production, { ...input.context.production[0] }];
    if (kind === 'void') input.pledge.status = 'void';
    if (kind === 'futureGoal') { input.pledge.createdWeek = 14; input.pledge.deadlineWeek = 18; }
    if (kind === 'hidden') input.context.manageableDepartments = [];
    const trace = buildDeliveryGoalTrace(input);
    expect(trace.available).toBe(false);
    expect(trace.reason).toBeTruthy();
    expect(trace.production).toBeNull();
    expect(trace.warehouse).toBeNull();
    expect(trace.relatedShipments).toEqual([]);
    expect(trace.receipts.every((receipt) => receipt.shipmentId === null)).toBe(true);
    if (kind === 'foreign' || kind === 'hidden') expect(trace.receipts).toEqual([]);
  });

  it.each(['nation', 'week', 'futureWatermark', 'quarantine', 'duplicateShipment', 'invalidQuantity', 'badChronology', 'missingAccount'] as const)('preserves stored credits while refusing unsafe regional state: %s', (kind) => {
    const input = fixture();
    const account = input.regional!.state.accounts.britain!;
    if (kind === 'nation') input.regional!.context.nationId = 'japan';
    if (kind === 'week') input.regional!.context.week = 12;
    if (kind === 'futureWatermark') account.lastTransportWeek = 14;
    if (kind === 'quarantine') input.regional!.state.quarantinedAccounts.britain = { original: 'unrecoverable' };
    if (kind === 'duplicateShipment') account.shipments.push({ ...account.shipments[0] });
    if (kind === 'invalidQuantity') account.warehouse.infantryEquipment = NaN;
    if (kind === 'badChronology') account.shipments[0].deliveredWeek = 10;
    if (kind === 'missingAccount') delete input.regional!.state.accounts.britain;
    const trace = buildDeliveryGoalTrace(input);
    expect(trace).toMatchObject({ available: true, credited: 20, warehouse: null, reserved: null, inTransit: null, relatedShipments: [] });
    expect(trace.receipts[0].shipmentId).toBeNull();
    expect(trace.notes.join(' ')).not.toMatch(/NaN|Infinity/);
  });

  it('keeps future shipment records out of current related material', () => {
    const input = fixture();
    addReserved(input);
    input.regional!.state.accounts.britain!.shipments.find((shipment) => shipment.id === 'pending-1')!.reservedWeek = 14;
    const trace = buildDeliveryGoalTrace(input);
    expect(trace.reserved).toBe(0);
    expect(trace.relatedShipments).toEqual([]);
    expect(trace.receipts[0].shipmentId).toBe('cargo:original-1');
  });

  it('does not let a forged success record supply current progress or material', () => {
    const input = fixture();
    input.pledge.status = 'succeeded';
    input.pledge.resolvedWeek = 13;
    const trace = buildDeliveryGoalTrace(input);
    expect(trace).toMatchObject({ available: false, credited: 20, production: null, warehouse: null, relatedShipments: [] });
  });

  it('permits report-only reading without advertising a new dispatch command or granting authority', () => {
    const input = fixture();
    input.context.industryMandate.mode = 'report';
    input.regional!.context.authorized = false;
    const trace = buildDeliveryGoalTrace(input);
    expect(trace.available).toBe(true);
    expect(trace.nextStep.label).toContain('검토');
    expect(input.context.industryMandate.mode).toBe('report');
    expect(input.regional!.context.authorized).toBe(false);
  });

  it('does not expose goal details behind a locked industry mandate', () => {
    const input = fixture();
    input.context.industryMandate.mode = 'locked';
    expect(buildDeliveryGoalTrace(input)).toMatchObject({ available: false, credited: 0, production: null, warehouse: null, receipts: [], relatedShipments: [] });
  });

  it('routes an exact reserved shipment to records, not an unrelated dispatch form', () => {
    const input = fixture();
    addReserved(input);
    expect(buildDeliveryGoalTrace(input).nextStep).toMatchObject({ kind: 'records', shipmentId: 'pending-1' });
  });
});
