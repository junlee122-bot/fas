import { describe, expect, it } from 'vitest';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import {
  advancePoliticalSettlementWeek, createPoliticalSettlementState, executePoliticalSettlementAction,
  getPoliticalSettlementPolity, normalizePoliticalSettlementState, reviewPoliticalSettlementAction,
  type PoliticalSettlementAction, type PoliticalSettlementContext, type PoliticalSettlementState,
} from './politicalSettlement';
import type { Territory } from './types';

const declaration: PoliticalSettlementAction = { kind: 'declare', name: '조선 시민 연합', seatTerritoryId: 'home', declaration: 'independence' };
const request: PoliticalSettlementAction = { kind: 'request-recognition', partnerNationId: 'usa' };
const start: PoliticalSettlementAction = { kind: 'start-administration', territoryId: 'home' };
const resume: PoliticalSettlementAction = { kind: 'resume-administration', territoryId: 'home' };
function context(overrides: Partial<PoliticalSettlementContext> = {}): PoliticalSettlementContext {
  const site: Territory = { id: 'home', name: '경성', ownerId: 'korea', controller: 'allies', x: 0, y: 0, region: '한반도', value: 1, supply: 65, terrain: '도시', neighbors: [], siteType: 'city' };
  const territories: Territory[] = [site, { ...site, id: 'foreign', name: '충칭', ownerId: 'china' }, { ...site, id: 'us-site', ownerId: 'usa' }, { ...site, id: 'sea', siteType: 'sea' }];
  return { week: 0, nationId: 'korea', territories, control: createMapPoliticalLedger(territories, 0),
    relations: [{ id: 'usa', name: '미국', code: 'US', value: 70, status: '협력', color: '#fff' }, { id: 'china', name: '중국', code: 'CN', value: 70, status: '협력', color: '#fff' }],
    politicalPower: 100, treasury: 100, stability: 60, institutionalCapacity: 60,
    canDeclare: true, canNegotiate: true, canAdminister: true, ...overrides };
}
function act(state: PoliticalSettlementState, action: PoliticalSettlementAction, ctx = context()) {
  const result = executePoliticalSettlementAction(state, action, ctx);
  expect(result.accepted, result.reason).toBe(true);
  return result.state;
}
const declared = (ctx = context()) => act(createPoliticalSettlementState(), declaration, ctx);
const preparing = (ctx = context()) => act(declared(ctx), start, ctx);
const tick = (state: PoliticalSettlementState, week: number, ctx = context()) => advancePoliticalSettlementWeek(state, { ...ctx, week });
function changedTerritory(ctx: PoliticalSettlementContext, changes: Partial<Territory>) {
  const territories = ctx.territories.map((site) => site.id === 'home' ? { ...site, ...changes } : site);
  return { ...ctx, territories, control: createMapPoliticalLedger(territories, ctx.week) };
}

