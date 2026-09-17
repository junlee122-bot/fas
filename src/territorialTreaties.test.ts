import { describe, expect, it } from 'vitest';
import { nations } from './campaign';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import {
  advanceTreatyWeek, createTerritorialTreatiesState, executeTreatyAction, getTreatySiteController,
  normalizeTerritorialTreatiesState, reviewTreatyAction,
  type TreatyAction, type TreatyContext, type TreatyState,
} from './territorialTreaties';
import type { Territory } from './types';

const offer: TreatyAction = { kind: 'propose', name: '강원 거점 협정', territoryId: 'home', partnerNationId: 'usa', direction: 'offer' };
const request: TreatyAction = { ...offer, name: '상대 거점 협정', territoryId: 'partner', direction: 'request' };
function context(patch: Partial<TreatyContext> = {}): TreatyContext {
  const home: Territory = { id: 'home', name: '강원 거점', ownerId: 'korea', controller: 'allies', x: 0, y: 0,
    region: '한반도', value: 1, supply: 60, terrain: '도시', neighbors: [], siteType: 'city' };
  const territories: Territory[] = [home, { ...home, id: 'partner', ownerId: 'usa' }, { ...home, id: 'third-party', ownerId: 'china' },
    { ...home, id: 'sea', siteType: 'sea' }, { ...home, id: 'capital', siteType: 'capital' },
    { ...home, id: 'korea' }, { ...home, id: 'channel', siteType: undefined }, { ...home, id: 'legacy-sea', siteType: undefined, terrain: '해역' }];
  return { week: 0, nationId: 'korea', territories, control: createMapPoliticalLedger(territories, 0),
    relations: [{ id: 'usa', name: '미국', code: 'US', value: 80, status: '협력', color: '#fff' }],
    politicalPower: 100, treasury: 100, stability: 60, institutionalCapacity: 60, canNegotiate: true,
    canRatify: true, approvalSupport: 70, approvalLabel: '국무회의 승인', blockedTerritoryIds: [], ...patch };
}
function act(state: TreatyState, action: TreatyAction, ctx = context()) {
  const result = executeTreatyAction(state, action, ctx);
  expect(result.accepted, result.reason).toBe(true);
  return result.state;
}
const proposed = (ctx = context(), action = offer) => act(createTerritorialTreatiesState(), action, ctx);
const tick = (state: TreatyState, week: number, ctx = context()) => advanceTreatyWeek(state, { ...ctx, week });
const answered = (ctx = context(), action = offer) => tick(tick(proposed(ctx, action), 1, ctx).state, 2, ctx).state;
const ratified = (ctx = context(), action = offer) => {
  const state = answered(ctx, action);
  return act(state, { kind: 'ratify', treatyId: state.treaties[0].id }, { ...ctx, week: 2 });
};
function changeControl(ctx: TreatyContext, patch: Partial<Territory>, stale = false): TreatyContext {
  const territories = ctx.territories.map((site) => site.id === 'home' ? { ...site, ...patch } : site);
  return { ...ctx, territories, control: stale ? ctx.control : createMapPoliticalLedger(territories, ctx.week) };
}

