import { describe, expect, it } from 'vitest';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { consistentTreatyConsentResult, satisfiesTreatyConsent, treatyConsentApproved, validTreatyTerms } from './territorialConsent';
import {
  advanceTreatyWeek, createTerritorialTreatiesState, executeTreatyAction, forecastTreatyConsent, getTreatyTerms,
  normalizeTerritorialTreatiesState, reviewTreatyAction, type TerritorialTreaty, type TreatyAction,
  type TreatyConsentMethod, type TreatyContext, type TreatyState, type TreatyTerms,
} from './territorialTreaties';
import type { Territory } from './types';

const defaultTerms: TreatyTerms = { consentMethod: 'none', civilGuarantees: false, withdrawBeforeHandover: false, handoverDelayWeeks: 1 };
const council: TreatyTerms = { ...defaultTerms, consentMethod: 'regional-council', civilGuarantees: true };
function context(patch: Partial<TreatyContext> = {}): TreatyContext {
  const home: Territory = { id: 'home', name: '지역 거점', ownerId: 'korea', controller: 'allies', x: 0, y: 0,
    region: '한반도', value: 1, supply: 60, terrain: '도시', neighbors: [], siteType: 'city' };
  const territories = [home, { ...home, id: 'partner', ownerId: 'usa' as const }];
  return { week: 0, nationId: 'korea', territories, control: createMapPoliticalLedger(territories, 0),
    relations: [{ id: 'usa', name: '미국', code: 'US', value: 80, status: '협력', color: '#fff' }],
    politicalPower: 100, treasury: 100, stability: 60, institutionalCapacity: 60, canNegotiate: true,
    canRatify: true, approvalSupport: 70, approvalLabel: '국무회의 승인', blockedTerritoryIds: [], ...patch };
}
const proposal = (terms?: TreatyTerms): TreatyAction => ({ kind: 'propose', name: '지역 거점 협정', territoryId: 'home', partnerNationId: 'usa', direction: 'offer', ...(terms ? { terms } : {}) });
function act(state: TreatyState, action: TreatyAction, ctx: TreatyContext) {
  const result = executeTreatyAction(state, action, ctx);
  expect(result.accepted, result.reason).toBe(true); return result.state;
}
const tick = (state: TreatyState, week: number, ctx = context()) => advanceTreatyWeek(state, { ...ctx, week });
function accepted(terms: TreatyTerms | undefined = council, ctx = context()): TreatyState {
  const state = act(createTerritorialTreatiesState(), proposal(terms), ctx);
  return tick(tick(state, 1, ctx).state, 2, ctx).state;
}
function started(terms: TreatyTerms = council, ctx = context()): TreatyState {
  const state = accepted(terms, ctx);
  return act(state, { kind: 'start-consultation', treatyId: state.treaties[0].id }, { ...ctx, week: 2 });
}
function decided(terms: TreatyTerms = council, ctx = context()): TreatyState {
  let state = started(terms, ctx);
  for (let week = 3; week <= 5; week += 1) state = tick(state, week, ctx).state;
  return state;
}
const ratifyAction = (state: TreatyState): TreatyAction => ({ kind: 'ratify', treatyId: state.treaties[0].id });
function agreement(terms: TreatyTerms = council, ctx = context()): TreatyState {
  const state = terms.consentMethod === 'none' ? accepted(terms, ctx) : decided(terms, ctx);
  return act(state, ratifyAction(state), { ...ctx, week: terms.consentMethod === 'none' ? 2 : 5 });
}
function siteChange(ctx: TreatyContext, patch: Partial<Territory>): TreatyContext {
  const territories = ctx.territories.map((site) => site.id === 'home' ? { ...site, ...patch } : site);
  return { ...ctx, territories, control: createMapPoliticalLedger(territories, ctx.week) };
}
const normalized = (state: TreatyState, week: number, ctx = context()) => normalizeTerritorialTreatiesState(JSON.parse(JSON.stringify(state)), ctx.territories, week);

