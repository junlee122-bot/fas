import { describe, expect, it } from 'vitest';
import { careerRoles, createCareerState, getRole, nations } from './campaign';
import { createConstitutionalJudiciaryState, type ConstitutionalJudiciaryState } from './constitutionalJudiciary';
import type { GovernmentFormId } from './dynasticPolitics';
import { createMapPoliticalLedger, normalizeMapPoliticalLedger, recordPoliticalUpdates } from './mapPoliticalLedger';
import { advancePoliticalSettlementWeek, createPoliticalSettlementState, executePoliticalSettlementAction, normalizePoliticalSettlementState, type PoliticalSettlementContext, type PoliticalSettlementState } from './politicalSettlement';
import { getPoliticalSettlementAuthority } from './politicalSettlementAuthority';
import { createSovereignPowersState, type SovereignPowersState } from './sovereignPowers';
import { createTerritorialTreatiesState, executeTreatyAction, forecastTreatyConsent, normalizeTerritorialTreatiesState, reviewTreatyAction, type TreatyConsentMethod, type TreatyContext, type TreatyState, type TreatyTerms } from './territorialTreaties';
import { advanceTerritorialDiplomacyWeek, getTreatyGarrisonEvidence, getTreatyRatificationMandate } from './territorialTreatyIntegration';
import type { NationId, Territory } from './types';

function treatyContext(overrides: Partial<TreatyContext> = {}): TreatyContext {
  const site: Territory = { id: 'busan', name: '부산', ownerId: 'korea', controller: 'allies', x: 40, y: 55, region: '한반도', value: 12, supply: 70, terrain: '도시', neighbors: ['seoul-neighbor'], siteType: 'city' };
  const territories: Territory[] = [site, { ...site, id: 'seoul-neighbor', name: '인접 거점', x: 41, value: 9 }];
  return {
    week: 0, nationId: 'korea', territories, control: createMapPoliticalLedger(territories, 0),
    relations: [{ id: 'usa', name: '미국', code: 'US', value: 85, status: '협력', color: '#fff' }],
    politicalPower: 100, treasury: 100, stability: 70, institutionalCapacity: 70,
    canNegotiate: true, canRatify: true, approvalSupport: 80, approvalLabel: '검증용 승인 기반', blockedTerritoryIds: [], ...overrides,
  };
}

function politicalContext(context: TreatyContext): PoliticalSettlementContext {
  return { ...context, canDeclare: true, canAdminister: true };
}

function operatingAdministration(context: TreatyContext): PoliticalSettlementState {
  const declared = executePoliticalSettlementAction(createPoliticalSettlementState(), { kind: 'declare', name: '대한 임시정부', declaration: 'representation', seatTerritoryId: 'busan' }, politicalContext(context));
  expect(declared.accepted, declared.reason).toBe(true);
  const started = executePoliticalSettlementAction(declared.state, { kind: 'start-administration', territoryId: 'busan' }, politicalContext(context));
  expect(started.accepted, started.reason).toBe(true);
  let state = started.state;
  for (const week of [1, 2, 3]) state = advancePoliticalSettlementWeek(state, { ...politicalContext(context), week }).state;
  expect(state.administrations[0]).toMatchObject({ status: 'operating', progressWeeks: 3, lastProcessedWeek: 3 });
  return state;
}

interface Harness { context: TreatyContext; treaties: TreatyState; settlement: PoliticalSettlementState }

function tick(harness: Harness, week: number, overrides: Partial<TreatyContext> = {}) {
  const context = { ...harness.context, ...overrides, week };
  const result = advanceTerritorialDiplomacyWeek(harness.treaties, harness.settlement, context, politicalContext(context));
  return { result, harness: { context: { ...context, territories: result.territories, control: result.control }, treaties: result.treatyResult.state, settlement: result.politicalResult.state } };
}

function propose(context = treatyContext(), terms?: TreatyTerms): Harness {
  const settlement = operatingAdministration(context);
  const current = { ...context, week: 3 };
  const proposed = executeTreatyAction(createTerritorialTreatiesState(), { kind: 'propose', name: '부산 거점 인계 합의', partnerNationId: 'usa', territoryId: 'busan', direction: 'offer', ...(terms ? { terms } : {}) }, current);
  expect(proposed.accepted, proposed.reason).toBe(true);
  expect(proposed.gameDelta).toEqual({ politicalPower: -6, treasury: 0 });
  return { context: { ...current, politicalPower: current.politicalPower - 6 }, treaties: proposed.state, settlement };
}

function accepted(): Harness {
  let harness = propose();
  harness = tick(harness, 4).harness;
  harness = tick(harness, 5).harness;
  expect(harness.treaties.treaties[0].status).toBe('accepted');
  return harness;
}

function ratified(): Harness {
  const harness = accepted();
  const result = executeTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context);
  expect(result.accepted, result.reason).toBe(true);
  expect(result.gameDelta).toEqual({ politicalPower: -8, treasury: -4 });
  expect(result.transfers).toEqual([]);
  return { ...harness, context: { ...harness.context, politicalPower: harness.context.politicalPower - 8, treasury: harness.context.treasury - 4 }, treaties: result.state };
}

function capture(harness: Harness, week: number, nationId: NationId = 'germany'): Harness {
  const faction = nations.find((nation) => nation.id === nationId)!.alignment;
  const territories = harness.context.territories.map((site) => site.id === 'busan' ? { ...site, ownerId: nationId, controller: faction } : site);
  const control = recordPoliticalUpdates(harness.context.control, [{ territoryId: 'busan', controller: faction, gameOwnerId: nationId, verifiedControllerNationId: nationId, week, source: { kind: 'enemy-land', id: `capture-${nationId}-${week}`, label: '검증용 후속 점령 결과' } }]);
  return { ...harness, context: { ...harness.context, week, territories, control } };
}

