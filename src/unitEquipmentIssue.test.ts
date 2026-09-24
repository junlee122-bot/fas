import { describe, expect, it } from 'vitest';
import { createUnitEquipmentIssueState, getUnitEquipmentIssueReceipts, issueUnitEquipment, normalizeUnitEquipmentIssueState, reviewUnitEquipmentIssue, UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT } from './unitEquipmentIssue';
import type { UnitEquipmentIssueContext, UnitEquipmentIssueState } from './unitEquipmentIssue';
import type { DivisionType } from './types';

function fixture(type: DivisionType = 'infantry'): UnitEquipmentIssueContext {
  return { nationId: 'britain', week: 4, playerFaction: 'allies', authorized: true,
    divisions: [{ id: 'first', name: '제1사단', type, strength: 90, organization: 85, experience: 50, supply: 70, territoryId: 'depot', commanderId: 'commander', status: 'ready' }],
    territories: [{ id: 'depot', name: '후방 보급 거점', region: '검증', x: 1, y: 1, controller: 'allies', ownerId: 'britain', value: 1, supply: 80, terrain: '평야', siteType: 'city', neighbors: [] }],
    playableTerritoryIds: ['depot'], stockpile: { infantryEquipment: 500, tanks: 100, aircraft: 20, convoys: 30, artillery: 40, trucks: 50 },
    commandableDivisionIds: new Set(['first']), activeDivisionIds: new Set(), seaBusyDivisionIds: new Set() };
}
function issue(context = fixture(), state = createUnitEquipmentIssueState()) {
  const review = reviewUnitEquipmentIssue(state, 'first', context);
  return issueUnitEquipment(state, { divisionId: 'first', reviewKey: review.reviewKey ?? '' }, context);
}