describe('immutable proposal terms and constitutional minimum consent', () => {
  it('keeps old v1 terms optional and returns an independent copy of defaults or explicit terms', () => {
    const first = getTreatyTerms({}); expect(first).toEqual(defaultTerms); first.civilGuarantees = true;
    expect(getTreatyTerms({})).toEqual(defaultTerms);
    const terms = { ...council }; const copy = getTreatyTerms({ terms }); copy.handoverDelayWeeks = 8;
    expect(terms.handoverDelayWeeks).toBe(1);
    const legacy = accepted(defaultTerms); delete legacy.treaties[0].terms;
    expect(normalized(legacy, 2)).toEqual(legacy);
  });
  it.each([
    ['none', 'none', true], ['regional-council', 'none', true], ['referendum', 'none', true],
    ['none', 'regional-council', false], ['regional-council', 'regional-council', true], ['referendum', 'regional-council', true],
    ['none', 'referendum', false], ['regional-council', 'referendum', false], ['referendum', 'referendum', true],
  ] as const)('%s satisfies constitution %s = %s in the actual proposal review', (method, required, allowed) => {
    expect(satisfiesTreatyConsent(method, required)).toBe(allowed);
    const terms = { ...defaultTerms, consentMethod: method };
    expect(reviewTreatyAction(createTerritorialTreatiesState(), proposal(terms), context({ requiredConsent: required })).allowed).toBe(allowed);
  });
  it.each([
    { consentMethod: 'foreign-vote' }, { civilGuarantees: 1 }, { withdrawBeforeHandover: 'yes' },
    { handoverDelayWeeks: 2 }, { handoverDelayWeeks: Infinity }, { consentMethod: undefined },
  ])('rejects malformed explicit conditions %#', (patch) => {
    const terms = { ...defaultTerms, ...patch } as TreatyTerms;
    expect(validTreatyTerms(terms)).toBe(false);
    expect(reviewTreatyAction(createTerritorialTreatiesState(), proposal(terms), context()).allowed).toBe(false);
  });
  it('rejects null/unknown current constitutional requirements instead of treating them as legacy none', () => {
    for (const requiredConsent of [null, 'unknown', false] as unknown as TreatyConsentMethod[]) {
      expect(reviewTreatyAction(createTerritorialTreatiesState(), proposal(council), context({ requiredConsent })).allowed).toBe(false);
    }
  });
  it('snapshots terms at proposal without mutating action or allowing later action-object edits', () => {
    const terms = { ...council }; const action = proposal(terms); const ctx = context(); const before = JSON.stringify({ action, ctx });
    const result = executeTreatyAction(createTerritorialTreatiesState(), action, ctx);
    expect(result.accepted).toBe(true); expect(JSON.stringify({ action, ctx })).toBe(before);
    expect(result.state.treaties[0].terms).not.toBe(terms); terms.civilGuarantees = false;
    expect(result.state.treaties[0].terms?.civilGuarantees).toBe(true);
  });
  it('blocks legacy accepted proposals under a stricter new constitution, while still allowing withdrawal', () => {
    const state = accepted(defaultTerms); delete state.treaties[0].terms;
    const ctx = context({ week: 2, requiredConsent: 'referendum' });
    expect(reviewTreatyAction(state, ratifyAction(state), ctx).allowed).toBe(false);
    expect(reviewTreatyAction(state, { kind: 'start-consultation', treatyId: state.treaties[0].id }, ctx).allowed).toBe(false);
    expect(reviewTreatyAction(state, { kind: 'withdraw', treatyId: state.treaties[0].id }, ctx).allowed).toBe(true);
  });
  it('does not revoke an already ratified legacy agreement after a constitutional change', () => {
    const state = agreement(defaultTerms); delete state.treaties[0].terms;
    expect(normalized(state, 2)).toEqual(state);
    expect(tick(state, 3, context({ requiredConsent: 'referendum' })).transfers).toHaveLength(1);
  });
});