function saveRoundtrip(harness: Harness): Harness {
  const saved = JSON.parse(JSON.stringify(harness));
  const territories = saved.context.territories as Territory[];
  const week = harness.context.week;
  const treaties = normalizeTerritorialTreatiesState(saved.treaties, territories, week);
  const control = normalizeMapPoliticalLedger(saved.context.control, territories, week);
  const settlement = normalizePoliticalSettlementState(saved.settlement, territories, week);
  expect(treaties).toEqual(harness.treaties);
  expect(control).toEqual(harness.context.control);
  expect(settlement).toEqual(harness.settlement);
  return { context: { ...harness.context, territories, control }, treaties, settlement };
}

function consulting(method: Exclude<TreatyConsentMethod, 'none'> = 'referendum'): Harness {
  const initial = treatyContext({ requiredConsent: method });
  // Supply 100 makes this fixture deterministic under both synthetic decision rules.
  // It is not a claim about historical participation or actual local population.
  const territories = initial.territories.map((site) => ({ ...site, supply: 100 }));
  const context = { ...initial, territories, control: createMapPoliticalLedger(territories, 0) };
  let harness = propose(context, { consentMethod: method, civilGuarantees: true, withdrawBeforeHandover: true, handoverDelayWeeks: 4 });
  harness = tick(harness, 4).harness;
  harness = tick(harness, 5).harness;
  const treaty = harness.treaties.treaties[0];
  expect(treaty.status).toBe('accepted');
  const forecast = forecastTreatyConsent(treaty, harness.context.territories[0]);
  expect(forecast.supportPercent).toBeGreaterThanOrEqual(60);
  expect(forecast.participationPercent).toBeGreaterThanOrEqual(50);
  const started = executeTreatyAction(harness.treaties, { kind: 'start-consultation', treatyId: treaty.id }, harness.context);
  expect(started.accepted, started.reason).toBe(true);
  expect(started.gameDelta).toEqual({ politicalPower: -4, treasury: -3 });
  expect(started.transfers).toEqual([]);
  return { ...harness, treaties: started.state, context: { ...harness.context, politicalPower: harness.context.politicalPower - 4, treasury: harness.context.treasury - 3 } };
}

function consentApproved(method: Exclude<TreatyConsentMethod, 'none'> = 'referendum'): Harness {
  let harness = consulting(method);
  for (const week of [6, 7, 8]) harness = tick(harness, week).harness;
  expect(harness.treaties.treaties[0].consent).toMatchObject({ status: 'approved', progressWeeks: 3, resolvedWeek: 8 });
  return harness;
}

function signConditional(harness: Harness): Harness {
  const signed = executeTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context);
  expect(signed.accepted, signed.reason).toBe(true);
  expect(signed.gameDelta).toEqual({ politicalPower: -8, treasury: -12 });
  expect(signed.transfers).toEqual([]);
  return { ...harness, treaties: signed.state, context: { ...harness.context, politicalPower: harness.context.politicalPower - 8, treasury: harness.context.treasury - 12 } };
}

