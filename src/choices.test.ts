import { describe, expect, it } from 'vitest';
import { councilEvents, policyDomains, strategicPolicies } from './choices';

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
  it('provides eighteen distinct decisions across six recurring crises', () => {
    expect(councilEvents).toHaveLength(6);
    const choices = councilEvents.flatMap((event) => event.choices);
    expect(choices).toHaveLength(18);
    expect(new Set(choices.map((choice) => choice.id)).size).toBe(18);
    councilEvents.forEach((event) => expect(event.choices).toHaveLength(3));
  });

  it('gives every decision a visible outcome and at least one state consequence', () => {
    councilEvents.flatMap((event) => event.choices).forEach((choice) => {
      expect(choice.result.length).toBeGreaterThan(8);
      expect(Object.keys(choice.effect).length).toBeGreaterThan(0);
    });
  });
});