describe('territorial treaties: checked control, never inferred sovereignty', () => {
  it('uses checked owner/alignment only as a game-control fallback, not a same-faction claim', () => {
    const ctx = context();
    expect(getTreatySiteController(ctx.territories[0], ctx.control)).toBe('korea');
    expect(getTreatySiteController(ctx.territories[2], ctx.control)).toBe('china');
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...offer, territoryId: 'third-party' }, ctx).allowed).toBe(false);
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...request, territoryId: 'third-party' }, ctx).allowed).toBe(false);
  });
  it('prefers verified actual controller over game ownership and refuses stale ledger snapshots', () => {
    const ctx = context();
    ctx.control.current.home.verifiedControllerNationId = 'usa';
    expect(getTreatySiteController(ctx.territories[0], ctx.control)).toBe('usa');
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, ctx).allowed).toBe(false);
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...request, territoryId: 'home' }, ctx).allowed).toBe(true);
    for (const patch of [{ ownerId: 'china' as const }, { controller: 'axis' as const }]) {
      const stale = changeControl(ctx, patch, true);
      expect(getTreatySiteController(stale.territories[0], stale.control)).toBeUndefined();
      expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...request, territoryId: 'home' }, stale).allowed).toBe(false);
    }
  });
  it('refuses an occupied owner and malformed verified controller without guessing', () => {
    const occupied = changeControl(context(), { controller: 'axis' });
    expect(getTreatySiteController(occupied.territories[0], occupied.control)).toBeUndefined();
    const ctx = context(); ctx.control.current.home.verifiedControllerNationId = 'imaginary' as never;
    expect(getTreatySiteController(ctx.territories[0], ctx.control)).toBeUndefined();
  });
  it('does not silently fall back from a malformed existing ledger record', () => {
    const ctx = context();
    for (const record of [null, undefined, [], 'korea']) {
      const control = { ...ctx.control, current: { ...ctx.control.current, home: record as never } };
      expect(getTreatySiteController(ctx.territories[0], control)).toBeUndefined();
    }
  });
  it('requires the site own-entry that the eventual map receipt will update', () => {
    const ctx = context(); delete ctx.control.current.home;
    expect(getTreatySiteController(ctx.territories[0], ctx.control)).toBeUndefined();
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, ctx).allowed).toBe(false);
    const state = answered();
    expect(reviewTreatyAction(state, { kind: 'ratify', treatyId: state.treaties[0].id }, { ...ctx, week: 2 }).allowed).toBe(false);
    const result = tick(ratified(), 3, ctx);
    expect(result.transfers).toEqual([]); expect(result.state.treaties[0].status).toBe('suspended');
    ctx.control.current = Object.assign(Object.create({ home: context().control.current.home }), ctx.control.current);
    expect(getTreatySiteController(ctx.territories[0], ctx.control)).toBeUndefined();
  });
  it.each(['sea', 'capital', 'korea', 'channel', 'legacy-sea', 'missing'])('excludes non-negotiable site %s', (territoryId) => {
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...offer, territoryId }, context()).allowed).toBe(false);
  });
  it.each(nations)('excludes the %s profile capital even without the capital siteType', (nation) => {
    const ctx = context(); const site = { ...ctx.territories[0], id: nation.capitalTerritoryId };
    const territories = [site];
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...offer, territoryId: site.id }, {
      ...ctx, territories, control: createMapPoliticalLedger(territories, 0),
    }).allowed).toBe(false);
  });
  it('does not disallow an actual land island merely because it is an island', () => {
    const ctx = changeControl(context(), { siteType: 'island' });
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, ctx).allowed).toBe(true);
  });
  it('requires an unambiguous existing site', () => {
    const ctx = context(); ctx.territories = [...ctx.territories, ctx.territories[0]];
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, ctx).allowed).toBe(false);
  });
});