describe('territorial diplomacy real-domain weekly integration', () => {
  it('keeps proposal, foreign response, ratification and one-site handover separate', () => {
    let harness = propose();
    const originalTerritories = JSON.stringify(harness.context.territories);
    const originalLedger = JSON.stringify(harness.context.control);
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'proposed', proposedWeek: 3, responseDueWeek: 5 });
    const first = tick(harness, 4); harness = first.harness;
    expect(harness.treaties.treaties[0].status).toBe('proposed');
    expect(first.result.treatyResult.transfers).toEqual([]);
    const second = tick(harness, 5); harness = second.harness;
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'accepted', respondedWeek: 5 });
    expect(JSON.stringify(harness.context.territories)).toBe(originalTerritories);
    expect(JSON.stringify(harness.context.control)).toBe(originalLedger);
    const signed = executeTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context);
    expect(signed.accepted).toBe(true);
    expect(signed.transfers).toEqual([]);
    expect(signed.state.treaties[0]).toMatchObject({ status: 'ratified', ratifiedWeek: 5, handoverDueWeek: 6 });
    expect(JSON.stringify(harness.context.territories)).toBe(originalTerritories);
    const finished = tick({ ...harness, treaties: signed.state }, 6);
    expect(finished.harness.treaties.treaties[0]).toMatchObject({ status: 'completed', completedWeek: 6 });
    expect(finished.result.treatyResult.transfers).toHaveLength(1);
    expect(finished.result.territories[0]).toEqual({ ...harness.context.territories[0], ownerId: 'usa', controller: 'allies' });
    expect(finished.result.territories[1]).toBe(harness.context.territories[1]);
    expect(finished.result.control.changes).toHaveLength(1);
    expect(finished.result.control.changes[0]).toMatchObject({ territoryId: 'busan', week: 6, source: { kind: 'treaty-transfer', id: signed.state.treaties[0].id }, before: { gameOwnerId: 'korea', controller: 'allies' }, after: { gameOwnerId: 'usa', controller: 'allies', verifiedControllerNationId: 'usa' } });
    expect(finished.result.treatyResult.gameDelta).toEqual({});
    expect(finished.result.politicalResult.gameDelta).toEqual({});
  });

  it('suspends the former administration in the same weekly handover without granting a new administration', () => {
    const harness = ratified();
    const before = JSON.stringify(harness);
    const { result } = tick(harness, 6);
    expect(result.politicalResult.state.administrations).toHaveLength(1);
    expect(result.politicalResult.state.administrations[0]).toMatchObject({ polityId: 'polity:korea', territoryId: 'busan', status: 'suspended', progressWeeks: 0, lastProcessedWeek: 6 });
    expect(result.politicalResult.events.filter((event) => event.title.includes('행정 중단'))).toHaveLength(1);
    expect(result.politicalResult.state.recognitions).toEqual([]);
    expect(result.politicalResult.state.polities.map((polity) => polity.nationId)).toEqual(['korea']);
    expect(JSON.stringify(harness)).toBe(before);
  });

  it('reconciles a same-week partial resume without replaying administration progress or recognition', () => {
    const harness = ratified();
    const recognition = executePoliticalSettlementAction(harness.settlement, { kind: 'request-recognition', partnerNationId: 'usa' }, politicalContext(harness.context));
    expect(recognition.accepted, recognition.reason).toBe(true);
    const anotherOffice = executePoliticalSettlementAction(recognition.state, { kind: 'start-administration', territoryId: 'seoul-neighbor' }, politicalContext(harness.context));
    expect(anotherOffice.accepted, anotherOffice.reason).toBe(true);
    // The political portion of week 6 was already observed, but the treaty portion was not.
    const alreadyAdvanced = advancePoliticalSettlementWeek(anotherOffice.state, { ...politicalContext(harness.context), week: 6 }).state;
    expect(alreadyAdvanced.lastAdvancedWeek).toBe(6);
    expect(alreadyAdvanced.administrations.find((item) => item.territoryId === 'busan')?.status).toBe('operating');
    const otherBefore = alreadyAdvanced.administrations.find((item) => item.territoryId === 'seoul-neighbor');
    expect(otherBefore).toMatchObject({ status: 'preparing', progressWeeks: 1, lastProcessedWeek: 6 });
    const before = JSON.stringify(alreadyAdvanced);
    const completed = tick({ ...harness, settlement: alreadyAdvanced }, 6);
    expect(completed.result.treatyResult.transfers).toHaveLength(1);
    expect(completed.harness.settlement.administrations.find((item) => item.territoryId === 'busan')).toMatchObject({ status: 'suspended', progressWeeks: 0, lastProcessedWeek: 6 });
    expect(completed.harness.settlement.administrations.find((item) => item.territoryId === 'seoul-neighbor')).toEqual(otherBefore);
    expect(completed.harness.settlement.recognitions).toEqual(alreadyAdvanced.recognitions);
    expect(completed.harness.settlement.lastAdvancedWeek).toBe(6);
    expect(completed.result.politicalResult.gameDelta).toEqual({});
    expect(completed.result.politicalResult.events).toHaveLength(1);
    expect(completed.result.politicalResult.events[0].title).toContain('행정 중단');
    expect(JSON.stringify(alreadyAdvanced)).toBe(before);
    const repeated = tick(completed.harness, 6);
    expect(repeated.result.politicalResult.events).toEqual([]);
    expect(repeated.harness.settlement).toEqual(completed.harness.settlement);
    expect(repeated.result.treatyResult.transfers).toEqual([]);
  });

  it('does not replay handover, suspension or receipts on repeated and later weekly ticks', () => {
    const completed = tick(ratified(), 6).harness;
    const sameWeek = tick(completed, 6);
    expect(sameWeek.result.treatyResult.transfers).toEqual([]);
    expect(sameWeek.result.treatyResult.events).toEqual([]);
    expect(sameWeek.result.politicalResult.events).toEqual([]);
    expect(sameWeek.result.territories).toBe(completed.context.territories);
    expect(sameWeek.result.control).toBe(completed.context.control);
    expect(sameWeek.harness.treaties).toBe(completed.treaties);
    expect(sameWeek.harness.settlement).toBe(completed.settlement);
    const later = tick(sameWeek.harness, 7);
    expect(later.result.treatyResult.transfers).toEqual([]);
    expect(later.result.treatyResult.events).toEqual([]);
    expect(later.result.politicalResult.events).toEqual([]);
    expect(later.result.control.changes).toHaveLength(1);
    expect(later.result.control.seenIds).toHaveLength(1);
  });

  it('preserves completed treaty history after recapture and through a real JSON save roundtrip', () => {
    const completed = tick(ratified(), 6).harness;
    const receipt = structuredClone(completed.treaties.treaties[0]);
    const recaptured = capture(completed, 7);
    const after = tick(recaptured, 7).harness;
    expect(after.treaties.treaties[0]).toEqual(receipt);
    expect(after.context.territories[0]).toMatchObject({ ownerId: 'germany', controller: 'axis' });
    expect(after.context.control.changes.map((change) => change.source.kind)).toEqual(['treaty-transfer', 'enemy-land']);
    const saved = JSON.parse(JSON.stringify(after));
    const restoredTreaties = normalizeTerritorialTreatiesState(saved.treaties, saved.context.territories, 7);
    const restoredControl = normalizeMapPoliticalLedger(saved.context.control, saved.context.territories, 7);
    const restoredSettlement = normalizePoliticalSettlementState(saved.settlement, saved.context.territories, 7);
    expect(restoredTreaties).toEqual(after.treaties);
    expect(restoredControl).toEqual(after.context.control);
    expect(restoredSettlement).toEqual(after.settlement);
    const resumed = tick({ context: { ...after.context, control: restoredControl }, treaties: restoredTreaties, settlement: restoredSettlement }, 8);
    expect(resumed.result.treatyResult.transfers).toEqual([]);
    expect(resumed.result.territories[0].ownerId).toBe('germany');
    expect(resumed.result.control.changes).toHaveLength(2);
  });

  it('suspends agreed handover after third-country capture and resumes only after donor control returns', () => {
    const agreement = ratified();
    const occupied = tick(capture(agreement, 6), 6);
    expect(occupied.result.treatyResult.transfers).toEqual([]);
    expect(occupied.harness.treaties.treaties[0]).toMatchObject({ status: 'suspended', ratifiedWeek: 5 });
    expect(occupied.result.territories[0].ownerId).toBe('germany');
    const stillOccupied = tick(occupied.harness, 7);
    expect(stillOccupied.result.treatyResult.events).toEqual([]);
    const recovered = tick(capture(stillOccupied.harness, 8, 'korea'), 8);
    expect(recovered.harness.treaties.treaties[0]).toMatchObject({ status: 'completed', completedWeek: 8 });
    expect(recovered.result.territories[0].ownerId).toBe('usa');
    expect(recovered.result.control.changes.map((change) => change.source.kind)).toEqual(['enemy-land', 'enemy-land', 'treaty-transfer']);
    expect(recovered.harness.settlement.administrations[0].status).toBe('suspended');
  });

  it('keeps the donor owner unchanged while an active operation blocks handover', () => {
    const blocked = tick(ratified(), 6, { blockedTerritoryIds: ['busan'] });
    expect(blocked.harness.treaties.treaties[0].status).toBe('suspended');
    expect(blocked.result.treatyResult.transfers).toEqual([]);
    expect(blocked.result.control.changes).toEqual([]);
    expect(blocked.result.territories[0].ownerId).toBe('korea');
    expect(blocked.harness.settlement.administrations[0].status).toBe('operating');
    const released = tick(blocked.harness, 7, { blockedTerritoryIds: [] });
    expect(released.result.territories[0].ownerId).toBe('usa');
    expect(released.harness.settlement.administrations[0].status).toBe('suspended');
  });

  it('does not advance a former proposer response using the new career nation relations', () => {
    const pending = tick(propose(), 4).harness;
    const changedNation = tick(pending, 5, { nationId: 'japan' });
    expect(changedNation.harness.treaties.treaties[0].status).toBe('proposed');
    expect(changedNation.result.treatyResult.transfers).toEqual([]);
    expect(changedNation.result.territories[0].ownerId).toBe('korea');
    expect(changedNation.harness.settlement.administrations[0].lastProcessedWeek).toBe(4);
    expect(executeTreatyAction(changedNation.harness.treaties, { kind: 'ratify', treatyId: pending.treaties.treaties[0].id }, changedNation.harness.context).accepted).toBe(false);
  });

  it('keeps old saves empty without replaying current territory into invented treaty history', () => {
    const context = treatyContext({ week: 200 });
    const treaties = normalizeTerritorialTreatiesState(undefined, context.territories, 200);
    const settlement = normalizePoliticalSettlementState(undefined, context.territories, 200);
    const first = advanceTerritorialDiplomacyWeek(treaties, settlement, context, politicalContext(context));
    expect(first.treatyResult.state.treaties).toEqual([]);
    expect(first.treatyResult.transfers).toEqual([]);
    expect(first.territories).toBe(context.territories);
    expect(first.control).toBe(context.control);
    expect(first.politicalResult.state.polities).toEqual([]);
  });

  it('executes an incoming request from a different faction without awarding administration or moving geography', () => {
    const original = treatyContext();
    const territories = original.territories.map((site) => site.id === 'busan' ? { ...site, ownerId: 'germany' as const, controller: 'axis' as const } : site);
    const context = treatyContext({ territories, control: createMapPoliticalLedger(territories, 0), relations: [{ id: 'germany', name: '독일', code: 'DE', value: 85, status: '교섭', color: '#fff' }] });
    const proposed = executeTreatyAction(createTerritorialTreatiesState(), { kind: 'propose', name: '부산 인수 요청', partnerNationId: 'germany', territoryId: 'busan', direction: 'request' }, context);
    expect(proposed.accepted, proposed.reason).toBe(true);
    let harness: Harness = { context, treaties: proposed.state, settlement: createPoliticalSettlementState() };
    harness = tick(harness, 1).harness;
    harness = tick(harness, 2).harness;
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'accepted', fromNationId: 'germany', toNationId: 'korea' });
    const signed = executeTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context);
    expect(signed.accepted, signed.reason).toBe(true);
    const finished = tick({ ...harness, treaties: signed.state }, 3);
    expect(finished.result.territories[0]).toEqual({ ...territories[0], ownerId: 'korea', controller: 'allies' });
    expect(finished.result.territories[1]).toBe(territories[1]);
    expect(finished.result.control.changes[0]).toMatchObject({ before: { controller: 'axis', gameOwnerId: 'germany' }, after: { controller: 'allies', gameOwnerId: 'korea', verifiedControllerNationId: 'korea' } });
    expect(finished.harness.settlement.administrations).toEqual([]);
    expect(finished.harness.settlement.recognitions).toEqual([]);
    expect(finished.harness.settlement.polities).toEqual([]);
    expect(finished.result.treatyResult.gameDelta).toEqual({});
  });
});

