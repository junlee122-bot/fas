import { describe, expect, it } from 'vitest';
import { createCareerState, getRole } from './campaign';
import {
  createCareerMarketState,
  evaluateForeignCareerOffers,
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
});