describe('proposal and authority boundaries', () => {
  it('reviews without mutation, spends only 6 PP, and cannot repeat a proposal', () => {
    const state = createTerritorialTreatiesState(); const ctx = context(); const before = JSON.stringify({ state, ctx });
    const review = reviewTreatyAction(state, offer, ctx);
    expect(review).toMatchObject({ allowed: true, cost: { politicalPower: 6, treasury: 0 }, dueWeek: 2 });
    expect(review.summary).toContain('보편적인 영토 주권 승인');
    const result = executeTreatyAction(state, offer, ctx);
    expect(result.gameDelta).toEqual({ politicalPower: -6, treasury: 0 });
    expect(result.transfers).toEqual([]); expect(result.state.treaties[0]).toMatchObject({ fromNationId: 'korea', toNationId: 'usa', status: 'proposed' });
    expect(JSON.stringify({ state, ctx })).toBe(before);
    const repeat = executeTreatyAction(result.state, offer, ctx);
    expect(repeat).toMatchObject({ accepted: false, gameDelta: {}, events: [], transfers: [] });
    expect(repeat.state).toBe(result.state);
  });
  it('reverses donor/recipient only for a valid request for partner-controlled land', () => {
    expect(proposed(context(), request).treaties[0]).toMatchObject({ proposerNationId: 'korea', partnerNationId: 'usa', fromNationId: 'usa', toNationId: 'korea' });
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...request, territoryId: 'home' }, context()).allowed).toBe(false);
  });
  it.each([
    { canNegotiate: false }, { politicalPower: 5.999 }, { politicalPower: NaN }, { politicalPower: Infinity },
    { treasury: -1 }, { week: -1 }, { week: 0.5 }, { week: Number.MAX_SAFE_INTEGER },
    { relations: [] }, { stability: NaN }, { stability: 101 }, { blockedTerritoryIds: ['home'] },
  ])('fails closed on proposal authority, resources or unavailable data %#', (patch) => {
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, context(patch)).allowed).toBe(false);
  });
  it.each([
    { name: '' }, { name: '가' }, { name: '가'.repeat(81) }, { name: '조약\n이름' },
    { partnerNationId: 'korea' }, { partnerNationId: 'missing' }, { direction: 'other' },
  ])('rejects invalid proposal values %#', (patch) => {
    expect(reviewTreatyAction(createTerritorialTreatiesState(), { ...offer, ...patch } as TreatyAction, context()).allowed).toBe(false);
  });
  it('trims valid names and accepts exactly 80 characters', () => {
    expect(proposed(context(), { ...offer, name: '  정식 조약  ' }).treaties[0].name).toBe('정식 조약');
    expect(proposed(context(), { ...offer, name: '가'.repeat(80) }).treaties[0].name).toHaveLength(80);
  });
  it('requires one current partner relation, not duplicates or another country relation', () => {
    const ctx = context();
    for (const relations of [[ctx.relations[0], ctx.relations[0]], [{ ...ctx.relations[0], id: 'china' }], [{ ...ctx.relations[0], value: 101 }]]) {
      expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, { ...ctx, relations }).allowed).toBe(false);
    }
  });
  it('blocks conflicting new negotiations for the same land even by another proposer', () => {
    const state = proposed(); const ctx = context({ nationId: 'usa', relations: [{ ...context().relations[0], id: 'korea' }] });
    expect(reviewTreatyAction(state, { ...request, territoryId: 'home', partnerNationId: 'korea' }, ctx).allowed).toBe(false);
  });
  it('permits only pre-ratification withdrawal by the authorized proposer without refund', () => {
    for (const state of [proposed(), answered()]) {
      const action: TreatyAction = { kind: 'withdraw', treatyId: state.treaties[0].id }; const ctx = context({ week: 2 });
      expect(reviewTreatyAction(state, action, { ...ctx, nationId: 'usa' }).allowed).toBe(false);
      expect(reviewTreatyAction(state, action, { ...ctx, canNegotiate: false }).allowed).toBe(false);
      const result = executeTreatyAction(state, action, ctx);
      expect(result.accepted).toBe(true); expect(result.gameDelta).toEqual({}); expect(result.transfers).toEqual([]);
      expect(result.state.treaties[0].status).toBe('withdrawn');
      expect(executeTreatyAction(result.state, action, ctx).accepted).toBe(false);
      expect(normalizeTerritorialTreatiesState(result.state, ctx.territories, 2)).toEqual(result.state);
    }
    const state = ratified();
    expect(reviewTreatyAction(state, { kind: 'withdraw', treatyId: state.treaties[0].id }, context({ week: 2 })).allowed).toBe(false);
  });
  it('does not reuse the same proposal ID after a same-week withdrawal', () => {
    const state = proposed(); const withdrawn = act(state, { kind: 'withdraw', treatyId: state.treaties[0].id });
    expect(reviewTreatyAction(withdrawn, offer, context()).allowed).toBe(false);
    expect(reviewTreatyAction(withdrawn, offer, context({ week: 1 })).allowed).toBe(true);
  });
});