describe('synthetic local forecast is stable and transparently limited', () => {
  it('uses known stable site bases plus supply and the stated protection promise', () => {
    const treaty = accepted(council).treaties[0]; const site = context().territories[0];
    expect(forecastTreatyConsent(treaty, site)).toMatchObject({ supportPercent: 66, participationPercent: 69 });
    const noPromise = { ...treaty, terms: { ...council, civilGuarantees: false } };
    expect(forecastTreatyConsent(noPromise, site).supportPercent).toBe(56);
    const lowSupply = forecastTreatyConsent(treaty, { ...site, supply: 40 });
    expect(lowSupply).toMatchObject({ supportPercent: 63, participationPercent: 59 });
    const factors = lowSupply.factors.join(' ');
    expect(factors).toContain('게임 모형'); expect(factors).toContain('실제 유권자');
    expect(factors).toContain('현지 법 집행 완료'); expect(factors).toContain('결정 주의 보급');
  });
  it('never uses proposal IDs, weeks, titles, reload order or consent method as a new random seed', () => {
    const treaty = accepted(council).treaties[0]; const site = context().territories[0];
    const first = forecastTreatyConsent(treaty, site);
    for (let week = 0; week < 30; week += 1) {
      const altered = { ...treaty, id: `new-${week}`, proposedWeek: week * 100, name: `다른 이름 ${week}` };
      expect(forecastTreatyConsent(altered, site)).toEqual(first);
      expect(forecastTreatyConsent(JSON.parse(JSON.stringify(altered)), site)).toEqual(first);
    }
    expect(forecastTreatyConsent({ ...treaty, terms: { ...council, consentMethod: 'referendum' } }, site).supportPercent).toBe(first.supportPercent);
  });
  it.each([NaN, Infinity, -1, 101])('fails closed on supply %s without false favorable forecasts', (supply) => {
    const treaty = accepted(council).treaties[0];
    expect(forecastTreatyConsent(treaty, { ...context().territories[0], supply })).toMatchObject({ supportPercent: 0, participationPercent: 0 });
  });
  it('requires the actual named site and yields correct exact threshold comparisons', () => {
    expect(forecastTreatyConsent(accepted(council).treaties[0], context().territories[1]).supportPercent).toBe(0);
    expect(treatyConsentApproved('regional-council', 60, 0)).toBe(true);
    expect(treatyConsentApproved('regional-council', 59.99, 100)).toBe(false);
    expect(treatyConsentApproved('referendum', 50, 100)).toBe(false);
    expect(treatyConsentApproved('referendum', 50.01, 50)).toBe(true);
    expect(treatyConsentApproved('referendum', 100, 49.99)).toBe(false);
  });
});

