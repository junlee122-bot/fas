import { describe, expect, it } from 'vitest';
import { createStaffRoster } from './campaign';
import { forecastPostwarIndustry } from './postwarIndustry';
import { advanceStaffDeliveryPledges, buildStaffDeliveryReceipts, createStaffDeliveryPledge, createStaffDeliveryPledgeState, deriveStaffDeliveryPledgeForecast, getStaffDeliveryPledgeLines, getStaffDeliveryPledgeQuantity, normalizeStaffDeliveryPledges } from './staffDeliveryPledges';
import type { StaffDeliveryPledgeCommand, StaffDeliveryPledgeContext, StaffDeliveryPledgeMetric, StaffDeliveryReceipt } from './staffDeliveryPledges';

function fixture() {
  const staff = createStaffRoster('britain', 'britain-tier1').map((member) => ({ ...member, joinedWeek: 0 }));
  const context: StaffDeliveryPledgeContext = {
    nationId: 'britain', week: 10, phase: 'nation', staff,
    production: [{ id: 'rifle', name: '보병 장비 생산선', assigned: 5, output: 100, efficiency: 100, category: '보병', icon: 'rifle' }, { id: 'sherman', name: '차량 생산선', assigned: 5, output: 10, efficiency: 100, category: '전차', icon: 'tank' }],
    manageableDepartments: staff.map((member) => member.department),
    industryMandate: { tab: 'industry', mode: 'direct', label: '직접 결재', reason: '보직 권한', authorityRoute: '기존 경로' },
    lineEquipment: [{ lineId: 'rifle', equipmentKey: 'infantryEquipment' }, { lineId: 'sherman', equipmentKey: 'tanks' }],
  };
  const command: StaffDeliveryPledgeCommand = { id: 'pledge-1', expectedWeek: 10, staffId: staff[0].id, personId: staff[0].personId, lineId: 'rifle', metric: 'factory-completed', targetQuantity: 20, durationWeeks: 2 };
  return { context, command };
}
const receipt = (overrides: Partial<StaffDeliveryReceipt> = {}): StaffDeliveryReceipt => ({ id: 'factory-11-rifle', nationId: 'britain', week: 11, equipmentKey: 'infantryEquipment', source: 'factory-completed', quantity: 12, lineId: 'rifle', ...overrides });
function opened(metric: StaffDeliveryPledgeMetric = 'factory-completed') {
  const { context, command } = fixture();
  const result = createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { ...command, metric }, context);
  expect(result.applied).toBe(true);
  return { context, command, state: result.state };
}