describe('two observed weekly ticks and current bilateral response', () => {
  it.each([
    ['offer', 50, 45, 'accepted'], ['offer', 49.999, 90, 'rejected'], ['offer', 100, 44.999, 'rejected'],
    ['request', 75, 45, 'accepted'], ['request', 74.999, 100, 'rejected'], ['request', 90, 44.99, 'rejected'],
  ] as const)('%s with relation %s and stability %s produces %s', (direction, value, stability, status) => {
    const ctx = context({ stability }); ctx.relations = [{ ...ctx.relations[0], value }];
    const state = answered(ctx, direction === 'offer' ? offer : request);
    expect(state.treaties[0]).toMatchObject({ status, respondedWeek: 2 });
    expect(state.treaties[0].reason).toContain('게임 규칙');
    expect(state.treaties[0].reason).not.toContain('0000000');
  });
  it('evaluates due-week values, never locks in the proposal-week relationship', () => {
    let state = proposed(); state = tick(state, 1).state;
    const ctx = context(); ctx.relations = [{ ...ctx.relations[0], value: 10 }];
    const result = tick(state, 2, ctx);
    expect(result.state.treaties[0].status).toBe('rejected'); expect(result.transfers).toEqual([]); expect(result.gameDelta).toEqual({});
  });
  it('does not respond in the proposal week or first later tick', () => {
    const state = proposed(context({ week: 5 }));
    expect(tick(state, 5, changeControl(context(), { controller: 'axis' })).state.treaties[0].status).toBe('proposed');
    const result = tick(state, 6);
    expect(result.state.treaties[0].status).toBe('proposed'); expect(result.events).toEqual([]);
    expect(tick(result.state, 7).state.treaties[0].status).toBe('accepted');
  });
  it('never invents unobserved response processing when weeks are skipped', () => {
    const first = tick(proposed(), 100);
    expect(first.state.treaties[0]).toMatchObject({ status: 'proposed', responseDueWeek: 101 });
    expect(normalizeTerritorialTreatiesState(first.state, context().territories, 100)).toEqual(first.state);
    expect(tick(first.state, 101).state.treaties[0].status).toBe('accepted');
  });
  it('rejects on donor control loss even before the response deadline', () => {
    const result = tick(proposed(), 1, changeControl(context(), { controller: 'axis' }));
    expect(result.state.treaties[0]).toMatchObject({ status: 'rejected', respondedWeek: 1 });
    expect(normalizeTerritorialTreatiesState(result.state, context().territories, 1)).toEqual(result.state);
  });
  it('rejects unavailable or malformed current response data without granting rights', () => {
    const state = tick(proposed(), 1).state;
    for (const ctx of [context({ relations: [] }), context({ stability: NaN })]) {
      const result = tick(state, 2, ctx);
      expect(result.state.treaties[0].status).toBe('rejected'); expect(result.transfers).toEqual([]);
    }
  });
  it('retains an overseas career proposal without using the new nation stats or spamming events', () => {
    const foreign = context({ nationId: 'china', stability: 0 });
    const state = tick(proposed(), 1, foreign).state;
    const waiting = tick(state, 2, foreign);
    expect(waiting.state.treaties[0].status).toBe('proposed'); expect(waiting.events).toHaveLength(1);
    expect(waiting.state.treaties[0].reason).toContain('다른 국가의 수치');
    const repeated = tick(waiting.state, 3, foreign);
    expect(repeated.events).toEqual([]); expect(repeated.state.treaties[0].status).toBe('proposed');
    expect(tick(repeated.state, 4).state.treaties[0].status).toBe('accepted');
  });
});