describe('political settlement: declarations are not territorial annexations', () => {
  it('reviews purely and charges declaration once without touching territory, control, diplomacy or resources', () => {
    const ctx = context(); const state = createPoliticalSettlementState();
    const before = JSON.stringify({ ctx, state });
    const review = reviewPoliticalSettlementAction(state, declaration, ctx);
    expect(review.allowed).toBe(true); expect(review.cost).toEqual({ politicalPower: 12, treasury: 0 }); expect(review.dueWeek).toBeNull();
    expect(JSON.stringify({ ctx, state })).toBe(before);
    const result = executePoliticalSettlementAction(state, declaration, ctx);
    expect(result.gameDelta).toEqual({ politicalPower: -12, treasury: 0 });
    expect(result.reason).toContain('비용을 반영했습니다');
    expect(result.state.polities[0]).toMatchObject({ id: 'polity:korea', nationId: 'korea', name: '조선 시민 연합' });
    expect(result.state.recognitions).toEqual([]); expect(result.state.administrations).toEqual([]);
    expect(JSON.stringify({ ctx, state })).toBe(before);
    const repeat = executePoliticalSettlementAction(result.state, declaration, ctx);
    expect(repeat.accepted).toBe(false); expect(repeat.state).toBe(result.state); expect(repeat.gameDelta).toEqual({}); expect(repeat.events).toEqual([]);
  });

  it('keeps numerical receipts readable without rounding an unmet threshold into success', () => {
    const state = act(declared(), request);
    const result = tick(state, 2, context({ stability: 84.96520000000001 }));
    expect(result.state.recognitions[0].reason).toContain('안정도 84.96');
    expect(result.state.recognitions[0].reason).not.toContain('000000');
    const almost = context(); almost.relations[0].value = 64.999999;
    const deferred = tick(state, 2, almost).state.recognitions[0];
    expect(deferred.status).toBe('deferred');
    expect(deferred.reason).toContain('관계 64.99');
  });

  it.each([
    ['canDeclare', declaration], ['canNegotiate', request], ['canAdminister', start],
  ] as const)('requires %s even if every numerical condition is satisfied', (permission, action) => {
    const state = action.kind === 'declare' ? createPoliticalSettlementState() : declared();
    expect(reviewPoliticalSettlementAction(state, action, context({ [permission]: false })).allowed).toBe(false);
  });

  it('permits an exile contact seat but does not grant that foreign site administration rights', () => {
    const ctx = context(); const action = { ...declaration, kind: 'declare', declaration: 'representation', seatTerritoryId: 'foreign' } as const;
    const state = act(createPoliticalSettlementState(), action, ctx);
    expect(state.polities[0].declaration).toBe('representation');
    expect(reviewPoliticalSettlementAction(state, { kind: 'start-administration', territoryId: 'foreign' }, ctx).allowed).toBe(false);
    expect(state.journal[0].detail).toContain('현지 행정 허가가 아닙니다');
    expect(ctx.territories.find((site) => site.id === 'foreign')!.ownerId).toBe('china');
  });

  it.each([
    { ...declaration, name: '' }, { ...declaration, name: '가' }, { ...declaration, name: '가'.repeat(81) },
    { ...declaration, name: '조선\n연합' }, { ...declaration, seatTerritoryId: 'missing' }, { ...declaration, seatTerritoryId: 'sea' },
  ])('rejects malformed names and non-land/missing seats %#', (action) => {
    expect(reviewPoliticalSettlementAction(createPoliticalSettlementState(), action as PoliticalSettlementAction, context()).allowed).toBe(false);
  });

  it('does not trigger declarations or independence automatically from the calendar', () => {
    const result = tick(createPoliticalSettlementState(), 6200);
    expect(result.state.polities).toEqual([]); expect(result.events).toEqual([]); expect(result.gameDelta).toEqual({});
  });

  it('rejects legacy sea sites even when siteType is absent, including physical sea anchors', () => {
    for (const site of [
      { ...context().territories[0], id: 'legacy-sea', terrain: '해역', siteType: undefined },
      { ...context().territories[0], id: 'channel', terrain: '평지', siteType: undefined },
    ]) {
      const ctx = context(); ctx.territories = [...ctx.territories, site]; ctx.control = createMapPoliticalLedger(ctx.territories, 0);
      const action = { ...declaration, seatTerritoryId: site.id } as PoliticalSettlementAction;
      expect(reviewPoliticalSettlementAction(createPoliticalSettlementState(), action, ctx).allowed).toBe(false);
      expect(reviewPoliticalSettlementAction(declared(), { kind: 'start-administration', territoryId: site.id }, ctx).allowed).toBe(false);
    }
  });
});