describe('conditional treaty consent and military handover integration', () => {
  it('requires three observed consultation weeks, four preparation weeks and actual empty-roster evidence before one handover', () => {
    let harness = consulting();
    const treatyId = harness.treaties.treaties[0].id;
    const ratifyAction = { kind: 'ratify' as const, treatyId };
    expect(harness.treaties.treaties[0].consent).toMatchObject({ status: 'preparing', startedWeek: 5, progressWeeks: 0 });
    expect(reviewTreatyAction(harness.treaties, ratifyAction, harness.context).allowed).toBe(false);
    harness = saveRoundtrip(tick(harness, 6).harness);
    expect(harness.treaties.treaties[0].consent?.progressWeeks).toBe(1);
    const repeatedConsultation = tick(harness, 6);
    expect(repeatedConsultation.harness.treaties).toBe(harness.treaties);
    expect(repeatedConsultation.result.treatyResult.events).toEqual([]);
    harness = tick(harness, 7).harness;
    expect(harness.treaties.treaties[0].consent?.progressWeeks).toBe(2);
    expect(reviewTreatyAction(harness.treaties, ratifyAction, harness.context).allowed).toBe(false);
    harness = tick(harness, 8).harness;
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'accepted', consent: { method: 'referendum', status: 'approved', startedWeek: 5, resolvedWeek: 8, progressWeeks: 3 } });
    expect(harness.context.territories[0].ownerId).toBe('korea');
    expect(harness.context.control.changes).toEqual([]);
    harness = saveRoundtrip(signConditional(harness));
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'ratified', ratifiedWeek: 8, handoverDueWeek: 12 });
    expect(harness.context).toMatchObject({ politicalPower: 82, treasury: 85 });
    const roster = [{ territoryId: 'busan', status: 'moving', targetTerritoryId: 'seoul-neighbor' }];
    const initialRoster = JSON.stringify(roster);
    for (const week of [9, 10, 11]) {
      const waiting = tick(harness, week, { garrisonCountByTerritory: getTreatyGarrisonEvidence('korea', harness.context.territories, harness.context.control, roster) });
      expect(waiting.result.treatyResult.transfers).toEqual([]);
      expect(waiting.result.treatyResult.gameDelta).toEqual({});
      expect(waiting.harness.treaties.treaties[0].status).toBe('ratified');
      expect(waiting.harness.settlement.administrations[0].status).toBe('operating');
      harness = waiting.harness;
    }
    const blocked = tick(harness, 12);
    expect(blocked.result.treatyResult.transfers).toEqual([]);
    expect(blocked.harness.treaties.treaties[0]).toMatchObject({ status: 'suspended', ratifiedWeek: 8, handoverDueWeek: 12 });
    expect(blocked.harness.treaties.treaties[0].reason).toContain('1개');
    expect(blocked.result.control.changes).toEqual([]);
    expect(blocked.result.territories[0].ownerId).toBe('korea');
    expect(blocked.harness.settlement.administrations[0].status).toBe('operating');
    expect(JSON.stringify(roster)).toBe(initialRoster);
    harness = saveRoundtrip(blocked.harness);
    const sameWeek = tick(harness, 12);
    expect(sameWeek.result.treatyResult.events).toEqual([]);
    expect(sameWeek.result.treatyResult.transfers).toEqual([]);
    // Only the military fixture records an arrival; the diplomatic helper cannot move troops.
    const arrivedRoster = roster.map((division) => ({ ...division, territoryId: 'seoul-neighbor', status: 'ready' }));
    const evidence = getTreatyGarrisonEvidence('korea', harness.context.territories, harness.context.control, arrivedRoster);
    expect(Object.prototype.hasOwnProperty.call(evidence, 'busan')).toBe(true);
    expect(evidence.busan).toBe(0);
    const finished = tick(harness, 13, { garrisonCountByTerritory: evidence });
    expect(finished.harness.treaties.treaties[0]).toMatchObject({ status: 'completed', completedWeek: 13 });
    expect(finished.result.treatyResult.transfers).toEqual([{ treatyId, territoryId: 'busan', fromNationId: 'korea', toNationId: 'usa', week: 13 }]);
    expect(finished.result.control.changes).toHaveLength(1);
    expect(finished.result.control.changes[0]).toMatchObject({ week: 13, source: { kind: 'treaty-transfer', id: treatyId } });
    expect(finished.harness.settlement.administrations[0]).toMatchObject({ status: 'suspended', progressWeeks: 0, lastProcessedWeek: 13 });
    expect(finished.result.politicalResult.events.filter((event) => event.title.includes('행정 중단'))).toHaveLength(1);
    expect(finished.harness.settlement.polities.map((polity) => polity.nationId)).toEqual(['korea']);
    expect(finished.harness.context).toMatchObject({ politicalPower: 82, treasury: 85 });
    expect(finished.result.treatyResult.gameDelta).toEqual({});
    expect(finished.result.politicalResult.gameDelta).toEqual({});
    expect(JSON.stringify(roster)).toBe(initialRoster);
    const restored = saveRoundtrip(finished.harness);
    for (const week of [13, 14]) {
      const repeated = tick(restored, week);
      expect(repeated.result.treatyResult.transfers).toEqual([]);
      expect(repeated.result.politicalResult.events).toEqual([]);
      expect(repeated.result.control.changes).toHaveLength(1);
    }
  });

  it('does not infer an absent garrison count as zero and resumes once explicit current-country evidence is available', () => {
    let harness = signConditional(consentApproved());
    for (const week of [9, 10, 11, 12]) harness = tick(harness, week, { garrisonCountByTerritory: undefined }).harness;
    expect(harness.treaties.treaties[0].status).toBe('suspended');
    expect(harness.treaties.treaties[0].reason).toContain('확인할 수 없습니다');
    expect(harness.context.territories[0].ownerId).toBe('korea');
    expect(harness.context.control.changes).toEqual([]);
    const counts = getTreatyGarrisonEvidence('korea', harness.context.territories, harness.context.control, []);
    const released = tick(saveRoundtrip(harness), 13, { garrisonCountByTerritory: counts });
    expect(released.result.treatyResult.transfers).toHaveLength(1);
    expect(released.harness.settlement.administrations[0].status).toBe('suspended');
  });

  it('preserves an already ratified withdrawal condition after a career change and cannot use the new country roster as foreign evidence', () => {
    let harness = signConditional(consentApproved());
    const evidence = getTreatyGarrisonEvidence('usa', harness.context.territories, harness.context.control, []);
    expect(Object.prototype.hasOwnProperty.call(evidence, 'busan')).toBe(false);
    for (const week of [9, 10, 11, 12]) harness = tick(harness, week, { nationId: 'usa', garrisonCountByTerritory: evidence }).harness;
    expect(harness.treaties.treaties[0]).toMatchObject({ status: 'suspended', ratifiedWeek: 8, handoverDueWeek: 12 });
    expect(harness.treaties.treaties[0].reason).toContain('외국 제공국');
    expect(harness.context.territories[0].ownerId).toBe('korea');
    expect(harness.context.control.changes).toEqual([]);
    const forgedEmpty = tick(saveRoundtrip(harness), 13, { garrisonCountByTerritory: { busan: 0 } });
    expect(forgedEmpty.harness.treaties.treaties[0].status).toBe('suspended');
    expect(forgedEmpty.result.treatyResult.transfers).toEqual([]);
    expect(forgedEmpty.result.control.changes).toEqual([]);
    const confirmed = getTreatyGarrisonEvidence('korea', harness.context.territories, harness.context.control, []);
    const returned = tick(forgedEmpty.harness, 14, { nationId: 'korea', garrisonCountByTerritory: confirmed });
    expect(returned.harness.treaties.treaties[0]).toMatchObject({ status: 'completed', ratifiedWeek: 8, completedWeek: 14 });
    expect(returned.result.treatyResult.transfers).toHaveLength(1);
    expect(returned.result.control.changes).toHaveLength(1);
    expect(returned.harness.settlement.administrations[0]).toMatchObject({ status: 'suspended', lastProcessedWeek: 14 });
  });

  it('blocks new foreign-donor withdrawal ratification rather than creating an unresolvable treaty, and allows pre-ratification withdrawal', () => {
    const original = treatyContext();
    const territories = original.territories.map((site) => site.id === 'busan' ? { ...site, ownerId: 'usa' as const } : site);
    const context = treatyContext({ territories, control: createMapPoliticalLedger(territories, 0) });
    const evidence = getTreatyGarrisonEvidence('korea', territories, context.control, []);
    expect(Object.prototype.hasOwnProperty.call(evidence, 'busan')).toBe(false);
    const proposed = executeTreatyAction(createTerritorialTreatiesState(), {
      kind: 'propose', name: '현장 철수 증거가 필요한 인수', partnerNationId: 'usa', territoryId: 'busan', direction: 'request',
      terms: { consentMethod: 'none', civilGuarantees: false, withdrawBeforeHandover: true, handoverDelayWeeks: 4 },
    }, context);
    expect(proposed.accepted, proposed.reason).toBe(true);
    let harness: Harness = { context: { ...context, garrisonCountByTerritory: evidence }, treaties: proposed.state, settlement: createPoliticalSettlementState() };
    harness = tick(harness, 1).harness;
    harness = tick(harness, 2).harness;
    const signed = executeTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context);
    expect(signed.accepted).toBe(false);
    expect(signed.reason).toContain('외국');
    expect(signed.transfers).toEqual([]);
    expect(signed.gameDelta).toEqual({});
    expect(signed.state).toBe(harness.treaties);
    const withdrawn = executeTreatyAction(harness.treaties, { kind: 'withdraw', treatyId: harness.treaties.treaties[0].id }, harness.context);
    expect(withdrawn.accepted, withdrawn.reason).toBe(true);
    expect(withdrawn.state.treaties[0].status).toBe('withdrawn');
    expect(harness.context.territories[0].ownerId).toBe('usa');
    expect(harness.context.control.changes).toEqual([]);
    expect(withdrawn.transfers).toEqual([]);
  });

  it('resets interrupted consultation and requires three new real weekly ticks rather than completing from elapsed calendar time', () => {
    let harness = tick(consulting(), 6).harness;
    harness = tick(harness, 7, { blockedTerritoryIds: ['busan'] }).harness;
    expect(harness.treaties.treaties[0].consent).toMatchObject({ status: 'suspended', progressWeeks: 0, lastProcessedWeek: 7 });
    harness = saveRoundtrip(harness);
    harness = tick(harness, 20, { blockedTerritoryIds: [] }).harness;
    expect(harness.treaties.treaties[0].consent).toMatchObject({ status: 'preparing', progressWeeks: 1, lastProcessedWeek: 20 });
    expect(reviewTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, harness.context).allowed).toBe(false);
    harness = tick(harness, 21).harness;
    harness = tick(harness, 22).harness;
    expect(harness.treaties.treaties[0].consent).toMatchObject({ status: 'approved', progressWeeks: 3, resolvedWeek: 22 });
    expect(harness.context).toMatchObject({ politicalPower: 90, treasury: 97 });
    expect(harness.context.control.changes).toEqual([]);
  });

  it('preserves terms and the approved local evidence after later recapture without replaying the handover', () => {
    let harness = signConditional(consentApproved());
    for (const week of [9, 10, 11, 12]) harness = tick(harness, week, { garrisonCountByTerritory: { busan: 0 } }).harness;
    const receipt = structuredClone(harness.treaties.treaties[0]);
    const occupied = tick(capture(harness, 13), 13).harness;
    const restored = saveRoundtrip(occupied);
    expect(restored.treaties.treaties[0]).toEqual(receipt);
    const after = tick(restored, 14);
    expect(after.result.treatyResult.transfers).toEqual([]);
    expect(after.result.territories[0].ownerId).toBe('germany');
    expect(after.result.control.changes.map((change) => change.source.kind)).toEqual(['treaty-transfer', 'enemy-land']);
  });
});

