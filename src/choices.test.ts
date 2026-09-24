import { describe, expect, it } from 'vitest';
import { councilEvents, getEligibleCouncilEvents, policyDomains, strategicPolicies } from './choices';
import { nations } from './campaign';
import { wartimeCouncilEvents, wartimeCouncilEventCoverage } from './wartimeCouncilEvents';

describe('systemic alternate-history policies', () => {
  it('offers three mutually exclusive strategies in every national domain', () => {
    expect(policyDomains).toHaveLength(4);
    expect(strategicPolicies).toHaveLength(12);
    expect(new Set(strategicPolicies.map((policy) => policy.id)).size).toBe(12);
    policyDomains.forEach((domain) => {
      expect(strategicPolicies.filter((policy) => policy.domain === domain.id)).toHaveLength(3);
    });
  });

  it('connects every policy to an immediate or recurring simulation effect', () => {
    strategicPolicies.forEach((policy) => {
      const hasRecurringEffect = Boolean(policy.attackBonus || policy.defenseBonus || policy.supplyRecovery || policy.productionMultiplier);
      expect(Object.keys(policy.gameDelta).length > 0 || hasRecurringEffect, policy.id).toBe(true);
      expect(policy.effect.length).toBeGreaterThan(3);
    });
  });
});

describe('council choice and consequence events', () => {
  it('provides recurring crises plus three researched 1940s crises for every playable nation', () => {
    expect(councilEvents).toHaveLength(45);
    const choices = councilEvents.flatMap((event) => event.choices);
    expect(choices).toHaveLength(135);
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(135);
    councilEvents.forEach((event) => expect(event.choices).toHaveLength(3));
    const historicalEvents = councilEvents.filter((event) => event.historicalBasis);
    expect(historicalEvents).toHaveLength(39);
    expect(new Set(historicalEvents.flatMap((event) => event.nationIds ?? [])).size).toBe(13);
    historicalEvents.forEach((event) => {
      expect(event.historicalYear).toBeGreaterThanOrEqual(1940);
      expect(event.historicalYear).toBeLessThanOrEqual(1949);
      expect(event.sourceUrl).toMatch(/^https:\/\//);
    });
    expect(wartimeCouncilEvents).toHaveLength(26);
    nations.forEach((nation) => expect(wartimeCouncilEventCoverage[nation.id], nation.id).toBe(2));
  });

  it('unlocks national events chronologically instead of exposing the whole decade in 1942', () => {
    const korea1942 = getEligibleCouncilEvents('korea', 'politics', 1942).filter((event) => event.nationIds?.includes('korea'));
    expect(korea1942.map((event) => event.historicalYear)).toEqual([1940, 1942]);
    expect(korea1942.some((event) => event.id === 'wartime-korea-liberation-transition')).toBe(false);
    const korea1945 = getEligibleCouncilEvents('korea', 'politics', 1945).filter((event) => event.nationIds?.includes('korea'));
    expect(korea1945.map((event) => event.historicalYear)).toEqual([1940, 1942, 1945]);
  });

  it('gives every decision a visible outcome and at least one state consequence', () => {
    councilEvents.flatMap((event) => event.choices).forEach((choice) => {
      expect(choice.result.length).toBeGreaterThan(8);
      expect(Object.keys(choice.effect).length).toBeGreaterThan(0);
    });
  });
});