describe('consultation is an explicit paid procedure followed by three actual safe weeks', () => {
  it('starts only after bilateral acceptance and spends 4 PP and 3 treasury exactly once', () => {
    const state = accepted(); const ctx = context({ week: 2 }); const action: TreatyAction = { kind: 'start-consultation', treatyId: state.treaties[0].id };
    const before = JSON.stringify({ state, ctx });
    expect(reviewTreatyAction(state, action, ctx)).toMatchObject({ allowed: true, cost: { politicalPower: 4, treasury: 3 }, dueWeek: 5 });
    const result = executeTreatyAction(state, action, ctx);
    expect(result.gameDelta).toEqual({ politicalPower: -4, treasury: -3 }); expect(result.transfers).toEqual([]);
    expect(result.state.treaties[0].consent).toMatchObject({ status: 'preparing', progressWeeks: 0, startedWeek: 2, lastProcessedWeek: 2 });
    expect(JSON.stringify({ state, ctx })).toBe(before);
    expect(executeTreatyAction(result.state, action, ctx)).toMatchObject({ accepted: false, gameDelta: {}, transfers: [] });
    const initial = act(createTerritorialTreatiesState(), proposal(council), context());
    expect(reviewTreatyAction(initial, action, context()).allowed).toBe(false);
  });
  it.each([
    { canNegotiate: false }, { politicalPower: 3.99 }, { treasury: 2.99 }, { nationId: 'usa' as const },
    { blockedTerritoryIds: ['home'] }, { requiredConsent: 'referendum' as const },
  ])('retains office, expense, party, safety and constitutional guards %#', (patch) => {
    const state = accepted();
    expect(reviewTreatyAction(state, { kind: 'start-consultation', treatyId: state.treaties[0].id }, context({ week: 2, ...patch })).allowed).toBe(false);
  });
  it('requires valid local supply and actual donor control at the start', () => {
    const state = accepted(); const action: TreatyAction = { kind: 'start-consultation', treatyId: state.treaties[0].id };
    for (const patch of [{ supply: 39.99 }, { supply: NaN }, { controller: 'axis' as const }]) {
      expect(reviewTreatyAction(state, action, { ...siteChange(context(), patch), week: 2 }).allowed).toBe(false);
    }
  });
  it('counts three observed consecutive ticks, not elapsed calendar time or repeated same-week calls', () => {
    let state = started(); const original = JSON.stringify(state);
    const first = tick(state, 3); expect(first.state.treaties[0].consent?.progressWeeks).toBe(1);
    expect(first.state.treaties[0].reason).toBe(first.state.treaties[0].consent?.reason);
    expect(tick(first.state, 3).accepted).toBe(false); expect(JSON.stringify(state)).toBe(original);
    state = tick(first.state, 20).state; expect(state.treaties[0].consent?.progressWeeks).toBe(1);
    state = tick(state, 21).state; expect(state.treaties[0].consent?.progressWeeks).toBe(2);
    state = tick(state, 22).state; expect(state.treaties[0].consent).toMatchObject({ status: 'approved', progressWeeks: 3, resolvedWeek: 22 });
    expect(state.treaties[0].reason).toBe(state.treaties[0].consent?.reason);
    expect(normalized(state, 22)).toEqual(state);
  });
  it.each(['operations', 'supply', 'occupation'] as const)('suspends, resets and automatically restarts after %s disruption', (cause) => {
    let state = tick(started(), 3).state;
    const disrupted = cause === 'operations' ? context({ blockedTerritoryIds: ['home'] })
      : siteChange(context(), cause === 'supply' ? { supply: 39 } : { controller: 'axis', ownerId: 'japan' });
    state = tick(state, 4, disrupted).state;
    expect(state.treaties[0].consent).toMatchObject({ status: 'suspended', progressWeeks: 0, lastProcessedWeek: 4 });
    expect(state.treaties[0].reason).toBe(state.treaties[0].consent?.reason);
    expect(normalized(state, 4, disrupted)).toEqual(state);
    expect(tick(state, 5, disrupted).events).toEqual([]);
    const recovered = tick(state, 5); expect(recovered.gameDelta).toEqual({});
    expect(recovered.state.treaties[0].consent).toMatchObject({ status: 'preparing', progressWeeks: 1 });
    state = tick(tick(recovered.state, 6).state, 7).state;
    expect(state.treaties[0].consent?.status).toBe('approved');
  });
  it('uses the actual result-week supply rather than the preview and saves that snapshot', () => {
    let state = started({ ...council, civilGuarantees: false });
    expect(forecastTreatyConsent(state.treaties[0], context().territories[0]).supportPercent).toBe(56);
    state = tick(tick(state, 3).state, 4).state;
    const result = tick(state, 5, siteChange(context(), { supply: 100 }));
    expect(result.state.treaties[0].consent).toMatchObject({ status: 'approved', supportPercent: 62, participationPercent: 89, supplyAtResolution: 100, modelVersion: 1 });
    expect(result.state.treaties[0].consent?.evidenceKey).toContain('home');
    expect(result.events[0].detail).toContain('합성 찬성 지표');
    expect(result.events[0].detail).toContain('실제 유권자');
    expect(result.transfers).toEqual([]); expect(result.gameDelta).toEqual({});
  });
  it('continues a local procedure across career changes without reusing another nation global stats', () => {
    const foreign = context({ nationId: 'china', stability: NaN, institutionalCapacity: NaN, relations: [], canNegotiate: false });
    let state = started(); for (let week = 3; week <= 5; week += 1) state = tick(state, week, foreign).state;
    expect(state.treaties[0].consent).toEqual(decided().treaties[0].consent);
  });
  it('freezes approval or rejection, never rerolls a decided procedure on later weeks or reload', () => {
    for (const terms of [council, { ...council, civilGuarantees: false }]) {
      const state = decided(terms); const decision = state.treaties[0].consent!;
      expect(decision.status).toBe(terms.civilGuarantees ? 'approved' : 'rejected');
      const restored = normalized(state, 5);
      const result = tick(restored, 100, siteChange(context(), { supply: 100 }));
      expect(result.state.treaties[0].consent).toEqual(decision); expect(result.events).toEqual([]);
      expect(reviewTreatyAction(restored, { kind: 'start-consultation', treatyId: state.treaties[0].id }, context({ week: 5 })).allowed).toBe(false);
    }
  });
  it('does not progress a withdrawn procedure and new proposals keep the same local factors', () => {
    const state = started(); const forecast = forecastTreatyConsent(state.treaties[0], context().territories[0]);
    const withdrawn = act(state, { kind: 'withdraw', treatyId: state.treaties[0].id }, context({ week: 2 }));
    expect(tick(withdrawn, 3).state.treaties[0].consent).toEqual(state.treaties[0].consent);
    const newState = act(withdrawn, proposal(council), context({ week: 3 }));
    expect(forecastTreatyConsent(newState.treaties[1], context().territories[0])).toEqual(forecast);
  });
});