function topAuthority(nationId: NationId = 'korea') {
  const role = careerRoles.find((candidate) => candidate.nationId === nationId && candidate.branch === 'politics' && candidate.tier === 1)!;
  return getPoliticalSettlementAuthority(createCareerState(nationId, role.id), role, 'serving');
}

function constitution(territoryClause?: string): ConstitutionalJudiciaryState {
  const state = createConstitutionalJudiciaryState('korea');
  if (!territoryClause) return state;
  return { ...state, status: 'enacted', enacted: { name: '검증용 헌법', enactedWeek: 1, ratificationMethodId: 'constituent-assembly', clauses: { government: 'parliamentary-cabinet', rights: 'civil-liberties-charter', review: 'constitutional-court-review', appointments: 'independent-commission', prosecution: 'independent-prosecution', emergency: 'sunset-emergency', territory: territoryClause }, amendmentThreshold: '의회 동의', publicSupport: 80, contradictions: [] } };
}

function powers(overrides: Partial<SovereignPowersState> = {}) {
  return { ...createSovereignPowersState('korea'), constitutionalConvention: 80, parliamentaryConfidence: 75, authorityCapital: 90, ...overrides };
}

describe('treaty ratification current-office and constitutional mandate', () => {
  it.each(nations)('$id derives top-office authority from that country actual role', (nation) => {
    const result = getTreatyRatificationMandate(nation.id, topAuthority(nation.id), createConstitutionalJudiciaryState(nation.id), 'parliamentary-republic', { ...powers(), nationId: nation.id });
    expect(result).toMatchObject({ canRatify: true, approvalSupport: 75 });
    expect(result.reason).toContain('실제 의회 표결 결과가 아닙니다');
  });

  it.each(['constitution', 'powers'] as const)('denies mismatched current-country %s records', (record) => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), { ...constitution(), nationId: record === 'constitution' ? 'japan' : 'korea' }, 'parliamentary-republic', powers({ nationId: record === 'powers' ? 'japan' : 'korea' }));
    expect(result).toMatchObject({ canRatify: false, approvalSupport: 0 });
    expect(result.reason).toContain('일치하지 않습니다');
  });

  it.each(['korea-political-minister', 'korea-political-bureau', 'korea-tier2', 'korea-intelligence-director'])('does not upgrade lower or non-political office %s to treaty ratification', (roleId) => {
    const role = getRole(roleId, 'korea');
    expect(role.id).toBe(roleId);
    const authority = getPoliticalSettlementAuthority(createCareerState('korea', role.id), role, 'serving');
    expect(getTreatyRatificationMandate('korea', authority, constitution(), 'parliamentary-republic', powers()).canRatify).toBe(false);
  });

  it.each(['dismissed', 'unattached'] as const)('denies the former political leader after %s', (affiliation) => {
    const role = getRole('korea-tier1', 'korea');
    const authority = getPoliticalSettlementAuthority(createCareerState('korea', role.id), role, affiliation);
    expect(getTreatyRatificationMandate('korea', authority, constitution(), 'parliamentary-republic', powers()).canRatify).toBe(false);
  });

  it('denies a formal-office identity mismatch even with valid current country constitutional records', () => {
    const role = getRole('korea-tier1', 'korea');
    const authority = getPoliticalSettlementAuthority({ ...createCareerState('korea', role.id), nationId: 'japan' }, role, 'serving');
    expect(getTreatyRatificationMandate('korea', authority, constitution(), 'parliamentary-republic', powers()).canRatify).toBe(false);
  });

  it.each([
    { clause: 'devolved-regions', requiredConsent: 'regional-council' },
    { clause: 'federal-compact', requiredConsent: 'regional-council' },
    { clause: 'self-determination-compact', requiredConsent: 'referendum' },
  ])('requires $requiredConsent rather than removing ratification authority under enacted $clause', ({ clause, requiredConsent }) => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), constitution(clause), 'presidential-republic', powers());
    expect(result).toMatchObject({ canRatify: true, requiredConsent });
    const harness = accepted();
    expect(reviewTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, { ...harness.context, ...result }).allowed).toBe(false);
  });

  it.each([
    { clause: 'devolved-regions', method: 'regional-council' as const },
    { clause: 'federal-compact', method: 'regional-council' as const },
    { clause: 'self-determination-compact', method: 'referendum' as const },
  ])('permits ratification under $clause only after that actual treaty completed its required $method procedure', ({ clause, method }) => {
    const mandate = getTreatyRatificationMandate('korea', topAuthority(), constitution(clause), 'presidential-republic', powers());
    const harness = consentApproved(method);
    const action = { kind: 'ratify' as const, treatyId: harness.treaties.treaties[0].id };
    expect(reviewTreatyAction(harness.treaties, action, { ...harness.context, ...mandate }).allowed).toBe(true);
    expect(executeTreatyAction(harness.treaties, action, { ...harness.context, ...mandate }).accepted).toBe(true);
    const changedCountry = reviewTreatyAction(harness.treaties, action, { ...harness.context, ...mandate, nationId: 'usa' });
    expect(changedCountry.allowed).toBe(false);
    const lowerRole = getRole('korea-political-minister', 'korea');
    const lowerAuthority = getPoliticalSettlementAuthority(createCareerState('korea', lowerRole.id), lowerRole, 'serving');
    const lowerMandate = getTreatyRatificationMandate('korea', lowerAuthority, constitution(clause), 'presidential-republic', powers());
    expect(reviewTreatyAction(harness.treaties, action, { ...harness.context, ...lowerMandate }).allowed).toBe(false);
  });

  it('does not reuse approved regional council consent after the constitution requires a referendum', () => {
    const harness = consentApproved('regional-council');
    const strengthened = getTreatyRatificationMandate('korea', topAuthority(), constitution('self-determination-compact'), 'presidential-republic', powers());
    const action = { kind: 'ratify' as const, treatyId: harness.treaties.treaties[0].id };
    expect(reviewTreatyAction(harness.treaties, action, { ...harness.context, ...strengthened }).allowed).toBe(false);
    expect(executeTreatyAction(harness.treaties, action, { ...harness.context, ...strengthened }).gameDelta).toEqual({});
    expect(harness.context.control.changes).toEqual([]);
  });

  it('uses enacted clauses, not an unratified federal draft', () => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), { ...constitution(), draft: { territory: 'federal-compact' } }, 'presidential-republic', powers());
    expect(result.canRatify).toBe(true);
  });

  it.each(['parliamentary-republic', 'presidential-republic', 'semi-presidential-republic', 'constitutional-monarchy', 'peoples-commonwealth'] as GovernmentFormId[])('%s uses the weaker parliamentary and convention indicator, not high authority capital', (form) => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), constitution(), form, powers({ parliamentaryConfidence: 59.99, authorityCapital: 100 }));
    expect(result.approvalSupport).toBe(59.99);
    expect(result.approvalLabel).toContain('의회');
    const harness = accepted();
    expect(reviewTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, { ...harness.context, ...result }).allowed).toBe(false);
  });

  it.each(['crown-state', 'imperial-federation', 'military-regency'] as GovernmentFormId[])('%s uses authority capital and convention rather than simulated parliamentary votes', (form) => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), constitution(), form, powers({ constitutionalConvention: 67, authorityCapital: 62, parliamentaryConfidence: 15 }));
    expect(result.approvalSupport).toBe(62);
    expect(result.approvalLabel).toContain('통치 권한 기반');
    expect(result.reason).toContain('게임 지표');
  });

  it('requires both representative confidence and convention to reach the exact approval boundary', () => {
    const harness = accepted();
    for (const indicators of [{ constitutionalConvention: 60, parliamentaryConfidence: 60 }, { constitutionalConvention: 59.999, parliamentaryConfidence: 100 }, { constitutionalConvention: 100, parliamentaryConfidence: 59.999 }]) {
      const result = getTreatyRatificationMandate('korea', topAuthority(), constitution(), 'parliamentary-republic', powers(indicators));
      const review = reviewTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, { ...harness.context, ...result });
      expect(review.allowed).toBe(indicators.constitutionalConvention >= 60 && indicators.parliamentaryConfidence >= 60);
    }
  });

  it.each([NaN, Infinity, -1, 101].flatMap((invalid) => [
    { field: 'parliamentaryConfidence' as const, invalid, form: 'parliamentary-republic' as const },
    { field: 'constitutionalConvention' as const, invalid, form: 'parliamentary-republic' as const },
    { field: 'authorityCapital' as const, invalid, form: 'crown-state' as const },
  ]))('rejects malformed $field=$invalid for $form rather than masking it with the other metric', ({ field, invalid, form }) => {
    const result = getTreatyRatificationMandate('korea', topAuthority(), constitution(), form, powers({ [field]: invalid }));
    expect(result.approvalSupport).toBe(0);
    const harness = accepted();
    expect(reviewTreatyAction(harness.treaties, { kind: 'ratify', treatyId: harness.treaties.treaties[0].id }, { ...harness.context, ...result }).allowed).toBe(false);
  });
});

