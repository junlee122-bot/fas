import { describe, expect, it } from 'vitest';
import { careerRoles, createCareerState, getRole, nations } from './campaign';
import { advanceClandestineCareerWeek, createClandestineCareerState } from './clandestineCareer';
import { civilianProfessions, createCivilianCareerState, getCivilianRoleId } from './civilianCareer';
import {
  createCareerMarketState,
  evaluateForeignCareerOffers,
  expireCareerOffers,
  getCareerApproachEligibility,
  getCareerApproachPreview,
  getCareerOfferResponseEligibility,
  getCareerOfferResponsePreview,
  getCareerRecruitmentReadiness,
  initiateCareerApproach,
  markCareerDismissed,
  normalizeCareerMarketState,
  respondToCareerOffer,
} from './careerMarket';
import type { CareerApproachKind, CareerMarketContext, CareerOfferResponse, ForeignCareerOffer } from './careerMarket';
import type { NationId } from './types';

function context(roleId = 'britain-tier2', week = 26): CareerMarketContext {
  const career = createCareerState('britain', roleId);
  return {
    week,
    career: { ...career, reputation: 76, councilTrust: 48 },
    role: getRole(roleId, 'britain'),
    game: {
      treasury: 880,
      politicalPower: 72,
      stability: 61,
      warSupport: 70,
      intelNetwork: 78,
      victoryScore: 55,
      enemyPressure: 64,
    },
    campaignPhase: 'war',
  };
}