describe('ratification preserves local consent and implements concrete agreement conditions', () => {
  it('cannot bypass a specified unfinished, suspended or rejected consent procedure', () => {
    const states = [accepted(), started(), tick(started(), 3, context({ blockedTerritoryIds: ['home'] })).state,
      decided({ ...council, civilGuarantees: false })];
    for (const state of states) expect(reviewTreatyAction(state, ratifyAction(state), context({ week: 5 })).allowed).toBe(false);
    const state = decided(); expect(reviewTreatyAction(state, ratifyAction(state), context({ week: 5 })).allowed).toBe(true);
  });
  it('requires the current constitutional method even if a weaker procedure was already approved', () => {
    const state = decided();
    expect(reviewTreatyAction(state, ratifyAction(state), context({ week: 5, requiredConsent: 'referendum' })).allowed).toBe(false);
    const referendum = decided({ ...council, consentMethod: 'referendum' });
    expect(reviewTreatyAction(referendum, ratifyAction(referendum), context({ week: 5, requiredConsent: 'regional-council' })).allowed).toBe(true);
  });
  it('includes the protection promise cost exactly once and grants no automatic rights enforcement benefit', () => {
    const state = decided(); const ctx = context({ week: 5, treasury: 12, politicalPower: 8 });
    expect(reviewTreatyAction(state, ratifyAction(state), { ...ctx, treasury: 11.99 }).allowed).toBe(false);
    const result = executeTreatyAction(state, ratifyAction(state), ctx);
    expect(result.gameDelta).toEqual({ politicalPower: -8, treasury: -12 }); expect(result.transfers).toEqual([]);
    expect(result.state.treaties[0].reason).toContain('보호가 자동 집행됐다는 뜻은 아닙니다');
    expect(executeTreatyAction(result.state, ratifyAction(state), ctx).gameDelta).toEqual({});
  });
  it.each([1, 4, 8] as const)('schedules physical handover only after the agreed %s weeks', (delay) => {
    const state = agreement({ ...council, handoverDelayWeeks: delay });
    expect(state.treaties[0].handoverDueWeek).toBe(5 + delay);
    expect(normalized(state, 5)).toEqual(state);
    if (delay > 1) expect(tick(state, 5 + delay - 1).transfers).toEqual([]);
    expect(tick(state, 5 + delay).transfers).toHaveLength(1);
  });
  it('allows a garrison during proposal and ratification but waits for proved local army withdrawal at handover', () => {
    const terms = { ...defaultTerms, withdrawBeforeHandover: true, handoverDelayWeeks: 4 as const };
    const ctx = context({ garrisonCountByTerritory: { home: 3 } }); const state = agreement(terms, ctx);
    expect(state.treaties[0].handoverDueWeek).toBe(6);
    const waiting = tick(state, 6, ctx);
    expect(waiting.state.treaties[0].status).toBe('suspended'); expect(waiting.transfers).toEqual([]);
    expect(waiting.state.treaties[0].reason).toContain('육군 편제 3개');
    const result = tick(waiting.state, 7, context({ garrisonCountByTerritory: { home: 0 } }));
    expect(result.transfers).toHaveLength(1); expect(result.gameDelta).toEqual({});
  });
  it.each([undefined, {}, { home: -1 }, { home: 0.5 }, { home: NaN }, { home: Infinity }, { home: Number.MAX_SAFE_INTEGER + 1 }] as Array<TreatyContext['garrisonCountByTerritory']>)(
    'requires explicit finite nonnegative integral garrison evidence %#', (garrisonCountByTerritory) => {
      const state = agreement({ ...defaultTerms, withdrawBeforeHandover: true });
      expect(tick(state, 3, context({ garrisonCountByTerritory })).state.treaties[0].status).toBe('suspended');
    },
  );
  it('does not accept inherited zeroes or another career nation counts as proof of foreign army withdrawal', () => {
    const state = agreement({ ...defaultTerms, withdrawBeforeHandover: true });
    expect(tick(state, 3, context({ garrisonCountByTerritory: Object.create({ home: 0 }) })).transfers).toEqual([]);
    const switched = tick(state, 3, context({ nationId: 'usa', garrisonCountByTerritory: { home: 0 } }));
    expect(switched.transfers).toEqual([]); expect(switched.state.treaties[0].reason).toContain('외국 제공국');
    expect(tick(switched.state, 4, context({ garrisonCountByTerritory: { home: 0 } })).transfers).toHaveLength(1);
  });
  it('blocks irreversible ratification of a foreign-donor withdrawal clause, but permits withdrawal and renegotiation', () => {
    const ctx = context({ garrisonCountByTerritory: { partner: 0 } });
    const terms = { ...defaultTerms, withdrawBeforeHandover: true };
    const action: TreatyAction = { kind: 'propose', name: '외국 제공국 인계 협정', territoryId: 'partner', partnerNationId: 'usa', direction: 'request', terms };
    expect(reviewTreatyAction(createTerritorialTreatiesState(), action, ctx).allowed).toBe(true);
    const state = tick(tick(act(createTerritorialTreatiesState(), action, ctx), 1, ctx).state, 2, ctx).state;
    expect(state.treaties[0].status).toBe('accepted');
    const current = { ...ctx, week: 2 };
    const review = reviewTreatyAction(state, ratifyAction(state), current);
    expect(review.allowed).toBe(false);
    expect(review.reason).toBe('현재 자료로 이행할 수 없는 외국 육군 철수 조건은 비준할 수 없습니다. 비준 전 철회 후 철수 조건을 제외하고 재협상하세요.');
    expect(executeTreatyAction(state, ratifyAction(state), current)).toMatchObject({ accepted: false, gameDelta: {}, transfers: [] });
    const withdrawn = act(state, { kind: 'withdraw', treatyId: state.treaties[0].id }, current);
    const next = act(withdrawn, { ...action, terms: defaultTerms }, { ...ctx, week: 3 });
    const renegotiated = tick(tick(next, 4, ctx).state, 5, ctx).state;
    expect(reviewTreatyAction(renegotiated, { kind: 'ratify', treatyId: renegotiated.treaties[1].id }, { ...ctx, week: 5 }).allowed).toBe(true);
  });
  it('still permits the agreed local consultation before a foreign-donor withdrawal clause is renegotiated', () => {
    const ctx = context();
    const action: TreatyAction = { kind: 'propose', name: '외국 거점 협의', territoryId: 'partner', partnerNationId: 'usa', direction: 'request', terms: { ...council, withdrawBeforeHandover: true } };
    const state = tick(tick(act(createTerritorialTreatiesState(), action, ctx), 1, ctx).state, 2, ctx).state;
    expect(reviewTreatyAction(state, { kind: 'start-consultation', treatyId: state.treaties[0].id }, { ...ctx, week: 2 }).allowed).toBe(true);
  });
});

