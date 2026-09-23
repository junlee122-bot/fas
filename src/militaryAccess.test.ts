import { describe, expect, it } from 'vitest';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { advanceMilitaryAccessWeek, createMilitaryAccessState, executeMilitaryAccessAction, getSiteMilitaryAccess,
  isMilitaryAccessPort, normalizeMilitaryAccessState, reviewMilitaryAccessAction,
  type MilitaryAccessAction, type MilitaryAccessContext, type MilitaryAccessState } from './militaryAccess';
import { recoverPeacetimeDivisions } from './peacetimeRecovery';
import type { Division, Territory } from './types';

const home: Territory = { id: 'home', name: '자국 항구', ownerId: 'korea', controller: 'allies', x: 0, y: 0, region: '아시아',
  value: 1, supply: 65, terrain: '도시', neighbors: ['host'], siteType: 'port' };
const host: Territory = { ...home, id: 'host', name: '외국 항구', ownerId: 'usa', neighbors: ['home'] };
const sites = [home, host, { ...host, id: 'city', siteType: 'city' as const }, { ...host, id: 'sea', siteType: 'sea' as const }];
const request: Extract<MilitaryAccessAction, { kind: 'propose' }> = { kind: 'propose', partnerNationId: 'usa', territoryId: 'host', accessKind: 'transit', direction: 'request', durationWeeks: 13 };
const context = (patch: Partial<MilitaryAccessContext> = {}): MilitaryAccessContext => ({
  state: createMilitaryAccessState(), control: createMapPoliticalLedger(sites, 0), nationId: 'korea', week: 0, playerFaction: 'allies',
  territories: sites, relations: [{ id: 'usa', name: '미국', code: 'US', value: 80, status: '협력', color: '#fff' }],
  politicalPower: 100, treasury: 100, stability: 70, canNegotiate: true, canRatify: true, approvalSupport: 80, approvalLabel: '국내 승인', ...patch,
});
function act(state: MilitaryAccessState, action: MilitaryAccessAction, ctx = context()) {
  const result = executeMilitaryAccessAction(state, action, { ...ctx, state });
  expect(result.accepted, result.reason).toBe(true); return result;
}
function active(kind: 'transit' | 'naval-base' = 'transit', ctx = context()) {
  const proposed = act(createMilitaryAccessState(), { ...request, accessKind: kind }, ctx).state;
  const answered = advanceMilitaryAccessWeek(proposed, { ...ctx, state: proposed, week: 2 }).state;
  return act(answered, { kind: 'activate', agreementId: answered.agreements[0].id }, { ...ctx, week: 2 }).state;
}
const check = (state: MilitaryAccessState, purpose: Parameters<typeof getSiteMilitaryAccess>[1], week = 2, ctx = context()) =>
  getSiteMilitaryAccess(host, purpose, { ...ctx, state, week });