describe('treaty garrison evidence from the current national roster', () => {
  it('provides explicit own-property zero counts only for known currently controlled land sites', () => {
    const context = treatyContext();
    const evidence = getTreatyGarrisonEvidence('korea', context.territories, context.control, []);
    expect(Object.getPrototypeOf(evidence)).toBeNull();
    expect(Object.keys(evidence)).toEqual(['busan', 'seoul-neighbor']);
    expect(Object.prototype.hasOwnProperty.call(evidence, 'busan')).toBe(true);
    expect(evidence.busan).toBe(0);
    expect(Object.prototype.hasOwnProperty.call(evidence, 'toString')).toBe(false);
  });

  it('does not turn foreign, unknown, mismatched or absent control evidence into zero troops', () => {
    const context = treatyContext();
    const foreign: Territory = { ...context.territories[0], id: 'foreign-city', ownerId: 'usa' };
    const unknown: Territory = { ...context.territories[0], id: 'unknown-city', ownerId: undefined };
    const mismatch: Territory = { ...context.territories[0], id: 'mismatched-city' };
    const missing: Territory = { ...context.territories[0], id: 'missing-city' };
    const territories = [...context.territories, foreign, unknown, mismatch, missing];
    const control = createMapPoliticalLedger(territories, 0);
    control.current[mismatch.id] = { ...control.current[mismatch.id], gameOwnerId: 'usa' };
    delete control.current[missing.id];
    const evidence = getTreatyGarrisonEvidence('korea', territories, control, territories.map((site) => ({ territoryId: site.id })));
    expect(Object.keys(evidence)).toEqual(['busan', 'seoul-neighbor']);
    expect(evidence.busan).toBe(1);
    for (const site of [foreign, unknown, mismatch, missing]) expect(Object.prototype.hasOwnProperty.call(evidence, site.id), site.id).toBe(false);
  });

  it('excludes sea sites identified by type, terrain or geographic catalog, even with a friendly owner', () => {
    const context = treatyContext();
    const base = context.territories[0];
    const territories: Territory[] = [
      { ...base, id: 'test-sea-type', siteType: 'sea' },
      { ...base, id: 'test-sea-terrain', terrain: '해역' },
      { ...base, id: 'coral_sea', siteType: 'city', terrain: '도시' },
    ];
    const evidence = getTreatyGarrisonEvidence('korea', territories, createMapPoliticalLedger(territories, 0), territories.map((site) => ({ territoryId: site.id })));
    expect(Object.keys(evidence)).toEqual([]);
  });

  it('keeps moving and embarked divisions at their registered site until military arrival updates the roster', () => {
    const context = treatyContext();
    const divisions = [
      { territoryId: 'busan', status: 'ready' },
      { territoryId: 'busan', status: 'moving', targetTerritoryId: 'seoul-neighbor' },
      { territoryId: 'busan', status: 'embarked', destinationId: 'foreign-city' },
      { territoryId: 'seoul-neighbor', status: 'ready' },
      { territoryId: 'nonexistent', status: 'ready' },
    ];
    const before = JSON.stringify(divisions);
    expect(getTreatyGarrisonEvidence('korea', context.territories, context.control, divisions)).toMatchObject({ busan: 3, 'seoul-neighbor': 1 });
    expect(JSON.stringify(divisions)).toBe(before);
    const arrived = divisions.map((division) => division.territoryId === 'busan' ? { ...division, territoryId: 'seoul-neighbor' } : division);
    expect(getTreatyGarrisonEvidence('korea', context.territories, context.control, arrived)).toMatchObject({ busan: 0, 'seoul-neighbor': 4 });
  });

  it('uses verified current control rather than assuming the current career country owns every roster location', () => {
    const context = treatyContext();
    const territories = context.territories.map((site) => site.id === 'busan' ? { ...site, ownerId: 'usa' as const } : site);
    const control = createMapPoliticalLedger(territories, 0);
    expect(getTreatyGarrisonEvidence('korea', territories, control, [{ territoryId: 'busan' }])).toEqual({ 'seoul-neighbor': 0 });
    expect(getTreatyGarrisonEvidence('usa', territories, control, [{ territoryId: 'busan' }])).toEqual({ busan: 1 });
  });
});