describe('consent save evidence and history validation', () => {
  it('roundtrips every consent status, withdrawal and completed treaty with all evidence', () => {
    const states = [accepted(), started(), tick(started(), 3).state, tick(started(), 3, context({ blockedTerritoryIds: ['home'] })).state,
      decided(), decided({ ...council, civilGuarantees: false }), agreement(), tick(agreement(), 6).state];
    for (const state of states) expect(normalized(state, 10)).toEqual(state);
    const state = decided(); const withdrawn = act(state, { kind: 'withdraw', treatyId: state.treaties[0].id }, context({ week: 5 }));
    expect(normalized(withdrawn, 10)).toEqual(withdrawn);
  });
  it('preserves the actual old model result after supply, owner and current control change', () => {
    const state = decided(); const ctx = siteChange(context(), { supply: 5, ownerId: 'japan', controller: 'axis' });
    expect(normalized(state, 5, ctx)).toEqual(state);
    expect(consistentTreatyConsentResult(state.treaties[0], state.treaties[0].consent!)).toBe(true);
  });
  it.each([
    { method: 'referendum' }, { status: 'fake' }, { progressWeeks: 2 }, { startedWeek: 3 },
    { lastProcessedWeek: 4 }, { resolvedWeek: 4 }, { resolvedWeek: 6 }, { supportPercent: 99 }, { participationPercent: 100 },
    { supplyAtResolution: 5 }, { supplyAtResolution: 100 }, { supplyAtResolution: undefined },
    { modelVersion: undefined }, { modelVersion: 2 }, { evidenceKey: undefined }, { evidenceKey: 'copied' },
  ])('rejects tampered result evidence or chronology %#', (patch) => {
    const state = decided(); state.treaties[0].consent = { ...state.treaties[0].consent!, ...patch } as typeof state.treaties[0]['consent'];
    expect(normalized(state, 5).treaties).toEqual([]);
  });
  it('binds approved evidence to every proposed condition and both parties, not only civil guarantees', () => {
    const state = decided();
    for (const terms of [
      { ...council, civilGuarantees: false }, { ...council, withdrawBeforeHandover: true },
      { ...council, handoverDelayWeeks: 4 as const }, { ...council, consentMethod: 'referendum' as const },
    ]) {
      const changed = { ...state, treaties: [{ ...state.treaties[0], terms }] };
      expect(reviewTreatyAction(changed, ratifyAction(changed), context({ week: 5 })).allowed).toBe(false);
      expect(normalized(changed, 5).treaties).toEqual([]);
    }
    for (const treaty of [
      { ...state.treaties[0], id: 'treaty:korea:usa:home:1', proposedWeek: 1, responseDueWeek: 3, respondedWeek: 3 },
      { ...state.treaties[0], fromNationId: 'usa' as const, toNationId: 'korea' as const },
    ]) expect(consistentTreatyConsentResult(treaty, treaty.consent!)).toBe(false);
  });
  it('rejects impossible results, premature data, mismatched terms and consent attached to a mere proposal', () => {
    const ready = started(); const decision = decided();
    for (const consent of [
      { ...ready.treaties[0].consent!, progressWeeks: 3 }, { ...ready.treaties[0].consent!, supportPercent: 60 },
      { ...ready.treaties[0].consent!, modelVersion: 1 as const }, { ...ready.treaties[0].consent!, lastProcessedWeek: 3 },
      { ...ready.treaties[0].consent!, status: 'suspended' as const },
    ]) expect(normalized({ ...ready, treaties: [{ ...ready.treaties[0], consent }] }, 5).treaties).toEqual([]);
    for (const treaty of [
      { ...decision.treaties[0], terms: defaultTerms }, { ...decision.treaties[0], terms: undefined },
      { ...decision.treaties[0], consent: { ...decision.treaties[0].consent!, status: 'rejected' as const } },
      { ...decision.treaties[0], status: 'proposed' as const, respondedWeek: undefined },
    ]) expect(normalized({ ...decision, treaties: [treaty] }, 5).treaties).toEqual([]);
  });
  it('rejects ratification before the recorded local result or with no approved required evidence', () => {
    const state = agreement();
    for (const treaty of [
      { ...state.treaties[0], consent: undefined },
      { ...state.treaties[0], ratifiedWeek: 4, handoverDueWeek: 5 },
      { ...state.treaties[0], handoverDueWeek: 9 },
    ]) expect(normalized({ ...state, treaties: [treaty] }, 5).treaties).toEqual([]);
  });
});