describe('explicit national-depot equipment issue', () => {
  it('reviews without changing stocks, supply, ledger or awarding results', () => {
    const context = fixture(); const state = createUnitEquipmentIssueState();
    const before = structuredClone({ context, state });
    const review = reviewUnitEquipmentIssue(state, 'first', context);
    expect(review).toMatchObject({ allowed: true, preview: { quantity: 100, stockBefore: 500, stockAfter: 400, supplyBefore: 70, supplyAfter: 80, supplyGain: 10 } });
    expect({ context, state }).toEqual(before);
    review.preview!.divisionName = 'modified preview';
    expect(context.divisions[0].name).toBe('제1사단');
  });
  it.each(['infantry', 'airborne', 'marine'] as const)('actually deducts infantry equipment for %s and records exact receiving unit', (type) => {
    const context = fixture(type); const result = issue(context);
    expect(result.applied).toBe(true);
    expect(result.stockpile.infantryEquipment).toBe(400);
    expect(result.divisions[0].supply).toBe(80);
    expect(result.receipt).toMatchObject({ nationId: 'britain', week: 4, divisionId: 'first', territoryId: 'depot', divisionType: type, equipmentKey: 'infantryEquipment', quantity: 100 });
    expect(result.stockpile.tanks).toBe(100);
    expect(context.stockpile.infantryEquipment).toBe(500);
    expect(context.divisions[0].supply).toBe(70);
  });
  it('armor uses tanks, not rifle stock, without granting strength, experience or model changes', () => {
    const context = fixture('armor'); const result = issue(context);
    expect(result.applied).toBe(true);
    expect(result.stockpile).toMatchObject({ tanks: 80, infantryEquipment: 500 });
    expect(result.receipt).toMatchObject({ equipmentKey: 'tanks', quantity: 20 });
    expect(result.divisions[0]).toEqual({ ...context.divisions[0], supply: 80 });
  });
  it('caps the supply benefit and charges only the explicit rounded final fraction', () => {
    const context = fixture(); context.divisions = [{ ...context.divisions[0], supply: 98.25 }];
    const result = issue(context);
    expect(result.receipt).toMatchObject({ quantity: 18, supplyGain: 1.75, supplyAfter: 100, stockAfter: 482 });
    expect(normalizeUnitEquipmentIssueState(result.state).quarantinedAccounts).toEqual({});
  });
  it('allows a recovering unit at a valid depot', () => {
    const context = fixture(); context.divisions = [{ ...context.divisions[0], status: 'recovering' }];
    expect(issue(context).applied).toBe(true);
  });
  it('blocks replay even with the old stock/supply context and preserves references on rejection', () => {
    const context = fixture(); const state = createUnitEquipmentIssueState();
    const review = reviewUnitEquipmentIssue(state, 'first', context);
    const first = issueUnitEquipment(state, { divisionId: 'first', reviewKey: review.reviewKey! }, context);
    const replay = issueUnitEquipment(first.state, { divisionId: 'first', reviewKey: review.reviewKey! }, context);
    expect(replay.applied).toBe(false);
    expect(replay.reason).toContain('이미');
    expect(replay.state).toBe(first.state); expect(replay.stockpile).toBe(context.stockpile); expect(replay.divisions).toBe(context.divisions);
  });
  it('allows new review next week, and retains the replay fence after history compaction', () => {
    const context = fixture(); const first = issue(context);
    const compacted = structuredClone(first.state); compacted.accounts.britain!.receipts = [];
    expect(issue(context, compacted).applied).toBe(false);
    const nextContext = { ...context, week: 5, divisions: first.divisions, stockpile: first.stockpile };
    const next = issue(nextContext, compacted);
    expect(next.applied).toBe(true); expect(next.stockpile.infantryEquipment).toBe(300);
    expect(next.state.accounts.britain!.lastIssuedWeek.first).toBe(5);
  });

  it.each([
    ['unauthorized', (c: UnitEquipmentIssueContext) => { c.authorized = false; }],
    ['out of scope', (c: UnitEquipmentIssueContext) => { c.commandableDivisionIds = new Set(); }],
    ['settling', (c: UnitEquipmentIssueContext) => { c.processingWeek = true; }],
    ['active order', (c: UnitEquipmentIssueContext) => { c.activeDivisionIds = new Set(['first']); }],
    ['sea operation', (c: UnitEquipmentIssueContext) => { c.seaBusyDivisionIds = new Set(['first']); }],
    ['combat', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], status: 'combat' }]; }],
    ['moving', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], status: 'moving' }]; }],
    ['full', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], supply: 100 }]; }],
    ['insufficient actual stock', (c: UnitEquipmentIssueContext) => { c.stockpile.infantryEquipment = 99; }],
    ['bad stock', (c: UnitEquipmentIssueContext) => { c.stockpile.infantryEquipment = NaN; }],
    ['fractional inventory', (c: UnitEquipmentIssueContext) => { c.stockpile.infantryEquipment = 100.5; }],
    ['bad supply', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], supply: -1 }]; }],
    ['inactive site', (c: UnitEquipmentIssueContext) => { c.playableTerritoryIds = []; }],
    ['foreign owner', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], ownerId: 'usa' }]; }],
    ['hostile controller', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], controller: 'axis' }]; }],
    ['missing owner', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], ownerId: undefined }]; }],
    ['sea site', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], siteType: 'sea' }]; }],
    ['sea terrain', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], terrain: '해역' }]; }],
    ['weak depot', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], supply: 49 }]; }],
    ['invalid depot', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], supply: NaN }]; }],
    ['duplicate unit', (c: UnitEquipmentIssueContext) => { c.divisions = [...c.divisions, { ...c.divisions[0], name: 'another unit' }]; }],
    ['deleted unit', (c: UnitEquipmentIssueContext) => { c.divisions = []; }],
    ['duplicate site', (c: UnitEquipmentIssueContext) => { c.territories = [...c.territories, { ...c.territories[0] }]; }],
    ['missing site', (c: UnitEquipmentIssueContext) => { c.territories = []; }],
    ['invalid week', (c: UnitEquipmentIssueContext) => { c.week = -1; }],
  ] as const)('fails closed for %s', (_name, mutate) => {
    const context = fixture(); mutate(context); const state = createUnitEquipmentIssueState();
    const result = issue(context, state);
    expect(result.applied).toBe(false); expect(result.receipt).toBeNull(); expect(result.state).toBe(state);
  });

  it.each([
    ['nation', (c: UnitEquipmentIssueContext) => { c.nationId = 'usa'; c.territories = [{ ...c.territories[0], ownerId: 'usa' }]; }],
    ['week', (c: UnitEquipmentIssueContext) => { c.week++; }],
    ['stock', (c: UnitEquipmentIssueContext) => { c.stockpile.infantryEquipment++; }],
    ['supply', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], supply: 71 }]; }],
    ['same-id renamed target', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], name: '새 사단' }]; }],
    ['same-id different type', (c: UnitEquipmentIssueContext) => { c.divisions = [{ ...c.divisions[0], type: 'marine' }]; }],
    ['depot state', (c: UnitEquipmentIssueContext) => { c.territories = [{ ...c.territories[0], supply: 81 }]; }],
  ] as const)('rejects stale review after %s changes, without automatically adopting new amount', (_name, mutate) => {
    const context = fixture(); const state = createUnitEquipmentIssueState(); const review = reviewUnitEquipmentIssue(state, 'first', context);
    mutate(context);
    expect(reviewUnitEquipmentIssue(state, 'first', context).allowed).toBe(true);
    const result = issueUnitEquipment(state, { divisionId: 'first', reviewKey: review.reviewKey! }, context);
    expect(result.applied).toBe(false); expect(result.reason).toContain('검토 이후');
  });

  it('upgrades absent legacy state without inventing previous equipment receipts', () => {
    expect(normalizeUnitEquipmentIssueState(undefined)).toEqual(createUnitEquipmentIssueState());
  });
  it.each([null, {}, { version: 2, accounts: {}, quarantinedAccounts: {} }, { version: 1, accounts: [] }, 'bad'])('quarantines malformed root and survives saving', (raw) => {
    const state = normalizeUnitEquipmentIssueState(raw); const restored = normalizeUnitEquipmentIssueState(JSON.parse(JSON.stringify(state)));
    expect(restored.quarantinedRoot).toEqual(raw); expect(issue(fixture(), restored).applied).toBe(false);
  });
  it('retains undefined corrupt-account quarantine across JSON saves', () => {
    const state = normalizeUnitEquipmentIssueState({ version: 1, accounts: { britain: undefined }, quarantinedAccounts: {} });
    const restored = normalizeUnitEquipmentIssueState(JSON.parse(JSON.stringify(state)));
    expect(restored.quarantinedAccounts).toEqual({ britain: null });
    expect(issue(fixture(), restored).applied).toBe(false);
  });
  it.each(['duplicate', 'foreign', 'tampered quantity', 'missing fence', 'future receipt'] as const)('never accepts %s in saved account', (scenario) => {
    const state = issue().state; const account = state.accounts.britain!;
    if (scenario === 'duplicate') account.receipts.push({ ...account.receipts[0] });
    if (scenario === 'foreign') account.receipts[0].nationId = 'usa';
    if (scenario === 'tampered quantity') account.receipts[0].quantity = 1;
    if (scenario === 'missing fence') account.lastIssuedWeek = {};
    if (scenario === 'future receipt') { account.lastIssuedWeek.first = 100; }
    const normalized = normalizeUnitEquipmentIssueState(state);
    expect(issue({ ...fixture(), week: 5 }, normalized).applied).toBe(false);
    expect(getUnitEquipmentIssueReceipts(normalized, 'britain', 'first', 5)).toEqual([]);
  });
  it('keeps foreign nation ledger isolated instead of borrowing another national receipt', () => {
    const state = issue().state;
    expect(getUnitEquipmentIssueReceipts(state, 'usa', 'first', 4)).toEqual([]);
    const context = fixture(); context.nationId = 'usa'; context.territories = [{ ...context.territories[0], ownerId: 'usa' }];
    expect(issue(context, state).applied).toBe(true);
    expect(state.accounts.britain!.receipts).toHaveLength(1);
  });
  it('does not expose other units, future receipts or mutable receipt references', () => {
    const state = issue().state;
    expect(getUnitEquipmentIssueReceipts(state, 'britain', 'other', 4)).toEqual([]);
    expect(getUnitEquipmentIssueReceipts(state, 'britain', 'first', 3)).toEqual([]);
    const receipts = getUnitEquipmentIssueReceipts(state, 'britain', 'first', 4); receipts[0].quantity = 9;
    expect(state.accounts.britain!.receipts[0].quantity).toBe(100);
  });
  it('compacts history without forgetting any division replay fence', () => {
    let state: UnitEquipmentIssueState = createUnitEquipmentIssueState();
    for (let index = 0; index < UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT + 2; index++) {
      const context = fixture(); const id = `unit-${index}`;
      context.divisions = [{ ...context.divisions[0], id }]; context.commandableDivisionIds = new Set([id]);
      const review = reviewUnitEquipmentIssue(state, id, context);
      const result = issueUnitEquipment(state, { divisionId: id, reviewKey: review.reviewKey! }, context);
      expect(result.applied).toBe(true); state = result.state;
    }
    expect(state.accounts.britain!.receipts).toHaveLength(UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT);
    expect(Object.keys(state.accounts.britain!.lastIssuedWeek)).toHaveLength(UNIT_EQUIPMENT_ISSUE_RECEIPT_LIMIT + 2);
    expect(state.accounts.britain!.lastIssuedWeek['unit-0']).toBe(4);
  });
});