describe('staff delivery pledges', () => {
  it('creates one immutable actual-person and line commitment without reserving goods, charging costs or awarding performance', () => {
    const { context, command } = fixture();
    const before = JSON.stringify(context);
    const empty = createStaffDeliveryPledgeState();
    const result = createStaffDeliveryPledge(empty, command, context);
    expect(result.state.pledges[0]).toMatchObject({ nationId: 'britain', personId: command.personId, staffName: context.staff[0].name, createdWeek: 10, deadlineWeek: 12, targetQuantity: 20, status: 'open', receipts: [] });
    expect(result.reason).toContain('보상은 적용하지 않았습니다');
    expect(result).not.toHaveProperty('gameDelta');
    expect(result).not.toHaveProperty('staff');
    expect(result.completed).toEqual([]);
    expect(empty.pledges).toEqual([]);
    expect(JSON.stringify(context)).toBe(before);
  });

  it('requires industry direct authority and the exact owner inside managed departments', () => {
    const { context, command } = fixture();
    for (const mode of ['request', 'report', 'locked'] as const) expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, { ...context, industryMandate: { ...context.industryMandate, mode } }).applied).toBe(false);
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, { ...context, manageableDepartments: [context.staff[1].department] }).applied).toBe(false);
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, { ...context, phase: 'war' }).applied).toBe(false);
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, { ...context, industryMandate: { ...context.industryMandate, tab: 'organization' } }).applied).toBe(false);
  });

  it('rejects stale review, replacement persons, missing owners, invalid quantities and unsupported periods', () => {
    const { context, command } = fixture();
    for (const change of [{ expectedWeek: 9 }, { personId: 'replacement' }, { staffId: 'missing' }, { targetQuantity: 0 }, { targetQuantity: -1 }, { targetQuantity: 1.5 }, { targetQuantity: Infinity }, { targetQuantity: NaN }, { durationWeeks: 3 }, { metric: 'warehouse' }]) expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { ...command, ...change } as StaffDeliveryPledgeCommand, context).applied).toBe(false);
    const ambiguous = { ...context, staff: [...context.staff, context.staff[0]] };
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, ambiguous).applied).toBe(false);
    for (const durationWeeks of [2, 4, 8] as const) expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { ...command, durationWeeks }, context).state.pledges[0].deadlineWeek).toBe(10 + durationWeeks);
  });

  it('does not infer equipment from names and rejects an ambiguous same-key line mapping', () => {
    const { context, command } = fixture();
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, { ...context, lineEquipment: [] }).applied).toBe(false);
    const ambiguous = { ...context, lineEquipment: [...context.lineEquipment, { lineId: 'sherman', equipmentKey: 'infantryEquipment' as const }] };
    expect(getStaffDeliveryPledgeLines(ambiguous)).toEqual([]);
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), command, ambiguous).applied).toBe(false);
    expect(createStaffDeliveryPledge(createStaffDeliveryPledgeState(), { ...command, lineId: 'made-up-line' }, context).applied).toBe(false);
  });

  it('blocks repeated command IDs and overlapping promises for the same person or line', () => {
    const { context, command, state } = opened();
    expect(createStaffDeliveryPledge(state, command, context).applied).toBe(false);
    expect(createStaffDeliveryPledge(state, { ...command, id: 'other-id', metric: 'national-available' }, context).applied).toBe(false);
    expect(createStaffDeliveryPledge(state, { ...command, id: 'other-id', lineId: 'sherman' }, context).applied).toBe(false);
    expect(createStaffDeliveryPledge(state, { ...command, id: 'other-id', staffId: context.staff[1].id, personId: context.staff[1].personId }, context).applied).toBe(false);
    expect(createStaffDeliveryPledge(state, { ...command, id: 'other-id', lineId: 'sherman', staffId: context.staff[1].id, personId: context.staff[1].personId }, context).applied).toBe(true);
  });

  it('counts only the chosen actual factory line, not planned production or transport arrivals', () => {
    const { state, context } = opened();
    const advanced = advanceStaffDeliveryPledges(state, { ...context, week: 11 }, [receipt(), receipt({ id: 'same-equipment-wrong-line', lineId: 'sherman', quantity: 99 }), receipt({ id: 'arrival', source: 'shipment-arrival', quantity: 99 }), receipt({ id: 'direct', source: 'national-direct', quantity: 99 }), receipt({ id: 'plan', source: 'planned' as StaffDeliveryReceipt['source'], quantity: 99 })]);
    expect(getStaffDeliveryPledgeQuantity(advanced.state.pledges[0])).toBe(12);
    expect(advanced.state.pledges[0].status).toBe('open');
    expect(advanced.completed).toEqual([]);
  });

  it('counts national direct plus actual arrivals including older warehouse goods, never warehouse balances or factory totals', () => {
    const { state, context } = opened('national-available');
    const advanced = advanceStaffDeliveryPledges(state, { ...context, week: 11 }, [
      receipt({ id: 'new-direct', source: 'national-direct', quantity: 7, lineId: undefined }),
      receipt({ id: 'old-production-arrived', source: 'shipment-arrival', quantity: 13, lineId: undefined }),
      receipt({ quantity: 500 }),
      receipt({ id: 'warehouse', source: 'warehouse-staged' as StaffDeliveryReceipt['source'], quantity: 999 }),
    ]);
    expect(getStaffDeliveryPledgeQuantity(advanced.state.pledges[0])).toBe(20);
    expect(advanced.state.pledges[0].status).toBe('open');
    const due = advanceStaffDeliveryPledges(advanced.state, { ...context, week: 12 }, []);
    expect(due.state.pledges[0].status).toBe('succeeded');
    expect(due.completed).toHaveLength(1);
  });

  it('deduplicates IDs within the batch and after save/reload, with one settlement batch per arrival week', () => {
    const { state, context } = opened();
    const once = advanceStaffDeliveryPledges(state, { ...context, week: 11 }, [receipt(), receipt(), receipt({ quantity: 999 })]);
    expect(getStaffDeliveryPledgeQuantity(once.state.pledges[0])).toBe(12);
    const repeatedWeek = advanceStaffDeliveryPledges(once.state, { ...context, week: 11 }, [receipt({ id: 'late-same-week', quantity: 99 })]);
    expect(repeatedWeek.applied).toBe(false);
    expect(repeatedWeek.state).toEqual(once.state);
    const restored = normalizeStaffDeliveryPledges(JSON.parse(JSON.stringify(once.state)), { ...context, week: 11 });
    const due = advanceStaffDeliveryPledges(restored, { ...context, week: 12 }, [receipt({ week: 12 }), receipt({ id: 'factory-12', week: 12, quantity: 8 })]);
    expect(getStaffDeliveryPledgeQuantity(due.state.pledges[0])).toBe(20);
    expect(due.state.pledges[0].receipts).toHaveLength(2);
    expect(advanceStaffDeliveryPledges(due.state, { ...context, week: 12 }, []).completed).toEqual([]);
    expect(advanceStaffDeliveryPledges(due.state, { ...context, week: 13 }, [receipt({ id: 'more', week: 13 })]).completed).toEqual([]);
  });

  it('counts only weeks after creation through the inclusive deadline and ignores foreign/invalid receipts', () => {
    const { state, context } = opened();
    const due = advanceStaffDeliveryPledges(state, { ...context, week: 13 }, [receipt({ id: 'at-creation', week: 10, quantity: 100 }), receipt({ id: 'too-late', week: 13, quantity: 100 }), receipt({ id: 'future', week: 14, quantity: 100 }), receipt({ id: 'foreign', nationId: 'usa', quantity: 100 }), receipt({ id: 'wrong-key', equipmentKey: 'tanks', quantity: 100 }), receipt({ id: 'zero', quantity: 0 }), receipt({ id: 'negative', quantity: -1 }), receipt({ id: 'fraction', quantity: 1.5 }), receipt({ id: 'nan', quantity: NaN }), receipt({ id: 'right-at-deadline', week: 12, quantity: 20 })]);
    expect(due.state.pledges[0].status).toBe('succeeded');
    expect(getStaffDeliveryPledgeQuantity(due.state.pledges[0])).toBe(20);
    expect(due.state.pledges[0].receipts.map((item) => item.id)).toEqual(['right-at-deadline']);
  });

  it('waits for the deadline even after sufficient quantity and fails actual shortfalls without rewards or penalties', () => {
    const { state, context } = opened();
    const before = JSON.stringify(context);
    const early = advanceStaffDeliveryPledges(state, { ...context, week: 11 }, [receipt({ quantity: 30 })]);
    expect(early.state.pledges[0].status).toBe('open');
    expect(early.completed).toEqual([]);
    const empty = advanceStaffDeliveryPledges(state, { ...context, week: 12 }, []);
    expect(empty.state.pledges[0].status).toBe('failed');
    expect(empty.completed[0].resolution).toContain('보상·벌점은 없습니다');
    expect(empty).not.toHaveProperty('gameDelta');
    expect(empty).not.toHaveProperty('staff');
    expect(JSON.stringify(context)).toBe(before);
  });

  it('voids departed/replaced/reassigned owners and a different country before counting receipts', () => {
    const { state, context } = opened();
    for (const change of [
      { staff: context.staff.slice(1) },
      { staff: context.staff.map((member, index) => index === 0 ? { ...member, personId: 'successor', name: context.staff[0].name } : member) },
      { staff: context.staff.map((member, index) => index === 0 ? { ...member, department: context.staff[1].department } : member) },
      { staff: context.staff.map((member, index) => index === 0 ? { ...member, joinedWeek: 11 } : member) },
      { nationId: 'usa' as const }, { phase: 'war' as const }, { production: context.production.slice(1) },
    ]) {
      const current = { ...context, ...change, week: 11 };
      const result = advanceStaffDeliveryPledges(state, current, [receipt({ quantity: 999 })]);
      expect(result.state.pledges[0].status).toBe('void');
      expect(getStaffDeliveryPledgeQuantity(result.state.pledges[0])).toBe(0);
      expect(result.completed).toHaveLength(1);
      expect(result.state.pledges[0].personId).toBe(context.staff[0].personId);
      expect(advanceStaffDeliveryPledges(result.state, current, []).completed).toEqual([]);
    }
  });

  it('does not void a genuine finished historical result after national transfer', () => {
    const { state, context } = opened();
    const finished = advanceStaffDeliveryPledges(state, { ...context, week: 12 }, [receipt({ week: 12, quantity: 20 })]);
    const otherNation = normalizeStaffDeliveryPledges(JSON.parse(JSON.stringify(finished.state)), { ...context, week: 12, nationId: 'usa', staff: [] });
    expect(otherNation.pledges[0].status).toBe('succeeded');
    expect(otherNation.pledges[0].nationId).toBe('britain');
    expect(otherNation.pledges[0].staffName).toBe(context.staff[0].name);
  });

  it('can void same-week nation changes without re-counting the settled week', () => {
    const { state, context } = opened();
    const settled = advanceStaffDeliveryPledges(state, { ...context, week: 11 }, [receipt()]);
    const transferred = advanceStaffDeliveryPledges(settled.state, { ...context, week: 11, nationId: 'usa' }, [receipt({ quantity: 1000 })]);
    expect(transferred.state.pledges[0].status).toBe('void');
    expect(getStaffDeliveryPledgeQuantity(transferred.state.pledges[0])).toBe(12);
    expect(transferred.completed).toHaveLength(1);
  });

  it('starts legacy saves empty and never advances an overdue pledge merely by restoring', () => {
    expect(normalizeStaffDeliveryPledges(undefined)).toEqual(createStaffDeliveryPledgeState());
    expect(normalizeStaffDeliveryPledges({ version: 0, pledges: [{ progress: 999 }] })).toEqual(createStaffDeliveryPledgeState());
    const { state, context } = opened();
    const restored = normalizeStaffDeliveryPledges(JSON.parse(JSON.stringify(state)), { ...context, week: 99 });
    expect(restored.pledges[0].status).toBe('open');
    expect(restored.lastAdvancedWeek).toBe(-1);
    const absent = normalizeStaffDeliveryPledges(state, { ...context, staff: [] });
    expect(absent.pledges[0].status).toBe('void');
    expect(absent.pledges[0].staffName).toBe(state.pledges[0].staffName);
  });

  it('deduplicates restored receipt evidence and refuses unsupported claimed success', () => {
    const { state, context } = opened();
    const malformed = structuredClone(state);
    malformed.pledges[0].receipts = [receipt(), receipt(), receipt({ id: 'invalid', quantity: -1 })];
    malformed.pledges[0].status = 'succeeded'; malformed.pledges[0].resolvedWeek = 12;
    const restored = normalizeStaffDeliveryPledges(malformed, { ...context, week: 12 });
    expect(restored.pledges[0].receipts).toHaveLength(1);
    expect(restored.pledges[0].status).toBe('void');
    expect(restored.pledges[0].resolution).toContain('실제 영수증');
  });

  it('removes future receipts and voids future completion instead of accepting inconsistent saved success', () => {
    const { state, context } = opened();
    const malformed = structuredClone(state);
    malformed.lastAdvancedWeek = 12;
    malformed.pledges[0].receipts = [receipt({ id: 'actual-week11', quantity: 5 }), receipt({ id: 'future-week12', week: 12, quantity: 20 })];
    malformed.pledges[0].status = 'succeeded';
    malformed.pledges[0].resolvedWeek = 12;
    const restored = normalizeStaffDeliveryPledges(malformed, { ...context, week: 11 });
    expect(restored.pledges[0].receipts.map((item) => item.id)).toEqual(['actual-week11']);
    expect(getStaffDeliveryPledgeQuantity(restored.pledges[0])).toBe(5);
    expect(restored.pledges[0].status).toBe('void');
    expect(restored.pledges[0].resolvedWeek).toBe(11);
    expect(restored.diagnostics.join(' ')).toContain('미래 영수증 1건');
    expect(restored.lastAdvancedWeek).toBe(12);
    const later = advanceStaffDeliveryPledges(restored, { ...context, week: 13 }, [receipt({ id: 'future-week12', week: 12, quantity: 20 })]);
    expect(later.completed).toEqual([]);
    expect(later.state.pledges[0].status).toBe('void');
    expect(later).not.toHaveProperty('gameDelta');
  });

  it('rejects a future terminal timestamp even with otherwise sufficient past receipts', () => {
    const { state, context } = opened();
    const finished = advanceStaffDeliveryPledges(state, { ...context, week: 12 }, [receipt({ week: 12, quantity: 20 })]).state;
    finished.pledges[0].resolvedWeek = 13;
    const restored = normalizeStaffDeliveryPledges(finished, { ...context, week: 12 });
    expect(restored.pledges[0].status).toBe('void');
    expect(getStaffDeliveryPledgeQuantity(restored.pledges[0])).toBe(20);
    expect(restored.diagnostics).not.toEqual([]);
    const pendingFuture = structuredClone(state);
    pendingFuture.pledges[0].receipts = [receipt({ week: 12, quantity: 20 })];
    expect(normalizeStaffDeliveryPledges(pendingFuture, { ...context, week: 11 }).pledges[0]).toMatchObject({ status: 'void', receipts: [] });
  });

  it('uses the authoritative next-week forecast and distinguishes staged production from national availability', () => {
    const { context, command } = fixture();
    const forecast = forecastPostwarIndustry({ nationId: context.nationId, week: 11, production: context.production, game: { factories: 10, fuel: 100, steel: 100, treasury: 100 }, stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, spendingLevel: 100, securityBudgetPercent: 100 });
    const factory = deriveStaffDeliveryPledgeForecast(command, context, forecast, 'infantryEquipment');
    expect(factory.factoryPerWeek).toBe(forecast.perLine.find((line) => line.lineId === 'rifle')!.delivered);
    expect(factory.simplePeriodTotal).toBe(factory.factoryPerWeek! * 2);
    const national = deriveStaffDeliveryPledgeForecast({ ...command, metric: 'national-available' }, context, forecast, 'infantryEquipment');
    expect(national.nationalDirectPerWeek).toBe(0);
    expect(national.simplePeriodTotal).toBe(0);
    expect(national.explanation).toContain('배송 도착량은 이 예측에 포함하지 않습니다');
    expect(deriveStaffDeliveryPledgeForecast(command, context, { ...forecast, week: 10 }).factoryPerWeek).toBeNull();
    expect(deriveStaffDeliveryPledgeForecast(command, context, { ...forecast, nationId: 'usa' }).factoryPerWeek).toBeNull();
  });

  it('keeps an existing obligation when a known production line is temporarily assigned zero factories', () => {
    const { state, context } = opened();
    const stopped = { ...context, week: 11, production: context.production.map((line) => ({ ...line, assigned: 0 })) };
    expect(normalizeStaffDeliveryPledges(state, stopped).pledges[0].status).toBe('open');
    const tick = advanceStaffDeliveryPledges(state, stopped, []);
    expect(tick.state.pledges[0].status).toBe('open');
    expect(advanceStaffDeliveryPledges(tick.state, { ...stopped, week: 12 }, []).state.pledges[0].status).toBe('failed');
  });

  it('builds separate stable actual factory/direct/arrival receipts and excludes unapplied forecasts', () => {
    const { context } = fixture();
    const report = forecastPostwarIndustry({ nationId: 'britain', week: 11, production: context.production, game: { factories: 10, fuel: 100, steel: 100, treasury: 100 }, stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, spendingLevel: 100, securityBudgetPercent: 100 });
    const delivery = { id: 'delivery-of-old-stock', nationId: 'britain' as const, week: 11, equipmentKey: 'infantryEquipment' as const, quantity: 7 };
    const input = { nationId: 'britain' as const, week: 11, industryReport: report, industryApplied: true, nationalDirectDelta: { infantryEquipment: report.delivered.infantryEquipment }, deliveries: [delivery, delivery] };
    const batch = buildStaffDeliveryReceipts(input);
    expect(batch.filter((item) => item.source === 'factory-completed')).toHaveLength(2);
    expect(batch.filter((item) => item.source === 'national-direct')).toHaveLength(1);
    expect(batch.filter((item) => item.source === 'shipment-arrival')).toHaveLength(1);
    expect(batch.find((item) => item.source === 'national-direct')?.quantity).toBe(report.delivered.infantryEquipment);
    expect(batch.map((item) => item.id)).toEqual(buildStaffDeliveryReceipts(structuredClone(input)).map((item) => item.id));
    const noIndustry = buildStaffDeliveryReceipts({ ...input, industryApplied: false });
    expect(noIndustry).toHaveLength(1);
    expect(noIndustry[0].source).toBe('shipment-arrival');
    expect(buildStaffDeliveryReceipts({ ...input, industryApplied: false, deliveries: [] })).toEqual([]);
    expect(buildStaffDeliveryReceipts({ ...input, industryReport: { ...report, week: 12 }, deliveries: [] })).toEqual([]);
    expect(buildStaffDeliveryReceipts({ ...input, industryReport: { ...report, nationId: 'usa' }, deliveries: [] })).toEqual([]);
  });

  it('rejects raw stock totals exceeding actual new production and mismatched arrival records', () => {
    const { context } = fixture();
    const report = forecastPostwarIndustry({ nationId: 'britain', week: 11, production: context.production, game: { factories: 10, fuel: 100, steel: 100, treasury: 100 }, stockpile: { infantryEquipment: 0, tanks: 0, aircraft: 0, convoys: 0, artillery: 0, trucks: 0 }, spendingLevel: 100, securityBudgetPercent: 100 });
    const source = { id: 'arrival', nationId: 'britain' as const, week: 11, equipmentKey: 'infantryEquipment' as const, quantity: 3 };
    const batch = buildStaffDeliveryReceipts({ nationId: 'britain', week: 11, industryApplied: true, industryReport: report, nationalDirectDelta: { infantryEquipment: 999999, tanks: -1, aircraft: NaN }, deliveries: [{ ...source, week: 10 }, { ...source, nationId: 'usa' }, { ...source, quantity: 0 }, { ...source, quantity: 1.5 }] });
    expect(batch.every((item) => item.source === 'factory-completed')).toBe(true);
    expect(batch).toHaveLength(2);
    expect(buildStaffDeliveryReceipts({ nationId: 'britain', week: NaN, industryApplied: true, industryReport: report, deliveries: [] })).toEqual([]);
  });
});