describe('international career market', () => {
  it('excludes a serving head of state from routine foreign approaches', () => {
    const topOffice = context('britain-tier1');
    const result = evaluateForeignCareerOffers(createCareerMarketState(), topOffice, true);
    expect(result.newOffers).toHaveLength(0);
  });

  it('generates several continuation routes immediately after dismissal', () => {
    const result = markCareerDismissed(createCareerMarketState(), context());
    expect(result.state.affiliationStatus).toBe('dismissed');
    expect(result.newOffers.length).toBeGreaterThanOrEqual(1);
    expect(result.newOffers.every((offer) => offer.sourceNationId !== 'britain')).toBe(true);
    expect(result.newOffers.every((offer) => offer.deadlineWeek > offer.receivedWeek)).toBe(true);
  });

  it('lets the player initiate an approach and converts a reply into a negotiable offer', () => {
    const result = initiateCareerApproach(createCareerMarketState(), 'usa', 'offer-double-agent', context());
    expect(result.state.lastApproachWeek).toBe(26);
    if (result.success) {
      expect(result.offer?.sourceNationId).toBe('usa');
      expect(result.offer?.origin).toBe('player-initiated');
      expect(result.offer?.kind).toBe('double-agent');
    } else {
      expect(result.state.history[0]?.outcome).toBe('approach-failed');
    }
  });

  it('supports exploring, negotiating, reporting and accepting a foreign proposal', () => {
    const generated = markCareerDismissed(createCareerMarketState(), context());
    const offer = generated.newOffers[0];
    const explored = respondToCareerOffer(generated.state, offer.id, 'explore', context());
    expect(explored?.offer.status).toBe('exploring');
    const negotiated = respondToCareerOffer(explored!.state, offer.id, 'negotiate', context());
    expect(negotiated?.offer.status).toBe('negotiating');
    expect(negotiated!.offer.terms.signingBonus).toBeGreaterThan(offer.terms.signingBonus);
    const accepted = respondToCareerOffer(negotiated!.state, offer.id, 'accept', context());
    expect(accepted?.offer.status).toBe('accepted');
    expect(accepted?.state.history[0]?.outcome).toBe('accepted');
  });

  it('requires intelligence access to turn a foreign approach', () => {
    const generated = markCareerDismissed(createCareerMarketState(), context());
    const offer = generated.newOffers[0];
    const weakContext = {
      ...context(),
      role: getRole('britain-political-organizer', 'britain'),
      game: { ...context().game, intelNetwork: 30 },
    };
    expect(respondToCareerOffer(generated.state, offer.id, 'turn', weakContext)).toBeNull();
    const strong = respondToCareerOffer(generated.state, offer.id, 'turn', context());
    expect(strong?.offer.status).toBe('turned');
    expect(strong?.careerDelta.councilTrust).toBeGreaterThan(0);
  });

  it('accumulates counterintelligence exposure while serving as a double agent', () => {
    const initial = {
      ...createCareerMarketState(),
      affiliationStatus: 'double-agent' as const,
      lastEvaluationWeek: 25,
      exposure: 12,
      secretsDelivered: 3,
    };

    const result = evaluateForeignCareerOffers(initial, context('britain-tier2', 26));

    expect(result.state.exposure).toBeGreaterThan(initial.exposure);
  });

  it('keeps a serving player free of unsolicited offers during the first six weeks, even in forced evaluations', () => {
    for (const role of careerRoles.filter((item) => item.nationId === 'britain' && item.tier !== 1)) {
      for (let week = 0; week < 6; week += 1) {
        const current = context(role.id, week);
        for (const force of [false, true]) {
          const result = evaluateForeignCareerOffers(createCareerMarketState(), current, force);
          expect(result.newOffers, `${role.id}, week ${week}, force ${force}`).toHaveLength(0);
          expect(result.state.lastEvaluationWeek).toBe(week);
        }
      }
    }
    expect(evaluateForeignCareerOffers(createCareerMarketState(), context('britain-tier2', 6), true).newOffers.length).toBeGreaterThan(0);
  });

  it('requires both an elapsed career period and a recruitment reason for automatic high-risk proposals', () => {
    const state = createCareerMarketState();
    const healthy = { ...context('britain-tier2', 26), career: { ...context().career, councilTrust: 75 } };
    expect(getCareerRecruitmentReadiness(state, healthy)).toMatchObject({ covertRecruitmentAllowed: false, stateBetrayalAllowed: false, reasons: [] });
    const lowTrust = { ...healthy, career: { ...healthy.career, councilTrust: 35 } };
    expect(getCareerRecruitmentReadiness(state, { ...lowTrust, week: 12 })).toMatchObject({ covertRecruitmentAllowed: false, stateBetrayalAllowed: false });
    expect(getCareerRecruitmentReadiness(state, { ...lowTrust, week: 13 })).toMatchObject({ covertRecruitmentAllowed: true, stateBetrayalAllowed: false });
    expect(getCareerRecruitmentReadiness(state, { ...lowTrust, week: 25 }).stateBetrayalAllowed).toBe(false);
    expect(getCareerRecruitmentReadiness(state, lowTrust).stateBetrayalAllowed).toBe(true);
    expect(getCareerRecruitmentReadiness(state, { ...healthy, week: 52 })).toMatchObject({ covertRecruitmentAllowed: true, stateBetrayalAllowed: true, reasons: ['52주 이상 장기 경력'] });
  });

  it('filters high-risk offers for an established but loyal officer, and explains unlocked recruitment motives', () => {
    const roles = careerRoles.filter((role) => role.nationId === 'britain' && role.tier !== 1);
    const safeOffers = roles.flatMap((role) => {
      const current = context(role.id, 30);
      return evaluateForeignCareerOffers(createCareerMarketState(), { ...current, career: { ...current.career, councilTrust: 75 } }, true).newOffers;
    });
    expect(safeOffers.length).toBeGreaterThan(0);
    expect(safeOffers.every((offer) => ['official-appointment', 'secret-retainer'].includes(offer.kind))).toBe(true);
    const vulnerableOffers = roles.flatMap((role) => {
      const current = context(role.id, 30);
      return evaluateForeignCareerOffers(createCareerMarketState(), { ...current, career: { ...current.career, councilTrust: 20 } }, true).newOffers;
    });
    expect(vulnerableOffers.some((offer) => offer.kind === 'state-betrayal')).toBe(true);
    expect(vulnerableOffers.filter((offer) => ['state-betrayal', 'double-agent', 'sell-secrets'].includes(offer.kind)).every((offer) => offer.pitch.includes('지도부 신임 35 이하'))).toBe(true);
  });

  it('counts distinct pursued foreign contacts, not incoming mail or repeated negotiations', () => {
    const current = { ...context('britain-tier2', 26), career: { ...context().career, councilTrust: 75 } };
    const incoming = markCareerDismissed(createCareerMarketState(), current).newOffers[0];
    const initial = createCareerMarketState();
    expect(getCareerRecruitmentReadiness({ ...initial, offers: [incoming] }, current).foreignContactCount).toBe(0);
    const pursued = { ...incoming, status: 'negotiating' as const };
    const oneContact = getCareerRecruitmentReadiness({ ...initial, offers: [pursued, pursued] }, current);
    expect(oneContact.foreignContactCount).toBe(1);
    expect(oneContact.stateBetrayalAllowed).toBe(false);
    const twoContacts = getCareerRecruitmentReadiness({ ...initial, offers: [pursued, { ...pursued, id: 'second-contact', origin: 'player-initiated' }] }, current);
    expect(twoContacts).toMatchObject({ foreignContactCount: 2, covertRecruitmentAllowed: true, stateBetrayalAllowed: true });
    expect(twoContacts.reasons).toContain('선행 외국 접촉 2회 이상');
  });

  it('preserves immediate post-dismissal work at week one and recognizes dismissal history after reappointment', () => {
    const current = context('britain-tier1', 1);
    const dismissed = markCareerDismissed(createCareerMarketState(), current);
    expect(dismissed.newOffers.length).toBeGreaterThan(0);
    expect(dismissed.newOffers.every((offer) => ['official-appointment', 'asylum-and-post', 'government-in-exile', 'secret-retainer'].includes(offer.kind))).toBe(true);
    const reappointed = { ...dismissed.state, affiliationStatus: 'serving' as const };
    const settledContext = { ...context('britain-tier2', 26), career: { ...context().career, councilTrust: 75 } };
    expect(getCareerRecruitmentReadiness(reappointed, settledContext).reasons).toContain('해임·무소속 경력');
    expect(getCareerRecruitmentReadiness(reappointed, settledContext).stateBetrayalAllowed).toBe(true);
  });

  it('does not block player-initiated contact or an existing offer response during the introductory period', () => {
    const current = context('britain-tier2', 1);
    const approached = initiateCareerApproach(createCareerMarketState(), 'usa', 'offer-double-agent', current);
    expect(approached.state.lastApproachWeek).toBe(1);
    expect(approached.gameDelta.politicalPower).toBe(-2);
    const existing = { ...markCareerDismissed(createCareerMarketState(), current).newOffers[0], kind: 'double-agent' as const };
    const saved = { ...createCareerMarketState(), offers: [existing] };
    const evaluated = evaluateForeignCareerOffers(saved, current);
    expect(evaluated.newOffers).toHaveLength(0);
    expect(evaluated.state.offers[0]).toEqual(existing);
    const accepted = respondToCareerOffer(evaluated.state, existing.id, 'accept', current)!;
    expect(accepted.state.affiliationStatus).toBe('double-agent');
    expect(accepted.state.clandestine).not.toBeNull();
  });

  it('preserves existing clandestine state and its weekly progression while applying new-offer gates', () => {
    const current = context('britain-tier2', 1);
    const clandestine = createClandestineCareerState({ homeNationId: 'britain', handlerNationId: 'germany', week: 0, role: current.role, handlerTrust: 65, coverStrength: 72, weeklyRetainer: 10 });
    const initial = { ...createCareerMarketState(), affiliationStatus: 'double-agent' as const, handlerNationId: 'germany' as const, clandestine, exposure: 12, secretsDelivered: 3 };
    const evaluated = evaluateForeignCareerOffers(initial, current);
    expect(evaluated.state.clandestine).toBe(clandestine);
    expect(evaluated.state.handlerNationId).toBe('germany');
    expect(evaluated.state.affiliationStatus).toBe('double-agent');
    expect(evaluated.state.exposure).toBeGreaterThan(initial.exposure);
    const advanced = advanceClandestineCareerWeek(evaluated.state.clandestine!, { week: 1, role: current.role, intelNetwork: current.game.intelNetwork, stability: current.game.stability, warSupport: current.game.warSupport, campaignPhase: 'war', exposure: evaluated.state.exposure });
    expect(advanced.state.lastProcessedWeek).toBe(1);
    expect(advanced.state.handlerNationId).toBe('germany');
    expect(advanced.state.missions.length).toBeGreaterThan(0);
  });
});