describe('ratification and independent physical handover', () => {
  it('records the agreed right without changing actual control, troops or game ownership', () => {
    const state = answered(); const ctx = context({ week: 2 }); const before = JSON.stringify({ state, ctx });
    const action: TreatyAction = { kind: 'ratify', treatyId: state.treaties[0].id };
    const review = reviewTreatyAction(state, action, ctx);
    expect(review).toMatchObject({ allowed: true, cost: { politicalPower: 8, treasury: 4 }, dueWeek: 3 });
    const result = executeTreatyAction(state, action, ctx);
    expect(result.state.treaties[0]).toMatchObject({ status: 'ratified', ratifiedWeek: 2, handoverDueWeek: 3 });
    expect(result.state.treaties[0].reason).toContain('국무회의 승인 지지 70');
    expect(result.gameDelta).toEqual({ politicalPower: -8, treasury: -4 }); expect(result.transfers).toEqual([]);
    expect(JSON.stringify({ state, ctx })).toBe(before);
    expect(executeTreatyAction(result.state, action, ctx).accepted).toBe(false);
  });
  it.each([
    { canRatify: false }, { approvalSupport: 59.999 }, { approvalSupport: NaN }, { approvalSupport: 101 }, { approvalLabel: '' },
    { institutionalCapacity: 44.99 }, { institutionalCapacity: Infinity }, { stability: 44.99 },
    { politicalPower: 7.999 }, { treasury: 3.999 }, { blockedTerritoryIds: ['home'] }, { nationId: 'usa' as const },
  ])('requires actual highest-office authority, approval and current conditions %#', (patch) => {
    const state = answered();
    expect(reviewTreatyAction(state, { kind: 'ratify', treatyId: state.treaties[0].id }, context({ week: 2, ...patch })).allowed).toBe(false);
  });
  it('accepts exact ratification resource and institutional thresholds', () => {
    const state = answered(); const ctx = context({ week: 2, politicalPower: 8, treasury: 4, approvalSupport: 60, institutionalCapacity: 45, stability: 45 });
    expect(reviewTreatyAction(state, { kind: 'ratify', treatyId: state.treaties[0].id }, ctx).allowed).toBe(true);
  });
  it('requires acceptance and rechecks donor control and other active treaties before ratification', () => {
    const state = proposed(); const action: TreatyAction = { kind: 'ratify', treatyId: state.treaties[0].id };
    expect(reviewTreatyAction(state, action, context()).allowed).toBe(false);
    const ready = answered();
    expect(reviewTreatyAction(ready, action, { ...changeControl(context(), { controller: 'axis' }), week: 2 }).allowed).toBe(false);
    const conflicting = { ...ready, treaties: [...ready.treaties, { ...ready.treaties[0], id: 'other-active-proposal' }] };
    expect(reviewTreatyAction(conflicting, action, context({ week: 2 })).allowed).toBe(false);
  });
  it('emits exactly one transfer on the next tick, never mutating inputs or repeating after save', () => {
    const state = ratified(); const ctx = context({ week: 3 }); const before = JSON.stringify({ state, ctx });
    const result = advanceTreatyWeek(state, ctx);
    expect(result.transfers).toEqual([{ treatyId: state.treaties[0].id, territoryId: 'home', fromNationId: 'korea', toNationId: 'usa', week: 3 }]);
    expect(result.state.treaties[0]).toMatchObject({ status: 'completed', completedWeek: 3 }); expect(result.gameDelta).toEqual({});
    expect(JSON.stringify({ state, ctx })).toBe(before);
    expect(advanceTreatyWeek(result.state, ctx)).toMatchObject({ accepted: false, transfers: [], events: [] });
    const restored = normalizeTerritorialTreatiesState(JSON.parse(JSON.stringify(result.state)), ctx.territories, 3);
    expect(restored).toEqual(result.state); expect(tick(restored, 4).transfers).toEqual([]);
  });
  it('preserves ratified agreement after capture, suspends handover and resumes once when recovered', () => {
    const state = ratified(); const captured = changeControl(context(), { controller: 'axis', ownerId: 'japan' });
    const suspended = tick(state, 3, captured);
    expect(suspended.state.treaties[0]).toMatchObject({ status: 'suspended', ratifiedWeek: 2, handoverDueWeek: 3, fromNationId: 'korea', toNationId: 'usa' });
    expect(suspended.transfers).toEqual([]); expect(suspended.events).toHaveLength(1);
    const normalized = normalizeTerritorialTreatiesState(suspended.state, captured.territories, 3);
    expect(normalized).toEqual(suspended.state);
    const repeated = tick(normalized, 4, captured); expect(repeated.events).toEqual([]);
    const resumed = tick(repeated.state, 5);
    expect(resumed.transfers).toHaveLength(1); expect(resumed.state.treaties[0].status).toBe('completed');
  });
  it('suspends during operations and automatically resumes after they finish without extra charges', () => {
    const waiting = tick(ratified(), 3, context({ blockedTerritoryIds: ['home'] }));
    expect(waiting.state.treaties[0].status).toBe('suspended'); expect(waiting.gameDelta).toEqual({});
    expect(waiting.state.treaties[0].reason).toContain('작전');
    const result = tick(waiting.state, 4); expect(result.transfers).toHaveLength(1); expect(result.gameDelta).toEqual({});
  });
  it('does not treat already-recipient-controlled land as a new donor handover', () => {
    const ctx = context(); ctx.control.current.home.verifiedControllerNationId = 'usa';
    const result = tick(ratified(), 3, ctx);
    expect(result.state.treaties[0].status).toBe('suspended'); expect(result.transfers).toEqual([]);
  });
  it('continues valid ratified handover after career switch without foreign political stats', () => {
    const result = tick(ratified(), 3, context({ nationId: 'china', stability: NaN, institutionalCapacity: NaN, relations: [], canRatify: false }));
    expect(result.transfers).toHaveLength(1); expect(result.state.treaties[0].status).toBe('completed');
  });
  it('does not transfer from a stale ledger or an unreadable operation list', () => {
    const stale = changeControl(context(), { ownerId: 'china' }, true);
    expect(tick(ratified(), 3, stale).transfers).toEqual([]);
    expect(tick(ratified(), 3, context({ blockedTerritoryIds: undefined as never }))).toMatchObject({ accepted: false, transfers: [] });
  });
  it('suspends rather than double-transferring if conflicting active data reaches a tick', () => {
    const state = ratified();
    state.treaties.push({ ...state.treaties[0], id: 'conflicting-active-treaty' });
    const result = tick(state, 3);
    expect(result.transfers).toEqual([]);
    expect(result.state.treaties.every((treaty) => treaty.status === 'suspended')).toBe(true);
  });
});