describe('bilateral access agreement lifecycle', () => {
  it('requires proposal, real response date and separate domestic approval with exact one-time costs', () => {
    const ctx = context(); const before = structuredClone(ctx);
    const proposal = act(ctx.state, request, ctx);
    expect(proposal.delta).toEqual({ politicalPower: -4, treasury: 0 });
    expect(proposal.state.agreements[0]).toMatchObject({ hostNationId: 'usa', beneficiaryNationId: 'korea', status: 'proposed', responseDueWeek: 2 });
    const early = advanceMilitaryAccessWeek(proposal.state, { ...ctx, week: 1 });
    expect(early.state.agreements[0].status).toBe('proposed');
    expect(reviewMilitaryAccessAction(early.state, { kind: 'activate', agreementId: early.state.agreements[0].id }, { ...ctx, week: 1 }).allowed).toBe(false);
    const answer = advanceMilitaryAccessWeek(early.state, { ...ctx, week: 2 });
    expect(answer.state.agreements[0].status).toBe('accepted');
    const approval = act(answer.state, { kind: 'activate', agreementId: answer.state.agreements[0].id }, { ...ctx, week: 2 });
    expect(approval.delta).toEqual({ politicalPower: -6, treasury: -2 });
    expect(approval.state.agreements[0]).toMatchObject({ status: 'active', activatedWeek: 2, expiresWeek: 15 });
    expect(ctx).toEqual(before);
  });
  it.each(['canNegotiate', 'canRatify'] as const)('checks current %s rather than UI visibility', (permission) => {
    if (permission === 'canNegotiate') expect(reviewMilitaryAccessAction(context().state, request, context({ canNegotiate: false })).allowed).toBe(false);
    else {
      const proposed = act(context().state, request).state;
      const answered = advanceMilitaryAccessWeek(proposed, context({ week: 2 })).state;
      expect(reviewMilitaryAccessAction(answered, { kind: 'activate', agreementId: answered.agreements[0].id }, context({ week: 2, canRatify: false })).allowed).toBe(false);
    }
  });
  it.each([59, Number.NaN, Infinity, -1])('requires finite domestic approval: %s', (approvalSupport) => {
    const proposed = act(context().state, request).state;
    const answered = advanceMilitaryAccessWeek(proposed, context({ week: 2 })).state;
    expect(reviewMilitaryAccessAction(answered, { kind: 'activate', agreementId: answered.agreements[0].id }, context({ week: 2, approvalSupport })).allowed).toBe(false);
  });
  it('does not spend twice or duplicate a same-week proposal after withdrawing it', () => {
    const proposed = act(context().state, request).state;
    expect(executeMilitaryAccessAction(proposed, request, context())).toMatchObject({ accepted: false, state: proposed, delta: {} });
    const withdrawn = act(proposed, { kind: 'withdraw', agreementId: proposed.agreements[0].id }).state;
    expect(executeMilitaryAccessAction(withdrawn, request, context()).accepted).toBe(false);
  });
  it('uses current diplomatic conditions when answering and before approval', () => {
    const proposed = act(context().state, request).state;
    expect(advanceMilitaryAccessWeek(proposed, context({ week: 2, relations: [] })).state.agreements[0].status).toBe('rejected');
    const accepted = advanceMilitaryAccessWeek(proposed, context({ week: 2 })).state;
    expect(reviewMilitaryAccessAction(accepted, { kind: 'activate', agreementId: accepted.agreements[0].id }, context({ week: 2, stability: 44 })).allowed).toBe(false);
  });
  it('never invents foreign responses after switching player country', () => {
    const proposed = act(context().state, request).state;
    expect(advanceMilitaryAccessWeek(proposed, context({ week: 2, nationId: 'china' })).state.agreements[0].status).toBe('proposed');
  });
  it('offers rights in own land only and records the actual foreign beneficiary', () => {
    const offer = { ...request, territoryId: 'home', direction: 'offer' as const };
    const result = act(context().state, offer);
    expect(result.state.agreements[0]).toMatchObject({ hostNationId: 'korea', beneficiaryNationId: 'usa' });
    expect(reviewMilitaryAccessAction(context().state, { ...offer, territoryId: 'host' }, context()).allowed).toBe(false);
  });
  it.each(['city', 'sea', 'missing'])('refuses naval basing at non-port %s', (territoryId) => {
    expect(reviewMilitaryAccessAction(context().state, { ...request, accessKind: 'naval-base', territoryId }, context()).allowed).toBe(false);
  });
  it('supports both rights independently but does not transfer territory or create units', () => {
    const transit = active(); const before = structuredClone(context().territories);
    const proposed = act(transit, { ...request, accessKind: 'naval-base' }, context({ week: 2 })).state;
    const answered = advanceMilitaryAccessWeek(proposed, context({ week: 4 })).state;
    const result = act(answered, { kind: 'activate', agreementId: answered.agreements[1].id }, context({ week: 4 }));
    expect(result.delta.treasury).toBe(-8);
    expect(check(result.state, 'naval-base', 4).allowed).toBe(true);
    expect(check(result.state, 'transit', 4).allowed).toBe(true);
    expect(context().territories).toEqual(before);
    expect(Object.keys(result)).not.toContain('territoryUpdates');
  });
});