function offerFixture(current = context(), overrides: Partial<ForeignCareerOffer> = {}) {
  const generated = markCareerDismissed(createCareerMarketState(), current).newOffers[0];
  const offer: ForeignCareerOffer = {
    ...generated, kind: 'official-appointment', status: 'pending',
    deadlineWeek: current.week + 3, explorationCount: 0, negotiationCount: 0,
    ...overrides,
  };
  return { offer, state: { ...createCareerMarketState(), offers: [offer] } };
}

const responses: CareerOfferResponse[] = ['defer', 'explore', 'negotiate', 'accept', 'reject', 'report', 'turn'];
const approaches: CareerApproachKind[] = ['apply', 'appeal', 'request-asylum', 'offer-secrets', 'offer-double-agent'];

describe('career decision guards and truthful previews', () => {
  it.each(responses)('allows %s through the deadline and rejects it after expiry without mutation', (response) => {
    const { state, offer } = offerFixture();
    const before = structuredClone(state);
    const onDeadline = { ...context(), week: offer.deadlineWeek };
    expect(getCareerOfferResponseEligibility(state, offer.id, response, onDeadline).allowed).toBe(true);
    expect(respondToCareerOffer(state, offer.id, response, onDeadline)).not.toBeNull();
    const expiredContext = { ...onDeadline, week: offer.deadlineWeek + 1 };
    expect(getCareerOfferResponsePreview(state, offer.id, response, expiredContext).allowed).toBe(false);
    expect(respondToCareerOffer(state, offer.id, response, expiredContext)).toBeNull();
    expect(state).toEqual(before);
    expect(expireCareerOffers(state, offer.deadlineWeek).offers[0].status).toBe('pending');
    expect(expireCareerOffers(state, offer.deadlineWeek + 1).offers[0].status).toBe('expired');
  });

  it('explores and negotiates once each in either order without repeatedly improving terms', () => {
    for (const sequence of [['explore', 'negotiate'], ['negotiate', 'explore']] as const) {
      const { offer, state } = offerFixture();
      const first = respondToCareerOffer(state, offer.id, sequence[0], context())!;
      const second = respondToCareerOffer(first.state, offer.id, sequence[1], context())!;
      expect(second.offer.explorationCount).toBe(1);
      expect(second.offer.negotiationCount).toBe(1);
      expect(second.offer.deadlineWeek).toBe(offer.deadlineWeek + 2);
      expect(second.offer.terms.signingBonus).toBe(Math.round(offer.terms.signingBonus * 1.22));
      expect(second.offer.terms.authority).toBe(offer.terms.authority);
      expect(second.state.history.map((record) => record.outcome)).toEqual([sequence[1] === 'explore' ? 'exploring' : 'negotiating', sequence[0] === 'explore' ? 'exploring' : 'negotiating']);
      const saved = structuredClone(second.state);
      for (let attempt = 0; attempt < 20; attempt += 1) {
        expect(respondToCareerOffer(second.state, offer.id, 'explore', context())).toBeNull();
        expect(respondToCareerOffer(second.state, offer.id, 'negotiate', context())).toBeNull();
      }
      expect(second.state).toEqual(saved);
      expect(respondToCareerOffer(second.state, offer.id, 'accept', context())?.offer.status).toBe('accepted');
    }
  });

  it.each(['exploring', 'negotiating'] as const)('respects legacy %s contacts with no optional counters after restore', (status) => {
    const { offer, state } = offerFixture(context(), { status, explorationCount: undefined, negotiationCount: undefined });
    const restored = normalizeCareerMarketState(state);
    expect(restored.offers[0].explorationCount).toBe(1);
    expect(respondToCareerOffer(restored, offer.id, 'explore', context())).toBeNull();
    if (status === 'negotiating') {
      expect(restored.offers[0].negotiationCount).toBe(1);
      expect(respondToCareerOffer(restored, offer.id, 'negotiate', context())).toBeNull();
    } else {
      expect(respondToCareerOffer(restored, offer.id, 'negotiate', context())).not.toBeNull();
    }
    expect(respondToCareerOffer(restored, offer.id, 'reject', context())?.offer.status).toBe('rejected');
  });

  it.each(responses)('uses identical preview and execution deltas for %s without modifying the preview source', (response) => {
    const { offer, state } = offerFixture(context(), { kind: 'double-agent' });
    const before = structuredClone(state);
    const preview = getCareerOfferResponsePreview(state, offer.id, response, context());
    expect(preview.allowed).toBe(true);
    expect(state).toEqual(before);
    const result = respondToCareerOffer(state, offer.id, response, context())!;
    expect(preview.gameDelta).toEqual(result.gameDelta);
    expect(preview.careerDelta).toEqual(result.careerDelta);
    expect(preview.exposureDelta).toBeCloseTo(result.state.exposure - state.exposure);
    expect(preview.termsAfter).toEqual(result.offer.terms);
    expect(preview.deadlineWeek).toBe(result.offer.deadlineWeek);
  });

  it.each([['accept', 'double-agent', 4], ['accept', 'secret-retainer', 4], ['turn', 'official-appointment', 3]] as const)(
    'requires exact political power before %s %s', (response, kind, cost) => {
      const { offer, state } = offerFixture(context(), { kind });
      const poor = { ...context(), game: { ...context().game, politicalPower: cost - 0.01 } };
      expect(getCareerOfferResponsePreview(state, offer.id, response, poor)).toMatchObject({ allowed: false, politicalPowerCost: cost });
      expect(respondToCareerOffer(state, offer.id, response, poor)).toBeNull();
      const exact = { ...poor, game: { ...poor.game, politicalPower: cost } };
      expect(respondToCareerOffer(state, offer.id, response, exact)?.gameDelta.politicalPower).toBe(-cost);
    },
  );

  it('does not invent a retainer or random acceptance roll for formal offers, including legacy terms', () => {
    for (const kind of ['official-appointment', 'asylum-and-post', 'government-in-exile'] as const) {
      const base = offerFixture();
      const { offer, state } = offerFixture(context(), { kind, terms: { ...base.offer.terms, weeklyRetainer: 77 } });
      const preview = getCareerOfferResponsePreview(state, offer.id, 'accept', context());
      expect(preview.transfer?.nationId).toBe(offer.sourceNationId);
      expect(preview.weeklyRetainer).toBe(0);
      expect(preview.summary.join(' ')).toContain('추가 확률 판정이 없습니다');
      expect(preview.summary.join(' ')).toContain('정기 비밀수당은 지급되지 않습니다');
      expect(respondToCareerOffer(state, offer.id, 'accept', context())?.state.clandestine).toBeNull();
    }
  });

  it('describes turn as a contact-network result, without promising a non-existent secret career', () => {
    const { offer, state } = offerFixture();
    const preview = getCareerOfferResponsePreview(state, offer.id, 'turn', context());
    const result = respondToCareerOffer(state, offer.id, 'turn', context())!;
    expect(preview.summary.join(' ')).toContain('장기 공작 임무는 생성되지 않습니다');
    expect(result.state.clandestine).toBeNull();
    expect(result.gameDelta).toEqual({ intelNetwork: 11, commandPoints: 5, politicalPower: -3 });
    expect(result.title).toBe('포섭 연락망 역이용');
  });

  it.each(approaches)('requires PP2 and explains paid failure, trust, exposure and global cooldown for %s', (kind) => {
    const state = createCareerMarketState();
    const poor = { ...context(), game: { ...context().game, politicalPower: 1.999 } };
    expect(getCareerApproachEligibility(state, 'usa', kind, poor).allowed).toBe(false);
    const invalid = initiateCareerApproach(state, 'usa', kind, poor);
    expect(invalid.state).toBe(state);
    expect(invalid.gameDelta).toEqual({});
    const exact = { ...poor, game: { ...poor.game, politicalPower: 2 } };
    const preview = getCareerApproachPreview(state, 'usa', kind, exact);
    const result = initiateCareerApproach(state, 'usa', kind, exact);
    expect(preview.allowed).toBe(true);
    expect(result.gameDelta.politicalPower).toBe(-2);
    expect(result.careerTrustDelta).toBe(preview.trustDelta);
    expect(result.state.exposure - state.exposure).toBe(preview.exposureDelta);
    expect(result.state.history[0].outcome).toBe(result.success ? 'pending' : 'approach-failed');
    expect(getCareerApproachPreview(result.state, 'germany', 'appeal', { ...exact, week: 27 }).allowed).toBe(false);
    expect(getCareerApproachPreview(result.state, 'germany', 'appeal', { ...exact, week: 28 }).allowed).toBe(true);
    expect(result).toEqual(initiateCareerApproach(state, 'usa', kind, exact));
    expect(state.lastApproachWeek).toBe(-52);
  });

  it.each(nations.map((nation) => nation.id))('maintains all five voluntary approach routes for %s', (nationId) => {
    const role = careerRoles.find((entry) => entry.nationId === nationId && entry.tier === 2)!;
    const current: CareerMarketContext = { ...context(), role, career: { ...createCareerState(nationId, role.id), reputation: 76 } };
    const foreign = nationId === 'usa' ? 'britain' : 'usa';
    for (const kind of approaches) {
      const state = createCareerMarketState();
      const preview = getCareerApproachPreview(state, foreign, kind, current);
      expect(preview.allowed, `${nationId}/${kind}`).toBe(true);
      expect(Number.isInteger(preview.successChance)).toBe(true);
      expect(preview.successChance).toBeGreaterThanOrEqual(8);
      expect(preview.successChance).toBeLessThanOrEqual(88);
      const result = initiateCareerApproach(state, foreign, kind, current);
      expect(result.state.lastApproachWeek).toBe(26);
      expect(result.gameDelta.politicalPower).toBe(-2);
      expect(result.state.history).toHaveLength(1);
      if (result.offer) expect(result.offer.sourceNationId).toBe(foreign);
    }
  });

  it('keeps initial-week and highest-office voluntary contacts available while gating incoming offers', () => {
    const current = context('britain-tier1', 0);
    for (const kind of approaches) expect(getCareerApproachEligibility(createCareerMarketState(), 'usa', kind, current).allowed).toBe(true);
    expect(evaluateForeignCareerOffers(createCareerMarketState(), current, true).newOffers).toHaveLength(0);
  });

  it.each([NaN, Infinity, -Infinity])('rejects non-finite values %s before applying a response or approach', (value) => {
    const { offer, state } = offerFixture();
    for (const current of [
      { ...context(), week: value },
      { ...context(), game: { ...context().game, politicalPower: value } },
      { ...context(), career: { ...context().career, reputation: value } },
    ]) {
      expect(respondToCareerOffer(state, offer.id, 'accept', current)).toBeNull();
      expect(initiateCareerApproach(state, 'usa', 'apply', current).state).toBe(state);
    }
    const badOffer = { ...offer, terms: { ...offer.terms, signingBonus: value } };
    expect(respondToCareerOffer({ ...state, offers: [badOffer] }, offer.id, 'accept', context())).toBeNull();
    const badState = { ...state, exposure: value };
    expect(initiateCareerApproach(badState, 'usa', 'apply', context()).state).toBe(badState);
  });

  it('blocks stale role identity, unknown or duplicate targets and busy progression without consuming an action', () => {
    const { offer, state } = offerFixture();
    const wrongRole = { ...context(), career: { ...context().career, roleId: 'britain-tier1' } };
    const busy = { ...context(), busy: true };
    for (const current of [wrongRole, busy]) {
      for (const response of responses) expect(respondToCareerOffer(state, offer.id, response, current)).toBeNull();
      expect(initiateCareerApproach(state, 'usa', 'apply', current).state).toBe(state);
    }
    expect(initiateCareerApproach(state, 'unknown' as NationId, 'apply', context()).state).toBe(state);
    expect(respondToCareerOffer({ ...state, offers: [offer, offer] }, offer.id, 'accept', context())).toBeNull();
    expect(respondToCareerOffer({ ...state, offers: [{ ...offer, targetRoleId: 'not-a-real-office' }] }, offer.id, 'accept', context())).toBeNull();
    expect(respondToCareerOffer(state, offer.id, 'accept', { ...context(), week: offer.receivedWeek - 1 })).toBeNull();
  });

  it('caps recorded exposure deltas rather than promising points beyond 100', () => {
    const state = { ...createCareerMarketState(), exposure: 99 };
    const preview = getCareerApproachPreview(state, 'usa', 'offer-secrets', context());
    expect(preview.exposureDelta).toBe(1);
    expect(initiateCareerApproach(state, 'usa', 'offer-secrets', context()).state.exposure).toBe(100);
  });

  it.each(['dismissed', 'unattached'] as const)('prevents a %s player from reporting to a non-existent employer', (affiliationStatus) => {
    const fixture = offerFixture();
    const state = { ...fixture.state, affiliationStatus };
    expect(getCareerOfferResponseEligibility(state, fixture.offer.id, 'report', context()).reason).toContain('보고할 현 소속이 없습니다');
    expect(respondToCareerOffer(state, fixture.offer.id, 'report', context())).toBeNull();
    expect(respondToCareerOffer(state, fixture.offer.id, 'reject', context())).not.toBeNull();
    expect(respondToCareerOffer(state, fixture.offer.id, 'accept', context())).not.toBeNull();
  });

  it('uses one-based weeks in guidance while retaining zero-based engine deadlines', () => {
    const current = context('britain-tier2', 0);
    const { state, offer } = offerFixture(current, { deadlineWeek: 3 });
    const deferred = respondToCareerOffer(state, offer.id, 'defer', current)!;
    expect(deferred.detail).toContain('제4주까지');
    expect(deferred.detail).toContain('제5주부터 만료');
    const preview = getCareerApproachPreview(state, 'usa', 'appeal', current);
    expect(preview.nextApproachWeek).toBe(2);
    expect(preview.summary.join(' ')).toContain('다음 접촉 제3주');
    const contacted = initiateCareerApproach(state, 'usa', 'appeal', current);
    expect(getCareerApproachEligibility(contacted.state, 'germany', 'apply', { ...current, week: 1 }).reason).toContain('제3주부터');
    expect(getCareerOfferResponseEligibility(state, offer.id, 'accept', { ...current, week: 4 }).reason).toContain('제4주 마감');
  });

  it('warns that accepting a second secret contract replaces, rather than combines, its handler and mission state', () => {
    const { state: base, offer } = offerFixture(context(), { kind: 'secret-retainer' });
    const clandestine = createClandestineCareerState({ homeNationId: 'britain', handlerNationId: 'usa', week: 20,
      role: context().role, handlerTrust: 80, coverStrength: 80, weeklyRetainer: 20 });
    const state = { ...base, clandestine, affiliationStatus: 'double-agent' as const, handlerNationId: 'usa' as const };
    const preview = getCareerOfferResponsePreview(state, offer.id, 'accept', context());
    expect(preview.summary.join(' ')).toContain('기존 비밀 경력의 연락관·임무·작전 자금은 새 계약으로 교체됩니다');
    const result = respondToCareerOffer(state, offer.id, 'accept', context())!;
    expect(result.state.clandestine).not.toBe(clandestine);
    expect(result.state.handlerNationId).toBe(offer.sourceNationId);
    expect(result.state.clandestine?.handlerNationId).toBe(offer.sourceNationId);
    expect(state.clandestine).toBe(clandestine);
  });

  it('rejects negative resources and out-of-range contact metrics instead of creating invalid results', () => {
    const { state, offer } = offerFixture();
    const invalidGame = { ...context(), game: { ...context().game, treasury: -1 } };
    expect(respondToCareerOffer(state, offer.id, 'accept', invalidGame)).toBeNull();
    expect(initiateCareerApproach(state, 'usa', 'apply', invalidGame).state).toBe(state);
    for (const exposure of [-1, 101]) {
      const invalid = { ...state, exposure };
      expect(respondToCareerOffer(invalid, offer.id, 'explore', context())).toBeNull();
      expect(initiateCareerApproach(invalid, 'usa', 'apply', context()).state).toBe(invalid);
    }
  });

  it('does not overflow the safe contract or deadline range through negotiation', () => {
    const fixture = offerFixture();
    for (const override of [
      { terms: { ...fixture.offer.terms, signingBonus: Number.MAX_SAFE_INTEGER } },
      { deadlineWeek: Number.MAX_SAFE_INTEGER },
    ]) {
      const { offer, state } = offerFixture(context(), override);
      const before = structuredClone(state);
      expect(getCareerOfferResponsePreview(state, offer.id, 'negotiate', context()).allowed).toBe(false);
      expect(respondToCareerOffer(state, offer.id, 'negotiate', context())).toBeNull();
      expect(state).toEqual(before);
    }
  });

  it.each(nations.map((nation) => nation.id))('allows exact civilian profession roles from %s to approach and answer offers', (nationId) => {
    const foreignNationId = nationId === 'usa' ? 'britain' : 'usa';
    for (const profession of civilianProfessions) {
      const roleId = getCivilianRoleId(nationId, profession.id);
      const role = getRole(roleId, nationId);
      const current: CareerMarketContext = {
        ...context(), role,
        career: { ...createCareerState(nationId, roleId), civilian: createCivilianCareerState(profession.id, 'university-network') },
      };
      expect(role.id).toBe(roleId);
      const { offer, state } = offerFixture(current);
      for (const kind of approaches) {
        expect(getCareerApproachPreview(state, foreignNationId, kind, current).allowed, `${roleId}/${kind}`).toBe(true);
        const result = initiateCareerApproach(state, foreignNationId, kind, current);
        expect(result.state.lastApproachWeek).toBe(current.week);
        expect(result.gameDelta.politicalPower).toBe(-2);
      }
      for (const response of ['explore', 'negotiate', 'accept', 'reject'] as const) {
        expect(getCareerOfferResponsePreview(state, offer.id, response, current).allowed, `${roleId}/${response}`).toBe(true);
        expect(respondToCareerOffer(state, offer.id, response, current)).not.toBeNull();
      }
    }
  });

  it('does not turn an unknown or cross-nation civilian ID into a valid office via getRole fallback', () => {
    const { offer, state } = offerFixture();
    const knownRoleId = getCivilianRoleId('britain', 'scientist');
    const validRole = getRole(knownRoleId, 'britain');
    const validCareer = createCareerState('britain', knownRoleId);
    const cases: CareerMarketContext[] = [
      { ...context(), role: getRole('civilian-britain-fictional', 'britain'), career: { ...validCareer, roleId: 'civilian-britain-fictional' } },
      { ...context(), role: { ...validRole, id: 'civilian-britain-fictional' }, career: { ...validCareer, roleId: 'civilian-britain-fictional' } },
      { ...context(), role: getRole('civilian-usa-scientist', 'usa'), career: { ...validCareer, roleId: 'civilian-usa-scientist' } },
      { ...context(), role: { ...validRole, id: 'civilian-unknown-scientist', nationId: 'unknown' as NationId },
        career: { ...validCareer, roleId: 'civilian-unknown-scientist', nationId: 'unknown' as NationId } },
      { ...context(), role: { ...validRole, tier: 1 }, career: validCareer },
      { ...context(), role: { ...validRole, branch: 'military' }, career: validCareer },
    ];
    for (const current of cases) {
      expect(getCareerApproachEligibility(state, 'usa', 'apply', current).allowed).toBe(false);
      expect(initiateCareerApproach(state, 'usa', 'apply', current).state).toBe(state);
      expect(respondToCareerOffer(state, offer.id, 'accept', current)).toBeNull();
    }
  });
});