describe('bilateral government-representation recognition', () => {
  it('charges 8 PP, waits two weeks and prevents duplicate/self/unknown partner requests', () => {
    const state = declared(); const ctx = context();
    const review = reviewPoliticalSettlementAction(state, request, ctx);
    expect(review.cost).toEqual({ politicalPower: 8, treasury: 0 }); expect(review.dueWeek).toBe(2);
    const pending = act(state, request, ctx);
    expect(pending.journal.at(-1)!.detail).toContain('제3주 검토 예정');
    expect(tick(pending, 1).state.recognitions[0].status).toBe('pending');
    expect(reviewPoliticalSettlementAction(pending, request, ctx).allowed).toBe(false);
    expect(reviewPoliticalSettlementAction(state, { kind: 'request-recognition', partnerNationId: 'korea' }, ctx).allowed).toBe(false);
    expect(reviewPoliticalSettlementAction(state, { kind: 'request-recognition', partnerNationId: 'missing' } as never, ctx).allowed).toBe(false);
    expect(reviewPoliticalSettlementAction(state, request, context({ relations: [] })).allowed).toBe(false);
  });

  it.each([
    [20, 60, 'rejected'], [34.99, 60, 'rejected'], [35, 60, 'deferred'],
    [64.99, 60, 'deferred'], [65, 45, 'recognized'], [90, 44, 'deferred'],
  ] as const)('evaluates current relation %s and stability %s as %s, not request-time values', (value, stability, status) => {
    const pending = act(declared(), request);
    const ctx = context({ stability }); ctx.relations = ctx.relations.map((relation) => ({ ...relation, value }));
    const result = tick(pending, 2, ctx);
    expect(result.state.recognitions[0].status).toBe(status);
    expect(result.state.recognitions[0].resolvedWeek).toBe(2);
    expect(result.state.recognitions[0].reason).toContain('정부 대표권에 관한 양자 관계');
    expect(result.state.recognitions[0].reason).toContain('게임 규칙');
    expect(result.gameDelta).toEqual({}); expect(result.state.administrations).toEqual([]);
    expect(ctx.territories[0].ownerId).toBe('korea');
  });

  it('can improve after a weak request, affects one partner only, and refuses an already recognized repeat', () => {
    const initial = context(); initial.relations = initial.relations.map((r) => ({ ...r, value: 20 }));
    let state = act(declared(initial), request, initial);
    state = act(state, { kind: 'request-recognition', partnerNationId: 'china' }, initial);
    const current = context(); current.relations = current.relations.map((r) => ({ ...r, value: r.id === 'usa' ? 80 : 20 }));
    const result = tick(state, 2, current);
    expect(result.state.recognitions.map((r) => [r.partnerNationId, r.status])).toEqual([['usa', 'recognized'], ['china', 'rejected']]);
    expect(reviewPoliticalSettlementAction(result.state, request, { ...current, week: 6 }).allowed).toBe(false);
  });

  it('defers unavailable current evidence and allows retry only four weeks after actual resolution', () => {
    const pending = act(declared(), request);
    const deferred = tick(pending, 10, context({ relations: [] })).state;
    expect(deferred.recognitions[0]).toMatchObject({ status: 'deferred', resolvedWeek: 10 });
    expect(reviewPoliticalSettlementAction(deferred, request, context({ week: 13 })).allowed).toBe(false);
    const retry = act(deferred, request, context({ week: 14 }));
    expect(retry.recognitions).toHaveLength(1); expect(retry.recognitions[0]).toMatchObject({ status: 'pending', requestedWeek: 14, dueWeek: 16 });
    expect(retry.journal.some((event) => event.title.includes('검토 보류'))).toBe(true);
  });
});