describe('operational access is scoped and expires without rewinding physical state', () => {
  it('preserves existing coalition access until an agreement actually enters into force', () => {
    expect(check(context().state, 'transit').source).toBe('coalition');
    const proposed = act(context().state, request).state;
    expect(check(proposed, 'transit').source).toBe('coalition');
    expect(check(active(), 'transit').source).toBe('agreement');
  });
  it.each(['offensive', 'land-supply', 'naval-base', 'naval-departure'] as const)('transit does not authorize %s', (purpose) => {
    expect(check(active(), purpose).allowed).toBe(false);
  });
  it.each(['transit', 'land-departure', 'offensive', 'land-supply'] as const)('naval basing does not authorize %s', (purpose) => {
    expect(check(active('naval-base'), purpose).allowed).toBe(false);
  });
  it('grants a neutral host only explicit rights and no sovereignty change', () => {
    const neutral = { ...host, controller: 'neutral' as const };
    const territories = [home, neutral]; const control = createMapPoliticalLedger(territories, 0);
    control.current.host.verifiedControllerNationId = 'usa';
    const ctx = context({ territories, control }); const state = active('transit', ctx);
    expect(getSiteMilitaryAccess(neutral, 'transit', { ...ctx, week: 2, state }).source).toBe('agreement');
    expect(getSiteMilitaryAccess(neutral, 'offensive', { ...ctx, week: 2, state }).allowed).toBe(false);
    expect(neutral.controller).toBe('neutral');
  });
  it('cuts off entry/refueling at exact expiry even before the weekly journal settles', () => {
    for (const kind of ['transit', 'naval-base'] as const) {
      const state = active(kind); const entry = kind === 'transit' ? 'transit' : 'naval-base';
      const exit = kind === 'transit' ? 'land-departure' : 'naval-departure';
      expect(check(state, entry, 14).allowed).toBe(true);
      expect(check(state, entry, 15).allowed).toBe(false);
      expect(check(state, exit, 15).source).toBe('withdrawal');
      expect(check(state, exit, 16).allowed).toBe(true);
      expect(check(state, exit, 17).allowed).toBe(false);
    }
  });
  it('terminates once, preserves records, warns once and allows a new proposal after expiry', () => {
    const state = active();
    const warning = advanceMilitaryAccessWeek(state, context({ week: 13 }));
    expect(warning.events).toHaveLength(1);
    expect(advanceMilitaryAccessWeek(warning.state, context({ week: 13 })).state).toBe(warning.state);
    const expired = advanceMilitaryAccessWeek(warning.state, context({ week: 15 }));
    expect(expired.state.agreements[0].status).toBe('expired');
    expect(check(expired.state, 'transit', 15).allowed).toBe(false);
    expect(reviewMilitaryAccessAction(expired.state, request, context({ week: 15 })).allowed).toBe(true);
  });
  it('revocation is immediate for new use, followed by only two weeks of withdrawal', () => {
    const state = active(); const a = state.agreements[0];
    const stopped = act(state, { kind: 'revoke', agreementId: a.id }, context({ week: 3 })).state;
    expect(check(stopped, 'transit', 3).allowed).toBe(false);
    expect(check(stopped, 'land-departure', 3).source).toBe('withdrawal');
    const closed = advanceMilitaryAccessWeek(stopped, context({ week: 5 })).state;
    expect(closed.agreements[0].status).toBe('revoked');
    expect(check(closed, 'transit', 5).allowed).toBe(false);
  });
  it('a captured base cannot claim the old host agreement or its departure grace', () => {
    const state = active('naval-base'); const captured = { ...host, controller: 'axis' as const, ownerId: 'japan' as const };
    const territories = [home, captured]; const ctx = context({ territories, control: createMapPoliticalLedger(territories, 3), week: 3 });
    expect(getSiteMilitaryAccess(captured, 'naval-departure', { ...ctx, state }).allowed).toBe(false);
    expect(advanceMilitaryAccessWeek(state, ctx).state.agreements[0].status).toBe('revoked');
  });
  it('denies stale/future ledgers without turning them into coalition authorization', () => {
    const state = active();
    expect(check(state, 'transit', 2, context({ control: createMapPoliticalLedger(sites, 3) })).allowed).toBe(false);
    const ctx = context(); ctx.control.current.host.gameOwnerId = 'china';
    expect(check(state, 'transit', 2, ctx).allowed).toBe(false);
  });
  it('denies peacetime replenishment at a transit-only host while preserving the unit', () => {
    const division: Division = { id: 'd', name: '통행 사단', type: 'infantry', territoryId: 'host', commanderId: 'c', status: 'recovering', strength: 50, organization: 40, supply: 20, experience: 30 };
    const state = active();
    expect(recoverPeacetimeDivisions([division], sites, 'allies', new Set(), { ...context(), state, week: 2 })[0]).toBe(division);
  });
});

describe('military access save boundary', () => {
  it('migrates old saves without inventing agreements', () => {
    expect(normalizeMilitaryAccessState(undefined, sites, 90)).toEqual(createMilitaryAccessState(90));
    expect(isMilitaryAccessPort(host)).toBe(true);
    expect(isMilitaryAccessPort(undefined)).toBe(false);
  });
  it('roundtrips active rights and rejects duplicate live agreements', () => {
    const state = active();
    expect(normalizeMilitaryAccessState(state, sites, 2)).toEqual(state);
    expect(normalizeMilitaryAccessState({ ...state, agreements: [...state.agreements, ...state.agreements] }, sites, 2).agreements).toHaveLength(1);
  });
  it.each([
    { activatedWeek: 1 }, { expiresWeek: 99 }, { hostNationId: 'imaginary' }, { beneficiaryNationId: 'usa' },
    { status: 'proposed' }, { status: 'notice' }, { closedWeek: 3 }, { id: 'forged' }, { durationWeeks: 999 },
    { territoryId: 'missing' }, { kind: 'offensive' }, { responseDueWeek: 0 },
  ])('rejects malformed authority record %j', (patch) => {
    const state = active(); const raw = { ...state, agreements: [{ ...state.agreements[0], ...patch }] };
    expect(normalizeMilitaryAccessState(raw, sites, 2).agreements).toEqual([]);
  });
  it('does not grant future authority by loading an older week', () => {
    const state = active(); expect(normalizeMilitaryAccessState(state, sites, 1).agreements).toEqual([]);
    expect(normalizeMilitaryAccessState({ ...state, lastAdvancedWeek: 10 }, sites, 2).agreements).toEqual([]);
  });
});
