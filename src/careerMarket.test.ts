import { describe, expect, it } from 'vitest';
import { careerRoles, createCareerState, getRole } from './campaign';
import { advanceClandestineCareerWeek, createClandestineCareerState } from './clandestineCareer';
import {
  createCareerMarketState,
  evaluateForeignCareerOffers,
  getCareerRecruitmentReadiness,
  initiateCareerApproach,
  markCareerDismissed,
  respondToCareerOffer,
} from './careerMarket';
import type { CareerMarketContext } from './careerMarket';

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