describe('local administration: observed consecutive weeks, not annexation or resource farming', () => {
  it('needs no recognition and begins operating only after three real weekly checks', () => {
    const ctx = context(); const result = executePoliticalSettlementAction(declared(ctx), start, ctx);
    expect(result.gameDelta).toEqual({ politicalPower: -8, treasury: -4 });
    expect(result.state.recognitions).toEqual([]);
    let state = result.state;
    for (let week = 1; week <= 3; week += 1) {
      const next = tick(state, week, ctx); state = next.state;
      expect(state.administrations[0].progressWeeks).toBe(week);
      expect(state.administrations[0].status).toBe(week === 3 ? 'operating' : 'preparing');
      expect(next.gameDelta).toEqual({});
    }
    expect(tick(state, 4, ctx).events).toEqual([]);
    expect(reviewPoliticalSettlementAction(state, start, { ...ctx, week: 4 }).allowed).toBe(false);
  });

  it('requires actual jurisdiction; allied alignment, self-owned enemy occupation and stale receipts are insufficient', () => {
    const state = declared(); const ctx = context();
    expect(reviewPoliticalSettlementAction(state, { kind: 'start-administration', territoryId: 'foreign' }, ctx).allowed).toBe(false);
    ctx.control.current.foreign.verifiedControllerNationId = 'korea';
    expect(reviewPoliticalSettlementAction(state, { kind: 'start-administration', territoryId: 'foreign' }, ctx).allowed).toBe(true);
    ctx.control.current.home.verifiedControllerNationId = 'china';
    expect(reviewPoliticalSettlementAction(state, start, ctx).allowed).toBe(false);
    const occupied = changedTerritory(context(), { controller: 'axis' });
    expect(reviewPoliticalSettlementAction(state, start, occupied).allowed).toBe(false);
    occupied.control.current.home.controller = 'allies'; occupied.control.current.home.verifiedControllerNationId = 'korea';
    expect(reviewPoliticalSettlementAction(state, start, occupied).allowed).toBe(false);
  });

  it.each([[39, 60], [65, 44]] as const)('blocks unworkable starts and suspends at supply %s / capacity %s', (supply, institutionalCapacity) => {
    const ctx = changedTerritory(context({ institutionalCapacity }), { supply });
    expect(reviewPoliticalSettlementAction(declared(), start, ctx).allowed).toBe(false);
    const result = tick(preparing(), 1, ctx);
    expect(result.state.administrations[0]).toMatchObject({ status: 'suspended', progressWeeks: 0 });
    expect(reviewPoliticalSettlementAction(result.state, resume, { ...ctx, week: 1 }).allowed).toBe(false);
  });

  it('suspends on control loss, does not auto-resume, and charges explicit resume only once', () => {
    let state = tick(preparing(), 1).state;
    state = tick(state, 2, changedTerritory(context(), { controller: 'axis' })).state;
    expect(state.administrations[0].status).toBe('suspended');
    state = tick(state, 3).state;
    expect(state.administrations[0].status).toBe('suspended');
    const restarted = executePoliticalSettlementAction(state, resume, context({ week: 3 }));
    expect(restarted.accepted).toBe(true); expect(restarted.gameDelta).toEqual({ politicalPower: -4, treasury: 0 });
    expect(restarted.state.administrations[0]).toMatchObject({ startedWeek: 3, progressWeeks: 0 });
    expect(executePoliticalSettlementAction(restarted.state, resume, context({ week: 3 })).accepted).toBe(false);
    state = restarted.state;
    for (const week of [4, 5, 6]) state = tick(state, week).state;
    expect(state.administrations[0].status).toBe('operating');
    expect(tick(state, 7, changedTerritory(context(), { ownerId: 'china' })).state.administrations[0].status).toBe('suspended');
  });

  it('does not turn skipped calendar weeks into preparation ticks', () => {
    let state = tick(preparing(), 1).state;
    state = tick(state, 5).state;
    expect(state.administrations[0]).toMatchObject({ status: 'preparing', progressWeeks: 1 });
    expect(state.administrations[0].reason).toContain('소급하지 않고');
    state = tick(state, 6).state; state = tick(state, 7).state;
    expect(state.administrations[0].status).toBe('operating');
  });

  it('preserves foreign-career polities but does not use current-country stats for their progress or recognition', () => {
    let state = act(preparing(), request);
    const usa = context({ nationId: 'usa' });
    state = act(state, { kind: 'declare', declaration: 'representation', name: '미국 대표 내각', seatTerritoryId: 'us-site' }, usa);
    state = act(state, { kind: 'start-administration', territoryId: 'us-site' }, usa);
    state = tick(state, 1, usa).state;
    expect(getPoliticalSettlementPolity(state, 'korea')).toBeDefined(); expect(getPoliticalSettlementPolity(state, 'usa')).toBeDefined();
    expect(state.administrations.find((a) => a.territoryId === 'home')!.progressWeeks).toBe(0);
    expect(state.administrations.find((a) => a.territoryId === 'us-site')!.progressWeeks).toBe(1);
    state = tick(state, 2, changedTerritory(usa, { controller: 'axis' })).state;
    expect(state.administrations.find((a) => a.territoryId === 'home')!.status).toBe('suspended');
    expect(state.recognitions[0].status).toBe('pending');
    state = tick(state, 3).state;
    expect(state.recognitions[0]).toMatchObject({ status: 'recognized', resolvedWeek: 3 });
  });
});