describe('save validation and monotone receipt processing', () => {
  it.each(['baseline', 'history', 'latest-site', 'latest-other-site', 'earlier-history-entry'] as const)(
    'refuses actions and weekly results when the %s control record is in the future', (location) => {
      const ctx = context();
      const change = { id: 'future-receipt', territoryId: 'home', week: 4,
        source: { kind: 'nation-transition' as const, id: 'future', label: '미래 기록' },
        before: { ...ctx.control.current.home }, after: { ...ctx.control.current.home, verifiedControllerNationId: 'korea' as const } };
      if (location === 'baseline') ctx.control.startedWeek = 4;
      else if (location === 'history') ctx.control.changes = [change];
      else if (location === 'earlier-history-entry') ctx.control.changes = [change, { ...change, id: 'older-last', week: 0 }];
      else ctx.control.latestByTerritory[location === 'latest-site' ? 'home' : 'third-party'] = change;
      const empty = createTerritorialTreatiesState(); const agreement = ratified(); const ready = answered();
      expect(reviewTreatyAction(empty, offer, ctx).allowed).toBe(false);
      expect(reviewTreatyAction(ready, { kind: 'ratify', treatyId: ready.treaties[0].id }, { ...ctx, week: 2 }).allowed).toBe(false);
      const before = JSON.stringify({ agreement, ctx }); const result = tick(agreement, 3, ctx);
      expect(result).toMatchObject({ accepted: false, transfers: [], events: [], gameDelta: {} });
      expect(result.reason).toContain('원장'); expect(result.state).toBe(agreement);
      expect(JSON.stringify({ agreement, ctx })).toBe(before);
    },
  );
  it('allows a valid ledger baseline and latest change at the current week, never a later week', () => {
    const ctx = context({ week: 3 }); ctx.control.startedWeek = 3;
    const change = { id: 'current-receipt', territoryId: 'home', week: 3,
      source: { kind: 'nation-transition' as const, id: 'current', label: '현재 기록' },
      before: { ...ctx.control.current.home }, after: { ...ctx.control.current.home, verifiedControllerNationId: 'korea' as const } };
    ctx.control.changes = [change]; ctx.control.latestByTerritory.home = change;
    expect(reviewTreatyAction(createTerritorialTreatiesState(), offer, ctx).allowed).toBe(true);
    expect(tick(ratified(), 3, ctx).transfers).toHaveLength(1);
    ctx.control.startedWeek = NaN;
    expect(tick(ratified(), 3, ctx).accepted).toBe(false);
  });
  it('roundtrips every reachable status without reconstructing control or previous history', () => {
    const proposal = proposed(); const accepted = answered(); const agreement = ratified();
    const rejected = tick(tick(proposal, 1).state, 2, context({ stability: 0 })).state;
    const withdrawn = act(proposal, { kind: 'withdraw', treatyId: proposal.treaties[0].id });
    const suspended = tick(agreement, 3, context({ blockedTerritoryIds: ['home'] })).state;
    const completed = tick(agreement, 3).state;
    for (const state of [proposal, accepted, agreement, rejected, withdrawn, suspended, completed]) {
      const before = JSON.stringify(state); const clean = normalizeTerritorialTreatiesState(JSON.parse(before), context().territories, 5);
      expect(clean).toEqual(state); expect(clean).not.toBe(state); expect(JSON.stringify(state)).toBe(before);
    }
  });
  it.each([null, undefined, {}, [], { version: 9 }, { version: 1, treaties: null }, 'legacy-save'])('starts missing/malformed save empty at the observed week %#', (value) => {
    expect(normalizeTerritorialTreatiesState(value, context().territories, 42)).toEqual({ ...createTerritorialTreatiesState(), lastAdvancedWeek: 42 });
  });
  it.each([
    { status: 'annexed' }, { partnerNationId: 'missing' }, { fromNationId: 'china' }, { toNationId: 'korea' },
    { id: 'forged' }, { territoryId: 'missing' }, { territoryId: 'korea' }, { territoryId: 'sea' }, { name: '가'.repeat(81) },
    { proposedWeek: -1 }, { responseDueWeek: 1 }, { responseDueWeek: 99 }, { respondedWeek: 1 },
    { ratifiedWeek: 1 }, { handoverDueWeek: 2 }, { completedWeek: 4 }, { reason: '' },
  ])('rejects malformed nation, identity, site or chronology %#', (patch) => {
    const state = ratified(); state.treaties[0] = { ...state.treaties[0], ...patch } as typeof state.treaties[0];
    expect(normalizeTerritorialTreatiesState(state, context().territories, 3)).toEqual({ ...createTerritorialTreatiesState(), lastAdvancedWeek: 3 });
  });
  it('rejects duplicate treaty IDs, conflicting active sites and future processed weeks', () => {
    const state = proposed();
    for (const invalid of [
      { ...state, treaties: [...state.treaties, state.treaties[0]] },
      { ...state, treaties: [...state.treaties, { ...state.treaties[0], id: 'treaty:korea:usa:home:1', proposedWeek: 1, responseDueWeek: 3 }] },
      { ...state, lastAdvancedWeek: 10 },
    ]) expect(normalizeTerritorialTreatiesState(invalid, context().territories, 3).treaties).toEqual([]);
  });
  it('rejects future or inconsistent terminal timestamps and forged journal shapes', () => {
    const completed = tick(ratified(), 3).state;
    for (const patch of [{ completedWeek: 4 }, { respondedWeek: 4 }, { completedWeek: undefined }, { status: 'proposed' }]) {
      const invalid = { ...completed, treaties: [{ ...completed.treaties[0], ...patch }] };
      expect(normalizeTerritorialTreatiesState(invalid, context().territories, 3).treaties).toEqual([]);
    }
    for (const journal of [
      [...completed.journal, completed.journal[0]], [{ ...completed.journal[0], week: 4 }],
      [{ ...completed.journal[0], tone: 'fake' }], [{ ...completed.journal[0], detail: '\n' }],
      [...completed.journal].reverse(),
    ]) expect(normalizeTerritorialTreatiesState({ ...completed, journal }, context().territories, 3).treaties).toEqual([]);
  });
  it('keeps historical completed agreement even after later third-party occupation', () => {
    const completed = tick(ratified(), 3).state;
    const captured = changeControl(context(), { ownerId: 'japan', controller: 'axis' });
    expect(normalizeTerritorialTreatiesState(completed, captured.territories, 9)).toEqual(completed);
  });
  it('rejects past, repeated and non-finite ticks or actions without events or resource changes', () => {
    const state = tick(ratified(), 3).state;
    for (const week of [-1, 0, 2, 3, NaN, Infinity, 3.5]) {
      const result = tick(state, week);
      expect(result).toMatchObject({ accepted: false, transfers: [], events: [], gameDelta: {} }); expect(result.state).toBe(state);
    }
    expect(reviewTreatyAction(state, request, context({ week: 2 })).allowed).toBe(false);
  });
  it('bounds the journal without deleting treaty identities or fabricating a recurring reward', () => {
    let state = createTerritorialTreatiesState();
    for (let week = 0; week < 105; week += 1) {
      const ctx = context({ week }); state = act(state, offer, ctx);
      state = act(state, { kind: 'withdraw', treatyId: state.treaties.at(-1)!.id }, ctx);
    }
    expect(state.journal).toHaveLength(200); expect(state.treaties).toHaveLength(105);
    expect(normalizeTerritorialTreatiesState(state, context().territories, 104)).toEqual(state);
    expect(tick(state, 105).gameDelta).toEqual({});
  });
});