describe('political settlement persistence and replay safety', () => {
  it('rejects insufficient funds and nonfinite resources without spending or state changes', () => {
    const state = declared();
    for (const ctx of [context({ politicalPower: 7 }), context({ treasury: 3 }), context({ treasury: NaN }), context({ politicalPower: Infinity })]) {
      const result = executePoliticalSettlementAction(state, start, ctx);
      expect(result.accepted).toBe(false); expect(result.state).toBe(state); expect(result.gameDelta).toEqual({});
    }
  });

  it('is idempotent and monotone for weekly processing and actions', () => {
    const state = tick(preparing(), 1).state;
    for (const week of [1, 0, -1, NaN, Infinity]) {
      const result = tick(state, week); expect(result.accepted).toBe(false); expect(result.state).toBe(state); expect(result.events).toEqual([]);
    }
    expect(reviewPoliticalSettlementAction(state, request, context()).allowed).toBe(false);
  });

  it('round-trips without sharing references or altering map/control input', () => {
    const ctx = context(); let state = act(preparing(ctx), request, ctx);
    for (const week of [1, 2, 3]) state = tick(state, week, ctx).state;
    const before = JSON.stringify({ ctx, state });
    const restored = normalizePoliticalSettlementState(JSON.parse(JSON.stringify(state)), ctx.territories, 3);
    expect(restored).toEqual(state); expect(restored).not.toBe(state); expect(restored.polities[0]).not.toBe(state.polities[0]);
    expect(JSON.stringify({ ctx, state })).toBe(before);
  });

  it.each([
    (s: PoliticalSettlementState) => { s.version = 99 as never; },
    (s: PoliticalSettlementState) => { s.lastAdvancedWeek = 101; },
    (s: PoliticalSettlementState) => { s.polities[0].nationId = 'made-up' as never; },
    (s: PoliticalSettlementState) => { s.polities[0].id = 'korea'; },
    (s: PoliticalSettlementState) => { s.polities.push({ ...s.polities[0] }); },
    (s: PoliticalSettlementState) => { s.polities[0].seatTerritoryId = 'sea'; },
    (s: PoliticalSettlementState) => { s.recognitions[0].dueWeek = 0; },
    (s: PoliticalSettlementState) => { s.recognitions[0].polityId = 'unknown'; },
    (s: PoliticalSettlementState) => { s.recognitions[0].resolvedWeek = 0; },
    (s: PoliticalSettlementState) => { s.administrations[0].progressWeeks = 3; s.administrations[0].status = 'operating'; },
    (s: PoliticalSettlementState) => { s.administrations[0].lastProcessedWeek = Infinity; },
    (s: PoliticalSettlementState) => { s.journal.push({ ...s.journal[0] }); },
  ])('restarts malformed saves empty at the load week, not a fabricated past %#', (corrupt) => {
    const ctx = context(); const state = act(preparing(ctx), request, ctx); corrupt(state);
    const restored = normalizePoliticalSettlementState(state, ctx.territories, 100);
    expect(restored).toEqual({ ...createPoliticalSettlementState(), lastAdvancedWeek: 100 });
    expect(reviewPoliticalSettlementAction(restored, declaration, { ...ctx, week: 99 }).allowed).toBe(false);
  });

  it('bounds the journal at 200 while preserving stable unique receipts and the latest bilateral attempt', () => {
    const ctx = context(); ctx.relations = ctx.relations.map((r) => ({ ...r, value: 50 }));
    let state = declared(ctx);
    for (let index = 0; index < 105; index += 1) {
      const week = index * 6;
      state = act(state, request, { ...ctx, week }); state = tick(state, week + 2, ctx).state;
    }
    expect(state.journal).toHaveLength(200);
    expect(new Set(state.journal.map((event) => event.id)).size).toBe(200);
    expect(state.recognitions).toHaveLength(1);
    expect(normalizePoliticalSettlementState(state, ctx.territories, 626)).toEqual(state);
  });
});
